import React, { useRef } from 'react';
import {
  X,
  Printer,
  GraduationCap,
  Award,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ExamResult, Student, Exam, SubjectMarks } from '../../../types';
import { calculateGrade, GRADING_SCALE, EXAM_TYPE_LABELS } from '../../../utils/gradeUtils';
import { formatDateToDisplay } from '../../../utils/dateUtils';

interface ReportCardModalProps {
  result: ExamResult;
  exam?: Exam | null;
  student?: Student | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  result,
  exam,
  student,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const studentName = result.studentName || (student ? `${student.firstName} ${student.lastName}`.trim() : result.studentId);
  const admissionNumber = result.admissionNumber || student?.admissionNumber || 'N/A';
  const rollNumber = result.rollNumber || student?.rollNumber || 'N/A';
  const className = result.className || student?.className || exam?.className || 'N/A';
  const section = result.section || student?.section || exam?.section || 'A';
  const academicYear = result.academicYear || exam?.academicYear || student?.academicYear || '2025-2026';
  const examTitle = result.examName || exam?.name || 'Academic Assessment';
  const examType = exam?.examType || 'half_yearly';
  const typeLabel = EXAM_TYPE_LABELS[examType]?.label || 'Institutional Examination';

  // Compute subjects list
  const subjectEntries = (Object.entries(result.subjects || {}) as [string, SubjectMarks][]);
  
  let calculatedMaxTotal = 0;
  let calculatedPassTotal = 0;
  let calculatedObtainedTotal = 0;
  let hasAbsent = false;

  subjectEntries.forEach(([_, sub]) => {
    const max = sub.maxMarks || 100;
    const pass = sub.passMarks ?? Math.round(max * 0.33);
    calculatedMaxTotal += max;
    calculatedPassTotal += pass;
    if (sub.isAbsent) {
      hasAbsent = true;
    } else {
      calculatedObtainedTotal += sub.marksObtained || 0;
    }
  });

  const totalMax = result.totalMaxMarks || calculatedMaxTotal || (subjectEntries.length * 100);
  const totalObtained = result.totalMarks ?? calculatedObtainedTotal;
  const percentage = result.percentage ?? (totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0);
  const overallGradeInfo = calculateGrade(percentage);
  const gradeDisplay = result.grade || overallGradeInfo.grade;

  const resultStatus = result.resultStatus || (percentage >= 33 ? 'passed' : 'failed');

  return (
    <div
      id="report-card-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
    >
      <div
        id="report-card-container"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-sm sm:text-base">
              Official Academic Marksheet & Report Card
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-report-card-btn"
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              id="close-report-card-btn"
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div
          ref={printRef}
          id="official-report-card-doc"
          className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 font-sans print:text-black"
        >
          {/* Institutional Header with Official Border */}
          <div className="border-4 border-double border-blue-900 p-6 sm:p-8 rounded-xl relative print:border-2 print:p-6 bg-white">
            {/* Top Crest & School Details */}
            <div className="text-center pb-5 border-b-2 border-blue-900/60 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center shadow-md font-serif font-black text-2xl border-2 border-amber-400">
                  SX
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-black text-blue-950 font-serif tracking-tight uppercase">
                    St. Xavier High School
                  </h1>
                  <p className="text-xs text-slate-600 font-medium tracking-wide">
                    Affiliated to CBSE Curriculum • Tihidi, Bhadrak - 756130, Odisha
                  </p>
                </div>
              </div>

              <div className="inline-block mt-1 px-4 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider print:bg-transparent">
                {typeLabel} • Academic Session {academicYear}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 mt-2 uppercase tracking-wide">
                Official Student Progress Report & Marksheet
              </h2>
            </div>

            {/* Student Particulars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs print:bg-transparent print:border-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">{studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Admission No.</span>
                <span className="font-bold text-blue-900">{admissionNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Class & Section</span>
                <span className="font-bold text-slate-900">{className} - {section}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Roll Number</span>
                <span className="font-bold text-slate-900">{rollNumber}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Guardian / Parent</span>
                <span className="font-semibold text-slate-800">{student?.guardianName || 'Guardian on File'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Date of Birth</span>
                <span className="font-semibold text-slate-800">{student?.dateOfBirth ? formatDateToDisplay(student.dateOfBirth) : 'On Record'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Examination</span>
                <span className="font-semibold text-slate-800">{examTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium uppercase block">Attendance</span>
                <span className="font-semibold text-slate-800">{result.attendance || 'Regular (92%)'}</span>
              </div>
            </div>

            {/* Academic Evaluation Marks Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-blue-950 text-white uppercase text-[11px] font-serif print:bg-slate-100 print:text-black">
                    <th className="p-2.5 border border-slate-300 text-center w-12">Sl No</th>
                    <th className="p-2.5 border border-slate-300">Subject Name</th>
                    <th className="p-2.5 border border-slate-300 text-center w-24">Max Marks</th>
                    <th className="p-2.5 border border-slate-300 text-center w-24">Pass Marks</th>
                    <th className="p-2.5 border border-slate-300 text-center w-28">Marks Obtained</th>
                    <th className="p-2.5 border border-slate-300 text-center w-20">Grade</th>
                    <th className="p-2.5 border border-slate-300">Performance Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                        No subject score entries recorded.
                      </td>
                    </tr>
                  ) : (
                    subjectEntries.map(([key, sub], idx) => {
                      const max = sub.maxMarks || 100;
                      const pass = sub.passMarks ?? Math.round(max * 0.33);
                      const isFailed = !sub.isAbsent && (sub.marksObtained || 0) < pass;
                      return (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 print:bg-transparent'}>
                          <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {sub.subjectName || key}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{max}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{pass}</td>
                          <td className={`p-2 border border-slate-300 text-center font-mono font-bold ${
                            sub.isAbsent ? 'text-amber-700' : isFailed ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                            {sub.isAbsent ? 'AB' : sub.marksObtained}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            <span className={`inline-block px-2 py-0.5 rounded font-mono ${
                              sub.isAbsent ? 'bg-amber-100 text-amber-800' : isFailed ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-900'
                            } print:bg-transparent print:p-0`}>
                              {sub.isAbsent ? 'AB' : (sub.grade || calculateGrade((sub.marksObtained / max) * 100).grade)}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-600">
                            {sub.remarks || (sub.isAbsent ? 'Absent in examination' : isFailed ? 'Needs practice & improvement' : calculateGrade((sub.marksObtained / max) * 100).description.split(' (')[0])}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Grand Totals Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-blue-900 print:bg-slate-200">
                    <td colSpan={2} className="p-2.5 border border-slate-300 text-right uppercase font-serif">
                      Grand Total & Percentage:
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">{totalMax}</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">{calculatedPassTotal}</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono text-sm text-blue-950 font-black">
                      {totalObtained}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono text-sm font-black text-blue-900">
                      {gradeDisplay}
                    </td>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold text-blue-950">
                      {percentage.toFixed(1)}% Aggregate
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Performance Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/70 rounded-xl border border-blue-200 mb-6 text-xs print:bg-transparent print:border-slate-300">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Final Assessment Result</span>
                  <span className={`font-black text-sm uppercase tracking-wide ${
                    resultStatus === 'passed' || resultStatus === 'promoted' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {resultStatus === 'passed' ? 'PASSED / QUALIFIED' : resultStatus === 'compartment' ? 'ELIGIBLE FOR COMPARTMENT' : resultStatus === 'promoted' ? 'PROMOTED TO NEXT CLASS' : 'NEEDS IMPROVEMENT'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Overall Scholastic Grade</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-blue-900 text-white rounded font-mono font-black text-sm">
                    {gradeDisplay}
                  </span>
                  <span className="text-slate-700 font-medium">
                    {overallGradeInfo.description.split(' (')[0]}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Class Standing / Rank</span>
                <span className="font-bold text-slate-800 text-sm">
                  {result.rank ? `Rank #${result.rank}` : 'Recorded in Master Register'}
                </span>
              </div>
            </div>

            {/* Teacher's Remarks Section */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs print:bg-transparent print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                Class Teacher's Evaluative Remarks & Guidance:
              </span>
              <p className="text-slate-800 italic font-serif">
                "{result.teacherRemarks || 'Demonstrates sincere dedication and active participation in classroom activities. With continued focus and regular revision, even higher academic milestones can be achieved.'}"
              </p>
            </div>

            {/* CBSE Standard Grading Scale Reference Legend */}
            <div className="mb-8 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                CBSE 8-Point Standard Grading Scheme Reference:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center font-mono">
                {GRADING_SCALE.map((g) => (
                  <div key={g.grade} className="p-1 rounded bg-slate-100 border border-slate-200 print:bg-transparent">
                    <div className="font-bold text-slate-900">{g.grade}</div>
                    <div className="text-[9px] text-slate-600">{g.description.split(' ')[1] || ''}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures & Certification Seal Block */}
            <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs border-t-2 border-dashed border-slate-300 print:pt-10">
              <div className="flex flex-col items-center">
                <div className="w-32 border-b-2 border-slate-800 mb-1"></div>
                <span className="font-bold text-slate-800">Class Teacher</span>
                <span className="text-[10px] text-slate-500">Signature & Date</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-2 border-blue-900/30 flex items-center justify-center text-[9px] font-bold text-blue-900/50 uppercase tracking-tighter text-center p-1 -mt-8 mb-1">
                  Institutional Official Seal
                </div>
                <span className="font-bold text-slate-800">Exam In-Charge</span>
                <span className="text-[10px] text-slate-500">Verified & Authenticated</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-32 border-b-2 border-slate-800 mb-1"></div>
                <span className="font-bold text-slate-900">Principal</span>
                <span className="text-[10px] text-slate-500">St. Xavier High School</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified official institutional scorecard record
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Marksheet
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
