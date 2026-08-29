# Security Specification & Threat Model for St. Xavier High School

## 1. Role-Based Access Control (RBAC) Architecture
The school system enforces role authorization directly in Cloud Firestore Security Rules using user profiles keyed by Firebase Auth UID under `/users/{firebaseUid}`.

### Role Hierarchy & Responsibilities:
- **`super_admin`**: Full administrative ownership. Can create/manage user authorization documents, manage staff, students, fees, payments, exams, results, and system notices.
- **`staff`**: General academic and student management staff. Can read student profiles, manage notices, admissions, and contact inquiries. Cannot alter fee ledgers or user role documents.
- **`accountant`**: Financial management officer. Can create, read, and reconcile fee ledgers and payment receipts. Cannot publish exam marks or alter student authorization records.
- **`exam_editor`**: Academic examination supervisor. Can create and schedule exams, input and publish student marks and report cards. Cannot access payment data.
- **`student`**: Enrolled student. Can read **strictly their own** student master record, their own fee bills, their own payment receipts, and their own published exam results. Cannot write, modify, or delete any academic, financial, or user role records.

---

## 2. Invariant Rules
1. **Zero Client-Side Role Granting**: Clients cannot set their own role. Document creation under `/users/{userId}` is strictly restricted to `super_admin`.
2. **Self-Update Protection**: An active user can only update their own `mustChangePassword` status flag and timestamp. They CANNOT alter their `role`, `email`, `active` status, or `studentId`.
3. **Strict Student Isolation**: A student with ID `studentId` cannot query or read other students' records or unpublished draft exam results (`resource.data.studentId == getStudentId()`).
4. **Temporary Password Reset Mandate**: On initial login with a temporary date-of-birth password, the student is gated by `mustChangePassword: true` until an updated password is authenticated and applied.
5. **No Passwords in Database**: All authentication is handled natively via Firebase Email/Password Auth tokens; passwords are never written to Firestore.

---

## 3. Threat Payload Test Matrix ("Dirty Dozen")

| Payload ID | Target Collection | Vector Description | Expected Result |
|---|---|---|---|
| P-01 | `/users/{uid}` | Student or unauthenticated user tries to create user with `role: "super_admin"` | PERMISSION_DENIED |
| P-02 | `/users/{uid}` | Authenticated student tries to change their `role` to `accountant` | PERMISSION_DENIED |
| P-03 | `/students/{id}` | Student A attempts to read Student B's profile | PERMISSION_DENIED |
| P-04 | `/students/{id}` | Student attempts to edit their roll number or date of birth | PERMISSION_DENIED |
| P-05 | `/fees/{id}` | Student attempts to mark their fee status as `paid` or change `amountDue` | PERMISSION_DENIED |
| P-06 | `/payments/{id}` | Unauthenticated or student client attempts to inject fake payment receipt | PERMISSION_DENIED |
| P-07 | `/exams/{id}` | Accountant or student attempts to create an exam schedule | PERMISSION_DENIED |
| P-08 | `/results/{id}` | Student attempts to read unpublished/draft exam scores | PERMISSION_DENIED |
| P-09 | `/results/{id}` | Exam editor attempts to modify student fee ledger | PERMISSION_DENIED |
| P-10 | `/notices/{id}` | Public unauthenticated user attempts to delete or post a school circular | PERMISSION_DENIED |
| P-11 | `/inquiries` | Public user attempts to list or harvest prospective admission submissions | PERMISSION_DENIED |
| P-12 | `/users/{uid}` | Inactive/disabled user (`active: false`) attempts any read or write | PERMISSION_DENIED |
