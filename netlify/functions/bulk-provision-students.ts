import { Handler } from '@netlify/functions';
import {
  getAdminAuth,
  getAdminDb,
  formatStudentAuthIdentifier,
  generateInitialStudentPassword,
} from './utils/firebaseAdmin';
import { authenticateRequest, jsonResponse } from './utils/authMiddleware';

interface BulkStudentInput {
  studentId?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  className: string;
  section: string;
  rollNumber: string;
  academicYear?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  address?: string;
}

interface ValidationError {
  rowNumber: number;
  admissionNumber?: string;
  field: string;
  error: string;
}

const MAX_BULK_BATCH_SIZE = 100;
const VALID_SECTIONS = ['A', 'B', 'C', 'D'];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Authenticate caller (Super Admin or Staff)
  const authResult = await authenticateRequest(event, ['super_admin', 'staff']);
  if (!authResult.isAuthenticated || !authResult.user) {
    return jsonResponse(authResult.statusCode || 401, {
      error: authResult.error || 'Unauthorized: Administrative privileges required.',
    });
  }

  // 2. Parse payload with size checks
  if (event.body && event.body.length > 5 * 1024 * 1024) {
    return jsonResponse(413, {
      error: 'Payload Too Large: Bulk import batches must be under 5MB (max 100 students per batch).',
    });
  }

  let payload: { students?: BulkStudentInput[] };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const { students } = payload;
  if (!students || !Array.isArray(students) || students.length === 0) {
    return jsonResponse(400, {
      error: 'Invalid request: "students" array with at least one record is required.',
    });
  }

  if (students.length > MAX_BULK_BATCH_SIZE) {
    return jsonResponse(400, {
      error: `Batch limit exceeded. Maximum ${MAX_BULK_BATCH_SIZE} student records per request for memory safety. Received: ${students.length}.`,
    });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  const totalRows = students.length;
  const validationErrors: ValidationError[] = [];
  const duplicateAdmissionNumbers = new Set<string>();
  const seenInBatch = new Set<string>();

  const validRecords: (BulkStudentInput & { resolvedStudentId: string })[] = [];

  // 3. Pre-validate all records
  for (let i = 0; i < students.length; i++) {
    const row = students[i];
    const rowNum = i + 1;

    if (!row.admissionNumber || !row.admissionNumber.trim()) {
      validationErrors.push({ rowNumber: rowNum, field: 'admissionNumber', error: 'Admission Number is missing.' });
      continue;
    }

    const cleanAdm = row.admissionNumber.trim().toUpperCase();

    if (seenInBatch.has(cleanAdm)) {
      duplicateAdmissionNumbers.add(cleanAdm);
      validationErrors.push({
        rowNumber: rowNum,
        admissionNumber: cleanAdm,
        field: 'admissionNumber',
        error: `Duplicate Admission Number '${cleanAdm}' found inside this import file.`,
      });
      continue;
    }
    seenInBatch.add(cleanAdm);

    if (!row.firstName || !row.firstName.trim()) {
      validationErrors.push({ rowNumber: rowNum, admissionNumber: cleanAdm, field: 'firstName', error: 'First Name is missing.' });
    }
    if (!row.lastName || !row.lastName.trim()) {
      validationErrors.push({ rowNumber: rowNum, admissionNumber: cleanAdm, field: 'lastName', error: 'Last Name is missing.' });
    }
    if (!row.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth.trim())) {
      validationErrors.push({
        rowNumber: rowNum,
        admissionNumber: cleanAdm,
        field: 'dateOfBirth',
        error: 'Date of Birth must be in valid YYYY-MM-DD format.',
      });
    }
    if (!row.className || !row.className.trim()) {
      validationErrors.push({ rowNumber: rowNum, admissionNumber: cleanAdm, field: 'className', error: 'Class Name is missing.' });
    }
    if (!row.section || !VALID_SECTIONS.includes(row.section.trim().toUpperCase())) {
      validationErrors.push({
        rowNumber: rowNum,
        admissionNumber: cleanAdm,
        field: 'section',
        error: `Section must be one of: [${VALID_SECTIONS.join(', ')}]. Received: '${row.section}'.`,
      });
    }
    if (!row.rollNumber || !row.rollNumber.trim()) {
      validationErrors.push({ rowNumber: rowNum, admissionNumber: cleanAdm, field: 'rollNumber', error: 'Roll Number is missing.' });
    }

    const cleanYear = (row.academicYear || '2026-2027').split('-')[0].trim();
    const resolvedId = row.studentId && row.studentId.trim()
      ? row.studentId.trim()
      : `STX-${cleanYear}-${cleanAdm.replace(/[^A-Z0-9_-]/g, '')}`;

    validRecords.push({
      ...row,
      admissionNumber: cleanAdm,
      resolvedStudentId: resolvedId,
    });
  }

  // 4. Process valid records and provision accounts
  let successCount = 0;
  let failedCount = 0;
  const processedResults: { studentId: string; admissionNumber: string; success: boolean; error?: string }[] = [];

  const now = new Date().toISOString();

  for (const record of validRecords) {
    try {
      const studentId = record.resolvedStudentId;
      const admissionNo = record.admissionNumber;
      const dob = record.dateOfBirth.trim();
      const studentName = `${record.firstName.trim()} ${record.lastName.trim()}`;

      // A. Create/Update Firestore Student Record
      const studentDocRef = db.collection('students').doc(studentId);
      await studentDocRef.set(
        {
          studentId,
          admissionNumber: admissionNo,
          firstName: record.firstName.trim(),
          lastName: record.lastName.trim(),
          dateOfBirth: dob,
          gender: 'Unspecified',
          className: record.className.trim(),
          section: record.section.trim().toUpperCase(),
          rollNumber: record.rollNumber.trim(),
          academicYear: record.academicYear || '2026-2027',
          admissionDate: now.split('T')[0],
          guardianName: record.guardianName ? record.guardianName.trim() : 'Parent / Guardian',
          guardianRelationship: record.guardianRelationship || 'Guardian',
          guardianPhone: record.guardianPhone ? record.guardianPhone.trim() : 'N/A',
          address: record.address ? record.address.trim() : 'Bhadrak, Odisha',
          active: true,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      // B. Create Firebase Auth User
      const internalEmail = formatStudentAuthIdentifier(studentId);
      const temporaryPassword = generateInitialStudentPassword(dob);

      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: internalEmail,
          password: temporaryPassword,
          displayName: studentName,
          disabled: false,
        });
      } catch (authCreateErr: any) {
        if (authCreateErr.code === 'auth/email-already-exists') {
          userRecord = await auth.getUserByEmail(internalEmail);
        } else {
          throw authCreateErr;
        }
      }

      const uid = userRecord.uid;

      // C. Set Custom Claims
      await auth.setCustomUserClaims(uid, {
        role: 'student',
        studentId,
        admissionNumber: admissionNo,
      });

      // D. Create /users/{uid} and link authUid
      const batch = db.batch();
      batch.set(
        db.collection('users').doc(uid),
        {
          uid,
          role: 'student',
          studentId,
          admissionNumber: admissionNo,
          displayName: studentName,
          active: true,
          mustChangePassword: true,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      batch.update(studentDocRef, {
        authUid: uid,
        updatedAt: now,
      });

      await batch.commit();

      successCount++;
      processedResults.push({
        studentId,
        admissionNumber: admissionNo,
        success: true,
      });
    } catch (recordErr: any) {
      failedCount++;
      processedResults.push({
        studentId: record.resolvedStudentId,
        admissionNumber: record.admissionNumber,
        success: false,
        error: recordErr.message,
      });
      validationErrors.push({
        rowNumber: 0,
        admissionNumber: record.admissionNumber,
        field: 'provisioning',
        error: recordErr.message,
      });
    }
  }

  return jsonResponse(200, {
    summary: {
      totalRows,
      successful: successCount,
      failed: failedCount + validationErrors.length - failedCount,
      duplicateCount: duplicateAdmissionNumbers.size,
    },
    validationErrors,
    processed: processedResults,
    timestamp: now,
  });
};
