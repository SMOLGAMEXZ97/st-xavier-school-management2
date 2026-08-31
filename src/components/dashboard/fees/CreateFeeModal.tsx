import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Users,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Fee, Student } from '../../../types';
import { feeService } from '../../../services/feeService';

interface CreateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeeCreated: () => void;
  students: Student[];
  initialStudent?: Student | null;
}

const COMMON_FEE_TYPES = [
  'Tuition Fee',
  'Admission Fee',
  'Examination Fee',
  'Transport Fee',
  'Annual Charges & Development',
  'Computer & Smart Class Fee',
  'Laboratory & Science Fee',
  'Library & Sports Fee',
  'Activity & Event Fee',
  'Late Fee / Arrears',
];

const COMMON_TERMS = [
  'Term 1 (Apr–Jun)',
  'Term 2 (Jul–Sep)',
  'Term 3 (Oct–Dec)',
  'Term 4 (Jan–Mar)',
  'Annual Session (Full Year)',
  'One-Time Admission',
  'Monthly Instalment',
];

const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025'];

const CLASSES = [
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

export const CreateFeeModal: React.FC<CreateFeeModalProps> = ({
  isOpen,
  onClose,
  onFeeCreated,
  students,
  initialStudent,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Single mode fields
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Batch mode fields
  const [selectedClass, setSelectedClass] = useState<string>('Class 1');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Common fee fields
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [feeType, setFeeType] = useState<string>('Tuition Fee');
  const [customFeeType, setCustomFeeType] = useState<string>('');
  const [term, setTerm] = useState<string>('Term 1 (Apr–Jun)');
  const [amountDue, setAmountDue] = useState<string>('2500');
  const [discount, setDiscount] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (initialStudent) {
        setMode('single');
        setSelectedStudentId(initialStudent.id || initialStudent.studentId || '');
      } else {
        setSelectedStudentId('');
      }

      // Default due date: 15 days from now
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 15);
      setDueDate(defaultDue.toISOString().split('T')[0]);
    }
  }, [isOpen, initialStudent]);

  if (!isOpen) return null;

  // Matching students for batch mode preview
  const matchingStudents = students.filter((s) => {
    if (s.active === false) return false;
    if (s.className !== selectedClass) return false;
    if (selectedSection !== 'All' && s.section !== selectedSection) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = Number(amountDue);
    const numDiscount = Number(discount) || 0;

    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid assessment amount.');
      return;
    }
    if (numDiscount < 0 || numDiscount > numAmount) {
      setFormError('Discount cannot be negative or exceed the fee amount.');
      return;
    }
    if (!dueDate) {
      setFormError('Please choose a due date for this assessment.');
      return;
    }

    const finalFeeType = feeType === 'Custom' ? customFeeType.trim() : feeType;
    if (!finalFeeType) {
      setFormError('Please specify the fee type/category.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'single') {
        if (!selectedStudentId) {
          setFormError('Please select a student for this fee assessment.');
          setIsSubmitting(false);
          return;
        }

        const student = students.find(
          (s) => s.id === selectedStudentId || s.studentId === selectedStudentId
        );
        const studentName = student
          ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
          : '';

        await feeService.createFee({
          studentId: student?.id || selectedStudentId,
          academicYear,
          feeType: finalFeeType,
          term,
          amountDue: numAmount,
          discount: numDiscount,
          dueDate,
          status: 'pending',
          description: description.trim() || undefined,
          studentName,
          admissionNumber: student?.admissionNumber,
          className: student?.className,
          section: student?.section,
        });
      } else {
        // Batch mode
        if (matchingStudents.length === 0) {
          setFormError(
            `No active students found in ${selectedClass} ${selectedSection !== 'All' ? `Section ${selectedSection}` : ''}.`
          );
          setIsSubmitting(false);
          return;
        }

        const feesToBatch = matchingStudents.map((s) => {
          const studentName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
          return {
            studentId: s.id || s.studentId || '',
            academicYear,
            feeType: finalFeeType,
            term,
            amountDue: numAmount,
            discount: numDiscount,
            dueDate,
            status: 'pending' as const,
            description: description.trim() || undefined,
            studentName,
            admissionNumber: s.admissionNumber,
            className: s.className,
            section: s.section,
          };
        });

        await feeService.batchCreateFees(feesToBatch);
      }

      onFeeCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating fee assessment:', err);
      setFormError(err?.message || 'Failed to create fee assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-fee-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-fee-title" className="text-base font-bold font-serif">
                Create Fee Assessment
              </h2>
              <p className="text-xs text-slate-400">
                Assess fees for an individual student or batch-apply to an entire class.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE TOGGLE TABS */}
        <div className="px-6 pt-4 pb-1 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'single'
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Single Student
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'batch'
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Class Batch Assessment
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation Error</p>
                <p className="text-rose-700">{formError}</p>
              </div>
            </div>
          )}

          {/* TARGET SELECTION */}
          {mode === 'single' ? (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Student <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              >
                <option value="">-- Select Enrolled Student --</option>
                {students.map((s) => {
                  const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
                  return (
                    <option key={s.id || s.studentId} value={s.id || s.studentId}>
                      {name} ({s.admissionNumber || 'No Adm No'}) — {s.className || 'Class'} {s.section ? `(${s.section})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div>
                <label className="block text-blue-950 font-semibold mb-1">Target Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-950 font-semibold mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="All">All Sections (A, B, C)</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="col-span-2 text-[11px] text-blue-900 font-medium flex items-center gap-1.5 pt-1">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>
                  Will assess fee for <strong>{matchingStudents.length} active students</strong> in {selectedClass}.
                </span>
              </div>
            </div>
          )}

          {/* FEE TYPE & ACADEMIC YEAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Fee Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              >
                {COMMON_FEE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="Custom">+ Custom Fee Head</option>
              </select>
              {feeType === 'Custom' && (
                <input
                  type="text"
                  value={customFeeType}
                  onChange={(e) => setCustomFeeType(e.target.value)}
                  placeholder="Enter custom fee head name"
                  required
                  className="mt-2 w-full px-3 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Academic Session <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TERM & DUE DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Period / Term <span className="text-rose-500">*</span>
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              >
                {COMMON_TERMS.map((tm) => (
                  <option key={tm} value={tm}>{tm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* AMOUNT DUE & SCHOLARSHIP DISCOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Standard Assessment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="2500"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white text-slate-900 font-mono font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Concession / Discount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 bg-white text-emerald-800 font-mono font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          </div>

          {/* NET DUE PREVIEW */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="font-semibold text-slate-600">Net Receivable Per Student:</span>
            <span className="text-sm font-black font-mono text-blue-950">
              ₹{Math.max(0, (Number(amountDue) || 0) - (Number(discount) || 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Includes Tuition, Science Lab & Smart Classroom charge"
              className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* FOOTER */}
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
                  Generating Dues...
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  {mode === 'single' ? 'Create Assessment' : `Apply to ${matchingStudents.length} Students`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
