import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { getAdminAuth, getAdminDb } from './utils/firebaseAdmin';
import { jsonResponse } from './utils/authMiddleware';

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Return false, but do a dummy comparison to avoid length leak timing variance
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates email address format:
 * - Must adhere to standard email syntax
 * - Explicitly supports official school administrative email accounts (including @gmail.com and custom school domains)
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one letter and at least one number or symbol
 */
function isStrongPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSymbol = /[^a-zA-Z]/.test(password);
  return hasLetter && hasDigitOrSymbol;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use POST.' });
  }

  // =========================================================================
  // GATE 1: Server Environment Secret Verification
  // =========================================================================
  const configuredSecret = process.env.BOOTSTRAP_INITIAL_SECRET;
  if (!configuredSecret || configuredSecret.trim().length < 16) {
    return jsonResponse(503, {
      error: 'Bootstrap mechanism is unavailable. BOOTSTRAP_INITIAL_SECRET is not configured on the server.',
    });
  }

  // Extract header (case-insensitive in netlify headers)
  const headerSecret =
    event.headers['x-bootstrap-secret'] ||
    event.headers['X-Bootstrap-Secret'] ||
    event.headers['x-bootstrap-token'] ||
    '';

  if (!headerSecret || !timingSafeEqual(headerSecret.trim(), configuredSecret.trim())) {
    return jsonResponse(401, {
      error: 'Unauthorized: Invalid or missing bootstrap secret header.',
    });
  }

  // =========================================================================
  // GATE 2 & 3: Check Firestore Lock Document and Super Admin Existence
  // =========================================================================
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    // 1. Check system/bootstrap lock document
    const systemLockRef = db.collection('system').doc('bootstrap');
    const systemLockDoc = await systemLockRef.get();

    if (systemLockDoc.exists) {
      const lockData = systemLockDoc.data();
      if (lockData && lockData.initialized === true) {
        return jsonResponse(409, {
          error: 'Bootstrap already consumed',
          message: 'The initial Super Admin bootstrap mechanism has already been permanently consumed and locked.',
        });
      }
    }

    // 2. Check if any user in /users has role == 'super_admin'
    const existingSuperAdminSnap = await db
      .collection('users')
      .where('role', '==', 'super_admin')
      .limit(1)
      .get();

    if (!existingSuperAdminSnap.empty) {
      // Auto-heal lock document if missing
      await systemLockRef.set(
        {
          initialized: true,
          lockedAt: new Date().toISOString(),
          lockReason: 'Super Admin already exists in users collection',
        },
        { merge: true }
      );

      return jsonResponse(403, {
        error: 'Forbidden: A Super Administrator account already exists in the system.',
      });
    }

    // =========================================================================
    // Request Payload Validation
    // =========================================================================
    let payload: {
      email?: string;
      password?: string;
      displayName?: string;
    };

    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON request body.' });
    }

    const { email, password, displayName } = payload;

    if (!email || !isValidEmail(email)) {
      return jsonResponse(400, { error: 'A valid school administrator email address (e.g., stxaviertihidi@gmail.com) is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName && displayName.trim().length > 0 ? displayName.trim() : 'Super Administrator';

    if (!password || !isStrongPassword(password)) {
      return jsonResponse(400, {
        error: 'Password must be at least 8 characters long and contain both letters and numbers/symbols.',
      });
    }

    // =========================================================================
    // Account Creation & Atomic Lockout
    // =========================================================================
    let userRecord;
    let newlyCreatedAuth = false;

    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password,
        displayName: cleanName,
        emailVerified: true,
        disabled: false,
      });
      newlyCreatedAuth = true;
    } catch (createErr: any) {
      if (createErr.code === 'auth/email-already-exists') {
        // If the email already exists in Auth, retrieve it
        userRecord = await auth.getUserByEmail(cleanEmail);
        await auth.updateUser(userRecord.uid, {
          password,
          displayName: cleanName,
          emailVerified: true,
          disabled: false,
        });
      } else {
        return jsonResponse(500, {
          error: `Failed to create Firebase Authentication account: ${createErr.message}`,
        });
      }
    }

    const uid = userRecord.uid;

    try {
      // 1. Assign custom claims
      await auth.setCustomUserClaims(uid, {
        role: 'super_admin',
        isPasswordAdmin: true,
      });

      const now = new Date().toISOString();

      // 2. Write authoritative /users/{uid} document and system/bootstrap in parallel batch
      const batch = db.batch();

      const userDocRef = db.collection('users').doc(uid);
      batch.set(
        userDocRef,
        {
          uid,
          email: cleanEmail,
          displayName: cleanName,
          role: 'super_admin',
          active: true,
          isPasswordAdmin: true,
          mustChangePassword: true,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      batch.set(
        systemLockRef,
        {
          initialized: true,
          initializedAt: now,
          initialSuperAdminUid: uid,
          initialSuperAdminEmail: cleanEmail,
          locked: true,
        },
        { merge: true }
      );

      await batch.commit();

      return jsonResponse(201, {
        success: true,
        message: 'Initial Super Admin account provisioned successfully. Bootstrap mechanism is now permanently locked.',
        uid,
        email: cleanEmail,
        role: 'super_admin',
        isPasswordAdmin: true,
        mustChangePassword: true,
        timestamp: now,
      });
    } catch (postAuthErr: any) {
      console.error('Post-auth initialization failed. Initiating rollback:', postAuthErr.message);

      // Rollback newly created Auth user if Firestore provisioning failed
      if (newlyCreatedAuth) {
        try {
          await auth.deleteUser(uid);
          console.log(`Rolled back newly created Auth user: ${uid}`);
        } catch (rbErr: any) {
          console.error('Failed to rollback Auth user:', rbErr.message);
        }
      }

      return jsonResponse(500, {
        error: `Failed to complete Super Admin authorization provisioning: ${postAuthErr.message}`,
      });
    }
  } catch (err: any) {
    console.error('Bootstrap error:', err.message);
    return jsonResponse(500, {
      error: 'An internal server error occurred during bootstrap execution.',
    });
  }
};
