import { Handler } from '@netlify/functions';
import {
  getAdminAuth,
  getAdminDb,
  formatStudentAuthIdentifier,
  generateInitialStudentPassword,
} from './utils/firebaseAdmin';
import { authenticateRequest, jsonResponse } from './utils/authMiddleware';

export const handler: Handler = async (event) => {
  // Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Authenticate caller & verify authorization (Super Admin or Staff)
  const authResult = await authenticateRequest(event, ['super_admin', 'staff']);
  if (!authResult.isAuthenticated || !authResult.user) {
    return jsonResponse(authResult.statusCode || 401, {
      error: authResult.error || 'Unauthorized',
    });
  }

  // 2. Parse & validate request payload
  let payload: {
    studentId?: string;
    admissionNumber?: string;
    dateOfBirth?: string;
    studentName?: string;
  };

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const { studentId, admissionNumber, dateOfBirth, studentName } = payload;

  if (!studentId || !studentId.trim()) {
    return jsonResponse(400, { error: 'studentId is required.' });
  }
  if (!admissionNumber || !admissionNumber.trim()) {
    return jsonResponse(400, { error: 'admissionNumber is required.' });
  }
  if (!dateOfBirth || !dateOfBirth.trim()) {
    return jsonResponse(400, { error: 'dateOfBirth is required for initial temporary credentials.' });
  }

  const cleanStudentId = studentId.trim();
  const cleanAdmissionNo = admissionNumber.trim().toUpperCase();
  const cleanStudentName = studentName ? studentName.trim() : `Student ${cleanAdmissionNo}`;

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    // 3. Check if student master document exists in Firestore /students/{studentId}
    const studentDocRef = db.collection('students').doc(cleanStudentId);
    const studentDoc = await studentDocRef.get();
    const studentExists = studentDoc.exists;
    const studentData = studentExists ? studentDoc.data() || {} : {};

    // Check if an Auth UID is already linked and active
    if (studentData.authUid) {
      try {
        const existingAuthUser = await auth.getUser(studentData.authUid);
        if (existingAuthUser) {
          return jsonResponse(200, {
            success: true,
            message: 'Student authentication account is already provisioned.',
            uid: existingAuthUser.uid,
            studentId: cleanStudentId,
            alreadyExists: true,
          });
        }
      } catch (err: any) {
        if (err.code !== 'auth/user-not-found') {
          console.warn('Checking existing authUid failed:', err.message);
        }
      }
    }

    // 4. Generate internal Firebase email identifier & initial temporary password
    const internalEmail = formatStudentAuthIdentifier(cleanStudentId);
    const temporaryPassword = generateInitialStudentPassword(dateOfBirth);

    // 5. Create Firebase Authentication Account safely on server
    let createdUser;
    try {
      createdUser = await auth.createUser({
        email: internalEmail,
        password: temporaryPassword,
        displayName: cleanStudentName,
        disabled: false,
      });
    } catch (createErr: any) {
      if (createErr.code === 'auth/email-already-exists') {
        // User already exists in Auth; fetch existing UID
        createdUser = await auth.getUserByEmail(internalEmail);
      } else {
        throw createErr;
      }
    }

    const uid = createdUser.uid;

    // 6. Set Firebase Custom Claims for instant token-based authorization
    await auth.setCustomUserClaims(uid, {
      role: 'student',
      studentId: cleanStudentId,
      admissionNumber: cleanAdmissionNo,
    });

    // 7. Atomic transaction / batch to create /users/{uid} and optionally update /students/{studentId}
    const now = new Date().toISOString();
    const batch = db.batch();

    const userDocRef = db.collection('users').doc(uid);
    batch.set(
      userDocRef,
      {
        uid,
        role: 'student',
        studentId: cleanStudentId,
        admissionNumber: cleanAdmissionNo,
        displayName: cleanStudentName,
        active: true,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    if (studentExists) {
      batch.update(studentDocRef, {
        authUid: uid,
        updatedAt: now,
      });
    }

    try {
      await batch.commit();
    } catch (batchErr: any) {
      // Rollback safety: if Firestore transaction fails, attempt to delete the created Auth user
      console.error('Firestore batch commit failed. Rolling back Auth user:', batchErr.message);
      try {
        await auth.deleteUser(uid);
      } catch (rollbackErr: any) {
        console.error('Failed to rollback Auth user:', rollbackErr.message);
      }
      throw new Error(`Failed to initialize authorization profile in Firestore: ${batchErr.message}`);
    }

    // 8. Return safe confirmation to frontend (never expose password unless needed)
    return jsonResponse(201, {
      success: true,
      message: `Authentication account provisioned successfully for student ${cleanAdmissionNo}.`,
      uid,
      studentId: cleanStudentId,
      mustChangePassword: true,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Student provisioning error:', err);
    return jsonResponse(500, {
      error: `Failed to provision student authentication: ${err.message}`,
    });
  }
};
