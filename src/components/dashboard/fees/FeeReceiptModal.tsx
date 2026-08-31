import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Building,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Fee, Payment, Student } from '../../../types';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { SchoolLogo } from '../../SchoolLogo';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  fee?: Fee | null;
  student?: Student | null;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  fee,
  student,
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName =
    student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() :
    payment.studentName || 'Enrolled Student';
  const admissionNumber = student?.admissionNumber || payment.admissionNumber || '—';
  const className = student?.className || payment.className || 'Class Record';
  const section = student?.section || payment.section || '';
  const rollNumber = student?.rollNumber || '—';
  const guardianName = student?.guardianName || 'Parent on Record';

  const feeCategory = fee?.feeType || payment.feeType || 'Tuition & Academic Fee';
  const termName = fee?.term || payment.term || 'Current Term';
  const academicYear = fee?.academicYear || '2026-2027';

  const amountPaid = Number(payment.amount) || 0;
  const originalDue = fee ? Number(fee.amountDue) || 0 : amountPaid;
  const discount = fee ? Number(fee.discount) || 0 : 0;
  const netDue = Math.max(0, originalDue - discount);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* MODAL ACTION BAR (Hidden in print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 id="receipt-modal-title" className="text-base font-bold font-serif">
              Official Payment Receipt
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 print:p-6 print:text-black">
          {/* INSTITUTION LETTERHEAD */}
          <div className="text-center pb-6 border-b-2 border-slate-900/80 space-y-1 relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <SchoolLogo size="sm" />
              <h1 className="text-xl font-black font-serif uppercase tracking-wider text-slate-900 print:text-black">
                St. Xavier High School
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-600 print:text-slate-800">
              Affiliated to CBSE, New Delhi • School Code: SXHS-THD-2014
            </p>
            <p className="text-xs text-slate-500 print:text-slate-700">
              At/P.O: Tihidi, Dist: Bhadrak, Odisha - 756130 • Phone: +91 94372 00000
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wider uppercase print:border print:border-black print:text-black print:bg-white">
              Fee Collection Receipt
            </div>
          </div>

          {/* RECEIPT META HEADER */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Receipt Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {payment.receiptNumber || 'REC-OFFICIAL'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Date</span>
              <span className="font-semibold text-slate-900">
                {formatDateToDisplay(payment.paidAt || payment.createdAt)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Transaction / Ref ID</span>
              <span className="font-mono font-semibold text-slate-800 break-all text-[11px]">
                {payment.transactionId || 'CASH-SETTLED'}
              </span>
            </div>
          </div>

          {/* STUDENT DETAILS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{studentName}</span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Admission No.</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{admissionNumber}</span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Class & Section</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {className} {section ? `(${section})` : ''}
              </span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Roll Number</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{rollNumber}</span>
            </div>

            <div className="col-span-2 p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Parent / Guardian</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{guardianName}</span>
            </div>

            <div className="col-span-2 p-3 bg-slate-50/70 rounded-lg border border-slate-100 print:border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Academic Session</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{academicYear}</span>
            </div>
          </div>

          {/* ITEM BREAKDOWN TABLE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Particulars / Fee Head</th>
                  <th className="py-2.5 px-4">Period / Term</th>
                  <th className="py-2.5 px-4 text-right">Assessment</th>
                  <th className="py-2.5 px-4 text-right">Concession</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{feeCategory}</div>
                    {fee?.description && (
                      <div className="text-[10px] text-slate-500">{fee.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{termName}</td>
                  <td className="py-3 px-4 text-right font-mono">₹{originalDue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{amountPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-slate-600">
                    Total Amount Received (INR):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base font-black text-blue-950 print:text-black">
                    ₹{amountPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PAYMENT METHOD & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-900" />
                <span className="font-semibold text-slate-700">Payment Mode:</span>
                <span className="font-bold uppercase text-slate-900">
                  {payment.method || 'Cash'}
                </span>
                <span className="text-slate-500">({payment.gateway || 'Accounts Desk'})</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settlement Status: Completed & Verified</span>
              </div>
              {payment.notes && (
                <div className="text-[11px] text-slate-600 italic">
                  Note: {payment.notes}
                </div>
              )}
            </div>

            {/* AUTHORIZED SIGNATORY STAMP BOX */}
            <div className="p-3 rounded-lg border border-dashed border-slate-300 flex flex-col justify-between text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Authorized Signature / Seal</span>
              <div className="pt-8">
                <span className="font-semibold text-slate-800 text-xs block">
                  {payment.receivedBy || 'Accounts Officer'}
                </span>
                <span className="text-[10px] text-slate-500">St. Xavier High School, Tihidi</span>
              </div>
            </div>
          </div>

          {/* RECEIPT FOOTER DISCLAIMER */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center space-y-0.5">
            <p>This is a system-generated official fee receipt of St. Xavier High School.</p>
            <p>Fees once paid are non-refundable and subject to institutional financial regulations.</p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Financial Record
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
