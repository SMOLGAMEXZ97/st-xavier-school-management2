import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Notice } from '../../../types';

interface DeleteNoticeModalProps {
  isOpen: boolean;
  notice: Notice | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteNoticeModal: React.FC<DeleteNoticeModalProps> = ({
  isOpen,
  notice,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif text-slate-900">
                Delete School Notice
              </h3>
              <p className="text-xs text-slate-500">Irreversible Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6 text-sm text-slate-600">
          <p>
            Are you sure you want to permanently delete this notice? It will be removed from the administrative console, public website, and student portal.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-slate-800 line-clamp-2">
              {notice.title}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Category: <strong className="text-slate-700">{notice.category}</strong></span>
              <span>Status: <strong className="capitalize text-slate-700">{notice.status || 'Published'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-notice-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
