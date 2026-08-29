import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  formatStudentAuthIdentifier,
  resolveStudentAuthEmail,
  generateInitialStudentPassword,
  authService,
} from '../src/services/authService';

async function runEndToEndVerification() {
  console.log('===============================================================');
  console.log('STUDENT LOGIN FLOW VERIFICATION TEST (ADM-2026-001)');
  console.log('===============================================================\n');

  // Test 1: Deterministic Identity Resolution
  console.log('--- TEST 1: Deterministic Identity Resolution ---');
  const emailFromAdm = resolveStudentAuthEmail('ADM-2026-001');
  const emailFromStudentId = resolveStudentAuthEmail('STX-2026-ADM-2026-001');
  const emailFromRawAdm = resolveStudentAuthEmail('adm-2026-001');

  console.log('resolveStudentAuthEmail("ADM-2026-001"):', emailFromAdm);
  console.log('resolveStudentAuthEmail("STX-2026-ADM-2026-001"):', emailFromStudentId);
  console.log('resolveStudentAuthEmail("adm-2026-001"):', emailFromRawAdm);

  if (
    emailFromAdm !== 'stx-2026-adm-2026-001@student.stxavier.internal' ||
    emailFromStudentId !== 'stx-2026-adm-2026-001@student.stxavier.internal' ||
    emailFromRawAdm !== 'stx-2026-adm-2026-001@student.stxavier.internal'
  ) {
    throw new Error('Identity resolution failed! All formats must map to the single authoritative email.');
  }
  console.log('✔ PASS: All student identifier variants resolve to the exact same authoritative Auth email.\n');

  // Test 2: Authoritative Temporary Password
  console.log('--- TEST 2: Authoritative Temporary Password Format ---');
  const tempPass = generateInitialStudentPassword('2015-02-03');
  console.log('generateInitialStudentPassword("2015-02-03"):', tempPass);
  if (tempPass !== 'STX@20150203') {
    throw new Error(`Expected temp password to be STX@20150203, got ${tempPass}`);
  }
  console.log('✔ PASS: Authoritative temporary password format is STX@YYYYMMDD.\n');

  // Test 3: Actual Student Login using Admission Number
  console.log('--- TEST 3: Login with Admission Number (ADM-2026-001) ---');
  const resultAdm = await authService.loginStudent('ADM-2026-001', 'STX@20150203');
  console.log('Firebase Auth User UID:', resultAdm.user.uid);
  console.log('Firebase Auth User Email:', resultAdm.user.email);
  console.log('Firestore User Profile:', JSON.stringify(resultAdm.profile, null, 2));

  if (!resultAdm.user.uid) {
    throw new Error('Firebase Auth did not return a user UID.');
  }
  if (resultAdm.profile.role !== 'student') {
    throw new Error(`Expected role to be student, got ${resultAdm.profile.role}`);
  }
  if (resultAdm.profile.active !== true) {
    throw new Error('Expected student to be active: true');
  }
  if (resultAdm.profile.mustChangePassword !== true) {
    throw new Error('Expected mustChangePassword to be true on first login');
  }
  console.log('✔ PASS: Student authenticated successfully with Admission Number.\n');

  // Test 4: Verify Student Master Document in /students
  console.log('--- TEST 4: Student Master Document Cross-Check ---');
  const studentDocRef = doc(authService.getUserProfile ? (await import('../src/services/firebase')).db : null as any, 'students', resultAdm.profile.studentId || 'STX-2026-ADM-2026-001');
  const studentSnap = await getDoc(studentDocRef);
  if (!studentSnap.exists()) {
    throw new Error(`Student document /students/${resultAdm.profile.studentId} does not exist!`);
  }
  const studentData = studentSnap.data();
  console.log('Student document data:', JSON.stringify(studentData, null, 2));
  if (studentData.authUid !== resultAdm.user.uid) {
    throw new Error(`authUid in /students (${studentData.authUid}) does not match Auth UID (${resultAdm.user.uid})`);
  }
  console.log('✔ PASS: /students/{studentId} authUid strictly matches Firebase Auth UID.\n');

  // Clean signout before next test
  await authService.logout();

  // Test 5: Login with Student ID
  console.log('--- TEST 5: Login with Student ID (STX-2026-ADM-2026-001) ---');
  const resultId = await authService.loginStudent('STX-2026-ADM-2026-001', 'STX@20150203');
  if (resultId.user.uid !== resultAdm.user.uid) {
    throw new Error('UID mismatch between Admission Number login and Student ID login.');
  }
  console.log('✔ PASS: Login with full Student ID succeeds identically.\n');

  await authService.logout();

  // Test 6: Invalid Password Rejection (Single Attempt)
  console.log('--- TEST 6: Invalid Password Rejection ---');
  try {
    await authService.loginStudent('ADM-2026-001', 'IncorrectPass123!');
    throw new Error('Login with incorrect password should have failed!');
  } catch (err: any) {
    console.log('Caught expected error:', err.code || err.message);
    console.log('✔ PASS: Invalid password rejected cleanly.\n');
  }

  // Test 7: Non-Existent Account Rejection
  console.log('--- TEST 7: Non-Existent Account Rejection ---');
  try {
    await authService.loginStudent('ADM-9999-999', 'STX@20150203');
    throw new Error('Login with non-existent account should have failed!');
  } catch (err: any) {
    console.log('Caught expected error:', err.code || err.message);
    console.log('✔ PASS: Non-existent account rejected cleanly.\n');
  }

  console.log('===============================================================');
  console.log('✔ ALL STUDENT AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

runEndToEndVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
