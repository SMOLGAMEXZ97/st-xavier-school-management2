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
  academicYear: string; // e.g. "2025-2026" or "2026-2027"
  feeType: string; // e.g. "Tuition Fee", "Admission Fee", "Exam Fee", "Transport"
  term: string; // e.g. "Term 1 (Q1)", "Annual"
  amountDue: number;
  discount: number;
  dueDate: string; // YYYY-MM-DD
  status: FeeStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  remarks?: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  section?: string;
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
  notes?: string;
  receivedBy?: string;
  receiptNumber?: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  section?: string;
  feeType?: string;
  term?: string;
}

export interface StudentFeeSummary {
  student: Student;
  fees: Fee[];
  payments: Payment[];
  totalAssessed: number;
  totalDiscount: number;
  totalNetDue: number;
  totalPaid: number;
  balanceDue: number;
  status: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'no_dues';
  hasOverdue: boolean;
}

export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';

export type ExamType =
  | 'unit_test'
  | 'periodic_test'
  | 'half_yearly'
  | 'annual'
  | 'pre_board'
  | 'mock_test'
  | 'term_exam'
  | 'other';

export interface ExamSubjectConfig {
  subjectName: string;
  maxMarks: number;
  passMarks?: number;
}

export interface Exam {
  id: string;
  name: string; // e.g. "Half-Yearly Examination 2025"
  examType?: ExamType | string;
  academicYear: string; // e.g. "2025-2026"
  className: string; // e.g. "Class 10" or "All Classes"
  section: string; // e.g. "A", "All"
  startDate?: string;
  endDate?: string;
  resultDate?: string;
  description?: string;
  subjects?: ExamSubjectConfig[];
  totalMaxMarks?: number;
  status: ExamStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface SubjectMarks {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  passMarks?: number;
  grade?: string;
  isAbsent?: boolean;
  remarks?: string;
}

export type ExamResultStatus = 'passed' | 'failed' | 'compartment' | 'absent' | 'promoted' | 'withheld';

export interface ExamResult {
  id: string;
  examId: string;
  examName?: string;
  studentId: string;
  admissionNumber?: string;
  studentName?: string;
  rollNumber?: string;
  className?: string;
  section?: string;
  academicYear?: string;
  subjects: Record<string, SubjectMarks>;
  totalMarks: number;
  totalMaxMarks?: number;
  percentage: number;
  grade: string;
  resultStatus?: ExamResultStatus;
  rank?: number;
  attendance?: string;
  teacherRemarks?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoticeCategory =
  | 'Academics'
  | 'Examinations'
  | 'Events'
  | 'Holidays'
  | 'Circulars'
  | 'General';

export type NoticeStatus = 'published' | 'draft';

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  status?: NoticeStatus; // 'published' | 'draft' (defaults to 'published')
  isUrgent?: boolean;
  isNew?: boolean;
  summary: string;
  content: string;
  attachmentName?: string;
  attachmentUrl?: string;
  targetAudience: string; // e.g., 'All Parents & Students', 'Classes IX & X', 'All'
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface GuardianContactRecord {
  guardianKey: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  students: Student[];
  studentCount: number;
}

export interface InstitutionalOverviewKPIs {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newAdmissionsCount: number;
  pendingInquiriesCount: number;
  totalFeesAssessed: number;
  totalFeesCollected: number;
  outstandingFees: number;
  collectionRate: number;
  totalExams: number;
  publishedExams: number;
  totalResultsRecorded: number;
}

export interface AcademicSummaryReport {
  totalExams: number;
  publishedExams: number;
  draftExams: number;
  totalEvaluated: number;
  overallAveragePercentage: number;
  overallPassRate: number;
  passedCount: number;
  failedCount: number;
  compartmentCount: number;
  gradeDistribution: Record<string, number>; // e.g. { 'A1': 10, 'A2': 15, ... }
  examTypeBreakdown: Record<string, number>;
}

export interface FinancialSummaryReport {
  grossAssessed: number;
  concessions: number;
  netDemand: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionPercentage: number;
  statusCounts: {
    paid: number;
    partially_paid: number;
    pending: number;
    overdue: number;
  };
  recentPaymentsTotal: number;
}

export interface AdmissionsSummaryReport {
  totalInquiries: number;
  pending: number;
  contacted: number;
  enrolled: number;
  rejected: number;
  conversionRate: number;
  gradeDemand: Record<string, number>;
}

export interface StudentEnrollmentSummary {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  classDistribution: Record<string, number>;
  sectionDistribution: Record<string, number>;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  sessionDistribution: Record<string, number>;
}

export interface StudentReportRow {
  id: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  className: string;
  section: string;
  rollNumber: string;
  academicYear: string;
  gender: string;
  active: boolean;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship?: string;
  admissionDate?: string;
}

export interface FeeReportRow {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  guardianName: string;
  feeType: string;
  term: string;
  grossAmount: number;
  discount: number;
  netDemand: number;
  totalPaid: number;
  balanceDue: number;
  status: FeeStatus;
  academicYear: string;
  dueDate: string;
}

export interface PaymentRegisterRow {
  id: string;
  receiptNumber: string;
  paidAt: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  amount: number;
  method: string;
  reference: string;
  academicYear: string;
  status: PaymentStatus;
}

export interface AdmissionsReportRow {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  gradeApplying: string;
  status: string;
  createdAt: string;
  notes?: string;
  previousSchool?: string;
  address?: string;
}

export interface AcademicReportRow {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  rollNumber: string;
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  resultStatus: ExamResultStatus | string;
  published: boolean;
  examDate?: string;
}

export interface DetailedReportsData {
  students: StudentReportRow[];
  fees: FeeReportRow[];
  payments: PaymentRegisterRow[];
  admissions: AdmissionsReportRow[];
  academics: AcademicReportRow[];
  availableClasses: string[];
  availableSections: string[];
  rawExams?: Exam[];
  rawResults?: ExamResult[];
  rawStudents?: Student[];
}

export interface ReportDashboardData {
  academicYearFilter: string;
  availableSessions: string[];
  kpis: InstitutionalOverviewKPIs;
  academic: AcademicSummaryReport;
  financial: FinancialSummaryReport;
  admissions: AdmissionsSummaryReport;
  enrollment: StudentEnrollmentSummary;
  detailed: DetailedReportsData;
  lastUpdated: string;
}


