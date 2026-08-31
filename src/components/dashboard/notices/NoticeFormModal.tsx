import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Users,
} from 'lucide-react';
import { Notice, NoticeCategory, NoticeStatus } from '../../../types';
import { DateInput } from '../../common/DateInput';
import { formatDateToDisplay, formatDateToISO } from '../../../utils/dateUtils';

interface NoticeFormModalProps {
  isOpen: boolean;
  noticeToEdit: Notice | null;
  isSaving: boolean;
  onSave: (formData: Omit<Notice, 'id'>, existingId?: string) => Promise<void>;
  onClose: () => void;
}

const CATEGORY_OPTIONS: NoticeCategory[] = [
  'Academics',
  'Examinations',
  'Events',
  'Holidays',
  'Circulars',
  'General',
];

const AUDIENCE_PRESETS = [
  'All Parents & Students',
  'All Students',
  'All Parents / Guardians',
  'All Staff',
  'Classes I to V',
  'Classes VI to VIII',
  'Classes IX & X',
  'Prospective Parents',
  'Custom',
];

export const NoticeFormModal: React.FC<NoticeFormModalProps> = ({
  isOpen,
  noticeToEdit,
  isSaving,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(noticeToEdit);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('Academics');
  const [date, setDate] = useState(''); // ISO or DD/MM/YYYY
  const [selectedAudiencePreset, setSelectedAudiencePreset] = useState('All Parents & Students');
  const [customAudience, setCustomAudience] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [status, setStatus] = useState<NoticeStatus>('published');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize or reset form state when modal opens or noticeToEdit changes
  useEffect(() => {
    if (noticeToEdit) {
      setTitle(noticeToEdit.title || '');
      setCategory(noticeToEdit.category || 'Academics');
      setDate(noticeToEdit.date || new Date().toISOString().split('T')[0]);
      setIsUrgent(Boolean(noticeToEdit.isUrgent));
      setStatus(noticeToEdit.status || 'published');
      setSummary(noticeToEdit.summary || '');
      setContent(noticeToEdit.content || '');
      setAttachmentName(noticeToEdit.attachmentName || '');
      setAttachmentUrl(noticeToEdit.attachmentUrl || '');

      const audience = noticeToEdit.targetAudience || 'All Parents & Students';
      if (AUDIENCE_PRESETS.includes(audience)) {
        setSelectedAudiencePreset(audience);
        setCustomAudience('');
      } else {
        setSelectedAudiencePreset('Custom');
        setCustomAudience(audience);
      }
    } else {
      // Default new notice
      const todayISO = new Date().toISOString().split('T')[0];
      setTitle('');
      setCategory('Academics');
      setDate(todayISO);
      setSelectedAudiencePreset('All Parents & Students');
      setCustomAudience('');
      setIsUrgent(false);
      setStatus('published');
      setSummary('');
      setContent('');
      setAttachmentName('');
      setAttachmentUrl('');
    }
    setFieldErrors({});
    setSubmitError(null);
  }, [noticeToEdit, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Notice title is required';
    } else if (title.trim().length < 5) {
      errors.title = 'Notice title must be at least 5 characters';
    }

    if (!category) {
      errors.category = 'Please select a category';
    }

    if (!date.trim()) {
      errors.date = 'Notice date is required';
    }

    const effectiveAudience =
      selectedAudiencePreset === 'Custom' ? customAudience.trim() : selectedAudiencePreset;
    if (!effectiveAudience) {
      errors.audience = 'Target audience is required';
    }

    if (!content.trim()) {
      errors.content = 'Notice content is required';
    } else if (content.trim().length < 10) {
      errors.content = 'Notice content must be at least 10 characters';
    }

    if (attachmentUrl.trim() && !attachmentUrl.startsWith('http://') && !attachmentUrl.startsWith('https://') && !attachmentUrl.startsWith('/')) {
      errors.attachmentUrl = 'URL must start with http://, https:// or /';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validateForm()) {
      return;
    }

    const effectiveAudience =
      selectedAudiencePreset === 'Custom' ? customAudience.trim() : selectedAudiencePreset;

    const noticeData: Omit<Notice, 'id'> = {
      title: title.trim(),
      category,
      date: date.trim(),
      status,
      isUrgent,
      isNew: true,
      summary: summary.trim() || content.trim().slice(0, 160) + (content.trim().length > 160 ? '...' : ''),
      content: content.trim(),
      targetAudience: effectiveAudience,
      attachmentName: attachmentName.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
    };

    try {
      setSubmitError(null);
      await onSave(noticeData, noticeToEdit ? noticeToEdit.id : undefined);
    } catch (err: any) {
      console.error('Save notice failed:', err);
      setSubmitError(err.message || 'Failed to save notice. Please check network connection and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg font-serif text-slate-900">
                  {isEditing ? 'Edit School Notice' : 'Create & Publish Notice'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isEditing
                    ? 'Modify circular details, category, or audience'
                    : 'Broadcast announcements to students, parents, and public website'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form id="notice-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="notice-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="notice-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="e.g. Mid-Term Examination Schedule Announced (Classes I to X)"
                className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:ring-2 outline-none font-medium ${
                  fieldErrors.title
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                }`}
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fieldErrors.title}</span>
                </p>
              )}
            </div>

            {/* Category & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="notice-category-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="notice-category-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as NoticeCategory);
                    if (fieldErrors.category) {
                      setFieldErrors((prev) => ({ ...prev, category: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <DateInput
                  id="notice-date-input"
                  label="Notice Date"
                  required
                  value={date}
                  onChange={(_, iso) => {
                    setDate(iso || _);
                    if (fieldErrors.date) {
                      setFieldErrors((prev) => ({ ...prev, date: '' }));
                    }
                  }}
                  error={fieldErrors.date}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label htmlFor="notice-audience-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  id="notice-audience-select"
                  value={selectedAudiencePreset}
                  onChange={(e) => {
                    setSelectedAudiencePreset(e.target.value);
                    if (fieldErrors.audience) {
                      setFieldErrors((prev) => ({ ...prev, audience: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  {AUDIENCE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>

                {selectedAudiencePreset === 'Custom' && (
                  <input
                    id="notice-custom-audience-input"
                    type="text"
                    value={customAudience}
                    onChange={(e) => {
                      setCustomAudience(e.target.value);
                      if (fieldErrors.audience) {
                        setFieldErrors((prev) => ({ ...prev, audience: '' }));
                      }
                    }}
                    placeholder="e.g. Science Club & Olympiad Participants"
                    className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                  />
                )}
              </div>
              {fieldErrors.audience && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fieldErrors.audience}</span>
                </p>
              )}
            </div>

            {/* Publishing Status & Urgent Badges */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Publication Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Publishing Status
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="notice-status-published-btn"
                    onClick={() => setStatus('published')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition border ${
                      status === 'published'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    id="notice-status-draft-btn"
                    onClick={() => setStatus('draft')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition border ${
                      status === 'draft'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Draft
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {status === 'published'
                    ? 'Visible immediately to public and student portal.'
                    : 'Saved as draft. Hidden from students and public.'}
                </p>
              </div>

              {/* Urgent Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority Flag
                </label>
                <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <input
                    id="notice-urgent-toggle"
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <AlertCircle className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-600' : 'text-slate-400'}`} />
                      Mark as Urgent / Important
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Displays prominent red badge on notice lists
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="notice-summary-input" className="text-xs font-semibold text-slate-700">
                  Brief Summary <span className="text-slate-400 font-normal">(Optional preview snippet)</span>
                </label>
              </div>
              <textarea
                id="notice-summary-input"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Short 1-2 sentence preview for cards and notification tickers..."
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="notice-content-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Notice Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="notice-content-input"
                rows={5}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (fieldErrors.content) {
                    setFieldErrors((prev) => ({ ...prev, content: '' }));
                  }
                }}
                placeholder="Provide detailed instructions, timings, requirements, or circular text..."
                className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:ring-2 outline-none font-medium ${
                  fieldErrors.content
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                }`}
              />
              {fieldErrors.content && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fieldErrors.content}</span>
                </p>
              )}
            </div>

            {/* Attachments & Resource URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="notice-attachment-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachment File Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="notice-attachment-name-input"
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. SA1_DateSheet_2026.pdf"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notice-attachment-url-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Download / Resource URL <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="notice-attachment-url-input"
                    type="text"
                    value={attachmentUrl}
                    onChange={(e) => {
                      setAttachmentUrl(e.target.value);
                      if (fieldErrors.attachmentUrl) {
                        setFieldErrors((prev) => ({ ...prev, attachmentUrl: '' }));
                      }
                    }}
                    placeholder="https://... or /documents/file.pdf"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:ring-2 outline-none font-medium ${
                      fieldErrors.attachmentUrl
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                    }`}
                  />
                </div>
                {fieldErrors.attachmentUrl && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {fieldErrors.attachmentUrl}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="notice-form"
            id="save-notice-submit-btn"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Notice...</span>
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : status === 'published' ? 'Publish Notice' : 'Save as Draft'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
