import { studentService } from './studentService';
import { feeService } from './feeService';
import { examService } from './examService';
import { inquiryService } from './inquiryService';
import { calculateGrade } from '../utils/gradeUtils';
import {
  Student,
  Fee,
  Payment,
  Exam,
  ExamResult,
  AdmissionInquiry,
  ReportDashboardData,
  InstitutionalOverviewKPIs,
  AcademicSummaryReport,
  FinancialSummaryReport,
  AdmissionsSummaryReport,
  StudentEnrollmentSummary,
  StudentReportRow,
  FeeReportRow,
  PaymentRegisterRow,
  AdmissionsReportRow,
  AcademicReportRow,
  DetailedReportsData,
} from '../types';

const formatPaymentMethod = (method?: string): string => {
  if (!method) return 'Cash';
  const m = method.toLowerCase().trim();
  if (m === 'upi') return 'UPI';
  if (m === 'bank_transfer') return 'Bank Transfer';
  if (m === 'cheque') return 'Cheque';
  if (m === 'demand_draft' || m === 'dd') return 'Demand Draft';
  if (m === 'card') return 'Debit/Credit Card';
  if (m === 'online') return 'Online Portal';
  if (m === 'cash') return 'Cash';
  return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
};

export const reportService = {
  /**
   * Aggregates live institutional data across all primary modules
   * with optional filtering by Academic Session.
   */
  getInstitutionalDashboardData: async (
    selectedSession: string = 'all'
  ): Promise<ReportDashboardData> => {
    // 1. Fetch live data across core collections concurrently
    const [studentsRaw, feesRaw, paymentsRaw, examsRaw, resultsRaw, inquiriesRaw] =
      await Promise.all([
        studentService.getAllStudents().catch(() => [] as Student[]),
        feeService.getAllFees().catch(() => [] as Fee[]),
        feeService.getAllPayments().catch(() => [] as Payment[]),
        examService.getAllExams().catch(() => [] as Exam[]),
        examService.getAllResults().catch(() => [] as ExamResult[]),
        inquiryService.getAllInquiries().catch(() => [] as AdmissionInquiry[]),
      ]);

    const students = studentsRaw || [];
    const fees = feesRaw || [];
    const payments = paymentsRaw || [];
    const exams = examsRaw || [];
    const results = resultsRaw || [];
    const inquiries = inquiriesRaw || [];

    // 2. Compute available academic sessions dynamically
    const sessionsSet = new Set<string>();
    students.forEach((s) => s.academicYear && sessionsSet.add(s.academicYear.trim()));
    fees.forEach((f) => f.academicYear && sessionsSet.add(f.academicYear.trim()));
    exams.forEach((e) => e.academicYear && sessionsSet.add(e.academicYear.trim()));
    results.forEach((r) => r.academicYear && sessionsSet.add(r.academicYear.trim()));

    // Fallback standard sessions if none found
    if (sessionsSet.size === 0) {
      sessionsSet.add('2026-2027');
      sessionsSet.add('2025-2026');
    }

    const availableSessions = Array.from(sessionsSet).sort().reverse();

    // 3. Apply Academic Year filtering safely if not 'all'
    const isFiltered = selectedSession !== 'all' && selectedSession !== '';

    const filteredStudents = isFiltered
      ? students.filter((s) => (s.academicYear || '').trim() === selectedSession)
      : students;

    const filteredFees = isFiltered
      ? fees.filter((f) => (f.academicYear || '').trim() === selectedSession)
      : fees;

    // Build lookup maps for accurate payment attribution and entity joining
    const studentIdMap = new Map<string, Student>();
    const studentDocIdMap = new Map<string, Student>();
    students.forEach((s) => {
      if (s.studentId) studentIdMap.set(s.studentId, s);
      if (s.id) studentDocIdMap.set(s.id, s);
    });

    const feeMap = new Map<string, Fee>();
    const feeIdToAcademicYear = new Map<string, string>();
    fees.forEach((f) => {
      if (f.id) {
        feeMap.set(f.id, f);
        if (f.academicYear) feeIdToAcademicYear.set(f.id, f.academicYear.trim());
      }
    });

    const examMap = new Map<string, Exam>();
    exams.forEach((e) => {
      if (e.id) examMap.set(e.id, e);
    });

    const studentIdToAcademicYear = new Map<string, string>();
    students.forEach((s) => {
      if (s.id && s.academicYear) {
        studentIdToAcademicYear.set(s.id, s.academicYear.trim());
      }
      if (s.studentId && s.academicYear) {
        studentIdToAcademicYear.set(s.studentId, s.academicYear.trim());
      }
    });

    const filteredPayments = isFiltered
      ? payments.filter((p) => {
          // If payment is linked to a known fee, match against that fee's academic year
          if (p.feeId && feeIdToAcademicYear.has(p.feeId)) {
            return feeIdToAcademicYear.get(p.feeId) === selectedSession;
          }
          // If payment is an advance/general payment, match against the student's assigned session
          if (p.studentId && studentIdToAcademicYear.has(p.studentId)) {
            return studentIdToAcademicYear.get(p.studentId) === selectedSession;
          }
          return false;
        })
      : payments;

    const filteredExams = isFiltered
      ? exams.filter((e) => (e.academicYear || '').trim() === selectedSession)
      : exams;

    const filteredExamIds = new Set(filteredExams.map((e) => e.id));
    const filteredResults = isFiltered
      ? results.filter(
          (r) =>
            (r.academicYear && r.academicYear.trim() === selectedSession) ||
            (r.examId && filteredExamIds.has(r.examId))
        )
      : results;

    // Admissions inquiries: Inquiries are prospective applicant leads.
    // As the AdmissionInquiry schema does not contain an academicYear field,
    // all inquiries are retained to reflect the complete admissions desk pipeline.
    const filteredInquiries = inquiries;

    // Calculate sum of successful payments per fee ID
    const feePaidMap = new Map<string, number>();
    payments.forEach((p) => {
      if (p.feeId && (p.status || 'success') === 'success') {
        const current = feePaidMap.get(p.feeId) || 0;
        feePaidMap.set(p.feeId, current + (Number(p.amount) || 0));
      }
    });

    // 4. Calculate Student & Enrollment metrics
    const totalStudents = filteredStudents.length;
    const activeStudents = filteredStudents.filter((s) => s.active !== false).length;
    const inactiveStudents = filteredStudents.filter((s) => s.active === false).length;

    const classDistribution: Record<string, number> = {};
    const sectionDistribution: Record<string, number> = {};
    const sessionDistribution: Record<string, number> = {};
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    const classesSet = new Set<string>();
    const sectionsSet = new Set<string>();

    filteredStudents.forEach((s) => {
      // Class
      const cls = s.className ? s.className.trim() : 'Unassigned';
      classDistribution[cls] = (classDistribution[cls] || 0) + 1;
      if (s.className) classesSet.add(s.className.trim());

      // Section
      const sec = s.section ? s.section.trim().toUpperCase() : 'N/A';
      sectionDistribution[sec] = (sectionDistribution[sec] || 0) + 1;
      if (s.section) sectionsSet.add(s.section.trim().toUpperCase());

      // Session
      const sess = s.academicYear ? s.academicYear.trim() : 'Not Stated';
      sessionDistribution[sess] = (sessionDistribution[sess] || 0) + 1;

      // Gender
      const gen = (s.gender || '').toLowerCase().trim();
      if (gen === 'male' || gen === 'm') maleCount++;
      else if (gen === 'female' || gen === 'f') femaleCount++;
      else otherCount++;
    });

    // Default fallbacks if empty
    if (classesSet.size === 0) {
      ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].forEach((c) => classesSet.add(c));
    }
    if (sectionsSet.size === 0) {
      ['A', 'B', 'C'].forEach((sec) => sectionsSet.add(sec));
    }

    const availableClasses = Array.from(classesSet).sort();
    const availableSections = Array.from(sectionsSet).sort();

    const enrollmentSummary: StudentEnrollmentSummary = {
      totalStudents,
      activeStudents,
      inactiveStudents,
      classDistribution,
      sectionDistribution,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        other: otherCount,
      },
      sessionDistribution,
    };

    // 5. Calculate Financial Overview
    const grossAssessed = filteredFees.reduce((sum, f) => sum + (Number(f.amountDue) || 0), 0);
    const concessions = filteredFees.reduce((sum, f) => sum + (Number(f.discount) || 0), 0);
    const netDemand = Math.max(0, grossAssessed - concessions);

    const totalCollected = filteredPayments
      .filter((p) => (p.status || 'success') === 'success')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const outstandingBalance = Math.max(0, netDemand - totalCollected);
    const collectionPercentage =
      netDemand > 0 ? Math.min(100, Math.round((totalCollected / netDemand) * 100)) : 0;

    const feeStatusCounts = {
      paid: 0,
      partially_paid: 0,
      pending: 0,
      overdue: 0,
    };

    filteredFees.forEach((f) => {
      const status = f.status || 'pending';
      if (status === 'paid') feeStatusCounts.paid++;
      else if (status === 'partially_paid') feeStatusCounts.partially_paid++;
      else if (status === 'overdue') feeStatusCounts.overdue++;
      else feeStatusCounts.pending++;
    });

    const financialSummary: FinancialSummaryReport = {
      grossAssessed,
      concessions,
      netDemand,
      totalCollected,
      outstandingBalance,
      collectionPercentage,
      statusCounts: feeStatusCounts,
      recentPaymentsTotal: totalCollected,
    };

    // 6. Calculate Academic Overview
    const totalExams = filteredExams.length;
    const publishedExams = filteredExams.filter((e) => e.status === 'published').length;
    const draftExams = totalExams - publishedExams;
    const totalEvaluated = filteredResults.length;

    const percentageSum = filteredResults.reduce(
      (sum, r) => sum + (Number(r.percentage) || 0),
      0
    );
    const overallAveragePercentage =
      totalEvaluated > 0 ? Number((percentageSum / totalEvaluated).toFixed(1)) : 0;

    let passedCount = 0;
    let failedCount = 0;
    let compartmentCount = 0;

    const gradeDistribution: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      D: 0,
      E: 0,
    };

    const examTypeBreakdown: Record<string, number> = {};

    filteredExams.forEach((e) => {
      const type = e.examType || 'Other';
      examTypeBreakdown[type] = (examTypeBreakdown[type] || 0) + 1;
    });

    filteredResults.forEach((r) => {
      const status = (r.resultStatus || '').toLowerCase();
      if (status === 'passed' || status === 'promoted') {
        passedCount++;
      } else if (status === 'failed') {
        failedCount++;
      } else if (status === 'compartment') {
        compartmentCount++;
      } else if (status === 'absent') {
        failedCount++;
      } else if (Number(r.percentage) >= 33) {
        passedCount++;
      } else {
        failedCount++;
      }

      // Grade distribution with standard CBSE 8-Point scale fallback
      const pct = Number(r.percentage) || 0;
      const gr = (r.grade || calculateGrade(pct).grade || '').toUpperCase().trim();
      if (gradeDistribution[gr] !== undefined) {
        gradeDistribution[gr]++;
      } else if (gr) {
        gradeDistribution[gr] = (gradeDistribution[gr] || 0) + 1;
      }
    });

    const overallPassRate =
      totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 0;

    const academicSummary: AcademicSummaryReport = {
      totalExams,
      publishedExams,
      draftExams,
      totalEvaluated,
      overallAveragePercentage,
      overallPassRate,
      passedCount,
      failedCount,
      compartmentCount,
      gradeDistribution,
      examTypeBreakdown,
    };

    // 7. Calculate Admissions Overview
    const totalInquiries = filteredInquiries.length;
    let pendingInq = 0;
    let contactedInq = 0;
    let enrolledInq = 0;
    let rejectedInq = 0;
    const gradeDemand: Record<string, number> = {};

    filteredInquiries.forEach((inq) => {
      const st = inq.status || 'pending';
      if (st === 'pending') pendingInq++;
      else if (st === 'contacted') contactedInq++;
      else if (st === 'enrolled') enrolledInq++;
      else if (st === 'rejected') rejectedInq++;
      else pendingInq++;

      const gr = inq.gradeApplying ? inq.gradeApplying.trim() : 'General';
      gradeDemand[gr] = (gradeDemand[gr] || 0) + 1;
    });

    const conversionRate =
      totalInquiries > 0 ? Math.min(100, Math.round((enrolledInq / totalInquiries) * 100)) : 0;

    const admissionsSummary: AdmissionsSummaryReport = {
      totalInquiries,
      pending: pendingInq,
      contacted: contactedInq,
      enrolled: enrolledInq,
      rejected: rejectedInq,
      conversionRate,
      gradeDemand,
    };

    // 8. Institutional Overview KPIs
    const kpis: InstitutionalOverviewKPIs = {
      totalStudents,
      activeStudents,
      inactiveStudents,
      newAdmissionsCount: enrolledInq,
      pendingInquiriesCount: pendingInq,
      totalFeesAssessed: netDemand,
      totalFeesCollected: totalCollected,
      outstandingFees: outstandingBalance,
      collectionRate: collectionPercentage,
      totalExams,
      publishedExams,
      totalResultsRecorded: totalEvaluated,
    };

    // 9. Construct Phase 2A Detailed Tabular Rows
    // A. Detailed Students & Enrollment
    const studentReportRows: StudentReportRow[] = filteredStudents.map((s) => {
      const first = s.firstName || '';
      const last = s.lastName || '';
      const fullName = `${first} ${last}`.trim() || 'Unnamed Student';
      return {
        id: s.id,
        studentId: s.studentId || s.id,
        admissionNumber: s.admissionNumber || s.studentId || '-',
        fullName,
        className: s.className || 'Unassigned',
        section: s.section || 'A',
        rollNumber: s.rollNumber || '-',
        academicYear: s.academicYear || '2026-2027',
        gender: s.gender || 'Not Stated',
        active: s.active !== false,
        guardianName: s.guardianName || 'Not Stated',
        guardianPhone: s.guardianPhone || '-',
        guardianRelationship: s.guardianRelationship || 'Guardian',
        admissionDate: s.admissionDate || s.createdAt || '',
      };
    });

    // B. Detailed Fee Ledgers
    const feeReportRows: FeeReportRow[] = filteredFees.map((f) => {
      const student = studentIdMap.get(f.studentId) || studentDocIdMap.get(f.studentId);
      const studentName =
        f.studentName ||
        (student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown Student');
      const admissionNumber = f.admissionNumber || student?.admissionNumber || student?.studentId || '-';
      const className = f.className || student?.className || 'Unassigned';
      const section = f.section || student?.section || 'A';
      const guardianName = student?.guardianName || '-';
      const grossAmount = Number(f.amountDue) || 0;
      const discount = Number(f.discount) || 0;
      const feeNetDemand = Math.max(0, grossAmount - discount);

      let feePaid = feePaidMap.get(f.id) || 0;
      if (feePaid === 0 && f.status === 'paid') {
        feePaid = feeNetDemand;
      }
      const balanceDue = Math.max(0, feeNetDemand - feePaid);

      return {
        id: f.id,
        studentId: f.studentId || '-',
        studentName,
        admissionNumber,
        className,
        section,
        guardianName,
        feeType: f.feeType || 'Tuition Fee',
        term: f.term || 'Term 1',
        grossAmount,
        discount,
        netDemand: feeNetDemand,
        totalPaid: feePaid,
        balanceDue,
        status: f.status || 'pending',
        academicYear: f.academicYear || student?.academicYear || '2026-2027',
        dueDate: f.dueDate || '',
      };
    });

    // C. Detailed Payment Register
    const paymentRegisterRows: PaymentRegisterRow[] = filteredPayments.map((p) => {
      const student = studentIdMap.get(p.studentId) || studentDocIdMap.get(p.studentId);
      const fee = feeMap.get(p.feeId);
      const studentName =
        p.studentName ||
        (student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown Student');
      const admissionNumber = p.admissionNumber || student?.admissionNumber || student?.studentId || '-';
      const className = p.className || fee?.className || student?.className || 'Unassigned';
      const section = p.section || fee?.section || student?.section || 'A';
      const receiptNumber = p.receiptNumber || p.transactionId || p.id.slice(0, 8).toUpperCase();
      const amount = Number(p.amount) || 0;
      const method = formatPaymentMethod(p.method);
      const reference = p.transactionId || p.notes || p.gateway || '-';
      const paymentAcademicYear = fee?.academicYear || student?.academicYear || '2026-2027';

      return {
        id: p.id,
        receiptNumber,
        paidAt: p.paidAt || p.createdAt || '',
        studentId: p.studentId || '-',
        studentName,
        admissionNumber,
        className,
        section,
        amount,
        method,
        reference,
        academicYear: paymentAcademicYear,
        status: p.status || 'success',
      };
    });

    // D. Detailed Admissions Pipeline
    const admissionsReportRows: AdmissionsReportRow[] = filteredInquiries.map((inq) => ({
      id: inq.id || Math.random().toString(36).substring(2, 9),
      studentName: inq.studentName || 'Unnamed Applicant',
      parentName: inq.parentName || '-',
      phone: inq.phone || '-',
      email: inq.email || '-',
      gradeApplying: inq.gradeApplying || 'General',
      status: inq.status || 'pending',
      createdAt: inq.createdAt || '',
      notes: inq.notes || inq.message || '',
      previousSchool: inq.previousSchool || '',
      address: inq.address || '',
    }));

    // E. Detailed Academic Results
    const academicReportRows: AcademicReportRow[] = filteredResults.map((r) => {
      const student = studentIdMap.get(r.studentId) || studentDocIdMap.get(r.studentId);
      const exam = examMap.get(r.examId);
      const studentName =
        r.studentName ||
        (student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Candidate');
      const admissionNumber = r.admissionNumber || student?.admissionNumber || student?.studentId || '-';
      const className = r.className || exam?.className || student?.className || 'Unassigned';
      const section = r.section || exam?.section || student?.section || 'A';
      const rollNumber = r.rollNumber || student?.rollNumber || '-';
      const examName = r.examName || exam?.name || 'Examination';
      const examType = (exam?.examType || 'General').replace('_', ' ');
      const academicYear = r.academicYear || exam?.academicYear || student?.academicYear || '2026-2027';
      const totalMarks = Number(r.totalMarks) || 0;
      const totalMaxMarks = Number(r.totalMaxMarks) || 100;
      const percentage = Number(r.percentage) || 0;
      const grade = r.grade || calculateGrade(percentage).grade || 'E';
      const resultStatus = r.resultStatus || (percentage >= 33 ? 'passed' : 'failed');
      const published = r.published !== false;
      const examDate = exam?.startDate || exam?.resultDate || exam?.createdAt || r.createdAt || '';

      return {
        id: r.id,
        studentId: r.studentId || '-',
        studentName,
        admissionNumber,
        className,
        section,
        rollNumber,
        examId: r.examId || '-',
        examName,
        examType,
        academicYear,
        totalMarks,
        totalMaxMarks,
        percentage,
        grade,
        resultStatus,
        published,
        examDate,
      };
    });

    const detailed: DetailedReportsData = {
      students: studentReportRows,
      fees: feeReportRows,
      payments: paymentRegisterRows,
      admissions: admissionsReportRows,
      academics: academicReportRows,
      availableClasses,
      availableSections,
      rawExams: filteredExams,
      rawResults: filteredResults,
      rawStudents: filteredStudents,
    };

    return {
      academicYearFilter: selectedSession,
      availableSessions,
      kpis,
      academic: academicSummary,
      financial: financialSummary,
      admissions: admissionsSummary,
      enrollment: enrollmentSummary,
      detailed,
      lastUpdated: new Date().toISOString(),
    };
  },
};

