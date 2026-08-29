export type UserRole = 'super_admin' | 'staff' | 'accountant' | 'exam_editor' | 'student';

export interface AppUser {
  uid: string;
  role: UserRole;
  studentId?: string; // Present only for student users
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  active: boolean;
  isPasswordAdmin?: boolean; // Securely designated school password administrator flag
  manageStaffAccounts?: boolean; // Reserved for extensible future delegated staff management
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string; // Database document key (matches studentId)
  studentId: string; // Canonical student identifier (e.g., STX-2026-001)
  admissionNumber: string; // Unique institutional admission number
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other' | string;
  className: string; // e.g. "Class 1", "Class 10"
  section: string; // e.g. "A", "B"
  rollNumber: string;
  academicYear: string; // e.g. "2026-2027"
  admissionDate: string; // YYYY-MM-DD
  guardianName: string;
  guardianRelationship: string; // e.g. "Father", "Mother", "Guardian"
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  previousSchool?: string;
  active: boolean;
  authUid?: string; // Linked Firebase Auth UID once provisioned via backend
  createdAt: string;
  updatedAt: string;
}

export interface BackendProvisioningResult {
  success: boolean;
  message: string;
  uid?: string;
  studentId?: string;
  backendConfigured: boolean;
  timestamp: string;
}

export type FeeStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

export interface Fee {
  id: string;
  studentId: string;
  academicYear: string; // e.g. "2025-2026"
  feeType: string; // e.g. "Tuition Fee", "Admission Fee", "Exam Fee", "Transport"
  term: string; // e.g. "Term 1 (Q1)", "Annual"
  amountDue: number;
  discount: number;
  dueDate: string; // YYYY-MM-DD
  status: FeeStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  studentId: string;
  feeId: string;
  amount: number;
  method: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'online' | string;
  status: PaymentStatus;
  transactionId: string;
  gateway: string; // e.g. "Manual Receipt", "Razorpay (Planned)", "Direct Bank"
  paidAt: string;
  createdAt: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';

export interface Exam {
  id: string;
  name: string; // e.g. "Half-Yearly Examination 2025"
  academicYear: string; // e.g. "2025-2026"
  className: string;
  section: string;
  status: ExamStatus;
  createdAt: string;
  publishedAt?: string;
}

export interface SubjectMarks {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  subjects: Record<string, SubjectMarks>;
  totalMarks: number;
  percentage: number;
  grade: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  category: 'Academics' | 'Examinations' | 'Events' | 'Holidays' | 'Circulars';
  date: string; // YYYY-MM-DD
  isUrgent?: boolean;
  isNew?: boolean;
  summary: string;
  content: string;
  attachmentName?: string;
  attachmentUrl?: string;
  targetAudience: string; // e.g., 'All Parents & Students', 'Classes IX & X'
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: 'Administration' | 'Science & Math' | 'Languages' | 'Social Studies' | 'Sports & Arts' | 'Primary Wing';
  qualification: string;
  experienceYears: number;
  image: string;
  specialization: string;
  bio: string;
  email?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Campus & Labs' | 'Events & Celebrations' | 'Sports & Athletics' | 'Science & Arts' | 'Student Life';
  imageUrl: string;
  caption: string;
  date: string;
}

export interface AcademicLevel {
  id: string;
  name: string;
  grades: string;
  ageGroup: string;
  tagline: string;
  description: string;
  highlights: string[];
  subjects: string[];
  activities: string[];
  timing: string;
}

export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Academics' | 'Transport' | 'Facilities';
  question: string;
  answer: string;
}

export interface AdmissionInquiry {
  id?: string;
  studentName: string;
  parentName: string;
  email?: string;
  phone: string;
  gradeApplying: string;
  dateOfBirth?: string;
  gender?: string;
  previousSchool?: string;
  address?: string;
  message?: string;
  status?: 'pending' | 'contacted' | 'enrolled' | 'rejected' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g. "Parent of Class VIII Student", "Alumnus (Batch of 2021)"
  quote: string;
  avatar: string;
  rating: number;
}
