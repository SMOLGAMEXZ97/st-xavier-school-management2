import React, { useState, useMemo } from 'react';
import { AcademicReportRow, ExamResultStatus } from '../../../types';
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
} from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';
import {
  isDateInRange,
  formatDateRangeDisplay,
  getDateRangeFileSuffix,
} from '../../../utils/dateUtils';
import { ReportPrintHeader } from './ReportPrintHeader';
import { ReportExportActions } from './ReportExportActions';
import { DateRangeFilter } from './DateRangeFilter';

interface AcademicReportTableProps {
  academics: AcademicReportRow[];
  availableClasses: string[];
  availableSessions: string[];
  selectedSession: string;
  onSessionChange: (session: string) => void;
  userRole?: string;
}

export const AcademicReportTable: React.FC<AcademicReportTableProps> = ({
  academics,
  availableClasses,
  availableSessions,
  selectedSession,
  onSessionChange,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<keyof AcademicReportRow>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute unique exam names
  const availableExams = useMemo(() => {
    const set = new Set<string>();
    academics.forEach((a) => a.examName && set.add(a.examName.trim()));
    return Array.from(set).sort();
  }, [academics]);

  // Filter and sort
  const filteredAcademics = useMemo(() => {
    return academics
      .filter((a) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchStudent = (a.studentName || '').toLowerCase().includes(q);
          const matchAdm = (a.admissionNumber || '').toLowerCase().includes(q);
          const matchExam = (a.examName || '').toLowerCase().includes(q);
          const matchRoll = (a.rollNumber || '').toLowerCase().includes(q);
          if (!matchStudent && !matchAdm && !matchExam && !matchRoll) {
            return false;
          }
        }

        // Exam Filter
        if (selectedExam !== 'all' && (a.examName || '').trim() !== selectedExam) {
          return false;
        }

        // Class Filter
        if (selectedClass !== 'all' && (a.className || '').trim() !== selectedClass) {
          return false;
        }

        // Status Filter
        if (selectedStatus !== 'all') {
          const st = (a.resultStatus || '').toLowerCase();
          if (selectedStatus === 'passed' && st !== 'passed' && st !== 'promoted') return false;
          if (selectedStatus === 'failed' && st !== 'failed' && st !== 'absent') return false;
          if (selectedStatus === 'compartment' && st !== 'compartment') return false;
        }

        // Date Range Filter (Exam Date)
        if (!isDateInRange(a.examDate, fromISO, toISO)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        const strA = (valA ?? '').toString().toLowerCase();
        const strB = (valB ?? '').toString().toLowerCase();
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    academics,
    searchQuery,
    selectedExam,
    selectedClass,
    selectedStatus,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  const totalEvaluated = filteredAcademics.length;
  const passedCount = filteredAcademics.filter(
    (a) =>
      (a.resultStatus || '').toLowerCase() === 'passed' ||
      (a.resultStatus || '').toLowerCase() === 'promoted' ||
      (!a.resultStatus && a.percentage >= 33)
  ).length;
  const passRate = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 0;
  const avgPercentage =
    totalEvaluated > 0
      ? Number(
          (filteredAcademics.reduce((acc, a) => acc + a.percentage, 0) / totalEvaluated).toFixed(1)
        )
      : 0;

  const handleSort = (field: keyof AcademicReportRow) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
    setFromISO('');
    setToISO('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedExam('all');
    setSelectedClass('all');
    setSelectedStatus('all');
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedExam !== 'all' ||
    selectedClass !== 'all' ||
    selectedStatus !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Summarize active filters for print layout
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (selectedSession !== 'all') summary.push(`Session: ${selectedSession}`);
    if (selectedExam !== 'all') summary.push(`Exam: ${selectedExam}`);
    if (selectedClass !== 'all') summary.push(`Class: ${selectedClass}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Exam Date: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [
    selectedSession,
    selectedExam,
    selectedClass,
    selectedStatus,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredAcademics.length === 0) return;

    const headers = [
      'Admission Number',
      'Student Name',
      'Class',
      'Section',
      'Roll Number',
      'Examination Name',
      'Academic Session',
      'Total Marks Obtained',
      'Maximum Total Marks',
      'Percentage (%)',
      'Letter Grade',
      'Result Status',
      'Published Status',
    ];

    const rows = filteredAcademics.map((a) => [
      a.admissionNumber || '—',
      a.studentName || '—',
      a.className || '—',
      a.section || '—',
      a.rollNumber || '—',
      a.examName || '—',
      a.academicYear || selectedSession || '—',
      a.totalObtained,
      a.totalMax,
      a.percentage.toFixed(1),
      a.overallGrade || '—',
      a.resultStatus ? a.resultStatus.toUpperCase() : a.percentage >= 33 ? 'PASSED' : 'FAILED',
      a.isPublished ? 'Published' : 'Draft / Unpublished',
    ]);

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    exportToCSV('academic-scorecards', headers, rows, dateSuffix);
  };

  const renderGradeBadge = (grade: string) => {
    const g = (grade || 'E').toUpperCase().trim();
    let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    if (g === 'A1' || g === 'A2') {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    } else if (g === 'B1' || g === 'B2') {
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
    } else if (g === 'C1' || g === 'C2') {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
    } else if (g === 'D') {
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300 font-medium';
    } else {
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
    }

    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-[11px] border text-center font-mono ${colorClasses}`}
      >
        {g}
      </span>
    );
  };

  const renderStatusBadge = (status?: ExamResultStatus | string, percentage: number = 0) => {
    const st = (status || (percentage >= 33 ? 'passed' : 'failed')).toLowerCase();
    switch (st) {
      case 'passed':
      case 'promoted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
          </span>
        );
      case 'compartment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Compartment
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Absent
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Failed
          </span>
        );
    }
  };

  return (
    <div id="academic-report-container" className="space-y-4">
      {/* Official Print Header (Visible only on print) */}
      <ReportPrintHeader
        reportTitle="Academic Examination Performance Scorecards"
        academicSession={selectedSession === 'all' ? 'All Academic Sessions' : selectedSession}
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Total Scorecards', value: filteredAcademics.length },
          { label: 'Pass Rate', value: `${passRate}%` },
          { label: 'Passed Students', value: passedCount },
          { label: 'Average Score', value: `${avgPercentage}%` },
        ]}
      />

      {/* Top Filter Controls */}
      <div
        id="academic-report-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="academic-report-search-input"
              type="text"
              placeholder="Search by student name, admission no, exam name, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Academic Session */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Session:</span>
              <select
                id="academic-report-session-select"
                value={selectedSession}
                onChange={(e) => onSessionChange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Sessions</option>
                {availableSessions.map((sess) => (
                  <option key={sess} value={sess}>
                    {sess}
                  </option>
                ))}
              </select>
            </div>

            {/* Examination Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Exam:</span>
              <select
                id="academic-report-exam-select"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">All Examinations</option>
                {availableExams.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Class:</span>
              <select
                id="academic-report-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Result:</span>
              <select
                id="academic-report-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Results</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="compartment">Compartment</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="academic-report-clear-filters-btn"
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="pt-2 border-t border-slate-100">
          <DateRangeFilter
            idPrefix="academic-report-date"
            label="Exam Date Range"
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

        {/* Counter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-800">{filteredAcademics.length}</strong> evaluated
              student scorecards
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Pass Rate: {passRate}% ({passedCount}/{totalEvaluated})
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              Average: {avgPercentage}%
            </span>
          </div>

          <ReportExportActions
            idPrefix="academic-report"
            recordCount={filteredAcademics.length}
            onExportCSV={handleExportCSV}
            csvLabel="Export CSV"
            printLabel="Print Scorecards"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table id="academic-report-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th
                  onClick={() => handleSort('studentName')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Student & Admission
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('className')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Class & Sec
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rollNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Roll No
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('examName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Examination
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Session</th>
                <th
                  onClick={() => handleSort('totalMarks')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Marks
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Percentage %
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Grade
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAcademics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">No academic results found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No examination scorecards match your search and filter criteria.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAcademics.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    id={`academic-report-row-${r.id}`}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-800">{r.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Adm: {r.admissionNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {r.className} - {r.section}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {r.rollNumber || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">
                      <div className="font-medium text-slate-900 truncate max-w-[180px]" title={r.examName}>
                        {r.examName}
                      </div>
                      <div className="text-[10px] text-slate-400">{r.examType}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {r.academicYear}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                      <span className="font-bold">{r.totalMarks}</span>
                      <span className="text-slate-400 text-[10px]"> / {r.totalMaxMarks}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                      {r.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderGradeBadge(r.grade)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(r.resultStatus, r.percentage)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {r.published ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Eye className="w-2.5 h-2.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <EyeOff className="w-2.5 h-2.5" /> Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
