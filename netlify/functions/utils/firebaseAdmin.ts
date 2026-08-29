import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

// Canonical configuration constants matching firebase-applet-config.json
export const CANONICAL_PROJECT_ID = 'st-xavier-library-v2';
export const CANONICAL_DATABASE_ID = 'ai-studio-stxavierhighscho-deb1028b-965d-405f-8a24-008829c3d52d';

/**
 * Initializes and returns the Firebase Admin SDK App instance.
 * 
 * Identifier Audit:
 * - Firebase Project ID: st-xavier-library-v2 (used for Auth, IAM, and project scope)
 * - Firestore Database ID: ai-studio-stxavierhighscho-deb1028b-965d-405f-8a24-008829c3d52d (named database instance)
 * 
 * Environment variables supported:
 * - FIREBASE_PROJECT_ID (defaults to 'st-xavier-library-v2')
 * - FIRESTORE_DATABASE_ID (defaults to 'ai-studio-stxavierhighscho-deb1028b-965d-405f-8a24-008829c3d52d')
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * or FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)
 */
export function getFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Check for full service account JSON string first
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      let projId = parsed.project_id || process.env.FIREBASE_PROJECT_ID || CANONICAL_PROJECT_ID;
      // Auto-correction safeguard: If databaseId was provided as projectId, correct it
      if (projId === CANONICAL_DATABASE_ID) {
        projId = CANONICAL_PROJECT_ID;
      }

      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: projId,
      });
      return adminApp;
    } catch (e: any) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || CANONICAL_PROJECT_ID;
  // Auto-correction safeguard: If databaseId was erroneously set as FIREBASE_PROJECT_ID
  if (projectId === CANONICAL_DATABASE_ID) {
    console.warn(`[Config Auto-Correction] FIREBASE_PROJECT_ID was set to Firestore Database ID (${CANONICAL_DATABASE_ID}). Using actual Project ID (${CANONICAL_PROJECT_ID}).`);
    projectId = CANONICAL_PROJECT_ID;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines from environment variable strings
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    return adminApp;
  }

  // Fallback: Default initialization (e.g. application default credentials)
  try {
    adminApp = initializeApp({
      projectId,
    });
    return adminApp;
  } catch (err: any) {
    throw new Error(
      'Firebase Admin SDK credentials are not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Netlify environment variables.'
    );
  }
}

export function getAdminAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

/**
 * Returns Firestore instance targeting the applet's specific named database:
 * 'ai-studio-stxavierhighscho-deb1028b-965d-405f-8a24-008829c3d52d'
 */
export function getAdminDb(): Firestore {
  const app = getFirebaseAdminApp();
  const databaseId = process.env.FIRESTORE_DATABASE_ID || CANONICAL_DATABASE_ID;
  return getFirestore(app, databaseId);
}

/**
 * Deterministically formats the internal Firebase Authentication email identifier
 * for a student without exposing email inboxes.
 */
export function formatStudentAuthIdentifier(identifier: string): string {
  const sanitized = identifier.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `${sanitized}@student.stxavier.internal`;
}

/**
 * Derives an initial temporary password from student's Date of Birth (DD/MM/YYYY, YYYY-MM-DD, etc.)
 * Format: Exactly DDMMYY (e.g., DOB 03/02/2015 -> 030215).
 * No prefix, suffix, separators, or letters.
 */
export function generateInitialStudentPassword(dateOfBirth: string): string {
  if (!dateOfBirth) return '010126';
  const str = String(dateOfBirth).trim();

  // 1. Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yy = dmyMatch[3].slice(-2);
    return `${dd}${mm}${yy}`;
  }

  // 2. Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const yy = ymdMatch[1].slice(-2);
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}${mm}${yy}`;
  }

  // 3. Digits fallback
  const digits = str.replace(/\D/g, '');
  if (digits.length === 8) {
    if (digits.startsWith('19') || digits.startsWith('20')) {
      const yy = digits.slice(2, 4);
      const mm = digits.slice(4, 6);
      const dd = digits.slice(6, 8);
      return `${dd}${mm}${yy}`;
    }
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yy = digits.slice(6, 8);
    return `${dd}${mm}${yy}`;
  }
  if (digits.length === 6) {
    return digits;
  }
  return '010126';
}
