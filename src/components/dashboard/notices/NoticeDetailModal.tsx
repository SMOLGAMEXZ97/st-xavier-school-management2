import React from 'react';
import {
  Bell,
  Calendar,
  Users,
  AlertCircle,
  Sparkles,
  FileText,
  Download,
  Printer,
  X,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Notice } from '../../../types';
import { formatDateToDisplay } from '../../../utils/dateUtils';

interface NoticeDetailModalProps {
  isOpen: boolean;
  notice: Notice | null;
  onClose: () => void;
  onEdit?: (notice: Notice) => void;
  onToggleStatus?: (notice: Notice) => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  isOpen,
  notice,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  if (!isOpen || !notice) return null;

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Examinations':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'Academics':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Events':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Holidays':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Circulars':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'General':
      default:
        return 'bg-sky-100 text-sky-900 border-sky-200';
    }
  };

  const isPublished = notice.status !== 'draft';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="space-y-2 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${getCategoryBadgeClass(
                    notice.category
                  )}`}
                >
                  {notice.category}
                </span>

                {notice.isUrgent && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-red-200">
                    <AlertCircle className="w-3 h-3" />
                    <span>URGENT</span>
                  </span>
                )}

                {isPublished ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Published</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                    <Clock className="w-3 h-3" />
                    <span>Draft (Unpublished)</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 leading-snug">
                {notice.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meta bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-800" />
              <span>
                Notice Date: <strong>{formatDateToDisplay(notice.date) || notice.date}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-800" />
              <span>
                Target Audience: <strong>{notice.targetAudience || 'All'}</strong>
              </span>
            </div>
            {notice.createdBy && (
              <div className="text-[11px] text-slate-500 sm:col-span-2">
                Created by: <span className="font-mono text-slate-700">{notice.createdBy}</span>
                {notice.createdAt && ` on ${formatDateToDisplay(notice.createdAt)}`}
              </div>
            )}
          </div>

          {/* Notice Body */}
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed mb-6">
            {notice.summary && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 font-medium text-xs sm:text-sm">
                {notice.summary}
              </div>
            )}
            <div className="whitespace-pre-line text-slate-800">
              {notice.content}
            </div>
          </div>

          {/* Attachment resource if any */}
          {(notice.attachmentName || notice.attachmentUrl) && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {notice.attachmentName || 'Official Notice Document'}
                  </div>
                  <div className="text-[11px] text-slate-500">Official Circular Attachment</div>
                </div>
              </div>

              {notice.attachmentUrl ? (
                <a
                  href={notice.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Resource</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(notice)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition border ${
                  isPublished
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isPublished ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Move to Draft</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                id={`edit-notice-modal-btn-${notice.id}`}
                onClick={() => {
                  onClose();
                  onEdit(notice);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Notice</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
