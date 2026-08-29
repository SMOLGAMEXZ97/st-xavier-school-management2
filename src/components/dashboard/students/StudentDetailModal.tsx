import React, { useState } from 'react';
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
  ShieldCheck,
  KeyRound,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Student } from '../../../types';
import { studentService } from '../../../services/studentService';
import { formatStudentAuthIdentifier, generateInitialStudentPassword } from '../../../services/authService';
import { adminBackendService } from '../../../services/adminBackendService';
import { useAuth } from '../../../context/AuthContext';
import { formatDateToDisplay } from '../../../utils/dateUtils';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onStatusChange: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onStatusChange,
}) => {
  const { role, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'guardian' | 'auth'>('profile');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isProvisioningAuth, setIsProvisioningAuth] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const canResetPassword = role === 'super_admin' || Boolean(userProfile?.isPasswordAdmin);

  const internalAuthIdentifier = formatStudentAuthIdentifier(student.studentId || student.admissionNumber || student.id);

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const newStatus = !student.active;
      await studentService.setStudentActiveStatus(student.id || student.studentId || '', newStatus);
      // Also notify backend if authUid exists
      if (student.authUid) {
        try {
          await adminBackendService.deactivateUserAccount({
            studentId: student.id || student.studentId || '',
            uid: student.authUid,
            active: newStatus,
          });
        } catch {
          // Non-blocking in case Netlify function not yet reachable
        }
      }
      const updated = { ...student, active: newStatus, updatedAt: new Date().toISOString() };
      onStatusChange(updated);
      setStatusMessage(`Student marked ${newStatus ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setErrorMessage(err?.message || 'Failed to update student status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProvisionAuth = async () => {
    setIsProvisioningAuth(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const result = await adminBackendService.provisionStudentAccount({
        studentId: student.id || student.studentId || '',
        admissionNumber: student.admissionNumber,
        dateOfBirth: student.dateOfBirth,
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      });
      if (result.uid) {
        const updated = { ...student, authUid: result.uid, updatedAt: new Date().toISOString() };
        onStatusChange(updated);
      }
      setStatusMessage(result.message || 'Authentication account provisioned successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to provision authentication account.');
    } finally {
      setIsProvisioningAuth(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const result = await adminBackendService.resetStudentPassword({
        studentId: student.id || student.studentId || '',
        admissionNumber: student.admissionNumber,
        authUid: student.authUid,
        dateOfBirth: student.dateOfBirth,
      });
      setStatusMessage(result.message || 'Temporary password reset successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset student password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 border border-blue-700 flex items-center justify-center font-serif text-lg font-bold text-amber-300 shadow-md">
              {(student.firstName || 'S')[0]}
              {(student.lastName || 'T')[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif">
                  {student.firstName || ''} {student.lastName || ''}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    student.active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {student.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span>
                  {student.className} - Sec {student.section}
                </span>
                <span>•</span>
                <span>Roll No: {student.rollNumber}</span>
                <span>•</span>
                <span className="font-mono text-amber-300">{student.admissionNumber}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Academic & Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'guardian'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Guardian & Emergency Contacts
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'auth'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Authentication & Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* TAB 1: ACADEMIC & PERSONAL */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Admission Number
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {student.admissionNumber}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Class & Section
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {student.className} ({student.section})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Class Roll Number
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {student.rollNumber}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Academic Year
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {student.academicYear || '2026-2027'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Date of Birth
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDateToDisplay(student.dateOfBirth) || student.dateOfBirth}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Gender
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {student.gender}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Residential Address
                </div>
                <div className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                  {student.address}
                </div>
              </div>

              {student.previousSchool && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Previous School Attended
                  </div>
                  <div className="text-xs text-slate-800 font-medium mt-0.5">
                    {student.previousSchool}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Document ID: <code className="font-mono text-slate-600">{student.id}</code></span>
                <span>Enrolled: {student.admissionDate || student.createdAt.split('T')[0]}</span>
              </div>
            </div>
          )}

          {/* TAB 2: GUARDIAN & CONTACTS */}
          {activeTab === 'guardian' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed">
                  <strong>Student & Guardian Portal Access:</strong> The student account represents the student. Guardians use this student profile to inspect academic scorecards, attendance circulars, fee assessments, and transaction receipts.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Guardian Name
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {student.guardianName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Relationship: <strong>{student.guardianRelationship || 'Guardian'}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Primary Phone Number
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 flex items-center justify-between">
                    <span>{student.guardianPhone}</span>
                    <a
                      href={`tel:${student.guardianPhone}`}
                      className="px-2 py-1 rounded-md bg-blue-900 text-white text-[11px] font-medium hover:bg-blue-800 transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  </div>
                </div>
              </div>

              {student.guardianEmail && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Guardian Email Address
                  </div>
                  <div className="text-xs font-mono text-slate-800 mt-0.5">
                    {student.guardianEmail}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Emergency Communication Address
                </div>
                <div className="text-xs text-slate-800 mt-1">
                  {student.address}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTHENTICATION & ACCESS */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-900" />
                    Student Portal Login Credentials
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    student.authUid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {student.authUid ? 'Auth Account Linked' : 'Pending Auth Provisioning'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Login ID:</span>
                    <strong className="font-mono text-blue-900">{student.admissionNumber}</strong>
                    {student.studentId && student.studentId !== student.admissionNumber && (
                      <span className="text-[10px] text-slate-500 block font-mono">({student.studentId})</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Initial Temporary Password:</span>
                    <strong className="font-mono text-slate-800">
                      {generateInitialStudentPassword(student.dateOfBirth || '')}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">Authoritative format (DDMMYY)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Authentication Management */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Administrative Credential Actions (Netlify Functions)
                </div>
                <div className="flex flex-wrap gap-2">
                  {!student.authUid ? (
                    <button
                      onClick={handleProvisionAuth}
                      disabled={isProvisioningAuth}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                    >
                      {isProvisioningAuth ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      Provision Firebase Auth Account
                    </button>
                  ) : (
                    <div className="space-y-2 w-full">
                      <button
                        onClick={handleResetPassword}
                        disabled={isResettingPassword || !canResetPassword}
                        className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition text-xs font-semibold ${
                          canResetPassword
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 disabled:opacity-50'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                        title={
                          canResetPassword
                            ? 'Reset password to initial temporary DOB credentials'
                            : 'Requires super_admin or designated password administrator privilege'
                        }
                      >
                        {isResettingPassword ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                        )}
                        Reset Password to Initial Temporary
                      </button>
                      {!canResetPassword && (
                        <p className="text-[11px] text-amber-700 font-medium">
                          * Student password resets are restricted to Super Administrators and the designated school password administrator.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Internal Firebase Auth Identifier (Backend Only)
                </div>
                <div className="text-xs font-mono text-slate-700 mt-1">
                  {internalAuthIdentifier}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Note: Internal identifier is managed automatically by the authentication system and is not exposed to students.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  Netlify Functions Backend Integration
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900/90">
                  Firebase Authentication account provisioning and password resets are executed securely server-side via Netlify Functions and the Firebase Admin SDK, preserving administrative session isolation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                student.active
                  ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              {student.active ? 'Deactivate Student' : 'Activate Student'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Student
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
