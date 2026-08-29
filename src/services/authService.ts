import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth,
  User as FirebaseUser,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { AppUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Converts a Student ID / Admission Number to the internal Firebase Auth login identifier.
 * Students authenticate with their school-issued Student ID / Admission Number and password.
 * No external email inboxes are claimed or created for students.
 */
export function formatStudentAuthIdentifier(identifier?: string | null): string {
  const trimmed = (identifier || '').trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Internal institutional auth identity pattern
  const sanitized = trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return sanitized ? `${sanitized}@student.stxavier.internal` : '';
}

import { generateInitialStudentPassword as generateDobPassword } from '../utils/dateUtils';

/**
 * Authoritative temporary initial password generation from Date of Birth.
 * Format: DDMMYY (e.g. DOB 03/02/2015 -> 030215).
 * No prefix, suffix, separators, or letters.
 */
export function generateInitialStudentPassword(dateOfBirth: string): string {
  return generateDobPassword(dateOfBirth);
}

/**
 * Deterministically resolves a student's Admission Number or Student ID
 * to their single authoritative internal Firebase Authentication email.
 * e.g., 'ADM-2026-001' or 'STX-2026-ADM-2026-001' -> 'stx-2026-adm-2026-001@student.stxavier.internal'
 */
export function resolveStudentAuthEmail(inputIdentifier?: string | null): string {
  const trimmed = (inputIdentifier || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  // If already full Student ID format (starts with STX-)
  if (trimmed.toUpperCase().startsWith('STX-')) {
    return formatStudentAuthIdentifier(trimmed);
  }

  // Derive the canonical Student ID: STX-{year}-{admissionNumber}
  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  const currentYear = new Date().getFullYear().toString();
  const year = yearMatch ? yearMatch[1] : currentYear;
  const canonicalStudentId = `STX-${year}-${trimmed.toUpperCase().replace(/[^A-Z0-9_-]/g, '')}`;
  return formatStudentAuthIdentifier(canonicalStudentId);
}

export const authService = {
  /**
   * Directly provisions a student Firebase Authentication account using an isolated secondary Firebase App instance.
   * This guarantees that the logged-in administrator's active session is never disrupted.
   */
  provisionStudentAuthDirect: async (params: {
    studentId: string;
    admissionNumber: string;
    dateOfBirth: string;
    studentName: string;
  }): Promise<{ success: boolean; uid: string; message: string; timestamp: string }> => {
    const internalEmail = formatStudentAuthIdentifier(params.studentId || params.admissionNumber);
    if (!internalEmail) {
      throw new Error('Failed to derive internal student authentication identifier.');
    }
    const tempPassword = generateInitialStudentPassword(params.dateOfBirth);

    const tempAppName = `student-provision-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let tempApp: ReturnType<typeof initializeApp> | null = null;

    try {
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, internalEmail, tempPassword);
      const uid = userCredential.user.uid;

      if (!uid) {
        throw new Error('Firebase Authentication creation succeeded but did not return a valid Auth UID.');
      }

      await signOut(tempAuth);

      // Attempt to initialize /users/{uid} user profile record in Firestore
      const now = new Date().toISOString();
      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(
          userDocRef,
          {
            uid,
            role: 'student',
            studentId: params.studentId,
            admissionNumber: params.admissionNumber,
            displayName: params.studentName,
            email: internalEmail,
            active: true,
            mustChangePassword: true,
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (userDocErr) {
        console.warn('Could not write user profile document directly from client:', userDocErr);
      }

      // If student document already exists in Firestore, link authUid
      if (params.studentId) {
        try {
          const studentDocRef = doc(db, 'students', params.studentId);
          const studentSnap = await getDoc(studentDocRef);
          if (studentSnap.exists()) {
            await updateDoc(studentDocRef, {
              authUid: uid,
              updatedAt: now,
            });
          }
        } catch (studentDocErr) {
          console.warn('Could not update student doc with authUid:', studentDocErr);
        }
      }

      return {
        success: true,
        uid,
        message: `Authentication account provisioned successfully for student ${params.admissionNumber}.`,
        timestamp: now,
      };
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(
          `Authentication account for student ${params.admissionNumber} (${internalEmail}) already exists in Firebase Auth.`
        );
      }
      throw new Error(err.message || 'Failed to provision student Firebase Authentication account.');
    } finally {
      if (tempApp) {
        await deleteApp(tempApp).catch(() => {});
      }
    }
  },

  /**
   * Safely deletes/rolls back a provisioned Auth user in the event that subsequent Firestore creation fails.
   */
  rollbackStudentAuthDirect: async (
    identifier: string,
    dateOfBirth: string
  ): Promise<void> => {
    const internalEmail = formatStudentAuthIdentifier(identifier);
    if (!internalEmail) return;
    const tempPassword = generateInitialStudentPassword(dateOfBirth);
    const tempAppName = `student-rollback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let tempApp: ReturnType<typeof initializeApp> | null = null;
    try {
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      const cred = await signInWithEmailAndPassword(tempAuth, internalEmail, tempPassword);
      await cred.user.delete();
      console.info(`Rolled back orphan Firebase Auth user (${internalEmail}) after Firestore creation failure.`);
    } catch (rollbackErr: any) {
      console.warn('Could not roll back created Auth user:', rollbackErr?.message);
    } finally {
      if (tempApp) {
        await deleteApp(tempApp).catch(() => {});
      }
    }
  },

  /**
   * Signs in user (staff or admin with email, or direct internal auth identifier)
   */
  login: async (loginIdentifier: string, password: string): Promise<FirebaseUser> => {
    const credential = await signInWithEmailAndPassword(auth, loginIdentifier.trim(), password);
    return credential.user;
  },

  /**
   * Authenticates a student using their single authoritative authentication identity
   * and single entered password (DOB-derived temporary format STX@YYYYMMDD or permanent).
   * Strictly performs ONE Firebase Auth sign-in request without brute-forcing or retry guessing.
   */
  loginStudent: async (
    loginIdentifier: string,
    password: string
  ): Promise<{ user: FirebaseUser; profile: AppUser }> => {
    const authEmail = resolveStudentAuthEmail(loginIdentifier);
    const cleanPassword = (password || '').trim();

    if (!authEmail) {
      throw new Error('Please enter a valid Student ID or Admission Number.');
    }
    if (!cleanPassword) {
      throw new Error('Please enter your student portal password.');
    }

    // 1. Single authenticating call with exact resolved identity and single entered password
    const credential = await signInWithEmailAndPassword(auth, authEmail, cleanPassword);
    const authUser = credential.user;

    // 2. Fetch student authorization record from /users/{uid}
    const profile = await authService.getUserProfile(authUser.uid);
    if (!profile) {
      const err: any = new Error('Student authorization record not found in institutional database.');
      err.code = 'custom/profile-not-found';
      err.userUid = authUser.uid;
      throw err;
    }

    // 3. Verify role is 'student' and account is active
    if (profile.role !== 'student' || profile.active !== true) {
      await authService.logout();
      const err: any = new Error(
        !profile.active
          ? 'This student account is currently deactivated. Please contact the school administration office.'
          : 'Invalid account role for student portal access.'
      );
      err.code = !profile.active ? 'auth/user-disabled' : 'auth/invalid-role';
      throw err;
    }

    return { user: authUser, profile };
  },

  /**
   * Fetches the user authorization profile from /users/{uid}
   */
  getUserProfile: async (uid: string): Promise<AppUser | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return {
          uid,
          ...(snap.data() as Omit<AppUser, 'uid'>),
        };
      }
      return null;
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      return null;
    }
  },

  /**
   * Fetches all administrative / staff users (role != student)
   */
  getStaffUsers: async (): Promise<AppUser[]> => {
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const staffList: AppUser[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<AppUser, 'uid'>;
        if (data.role && data.role !== 'student') {
          staffList.push({
            uid: d.id,
            ...data,
          });
        }
      });
      return staffList;
    } catch (error) {
      console.warn('Error fetching staff list:', error);
      return [];
    }
  },

  /**
   * Updates isPasswordAdmin status for an existing staff member (Super Admin only).
   */
  setStaffPasswordAdminStatus: async (uid: string, isPasswordAdmin: boolean): Promise<void> => {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        isPasswordAdmin,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating staff password admin status:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  /**
   * Updates user password using Firebase Auth API.
   * NOTE: Passwords are NEVER written to Firestore.
   */
  updateUserPassword: async (newPassword: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user session found.');
    }
    await updatePassword(auth.currentUser, newPassword);
  },

  /**
   * Marks mustChangePassword as false after first password change.
   * Allowed by security rules for the authenticated user on their own doc.
   */
  clearMustChangePasswordFlag: async (uid: string): Promise<void> => {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error clearing mustChangePassword flag:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  /**
   * Signs out the current user session
   */
  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  /**
   * Subscribes to auth state changes
   */
  subscribeAuthState: (
    callback: (user: FirebaseUser | null) => void
  ): (() => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

