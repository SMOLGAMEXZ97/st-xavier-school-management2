import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Receipt,
  User,
  PlusCircle,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Trash2,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Fee, Payment, Student } from '../../../types';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { SchoolLogo } from '../../SchoolLogo';

interface StudentLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  fees: Fee[];
  payments: Payment[];
  onOpenRecordPayment: (fee?: Fee) => void;
  onOpenCreateFee: () => void;
  onViewReceipt: (payment: Payment, fee?: Fee) => void;
  onDeleteFee?: (feeId: string) => void;
  canManageFees: boolean;
}

export const StudentLedgerModal: React.FC<StudentLedgerModalProps> = ({
  isOpen,
  onClose,
  student,
  fees,
  payments,
  onOpenRecordPayment,
  onOpenCreateFee,
  onViewReceipt,
  onDeleteFee,
  canManageFees,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assessments' | 'payments'>('assessments');

  if (!isOpen) return null;

  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

  // Financial aggregates
  const totalAssessed = fees.reduce((sum, f) => sum + (Number(f.amountDue) || 0), 0);
  const totalDiscount = fees.reduce((sum, f) => sum + (Number(f.discount) || 0), 0);
  const totalNetDue = Math.max(0, totalAssessed - totalDiscount);
  const totalPaid = payments.reduce(
    (sum, p) => (p.status === 'success' ? sum + (Number(p.amount) || 0) : sum),
    0
  );
  const balanceDue = Math.max(0, totalNetDue - totalPaid);

  const isFullySettled = totalNetDue > 0 && balanceDue === 0;
  const isPartiallyPaid = totalPaid > 0 && balanceDue > 0;
  const isOverdue = fees.some((f) => f.status === 'overdue');

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-ledger-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="student-ledger-title" className="text-base font-bold font-serif">
                Student Fee Ledger & Transaction History
              </h2>
              <p className="text-xs text-slate-400">
                {studentName} • Admission No: <strong className="font-mono text-white">{student.admissionNumber || '—'}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLedger}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Ledger
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT HEADER ONLY */}
        <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-900">
          <div className="flex items-center justify-center gap-2">
            <SchoolLogo size="sm" />
            <h1 className="text-lg font-black font-serif uppercase tracking-wider">
              St. Xavier High School, Tihidi
            </h1>
          </div>
          <p className="text-xs text-slate-600">Student Official Fee Statement & Account Ledger</p>
        </div>

        {/* STUDENT INFO & FINANCIAL SUMMARY CARDS */}
        <div className="p-6 pb-2 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{studentName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Class & Section</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {student.className} {student.section ? `(${student.section})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Roll Number</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{student.rollNumber || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Parent / Guardian</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{student.guardianName || '—'}</span>
            </div>
          </div>

          {/* 5-METRIC FINANCIAL LEDGER CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Assessed</span>
              <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">
                ₹{totalAssessed.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Concession</span>
              <span className="text-sm font-bold font-mono text-emerald-700 mt-1 block">
                -₹{totalDiscount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Net Demand</span>
              <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">
                ₹{totalNetDue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-semibold text-emerald-800 block">Total Paid</span>
              <span className="text-sm font-black font-mono text-emerald-900 mt-1 block">
                ₹{totalPaid.toLocaleString('en-IN')}
              </span>
            </div>

            <div className={`col-span-2 sm:col-span-1 p-3 rounded-xl border ${
              balanceDue > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <span className="text-[10px] uppercase font-semibold block">Outstanding Due</span>
              <span className="text-sm font-black font-mono mt-1 block">
                ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ACTION TOOLBAR (Hidden in print) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-b border-slate-100 pb-3 print:hidden">
            {/* SUB-TABS */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('assessments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeSubTab === 'assessments'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Fee Assessments ({fees.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('payments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeSubTab === 'payments'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Receipts & Payments ({payments.length})
              </button>
            </div>

            {/* QUICK ACTIONS */}
            {canManageFees && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRecordPayment()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={onOpenCreateFee}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Assessment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 pt-0 overflow-y-auto flex-1 text-xs">
          {activeSubTab === 'assessments' ? (
            fees.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No fee assessments recorded yet</p>
                <p className="text-[11px] mt-0.5">Use "Add Assessment" to assign tuition, annual, or exam dues.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Fee Head / Period</th>
                      <th className="py-2.5 px-3">Academic Session</th>
                      <th className="py-2.5 px-3 text-right">Assessment</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-right">Net Due</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      {canManageFees && <th className="py-2.5 px-3 text-right print:hidden">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {fees.map((fee) => {
                      const pmtSum = payments
                        .filter((p) => p.feeId === fee.id && p.status === 'success')
                        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                      const net = Math.max(0, (fee.amountDue || 0) - (fee.discount || 0));
                      const bal = Math.max(0, net - pmtSum);

                      return (
                        <tr key={fee.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{fee.feeType}</div>
                            <div className="text-[10px] text-slate-500">{fee.term}</div>
                            {fee.description && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">{fee.description}</div>
                            )}
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
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                            ₹{pmtSum.toLocaleString('en-IN')}
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
                              {fee.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                              {fee.status === 'partially_paid' && <Clock className="w-3 h-3" />}
                              {fee.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                              {fee.status.replace('_', ' ')}
                            </span>
                          </td>
                          {canManageFees && (
                            <td className="py-3 px-3 text-right print:hidden">
                              <div className="flex items-center justify-end gap-1.5">
                                {bal > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenRecordPayment(fee)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold"
                                  >
                                    Pay
                                  </button>
                                )}
                                {onDeleteFee && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete fee assessment "${fee.feeType}"?`)) {
                                        onDeleteFee(fee.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                    title="Delete Assessment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              </div>
            )
          ) : (
            payments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No payment receipts logged yet</p>
                <p className="text-[11px] mt-0.5">Use "Record Payment" to settle dues and issue a receipt.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Payment Date</th>
                      <th className="py-2.5 px-3">Method / Ref</th>
                      <th className="py-2.5 px-3">Fee Head / Term</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                      <th className="py-2.5 px-3">Received By</th>
                      <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {payments.map((p) => {
                      const linkedFee = fees.find((f) => f.id === p.feeId);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {p.receiptNumber || 'REC-OFFICIAL'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {formatDateToDisplay(p.paidAt || p.createdAt)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold uppercase text-slate-900">{p.method}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{p.transactionId}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {linkedFee ? `${linkedFee.feeType} (${linkedFee.term})` : (p.feeType || 'General Fee')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {p.receivedBy || 'Accounts Officer'}
                          </td>
                          <td className="py-3 px-3 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => onViewReceipt(p, linkedFee)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
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
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Institutional Financial Record
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
