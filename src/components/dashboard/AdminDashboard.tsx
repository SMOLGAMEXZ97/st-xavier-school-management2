import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  Receipt,
  GraduationCap,
  Bell,
  FileCheck2,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Home,
  ShieldCheck,
  CheckCircle2,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { SchoolLogo } from '../SchoolLogo';
import { StudentManagementModule } from './students/StudentManagementModule';
import { StaffManagementModule } from './StaffManagementModule';
import { AdmissionsDeskModule } from './admissions/AdmissionsDeskModule';

interface AdminDashboardProps {
  onNavigateHome: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'students'
  | 'guardians'
  | 'fees'
  | 'payments'
  | 'examination'
  | 'notices'
  | 'admissions'
  | 'reports'
  | 'staff'
  | 'settings';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  description: string;
}

const ALL_TABS: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'staff', 'accountant', 'exam_editor'],
    description: 'System metrics and role management overview',
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    allowedRoles: ['super_admin', 'staff'],
    description: 'Student master records and enrollment',
  },
  {
    id: 'guardians',
    label: 'Guardians & Contacts',
    icon: UserCheck,
    allowedRoles: ['super_admin', 'staff'],
    description: 'Parent contact directory & emergency alerts',
  },
  {
    id: 'fees',
    label: 'Fee Ledgers',
    icon: CreditCard,
    allowedRoles: ['super_admin', 'accountant'],
    description: 'Student fee assessments & dues',
  },
  {
    id: 'payments',
    label: 'Payments & Receipts',
    icon: Receipt,
    allowedRoles: ['super_admin', 'accountant'],
    description: 'Payment transactions and settlement logs',
  },
  {
    id: 'examination',
    label: 'Examinations',
    icon: GraduationCap,
    allowedRoles: ['super_admin', 'exam_editor'],
    description: 'Exams, marks entry, and scorecards',
  },
  {
    id: 'notices',
    label: 'Notice Board',
    icon: Bell,
    allowedRoles: ['super_admin', 'staff'],
    description: 'School circulars & academic notices',
  },
  {
    id: 'admissions',
    label: 'Admissions Desk',
    icon: FileCheck2,
    allowedRoles: ['super_admin', 'staff'],
    description: 'Online parent inquiries and applications',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    allowedRoles: ['super_admin', 'staff', 'accountant', 'exam_editor'],
    description: 'Academic and administrative analytics',
  },
  {
    id: 'staff',
    label: 'Staff Administration',
    icon: Shield,
    allowedRoles: ['super_admin'],
    description: 'User roles, access control, and permissions',
  },
  {
    id: 'settings',
    label: 'Account Settings',
    icon: Settings,
    allowedRoles: ['super_admin', 'staff', 'accountant', 'exam_editor'],
    description: 'Manage staff password and session security',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateHome }) => {
  const { userProfile, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const currentRole = role || 'staff';

  const accessibleTabs = ALL_TABS.filter((t) =>
    t.allowedRoles.includes(currentRole as UserRole)
  );

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'super_admin':
        return 'Super Administrator';
      case 'accountant':
        return 'School Accountant';
      case 'exam_editor':
        return 'Examination Controller';
      case 'staff':
        return 'Academic Staff';
      default:
        return 'Staff Member';
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigateHome();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Top Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchoolLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base font-serif text-slate-100">
                  St. Xavier Management Console
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {getRoleDisplayName(currentRole)}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tihidi, Bhadrak • RBAC Secured Session
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
                {userProfile?.displayName || userProfile?.email}
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono">
                {userProfile?.email}
              </div>
            </div>
            <button
              id="admin-logout-btn"
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 sticky top-24">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Module Navigation
            </div>
            <nav className="space-y-1">
              {accessibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`admin-nav-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Security Engine Active
                </div>
                <div>Role: <strong className="text-slate-800">{currentRole}</strong></div>
                <div>Status: <strong className="text-emerald-700">Enforced by Rules</strong></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Workspace Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h1 className="text-lg sm:text-xl font-bold font-serif text-slate-900 mb-2">
                  Institutional Management Overview
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                  Welcome to the St. Xavier High School administrative shell. All access to student master records, fee ledgers, examinations, and user authorization is protected by Firestore Security Rules.
                </p>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessibleTabs
                  .filter((t) => t.id !== 'dashboard' && t.id !== 'settings')
                  .map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-900 transition">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition">
                            {tab.label}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: STUDENTS */}
          {activeTab === 'students' && <StudentManagementModule />}

          {/* TAB: GUARDIANS */}
          {activeTab === 'guardians' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-900" />
                  Guardians & Contact Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Emergency contact and guardian communication directory.
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Guardian Directory Ready</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Guardian names, emergency phone numbers, and communication emails are linked to each student record.
                </p>
              </div>
            </div>
          )}

          {/* TAB: FEES */}
          {activeTab === 'fees' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-900" />
                  Fee Ledger Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student fee structures and dues stored under <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/fees</code>
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Accountant Module Activated</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Secured exclusively for Accountants and Super Admins. Students cannot tamper with or modify due amounts.
                </p>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-900" />
                  Payment Transactions & Receipts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financial transactions logged under <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/payments</code>
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Payment Ledger Ready</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Individual transactions record transaction IDs, payment methods (Cash, UPI, Bank), timestamps, and linked fee IDs.
                </p>
              </div>
            </div>
          )}

          {/* TAB: EXAMINATIONS */}
          {activeTab === 'examination' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900" />
                  Examination Management & Report Cards
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exams and results stored under <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/exams</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/results</code>
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Exam Editor Module Activated</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Restricted to Exam Editors and Super Admins. Draft scores remain hidden from students until marked published.
                </p>
              </div>
            </div>
          )}

          {/* TAB: NOTICES */}
          {activeTab === 'notices' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-900" />
                  Notice Board Administration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage public and academic notices under <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/notices</code>
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Notice Board Controls</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Notices can be published by authorized Staff and Super Administrators to broadcast in real-time to the portal.
                </p>
              </div>
            </div>
          )}

          {/* TAB: ADMISSIONS */}
          {activeTab === 'admissions' && (
            <AdmissionsDeskModule />
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-900" />
                  Institutional Reports & Data Summaries
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic, financial, and attendance analytics
                </p>
              </div>

              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <BarChart3 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">Reports Workspace</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Analytics queries will aggregate fee reconciliations, examination grade distributions, and enrollment metrics.
                </p>
              </div>
            </div>
          )}

          {/* TAB: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <StaffManagementModule currentRole={currentRole} />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-900" />
                  Staff Account Settings & Security
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage credentials and active session security.
                </p>
              </div>

              <div className="space-y-6 max-w-lg">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-1">Official Email</div>
                  <div className="text-sm font-mono text-slate-600">{userProfile?.email}</div>
                  <div className="text-xs text-slate-500 mt-1">Role: <strong>{getRoleDisplayName(currentRole)}</strong></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-1">Change Staff Password</div>
                  <p className="text-xs text-slate-500 mb-3">
                    Ensure strong password hygiene for all administrative access accounts.
                  </p>
                  <button
                    id="open-admin-change-password-btn"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                  >
                    Change Password
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs font-bold text-rose-900 mb-1">Sign Out</div>
                  <p className="text-xs text-rose-700 mb-3">
                    Terminate active administrative session on this workstation.
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
        </main>
      </div>
    </div>
  );
};
