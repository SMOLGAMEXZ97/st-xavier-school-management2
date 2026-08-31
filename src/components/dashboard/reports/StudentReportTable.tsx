import React, { useState, useMemo } from 'react';
import { StudentReportRow } from '../../../types';
import {
  Search,
  Users,
  Filter,
  UserCheck,
  UserX,
  Phone,
  GraduationCap,
  ChevronDown,
  RefreshCw,
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

interface StudentReportTableProps {
  students: StudentReportRow[];
  availableClasses: string[];
  availableSections: string[];
  availableSessions: string[];
  selectedSession: string;
  onSessionChange: (session: string) => void;
}

export const StudentReportTable: React.FC<StudentReportTableProps> = ({
  students,
  availableClasses,
  availableSections,
  availableSessions,
  selectedSession,
  onSessionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<keyof StudentReportRow>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered and sorted dataset
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (s.fullName || '').toLowerCase().includes(q);
          const matchAdm = (s.admissionNumber || '').toLowerCase().includes(q);
          const matchStudentId = (s.studentId || '').toLowerCase().includes(q);
          const matchRoll = (s.rollNumber || '').toLowerCase().includes(q);
          const matchGuardian = (s.guardianName || '').toLowerCase().includes(q);
          const matchPhone = (s.guardianPhone || '').toLowerCase().includes(q);
          if (!matchName && !matchAdm && !matchStudentId && !matchRoll && !matchGuardian && !matchPhone) {
            return false;
          }
        }

        // Class Filter
        if (selectedClass !== 'all' && (s.className || '').trim() !== selectedClass) {
          return false;
        }

        // Section Filter
        if (selectedSection !== 'all' && (s.section || '').trim().toUpperCase() !== selectedSection) {
          return false;
        }

        // Status Filter
        if (selectedStatus === 'active' && !s.active) return false;
        if (selectedStatus === 'inactive' && s.active) return false;

        // Gender Filter
        if (selectedGender !== 'all') {
          const g = (s.gender || '').toLowerCase().trim();
          if (selectedGender === 'male' && g !== 'male' && g !== 'm') return false;
          if (selectedGender === 'female' && g !== 'female' && g !== 'f') return false;
          if (selectedGender === 'other' && g !== 'other' && g !== 'o') return false;
        }

        // Date Range Filter (Admission Date)
        if (!isDateInRange(s.admissionDate, fromISO, toISO)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = (a[sortField] ?? '').toString().toLowerCase();
        const valB = (b[sortField] ?? '').toString().toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    students,
    searchQuery,
    selectedClass,
    selectedSection,
    selectedStatus,
    selectedGender,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  const activeCount = filteredStudents.filter((s) => s.active).length;
  const inactiveCount = filteredStudents.filter((s) => !s.active).length;

  const handleSort = (field: keyof StudentReportRow) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedStatus('all');
    setSelectedGender('all');
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedClass !== 'all' ||
    selectedSection !== 'all' ||
    selectedStatus !== 'all' ||
    selectedGender !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Summarize active filters for print layout
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (selectedSession !== 'all') summary.push(`Session: ${selectedSession}`);
    if (selectedClass !== 'all') summary.push(`Class: ${selectedClass}`);
    if (selectedSection !== 'all') summary.push(`Sec: ${selectedSection}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (selectedGender !== 'all') summary.push(`Gender: ${selectedGender}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Admitted: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [
    selectedSession,
    selectedClass,
    selectedSection,
    selectedStatus,
    selectedGender,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = [
      'Admission Number',
      'Student Name',
      'Class',
      'Section',
      'Roll Number',
      'Gender',
      'Status',
      'Date of Birth',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Residential Address',
      'Academic Session',
      'Admission Date',
    ];

    const rows = filteredStudents.map((s) => [
      s.admissionNumber || '—',
      s.fullName || '—',
      s.className || '—',
      s.section || '—',
      s.rollNumber || '—',
      s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1).toLowerCase() : '—',
      s.active ? 'Active' : 'Inactive',
      s.dob || '—',
      s.guardianName || '—',
      s.guardianPhone || '—',
      s.guardianEmail || '—',
      s.address || '—',
      s.academicSession || selectedSession || '—',
      s.admissionDate || '—',
    ]);

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    exportToCSV('student-register', headers, rows, dateSuffix);
  };

  return (
    <div id="student-report-container" className="space-y-4">
      {/* Official Print Header (Visible only on print) */}
      <ReportPrintHeader
        reportTitle="Official Student Register Report"
        academicSession={selectedSession === 'all' ? 'All Academic Sessions' : selectedSession}
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Total Students', value: filteredStudents.length },
          { label: 'Active', value: activeCount },
          { label: 'Inactive', value: inactiveCount },
        ]}
      />

      {/* Top Filter Controls */}
      <div
        id="student-report-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="student-report-search-input"
              type="text"
              placeholder="Search by name, admission no, roll no, guardian, phone..."
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
                id="student-report-session-select"
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

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Class:</span>
              <select
                id="student-report-class-select"
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

            {/* Section Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Section:</span>
              <select
                id="student-report-section-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Sec {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                id="student-report-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="student-report-clear-filters-btn"
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
            idPrefix="student-report-date"
            label="Admission Date Range"
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
              Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
              <strong className="text-slate-800">{students.length}</strong> students
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <UserCheck className="w-3 h-3" /> {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                <UserX className="w-3 h-3" /> {inactiveCount} Inactive
              </span>
            )}
          </div>

          {/* Export & Print Action Buttons */}
          <ReportExportActions
            idPrefix="student-report"
            recordCount={filteredStudents.length}
            onExportCSV={handleExportCSV}
            csvLabel="Export CSV"
            printLabel="Print Register"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table id="student-report-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th
                  onClick={() => handleSort('fullName')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('admissionNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Admission No
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
                <th className="py-3 px-3">Session</th>
                <th className="py-3 px-3">Gender</th>
                <th className="py-3 px-4">Guardian Name</th>
                <th className="py-3 px-4">Guardian Phone</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">No student records found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No students match your current search and filter criteria. Try resetting your filters.
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
                filteredStudents.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    id={`student-report-row-${s.studentId}`}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[160px]" title={s.fullName}>
                          {s.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {s.admissionNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {s.className} - {s.section}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {s.rollNumber || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {s.academicYear}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize">
                      {s.gender || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      <span className="font-medium">{s.guardianName}</span>
                      {s.guardianRelationship && (
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({s.guardianRelationship})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {s.guardianPhone && s.guardianPhone !== '-' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {s.guardianPhone}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Inactive
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
