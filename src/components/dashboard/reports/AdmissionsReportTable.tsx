import React, { useState, useMemo } from 'react';
import { AdmissionsReportRow } from '../../../types';
import {
  Search,
  UserPlus,
  CheckCircle2,
  Clock,
  PhoneCall,
  XCircle,
  ChevronDown,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
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

interface AdmissionsReportTableProps {
  inquiries: AdmissionsReportRow[];
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const AdmissionsReportTable: React.FC<AdmissionsReportTableProps> = ({
  inquiries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<keyof AdmissionsReportRow>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute available grades
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((inq) => inq.gradeApplying && set.add(inq.gradeApplying.trim()));
    return Array.from(set).sort();
  }, [inquiries]);

  // Filter and sort inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter((inq) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchStudent = (inq.studentName || '').toLowerCase().includes(q);
          const matchParent = (inq.parentName || '').toLowerCase().includes(q);
          const matchPhone = (inq.phone || '').toLowerCase().includes(q);
          const matchEmail = (inq.email || '').toLowerCase().includes(q);
          const matchNotes = (inq.notes || '').toLowerCase().includes(q);
          if (!matchStudent && !matchParent && !matchPhone && !matchEmail && !matchNotes) {
            return false;
          }
        }

        // Status
        if (selectedStatus !== 'all' && (inq.status || 'pending').toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }

        // Grade
        if (selectedGrade !== 'all' && (inq.gradeApplying || '').trim() !== selectedGrade) {
          return false;
        }

        // Date Range (Submission Date)
        if (!isDateInRange(inq.createdAt, fromISO, toISO)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    inquiries,
    searchQuery,
    selectedStatus,
    selectedGrade,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  const pendingCount = filteredInquiries.filter((i) => (i.status || 'pending') === 'pending').length;
  const contactedCount = filteredInquiries.filter((i) => i.status === 'contacted').length;
  const enrolledCount = filteredInquiries.filter((i) => i.status === 'enrolled').length;
  const conversionRate =
    filteredInquiries.length > 0
      ? Math.round((enrolledCount / filteredInquiries.length) * 100)
      : 0;

  const handleSort = (field: keyof AdmissionsReportRow) => {
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
    setSelectedStatus('all');
    setSelectedGrade('all');
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedGrade !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Summarize active filters for print layout
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (selectedGrade !== 'all') summary.push(`Grade: ${selectedGrade}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Date: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [selectedGrade, selectedStatus, fromDate, toDate, searchQuery]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredInquiries.length === 0) return;

    const headers = [
      'Date Submitted',
      'Applicant Name',
      'Grade Applying',
      'Parent / Guardian Name',
      'Phone Number',
      'Email Address',
      'Status',
      'Counselor Notes / Remarks',
    ];

    const rows = filteredInquiries.map((inq) => [
      formatDate(inq.createdAt),
      inq.studentName || '—',
      inq.gradeApplying || '—',
      inq.parentName || '—',
      inq.phone || '—',
      inq.email || '—',
      inq.status ? inq.status.toUpperCase() : 'PENDING',
      inq.notes || '—',
    ]);

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    exportToCSV('admissions-leads', headers, rows, dateSuffix);
  };

  const renderStatusBadge = (status?: string) => {
    const st = (status || 'pending').toLowerCase();
    switch (st) {
      case 'enrolled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enrolled
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PhoneCall className="w-3 h-3 text-blue-600" /> Contacted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Closed / Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div id="admissions-report-container" className="space-y-4">
      {/* Official Print Header (Visible only on print) */}
      <ReportPrintHeader
        reportTitle="Admissions Inquiries & Pipeline Report"
        academicSession="All Active Batches"
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Total Inquiries', value: filteredInquiries.length },
          { label: 'Pending', value: pendingCount },
          { label: 'Contacted', value: contactedCount },
          { label: 'Enrolled', value: enrolledCount },
          { label: 'Conversion Rate', value: `${conversionRate}%` },
        ]}
      />

      {/* Top Filter Controls */}
      <div
        id="admissions-report-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admissions-report-search-input"
              type="text"
              placeholder="Search by applicant, parent, phone, email, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                id="admissions-report-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Application Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="enrolled">Enrolled</option>
                <option value="rejected">Rejected / Closed</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Grade:</span>
              <select
                id="admissions-report-grade-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Grades</option>
                {availableGrades.map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="admissions-report-clear-filters-btn"
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
            idPrefix="admissions-report-date"
            label="Inquiry Date Range"
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
              Showing <strong className="text-slate-800">{filteredInquiries.length}</strong> inquiries
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              {pendingCount} Pending
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              {contactedCount} Contacted
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              {enrolledCount} Enrolled ({conversionRate}% Conv.)
            </span>
          </div>

          <ReportExportActions
            idPrefix="admissions-report"
            recordCount={filteredInquiries.length}
            onExportCSV={handleExportCSV}
            csvLabel="Export CSV"
            printLabel="Print Pipeline"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table id="admissions-report-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Date Submitted
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Applicant Name
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('parentName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Parent / Guardian
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Contact Details</th>
                <th
                  onClick={() => handleSort('gradeApplying')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Grade Applying
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Follow-up Notes / Message</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserPlus className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">No admissions inquiries found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No admissions leads match your current search and filter criteria.
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
                filteredInquiries.map((inq, idx) => (
                  <tr
                    key={inq.id || idx}
                    id={`admissions-report-row-${inq.id}`}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(inq.createdAt)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {inq.studentName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {inq.parentName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {inq.phone && inq.phone !== '-' && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-2.5 h-2.5 text-slate-400" /> {inq.phone}
                          </span>
                        )}
                        {inq.email && inq.email !== '-' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[150px]" title={inq.email}>
                            <Mail className="w-2.5 h-2.5 text-slate-400" /> {inq.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold">
                        {inq.gradeApplying}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-[200px] truncate" title={inq.notes}>
                      {inq.notes || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(inq.status)}
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
