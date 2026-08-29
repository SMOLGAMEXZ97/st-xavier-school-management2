import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  Trash2,
  Loader2,
  FileText,
  Save,
  MessageSquare,
} from 'lucide-react';
import { AdmissionInquiry } from '../../../types';
import { inquiryService } from '../../../services/inquiryService';

interface InquiryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: AdmissionInquiry | null;
  onStatusUpdate: (updatedInquiry: AdmissionInquiry) => void;
  onDelete: (id: string) => void;
  onConvertToStudent: (inquiry: AdmissionInquiry) => void;
}

export const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({
  isOpen,
  onClose,
  inquiry,
  onStatusUpdate,
  onDelete,
  onConvertToStudent,
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [notes, setNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (inquiry) {
      setCurrentStatus(inquiry.status || 'pending');
      setNotes(inquiry.notes || '');
      setShowDeleteConfirm(false);
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [inquiry, isOpen]);

  if (!isOpen || !inquiry) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!inquiry.id || newStatus === currentStatus) return;
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await inquiryService.updateInquiryStatus(inquiry.id, newStatus, notes);
      const updated: AdmissionInquiry = {
        ...inquiry,
        status: newStatus,
        notes,
        updatedAt: new Date().toISOString(),
      };
      setCurrentStatus(newStatus);
      onStatusUpdate(updated);
      setStatusMessage(`Status successfully updated to "${newStatus.toUpperCase()}".`);
    } catch (err: any) {
      console.error('Error updating inquiry status:', err);
      setErrorMessage(err?.message || 'Failed to update application status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!inquiry.id) return;
    setIsSavingNotes(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await inquiryService.updateInquiryNotes(inquiry.id, notes);
      const updated: AdmissionInquiry = {
        ...inquiry,
        notes,
        status: currentStatus,
        updatedAt: new Date().toISOString(),
      };
      onStatusUpdate(updated);
      setStatusMessage('Administrative follow-up notes saved successfully.');
    } catch (err: any) {
      console.error('Error saving inquiry notes:', err);
      setErrorMessage(err?.message || 'Failed to save follow-up notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!inquiry.id) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await inquiryService.deleteInquiry(inquiry.id);
      onDelete(inquiry.id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting inquiry:', err);
      setErrorMessage(err?.message || 'Failed to delete application lead.');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'enrolled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Enrolled
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Contacted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Pending Review
          </span>
        );
    }
  };

  const formattedDate = inquiry.createdAt
    ? new Date(inquiry.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Unknown date';

  return (
    <div
      id="inquiry-detail-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="inquiry-detail-modal-container"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-amber-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-white">{inquiry.studentName}</h2>
                {getStatusBadge(currentStatus)}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Applying for <span className="font-semibold text-amber-300">{inquiry.gradeApplying}</span> • Submitted: {formattedDate}
              </p>
            </div>
          </div>
          <button
            id="close-inquiry-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Application Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {statusMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Action Conversion Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl border border-blue-800/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-serif flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Convert Lead to Enrolled Student
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-lg">
                Pre-fills the official student enrollment workflow with applicant & guardian details. You will review and assign Admission & Roll numbers before finalizing.
              </p>
            </div>
            <button
              id="convert-to-student-btn"
              onClick={() => onConvertToStudent(inquiry)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Convert to Student
            </button>
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Applicant Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-blue-900" />
                Applicant Information
              </h4>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-semibold text-slate-900">{inquiry.studentName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Grade / Class:</span>
                  <span className="font-semibold text-blue-900">{inquiry.gradeApplying}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-medium text-slate-800">{inquiry.dateOfBirth || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-medium text-slate-800">{inquiry.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Previous School:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[180px] truncate" title={inquiry.previousSchool}>
                    {inquiry.previousSchool || 'None / Fresh Admission'}
                  </span>
                </div>
              </div>
            </div>

            {/* Parent / Guardian & Contact */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <Users className="w-4 h-4 text-blue-900" />
                Parent & Contact Details
              </h4>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Parent / Guardian:</span>
                  <span className="font-semibold text-slate-900">{inquiry.parentName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phone:</span>
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {inquiry.phone}
                  </a>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email:</span>
                  {inquiry.email ? (
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline truncate max-w-[180px]"
                      title={inquiry.email}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {inquiry.email}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[180px] truncate" title={inquiry.address}>
                    {inquiry.address || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Applicant's Submitted Message (if any) */}
          {inquiry.message && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1.5">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-700" />
                Message / Special Remarks from Parent
              </h4>
              <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-blue-100/80 italic whitespace-pre-wrap">
                "{inquiry.message}"
              </p>
            </div>
          )}

          {/* Status Management Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-900" />
              Manage Application Status
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id="status-pending-btn"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('pending')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  currentStatus === 'pending'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Pending
              </button>

              <button
                type="button"
                id="status-contacted-btn"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('contacted')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  currentStatus === 'contacted'
                    ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Contacted
              </button>

              <button
                type="button"
                id="status-enrolled-btn"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('enrolled')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  currentStatus === 'enrolled'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Enrolled
              </button>

              <button
                type="button"
                id="status-rejected-btn"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('rejected')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  currentStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-900 border-rose-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Rejected
              </button>
            </div>
            {isUpdatingStatus && (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating application status in Firestore...
              </div>
            )}
          </div>

          {/* Internal Administrative Notes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="inquiry-notes-input" className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-900" />
                Internal Administrative Follow-up Notes
              </label>
              <span className="text-[11px] text-slate-500">Visible only to Staff / Super Admins</span>
            </div>
            <textarea
              id="inquiry-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record follow-up calls, campus visit appointment, admission test schedule, or decision notes..."
              className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 focus:outline-none placeholder:text-slate-400 resize-y"
            />
            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="save-inquiry-notes-btn"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving Notes...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Delete & Close */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                id="initiate-delete-inquiry-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Application
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-xs font-medium text-rose-800">Confirm permanent deletion?</span>
                <button
                  type="button"
                  id="confirm-delete-inquiry-btn"
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
              id="close-inquiry-bottom-btn"
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
