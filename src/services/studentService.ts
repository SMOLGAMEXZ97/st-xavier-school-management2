import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student } from '../types';

const STUDENTS_COLLECTION = 'students';

/**
 * Generates a standard institutional student ID if not explicitly specified.
 * Format: STX-YYYY-ADMISSIONNO (e.g., STX-2026-ADM012)
 */
export function generateStudentId(admissionNumber?: string | null, academicYear?: string | null): string {
  const cleanYear = (academicYear || '').split('-')[0]?.trim() || new Date().getFullYear().toString();
  const cleanAdm = (admissionNumber || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || 'ADM';
  return `STX-${cleanYear}-${cleanAdm}`;
}

export const studentService = {
  generateStudentId,

  /**
   * Fetches a student master record by document ID (studentId)
   */
  getStudentById: async (studentId?: string | null): Promise<Student | null> => {
    const cleanId = (studentId || '').trim();
    if (!cleanId) return null;
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return {
          id: snap.id,
          ...(snap.data() as Omit<Student, 'id'>),
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${STUDENTS_COLLECTION}/${cleanId}`);
    }
  },

  /**
   * Fetches student record by Admission Number (Institutional Unique Key)
   */
  getStudentByAdmissionNumber: async (admissionNumber?: string | null): Promise<Student | null> => {
    const cleanAdm = (admissionNumber || '').trim().toUpperCase();
    if (!cleanAdm) return null;
    try {
      const colRef = collection(db, STUDENTS_COLLECTION);
      const q = query(
        colRef,
        where('admissionNumber', '==', cleanAdm),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<Student, 'id'>),
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  },

  /**
   * Fetches student record linked to a Firebase Auth UID
   */
  getStudentByAuthUid: async (authUid?: string | null): Promise<Student | null> => {
    const cleanUid = (authUid || '').trim();
    if (!cleanUid) return null;
    try {
      const colRef = collection(db, STUDENTS_COLLECTION);
      const q = query(colRef, where('authUid', '==', cleanUid), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<Student, 'id'>),
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  },

  /**
   * Fetches all student records (Restricted by security rules to staff & super_admin)
   */
  getAllStudents: async (): Promise<Student[]> => {
    try {
      const colRef = collection(db, STUDENTS_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => {
        const data = d.data() as Omit<Student, 'id'>;
        return {
          id: d.id,
          studentId: data.studentId || d.id,
          ...data,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  },

  /**
   * Checks if an admission number already exists in Firestore
   */
  checkAdmissionNumberExists: async (
    admissionNumber?: string | null,
    excludeStudentId?: string | null
  ): Promise<boolean> => {
    const cleanAdm = (admissionNumber || '').trim().toUpperCase();
    if (!cleanAdm) return false;
    try {
      const colRef = collection(db, STUDENTS_COLLECTION);
      const q = query(
        colRef,
        where('admissionNumber', '==', cleanAdm),
        limit(5)
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;

      // If an excludeStudentId is provided (e.g. during edit), check if matching docs are others
      if (excludeStudentId && excludeStudentId.trim()) {
        const cleanExclude = excludeStudentId.trim();
        return snap.docs.some((d) => d.id !== cleanExclude && d.data()?.studentId !== cleanExclude);
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  },

  /**
   * Creates a new Student record in Firestore.
   * Enforces Admission Number uniqueness and validates required fields.
   */
  createStudent: async (
    studentData: Omit<Student, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>,
    customStudentId?: string | null
  ): Promise<Student> => {
    // 1. Mandatory field validation
    const cleanAdm = (studentData.admissionNumber || '').trim().toUpperCase();
    if (!cleanAdm) {
      throw new Error('Admission Number is required.');
    }

    const cleanFirstName = (studentData.firstName || '').trim();
    if (!cleanFirstName) {
      throw new Error('First Name is required.');
    }

    const cleanLastName = (studentData.lastName || '').trim();
    if (!cleanLastName) {
      throw new Error('Last Name is required.');
    }

    const cleanDob = (studentData.dateOfBirth || '').trim();
    if (!cleanDob) {
      throw new Error('Date of Birth is required.');
    }

    const cleanRoll = (studentData.rollNumber || '').trim();
    if (!cleanRoll) {
      throw new Error('Roll Number is required.');
    }

    const cleanGuardianName = (studentData.guardianName || '').trim();
    if (!cleanGuardianName) {
      throw new Error('Guardian Name is required.');
    }

    const cleanGuardianPhone = (studentData.guardianPhone || '').trim();
    if (!cleanGuardianPhone) {
      throw new Error('Guardian Phone Number is required.');
    }

    const cleanAddress = (studentData.address || '').trim();
    if (!cleanAddress) {
      throw new Error('Residential Address is required.');
    }

    // 2. Validate required Firebase Auth UID
    const cleanAuthUid = (studentData.authUid || '').trim();
    if (!cleanAuthUid) {
      throw new Error(
        'Student enrollment requires a valid Firebase Auth UID (authUid). Authentication must be provisioned before creating the student record in Firestore.'
      );
    }

    // 3. Check Admission Number uniqueness
    const exists = await studentService.checkAdmissionNumberExists(cleanAdm);
    if (exists) {
      throw new Error(`Admission Number "${cleanAdm}" is already assigned to an existing student.`);
    }

    const cleanAcademicYear = (studentData.academicYear || '2026-2027').trim();
    const docId = (customStudentId && customStudentId.trim())
      ? customStudentId.trim()
      : generateStudentId(cleanAdm, cleanAcademicYear);

    const now = new Date().toISOString();
    const cleanGender = studentData.gender || 'Male';
    const cleanClassName = (studentData.className || 'Class 1').trim();
    const cleanSection = (studentData.section || 'A').trim().toUpperCase();
    const cleanAdmissionDate = (studentData.admissionDate || '').trim() || now.split('T')[0];
    const cleanGuardianRel = (studentData.guardianRelationship || 'Father').trim();
    const isActive = studentData.active !== undefined ? Boolean(studentData.active) : true;

    // Build the pristine payload for Firestore setDoc (OMIT optional keys if undefined or empty string)
    const firestorePayload: Record<string, any> = {
      studentId: docId,
      admissionNumber: cleanAdm,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      dateOfBirth: cleanDob,
      gender: cleanGender,
      className: cleanClassName,
      section: cleanSection,
      rollNumber: cleanRoll,
      academicYear: cleanAcademicYear,
      admissionDate: cleanAdmissionDate,
      guardianName: cleanGuardianName,
      guardianRelationship: cleanGuardianRel,
      guardianPhone: cleanGuardianPhone,
      address: cleanAddress,
      active: isActive,
      authUid: cleanAuthUid,
      createdAt: now,
      updatedAt: now,
    };

    // Optional fields: ONLY add if non-empty string
    const cleanGuardianEmail = (studentData.guardianEmail || '').trim();
    if (cleanGuardianEmail) {
      firestorePayload.guardianEmail = cleanGuardianEmail;
    }

    const cleanPreviousSchool = (studentData.previousSchool || '').trim();
    if (cleanPreviousSchool) {
      firestorePayload.previousSchool = cleanPreviousSchool;
    }

    // Defensive guarantee: sweep any undefined keys from firestorePayload
    for (const key of Object.keys(firestorePayload)) {
      if (firestorePayload[key] === undefined) {
        delete firestorePayload[key];
      }
    }

    try {
      const docRef = doc(db, STUDENTS_COLLECTION, docId);
      await setDoc(docRef, firestorePayload);
      return {
        id: docId,
        studentId: docId,
        admissionNumber: cleanAdm,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        dateOfBirth: cleanDob,
        gender: cleanGender,
        className: cleanClassName,
        section: cleanSection,
        rollNumber: cleanRoll,
        academicYear: cleanAcademicYear,
        admissionDate: cleanAdmissionDate,
        guardianName: cleanGuardianName,
        guardianRelationship: cleanGuardianRel,
        guardianPhone: cleanGuardianPhone,
        guardianEmail: cleanGuardianEmail || undefined,
        address: cleanAddress,
        previousSchool: cleanPreviousSchool || undefined,
        active: isActive,
        authUid: cleanAuthUid,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${STUDENTS_COLLECTION}/${docId}`);
    }
  },

  /**
   * Updates an existing student record in Firestore
   */
  updateStudent: async (
    studentId: string,
    updates: Partial<Omit<Student, 'id' | 'studentId' | 'createdAt'>>
  ): Promise<void> => {
    const docId = (studentId || '').trim();
    if (!docId) {
      throw new Error('A valid Student ID is required to update student record.');
    }

    const cleanUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // If updating admission number, ensure uniqueness
    if (updates.admissionNumber !== undefined) {
      const cleanAdm = (updates.admissionNumber || '').trim().toUpperCase();
      if (!cleanAdm) {
        throw new Error('Admission Number cannot be empty.');
      }
      const exists = await studentService.checkAdmissionNumberExists(cleanAdm, docId);
      if (exists) {
        throw new Error(`Admission Number "${cleanAdm}" is already assigned to another student.`);
      }
      cleanUpdates.admissionNumber = cleanAdm;
    }

    if (updates.firstName !== undefined) {
      const fn = (updates.firstName || '').trim();
      if (!fn) throw new Error('First Name cannot be empty.');
      cleanUpdates.firstName = fn;
    }
    if (updates.lastName !== undefined) {
      const ln = (updates.lastName || '').trim();
      if (!ln) throw new Error('Last Name cannot be empty.');
      cleanUpdates.lastName = ln;
    }
    if (updates.dateOfBirth !== undefined) {
      const dob = (updates.dateOfBirth || '').trim();
      if (!dob) throw new Error('Date of Birth cannot be empty.');
      cleanUpdates.dateOfBirth = dob;
    }
    if (updates.gender !== undefined) {
      cleanUpdates.gender = updates.gender || 'Male';
    }
    if (updates.className !== undefined) {
      cleanUpdates.className = (updates.className || 'Class 1').trim();
    }
    if (updates.section !== undefined) {
      cleanUpdates.section = (updates.section || 'A').trim().toUpperCase();
    }
    if (updates.rollNumber !== undefined) {
      const roll = (updates.rollNumber || '').trim();
      if (!roll) throw new Error('Roll Number cannot be empty.');
      cleanUpdates.rollNumber = roll;
    }
    if (updates.academicYear !== undefined) {
      cleanUpdates.academicYear = (updates.academicYear || '2026-2027').trim();
    }
    if (updates.admissionDate !== undefined) {
      cleanUpdates.admissionDate = (updates.admissionDate || '').trim();
    }
    if (updates.guardianName !== undefined) {
      const gn = (updates.guardianName || '').trim();
      if (!gn) throw new Error('Guardian Name cannot be empty.');
      cleanUpdates.guardianName = gn;
    }
    if (updates.guardianRelationship !== undefined) {
      cleanUpdates.guardianRelationship = (updates.guardianRelationship || 'Father').trim();
    }
    if (updates.guardianPhone !== undefined) {
      const gp = (updates.guardianPhone || '').trim();
      if (!gp) throw new Error('Guardian Phone cannot be empty.');
      cleanUpdates.guardianPhone = gp;
    }
    if (updates.address !== undefined) {
      const addr = (updates.address || '').trim();
      if (!addr) throw new Error('Address cannot be empty.');
      cleanUpdates.address = addr;
    }
    if (updates.active !== undefined) {
      cleanUpdates.active = Boolean(updates.active);
    }

    // Optional fields handling for update:
    // If provided with a non-empty string, update it. If provided with empty string or explicitly cleared, remove with deleteField()
    if (updates.guardianEmail !== undefined) {
      const email = (updates.guardianEmail || '').trim();
      if (email) {
        cleanUpdates.guardianEmail = email;
      } else {
        cleanUpdates.guardianEmail = deleteField();
      }
    }
    if (updates.previousSchool !== undefined) {
      const prev = (updates.previousSchool || '').trim();
      if (prev) {
        cleanUpdates.previousSchool = prev;
      } else {
        cleanUpdates.previousSchool = deleteField();
      }
    }
    if (updates.authUid !== undefined) {
      const uid = (updates.authUid || '').trim();
      if (uid) {
        cleanUpdates.authUid = uid;
      } else {
        cleanUpdates.authUid = deleteField();
      }
    }

    // Guarantee no undefined keys exist in cleanUpdates
    for (const key of Object.keys(cleanUpdates)) {
      if (cleanUpdates[key] === undefined) {
        delete cleanUpdates[key];
      }
    }

    try {
      const docRef = doc(db, STUDENTS_COLLECTION, docId);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${docId}`);
    }
  },

  /**
   * Toggles student active status in Firestore
   */
  setStudentActiveStatus: async (studentId: string, active: boolean): Promise<void> => {
    const docId = (studentId || '').trim();
    if (!docId) {
      throw new Error('A valid Student ID is required to update active status.');
    }
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, docId);
      await updateDoc(docRef, {
        active,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${docId}`);
    }
  },

  /**
   * Deletes a student record (Restricted by rules to super_admin)
   */
  deleteStudent: async (studentId: string): Promise<void> => {
    const docId = (studentId || '').trim();
    if (!docId) {
      throw new Error('A valid Student ID is required to delete record.');
    }
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COLLECTION}/${docId}`);
    }
  },
};
