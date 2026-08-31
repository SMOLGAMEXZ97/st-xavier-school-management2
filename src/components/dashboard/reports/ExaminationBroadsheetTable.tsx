import React, { useState, useMemo } from 'react';
import {
  Exam,
  ExamResult,
  Student,
  SubjectMarks,
  ExamSubjectConfig,
  ExamResultStatus,
} from '../../../types';
import {
  Search,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Eye,
  EyeOff,
  GraduationCap,
  Calendar,
  Table as TableIcon,
  Filter,
  Layers,
  User,
  HelpCircle,
} from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';
import {
  isDateInRange,
  formatDateRangeDisplay,
  getDateRangeFileSuffix,
  formatDateToDisplay,
} from '../../../utils/dateUtils';
import {
  calculateGrade,
  evaluateResultStatus,
  getDefaultSubjectsForClass,
  EXAM_TYPE_LABELS,
} from '../../../utils/gradeUtils';
import { ReportPrintHeader } from './ReportPrintHeader';
import { ReportExportActions } from './ReportExportActions';
import { DateRangeFilter } from './DateRangeFilter';

interface ExaminationBroadsheetTableProps {
  exams?: Exam[];
  results?: ExamResult[];
  students?: Student[];
  availableClasses: string[];
  availableSections: string[];
  availableSessions: string[];
  selectedSession: string;
  onSessionChange: (session: string) => void;
  userRole?: string;
}

interface StudentBroadsheetRow {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  rollNumber: string;
  subjectMarks: Record<
    string,
    {
      marksObtained?: number;
      maxMarks: number;
      passMarks: number;
      isAbsent: boolean;
      isMissing: boolean;
      grade?: string;
    }
  >;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number | null;
  grade: string;
  resultStatus: ExamResultStatus | 'not_entered';
  isAssessed: boolean;
  isPublished: boolean;
  resultId?: string;
}

export const ExaminationBroadsheetTable: React.FC<ExaminationBroadsheetTableProps> = ({
  exams = [],
  results = [],
  students = [],
  availableClasses,
  availableSections,
  availableSessions,
  selectedSession,
  onSessionChange,
  userRole,
}) => {
  // 1. Filter exams by selected session if not 'all'
  const sessionFilteredExams = useMemo(() => {
    if (selectedSession === 'all' || !selectedSession) {
      return exams;
    }
    return exams.filter(
      (e) => (e.academicYear || '').trim().toLowerCase() === selectedSession.trim().toLowerCase()
    );
  }, [exams, selectedSession]);

  // Selected Exam ID state (default to first available exam)
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Synchronize selectedExamId when sessionFilteredExams changes
  const activeExam = useMemo(() => {
    if (!sessionFilteredExams || sessionFilteredExams.length === 0) {
      return null;
    }
    const found = sessionFilteredExams.find((e) => e.id === selectedExamId);
    return found || sessionFilteredExams[0];
  }, [sessionFilteredExams, selectedExamId]);

  // Keep selectedExamId in sync
  React.useEffect(() => {
    if (activeExam && activeExam.id !== selectedExamId) {
      setSelectedExamId(activeExam.id);
    }
  }, [activeExam, selectedExamId]);

  // 2. Filters & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<'roll' | 'name' | 'total' | 'percentage' | 'grade' | 'result'>('roll');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 3. Dynamic Subject Configuration for active exam
  const examSubjects: ExamSubjectConfig[] = useMemo(() => {
    if (!activeExam) return [];
    if (activeExam.subjects && activeExam.subjects.length > 0) {
      return activeExam.subjects;
    }
    // Fallback based on class
    return getDefaultSubjectsForClass(activeExam.className || 'Class 10');
  }, [activeExam]);

  // Active exam date for date-range filter
  const activeExamDate = useMemo(() => {
    if (!activeExam) return '';
    return activeExam.startDate || activeExam.resultDate || activeExam.createdAt || '';
  }, [activeExam]);

  // 4. Build Complete Student Roster & Marks Matrix for the active exam
  const broadsheetRows: StudentBroadsheetRow[] = useMemo(() => {
    if (!activeExam) return [];

    // Filter students by exam's target class and section
    const examTargetClass = (activeExam.className || '').trim().toLowerCase();
    const examTargetSection = (activeExam.section || '').trim().toUpperCase();

    // Map existing results for this exam
    const examResults = results.filter((r) => r.examId === activeExam.id);
    const resultMapByStudentId = new Map<string, ExamResult>();
    const resultMapByAdmissionNo = new Map<string, ExamResult>();

    examResults.forEach((res) => {
      if (res.studentId) resultMapByStudentId.set(res.studentId, res);
      if (res.admissionNumber) resultMapByAdmissionNo.set(res.admissionNumber.trim().toUpperCase(), res);
    });

    // Identify all matching students from student directory
    const matchingStudents: Student[] = students.filter((s) => {
      // If exam is class-specific
      if (examTargetClass && examTargetClass !== 'all classes' && examTargetClass !== 'all') {
        const studentCls = (s.className || '').trim().toLowerCase();
        if (studentCls !== examTargetClass && !studentCls.includes(examTargetClass)) {
          return false;
        }
      }
      // If exam is section-specific
      if (examTargetSection && examTargetSection !== 'ALL') {
        const studentSec = (s.section || '').trim().toUpperCase();
        if (studentSec !== examTargetSection) {
          return false;
        }
      }
      return true;
    });

    // In case students with existing results are not found in `matchingStudents`, add them
    const studentIdsInRoster = new Set(matchingStudents.map((s) => s.id || s.studentId));
    examResults.forEach((res) => {
      const matchFound =
        (res.studentId && studentIdsInRoster.has(res.studentId)) ||
        (res.admissionNumber && matchingStudents.some((s) => (s.admissionNumber || '').trim().toUpperCase() === res.admissionNumber?.trim().toUpperCase()));

      if (!matchFound) {
        // Synthesize student placeholder for orphaned result
        matchingStudents.push({
          id: res.studentId || res.id,
          studentId: res.studentId || res.id,
          admissionNumber: res.admissionNumber || '-',
          firstName: res.studentName || 'Candidate',
          lastName: '',
          className: res.className || activeExam.className || 'Unassigned',
          section: res.section || activeExam.section || 'A',
          rollNumber: res.rollNumber || '-',
          academicYear: res.academicYear || activeExam.academicYear || selectedSession,
          gender: 'Other',
          dateOfBirth: '',
          address: '',
          guardianName: '-',
          guardianPhone: '-',
          guardianRelationship: 'Guardian',
          active: true,
          admissionDate: '',
          createdAt: res.createdAt,
          updatedAt: res.createdAt,
        });
      }
    });

    // Construct broadsheet row for each student
    return matchingStudents.map((s) => {
      const studentFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed Student';
      const studentAdmNo = (s.admissionNumber || s.studentId || '-').trim();
      const studentClass = s.className || activeExam.className || 'Unassigned';
      const studentSection = s.section || activeExam.section || 'A';
      const studentRoll = (s.rollNumber || '-').trim();

      // Retrieve result record if present
      const res =
        resultMapByStudentId.get(s.id) ||
        resultMapByStudentId.get(s.studentId) ||
        resultMapByAdmissionNo.get(studentAdmNo.toUpperCase());

      const subjectMarksMap: StudentBroadsheetRow['subjectMarks'] = {};
      let totalObtained = 0;
      let totalMax = 0;
      let hasAnyEvaluatedSubject = false;
      const subjectMarksListForGrading: SubjectMarks[] = [];

      examSubjects.forEach((subj) => {
        const configuredMax = Number(subj.maxMarks) || 100;
        const configuredPass = subj.passMarks !== undefined ? Number(subj.passMarks) : Math.round(configuredMax * 0.33);

        totalMax += configuredMax;

        if (res && res.subjects) {
          // Find subject entry (exact or case-insensitive)
          const directEntry = res.subjects[subj.subjectName];
          const foundKey = Object.keys(res.subjects).find(
            (k) => k.toLowerCase().trim() === subj.subjectName.toLowerCase().trim()
          );
          const entry = directEntry || (foundKey ? res.subjects[foundKey] : undefined);

          if (entry) {
            hasAnyEvaluatedSubject = true;
            const isAbsent = !!entry.isAbsent;
            const marksObt = isAbsent ? 0 : Number(entry.marksObtained) || 0;

            if (!isAbsent) {
              totalObtained += marksObt;
            }

            subjectMarksMap[subj.subjectName] = {
              marksObtained: isAbsent ? undefined : marksObt,
              maxMarks: configuredMax,
              passMarks: configuredPass,
              isAbsent,
              isMissing: false,
              grade: entry.grade,
            };

            subjectMarksListForGrading.push({
              subjectName: subj.subjectName,
              marksObtained: marksObt,
              maxMarks: configuredMax,
              passMarks: configuredPass,
              isAbsent,
            });
            return;
          }
        }

        // Missing / Not Entered subject
        subjectMarksMap[subj.subjectName] = {
          marksObtained: undefined,
          maxMarks: configuredMax,
          passMarks: configuredPass,
          isAbsent: false,
          isMissing: true,
        };
      });

      // Overall calculations
      if (!hasAnyEvaluatedSubject && !res) {
        return {
          studentId: s.studentId || s.id,
          studentName: studentFullName,
          admissionNumber: studentAdmNo,
          className: studentClass,
          section: studentSection,
          rollNumber: studentRoll,
          subjectMarks: subjectMarksMap,
          totalMarks: 0,
          totalMaxMarks: totalMax,
          percentage: null,
          grade: '—',
          resultStatus: 'not_entered',
          isAssessed: false,
          isPublished: false,
        };
      }

      // Percentage and grading
      const calculatedPct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
      const finalPercentage = res?.percentage !== undefined ? Number(res.percentage) : calculatedPct;
      const finalGrade = res?.grade || calculateGrade(finalPercentage).grade || 'E';
      const evaluatedStatus =
        res?.resultStatus ||
        evaluateResultStatus(subjectMarksListForGrading, finalPercentage);

      return {
        studentId: s.studentId || s.id,
        studentName: studentFullName,
        admissionNumber: studentAdmNo,
        className: studentClass,
        section: studentSection,
        rollNumber: studentRoll,
        subjectMarks: subjectMarksMap,
        totalMarks: res?.totalMarks !== undefined ? Number(res.totalMarks) : totalObtained,
        totalMaxMarks: res?.totalMaxMarks !== undefined ? Number(res.totalMaxMarks) : totalMax,
        percentage: finalPercentage,
        grade: finalGrade,
        resultStatus: evaluatedStatus,
        isAssessed: true,
        isPublished: res?.published ?? (activeExam.status === 'published'),
        resultId: res?.id,
      };
    });
  }, [activeExam, results, students, examSubjects, selectedSession]);

  // 5. Filter & Sort Broadsheet Rows
  const filteredRows = useMemo(() => {
    return broadsheetRows
      .filter((row) => {
        // Search filter (Name, Admission No, Roll No)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = row.studentName.toLowerCase().includes(q);
          const matchAdm = row.admissionNumber.toLowerCase().includes(q);
          const matchRoll = row.rollNumber.toLowerCase().includes(q);
          if (!matchName && !matchAdm && !matchRoll) return false;
        }

        // Class filter
        if (selectedClass !== 'all' && row.className !== selectedClass) {
          return false;
        }

        // Section filter
        if (selectedSection !== 'all' && row.section.toUpperCase() !== selectedSection.toUpperCase()) {
          return false;
        }

        // Result Status filter
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'not_entered' && row.resultStatus !== 'not_entered') return false;
          if (selectedStatus === 'passed' && row.resultStatus !== 'passed' && row.resultStatus !== 'promoted') return false;
          if (selectedStatus === 'failed' && row.resultStatus !== 'failed') return false;
          if (selectedStatus === 'compartment' && row.resultStatus !== 'compartment') return false;
          if (selectedStatus === 'absent' && row.resultStatus !== 'absent') return false;
        }

        // Date Range (filters by examination date)
        if (activeExamDate && !isDateInRange(activeExamDate, fromISO, toISO)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'roll') {
          const rollA = parseInt(a.rollNumber, 10);
          const rollB = parseInt(b.rollNumber, 10);
          if (!isNaN(rollA) && !isNaN(rollB)) {
            return sortOrder === 'asc' ? rollA - rollB : rollB - rollA;
          }
          const cmp = a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
          if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
          return a.studentName.localeCompare(b.studentName);
        }

        if (sortField === 'name') {
          const cmp = a.studentName.localeCompare(b.studentName);
          return sortOrder === 'asc' ? cmp : -cmp;
        }

        if (sortField === 'total') {
          const valA = a.totalMarks ?? 0;
          const valB = b.totalMarks ?? 0;
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (sortField === 'percentage') {
          const valA = a.percentage ?? -1;
          const valB = b.percentage ?? -1;
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (sortField === 'grade') {
          const cmp = a.grade.localeCompare(b.grade);
          return sortOrder === 'asc' ? cmp : -cmp;
        }

        if (sortField === 'result') {
          const cmp = a.resultStatus.localeCompare(b.resultStatus);
          return sortOrder === 'asc' ? cmp : -cmp;
        }

        return 0;
      });
  }, [
    broadsheetRows,
    searchQuery,
    selectedClass,
    selectedSection,
    selectedStatus,
    activeExamDate,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  // 6. Aggregate Performance Statistics
  const classSummary = useMemo(() => {
    const totalRoster = filteredRows.length;
    const assessedList = filteredRows.filter((r) => r.isAssessed);
    const totalAssessed = assessedList.length;

    let passedCount = 0;
    let compartmentCount = 0;
    let failedCount = 0;
    let absentCount = 0;
    let notEnteredCount = 0;
    let highestPct = 0;
    let lowestPct = 100;
    let sumPercentage = 0;

    filteredRows.forEach((r) => {
      if (!r.isAssessed || r.resultStatus === 'not_entered') {
        notEnteredCount++;
      } else if (r.resultStatus === 'absent') {
        absentCount++;
      } else if (r.resultStatus === 'passed' || r.resultStatus === 'promoted') {
        passedCount++;
      } else if (r.resultStatus === 'compartment') {
        compartmentCount++;
      } else {
        failedCount++;
      }

      if (r.percentage !== null && r.resultStatus !== 'absent') {
        sumPercentage += r.percentage;
        if (r.percentage > highestPct) highestPct = r.percentage;
        if (r.percentage < lowestPct) lowestPct = r.percentage;
      }
    });

    const evaluatedStudentsWithScores = assessedList.filter(
      (r) => r.percentage !== null && r.resultStatus !== 'absent'
    );
    const averagePercentage =
      evaluatedStudentsWithScores.length > 0
        ? Number((sumPercentage / evaluatedStudentsWithScores.length).toFixed(1))
        : 0;

    const passRate =
      totalAssessed > 0 ? Math.round((passedCount / totalAssessed) * 100) : 0;

    return {
      totalRoster,
      totalAssessed,
      passedCount,
      compartmentCount,
      failedCount,
      absentCount,
      notEnteredCount,
      averagePercentage,
      passRate,
      highestPercentage: assessedList.length > 0 && highestPct > 0 ? highestPct : 0,
      lowestPercentage: assessedList.length > 0 && lowestPct <= 100 && lowestPct >= 0 ? lowestPct : 0,
    };
  }, [filteredRows]);

  // 7. Subject-Wise Analytics Breakdown
  const subjectAnalytics = useMemo(() => {
    return examSubjects.map((subj) => {
      let assessedCount = 0;
      let passedCount = 0;
      let failedCount = 0;
      let totalMarksSum = 0;
      let absentCount = 0;

      filteredRows.forEach((r) => {
        const sm = r.subjectMarks[subj.subjectName];
        if (!sm || sm.isMissing) return;

        if (sm.isAbsent) {
          absentCount++;
          failedCount++;
          assessedCount++;
          return;
        }

        if (sm.marksObtained !== undefined) {
          assessedCount++;
          totalMarksSum += sm.marksObtained;
          if (sm.marksObtained >= sm.passMarks) {
            passedCount++;
          } else {
            failedCount++;
          }
        }
      });

      const avgMarks = assessedCount > 0 ? Number((totalMarksSum / (assessedCount - absentCount || 1)).toFixed(1)) : 0;
      const avgPercentage = subj.maxMarks > 0 ? Number(((avgMarks / subj.maxMarks) * 100).toFixed(1)) : 0;
      const passPct = assessedCount > 0 ? Math.round((passedCount / assessedCount) * 100) : 0;

      return {
        subjectName: subj.subjectName,
        maxMarks: subj.maxMarks,
        passMarks: subj.passMarks ?? Math.round(subj.maxMarks * 0.33),
        assessedCount,
        passedCount,
        failedCount,
        absentCount,
        avgMarks,
        avgPercentage,
        passPct,
      };
    });
  }, [examSubjects, filteredRows]);

  // 8. Sorting Handler
  const handleSort = (field: 'roll' | 'name' | 'total' | 'percentage' | 'grade' | 'result') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'roll' || field === 'name' ? 'asc' : 'desc');
    }
  };

  // Clear filters
  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
    setFromISO('');
    setToISO('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedStatus('all');
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedClass !== 'all' ||
    selectedSection !== 'all' ||
    selectedStatus !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Applied Filters Summary for Print
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (activeExam) {
      summary.push(`Exam: ${activeExam.name}`);
      summary.push(`Class: ${activeExam.className || 'All'}`);
      if (activeExam.section && activeExam.section !== 'All') {
        summary.push(`Section: ${activeExam.section}`);
      }
    }
    if (selectedSection !== 'all') summary.push(`Section Filter: ${selectedSection}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Date: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [activeExam, selectedSection, selectedStatus, fromDate, toDate, searchQuery]);

  // 9. CSV Export Handler
  const handleExportCSV = () => {
    if (!activeExam) return;

    // Headers
    const headers = [
      'Roll No.',
      'Student Name',
      'Admission No.',
      'Class',
      'Section',
      'Academic Session',
      ...examSubjects.map((s) => `${s.subjectName} (Max: ${s.maxMarks})`),
      'Total Marks',
      'Max Marks',
      'Percentage (%)',
      'Grade',
      'Result Status',
    ];

    // Data rows
    const rows = filteredRows.map((r) => {
      const subjectCols = examSubjects.map((s) => {
        const sm = r.subjectMarks[s.subjectName];
        if (!sm || sm.isMissing) return '—';
        if (sm.isAbsent) return 'AB';
        return sm.marksObtained !== undefined ? sm.marksObtained : '—';
      });

      return [
        r.rollNumber || '—',
        r.studentName,
        r.admissionNumber,
        r.className,
        r.section,
        activeExam.academicYear || selectedSession,
        ...subjectCols,
        r.isAssessed ? r.totalMarks : '—',
        r.totalMaxMarks,
        r.percentage !== null ? `${r.percentage}%` : '—',
        r.grade,
        r.resultStatus.toUpperCase().replace('_', ' '),
      ];
    });

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    const cleanExamName = (activeExam.name || 'examination')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    exportToCSV(`broadsheet-${cleanExamName}`, headers, rows, dateSuffix);
  };

  // Render Grade Badge
  const renderGradeBadge = (grade: string) => {
    const gr = grade.toUpperCase().trim();
    if (gr === 'A1') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">A1</span>;
    if (gr === 'A2') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">A2</span>;
    if (gr === 'B1') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">B1</span>;
    if (gr === 'B2') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">B2</span>;
    if (gr === 'C1') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">C1</span>;
    if (gr === 'C2') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">C2</span>;
    if (gr === 'D') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-800">D</span>;
    if (gr === 'E') return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">E</span>;
    return <span className="text-slate-400 text-xs font-semibold">—</span>;
  };

  // Render Result Status Badge
  const renderStatusBadge = (status: ExamResultStatus | 'not_entered') => {
    const st = (status || '').toLowerCase();
    if (st === 'passed' || st === 'promoted') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Pass
        </span>
      );
    }
    if (st === 'compartment') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          Compartment
        </span>
      );
    }
    if (st === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Fail
        </span>
      );
    }
    if (st === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <HelpCircle className="w-3 h-3 text-slate-500" />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Not Entered
      </span>
    );
  };

  return (
    <div className="space-y-6" id="examination-broadsheet-container">
      {/* Official Print Header */}
      <ReportPrintHeader
        reportTitle={`OFFICIAL EXAMINATION BROADSHEET • ${activeExam?.name || 'EXAMINATION MATRIX'}`}
        academicSession={activeExam?.academicYear || selectedSession}
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Roster Students', value: classSummary.totalRoster },
          { label: 'Assessed', value: classSummary.totalAssessed },
          { label: 'Passed', value: `${classSummary.passedCount} (${classSummary.passRate}%)` },
          { label: 'Compartment', value: classSummary.compartmentCount },
          { label: 'Failed', value: classSummary.failedCount },
          { label: 'Class Average', value: `${classSummary.averagePercentage}%` },
        ]}
      />

      {/* Control Panel / Filter Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4 print:hidden">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                <TableIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Examination Broadsheet
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive class-wide marks matrix with dynamic subject breakdowns, totals, and CBSE grade scale.
                </p>
              </div>
            </div>
          </div>

          {/* Export & Print Actions */}
          <ReportExportActions
            idPrefix="examination-broadsheet"
            recordCount={filteredRows.length}
            onExportCSV={handleExportCSV}
          />
        </div>

        {/* Examination Selector & Session Bar */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Examination Schedule
            </label>
            <div className="relative">
              <select
                id="broadsheet-exam-selector"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {sessionFilteredExams.length === 0 ? (
                  <option value="">No examinations found for this academic session</option>
                ) : (
                  sessionFilteredExams.map((exam) => {
                    const formattedDate = exam.startDate ? formatDateToDisplay(exam.startDate) : '';
                    return (
                      <option key={exam.id} value={exam.id}>
                        {exam.name} • {exam.className} ({exam.section || 'All'}) • {exam.academicYear}
                        {formattedDate ? ` • [${formattedDate}]` : ''} • ({exam.status.toUpperCase()})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          {/* Active Exam Metadata Badge Box */}
          {activeExam && (
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 self-start md:self-end">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Class: <strong className="text-slate-900">{activeExam.className}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Section: <strong className="text-slate-900">{activeExam.section || 'All'}</strong>
              </span>
              {activeExam.startDate && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  Date: <strong className="text-slate-900">{formatDateToDisplay(activeExam.startDate)}</strong>
                </span>
              )}
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  activeExam.status === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {activeExam.status === 'published' ? 'Published' : 'Draft / Completed'}
              </span>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="broadsheet-search-input"
              type="text"
              placeholder="Search Student, Adm No, Roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Section Filter */}
          <div>
            <select
              id="broadsheet-section-filter"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Result Status Filter */}
          <div>
            <select
              id="broadsheet-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Result Statuses</option>
              <option value="passed">Passed / Promoted</option>
              <option value="compartment">Compartment</option>
              <option value="failed">Failed</option>
              <option value="absent">Absent</option>
              <option value="not_entered">Not Entered</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              id="broadsheet-clear-filters-btn"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Date Range Filter Section */}
        <div className="pt-2 border-t border-slate-100">
          <DateRangeFilter
            idPrefix="broadsheet-date-filter"
            label="Examination Date Range"
            fromDate={fromDate}
            toDate={toDate}
            fromISO={fromISO}
            toISO={toISO}
            onChange={(range) => {
              setFromDate(range.fromDate);
              setToDate(range.toDate);
              setFromISO(range.fromISO);
              setToISO(range.toISO);
            }}
            onClear={clearDateRange}
          />
        </div>
      </div>

      {/* Class Overview Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" id="broadsheet-class-summary-bar">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Class Roster</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{classSummary.totalRoster}</div>
          <div className="text-[10px] text-slate-400">Total enrolled</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Assessed</div>
          <div className="text-lg font-bold text-blue-900 mt-1">{classSummary.totalAssessed}</div>
          <div className="text-[10px] text-blue-700 font-medium">
            {classSummary.totalRoster > 0
              ? `${Math.round((classSummary.totalAssessed / classSummary.totalRoster) * 100)}% evaluated`
              : '0%'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Passed</div>
          <div className="text-lg font-bold text-emerald-700 mt-1">{classSummary.passedCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">{classSummary.passRate}% Pass Rate</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Compartment</div>
          <div className="text-lg font-bold text-amber-700 mt-1">{classSummary.compartmentCount}</div>
          <div className="text-[10px] text-amber-600">Eligible re-test</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Failed</div>
          <div className="text-lg font-bold text-rose-700 mt-1">{classSummary.failedCount}</div>
          <div className="text-[10px] text-rose-600">Needs improvement</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Absent</div>
          <div className="text-lg font-bold text-slate-700 mt-1">{classSummary.absentCount}</div>
          <div className="text-[10px] text-slate-400">Not appeared</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Class Average</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{classSummary.averagePercentage}%</div>
          <div className="text-[10px] text-slate-400">Mean scorecard</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase">Range (Hi / Lo)</div>
          <div className="text-xs font-bold text-slate-900 mt-2">
            <span className="text-emerald-700">{classSummary.highestPercentage}%</span> /{' '}
            <span className="text-rose-700">{classSummary.lowestPercentage}%</span>
          </div>
          <div className="text-[10px] text-slate-400">Class spread</div>
        </div>
      </div>

      {/* Main Broadsheet Marks Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs border-collapse"
            id="examination-broadsheet-matrix-table"
          >
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                <th
                  onClick={() => handleSort('roll')}
                  className="py-3 px-3 w-14 cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Roll</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'roll' ? 'text-blue-700' : 'text-slate-400'}`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 min-w-[180px] cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'name' ? 'text-blue-700' : 'text-slate-400'}`}
                    />
                  </div>
                </th>

                <th className="py-3 px-3 min-w-[100px] whitespace-nowrap text-slate-600">
                  Adm No.
                </th>

                <th className="py-3 px-2.5 min-w-[75px] whitespace-nowrap text-slate-600">
                  Class/Sec
                </th>

                {/* DYNAMIC SUBJECT COLUMNS */}
                {examSubjects.map((subj) => (
                  <th
                    key={subj.subjectName}
                    className="py-3 px-3 text-center border-l border-slate-200 bg-slate-50/80 min-w-[110px]"
                  >
                    <div className="font-semibold text-slate-900 truncate max-w-[130px] mx-auto" title={subj.subjectName}>
                      {subj.subjectName}
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">
                      (Max: {subj.maxMarks} • Pass: {subj.passMarks ?? Math.round(subj.maxMarks * 0.33)})
                    </div>
                  </th>
                ))}

                {/* TOTAL & PERFORMANCE COLUMNS */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-3 px-3 text-center border-l border-slate-200 bg-blue-50/50 cursor-pointer hover:bg-blue-100/60 transition-colors min-w-[90px]"
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-blue-950">
                    <span>Total</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'total' ? 'text-blue-900' : 'text-slate-400'}`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-3 text-center bg-blue-50/50 cursor-pointer hover:bg-blue-100/60 transition-colors min-w-[75px]"
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-blue-950">
                    <span>%</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'percentage' ? 'text-blue-900' : 'text-slate-400'}`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('grade')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors min-w-[65px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Grade</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'grade' ? 'text-blue-700' : 'text-slate-400'}`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('result')}
                  className="py-3 px-3.5 text-center cursor-pointer hover:bg-slate-200 transition-colors min-w-[110px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Result</span>
                    <ChevronDown
                      className={`w-3 h-3 ${sortField === 'result' ? 'text-blue-700' : 'text-slate-400'}`}
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + examSubjects.length}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">
                        No students or examination marks match the active criteria.
                      </p>
                      <p className="text-xs text-slate-400">
                        Try selecting a different examination, session, or clearing active filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold text-xs hover:bg-blue-100 transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  return (
                    <tr
                      key={row.studentId || idx}
                      className="hover:bg-slate-50/80 transition-colors text-slate-800"
                    >
                      {/* Roll */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {row.rollNumber || idx + 1}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{row.studentName}</div>
                      </td>

                      {/* Admission Number */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {row.admissionNumber}
                      </td>

                      {/* Class & Section */}
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {row.className} • {row.section}
                      </td>

                      {/* DYNAMIC SUBJECT MARKS */}
                      {examSubjects.map((subj) => {
                        const sm = row.subjectMarks[subj.subjectName];
                        if (!sm || sm.isMissing) {
                          return (
                            <td
                              key={subj.subjectName}
                              className="py-2.5 px-3 text-center border-l border-slate-100 text-slate-400"
                              title="Marks Not Entered"
                            >
                              —
                            </td>
                          );
                        }

                        if (sm.isAbsent) {
                          return (
                            <td
                              key={subj.subjectName}
                              className="py-2.5 px-3 text-center border-l border-slate-100"
                              title="Absent"
                            >
                              <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                                AB
                              </span>
                            </td>
                          );
                        }

                        const marks = sm.marksObtained ?? 0;
                        const isFail = marks < sm.passMarks;

                        return (
                          <td
                            key={subj.subjectName}
                            className="py-2.5 px-3 text-center border-l border-slate-100 font-mono"
                          >
                            <span
                              className={`font-semibold ${
                                isFail
                                  ? 'text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]'
                                  : 'text-slate-800'
                              }`}
                              title={`${subj.subjectName}: ${marks} / ${sm.maxMarks}`}
                            >
                              {marks}
                            </span>
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {row.isAssessed ? (
                          <span>
                            {row.totalMarks}
                            <span className="text-[10px] text-slate-400 font-normal">
                              /{row.totalMaxMarks}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 bg-slate-50/50">
                        {row.percentage !== null ? (
                          <span
                            className={
                              row.percentage >= 75
                                ? 'text-emerald-700'
                                : row.percentage >= 50
                                ? 'text-blue-700'
                                : row.percentage >= 33
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }
                          >
                            {row.percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td className="py-2.5 px-3 text-center">
                        {renderGradeBadge(row.grade)}
                      </td>

                      {/* Result Status */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {renderStatusBadge(row.resultStatus)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Counter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 p-3 bg-slate-50/80 border-t border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-800">{filteredRows.length}</strong> of{' '}
              <strong className="text-slate-800">{broadsheetRows.length}</strong> students in broadsheet
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Legend: <strong className="text-amber-700">AB</strong> = Absent •{' '}
              <strong className="text-rose-700">Red Highlight</strong> = Below Passing Marks •{' '}
              <strong className="text-slate-400">—</strong> = Marks Not Entered
            </span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3" id="broadsheet-subject-summary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Subject-Wise Performance Summary
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Aggregated across {filteredRows.length} students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-y border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3 text-center">Max Marks</th>
                <th className="py-2.5 px-3 text-center">Pass Marks</th>
                <th className="py-2.5 px-3 text-center">Assessed</th>
                <th className="py-2.5 px-3 text-center">Passed</th>
                <th className="py-2.5 px-3 text-center">Failed / Compartment</th>
                <th className="py-2.5 px-3 text-center">Average Marks</th>
                <th className="py-2.5 px-3 text-center">Avg %</th>
                <th className="py-2.5 px-3 text-center">Subject Pass %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {subjectAnalytics.map((sa) => (
                <tr key={sa.subjectName} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{sa.subjectName}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sa.maxMarks}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sa.passMarks}</td>
                  <td className="py-2.5 px-3 text-center font-semibold">{sa.assessedCount}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{sa.passedCount}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-rose-700">
                    {sa.failedCount} {sa.absentCount > 0 ? `(${sa.absentCount} AB)` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                    {sa.avgMarks} / {sa.maxMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-900">{sa.avgPercentage}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        sa.passPct >= 80
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : sa.passPct >= 60
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {sa.passPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
