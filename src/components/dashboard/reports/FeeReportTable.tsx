import React, { useState, useMemo } from 'react';
import { FeeReportRow, FeeStatus } from '../../../types';
import {
  Search,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  IndianRupee,
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

interface FeeReportTableProps {
  fees: FeeReportRow[];
  availableClasses: string[];
  availableSections: string[];
  availableSessions: string[];
  selectedSession: string;
  onSessionChange: (session: string) => void;
}

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const FeeReportTable: React.FC<FeeReportTableProps> = ({
  fees,
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<keyof FeeReportRow>('studentName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort fees
  const filteredFees = useMemo(() => {
    return fees
      .filter((f) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (f.studentName || '').toLowerCase().includes(q);
          const matchAdm = (f.admissionNumber || '').toLowerCase().includes(q);
          const matchStudentId = (f.studentId || '').toLowerCase().includes(q);
          const matchGuardian = (f.guardianName || '').toLowerCase().includes(q);
          const matchType = (f.feeType || '').toLowerCase().includes(q);
          if (!matchName && !matchAdm && !matchStudentId && !matchGuardian && !matchType) {
            return false;
          }
        }

        // Class
        if (selectedClass !== 'all' && (f.className || '').trim() !== selectedClass) {
          return false;
        }

        // Section
        if (selectedSection !== 'all' && (f.section || '').trim().toUpperCase() !== selectedSection) {
          return false;
        }

        // Status
        if (selectedStatus !== 'all' && f.status !== selectedStatus) {
          return false;
        }

        // Date Range (Due Date)
        if (!isDateInRange(f.dueDate, fromISO, toISO)) {
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
    fees,
    searchQuery,
    selectedClass,
    selectedSection,
    selectedStatus,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  // Aggregate stats for the filtered list
  const totalGross = filteredFees.reduce((acc, f) => acc + f.grossAmount, 0);
  const totalConcessions = filteredFees.reduce((acc, f) => acc + f.discount, 0);
  const totalNet = filteredFees.reduce((acc, f) => acc + f.netDemand, 0);
  const totalPaid = filteredFees.reduce((acc, f) => acc + f.totalPaid, 0);
  const totalBalance = filteredFees.reduce((acc, f) => acc + f.balanceDue, 0);

  const handleSort = (field: keyof FeeReportRow) => {
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
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedClass !== 'all' ||
    selectedSection !== 'all' ||
    selectedStatus !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Summarize active filters for print layout
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (selectedSession !== 'all') summary.push(`Session: ${selectedSession}`);
    if (selectedClass !== 'all') summary.push(`Class: ${selectedClass}`);
    if (selectedSection !== 'all') summary.push(`Sec: ${selectedSection}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Due Date: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [
    selectedSession,
    selectedClass,
    selectedSection,
    selectedStatus,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredFees.length === 0) return;

    const headers = [
      'Admission Number',
      'Student Name',
      'Class',
      'Section',
      'Guardian Name',
      'Fee Category',
      'Term',
      'Academic Session',
      'Gross Amount (INR)',
      'Concession (INR)',
      'Net Demand (INR)',
      'Total Paid (INR)',
      'Balance Due (INR)',
      'Status',
      'Due Date',
    ];

    const rows = filteredFees.map((f) => [
      f.admissionNumber || '—',
      f.studentName || '—',
      f.className || '—',
      f.section || '—',
      f.guardianName || '—',
      f.feeType || '—',
      f.term || '—',
      f.academicYear || selectedSession || '—',
      f.grossAmount,
      f.discount,
      f.netDemand,
      f.totalPaid,
      f.balanceDue,
      f.status ? f.status.toUpperCase() : 'PENDING',
      f.dueDate || '—',
    ]);

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    exportToCSV('fee-ledgers', headers, rows, dateSuffix);
  };

  const renderStatusBadge = (status: FeeStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Partial
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Overdue
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Pending
          </span>
        );
    }
  };

  return (
    <div id="fee-report-container" className="space-y-4">
      {/* Official Print Header (Visible only on print) */}
      <ReportPrintHeader
        reportTitle="Student Fee & Dues Ledger Report"
        academicSession={selectedSession === 'all' ? 'All Academic Sessions' : selectedSession}
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Total Records', value: filteredFees.length },
          { label: 'Gross Assessed', value: formatCurrency(totalGross) },
          { label: 'Concessions', value: formatCurrency(totalConcessions) },
          { label: 'Net Demand', value: formatCurrency(totalNet) },
          { label: 'Total Paid', value: formatCurrency(totalPaid) },
          { label: 'Balance Due', value: formatCurrency(totalBalance) },
        ]}
      />

      {/* Top Filter Controls */}
      <div
        id="fee-report-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="fee-report-search-input"
              type="text"
              placeholder="Search by student, admission no, guardian, fee type..."
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
                id="fee-report-session-select"
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
                id="fee-report-class-select"
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
                id="fee-report-section-select"
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
                id="fee-report-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="fee-report-clear-filters-btn"
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
            idPrefix="fee-report-date"
            label="Fee Due Date Range"
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

        {/* Filtered Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Gross Assessed
            </span>
            <span className="font-bold text-slate-800">{formatCurrency(totalGross)}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Concessions
            </span>
            <span className="font-bold text-indigo-700">{formatCurrency(totalConcessions)}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Net Demand
            </span>
            <span className="font-bold text-blue-700">{formatCurrency(totalNet)}</span>
          </div>
          <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100/60">
            <span className="text-emerald-700 block text-[10px] uppercase font-semibold">
              Total Paid
            </span>
            <span className="font-bold text-emerald-800">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100/60 col-span-2 sm:col-span-1">
            <span className="text-amber-700 block text-[10px] uppercase font-semibold">
              Outstanding Balance
            </span>
            <span className="font-bold text-amber-800">{formatCurrency(totalBalance)}</span>
          </div>
        </div>

        {/* Counter and Export Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800">{filteredFees.length}</strong> of{' '}
            <strong className="text-slate-800">{fees.length}</strong> fee ledger entries
          </div>

          <ReportExportActions
            idPrefix="fee-report"
            recordCount={filteredFees.length}
            onExportCSV={handleExportCSV}
            csvLabel="Export CSV"
            printLabel="Print Ledgers"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table id="fee-report-table" className="w-full text-left border-collapse text-xs">
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
                <th className="py-3 px-3">Guardian</th>
                <th className="py-3 px-3">Fee Type & Term</th>
                <th
                  onClick={() => handleSort('grossAmount')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Gross
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('discount')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Concession
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('netDemand')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Net Demand
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalPaid')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors text-emerald-700"
                >
                  <div className="flex items-center justify-end gap-1">
                    Paid
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('balanceDue')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors text-amber-700"
                >
                  <div className="flex items-center justify-end gap-1">
                    Balance Due
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">No fee ledger records found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No fee ledger assessments match your search and filter criteria.
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
                filteredFees.map((f, idx) => (
                  <tr
                    key={f.id || idx}
                    id={`fee-report-row-${f.id}`}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-800">{f.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Adm: {f.admissionNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {f.className} - {f.section}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {f.guardianName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium text-slate-800">{f.feeType}</div>
                      <div className="text-[10px] text-slate-400">{f.term}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatCurrency(f.grossAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-600 whitespace-nowrap">
                      {f.discount > 0 ? `-${formatCurrency(f.discount)}` : '₹0'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(f.netDemand)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(f.totalPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                      {formatCurrency(f.balanceDue)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(f.status)}
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
