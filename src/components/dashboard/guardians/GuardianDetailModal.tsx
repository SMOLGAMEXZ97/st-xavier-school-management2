import React from 'react';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Printer,
  Building,
  User,
  Users,
} from 'lucide-react';
import { GuardianContactRecord, Student } from '../../../types';
import { formatDateToDisplay } from '../../../utils/dateUtils';

interface GuardianDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardian: GuardianContactRecord | null;
}

export const GuardianDetailModal: React.FC<GuardianDetailModalProps> = ({
  isOpen,
  onClose,
  guardian,
}) => {
  if (!isOpen || !guardian) return null;

  // Clean phone for tel: and whatsapp:
  const rawPhone = guardian.guardianPhone || '';
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const telLink = rawPhone ? `tel:${rawPhone.replace(/\s+/g, '')}` : undefined;
  
  // Format international number for WhatsApp: If 10 digits (India standard), prefix with 91 if no country code
  let waNumber = digitsOnly;
  if (digitsOnly.length === 10) {
    waNumber = `91${digitsOnly}`;
  }
  const hasValidPhone = digitsOnly.length >= 7;
  const waLink = hasValidPhone ? `https://wa.me/${waNumber}` : undefined;
  const emailLink = guardian.guardianEmail ? `mailto:${guardian.guardianEmail.trim()}` : undefined;

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guardian-modal-title" className="text-lg font-bold font-serif leading-tight">
                {guardian.guardianName || 'Guardian Profile'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-700/80 text-blue-100 border border-blue-600/60">
                  {guardian.guardianRelationship || 'Guardian'}
                </span>
                <span className="text-xs text-blue-200">
                  • {guardian.students.length} Ward{guardian.students.length > 1 ? 's' : ''} Enrolled
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* EMERGENCY CONTACT NOTICE */}
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Primary Guardian & Emergency Contact</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                This record serves as the official primary emergency contact and billing contact on file for all linked students.
              </p>
            </div>
          </div>

          {/* GUARDIAN CONTACT DETAILS CARD */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-900" />
              Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {guardian.guardianName || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Relationship:</span>
                <span className="font-semibold text-slate-800">
                  {guardian.guardianRelationship || 'Parent / Guardian'}
                </span>
              </div>

              {/* Phone with Actions */}
              <div className="sm:col-span-2 p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">Primary Contact Phone:</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900 text-sm tracking-wide">
                      {guardian.guardianPhone || 'Not Provided'}
                    </span>
                  </div>

                  {hasValidPhone && (
                    <div className="flex items-center gap-2">
                      {telLink && (
                        <a
                          href={telLink}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-300 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                      )}
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 hover:bg-green-100 rounded-lg text-xs font-semibold border border-green-300 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email with Action */}
              <div className="sm:col-span-2 p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">Email Address:</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-900">
                      {guardian.guardianEmail || 'Not Provided on file'}
                    </span>
                  </div>

                  {emailLink && (
                    <a
                      href={emailLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-300 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Email
                    </a>
                  )}
                </div>
              </div>

              {/* Residential Address */}
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-0.5">Residential Address:</span>
                <div className="flex items-start gap-2 text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed whitespace-pre-line">
                    {guardian.address || 'Address not recorded.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LINKED ENROLLED STUDENTS / WARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-900" />
                Linked Ward{guardian.students.length > 1 ? 's' : ''} ({guardian.students.length})
              </h3>
              {guardian.students.length > 1 && (
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Sibling Group
                </span>
              )}
            </div>

            <div className="space-y-3">
              {guardian.students.map((student: Student, idx: number) => {
                const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';
                const isActive = student.active !== false;

                return (
                  <div
                    key={student.id || student.studentId || idx}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200">
                          {student.rollNumber || (idx + 1)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-serif">
                            {fullName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Adm No: <span className="font-mono font-semibold text-slate-700">{student.admissionNumber || '—'}</span>
                            {student.studentId && ` • ID: ${student.studentId}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isActive ? 'Active Student' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Class & Section</span>
                        <span className="font-semibold text-slate-800">
                          {student.className || 'Class 1'} - {student.section || 'A'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Roll Number</span>
                        <span className="font-semibold text-slate-800">
                          {student.rollNumber || '—'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Academic Year</span>
                        <span className="font-semibold text-slate-800">
                          {student.academicYear || '2026-2027'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Date of Birth</span>
                        <span className="font-semibold text-slate-800">
                          {formatDateToDisplay(student.dateOfBirth)}
                        </span>
                      </div>
                    </div>

                    {student.previousSchool && (
                      <p className="text-[11px] text-slate-500 pt-1">
                        <span className="font-medium text-slate-700">Previous Institution:</span> {student.previousSchool}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Contact Sheet
          </button>

          <div className="flex items-center gap-2">
            {telLink && (
              <a
                href={telLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Phone
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
