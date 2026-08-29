import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
  Mail,
  User,
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { adminBackendService } from '../../services/adminBackendService';

interface StaffManagementModuleProps {
  currentRole: string;
}

export const StaffManagementModule: React.FC<StaffManagementModuleProps> = ({ currentRole }) => {
  const [staffList, setStaffList] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [isPasswordAdmin, setIsPasswordAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authService.getStaffUsers();
      setStaffList(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load staff list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = () => {
    setDisplayName('');
    setEmail('');
    setRole('staff');
    setTemporaryPassword('');
    setIsPasswordAdmin(false);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  };

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setErrorMessage('Full name and email address are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. ramesh.sen@gmail.com or name@school.edu.in).');
      return;
    }

    if (temporaryPassword.trim() && temporaryPassword.trim().length < 6) {
      setErrorMessage('Temporary password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await adminBackendService.provisionStaffAccount({
        displayName: cleanName,
        email: cleanEmail,
        role,
        temporaryPassword: temporaryPassword.trim() || undefined,
        isPasswordAdmin,
      });

      setSuccessMessage(result.message || 'Staff account provisioned successfully.');
      setIsModalOpen(false);
      await fetchStaff();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to provision staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordAdmin = async (staffMember: AppUser) => {
    if (currentRole !== 'super_admin') return;
    try {
      const newStatus = !staffMember.isPasswordAdmin;
      await authService.setStaffPasswordAdminStatus(staffMember.uid, newStatus);
      setStaffList((prev) =>
        prev.map((s) => (s.uid === staffMember.uid ? { ...s, isPasswordAdmin: newStatus } : s))
      );
      setSuccessMessage(
        `${staffMember.displayName} is ${newStatus ? 'now designated as a' : 'no longer a'} Password Administrator.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password admin status.');
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'exam_editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-900 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-serif text-slate-900">
              Staff Administration & Delegated Access
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage school staff accounts, assign administrative roles, and designate authorized Student Password Administrators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStaff}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-900' : ''}`} />
          </button>
          {currentRole === 'super_admin' && (
            <button
              id="provision-staff-btn"
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Provision Staff Account
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Architecture Explanation Card */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-2">
        <div className="font-bold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-900" />
          Password Administrator Role Architecture
        </div>
        <p className="text-[11px] leading-relaxed text-blue-900/90">
          <strong>Security Principle:</strong> Normal staff members cannot reset student passwords. Super Administrators and staff specifically designated with <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">isPasswordAdmin: true</code> in their user document are authorized to execute DOB-based student password resets. The Firestore user record serves as the authoritative source of truth.
        </p>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 font-serif">Registered Staff Directory</h2>
          <span className="text-xs text-slate-500 font-medium">{staffList.length} Active Staff</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading staff records...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No staff records found. Click <strong>Provision Staff Account</strong> to create your first administrative user.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Password Admin Privilege</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staffList.map((staff) => {
                  const isSuper = staff.role === 'super_admin';
                  const hasPwAdmin = staff.isPasswordAdmin || isSuper;

                  return (
                    <tr key={staff.uid} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{staff.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">UID: {staff.uid}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">{staff.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(
                            staff.role
                          )}`}
                        >
                          {staff.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasPwAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            {isSuper ? 'Inherent (Super Admin)' : 'Authorized Password Admin'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Staff Access</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {currentRole === 'super_admin' && !isSuper && (
                          <button
                            onClick={() => handleTogglePasswordAdmin(staff)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                              staff.isPasswordAdmin
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {staff.isPasswordAdmin ? 'Revoke Password Admin' : 'Grant Password Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-900 text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-slate-100">
                    Provision Staff Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Creates Firebase Auth credentials and server authorization record.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionStaff} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sen"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh.sen@gmail.com or name@school.edu.in"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Administrative Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-hidden bg-white"
                >
                  <option value="staff">Academic Staff (General Access & Enrollment)</option>
                  <option value="accountant">School Accountant (Fee Ledgers & Receipts)</option>
                  <option value="exam_editor">Examination Controller (Marks & Scorecards)</option>
                  <option value="super_admin">Super Administrator (Full System Privilege)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Temporary Password <span className="text-slate-400 font-normal">(Optional, min 6 chars)</span>
                </label>
                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
                />
              </div>

              {/* Password Admin Designation Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPasswordAdmin}
                    onChange={(e) => setIsPasswordAdmin(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      Designate as Authorized Student Password Administrator
                    </span>
                    <span className="text-[11px] text-amber-800 block mt-0.5 leading-relaxed">
                      Grants this staff member permission to reset student temporary passwords for forgotten credentials. Stored authoritatively in Firestore <code className="font-mono bg-amber-100 px-1 rounded">/users</code>.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Provision Staff User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
