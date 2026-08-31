import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronDown,
  Sparkles,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { Exam, ExamResult, Student } from '../../../types';
import { examService } from '../../../services/examService';
import { calculateGrade, GRADING_SCALE } from '../../../utils/gradeUtils';
import { ReportCardModal } from './ReportCardModal';

interface ExamAnalyticsViewProps {
  exam: Exam;
  students: Student[];
  onClose: () => void;
}

export const ExamAnalyticsView: React.FC<ExamAnalyticsViewProps> = ({
  exam,
  students,
  onClose,
}) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<ExamResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchExamResults = async () => {
      setIsLoading(true);
      try {
        const data = await examService.getResultsByExamId(exam.id);
        if (isMounted) {
          setResults(data);
        }
      } catch (err) {
        console.error('Failed to load results for analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchExamResults();
    return () => {
      isMounted = false;
    };
  }, [exam]);

  // Calculations
  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        totalEvaluated: 0,
        passedCount: 0,
        failedCount: 0,
        compartmentCount: 0,
        passPercentage: 0,
        classAveragePct: 0,
        highestScore: null as ExamResult | null,
        lowestScore: null as ExamResult | null,
        gradeDistribution: {} as Record<string, number>,
        subjectStats: {} as Record<
          string,
          { total: number; count: number; max: number; passed: number }
        >,
        rankedList: [] as ExamResult[],
      };
    }

    let totalPercentage = 0;
    let passedCount = 0;
    let failedCount = 0;
    let compartmentCount = 0;
    const gradeDist: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      D: 0,
      E: 0,
    };
    const subStats: Record<
      string,
      { total: number; count: number; max: number; passed: number }
    > = {};

    // Sort by percentage descending to establish ranks
    const sorted = [...results].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    sorted.forEach((r, idx) => {
      const pct = r.percentage || 0;
      totalPercentage += pct;

      // Status
      if (r.resultStatus === 'failed') {
        failedCount++;
      } else if (r.resultStatus === 'compartment') {
        compartmentCount++;
      } else {
        passedCount++;
      }

      // Grade distribution
      const g = r.grade || calculateGrade(pct).grade;
      gradeDist[g] = (gradeDist[g] || 0) + 1;

      // Subject stats
      (Object.entries(r.subjects || {}) as [string, any][]).forEach(([subName, sub]) => {
        if (!subStats[subName]) {
          subStats[subName] = { total: 0, count: 0, max: 0, passed: 0 };
        }
        if (!sub.isAbsent) {
          subStats[subName].total += sub.marksObtained || 0;
          subStats[subName].count += 1;
          if ((sub.marksObtained || 0) > subStats[subName].max) {
            subStats[subName].max = sub.marksObtained || 0;
          }
          const passMarks = sub.passMarks ?? Math.round((sub.maxMarks || 100) * 0.33);
          if ((sub.marksObtained || 0) >= passMarks) {
            subStats[subName].passed += 1;
          }
        }
      });
    });

    const totalEvaluated = results.length;
    const passPercentage = totalEvaluated > 0 ? (passedCount / totalEvaluated) * 100 : 0;
    const classAveragePct = totalEvaluated > 0 ? totalPercentage / totalEvaluated : 0;

    return {
      totalEvaluated,
      passedCount,
      failedCount,
      compartmentCount,
      passPercentage,
      classAveragePct,
      highestScore: sorted[0] || null,
      lowestScore: sorted[sorted.length - 1] || null,
      gradeDistribution: gradeDist,
      subjectStats: subStats,
      rankedList: sorted,
    };
  }, [results]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.studentId || s.id, s));
    return map;
  }, [students]);

  return (
    <div
      id="exam-analytics-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="exam-analytics-modal"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-800 text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base sm:text-lg">
                  Assessment Analytics & Performance Report
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 border border-blue-700 text-amber-300">
                  {exam.name}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Statistical distribution, subject breakdown, and merit standings for {exam.className} ({exam.academicYear}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 animate-bounce text-blue-900" />
              <p className="text-xs font-semibold">Computing statistical distributions...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Assessment Results Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Enter student marks using the Marks Entry Workspace to view class-wide performance analytics and grade curves.
              </p>
            </div>
          ) : (
            <>
              {/* Primary KPI Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Candidates Assessed</span>
                    <Users className="w-4 h-4 text-blue-900" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    {stats.totalEvaluated}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats.passedCount} Qualified • {stats.failedCount} Failed
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Overall Pass Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-emerald-700 font-mono">
                    {stats.passPercentage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats.compartmentCount} with compartment
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Class Average</span>
                    <TrendingUp className="w-4 h-4 text-blue-900" />
                  </div>
                  <div className="text-xl font-bold text-blue-950 font-mono">
                    {stats.classAveragePct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Aggregate Grade: {calculateGrade(stats.classAveragePct).grade}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center justify-between text-amber-800 mb-1">
                    <span className="text-[11px] font-bold uppercase">Class Topper</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {stats.highestScore?.studentName || 'Student'}
                  </div>
                  <div className="text-[10px] text-amber-800 font-mono font-bold mt-0.5">
                    {stats.highestScore?.percentage.toFixed(1)}% • Grade {stats.highestScore?.grade}
                  </div>
                </div>
              </div>

              {/* Grade Distribution Bar Visualizer */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-serif flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-900" />
                    CBSE Grade Distribution Spectrum
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Total {stats.totalEvaluated} students evaluated
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                  {GRADING_SCALE.map((g) => {
                    const count = stats.gradeDistribution[g.grade] || 0;
                    const pctOfClass = stats.totalEvaluated > 0 ? (count / stats.totalEvaluated) * 100 : 0;
                    return (
                      <div
                        key={g.grade}
                        className={`p-3 rounded-xl border text-center ${g.bgClass}`}
                      >
                        <div className={`text-base font-black font-mono ${g.colorClass}`}>
                          {g.grade}
                        </div>
                        <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                          {count}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {pctOfClass.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject-Wise Performance Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-serif">
                    Subject Performance Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3 text-center">Appeared</th>
                        <th className="py-2.5 px-3 text-center">Subject Average</th>
                        <th className="py-2.5 px-3 text-center">Highest Score</th>
                        <th className="py-2.5 px-3 text-center">Subject Pass Rate</th>
                        <th className="py-2.5 px-3 text-center">Health Indicator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(Object.entries(stats.subjectStats) as [string, { total: number; count: number; max: number; passed: number }][]).map(([subName, sub]) => {
                        const avg = sub.count > 0 ? sub.total / sub.count : 0;
                        const passRate = sub.count > 0 ? (sub.passed / sub.count) * 100 : 0;
                        return (
                          <tr key={subName} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{subName}</td>
                            <td className="p-3 text-center font-mono">{sub.count}</td>
                            <td className="p-3 text-center font-mono font-bold text-blue-950">
                              {avg.toFixed(1)} Marks
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-700">
                              {sub.max} Marks
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">
                              {passRate.toFixed(1)}%
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  passRate >= 85
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : passRate >= 65
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {passRate >= 85 ? 'Strong' : passRate >= 65 ? 'Moderate' : 'Needs Focus'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Class Merit & Standing List */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-serif">
                    Class Standing & Merit Register (Top Performers)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Sorted by aggregate score percentage
                  </span>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-center">Roll No</th>
                        <th className="py-2.5 px-3 text-center">Admission No</th>
                        <th className="py-2.5 px-3 text-center">Total Marks</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Scorecard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.rankedList.map((r, idx) => {
                        const st = studentMap.get(r.studentId);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-3 text-center font-mono font-black text-slate-700">
                              {idx === 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-xs">
                                  1
                                </span>
                              ) : idx === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs">
                                  2
                                </span>
                              ) : idx === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/30 text-amber-900 font-bold text-xs">
                                  3
                                </span>
                              ) : (
                                `#${idx + 1}`
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {r.studentName || `${st?.firstName} ${st?.lastName}`.trim()}
                            </td>
                            <td className="p-3 text-center font-mono">{r.rollNumber || st?.rollNumber || '-'}</td>
                            <td className="p-3 text-center font-mono text-blue-900">{r.admissionNumber || st?.admissionNumber || '-'}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-900">{r.totalMarks}</td>
                            <td className="p-3 text-center font-mono font-black text-blue-950">{r.percentage.toFixed(1)}%</td>
                            <td className="p-3 text-center font-mono font-bold">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                                {r.grade}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.resultStatus === 'failed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : r.resultStatus === 'compartment'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {r.resultStatus?.toUpperCase() || 'PASSED'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForCard(r)}
                                className="inline-flex items-center gap-1 text-xs text-blue-900 hover:text-blue-700 font-bold cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Marksheet
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close Analytics
          </button>
        </div>
      </div>

      {/* Report Card Modal for any selected student */}
      {selectedStudentForCard && (
        <ReportCardModal
          result={selectedStudentForCard}
          exam={exam}
          student={studentMap.get(selectedStudentForCard.studentId)}
          onClose={() => setSelectedStudentForCard(null)}
        />
      )}
    </div>
  );
};
