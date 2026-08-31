import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Fee, Payment, Student } from '../../../types';
import { feeService } from '../../../services/feeService';
import { useAuth } from '../../../context/AuthContext';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { FeeReceiptModal } from './FeeReceiptModal';

interface StudentFeeLedgerViewProps {
  student: Student | null;
}

export const StudentFeeLedgerView: React.FC<StudentFeeLedgerViewProps> = ({ student }) => {
  const { userProfile, currentUser } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const studentIdentifier = student?.id || student?.studentId || userProfile?.studentId;

  const loadStudentFeeData = async () => {
    if (!studentIdentifier) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [fetchedFees, fetchedPayments] = await Promise.all([
        feeService.getFeesByStudentId(studentIdentifier).catch(() => []),
        feeService.getPaymentsByStudentId(studentIdentifier).catch(() => []),
      ]);

      setFees(fetchedFees || []);
      setPayments(fetchedPayments || []);
    } catch (err: any) {
      console.error('Error fetching student fee data:', err);
      setError('Could not load fee records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentFeeData();
  }, [studentIdentifier]);

  // Aggregate student financial metrics
  const totalAssessed = fees.reduce((sum, f) => sum + (Number(f.amountDue) || 0), 0);
  const totalDiscount = fees.reduce((sum, f) => sum + (Number(f.discount) || 0), 0);
  const totalNetDue = Math.max(0, totalAssessed - totalDiscount);
  const totalPaid = payments.reduce(
    (sum, p) => (p.status === 'success' ? sum + (Number(p.amount) || 0) : sum),
    0
  );
  const balanceDue = Math.max(0, totalNetDue - totalPaid);

  const handleOpenReceipt = (payment: Payment) => {
    const linkedFee = fees.find((f) => f.id === payment.feeId) || null;
    setSelectedPayment(payment);
    setSelectedFee(linkedFee);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SUMMARY */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-900" />
              Fee Ledger & Settlement Statements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official institutional fee assessments, payment history, and downloadable settlement receipts.
            </p>
          </div>
          <button
            type="button"
            onClick={loadStudentFeeData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4-METRIC SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Assessed</span>
            <span className="text-base font-black font-mono text-slate-900 mt-1 block">
              ₹{totalNetDue.toLocaleString('en-IN')}
            </span>
            {totalDiscount > 0 && (
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                (Includes ₹{totalDiscount.toLocaleString('en-IN')} concession)
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] uppercase font-semibold text-emerald-800 block">Total Paid to Date</span>
            <span className="text-base font-black font-mono text-emerald-950 mt-1 block">
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
              {payments.length} verified receipts
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            balanceDue > 0
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}>
            <span className="text-[10px] uppercase font-semibold block">Outstanding Balance</span>
            <span className="text-base font-black font-mono mt-1 block">
              ₹{balanceDue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-medium mt-0.5 block">
              {balanceDue > 0 ? 'Pending settlement' : 'All clear for current term'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Account Status</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  balanceDue === 0 && totalNetDue > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : balanceDue > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {balanceDue === 0 && totalNetDue > 0 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Fees Settled
                  </>
                ) : balanceDue > 0 ? (
                  <>
                    <Clock className="w-3 h-3" />
                    Dues Pending
                  </>
                ) : (
                  'No Invoices'
                )}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Session 2026–2027</span>
          </div>
        </div>
      </div>

      {/* 2. TABBED SECTIONS: ASSESSMENTS & RECEIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FEE ASSESSMENTS BREAKDOWN */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="pb-3 mb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-serif text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-900" />
              Fee Assessments
            </h3>
            <span className="text-xs text-slate-400">{fees.length} Heads</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-900" />
              Loading assessments...
            </div>
          ) : fees.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Pending Assessments</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All term assessments are clear or not yet published.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => {
                const feePayments = payments.filter(
                  (p) => p.feeId === fee.id && p.status === 'success'
                );
                const paid = feePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const net = Math.max(0, (fee.amountDue || 0) - (fee.discount || 0));
                const bal = Math.max(0, net - paid);

                return (
                  <div
                    key={fee.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{fee.feeType}</div>
                        <div className="text-[10px] text-slate-500">
                          {fee.term} • Session {fee.academicYear}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bal === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : bal < net
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bal === 0 ? 'Paid' : bal < net ? 'Partial' : 'Due'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Assessment:</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          ₹{net.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Paid:</span>
                        <span className="font-semibold text-emerald-700 font-mono">
                          ₹{paid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Due Date:</span>
                        <span className="font-medium text-slate-700">
                          {formatDateToDisplay(fee.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAYMENT RECEIPTS & SETTLEMENT LOG */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="pb-3 mb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-serif text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-900" />
              Official Settlement Receipts
            </h3>
            <span className="text-xs text-slate-400">{payments.length} Receipts</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-900" />
              Loading receipts...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Receipts Generated Yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Receipts will appear here once payment is processed at the school accounts desk.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {p.receiptNumber || 'REC-OFFICIAL'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateToDisplay(p.paidAt || p.createdAt)}</span>
                        <span>•</span>
                        <span className="uppercase font-semibold text-slate-700">{p.method}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="font-mono font-black text-emerald-800 text-sm">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                          Verified
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. PAYMENT INQUIRY BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-amber-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-serif text-slate-100">
              Need Fee Assistance or Offline Payment?
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              School Accounts Desk is open Monday–Saturday, 9:00 AM – 3:00 PM for Cash, UPI, and Cheque collection.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-blue-200 bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-800/80">
          Phone: +91 94372 00000
        </span>
      </div>

      {/* OFFICIAL RECEIPT MODAL */}
      <FeeReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        payment={selectedPayment}
        fee={selectedFee}
        student={student}
      />
    </div>
  );
};
