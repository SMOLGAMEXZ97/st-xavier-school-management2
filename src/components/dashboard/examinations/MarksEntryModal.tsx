import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Globe,
  Lock,
  Sparkles,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import { Exam, ExamResult, Student, SubjectMarks, ExamSubjectConfig } from '../../../types';
import {
  calculateGrade,
  calculateSubjectGrade,
  evaluateResultStatus,
  getDefaultSubjectsForClass,
} from '../../../utils/gradeUtils';
import { examService } from '../../../services/examService';
import { ReportCardModal } from './ReportCardModal';

interface MarksEntryModalProps {
  exam: Exam;
  students: Student[];
  onClose: () => void;
  onResultsSaved?: () => void;
}

interface StudentEntryState {
  student: Student;
  resultId?: string;
  subjects: Record<string, SubjectMarks>;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  resultStatus: 'passed' | 'failed' | 'compartment' | 'absent' | 'promoted' | 'withheld';
  rank?: number;
  attendance?: string;
  teacherRemarks?: string;
  published: boolean;
  isDirty?: boolean;
}

export const MarksEntryModal: React.FC<MarksEntryModalProps> = ({
  exam,
  students,
  onClose,
  onResultsSaved,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'individual' | 'grid'>('individual');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview Report Card modal state
  const [previewResult, setPreviewResult] = useState<ExamResult | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  // Subject configs for this exam
  const examSubjects: ExamSubjectConfig[] = useMemo(() => {
    if (exam.subjects && exam.subjects.length > 0) {
      return exam.subjects;
    }
    return getDefaultSubjectsForClass(exam.className || 'Class 10');
  }, [exam]);

  // Filter students by class and section if specified
  const targetStudents = useMemo(() => {
    return students.filter((s) => {
      // If exam class is not 'All Classes', match class
      if (exam.className && exam.className !== 'All Classes') {
        const studentCls = (s.className || '').toLowerCase().replace(/\s+/g, '');
        const examCls = exam.className.toLowerCase().replace(/\s+/g, '');
        if (!studentCls.includes(examCls) && !examCls.includes(studentCls)) {
          return false;
        }
      }
      // If exam section is specified and not 'All'
      if (exam.section && exam.section !== 'All') {
        if ((s.section || '').toUpperCase() !== exam.section.toUpperCase()) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Sort by roll number or admission number
      const rollA = parseInt(a.rollNumber || '0', 10);
      const rollB = parseInt(b.rollNumber || '0', 10);
      if (rollA && rollB) return rollA - rollB;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [students, exam]);

  // Master local state for all students' mark entries
  const [entries, setEntries] = useState<StudentEntryState[]>([]);

  // Load existing results from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const existingResults = await examService.getResultsByExamId(exam.id);
        const resultMap = new Map<string, ExamResult>();
        existingResults.forEach((r) => {
          resultMap.set(r.studentId, r);
        });

        const initialEntries: StudentEntryState[] = targetStudents.map((st) => {
          const existing = resultMap.get(st.studentId || st.id);

          // Build subjects mapping with defaults
          const subjectsState: Record<string, SubjectMarks> = {};
          let totalObtained = 0;
          let totalMax = 0;
          const subjectListForEval: SubjectMarks[] = [];

          examSubjects.forEach((cfg) => {
            const max = cfg.maxMarks || 100;
            const pass = cfg.passMarks ?? Math.round(max * 0.33);
            const saved = existing?.subjects?.[cfg.subjectName];

            if (saved) {
              subjectsState[cfg.subjectName] = {
                subjectName: cfg.subjectName,
                marksObtained: Number(saved.marksObtained) || 0,
                maxMarks: max,
                passMarks: pass,
                grade: saved.grade || calculateSubjectGrade(Number(saved.marksObtained) || 0, max, saved.isAbsent).grade,
                isAbsent: !!saved.isAbsent,
                remarks: saved.remarks || '',
              };
              if (!saved.isAbsent) {
                totalObtained += Number(saved.marksObtained) || 0;
              }
            } else {
              // Default empty marks
              subjectsState[cfg.subjectName] = {
                subjectName: cfg.subjectName,
                marksObtained: 0,
                maxMarks: max,
                passMarks: pass,
                grade: 'E',
                isAbsent: false,
                remarks: '',
              };
            }
            totalMax += max;
            subjectListForEval.push(subjectsState[cfg.subjectName]);
          });

          const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
          const grade = existing?.grade || calculateGrade(pct).grade;
          const status = existing?.resultStatus || evaluateResultStatus(subjectListForEval, pct);

          return {
            student: st,
            resultId: existing?.id,
            subjects: subjectsState,
            totalMarks: existing?.totalMarks ?? totalObtained,
            totalMaxMarks: totalMax,
            percentage: existing?.percentage ?? pct,
            grade,
            resultStatus: status,
            rank: existing?.rank,
            attendance: existing?.attendance || '92%',
            teacherRemarks: existing?.teacherRemarks || '',
            published: existing?.published ?? (exam.status === 'published'),
            isDirty: false,
          };
        });

        if (isMounted) {
          setEntries(initialEntries);
        }
      } catch (err: any) {
        console.error('Error fetching exam results:', err);
        setErrorMessage('Failed to load existing marks for this exam.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [exam, targetStudents, examSubjects]);

  // Recalculate student score metrics when a subject score is updated
  const updateStudentSubject = (
    studentIndex: number,
    subjectName: string,
    field: keyof SubjectMarks,
    value: any
  ) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = { ...next[studentIndex] };
      const subjects = { ...entry.subjects };
      const curSubject = { ...subjects[subjectName] };

      if (field === 'marksObtained') {
        const raw = Math.max(0, Math.min(Number(value) || 0, curSubject.maxMarks));
        curSubject.marksObtained = raw;
        curSubject.grade = calculateSubjectGrade(raw, curSubject.maxMarks, curSubject.isAbsent).grade;
      } else if (field === 'isAbsent') {
        curSubject.isAbsent = Boolean(value);
        curSubject.grade = calculateSubjectGrade(curSubject.marksObtained, curSubject.maxMarks, Boolean(value)).grade;
      } else if (field === 'remarks') {
        curSubject.remarks = String(value);
      }

      subjects[subjectName] = curSubject;
      entry.subjects = subjects;

      // Recompute aggregates
      let obtained = 0;
      let maxTotal = 0;
      const listForEval: SubjectMarks[] = [];

      (Object.values(subjects) as SubjectMarks[]).forEach((s) => {
        maxTotal += s.maxMarks;
        if (!s.isAbsent) {
          obtained += s.marksObtained;
        }
        listForEval.push(s);
      });

      const pct = maxTotal > 0 ? Math.round((obtained / maxTotal) * 1000) / 10 : 0;
      entry.totalMarks = obtained;
      entry.totalMaxMarks = maxTotal;
      entry.percentage = pct;
      entry.grade = calculateGrade(pct).grade;
      entry.resultStatus = evaluateResultStatus(listForEval, pct);
      entry.isDirty = true;

      next[studentIndex] = entry;
      return next;
    });
  };

  // Update top-level student evaluation field (teacher remarks, attendance, published)
  const updateStudentField = (
    studentIndex: number,
    field: keyof StudentEntryState,
    val: any
  ) => {
    setEntries((prev) => {
      const next = [...prev];
      next[studentIndex] = {
        ...next[studentIndex],
        [field]: val,
        isDirty: true,
      };
      return next;
    });
  };

  // Save current student or all dirty students
  const handleSaveSingleStudent = async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload: Record<string, any> = {
        examId: exam.id,
        examName: exam.name,
        studentId: entry.student.studentId || entry.student.id,
        admissionNumber: entry.student.admissionNumber || '',
        studentName: `${entry.student.firstName} ${entry.student.lastName}`.trim(),
        className: entry.student.className || exam.className,
        section: entry.student.section || exam.section || 'A',
        academicYear: exam.academicYear,
        subjects: entry.subjects,
        totalMarks: entry.totalMarks,
        totalMaxMarks: entry.totalMaxMarks,
        percentage: entry.percentage,
        grade: entry.grade,
        resultStatus: entry.resultStatus,
        published: Boolean(entry.published),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (entry.student.rollNumber) {
        payload.rollNumber = entry.student.rollNumber;
      }
      if (entry.rank !== undefined && entry.rank !== null && !isNaN(entry.rank)) {
        payload.rank = entry.rank;
      }
      if (entry.attendance !== undefined && entry.attendance !== null && !isNaN(entry.attendance)) {
        payload.attendance = entry.attendance;
      }
      if (entry.teacherRemarks && entry.teacherRemarks.trim()) {
        payload.teacherRemarks = entry.teacherRemarks.trim();
      }

      const docId = await examService.saveExamResult(payload as Omit<ExamResult, 'id'>, entry.resultId);
      
      setEntries((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], resultId: docId, isDirty: false };
        return next;
      });

      setSuccessMessage(`Marks saved successfully for ${entry.student.firstName}!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onResultsSaved) onResultsSaved();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save marks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save all changes in bulk
  const handleSaveAll = async () => {
    const dirtyEntries = entries.filter((e) => e.isDirty);
    if (dirtyEntries.length === 0) {
      setSuccessMessage('All marks are already up to date!');
      setTimeout(() => setSuccessMessage(null), 2500);
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const batchPayload = dirtyEntries.map((e) => {
        const itemData: Record<string, any> = {
          examId: exam.id,
          examName: exam.name,
          studentId: e.student.studentId || e.student.id,
          admissionNumber: e.student.admissionNumber || '',
          studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
          className: e.student.className || exam.className,
          section: e.student.section || exam.section || 'A',
          academicYear: exam.academicYear,
          subjects: e.subjects,
          totalMarks: e.totalMarks,
          totalMaxMarks: e.totalMaxMarks,
          percentage: e.percentage,
          grade: e.grade,
          resultStatus: e.resultStatus,
          published: Boolean(e.published),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (e.student.rollNumber) {
          itemData.rollNumber = e.student.rollNumber;
        }
        if (e.rank !== undefined && e.rank !== null && !isNaN(e.rank)) {
          itemData.rank = e.rank;
        }
        if (e.attendance !== undefined && e.attendance !== null && !isNaN(e.attendance)) {
          itemData.attendance = e.attendance;
        }
        if (e.teacherRemarks && e.teacherRemarks.trim()) {
          itemData.teacherRemarks = e.teacherRemarks.trim();
        }

        return {
          id: e.resultId,
          data: itemData as Omit<ExamResult, 'id'>,
        };
      });

      await examService.batchSaveExamResults(batchPayload);

      setEntries((prev) =>
        prev.map((e) => ({
          ...e,
          isDirty: false,
        }))
      );

      setSuccessMessage(`Successfully saved marks for ${dirtyEntries.length} students!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      if (onResultsSaved) onResultsSaved();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to batch save results.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered student entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        `${e.student.firstName} ${e.student.lastName}`.toLowerCase().includes(q) ||
        (e.student.admissionNumber || '').toLowerCase().includes(q) ||
        (e.student.rollNumber || '').toLowerCase().includes(q) ||
        (e.student.studentId || '').toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const currentEntry = entries[selectedStudentIndex];

  // Open Preview Modal
  const handleOpenPreview = (entry: StudentEntryState) => {
    const res: ExamResult = {
      id: entry.resultId || 'preview',
      examId: exam.id,
      examName: exam.name,
      studentId: entry.student.studentId || entry.student.id,
      admissionNumber: entry.student.admissionNumber,
      studentName: `${entry.student.firstName} ${entry.student.lastName}`.trim(),
      rollNumber: entry.student.rollNumber,
      className: entry.student.className,
      section: entry.student.section,
      academicYear: exam.academicYear,
      subjects: entry.subjects,
      totalMarks: entry.totalMarks,
      totalMaxMarks: entry.totalMaxMarks,
      percentage: entry.percentage,
      grade: entry.grade,
      resultStatus: entry.resultStatus,
      rank: entry.rank,
      attendance: entry.attendance,
      teacherRemarks: entry.teacherRemarks,
      published: entry.published,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPreviewResult(res);
    setPreviewStudent(entry.student);
  };

  const dirtyCount = entries.filter((e) => e.isDirty).length;

  return (
    <div
      id="marks-entry-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div
        id="marks-entry-modal"
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94vh]"
      >
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-800 text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-sm sm:text-base text-white">
                  Marks Entry Workspace: {exam.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900 border border-blue-700 text-amber-300">
                  {exam.className} • {exam.academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {targetStudents.length} Students Enrolled • {examSubjects.length} Configured Subjects ({exam.totalMaxMarks || 600} Max Marks)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveViewMode('individual')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeViewMode === 'individual'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Single Student
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeViewMode === 'grid'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Score Matrix Grid
              </button>
            </div>

            {/* Save All Button */}
            <button
              id="save-all-marks-btn"
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || dirtyCount === 0}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer ${
                dirtyCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All ({dirtyCount})</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Alerts */}
        {successMessage && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Body */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <GraduationCap className="w-10 h-10 text-blue-900 animate-bounce mb-3" />
            <p className="text-xs font-semibold">Loading student roster and examination marks...</p>
          </div>
        ) : targetStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <User className="w-10 h-10 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Enrolled Students Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              No active student records match the target criteria ({exam.className} {exam.section !== 'All' ? `Section ${exam.section}` : ''}).
            </p>
          </div>
        ) : activeViewMode === 'individual' ? (
          /* =========================================================================
             MODE 1: SINGLE STUDENT DETAILED ENTRY WORKSPACE
             ========================================================================= */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Sidebar: Student Roster List */}
            <div className="w-full lg:w-80 border-r border-slate-200 bg-slate-50/70 flex flex-col overflow-hidden">
              {/* Search Header */}
              <div className="p-3 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll, admission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-slate-50"
                  />
                </div>
              </div>

              {/* Scrollable Students List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    No matching students found.
                  </div>
                ) : (
                  filteredEntries.map((entry) => {
                    const originalIdx = entries.findIndex(
                      (e) => e.student.id === entry.student.id
                    );
                    const isSelected = selectedStudentIndex === originalIdx;
                    return (
                      <button
                        key={entry.student.id}
                        type="button"
                        onClick={() => setSelectedStudentIndex(originalIdx)}
                        className={`w-full text-left p-3 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-900 text-white'
                            : 'hover:bg-slate-100/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isSelected
                                ? 'bg-amber-400 text-blue-950'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {entry.student.rollNumber || '#'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate">
                              {entry.student.firstName} {entry.student.lastName}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-blue-200' : 'text-slate-500'
                              } truncate`}
                            >
                              Adm: {entry.student.admissionNumber} • {entry.student.className}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'bg-blue-800 text-amber-300'
                                : entry.percentage >= 33
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {entry.percentage.toFixed(0)}% • {entry.grade}
                          </span>
                          {entry.isDirty && (
                            <span className="block text-[9px] text-amber-400 font-bold">Unsaved</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active Student Scorecard Editor */}
            {currentEntry ? (
              <div className="flex-1 flex flex-col overflow-y-auto bg-white p-6 space-y-6">
                {/* Current Student Header Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-serif font-black text-lg">
                      {currentEntry.student.rollNumber || 'ST'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {currentEntry.student.firstName} {currentEntry.student.lastName}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                          Roll #{currentEntry.student.rollNumber || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Admission No: <strong className="text-slate-700">{currentEntry.student.admissionNumber}</strong> • Class: <strong className="text-slate-700">{currentEntry.student.className} - {currentEntry.student.section}</strong> • Guardian: <span className="text-slate-600">{currentEntry.student.guardianName || 'On Record'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Score Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Obtained</span>
                      <span className="text-sm font-black font-mono text-blue-950">
                        {currentEntry.totalMarks} / {currentEntry.totalMaxMarks}
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Percentage</span>
                      <span className="text-sm font-black font-mono text-blue-900">
                        {currentEntry.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Grade</span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        {currentEntry.grade}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPreview(currentEntry)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                      title="Preview Official Marksheet"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-900" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Subject-Wise Marks Form Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-serif flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-900" />
                      Subject Scores & Attendance
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Live grade auto-calculated on CBSE 8-Point scale
                    </span>
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3 text-center w-24">Max Marks</th>
                        <th className="py-2.5 px-3 text-center w-24">Pass Marks</th>
                        <th className="py-2.5 px-3 text-center w-32">Marks Obtained</th>
                        <th className="py-2.5 px-3 text-center w-20">Absent?</th>
                        <th className="py-2.5 px-3 text-center w-20">Grade</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examSubjects.map((subCfg, sIdx) => {
                        const sub = currentEntry.subjects[subCfg.subjectName] || {
                          subjectName: subCfg.subjectName,
                          marksObtained: 0,
                          maxMarks: subCfg.maxMarks || 100,
                          passMarks: subCfg.passMarks ?? Math.round((subCfg.maxMarks || 100) * 0.33),
                          grade: 'E',
                          isAbsent: false,
                          remarks: '',
                        };
                        const isFailed = !sub.isAbsent && sub.marksObtained < (sub.passMarks || 33);

                        return (
                          <tr key={subCfg.subjectName} className="hover:bg-slate-50/80">
                            <td className="p-3 text-center font-mono text-slate-400">{sIdx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{subCfg.subjectName}</td>
                            <td className="p-3 text-center font-mono text-slate-600">{subCfg.maxMarks}</td>
                            <td className="p-3 text-center font-mono text-slate-600">
                              {subCfg.passMarks ?? Math.round((subCfg.maxMarks || 100) * 0.33)}
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={subCfg.maxMarks}
                                disabled={sub.isAbsent}
                                value={sub.isAbsent ? '' : sub.marksObtained}
                                placeholder={sub.isAbsent ? 'AB' : '0'}
                                onChange={(e) =>
                                  updateStudentSubject(
                                    selectedStudentIndex,
                                    subCfg.subjectName,
                                    'marksObtained',
                                    e.target.value
                                  )
                                }
                                className={`w-24 mx-auto px-2.5 py-1.5 text-xs text-center font-mono font-bold rounded-lg border ${
                                  sub.isAbsent
                                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                                    : isFailed
                                    ? 'border-rose-300 text-rose-700 bg-rose-50/50'
                                    : 'border-slate-300 text-slate-900 focus:ring-1 focus:ring-blue-900'
                                }`}
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!sub.isAbsent}
                                  onChange={(e) =>
                                    updateStudentSubject(
                                      selectedStudentIndex,
                                      subCfg.subjectName,
                                      'isAbsent',
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                                />
                                <span className="text-[10px] font-bold text-slate-600">AB</span>
                              </label>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  sub.isAbsent
                                    ? 'bg-amber-100 text-amber-800'
                                    : isFailed
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {sub.isAbsent ? 'AB' : sub.grade || 'A1'}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="e.g. Good grasp of concepts"
                                value={sub.remarks || ''}
                                onChange={(e) =>
                                  updateStudentSubject(
                                    selectedStudentIndex,
                                    subCfg.subjectName,
                                    'remarks',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Qualitative Evaluation & Publishing Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Class Teacher's Evaluative Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Attentive student with excellent problem-solving ability. Commendable improvement in sciences."
                      value={currentEntry.teacherRemarks || ''}
                      onChange={(e) =>
                        updateStudentField(selectedStudentIndex, 'teacherRemarks', e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Attendance Record
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 94% or 178/190 Days"
                          value={currentEntry.attendance || ''}
                          onChange={(e) =>
                            updateStudentField(selectedStudentIndex, 'attendance', e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Final Result Status
                        </label>
                        <select
                          value={currentEntry.resultStatus}
                          onChange={(e) =>
                            updateStudentField(selectedStudentIndex, 'resultStatus', e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white font-bold"
                        >
                          <option value="passed">Passed / Qualified</option>
                          <option value="promoted">Promoted to Next Grade</option>
                          <option value="compartment">Compartment</option>
                          <option value="failed">Needs Improvement</option>
                          <option value="absent">Absent</option>
                          <option value="withheld">Withheld</option>
                        </select>
                      </div>
                    </div>

                    {/* Publication Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        {currentEntry.published ? (
                          <Globe className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {currentEntry.published ? 'Published to Student Portal' : 'Unpublished (Draft Mode)'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {currentEntry.published
                              ? 'Visible to student on scorecard dashboard'
                              : 'Hidden from student view'}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentEntry.published}
                          onChange={(e) =>
                            updateStudentField(selectedStudentIndex, 'published', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Individual Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedStudentIndex === 0}
                      onClick={() => setSelectedStudentIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      ← Previous Student
                    </button>
                    <button
                      type="button"
                      disabled={selectedStudentIndex >= entries.length - 1}
                      onClick={() => setSelectedStudentIndex((prev) => Math.min(entries.length - 1, prev + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next Student →
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="save-single-student-btn"
                      type="button"
                      onClick={() => handleSaveSingleStudent(selectedStudentIndex)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save {currentEntry.student.firstName}'s Scorecard
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* =========================================================================
             MODE 2: SCORE MATRIX GRID (TABULAR FAST ENTRY)
             ========================================================================= */
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Search and Grid Filter Bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter matrix by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                />
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-3 font-medium">
                <span>Showing {filteredEntries.length} students</span>
                <span className="font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">
                  {dirtyCount} pending unsaved changes
                </span>
              </div>
            </div>

            {/* Scrollable Matrix Table */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-[10px] sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="p-2.5 border border-slate-200 text-center w-12 bg-slate-100">Roll</th>
                    <th className="p-2.5 border border-slate-200 min-w-44 bg-slate-100">Student Name</th>
                    {examSubjects.map((sub) => (
                      <th key={sub.subjectName} className="p-2 border border-slate-200 text-center min-w-28 bg-slate-100">
                        <div className="font-bold text-slate-900 truncate">{sub.subjectName}</div>
                        <div className="text-[9px] text-slate-500 font-normal">Max {sub.maxMarks}</div>
                      </th>
                    ))}
                    <th className="p-2 border border-slate-200 text-center w-20 bg-slate-100">Total</th>
                    <th className="p-2 border border-slate-200 text-center w-16 bg-slate-100">%</th>
                    <th className="p-2 border border-slate-200 text-center w-16 bg-slate-100">Grade</th>
                    <th className="p-2 border border-slate-200 text-center w-20 bg-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => {
                    const originalIdx = entries.findIndex(
                      (e) => e.student.id === entry.student.id
                    );
                    return (
                      <tr key={entry.student.id} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-700">
                          {entry.student.rollNumber || '-'}
                        </td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.student.firstName} {entry.student.lastName}</span>
                            {entry.isDirty && (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes"></span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Adm: {entry.student.admissionNumber}
                          </div>
                        </td>

                        {examSubjects.map((subCfg) => {
                          const sub = entry.subjects[subCfg.subjectName] || {
                            subjectName: subCfg.subjectName,
                            marksObtained: 0,
                            maxMarks: subCfg.maxMarks || 100,
                            grade: 'E',
                            isAbsent: false,
                          };

                          return (
                            <td key={subCfg.subjectName} className="p-1 border border-slate-200 text-center">
                              <input
                                type="number"
                                min={0}
                                max={subCfg.maxMarks}
                                value={sub.isAbsent ? '' : sub.marksObtained}
                                placeholder={sub.isAbsent ? 'AB' : '0'}
                                onChange={(e) =>
                                  updateStudentSubject(
                                    originalIdx,
                                    subCfg.subjectName,
                                    'marksObtained',
                                    e.target.value
                                  )
                                }
                                className={`w-full py-1 text-center font-mono font-bold text-xs rounded border ${
                                  sub.isAbsent
                                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                                    : sub.marksObtained < (subCfg.passMarks || 33)
                                    ? 'border-rose-300 text-rose-700 bg-rose-50/50'
                                    : 'border-slate-200 text-slate-900 focus:border-blue-900'
                                }`}
                              />
                            </td>
                          );
                        })}

                        <td className="p-2 border border-slate-200 text-center font-mono font-black text-blue-950">
                          {entry.totalMarks}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold text-blue-900">
                          {entry.percentage.toFixed(0)}%
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                            entry.percentage >= 33 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {entry.grade}
                          </span>
                        </td>
                        <td className="p-1.5 border border-slate-200 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(entry)}
                            className="p-1 text-slate-400 hover:text-blue-900 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Preview Marksheet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              {targetStudents.length} Students Evaluated • {exam.status === 'published' ? 'Publicly Released' : 'Draft Assessment Schedule'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || dirtyCount === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : `Save All Changes (${dirtyCount})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Card Preview Modal */}
      {previewResult && (
        <ReportCardModal
          result={previewResult}
          exam={exam}
          student={previewStudent}
          onClose={() => {
            setPreviewResult(null);
            setPreviewStudent(null);
          }}
        />
      )}
    </div>
  );
};
