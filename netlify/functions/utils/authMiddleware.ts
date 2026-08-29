import { HandlerEvent } from '@netlify/functions';
import { getAdminAuth, getAdminDb } from './firebaseAdmin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'super_admin' | 'staff' | 'accountant' | 'exam_editor' | 'student' | string;
  studentId?: string;
  admissionNumber?: string;
  active: boolean;
  isPasswordAdmin?: boolean;
}

export interface AuthValidationResult {
  isAuthenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Extracts and verifies the Firebase ID Token from the Authorization header.
 * Enforces role verification from trusted server-side data (custom claims + /users/{uid}).
 */
export async function authenticateRequest(
  event: HandlerEvent,
  allowedRoles?: string[]
): Promise<AuthValidationResult> {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isAuthenticated: false,
      error: 'Missing or malformed Authorization header. Expected Bearer token.',
      statusCode: 401,
    };
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return {
      isAuthenticated: false,
      error: 'Empty authentication bearer token.',
      statusCode: 401,
    };
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let role = (decodedToken.role as string) || '';
    let studentId = (decodedToken.studentId as string) || '';
    let admissionNumber = (decodedToken.admissionNumber as string) || '';
    let isPasswordAdmin = Boolean(decodedToken.isPasswordAdmin);
    let active = true;

    // Check server environment variables for designated password administrator
    const callerEmail = (decodedToken.email || '').toLowerCase();
    const envAdminEmail = (process.env.DESIGNATED_PASSWORD_ADMIN_EMAIL || '').trim().toLowerCase();
    const envAdminUid = (process.env.DESIGNATED_PASSWORD_ADMIN_UID || '').trim();

    if (
      (envAdminEmail && callerEmail === envAdminEmail) ||
      (envAdminUid && uid === envAdminUid)
    ) {
      isPasswordAdmin = true;
    }

    // Fetch authoritative server-side user record from Firestore /users/{uid}
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data() || {};
      role = userData.role || role;
      studentId = userData.studentId || studentId;
      admissionNumber = userData.admissionNumber || admissionNumber;
      if (userData.isPasswordAdmin === true) {
        isPasswordAdmin = true;
      }
      if (userData.active === false) {
        active = false;
      }
    }

    if (!active) {
      return {
        isAuthenticated: false,
        error: 'This account has been deactivated. Please contact the school administrator.',
        statusCode: 403,
      };
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!role || !allowedRoles.includes(role)) {
        return {
          isAuthenticated: false,
          error: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${role || 'unassigned'}'.`,
          statusCode: 403,
        };
      }
    }

    return {
      isAuthenticated: true,
      user: {
        uid,
        email: decodedToken.email,
        role,
        studentId,
        admissionNumber,
        active,
        isPasswordAdmin: isPasswordAdmin || role === 'super_admin',
      },
    };
  } catch (err: any) {
    console.error('Authentication token verification failed:', err.message);
    return {
      isAuthenticated: false,
      error: `Invalid or expired authentication token: ${err.message}`,
      statusCode: 401,
    };
  }
}

export function jsonResponse(statusCode: number, body: Record<string, any>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}
