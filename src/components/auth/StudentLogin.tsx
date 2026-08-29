import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  AlertCircle,
  ArrowLeft,
  Loader2,
  KeyRound,
  UserCheck,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { SchoolLogo } from '../SchoolLogo';
import { formatStudentAuthIdentifier } from '../../services/authService';

interface StudentLoginProps {
  onNavigateHome: () => void;
  onNavigateStaffLogin: () => void;
  onLoginSuccess?: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onNavigateHome,
  onNavigateStaffLogin,
  onLoginSuccess,
}) => {
  const { loginStudent } = useAuth();
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = studentIdentifier.trim();

    // Field-level validation
    if (!cleanIdentifier) {
      setError('Please enter your Student ID or Admission Number (e.g. ADM-2026-001).');
      return;
    }

    if (!password) {
      setError('Please enter your student portal password (or temporary DOB password).');
      return;
    }

    setIsLoading(true);

    try {
      const { user, profile } = await loginStudent(cleanIdentifier, password);

      if (profile && profile.role !== 'student') {
        // Safe signout to prevent invalid role session in student portal
        await authService.logout();
        setError('This portal is reserved for Students & Guardians. Staff members should use the Staff Login Portal.');
        setPassword('');
        return;
      }

      if (profile && !profile.active) {
        await authService.logout();
        setError('This student account is currently marked inactive. Please contact the school administration office.');
        setPassword('');
        return;
      }

      if (!profile) {
        await authService.logout();
        setError('Student profile not found in institutional database. Please contact the school administration.');
        setPassword('');
        return;
      }

      // Explicit navigation trigger
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.warn('Student authentication error:', err?.code || err?.message);
      const code = err?.code || '';

      // Preserve entered Student ID, clear ONLY password
      setPassword('');

      if (code === 'custom/profile-not-found') {
        await authService.logout();
        setError(
          'Authentication succeeded, but student profile is not yet configured in institutional records. Please contact school administration.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError(
          'Incorrect Student ID / Admission Number or password. Please verify your school-issued credentials or contact the school office.'
        );
      } else if (code === 'auth/user-disabled') {
        setError('This student account is currently deactivated. Please contact the school administration office.');
      } else if (code === 'auth/too-many-requests') {
        setError('Access temporarily locked due to multiple failed login attempts. Please try again in a few minutes.');
      } else if (code === 'auth/network-request-failed') {
        setError('Unable to connect to the authentication server. Please check your internet connection and try again.');
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 font-medium transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to School Website
        </button>

        {/* Card */}
        <div className="glass-panel bg-white/95 rounded-2xl shadow-2xl border border-blue-900/40 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white text-center relative">
            <div className="flex justify-center mb-3">
              <SchoolLogo size="md" className="shadow-lg" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-700 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Student & Guardian Portal
            </div>
            <h1 className="text-xl font-bold font-serif">Student & Guardian Sign In</h1>
            <p className="text-xs text-blue-100/80 mt-1 max-w-xs mx-auto">
              Access fee ledgers, receipts, academic scorecards, notices, and student records.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {error && (
              <div
                id="student-login-error-alert"
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex gap-2.5 items-start animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="student-id-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Student ID / Admission Number
                </label>
                <div className="relative">
                  <input
                    id="student-id-input"
                    type="text"
                    required
                    disabled={isLoading}
                    value={studentIdentifier}
                    onChange={(e) => {
                      setStudentIdentifier(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. ADM-2026-001 or STX-2026-ADM-2026-001"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition uppercase placeholder:normal-case disabled:opacity-60"
                  />
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="student-password-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="student-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    id="student-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Temporary Password Guidance Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed flex gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>First-time signing in?</strong> Use your school-issued Admission Number (e.g. <span className="font-mono font-semibold">ADM-2026-001</span>) and initial temporary password format: <span className="font-mono font-semibold">DDMMYY</span> (e.g. <span className="font-mono font-semibold">030215</span> for DOB 03/02/2015).
                </div>
              </div>

              <button
                type="submit"
                id="student-login-submit-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-blue-950/10 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Help / Contact School Option */}
            <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5 mb-1 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                Need Assistance or Forgot Password?
              </p>
              <p className="text-[11px] text-slate-500">
                Contact the school administrative office at{' '}
                <a href="tel:9437084533" className="text-blue-900 font-semibold hover:underline">
                  +91 9437084533
                </a>{' '}
                or visit the school administration counter.
              </p>
            </div>

            {/* Portal Switch Footer */}
            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                School Administrator, Teacher, or Accountant?{' '}
                <button
                  type="button"
                  id="switch-to-staff-portal-btn"
                  onClick={onNavigateStaffLogin}
                  className="text-blue-900 font-semibold hover:underline"
                >
                  Staff Login Portal
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
