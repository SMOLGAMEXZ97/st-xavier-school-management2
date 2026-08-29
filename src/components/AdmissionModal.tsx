import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  Send,
  Sparkles,
  PhoneCall,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { SCHOOL_INFO } from '../data/schoolData';
import { AdmissionInquiry } from '../types';
import { DateInput } from './common/DateInput';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdmissionModal: React.FC<AdmissionModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<AdmissionInquiry>({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    gradeApplying: 'Playgroup / Nursery',
    dateOfBirth: '',
    gender: 'Male',
    previousSchool: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const gradesList = [
    'Playgroup / Nursery',
    'LKG (Lower Kindergarten)',
    'UKG (Upper Kindergarten)',
    'Class I',
    'Class II',
    'Class III',
    'Class IV',
    'Class V',
    'Class VI',
    'Class VII',
    'Class VIII',
    'Class IX',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.studentName.trim() || !formData.parentName.trim() || !formData.phone.trim()) {
      setFormError('Please provide Student Name, Parent/Guardian Name, and Contact Phone Number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inquiryService.submitInquiry(formData);
      setSubmitted(true);
      setMessage(res.message);
    } catch {
      setFormError('Submission failed. Please check your internet connection or call our admission desk directly at ' + SCHOOL_INFO.phonePrimary);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormError(null);
    setFormData({
      studentName: '',
      parentName: '',
      email: '',
      phone: '',
      gradeApplying: 'Playgroup / Nursery',
      dateOfBirth: '',
      gender: 'Male',
      previousSchool: '',
      message: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-center border border-white/20 shadow-md">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                Admission Inquiry (2026–27)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                St. Xavier High School, Tihidi, Bhadrak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300/40 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-xl text-slate-900 mb-2">
              Application Received!
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              {message}
            </p>
            <div className="glass-panel-subtle p-4.5 rounded-2xl text-xs text-blue-950 border border-blue-200/60 mb-6 max-w-sm mx-auto">
              <div className="font-bold text-sm mb-0.5">Admission Helpdesk:</div>
              <div className="font-semibold text-blue-900">{SCHOOL_INFO.phonePrimary}</div>
              <div className="text-slate-500 mt-0.5">Mon - Sat: 8:00 AM - 2:00 PM</div>
            </div>
            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md border border-white/20 transition-all"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2.5 items-start animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-student">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-student"
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Full name of child"
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-parent">
                  Parent / Guardian <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-parent"
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Parent's full name"
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-phone">
                  Phone / WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 94370 00000"
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-grade">
                  Applying for Grade <span className="text-red-500">*</span>
                </label>
                <select
                  id="modal-grade"
                  value={formData.gradeApplying}
                  onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                >
                  {gradesList.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-email">
                  Email Address
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                />
              </div>

              <div>
                <DateInput
                  id="modal-dob"
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(displayVal, isoVal) => setFormData({ ...formData, dateOfBirth: isoVal || displayVal })}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="modal-notes">
                Village / Residence Location in Bhadrak
              </label>
              <input
                id="modal-notes"
                type="text"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="e.g. Tihidi Main Bazaar, Pirahat, Dobal..."
                className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                id="modal-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md border border-white/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Submitting Application...' : 'Submit Admission Inquiry'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
