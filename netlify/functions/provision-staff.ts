import { Handler } from '@netlify/functions';
import { getAdminAuth, getAdminDb } from './utils/firebaseAdmin';
import { authenticateRequest, jsonResponse } from './utils/authMiddleware';

const ALLOWED_STAFF_ROLES = ['super_admin', 'staff', 'accountant', 'exam_editor'];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Authenticate caller - ONLY super_admin is allowed to provision staff
  const authResult = await authenticateRequest(event, ['super_admin']);
  if (!authResult.isAuthenticated || !authResult.user) {
    return jsonResponse(authResult.statusCode || 401, {
      error: authResult.error || 'Forbidden: Only Super Administrator can provision staff accounts.',
    });
  }

  // 2. Parse & validate request
  let payload: {
    email?: string;
    role?: string;
    displayName?: string;
    temporaryPassword?: string;
    isPasswordAdmin?: boolean;
  };

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON request body.' });
  }

  const { email, role, displayName, temporaryPassword, isPasswordAdmin } = payload;

  if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return jsonResponse(400, { error: 'Valid staff email address is required.' });
  }
  if (!role || !ALLOWED_STAFF_ROLES.includes(role)) {
    return jsonResponse(400, {
      error: `Invalid role specified. Must be one of: [${ALLOWED_STAFF_ROLES.join(', ')}]`,
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName ? displayName.trim() : 'Staff Member';
  const initialPassword =
    temporaryPassword && temporaryPassword.length >= 6
      ? temporaryPassword
      : `STX#Staff${Math.floor(1000 + Math.random() * 9000)}`;

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    // 3. Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password: initialPassword,
        displayName: cleanName,
        disabled: false,
      });
    } catch (createErr: any) {
      if (createErr.code === 'auth/email-already-exists') {
        return jsonResponse(409, {
          error: `An account with email '${cleanEmail}' already exists in Authentication directory.`,
        });
      }
      throw createErr;
    }

    const uid = userRecord.uid;

    // 4. Assign Firebase Custom Claims
    await auth.setCustomUserClaims(uid, {
      role,
      ...(isPasswordAdmin ? { isPasswordAdmin: true } : {}),
    });

    // 5. Create Authorization Document /users/{uid}
    const now = new Date().toISOString();
    const userDocRef = db.collection('users').doc(uid);

    try {
      await userDocRef.set({
        uid,
        email: cleanEmail,
        role,
        displayName: cleanName,
        active: true,
        isPasswordAdmin: Boolean(isPasswordAdmin),
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (docErr: any) {
      console.error('Failed to create /users profile. Rolling back Auth account:', docErr.message);
      try {
        await auth.deleteUser(uid);
      } catch (rbErr: any) {
        console.error('Rollback failed:', rbErr.message);
      }
      throw new Error(`Failed to create staff profile document: ${docErr.message}`);
    }

    return jsonResponse(201, {
      success: true,
      message: `Staff account with role '${role}' created successfully for ${cleanEmail}.`,
      uid,
      role,
      isPasswordAdmin: Boolean(isPasswordAdmin),
      mustChangePassword: true,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Staff provisioning error:', err);
    return jsonResponse(500, {
      error: `Failed to provision staff account: ${err.message}`,
    });
  }
};
