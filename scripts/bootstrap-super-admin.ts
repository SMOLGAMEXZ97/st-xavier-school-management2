import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const CANONICAL_PROJECT_ID = 'st-xavier-library-v2';
const CANONICAL_DATABASE_ID = 'ai-studio-stxavierhighscho-deb1028b-965d-405f-8a24-008829c3d52d';

/**
 * Initializes Firebase Admin SDK using local environment variables or service account key.
 */
function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      let projId = parsed.project_id || process.env.FIREBASE_PROJECT_ID || CANONICAL_PROJECT_ID;
      if (projId === CANONICAL_DATABASE_ID) {
        projId = CANONICAL_PROJECT_ID;
      }
      return initializeApp({
        credential: cert(parsed),
        projectId: projId,
      });
    } catch (e: any) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || CANONICAL_PROJECT_ID;
  if (projectId === CANONICAL_DATABASE_ID) {
    projectId = CANONICAL_PROJECT_ID;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  return initializeApp({ projectId });
}

async function bootstrapSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = args[1] || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = args[2] || process.env.BOOTSTRAP_ADMIN_NAME || 'Principal / Super Administrator';

  if (!email || !email.includes('@')) {
    console.error(`
[Error] Super Admin email is required.

Usage:
  npx tsx scripts/bootstrap-super-admin.ts <email> <password> "<displayName>"

Example:
  npx tsx scripts/bootstrap-super-admin.ts stxaviertihidi@gmail.com SuperSecureAdminPass123! "Rev. Fr. Principal"
`);
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('[Error] Password is required and must be at least 6 characters.');
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();

  console.log(`\n--- Initializing Super Admin Provisioning ---`);
  console.log(`Target Email:       ${cleanEmail}`);
  console.log(`Display Name:       ${cleanName}`);
  console.log(`Project ID:         ${CANONICAL_PROJECT_ID}`);
  console.log(`Database ID:        ${CANONICAL_DATABASE_ID}`);

  try {
    const app = initAdmin();
    const auth = getAuth(app);
    const databaseId = process.env.FIRESTORE_DATABASE_ID || CANONICAL_DATABASE_ID;
    const db = getFirestore(app, databaseId);

    // 1. Create or retrieve Firebase Auth User
    let uid = '';
    try {
      const existingUser = await auth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      console.log(`[Auth] Existing Firebase Auth record found (UID: ${uid}). Updating password and claims...`);
      await auth.updateUser(uid, {
        password,
        displayName: cleanName,
        emailVerified: true,
      });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email: cleanEmail,
          password,
          displayName: cleanName,
          emailVerified: true,
        });
        uid = newUser.uid;
        console.log(`[Auth] Created new Firebase Auth user (UID: ${uid}).`);
      } else {
        throw err;
      }
    }

    // 2. Set Firebase Custom Claims
    await auth.setCustomUserClaims(uid, {
      role: 'super_admin',
      isPasswordAdmin: true,
    });
    console.log(`[Auth Claims] Set Custom User Claims: { role: 'super_admin', isPasswordAdmin: true }`);

    // 3. Create or Update authoritative /users/{uid} document in Firestore
    const now = new Date().toISOString();
    const userDocRef = db.collection('users').doc(uid);
    const existingDoc = await userDocRef.get();

    const userData = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      role: 'super_admin',
      active: true,
      isPasswordAdmin: true,
      mustChangePassword: true,
      updatedAt: now,
      ...(existingDoc.exists ? {} : { createdAt: now }),
    };

    await userDocRef.set(userData, { merge: true });
    console.log(`[Firestore] Written authoritative record to /users/${uid}`);

    console.log(`\n======================================================`);
    console.log(`✔ Super Admin Provisioned Successfully!`);
    console.log(`======================================================`);
    console.log(`Email:        ${cleanEmail}`);
    console.log(`UID:          ${uid}`);
    console.log(`Role:         super_admin`);
    console.log(`Password Admin: YES`);
    console.log(`Login URL:    /admin/login`);
    console.log(`======================================================\n`);
  } catch (error: any) {
    console.error(`\n[Fatal Error] Provisioning failed:`, error.message);
    process.exit(1);
  }
}

bootstrapSuperAdmin();
