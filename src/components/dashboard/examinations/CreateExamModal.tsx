import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Check,
  Clock,
  Layers,
} from 'lucide-react';
import { Exam, ExamType, ExamStatus, ExamSubjectConfig } from '../../../types';
import { getDefaultSubjectsForClass, EXAM_TYPE_LABELS } from '../../../utils/gradeUtils';

interface CreateExamModalProps {
  examToEdit?: Exam | null;
  onSave: (examData: Omit<Exam, 'id'>, examId?: string) => Promise<void>;
  onClose: () => void;
}

const CLASS_OPTIONS = [
  'All Classes',
  'Class 10',
  'Class 9',
  'Class 8',
  'Class 7',
  'Class 6',
  'Class 5',
  'Class 4',
  'Class 3',
  'Class 2',
  'Class 1',
  'UKG',
  'LKG',
  'Nursery',
];

const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025'];

const SECTIONS = ['All', 'A', 'B', 'C', 'D'];

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  examToEdit,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(examToEdit?.name || '');
  const [examType, setExamType] = useState<ExamType | string>(examToEdit?.examType || 'half_yearly');
  const [academicYear, setAcademicYear] = useState(examToEdit?.academicYear || '2025-2026');
  const [className, setClassName] = useState(examToEdit?.className || 'Class 10');
  const [section, setSection] = useState(examToEdit?.section || 'All');
  const [startDate, setStartDate] = useState(examToEdit?.startDate || '');
  const [endDate, setEndDate] = useState(examToEdit?.endDate || '');
  const [resultDate, setResultDate] = useState(examToEdit?.resultDate || '');
  const [description, setDescription] = useState(examToEdit?.description || '');
  const [status, setStatus] = useState<ExamStatus>(examToEdit?.status || 'draft');

  const [subjects, setSubjects] = useState<ExamSubjectConfig[]>(
    examToEdit?.subjects && examToEdit.subjects.length > 0
      ? examToEdit.subjects
      : getDefaultSubjectsForClass('Class 10')
  );

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState<number>(100);
  const [newPassMarks, setNewPassMarks] = useState<number>(33);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate subjects when changing class if not edited
  const handleLoadClassPresets = (cls: string) => {
    const defaultList = getDefaultSubjectsForClass(cls, 100);
    setSubjects(defaultList);
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    if (newMaxMarks <= 0) {
      setError('Maximum marks must be greater than 0');
      return;
    }
    const exists = subjects.some(
      (s) => s.subjectName.toLowerCase() === newSubjectName.trim().toLowerCase()
    );
    if (exists) {
      setError('A subject with this name already exists');
      return;
    }

    setSubjects([
      ...subjects,
      {
        subjectName: newSubjectName.trim(),
        maxMarks: Number(newMaxMarks),
        passMarks: Number(newPassMarks) || Math.round(Number(newMaxMarks) * 0.33),
      },
    ]);
    setNewSubjectName('');
    setNewMaxMarks(100);
    setNewPassMarks(33);
    setError(null);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (
    index: number,
    field: keyof ExamSubjectConfig,
    val: string | number
  ) => {
    const updated = [...subjects];
    if (field === 'maxMarks') {
      const max = Number(val);
      updated[index].maxMarks = max;
      // Auto-adjust pass marks if not manually set
      if (!updated[index].passMarks || updated[index].passMarks > max) {
        updated[index].passMarks = Math.round(max * 0.33);
      }
    } else if (field === 'passMarks') {
      updated[index].passMarks = Number(val);
    } else if (field === 'subjectName') {
      updated[index].subjectName = String(val);
    }
    setSubjects(updated);
  };

  const totalMaxMarks = subjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter an examination title');
      return;
    }
    if (subjects.length === 0) {
      setError('Please configure at least one subject for the examination');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        examType,
        academicYear,
        className,
        section,
        subjects,
        totalMaxMarks,
        status,
        createdAt: examToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (startDate && startDate.trim()) {
        payload.startDate = startDate.trim();
      }
      if (endDate && endDate.trim()) {
        payload.endDate = endDate.trim();
      }
      if (resultDate && resultDate.trim()) {
        payload.resultDate = resultDate.trim();
      }
      if (description && description.trim()) {
        payload.description = description.trim();
      }

      await onSave(payload as Omit<Exam, 'id'>, examToEdit?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save examination details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-exam-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="create-exam-modal"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-800 text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg">
                {examToEdit ? 'Edit Examination Schedule' : 'Create New Examination Schedule'}
              </h2>
              <p className="text-xs text-slate-300">
                Define assessment parameters, target academic division, and subject syllabus structure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Examination Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-serif border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-900" />
              1. Assessment Specification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="exam-name-input"
                  type="text"
                  required
                  placeholder="e.g. Half-Yearly Summative Assessment 2025-26"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assessment Category / Type
                </label>
                <select
                  id="exam-type-select"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {Object.entries(EXAM_TYPE_LABELS).map(([val, item]) => (
                    <option key={val} value={val}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  id="exam-academic-year-select"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applicable Class / Grade <span className="text-rose-500">*</span>
                </label>
                <select
                  id="exam-class-select"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class Section
                </label>
                <select
                  id="exam-section-select"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec === 'All' ? 'All Sections (A, B, C)' : `Section ${sec}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule & Dates */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-serif border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-900" />
              2. Timeline & Lifecycle Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commencement Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conclusion Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Result Announcement Date
                </label>
                <input
                  type="date"
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  id="exam-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExamStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium"
                >
                  <option value="draft">Draft (Private preparation - invisible to students)</option>
                  <option value="scheduled">Scheduled (Announced on timetable)</option>
                  <option value="ongoing">Ongoing (Examinations in progress)</option>
                  <option value="completed">Completed (Evaluation in progress)</option>
                  <option value="published">Published (Scorecards released to Student Portal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Maximum Marks
                </label>
                <div className="px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 border border-slate-200 text-blue-950 flex items-center justify-between">
                  <span>Aggregate Total:</span>
                  <span className="text-sm">{totalMaxMarks} Marks</span>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Circular Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Students must bring standard stationery and examination admit card. Practical evaluations included."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Subjects Configuration */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-serif flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-900" />
                3. Subject Syllabus & Mark Scheme ({subjects.length} Subjects)
              </h3>
              <button
                type="button"
                onClick={() => handleLoadClassPresets(className)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Load Preset for {className}
              </button>
            </div>

            {/* Configured Subjects Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subject Name</th>
                    <th className="py-2.5 px-3 text-center w-28">Max Marks</th>
                    <th className="py-2.5 px-3 text-center w-28">Pass Marks</th>
                    <th className="py-2.5 px-3 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No subjects configured yet. Add subjects below or load preset.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={sub.subjectName}
                            onChange={(e) =>
                              handleSubjectChange(idx, 'subjectName', e.target.value)
                            }
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900 font-semibold text-slate-800 bg-white"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={sub.maxMarks}
                            onChange={(e) =>
                              handleSubjectChange(idx, 'maxMarks', e.target.value)
                            }
                            className="w-20 mx-auto px-2 py-1 text-xs text-center font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={sub.maxMarks}
                            value={sub.passMarks ?? Math.round(sub.maxMarks * 0.33)}
                            onChange={(e) =>
                              handleSubjectChange(idx, 'passMarks', e.target.value)
                            }
                            className="w-20 mx-auto px-2 py-1 text-xs text-center font-mono text-slate-600 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Custom Subject */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Add custom subject (e.g. Sanskrit, Robotics)"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                className="flex-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  placeholder="Max"
                  title="Maximum Marks"
                  value={newMaxMarks}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setNewMaxMarks(m);
                    setNewPassMarks(Math.round(m * 0.33));
                  }}
                  className="w-20 px-2 py-1.5 text-xs text-center font-mono rounded-lg border border-slate-300 focus:outline-none bg-white"
                />
                <input
                  type="number"
                  placeholder="Pass"
                  title="Passing Marks"
                  value={newPassMarks}
                  onChange={(e) => setNewPassMarks(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 text-xs text-center font-mono rounded-lg border border-slate-300 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {subjects.length} subjects • {totalMaxMarks} total marks
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Schedule...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{examToEdit ? 'Save Changes' : 'Create Examination'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
