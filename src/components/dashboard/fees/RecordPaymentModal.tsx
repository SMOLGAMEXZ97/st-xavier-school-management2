import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Fee, Payment, Student } from '../../../types';
import { feeService } from '../../../services/feeService';
import { useAuth } from '../../../context/AuthContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (payment: Payment, fee?: Fee) => void;
  students: Student[];
  initialStudent?: Student | null;
  initialFee?: Fee | null;
  allFees: Fee[];
  allPayments: Payment[];
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  students,
  initialStudent,
  initialFee,
  allFees,
  allPayments,
}) => {
  const { userProfile } = useAuth();

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize from props
  useEffect(() => {
    if (isOpen) {
      const studentId = initialStudent?.id || initialStudent?.studentId || '';
      setSelectedStudentId(studentId);
      setSelectedFeeId(initialFee?.id || '');
      setFormError(null);
      setPaidAt(new Date().toISOString().split('T')[0]);
      setMethod('cash');
      setTransactionId('');
      setNotes('');
      setReceivedBy(userProfile?.displayName || 'Accounts Department');

      if (initialFee) {
        // Calculate remaining balance for initial fee
        const feePayments = allPayments.filter((p) => p.feeId === initialFee.id && p.status === 'success');
        const paidSoFar = feePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const netDue = Math.max(0, (initialFee.amountDue || 0) - (initialFee.discount || 0));
        const balance = Math.max(0, netDue - paidSoFar);
        setAmount(balance > 0 ? String(balance) : String(netDue));
      } else {
        setAmount('');
      }
    }
  }, [isOpen, initialStudent, initialFee, userProfile, allPayments]);

  if (!isOpen) return null;

  // Find selected student
  const currentStudent = students.find(
    (s) => s.id === selectedStudentId || s.studentId === selectedStudentId
  );

  // Filter fees for selected student
  const studentFees = allFees.filter(
    (f) =>
      f.studentId === selectedStudentId ||
      (currentStudent && (f.studentId === currentStudent.id || f.studentId === currentStudent.studentId))
  );

  const selectedFee = studentFees.find((f) => f.id === selectedFeeId) || null;

  // Calculate balance for chosen fee
  const feePayments = selectedFee
    ? allPayments.filter((p) => p.feeId === selectedFee.id && p.status === 'success')
    : [];
  const totalPaidForFee = feePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const originalDue = selectedFee ? Number(selectedFee.amountDue) || 0 : 0;
  const discount = selectedFee ? Number(selectedFee.discount) || 0 : 0;
  const netDue = Math.max(0, originalDue - discount);
  const remainingBalance = Math.max(0, netDue - totalPaidForFee);

  // When fee selection changes, auto-fill balance
  const handleFeeChange = (feeId: string) => {
    setSelectedFeeId(feeId);
    const chosen = studentFees.find((f) => f.id === feeId);
    if (chosen) {
      const pmts = allPayments.filter((p) => p.feeId === chosen.id && p.status === 'success');
      const paid = pmts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const net = Math.max(0, (chosen.amountDue || 0) - (chosen.discount || 0));
      const bal = Math.max(0, net - paid);
      setAmount(bal > 0 ? String(bal) : String(net));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = Number(amount);
    if (!selectedStudentId) {
      setFormError('Please select a student for this payment.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive payment amount.');
      return;
    }
    if (!paidAt) {
      setFormError('Please select payment date.');
      return;
    }
    if (method !== 'cash' && !transactionId.trim()) {
      setFormError('Please provide Transaction / UTR / Cheque Reference number for non-cash payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentName = currentStudent
        ? `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim()
        : 'Student';
      const admissionNumber = currentStudent?.admissionNumber || '';
      const className = currentStudent?.className || '';
      const section = currentStudent?.section || '';

      const paymentRecord: Omit<Payment, 'id' | 'createdAt'> = {
        studentId: currentStudent?.id || selectedStudentId,
        feeId: selectedFeeId || 'general_advance',
        amount: numAmount,
        method,
        status: 'success',
        transactionId:
          transactionId.trim() ||
          `CASH-${Date.now().toString().slice(-6)}`,
        gateway:
          method === 'cash' ? 'Cash Desk' :
          method === 'upi' ? 'UPI / QR Transfer' :
          method === 'bank_transfer' ? 'Bank Transfer / NEFT' :
          method === 'card' ? 'Card / POS' : 'Cheque / DD',
        paidAt: paidAt,
        notes: notes.trim() || undefined,
        receivedBy: receivedBy.trim() || 'Accounts Desk',
        studentName,
        admissionNumber,
        className,
        section,
        feeType: selectedFee?.feeType || 'Tuition & Academic Fee',
        term: selectedFee?.term || 'Current Term',
      };

      const result = await feeService.recordPayment(paymentRecord);

      const createdPayment: Payment = {
        ...paymentRecord,
        id: result.paymentId,
        receiptNumber: result.receiptNumber,
        createdAt: new Date().toISOString(),
      };

      onPaymentSuccess(createdPayment, selectedFee || undefined);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setFormError(err?.message || 'Failed to record payment in ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="record-payment-title" className="text-base font-bold font-serif">
                Record Fee Payment
              </h2>
              <p className="text-xs text-blue-200">
                Log student payment, update ledger balance, and issue official receipt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY FORM */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Payment Submission Error</p>
                <p className="text-rose-700">{formError}</p>
              </div>
            </div>
          )}

          {/* 1. SELECT STUDENT */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setSelectedFeeId('');
                setAmount('');
              }}
              required
              className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              <option value="">-- Choose Enrolled Student --</option>
              {students.map((s) => {
                const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
                return (
                  <option key={s.id || s.studentId} value={s.id || s.studentId}>
                    {name} ({s.admissionNumber || 'No Adm No'}) — {s.className || 'Class 1'} {s.section ? `(${s.section})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. SELECT FEE ASSESSMENT */}
          {selectedStudentId && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Link to Fee Assessment
              </label>
              {studentFees.length === 0 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  No formal fee assessments recorded for this student yet. Payment will be logged under General Advance / Unallocated.
                </div>
              ) : (
                <select
                  value={selectedFeeId}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">-- General Fee Advance / Any Head --</option>
                  {studentFees.map((f) => {
                    const pmts = allPayments.filter((p) => p.feeId === f.id && p.status === 'success');
                    const paid = pmts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    const net = Math.max(0, (f.amountDue || 0) - (f.discount || 0));
                    const bal = Math.max(0, net - paid);

                    return (
                      <option key={f.id} value={f.id}>
                        {f.feeType} ({f.term}) — Due: ₹{net.toLocaleString('en-IN')} (Bal: ₹{bal.toLocaleString('en-IN')}) [{f.status}]
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Assessment balance breakdown preview */}
              {selectedFee && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Assessment:</span>
                    <span className="font-semibold text-slate-800">₹{originalDue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Paid Prior:</span>
                    <span className="font-semibold text-emerald-700">₹{totalPaidForFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Net Balance:</span>
                    <span className="font-bold text-blue-900 text-xs">₹{remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. AMOUNT & PAYMENT METHOD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white text-slate-900 font-mono font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              >
                <option value="cash">Cash Desk Receipt</option>
                <option value="upi">UPI / QR Transfer (GPay, PhonePe, Paytm)</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                <option value="card">Debit / Credit Card (POS)</option>
                <option value="cheque">Cheque / Demand Draft</option>
              </select>
            </div>
          </div>

          {/* 4. TRANSACTION / CHEQUE NO & DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {method === 'cash' ? 'Cash Voucher / Slip No (Optional)' : 'UTR / Cheque / Transaction Ref *'}
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={method === 'cash' ? 'Leave blank for auto ID' : 'e.g. UPI/12345678 or CHQ-9901'}
                required={method !== 'cash'}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* 5. RECEIVED BY & REMARKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Received / Authorized By
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Cashier / Accounts Officer"
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid in full for Q1"
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* SECURITY ADVISORY */}
          <div className="flex items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>
              Transactions update the student ledger instantly and generate a printable official receipt.
            </span>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Receipt className="w-3.5 h-3.5" />
                  Record & Issue Receipt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
