import { Handler } from '@netlify/functions';
import { getAdminAuth, getAdminDb } from './utils/firebaseAdmin';
import { authenticateRequest, jsonResponse } from './utils/authMiddleware';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Authenticate caller
  const authResult = await authenticateRequest(event, ['super_admin', 'staff']);
  if (!authResult.isAuthenticated || !authResult.user) {
    return jsonResponse(authResult.statusCode || 401, {
      error: authResult.error || 'Unauthorized',
    });
  }

  const caller = authResult.user;

  // 2. Parse request payload
  let payload: {
    uid?: string;
    studentId?: string;
    active?: boolean;
    reason?: string;
  };

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const { uid, studentId, active = false, reason } = payload;

  if (!uid && !studentId) {
    return jsonResponse(400, { error: 'Either uid or studentId must be provided.' });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    let targetUid = uid;
    let targetStudentId = studentId;

    // Resolve UID if studentId provided
    if (!targetUid && studentId) {
      const studentDoc = await db.collection('students').doc(studentId.trim()).get();
      if (studentDoc.exists) {
        targetUid = studentDoc.data()?.authUid;
      }
    }

    // Check target user role
    let targetRole = 'student';
    if (targetUid) {
      const userDoc = await db.collection('users').doc(targetUid).get();
      if (userDoc.exists) {
        targetRole = userDoc.data()?.role || 'student';
        if (!targetStudentId) {
          targetStudentId = userDoc.data()?.studentId;
        }
      }
    }

    // Role safety check: Only super_admin can deactivate staff accounts
    if (targetRole !== 'student' && caller.role !== 'super_admin') {
      return jsonResponse(403, {
        error: 'Forbidden: Only Super Administrator can deactivate staff accounts.',
      });
    }

    // Cannot deactivate yourself
    if (targetUid === caller.uid) {
      return jsonResponse(400, {
        error: 'You cannot deactivate your own active account.',
      });
    }

    const now = new Date().toISOString();

    // 3. Disable/Enable in Firebase Auth (if Auth user exists)
    if (targetUid) {
      try {
        await auth.updateUser(targetUid, {
          disabled: !active,
        });

        // Revoke active sessions if deactivating
        if (!active) {
          await auth.revokeRefreshTokens(targetUid);
        }
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') {
          console.warn('Firebase Auth user state update warning:', authErr.message);
        }
      }

      // Update /users/{uid}
      await db.collection('users').doc(targetUid).set(
        {
          active,
          deactivationReason: !active ? reason || 'Administrative action' : null,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // 4. Update /students/{studentId} if applicable (Preserves academic data)
    if (targetStudentId) {
      await db.collection('students').doc(targetStudentId).set(
        {
          active,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return jsonResponse(200, {
      success: true,
      message: `Account has been ${active ? 'activated' : 'deactivated'} successfully.`,
      active,
      uid: targetUid,
      studentId: targetStudentId,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Account deactivation error:', err);
    return jsonResponse(500, {
      error: `Failed to update account activation status: ${err.message}`,
    });
  }
};
