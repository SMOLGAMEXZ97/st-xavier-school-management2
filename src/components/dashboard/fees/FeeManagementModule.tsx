import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  PlusCircle,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Building,
  TrendingUp,
  Layers,
  ArrowUpDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Fee, FeeStatus, Payment, Student, StudentFeeSummary } from '../../../types';
import { feeService } from '../../../services/feeService';
import { studentService } from '../../../services/studentService';
import { useAuth } from '../../../context/AuthContext';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CreateFeeModal } from './CreateFeeModal';
import { StudentLedgerModal } from './StudentLedgerModal';
import { FeeReceiptModal } from './FeeReceiptModal';

const CLASSES = [
  'All',
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];

const SECTIONS = ['All', 'A', 'B', 'C', 'D'];
const ACADEMIC_YEARS = ['All', '2026-2027', '2025-2026', '2024-2025'];
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'All', label: 'All Statuses' },
  { value: 'paid', label: 'Paid in Full' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'pending', label: 'Pending Dues' },
  { value: 'overdue', label: 'Overdue' },
];

export const FeeManagementModule: React.FC = () => {
  const { userProfile, role } = useAuth();
  const canManageFees = role === 'super_admin' || role === 'accountant';

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Main Tab
  const [activeView, setActiveView] = useState<'ledgers' | 'payments' | 'assessments'>('ledgers');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal States
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [isCreateFeeOpen, setIsCreateFeeOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeFee, setActiveFee] = useState<Fee | null>(null);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedStudents, fetchedFees, fetchedPayments] = await Promise.all([
        studentService.getAllStudents().catch(() => []),
        feeService.getAllFees().catch(() => []),
        feeService.getAllPayments().catch(() => []),
      ]);

      setStudents(fetchedStudents || []);
      setFees(fetchedFees || []);
      setPayments(fetchedPayments || []);
    } catch (err: any) {
      console.error('Error loading fee management data:', err);
      setError(err?.message || 'Failed to load fee records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute student-wise ledger summaries
  const studentLedgers: StudentFeeSummary[] = useMemo(() => {
    return students.map((student) => {
      const studentId = student.id || student.studentId;
      const studentFeesList = fees.filter(
        (f) => f.studentId === student.id || f.studentId === student.studentId
      );
      const studentPaymentsList = payments.filter(
        (p) => p.studentId === student.id || p.studentId === student.studentId
      );

      const totalAssessed = studentFeesList.reduce(
        (sum, f) => sum + (Number(f.amountDue) || 0),
        0
      );
      const totalDiscount = studentFeesList.reduce(
        (sum, f) => sum + (Number(f.discount) || 0),
        0
      );
      const totalNetDue = Math.max(0, totalAssessed - totalDiscount);
      const totalPaid = studentPaymentsList.reduce(
        (sum, p) => (p.status === 'success' ? sum + (Number(p.amount) || 0) : sum),
        0
      );
      const balanceDue = Math.max(0, totalNetDue - totalPaid);

      const hasOverdue = studentFeesList.some((f) => {
        if (f.status === 'overdue') return true;
        if (f.status !== 'paid' && f.dueDate && new Date(f.dueDate) < new Date()) {
          return true;
        }
        return false;
      });

      let status: StudentFeeSummary['status'] = 'no_dues';
      if (totalNetDue === 0) {
        status = 'no_dues';
      } else if (balanceDue === 0) {
        status = 'paid';
      } else if (hasOverdue) {
        status = 'overdue';
      } else if (totalPaid > 0) {
        status = 'partially_paid';
      } else {
        status = 'pending';
      }

      return {
        student,
        fees: studentFeesList,
        payments: studentPaymentsList,
        totalAssessed,
        totalDiscount,
        totalNetDue,
        totalPaid,
        balanceDue,
        status,
        hasOverdue,
      };
    });
  }, [students, fees, payments]);

  // Overall Financial Metrics
  const metrics = useMemo(() => {
    const totalAssessedDemand = fees.reduce(
      (sum, f) => sum + (Number(f.amountDue) || 0),
      0
    );
    const totalDiscountAmount = fees.reduce(
      (sum, f) => sum + (Number(f.discount) || 0),
      0
    );
    const totalNetReceivable = Math.max(0, totalAssessedDemand - totalDiscountAmount);

    const totalCollected = payments.reduce(
      (sum, p) => (p.status === 'success' ? sum + (Number(p.amount) || 0) : sum),
      0
    );

    const totalOutstanding = Math.max(0, totalNetReceivable - totalCollected);
    const collectionPercentage =
      totalNetReceivable > 0
        ? Math.min(100, Math.round((totalCollected / totalNetReceivable) * 100))
        : 0;

    const overdueCount = fees.filter((f) => {
      if (f.status === 'overdue') return true;
      if (f.status !== 'paid' && f.dueDate && new Date(f.dueDate) < new Date()) {
        return true;
      }
      return false;
    }).length;

    return {
      totalAssessedDemand,
      totalDiscountAmount,
      totalNetReceivable,
      totalCollected,
      totalOutstanding,
      collectionPercentage,
      overdueCount,
      totalPaymentsCount: payments.length,
      totalFeesCount: fees.length,
    };
  }, [fees, payments]);

  // Filtered Student Ledgers
  const filteredLedgers = useMemo(() => {
    return studentLedgers.filter((item) => {
      const { student } = item;
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const admNo = (student.admissionNumber || '').toLowerCase();
      const guardian = (student.guardianName || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      if (query && !fullName.includes(query) && !admNo.includes(query) && !guardian.includes(query)) {
        return false;
      }

      if (selectedClass !== 'All' && student.className !== selectedClass) {
        return false;
      }

      if (selectedSection !== 'All' && student.section !== selectedSection) {
        return false;
      }

      if (selectedYear !== 'All' && student.academicYear !== selectedYear) {
        return false;
      }

      if (selectedStatus !== 'All') {
        if (selectedStatus === 'paid' && item.status !== 'paid' && item.status !== 'no_dues') return false;
        if (selectedStatus === 'partially_paid' && item.status !== 'partially_paid') return false;
        if (selectedStatus === 'pending' && item.status !== 'pending') return false;
        if (selectedStatus === 'overdue' && item.status !== 'overdue') return false;
      }

      return true;
    });
  }, [studentLedgers, searchQuery, selectedClass, selectedSection, selectedYear, selectedStatus]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = (p.studentName || '').toLowerCase();
      const admNo = (p.admissionNumber || '').toLowerCase();
      const receiptNo = (p.receiptNumber || '').toLowerCase();
      const txnId = (p.transactionId || '').toLowerCase();

      if (q && !studentName.includes(q) && !admNo.includes(q) && !receiptNo.includes(q) && !txnId.includes(q)) {
        return false;
      }

      if (selectedClass !== 'All' && p.className && p.className !== selectedClass) {
        return false;
      }

      if (selectedSection !== 'All' && p.section && p.section !== selectedSection) {
        return false;
      }

      return true;
    });
  }, [payments, searchQuery, selectedClass, selectedSection]);

  // Filtered Fee Assessments List
  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = (f.studentName || '').toLowerCase();
      const admNo = (f.admissionNumber || '').toLowerCase();
      const feeType = (f.feeType || '').toLowerCase();

      if (q && !studentName.includes(q) && !admNo.includes(q) && !feeType.includes(q)) {
        return false;
      }

      if (selectedClass !== 'All' && f.className && f.className !== selectedClass) {
        return false;
      }

      if (selectedSection !== 'All' && f.section && f.section !== selectedSection) {
        return false;
      }

      if (selectedYear !== 'All' && f.academicYear !== selectedYear) {
        return false;
      }

      if (selectedStatus !== 'All' && f.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [fees, searchQuery, selectedClass, selectedSection, selectedYear, selectedStatus]);

  // Handlers for modal interactions
  const handleOpenRecordPayment = (student?: Student, fee?: Fee) => {
    setActiveStudent(student || null);
    setActiveFee(fee || null);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenCreateFee = (student?: Student) => {
    setActiveStudent(student || null);
    setIsCreateFeeOpen(true);
  };

  const handleOpenLedgerModal = (student: Student) => {
    setActiveStudent(student);
    setIsLedgerModalOpen(true);
  };

  const handleViewReceipt = (payment: Payment, fee?: Fee) => {
    const student = students.find(
      (s) => s.id === payment.studentId || s.studentId === payment.studentId
    ) || null;
    setActiveStudent(student);
    setActivePayment(payment);
    setActiveFee(fee || null);
    setIsReceiptModalOpen(true);
  };

  const handlePaymentSuccess = (newPayment: Payment, updatedFee?: Fee) => {
    setIsRecordPaymentOpen(false);
    fetchData();
    // Offer immediate receipt view
    const student = students.find(
      (s) => s.id === newPayment.studentId || s.studentId === newPayment.studentId
    ) || null;
    setActiveStudent(student);
    setActivePayment(newPayment);
    setActiveFee(updatedFee || null);
    setIsReceiptModalOpen(true);
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      await feeService.deleteFee(feeId);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete fee record');
    }
  };

  // CSV Export (Sanitized, NO UIDs, NO Passwords)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeView === 'ledgers') {
      headers = [
        'Admission Number',
        'Student Name',
        'Class',
        'Section',
        'Roll Number',
        'Guardian Name',
        'Total Assessed (INR)',
        'Concession (INR)',
        'Net Demand (INR)',
        'Total Paid (INR)',
        'Outstanding Balance (INR)',
        'Status',
      ];
      rows = filteredLedgers.map((item) => [
        `"${item.student.admissionNumber || ''}"`,
        `"${item.student.firstName || ''} ${item.student.lastName || ''}"`,
        `"${item.student.className || ''}"`,
        `"${item.student.section || ''}"`,
        `"${item.student.rollNumber || ''}"`,
        `"${item.student.guardianName || ''}"`,
        `${item.totalAssessed}`,
        `${item.totalDiscount}`,
        `${item.totalNetDue}`,
        `${item.totalPaid}`,
        `${item.balanceDue}`,
        `"${item.status.toUpperCase()}"`,
      ]);
    } else if (activeView === 'payments') {
      headers = [
        'Receipt Number',
        'Transaction ID',
        'Payment Date',
        'Student Name',
        'Admission Number',
        'Class',
        'Section',
        'Fee Category',
        'Term',
        'Payment Mode',
        'Amount Paid (INR)',
        'Received By',
      ];
      rows = filteredPayments.map((p) => [
        `"${p.receiptNumber || ''}"`,
        `"${p.transactionId || ''}"`,
        `"${p.paidAt || ''}"`,
        `"${p.studentName || ''}"`,
        `"${p.admissionNumber || ''}"`,
        `"${p.className || ''}"`,
        `"${p.section || ''}"`,
        `"${p.feeType || ''}"`,
        `"${p.term || ''}"`,
        `"${p.method || ''}"`,
        `${p.amount || 0}`,
        `"${p.receivedBy || ''}"`,
      ]);
    } else {
      headers = [
        'Admission Number',
        'Student Name',
        'Class',
        'Section',
        'Academic Year',
        'Fee Head',
        'Term',
        'Amount Due (INR)',
        'Discount (INR)',
        'Net Due (INR)',
        'Due Date',
        'Status',
      ];
      rows = filteredFees.map((f) => [
        `"${f.admissionNumber || ''}"`,
        `"${f.studentName || ''}"`,
        `"${f.className || ''}"`,
        `"${f.section || ''}"`,
        `"${f.academicYear || ''}"`,
        `"${f.feeType || ''}"`,
        `"${f.term || ''}"`,
        `${f.amountDue || 0}`,
        `${f.discount || 0}`,
        `${Math.max(0, (f.amountDue || 0) - (f.discount || 0))}`,
        `"${f.dueDate || ''}"`,
        `"${f.status.toUpperCase()}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SXHS_Fee_Report_${activeView}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTable = () => {
    window.print();
  };

  const hasActiveFilters =
    selectedClass !== 'All' ||
    selectedSection !== 'All' ||
    selectedYear !== 'All' ||
    selectedStatus !== 'All' ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('All');
    setSelectedSection('All');
    setSelectedYear('All');
    setSelectedStatus('All');
  };

  return (
    <div className="space-y-6">
      {/* 1. MODULE TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-900/10 text-blue-900 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold font-serif text-slate-900">
                Fee Ledgers & Payments Desk
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Student financial accounts, fee structure assessments, payment transaction settlement, and official receipt issuing.
            </p>
          </div>

          {/* QUICK TOP ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              title="Refresh ledger database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {canManageFees && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenRecordPayment()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Record Payment
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateFee()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Assessment
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. SUMMARY METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Net Demand
              </span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-slate-900">
                ₹{metrics.totalNetReceivable.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gross: ₹{metrics.totalAssessedDemand.toLocaleString('en-IN')} (Disc: ₹{metrics.totalDiscountAmount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Total Collected
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-emerald-950">
                ₹{metrics.totalCollected.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.collectionPercentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 shrink-0">
                  {metrics.collectionPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Outstanding Dues
              </span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-rose-950">
                ₹{metrics.totalOutstanding.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Pending across active student accounts
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Overdue Assessments
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-amber-950">
                {metrics.overdueCount} <span className="text-xs font-normal text-amber-800">Records</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Past scheduled due date
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-xs">Error Loading Financial Records</h3>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE WITH VIEW TABS */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* VIEW TABS SWITCHER */}
        <div className="px-6 pt-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveView('ledgers')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeView === 'ledgers'
                  ? 'border-blue-900 text-blue-900 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Student Fee Ledgers ({filteredLedgers.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveView('payments')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeView === 'payments'
                  ? 'border-blue-900 text-blue-900 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Payments & Receipts Log ({filteredPayments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveView('assessments')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeView === 'assessments'
                  ? 'border-blue-900 text-blue-900 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              All Fee Heads ({filteredFees.length})
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeView === 'payments'
                    ? 'Search receipt, txn ID, student, adm no...'
                    : 'Search student name, adm no, guardian...'
                }
                className="w-full pl-9 pr-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Classes' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Sections' : `Section ${s}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y === 'All' ? 'All Sessions' : y}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-900"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE FILTER BADGE STRIP */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-3 text-xs">
              <span className="text-slate-500 font-medium">
                Filtering by active criteria ({activeView === 'ledgers' ? filteredLedgers.length : activeView === 'payments' ? filteredPayments.length : filteredFees.length} matching)
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-blue-900 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* 4. TABLE CONTENT BY ACTIVE VIEW */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-900" />
              <p className="text-xs font-semibold text-slate-600">Loading school fee ledgers...</p>
            </div>
          ) : activeView === 'ledgers' ? (
            /* ================= VIEW 1: STUDENT FEE LEDGERS ================= */
            filteredLedgers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm font-serif">No Matching Student Ledgers</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No student records match the selected filter criteria.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 px-3.5 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-lg"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student & Adm No</th>
                    <th className="py-3 px-3">Class & Section</th>
                    <th className="py-3 px-3">Parent / Guardian</th>
                    <th className="py-3 px-3 text-right">Net Demand</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredLedgers.map((item) => {
                    const { student } = item;
                    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();

                    return (
                      <tr
                        key={student.id || student.studentId}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Student Name & Adm */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            Adm: {student.admissionNumber || 'Assigned'}
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">
                            {student.className || 'Class'}
                          </span>
                          {student.section && (
                            <span className="text-slate-500 ml-1">({student.section})</span>
                          )}
                          {student.rollNumber && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Roll: #{student.rollNumber}
                            </span>
                          )}
                        </td>

                        {/* Guardian */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">
                            {student.guardianName || 'Parent on file'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {student.guardianPhone || '—'}
                          </div>
                        </td>

                        {/* Net Demand */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          ₹{item.totalNetDue.toLocaleString('en-IN')}
                        </td>

                        {/* Paid */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          ₹{item.totalPaid.toLocaleString('en-IN')}
                        </td>

                        {/* Balance Due */}
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          <span
                            className={
                              item.balanceDue > 0
                                ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md'
                                : 'text-slate-600'
                            }
                          >
                            ₹{item.balanceDue.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'paid' || item.status === 'no_dues'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.status === 'overdue'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {item.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                            {item.status === 'partially_paid' && <Clock className="w-3 h-3" />}
                            {item.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenLedgerModal(student)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                              title="View complete student statement"
                            >
                              Ledger
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            {canManageFees && (
                              <button
                                type="button"
                                onClick={() => handleOpenRecordPayment(student)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Record payment for this student"
                              >
                                <DollarSign className="w-3 h-3" />
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : activeView === 'payments' ? (
            /* ================= VIEW 2: PAYMENTS & RECEIPTS REGISTRY ================= */
            filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm font-serif">No Transactions Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No payment transactions match the active search criteria.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Payment Mode / Ref</th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th className="py-3 px-3">Received By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredPayments.map((p) => {
                    const linkedStudent = students.find(
                      (s) => s.id === p.studentId || s.studentId === p.studentId
                    );
                    const studentName =
                      linkedStudent
                        ? `${linkedStudent.firstName || ''} ${linkedStudent.lastName || ''}`.trim()
                        : p.studentName || 'Student';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.receiptNumber || 'REC-OFFICIAL'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {formatDateToDisplay(p.paidAt || p.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Adm: {linkedStudent?.admissionNumber || p.admissionNumber || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {linkedStudent?.className || p.className || 'Class'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold uppercase text-slate-900">{p.method}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {p.transactionId}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.receivedBy || 'Accounts Officer'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(p)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold rounded-lg transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* ================= VIEW 3: ALL FEE HEADS ================= */
            filteredFees.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm font-serif">No Fee Heads Recorded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Use "Add Assessment" to assess tuition or term fees.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fee Category / Term</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Academic Session</th>
                    <th className="py-3 px-3 text-right">Assessment</th>
                    <th className="py-3 px-3 text-right">Concession</th>
                    <th className="py-3 px-3 text-right">Net Due</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    {canManageFees && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredFees.map((fee) => {
                    const linkedStudent = students.find(
                      (s) => s.id === fee.studentId || s.studentId === fee.studentId
                    );
                    const studentName =
                      linkedStudent
                        ? `${linkedStudent.firstName || ''} ${linkedStudent.lastName || ''}`.trim()
                        : fee.studentName || 'Student';

                    const net = Math.max(0, (fee.amountDue || 0) - (fee.discount || 0));

                    return (
                      <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{fee.feeType}</div>
                          <div className="text-[10px] text-slate-500">{fee.term}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Adm: {linkedStudent?.admissionNumber || fee.admissionNumber || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {linkedStudent?.className || fee.className || 'Class'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{fee.academicYear}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          ₹{Number(fee.amountDue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {fee.discount > 0 ? `-₹${Number(fee.discount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{net.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {formatDateToDisplay(fee.dueDate)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              fee.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : fee.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : fee.status === 'overdue'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {fee.status.replace('_', ' ')}
                          </span>
                        </td>
                        {canManageFees && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {fee.status !== 'paid' && linkedStudent && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPayment(linkedStudent, fee)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. RECORD PAYMENT MODAL */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        students={students}
        initialStudent={activeStudent}
        initialFee={activeFee}
        allFees={fees}
        allPayments={payments}
      />

      {/* 2. CREATE FEE ASSESSMENT MODAL */}
      <CreateFeeModal
        isOpen={isCreateFeeOpen}
        onClose={() => setIsCreateFeeOpen(false)}
        onFeeCreated={fetchData}
        students={students}
        initialStudent={activeStudent}
      />

      {/* 3. STUDENT LEDGER DOSSIER MODAL */}
      {activeStudent && (
        <StudentLedgerModal
          isOpen={isLedgerModalOpen}
          onClose={() => setIsLedgerModalOpen(false)}
          student={activeStudent}
          fees={fees.filter(
            (f) => f.studentId === activeStudent.id || f.studentId === activeStudent.studentId
          )}
          payments={payments.filter(
            (p) => p.studentId === activeStudent.id || p.studentId === activeStudent.studentId
          )}
          onOpenRecordPayment={(fee) => handleOpenRecordPayment(activeStudent, fee)}
          onOpenCreateFee={() => handleOpenCreateFee(activeStudent)}
          onViewReceipt={(payment, fee) => handleViewReceipt(payment, fee)}
          onDeleteFee={canManageFees ? handleDeleteFee : undefined}
          canManageFees={canManageFees}
        />
      )}

      {/* 4. OFFICIAL PRINTABLE RECEIPT MODAL */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={activePayment}
        fee={activeFee}
        student={activeStudent}
      />
    </div>
  );
};
