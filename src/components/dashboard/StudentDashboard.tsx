import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  GraduationCap,
  Bell,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Calendar,
  Phone,
  Home,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { SchoolLogo } from '../SchoolLogo';
import { formatDateToDisplay } from '../../utils/dateUtils';
import { StudentNoticesView } from './students/StudentNoticesView';
import { StudentFeeLedgerView } from './fees/StudentFeeLedgerView';
import { StudentResultsView } from './examinations/StudentResultsView';

interface StudentDashboardProps {
  onNavigateHome: () => void;
}

type TabType = 'profile' | 'fees' | 'results' | 'notices' | 'documents' | 'settings';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateHome }) => {
  const { currentUser, userProfile, isMustChangePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState<boolean>(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [showDelayedWarningModal, setShowDelayedWarningModal] = useState<boolean>(false);
  const [hasDismissedDelayedPrompt, setHasDismissedDelayedPrompt] = useState<boolean>(false);

  // Trigger delayed dismissible password warning 3.5s after landing on dashboard
  useEffect(() => {
    if (isMustChangePassword && !hasDismissedDelayedPrompt) {
      const timer = setTimeout(() => {
        setShowDelayedWarningModal(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isMustChangePassword, hasDismissedDelayedPrompt]);

  useEffect(() => {
    const loadStudent = async () => {
      if (userProfile?.studentId) {
        try {
          const s = await studentService.getStudentById(userProfile.studentId);
          setStudentData(s);
        } catch (e) {
          console.warn('Could not fetch student record:', e);
        } finally {
          setLoadingStudent(false);
        }
      } else if (currentUser?.uid) {
        try {
          const s = await studentService.getStudentByAuthUid(currentUser.uid);
          setStudentData(s);
        } catch (e) {
          console.warn('Could not fetch student record by UID:', e);
        } finally {
          setLoadingStudent(false);
        }
      } else {
        setLoadingStudent(false);
      }
    };
    loadStudent();
  }, [userProfile, currentUser]);

  const handleLogout = async () => {
    await logout();
    onNavigateHome();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Dismissible Password Change Modal (Delayed Prompt or Manual trigger from Settings/Banner) */}
      <ChangePasswordModal
        isOpen={showDelayedWarningModal || isChangePasswordModalOpen}
        onClose={() => {
          setShowDelayedWarningModal(false);
          setIsChangePasswordModalOpen(false);
          setHasDismissedDelayedPrompt(true);
        }}
        isFirstLoginWarning={Boolean(isMustChangePassword && !isChangePasswordModalOpen)}
        isMandatory={false}
      />

      {/* Top App Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchoolLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base font-serif text-slate-100">
                  St. Xavier High School
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-700/60">
                  Student Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tihidi, Bhadrak, Odisha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              Public Website
            </button>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-200">
                {userProfile?.displayName || currentUser?.email}
              </div>
              <div className="text-[10px] text-slate-400">
                Student Account
              </div>
            </div>
            <button
              id="student-logout-btn"
              onClick={handleLogout}
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 text-xl font-bold font-serif shadow-inner">
              {studentData?.firstName?.[0] || userProfile?.displayName?.[0] || 'S'}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif">
                Welcome, {studentData ? `${studentData.firstName} ${studentData.lastName}` : (userProfile?.displayName || 'Student')}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-blue-200/80 mt-1">
                <span>Admission No: <strong className="text-white font-mono">{studentData?.admissionNumber || 'Assigned in Records'}</strong></span>
                <span>•</span>
                <span>Class: <strong className="text-white">{studentData?.className || 'Class Enrolled'}</strong></span>
                {studentData?.section && <span>({studentData.section})</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Session
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Prominent Password Change Alert Banner */}
        {isMustChangePassword && (
          <div
            id="student-must-change-password-alert"
            className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs mt-0.5 sm:mt-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-amber-950">
                    Notice: School-Issued Temporary Password in Use
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Recommendation
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 mt-1 max-w-2xl leading-relaxed">
                  Your student account is currently using the initial school-issued temporary password. For enhanced security and privacy, we recommend setting a private personal password.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 sm:self-center">
              <button
                id="banner-change-password-btn"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-3 mb-6 border-b border-slate-200">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
            { id: 'results', label: 'Examination Results', icon: GraduationCap },
            { id: 'notices', label: 'School Notices', icon: Bell },
            { id: 'documents', label: 'Documents & Certificates', icon: FileText },
            { id: 'settings', label: 'Account Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`student-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="transition-all duration-200">
          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-900" />
                    Student Official Information
                  </h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    studentData?.active !== false
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {studentData?.active !== false ? 'Active Enrollment' : 'Inactive / Leave'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admission Number</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {studentData?.admissionNumber || 'Recorded in School Registry'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Class & Section</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {studentData?.className || 'Class Record'} {studentData?.section ? `(${studentData.section})` : ''}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student Name</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentData ? `${studentData.firstName} ${studentData.lastName}` : userProfile?.displayName}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student ID / System ID</div>
                    <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                      {studentData?.admissionNumber || userProfile?.studentId || 'Assigned in Records'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {formatDateToDisplay(studentData?.dateOfBirth) || 'On File with Registrar'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gender</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentData?.gender || 'On Record'}
                    </div>
                  </div>
                </div>

                {/* Guardian Info */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Parent / Guardian Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Guardian Name</div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        {studentData?.guardianName || 'Parent On Record'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Emergency Phone</div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        {studentData?.guardianPhone || 'On File'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status / Identity Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 font-serif mb-3">Academic Session</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Current Session</span>
                      <span className="font-semibold text-slate-800">2025–2026</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Affiliation</span>
                      <span className="font-semibold text-slate-800">CBSE Curriculum</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">School Code</span>
                      <span className="font-semibold text-slate-800">SXHS-THD-2014</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-950">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5">
                    Need Details Updated?
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Student records are protected by administrative security rules. To request changes to address or phone number, please contact the administrative desk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEES & INVOICES */}
          {activeTab === 'fees' && <StudentFeeLedgerView student={studentData} />}

          {/* TAB 3: RESULTS */}
          {activeTab === 'results' && <StudentResultsView student={studentData} />}

          {/* TAB 4: NOTICES */}
          {activeTab === 'notices' && (
            <StudentNoticesView />
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-900" />
                  Institutional Documents & Certificates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download academic calendar, syllabus schedules, and request certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-900">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Academic Calendar 2025-26</div>
                      <div className="text-[10px] text-slate-500">PDF • Standard Schedule</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    Available
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">School Uniform & Code Guidelines</div>
                      <div className="text-[10px] text-slate-500">PDF • Official Rules</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    Available
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-900" />
                  Account Security & Password Settings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your credentials and view authorization status.
                </p>
              </div>

              <div className="space-y-6 max-w-lg">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-1">Login Email</div>
                  <div className="text-sm font-mono text-slate-600">{userProfile?.email}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-1">Change Account Password</div>
                  <p className="text-xs text-slate-500 mb-3">
                    Update your permanent personal password at any time to keep your account safe.
                  </p>
                  <button
                    id="open-change-password-btn"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition shadow-sm"
                  >
                    Change Password
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs font-bold text-rose-900 mb-1">Sign Out</div>
                  <p className="text-xs text-rose-700 mb-3">
                    End your active student portal session on this device.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm"
                  >
                    Sign Out Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
