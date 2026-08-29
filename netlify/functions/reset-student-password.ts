import { Handler } from '@netlify/functions';
import {
  getAdminAuth,
  getAdminDb,
  generateInitialStudentPassword,
  formatStudentAuthIdentifier,
} from './utils/firebaseAdmin';
import { authenticateRequest, jsonResponse } from './utils/authMiddleware';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Authenticate caller (Must be super_admin OR designated password administrator)
  const authResult = await authenticateRequest(event);
  if (!authResult.isAuthenticated || !authResult.user) {
    return jsonResponse(authResult.statusCode || 401, {
      error: authResult.error || 'Unauthorized: Valid administrative session required.',
    });
  }

  const isSuperAdmin = authResult.user.role === 'super_admin';
  const isDesignatedPasswordAdmin = Boolean(authResult.user.isPasswordAdmin);

  if (!isSuperAdmin && !isDesignatedPasswordAdmin) {
    return jsonResponse(403, {
      error: 'Forbidden: Only super_admin or the specifically designated school password administrator can reset student passwords.',
    });
  }

  // 2. Parse request payload
  let payload: {
    studentId?: string;
    admissionNumber?: string;
    authUid?: string;
    dateOfBirth?: string;
    newTemporaryPassword?: string;
  };

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const { studentId, admissionNumber, authUid, dateOfBirth: payloadDob, newTemporaryPassword } = payload;

  if (!studentId && !admissionNumber && !authUid) {
    return jsonResponse(400, {
      error: 'At least one student identifier (studentId, admissionNumber, or authUid) is required.',
    });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    let targetUid = authUid?.trim() || '';
    let targetStudentId = studentId?.trim() || '';
    let resolvedDob = payloadDob?.trim() || '';
    let studentDocData: Record<string, any> | null = null;

    // 1. Always attempt to retrieve the authoritative student document from Firestore /students
    if (targetStudentId) {
      const docSnap = await db.collection('students').doc(targetStudentId).get();
      if (docSnap.exists) {
        studentDocData = docSnap.data() || {};
        targetStudentId = docSnap.id;
      }
    }

    if (!studentDocData && admissionNumber) {
      const snap = await db
        .collection('students')
        .where('admissionNumber', '==', admissionNumber.trim().toUpperCase())
        .limit(1)
        .get();
      if (!snap.empty) {
        studentDocData = snap.docs[0].data() || {};
        targetStudentId = snap.docs[0].id;
      }
    }

    if (!studentDocData && targetUid) {
      const snap = await db
        .collection('students')
        .where('authUid', '==', targetUid)
        .limit(1)
        .get();
      if (!snap.empty) {
        studentDocData = snap.docs[0].data() || {};
        targetStudentId = snap.docs[0].id;
      }
    }

    // Merge document data
    if (studentDocData) {
      if (!targetUid && studentDocData.authUid) {
        targetUid = studentDocData.authUid;
      }
      if (!resolvedDob && studentDocData.dateOfBirth) {
        resolvedDob = studentDocData.dateOfBirth;
      }
    }

    // If targetUid is still not resolved, attempt to resolve via internal Firebase Auth email
    if (!targetUid && targetStudentId) {
      const internalEmail = formatStudentAuthIdentifier(targetStudentId);
      try {
        const authUser = await auth.getUserByEmail(internalEmail);
        targetUid = authUser.uid;
      } catch (findErr: any) {
        if (admissionNumber) {
          try {
            const altEmail = formatStudentAuthIdentifier(admissionNumber.trim());
            const authUserAlt = await auth.getUserByEmail(altEmail);
            targetUid = authUserAlt.uid;
          } catch {
            // Not found
          }
        }
      }
    }

    if (!targetUid) {
      return jsonResponse(404, {
        error:
          'Unable to resolve Firebase Authentication account for this student. Please ensure the student is enrolled and provisioned in the directory.',
      });
    }

    // Determine temporary password (Authoritative DDMMYY from DOB or custom if specified)
    const resetPassword =
      newTemporaryPassword && newTemporaryPassword.length >= 6
        ? newTemporaryPassword
        : generateInitialStudentPassword(resolvedDob || '20260101');

    console.log(`[ResetPassword] Resetting password for UID: ${targetUid}, StudentID: ${targetStudentId}, DOB: ${resolvedDob}, Pwd: ${resetPassword}`);

    // 3. Update password in Firebase Auth
    await auth.updateUser(targetUid, {
      password: resetPassword,
    });

    // Revoke previous refresh tokens for security
    await auth.revokeRefreshTokens(targetUid);

    // 4. Update /users/{uid} mustChangePassword = true and active = true
    const now = new Date().toISOString();
    await db.collection('users').doc(targetUid).set(
      {
        uid: targetUid,
        role: 'student',
        mustChangePassword: true,
        active: true,
        updatedAt: now,
      },
      { merge: true }
    );

    // If student document exists, link authUid if not linked
    if (targetStudentId && studentDocData && !studentDocData.authUid) {
      try {
        await db.collection('students').doc(targetStudentId).update({
          authUid: targetUid,
          updatedAt: now,
        });
      } catch (linkErr) {
        console.warn('Could not back-link authUid in student record:', linkErr);
      }
    }

    return jsonResponse(200, {
      success: true,
      message: `Password reset successfully. Initial temporary password is ready for login (${resetPassword}). The student will be required to change password upon next login.`,
      studentId: targetStudentId,
      uid: targetUid,
      mustChangePassword: true,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return jsonResponse(500, {
      error: `Failed to reset student password: ${err.message}`,
    });
  }
};
