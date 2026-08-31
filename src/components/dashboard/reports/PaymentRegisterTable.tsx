import React, { useState, useMemo } from 'react';
import { PaymentRegisterRow, PaymentStatus } from '../../../types';
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ChevronDown,
  RefreshCw,
  Calendar,
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

interface PaymentRegisterTableProps {
  payments: PaymentRegisterRow[];
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

export const PaymentRegisterTable: React.FC<PaymentRegisterTableProps> = ({
  payments,
  availableSessions,
  selectedSession,
  onSessionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromISO, setFromISO] = useState('');
  const [toISO, setToISO] = useState('');
  const [sortField, setSortField] = useState<keyof PaymentRegisterRow>('paidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort payment transactions
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (p.studentName || '').toLowerCase().includes(q);
          const matchAdm = (p.admissionNumber || '').toLowerCase().includes(q);
          const matchReceipt = (p.receiptNumber || '').toLowerCase().includes(q);
          const matchRef = (p.reference || '').toLowerCase().includes(q);
          if (!matchName && !matchAdm && !matchReceipt && !matchRef) {
            return false;
          }
        }

        // Method
        if (selectedMethod !== 'all' && (p.method || '').toLowerCase() !== selectedMethod.toLowerCase()) {
          return false;
        }

        // Status
        if (selectedStatus !== 'all' && (p.status || 'success') !== selectedStatus) {
          return false;
        }

        // Date Range (Payment Date)
        if (!isDateInRange(p.paidAt, fromISO, toISO)) {
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
    payments,
    searchQuery,
    selectedMethod,
    selectedStatus,
    fromISO,
    toISO,
    sortField,
    sortOrder,
  ]);

  const totalCollected = filteredPayments
    .filter((p) => (p.status || 'success') === 'success')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleSort = (field: keyof PaymentRegisterRow) => {
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
    setSelectedMethod('all');
    setSelectedStatus('all');
    clearDateRange();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedMethod !== 'all' ||
    selectedStatus !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  // Summarize active filters for print layout
  const appliedFiltersSummary = useMemo(() => {
    const summary: string[] = [];
    if (selectedSession !== 'all') summary.push(`Session: ${selectedSession}`);
    if (selectedMethod !== 'all') summary.push(`Method: ${selectedMethod}`);
    if (selectedStatus !== 'all') summary.push(`Status: ${selectedStatus.toUpperCase()}`);
    if (fromDate || toDate) {
      const rangeText = formatDateRangeDisplay(fromDate, toDate);
      if (rangeText) summary.push(`Date: ${rangeText}`);
    }
    if (searchQuery.trim()) summary.push(`Search: "${searchQuery.trim()}"`);
    return summary;
  }, [
    selectedSession,
    selectedMethod,
    selectedStatus,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Receipt Number',
      'Payment Date',
      'Admission Number',
      'Student Name',
      'Class',
      'Section',
      'Amount (INR)',
      'Payment Method',
      'Transaction Reference',
      'Academic Session',
      'Status',
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber || '—',
      formatDate(p.paidAt),
      p.admissionNumber || '—',
      p.studentName || '—',
      p.className || '—',
      p.section || '—',
      p.amount,
      p.method || '—',
      p.reference || '—',
      p.academicYear || selectedSession || '—',
      p.status ? p.status.toUpperCase() : 'SUCCESS',
    ]);

    const dateSuffix = getDateRangeFileSuffix(fromDate, toDate);
    exportToCSV('payment-register', headers, rows, dateSuffix);
  };

  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div id="payment-register-container" className="space-y-4">
      {/* Official Print Header (Visible only on print) */}
      <ReportPrintHeader
        reportTitle="Payment & Receipt Register Report"
        academicSession={selectedSession === 'all' ? 'All Academic Sessions' : selectedSession}
        appliedFiltersSummary={appliedFiltersSummary}
        summaryMetrics={[
          { label: 'Total Receipts', value: filteredPayments.length },
          { label: 'Total Realized Revenue', value: formatCurrency(totalCollected) },
        ]}
      />

      {/* Top Filter Controls */}
      <div
        id="payment-register-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="payment-register-search-input"
              type="text"
              placeholder="Search by student, admission no, receipt no, reference..."
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
                id="payment-register-session-select"
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

            {/* Payment Method */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Method:</span>
              <select
                id="payment-register-method-select"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Debit/Credit Card">Card</option>
                <option value="Online Portal">Online Portal</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                id="payment-register-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="payment-register-clear-filters-btn"
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
            idPrefix="payment-register-date"
            label="Payment Date Range"
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
              Showing <strong className="text-slate-800">{filteredPayments.length}</strong> payment
              transactions
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">
              Total Realized: {formatCurrency(totalCollected)}
            </span>
          </div>

          <ReportExportActions
            idPrefix="payment-register"
            recordCount={filteredPayments.length}
            onExportCSV={handleExportCSV}
            csvLabel="Export CSV"
            printLabel="Print Register"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table id="payment-register-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th
                  onClick={() => handleSort('receiptNumber')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Receipt / Txn No
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paidAt')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Payment Date
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Student & Admission
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Class & Sec</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors text-emerald-700"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Reference / Remarks</th>
                <th className="py-3 px-3">Session</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">No payment records found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No payment transactions match your search and filter criteria.
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
                filteredPayments.map((p, idx) => (
                  <tr
                    key={p.id || idx}
                    id={`payment-register-row-${p.id}`}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(p.paidAt)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div className="font-semibold text-slate-800">{p.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Adm: {p.admissionNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {p.className} - {p.section}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] max-w-[140px] truncate" title={p.reference}>
                      {p.reference}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {p.academicYear}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(p.status)}
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
