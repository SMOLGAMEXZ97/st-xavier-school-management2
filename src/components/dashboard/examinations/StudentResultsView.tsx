import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  Calendar,
  Layers,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { ExamResult, Student, Exam, SubjectMarks } from '../../../types';
import { examService } from '../../../services/examService';
import { calculateGrade, EXAM_TYPE_LABELS } from '../../../utils/gradeUtils';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { ReportCardModal } from './ReportCardModal';

interface StudentResultsViewProps {
  student: Student | null;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ student }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [publishedExams, setPublishedExams] = useState<Exam[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentResults = async () => {
      if (!student) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const studentKey = student.studentId || student.id;
        const [studentResults, examsList] = await Promise.all([
          examService.getResultsByStudentId(studentKey, student.admissionNumber),
          examService.getPublishedExams(),
        ]);

        if (isMounted) {
          setResults(studentResults || []);
          setPublishedExams(examsList || []);
          if (studentResults && studentResults.length > 0) {
            setSelectedResultId(studentResults[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load student exam results:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStudentResults();
    return () => {
      isMounted = false;
    };
  }, [student]);

  const examMap = new Map<string, Exam>();
  publishedExams.forEach((e) => examMap.set(e.id, e));

  const activeResult = results.find((r) => r.id === selectedResultId) || results[0] || null;
  const activeExam = activeResult ? examMap.get(activeResult.examId) : null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-2xs border border-slate-200 text-center">
        <GraduationCap className="w-8 h-8 text-blue-900 mx-auto mb-2 animate-bounce" />
        <p className="text-xs font-semibold text-slate-600">Retrieving official academic scorecards...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-2xs border border-slate-200 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-100">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 font-serif">
            No Published Examination Results Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Official term scorecards and assessment marks will be displayed here once evaluated and released by the St. Xavier Examination Board.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Student ID: {student?.admissionNumber || student?.studentId || 'Enrolled Student'}</span>
        </div>
      </div>
    );
  }

  const subjectEntries = (Object.entries(activeResult?.subjects || {}) as [string, SubjectMarks][]);
  const overallPercentage = activeResult?.percentage ?? 0;
  const overallGrade = activeResult?.grade || calculateGrade(overallPercentage).grade;
  const isPassed = activeResult?.resultStatus === 'passed' || (!activeResult?.resultStatus && overallPercentage >= 33);
  const examType = activeExam?.examType || 'half_yearly';
  const typeLabel = EXAM_TYPE_LABELS[examType]?.label || 'Institutional Examination';

  return (
    <div id="student-results-view" className="space-y-6">
      {/* Header & Exam Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-900 text-amber-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              Official Examination Scorecards
            </h2>
            <p className="text-xs text-slate-500">
              Verified term progress reports for {student?.firstName} {student?.lastName} ({student?.className} - {student?.section})
            </p>
          </div>
        </div>

        {/* Examination Tab Selector */}
        {results.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {results.map((res) => {
              const ex = examMap.get(res.examId);
              const isSelected = res.id === activeResult?.id;
              return (
                <button
                  key={res.id}
                  onClick={() => setSelectedResultId(res.id)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {res.examName || ex?.name || 'Assessment'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeResult && (
        <>
          {/* Performance Hero Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                    {typeLabel}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Session {activeResult.academicYear || activeExam?.academicYear || '2025-2026'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif mt-1">
                  {activeResult.examName || activeExam?.name || 'Academic Assessment'}
                </h3>
              </div>

              <button
                id="print-student-marksheet-btn"
                onClick={() => setShowReportCardModal(true)}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer self-start md:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Official Marksheet</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Marks</span>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {activeResult.totalMarks}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    / {activeResult.totalMaxMarks || (subjectEntries.length * 100)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] text-blue-800 uppercase font-semibold block">Aggregate Percentage</span>
                <div className="text-xl font-black font-mono text-blue-950 mt-0.5">
                  {overallPercentage.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Scholastic Grade</span>
                <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
                  Grade {overallGrade}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Result Status</span>
                <div
                  className={`text-sm font-black uppercase mt-1 ${
                    isPassed ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {activeResult.resultStatus?.toUpperCase() || (isPassed ? 'PASSED' : 'NEEDS REVISION')}
                </div>
              </div>
            </div>

            {/* Subject-Wise Scores Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-900" />
                  Subject Score Breakdown
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  CBSE Grading System
                </span>
              </div>

              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                    <th className="py-2.5 px-3.5">Subject</th>
                    <th className="py-2.5 px-3.5 text-center">Max Marks</th>
                    <th className="py-2.5 px-3.5 text-center">Pass Marks</th>
                    <th className="py-2.5 px-3.5 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3.5 text-center">Grade</th>
                    <th className="py-2.5 px-3.5">Performance Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectEntries.map(([key, sub], idx) => {
                    const max = sub.maxMarks || 100;
                    const pass = sub.passMarks ?? Math.round(max * 0.33);
                    const isFailed = !sub.isAbsent && sub.marksObtained < pass;

                    return (
                      <tr key={key} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{sub.subjectName || key}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{max}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{pass}</td>
                        <td
                          className={`p-3 text-center font-mono font-bold ${
                            sub.isAbsent
                              ? 'text-amber-700'
                              : isFailed
                              ? 'text-rose-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {sub.isAbsent ? 'AB' : sub.marksObtained}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
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
                        <td className="p-3 text-slate-600">
                          {sub.remarks || (sub.isAbsent ? 'Absent' : isFailed ? 'Needs Focus' : 'Good Performance')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Class Teacher's Guidance Remarks */}
            {activeResult.teacherRemarks && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                  Class Teacher's Guidance & Remarks:
                </span>
                <p className="text-xs text-slate-800 italic font-serif">
                  "{activeResult.teacherRemarks}"
                </p>
              </div>
            )}
          </div>

          {/* Printable Report Card Modal */}
          {showReportCardModal && (
            <ReportCardModal
              result={activeResult}
              exam={activeExam}
              student={student}
              onClose={() => setShowReportCardModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
};
