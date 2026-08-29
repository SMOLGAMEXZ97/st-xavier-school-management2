import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, ShieldAlert, KeyRound, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isFirstLoginWarning?: boolean; // When triggered by initial login temporary-password warning
  isMandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isFirstLoginWarning = false,
  isMandatory = false,
}) => {
  const { changePassword, userProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(newPassword);
      setSuccess('Your password has been securely updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1400);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password. Please try again.';
      if (msg.includes('requires-recent-login')) {
        setError('Security check: Please log out and sign in again before changing your password.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="change-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 relative ${
            isFirstLoginWarning || isMandatory
              ? 'bg-amber-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          {onClose && (
            <button
              id="close-change-password-modal-x"
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
              {isFirstLoginWarning || isMandatory ? (
                <ShieldAlert className="w-6 h-6 text-amber-100" />
              ) : (
                <KeyRound className="w-6 h-6 text-blue-200" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif">
                {isFirstLoginWarning
                  ? 'Update School-Issued Password'
                  : isMandatory
                  ? 'Set New Permanent Password'
                  : 'Change Password'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isFirstLoginWarning
                  ? 'Security recommendation for your student account'
                  : `Signed in as ${userProfile?.email || 'Student'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isFirstLoginWarning && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Security Notice:</strong> You are currently signed in using your school-issued temporary password. We recommend updating to a personal password now to secure your results and student records.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-2 items-center">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  id="new-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              {onClose && (
                <button
                  type="button"
                  id="cancel-change-password-btn"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition"
                >
                  {isFirstLoginWarning ? 'Maybe Later' : 'Cancel'}
                </button>
              )}
              <button
                type="submit"
                id="submit-new-password-btn"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-900 text-white text-xs sm:text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : isFirstLoginWarning ? (
                  'Change Password'
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
