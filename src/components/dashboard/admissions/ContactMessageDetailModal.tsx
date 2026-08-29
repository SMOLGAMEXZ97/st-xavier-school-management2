import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  User,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ContactMessage } from '../../../types';
import { contactService } from '../../../services/inquiryService';

interface ContactMessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ContactMessage | null;
  onDelete: (id: string) => void;
}

export const ContactMessageDetailModal: React.FC<ContactMessageDetailModalProps> = ({
  isOpen,
  onClose,
  message,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const handleDelete = async () => {
    if (!message.id) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await contactService.deleteContactMessage(message.id);
      onDelete(message.id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting contact message:', err);
      setErrorMessage(err?.message || 'Failed to delete contact message.');
      setIsDeleting(false);
    }
  };

  const formattedDate = message.createdAt
    ? new Date(message.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Unknown date';

  return (
    <div
      id="contact-message-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="contact-message-modal-container"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-white">{message.subject}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                From: <span className="font-semibold text-slate-100">{message.name}</span> • {formattedDate}
              </p>
            </div>
          </div>
          <button
            id="close-contact-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Message Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Sender Meta Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-blue-900 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Sender Name</span>
                <span className="font-semibold text-slate-900">{message.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-blue-900 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Phone Number</span>
                <a
                  href={`tel:${message.phone}`}
                  className="font-semibold text-blue-700 hover:underline hover:text-blue-900"
                >
                  {message.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-blue-900 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Email Address</span>
                {message.email ? (
                  <a
                    href={`mailto:${message.email}`}
                    className="font-medium text-blue-700 hover:underline hover:text-blue-900"
                  >
                    {message.email}
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-blue-900 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Received Timestamp</span>
                <span className="font-medium text-slate-800">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Full Message Body */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Message Content
            </h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap shadow-xs">
              {message.message}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                id="initiate-delete-message-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Message
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-xs font-medium text-rose-800">Confirm permanent deletion?</span>
                <button
                  type="button"
                  id="confirm-delete-message-btn"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded transition flex items-center gap-1 disabled:opacity-60"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="close-message-bottom-btn"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
