import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { SchoolLogo } from '../SchoolLogo';

interface AdminLoginProps {
  onNavigateHome: () => void;
  onNavigateStudentLogin: () => void;
  onLoginSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onNavigateHome,
  onNavigateStudentLogin,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();

    // Field-level validation
    if (!cleanEmail) {
      setError('Please enter your staff email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address format (e.g. stxaviertihidi@gmail.com).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const profile = await login(cleanEmail, password);

      if (profile && profile.role === 'student') {
        // Safe signout to prevent invalid role session in admin portal
        await authService.logout();
        setError('This portal is reserved for School Staff and Administrators. Please use the Student & Guardian Portal.');
        setPassword('');
        return;
      }

      if (profile && !profile.active) {
        await authService.logout();
        setError('Your staff account has been marked inactive. Please contact the Super Administrator.');
        setPassword('');
        return;
      }

      if (!profile) {
        await authService.logout();
        setError('Your account is not registered in the school staff directory. Please contact the Super Administrator.');
        setPassword('');
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.warn('Staff authentication error:', err?.code || err?.message);
      const code = err?.code || '';

      // Preserve entered email, clear ONLY password
      setPassword('');

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError('Incorrect email or password. Please verify your credentials and try again.');
      } else if (code === 'auth/invalid-email') {
        setError('The entered email address is not formatted correctly. Please enter a valid email.');
      } else if (code === 'auth/user-disabled') {
        setError('This staff account has been deactivated. Please contact the Super Administrator.');
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
        <div className="glass-panel bg-white/95 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white text-center relative">
            <div className="flex justify-center mb-3">
              <SchoolLogo size="md" className="shadow-lg" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              Administrative Portal
            </div>
            <h1 className="text-xl font-bold font-serif">Staff & Management Sign In</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Super Admin, Academic Staff, Accountants & Exam Editors
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {error && (
              <div
                id="admin-login-error-alert"
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
                  htmlFor="admin-email-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Official Staff Email
                </label>
                <div className="relative">
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. stxaviertihidi@gmail.com or name@school.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition disabled:opacity-60"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="admin-password-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    id="admin-password-toggle-btn"
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

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed flex gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Institutional Access Guard:</strong> Role permissions (Super Admin, Accountant, Exam Editor, Staff) are provisioned through the administrative system.
                </div>
              </div>

              <button
                type="submit"
                id="admin-login-submit-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-slate-950/10 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Sign In to Staff Console
                  </>
                )}
              </button>
            </form>

            {/* Switch to Student Portal */}
            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Are you a Student or Guardian?{' '}
                <button
                  type="button"
                  id="switch-to-student-portal-btn"
                  onClick={onNavigateStudentLogin}
                  className="text-blue-900 font-semibold hover:underline"
                >
                  Student & Guardian Portal
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
