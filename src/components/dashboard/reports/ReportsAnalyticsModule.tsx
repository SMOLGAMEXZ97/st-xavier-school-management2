import React, { useState, useEffect, useId } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  GraduationCap,
  FileCheck2,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  CreditCard,
  Building2,
  PieChart as PieChartIcon,
  ShieldCheck,
  UserCheck,
  UserX,
  Layers,
  Percent,
  Receipt,
  FileText,
  Table,
} from 'lucide-react';
import { reportService } from '../../../services/reportService';
import { ReportDashboardData, UserRole } from '../../../types';
import { StudentReportTable } from './StudentReportTable';
import { FeeReportTable } from './FeeReportTable';
import { PaymentRegisterTable } from './PaymentRegisterTable';
import { AdmissionsReportTable } from './AdmissionsReportTable';
import { AcademicReportTable } from './AcademicReportTable';
import { ExaminationBroadsheetTable } from './ExaminationBroadsheetTable';

interface ReportsAnalyticsModuleProps {
  currentRole?: UserRole;
}

type ReportViewTab =
  | 'overview'
  | 'students'
  | 'fees'
  | 'payments'
  | 'admissions'
  | 'academics'
  | 'broadsheet';

export const ReportsAnalyticsModule: React.FC<ReportsAnalyticsModuleProps> = ({ currentRole }) => {
  const [data, setData] = useState<ReportDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ReportViewTab>('overview');

  const sessionSelectId = useId();


  const loadDashboardData = async (session: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await reportService.getInstitutionalDashboardData(session);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load reports dashboard data:', err);
      setError(err?.message || 'Failed to aggregate institutional reports data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(selectedSession);
  }, [selectedSession]);

  const handleRefresh = () => {
    loadDashboardData(selectedSession, true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Grade color map for CBSE 8-Point scale
  const gradeColors: Record<string, { bg: string; text: string; bar: string }> = {
    A1: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', bar: 'bg-emerald-600' },
    A2: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', bar: 'bg-teal-600' },
    B1: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600' },
    B2: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', bar: 'bg-indigo-600' },
    C1: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', bar: 'bg-amber-500' },
    C2: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', bar: 'bg-orange-500' },
    D: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-500' },
    E: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', bar: 'bg-rose-600' },
  };

  return (
    <div className="space-y-6" id="reports-analytics-workspace">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 font-serif">
                Institutional Reports & Analytics
              </h1>
              {currentRole && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                  {currentRole.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Aggregated institutional intelligence across students, financial dues, academic performance, and admissions.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Global Academic Session Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label htmlFor={sessionSelectId} className="text-xs font-semibold text-slate-600">
                Session:
              </label>
              <select
                id={sessionSelectId}
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="text-xs font-medium text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer pr-2"
                disabled={loading}
              >
                <option value="all">All Academic Sessions</option>
                {data?.availableSessions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              id="refresh-reports-btn"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors disabled:opacity-50"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700' : 'text-slate-500'}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {data?.lastUpdated && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Showing data for: <strong className="text-slate-700">{selectedSession === 'all' ? 'All Historic & Current Records' : `Academic Session ${selectedSession}`}</strong>
            </span>
            <span>Last synchronized: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboardData(selectedSession)}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md font-semibold text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {data && (
        <div className="space-y-6">
          {/* Phase 2A: Report View Navigation Switcher */}
          <div
            id="reports-view-navigation-bar"
            className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto"
          >
            <button
              id="report-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Executive Overview</span>
            </button>

            <button
              id="report-tab-students"
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'students'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Register</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'students' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.students.length ?? data.kpis.totalStudents}
              </span>
            </button>

            <button
              id="report-tab-fees"
              onClick={() => setActiveTab('fees')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'fees'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Fee Ledgers</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'fees' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.fees.length ?? 0}
              </span>
            </button>

            <button
              id="report-tab-payments"
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'payments'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Register</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'payments' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.payments.length ?? 0}
              </span>
            </button>

            <button
              id="report-tab-admissions"
              onClick={() => setActiveTab('admissions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'admissions'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Admissions Leads</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'admissions' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.admissions.length ?? data.admissions.totalInquiries}
              </span>
            </button>

            <button
              id="report-tab-academics"
              onClick={() => setActiveTab('academics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'academics'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Scorecards</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'academics' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.academics.length ?? data.academic.totalEvaluated}
              </span>
            </button>

            <button
              id="report-tab-broadsheet"
              onClick={() => setActiveTab('broadsheet')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'broadsheet'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Examination Broadsheet</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'broadsheet' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {data.detailed?.rawExams?.length ?? 0}
              </span>
            </button>
          </div>

          {/* VIEW 1: EXECUTIVE PHASE 1 OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* SECTION 1: INSTITUTIONAL OVERVIEW KPI GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Enrolled Students</span>
                <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-serif">
                  {data.kpis.totalStudents}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {data.kpis.activeStudents} active
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {data.kpis.inactiveStudents > 0
                  ? `${data.kpis.inactiveStudents} marked inactive / archived`
                  : '100% active roster'}
              </div>
            </div>

            {/* Total Fees Net Demand */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Net Fee Demand</span>
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 font-serif">
                  {formatCurrency(data.financial.netDemand)}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Concessions:</span>
                <span className="font-semibold text-slate-700">{formatCurrency(data.financial.concessions)}</span>
              </div>
            </div>

            {/* Total Fees Collected */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Fee Collections</span>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700 font-serif">
                  {formatCurrency(data.financial.totalCollected)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Collection Rate:</span>
                <span className="font-bold text-emerald-700">
                  {data.financial.collectionPercentage}%
                </span>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Outstanding Balance</span>
                <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-bold font-serif ${data.financial.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                  {formatCurrency(data.financial.outstandingBalance)}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Overdue Ledgers:</span>
                <span className="font-semibold text-amber-800">
                  {data.financial.statusCounts.overdue} records
                </span>
              </div>
            </div>
          </div>

          {/* SECONDARY KPI ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Admissions Intake */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Admissions Leads</div>
                  <div className="text-base font-bold text-slate-900">
                    {data.admissions.totalInquiries} inquiries
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Pending Review: <strong className="text-purple-700">{data.admissions.pending}</strong></span>
                <span>Enrolled: <strong className="text-emerald-700">{data.admissions.enrolled}</strong></span>
              </div>
            </div>

            {/* Academic Pass Rate */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Institutional Pass Rate</div>
                  <div className="text-base font-bold text-slate-900">
                    {data.academic.totalEvaluated > 0 ? `${data.academic.overallPassRate}%` : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Class Average: <strong className="text-blue-900">{data.academic.overallAveragePercentage}%</strong></span>
                <span>Evaluated: <strong className="text-slate-800">{data.academic.totalEvaluated}</strong></span>
              </div>
            </div>

            {/* Examination Count */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Assessments Created</div>
                  <div className="text-base font-bold text-slate-900">
                    {data.academic.totalExams} schedules
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Published: <strong className="text-teal-700">{data.academic.publishedExams}</strong></span>
                <span>Draft: <strong className="text-slate-600">{data.academic.draftExams}</strong></span>
              </div>
            </div>

            {/* Admissions Conversion */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Inquiry Conversion</div>
                  <div className="text-base font-bold text-slate-900">
                    {data.admissions.totalInquiries > 0 ? `${data.admissions.conversionRate}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>In Progress: <strong className="text-amber-700">{data.admissions.contacted}</strong></span>
                <span>Rejected: <strong className="text-slate-500">{data.admissions.rejected}</strong></span>
              </div>
            </div>
          </div>

          {/* DUAL-COLUMN DETAILED OVERVIEWS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FINANCIAL HEALTH OVERVIEW */}
            <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${currentRole === 'accountant' ? 'ring-2 ring-blue-900' : ''}`}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 font-serif">
                    Financial Reconciliation & Fee Ledgers
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {data.financial.statusCounts.paid + data.financial.statusCounts.partially_paid + data.financial.statusCounts.pending + data.financial.statusCounts.overdue} Total Assessments
                </span>
              </div>

              {/* Demand vs Collection Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Collection Progress</span>
                  <span className="text-emerald-700">{data.financial.collectionPercentage}% Collected</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.financial.collectionPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Financial Metrics Summary Table */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Gross Assessed:</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(data.financial.grossAssessed)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Total Waivers/Discounts:</span>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    {formatCurrency(data.financial.concessions)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Net Realizable Demand:</span>
                  <div className="text-sm font-bold text-blue-900 mt-0.5">
                    {formatCurrency(data.financial.netDemand)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Outstanding Balance:</span>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">
                    {formatCurrency(data.financial.outstandingBalance)}
                  </div>
                </div>
              </div>

              {/* Fee Status Distribution */}
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                  Ledger Settlement Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-center">
                    <div className="text-xs font-semibold text-emerald-800">Paid in Full</div>
                    <div className="text-base font-bold text-emerald-900 mt-0.5">
                      {data.financial.statusCounts.paid}
                    </div>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-center">
                    <div className="text-xs font-semibold text-blue-800">Partial Paid</div>
                    <div className="text-base font-bold text-blue-900 mt-0.5">
                      {data.financial.statusCounts.partially_paid}
                    </div>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-center">
                    <div className="text-xs font-semibold text-amber-800">Pending</div>
                    <div className="text-base font-bold text-amber-900 mt-0.5">
                      {data.financial.statusCounts.pending}
                    </div>
                  </div>
                  <div className="p-2.5 bg-rose-50/60 border border-rose-100 rounded-lg text-center">
                    <div className="text-xs font-semibold text-rose-800">Overdue</div>
                    <div className="text-base font-bold text-rose-900 mt-0.5">
                      {data.financial.statusCounts.overdue}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE OVERVIEW */}
            <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${currentRole === 'exam_editor' ? 'ring-2 ring-blue-900' : ''}`}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-700 rounded-md">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 font-serif">
                    Academic Performance & Result Overview
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {data.academic.totalEvaluated} Evaluated Candidates
                </span>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <div className="text-[11px] text-blue-700 font-medium">Class Avg</div>
                  <div className="text-lg font-bold text-blue-950 mt-0.5">
                    {data.academic.overallAveragePercentage}%
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                  <div className="text-[11px] text-emerald-700 font-medium">Passed</div>
                  <div className="text-lg font-bold text-emerald-950 mt-0.5">
                    {data.academic.passedCount}
                  </div>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-center">
                  <div className="text-[11px] text-rose-700 font-medium">Compartment/Fail</div>
                  <div className="text-lg font-bold text-rose-950 mt-0.5">
                    {data.academic.failedCount + data.academic.compartmentCount}
                  </div>
                </div>
              </div>

              {/* CBSE 8-Point Grade Distribution */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-700">
                    CBSE 8-Point Grade Spectrum
                  </h3>
                  <span className="text-[11px] text-slate-400">Total: {data.academic.totalEvaluated}</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'].map((grade) => {
                    const count = data.academic.gradeDistribution[grade] || 0;
                    const styling = gradeColors[grade] || {
                      bg: 'bg-slate-50 border-slate-200',
                      text: 'text-slate-700',
                      bar: 'bg-slate-500',
                    };
                    const pct = data.academic.totalEvaluated > 0
                      ? Math.round((count / data.academic.totalEvaluated) * 100)
                      : 0;

                    return (
                      <div
                        key={grade}
                        className={`p-2 rounded-lg border text-center ${styling.bg} flex flex-col justify-between`}
                      >
                        <span className={`text-[11px] font-bold ${styling.text}`}>
                          {grade}
                        </span>
                        <span className="text-sm font-bold text-slate-900 my-0.5">
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-400">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment Type Breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Assessment Categories
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data.academic.examTypeBreakdown).length > 0 ? (
                    Object.entries(data.academic.examTypeBreakdown).map(([type, count]) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <strong className="text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                          {count}
                        </strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">No examination types categorized yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTION: ADMISSIONS & STUDENT DEMOGRAPHICS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ADMISSIONS DESK SUMMARY */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-700 rounded-md">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 font-serif">
                    Admissions Intake & Pipeline
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  {data.admissions.conversionRate}% Conversion Rate
                </span>
              </div>

              {/* Pipeline Progression Blocks */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-center">
                  <div className="text-[11px] font-semibold text-amber-800">Pending</div>
                  <div className="text-base font-bold text-amber-900 mt-0.5">
                    {data.admissions.pending}
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-center">
                  <div className="text-[11px] font-semibold text-blue-800">Contacted</div>
                  <div className="text-base font-bold text-blue-900 mt-0.5">
                    {data.admissions.contacted}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-center">
                  <div className="text-[11px] font-semibold text-emerald-800">Enrolled</div>
                  <div className="text-base font-bold text-emerald-900 mt-0.5">
                    {data.admissions.enrolled}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <div className="text-[11px] font-semibold text-slate-600">Rejected</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {data.admissions.rejected}
                  </div>
                </div>
              </div>

              {/* Grade-wise Application Demand */}
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                  Application Demand by Grade
                </h3>
                {Object.keys(data.admissions.gradeDemand).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(data.admissions.gradeDemand).map(([grade, count]) => (
                      <span
                        key={grade}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                      >
                        <span>{grade}</span>
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    No admission applications registered yet.
                  </div>
                )}
              </div>
            </div>

            {/* STUDENT ENROLLMENT & DEMOGRAPHICS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
                    <Users className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 font-serif">
                    Student Enrollment & Strength Matrix
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {data.enrollment.activeStudents} Active / {data.enrollment.totalStudents} Total
                </span>
              </div>

              {/* Gender Proportions */}
              <div className="mb-5">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Gender Ratio</span>
                  <span className="text-slate-500">
                    M: {data.enrollment.genderDistribution.male} | F: {data.enrollment.genderDistribution.female}
                    {data.enrollment.genderDistribution.other > 0 ? ` | Other: ${data.enrollment.genderDistribution.other}` : ''}
                  </span>
                </div>
                {data.enrollment.totalStudents > 0 ? (
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full"
                      style={{
                        width: `${(data.enrollment.genderDistribution.male / data.enrollment.totalStudents) * 100}%`,
                      }}
                      title={`Male: ${data.enrollment.genderDistribution.male}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{
                        width: `${(data.enrollment.genderDistribution.female / data.enrollment.totalStudents) * 100}%`,
                      }}
                      title={`Female: ${data.enrollment.genderDistribution.female}`}
                    />
                    {data.enrollment.genderDistribution.other > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{
                          width: `${(data.enrollment.genderDistribution.other / data.enrollment.totalStudents) * 100}%`,
                        }}
                        title={`Other: ${data.enrollment.genderDistribution.other}`}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-3 bg-slate-100 rounded-full" />
                )}
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Male ({data.enrollment.totalStudents > 0 ? Math.round((data.enrollment.genderDistribution.male / data.enrollment.totalStudents) * 100) : 0}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Female ({data.enrollment.totalStudents > 0 ? Math.round((data.enrollment.genderDistribution.female / data.enrollment.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>

              {/* Class-wise Student Strength */}
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                  Class-wise Student Distribution
                </h3>
                {Object.keys(data.enrollment.classDistribution).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {Object.entries(data.enrollment.classDistribution).map(([className, count]) => (
                      <div
                        key={className}
                        className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-700 truncate">{className}</span>
                        <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    No class rosters registered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: STUDENT & ENROLLMENT DETAILED TABLE */}
      {activeTab === 'students' && data.detailed && (
        <StudentReportTable
          students={data.detailed.students}
          availableClasses={data.detailed.availableClasses}
          availableSections={data.detailed.availableSections}
          availableSessions={data.availableSessions}
          selectedSession={selectedSession}
          onSessionChange={setSelectedSession}
        />
      )}

      {/* VIEW 3: FEE LEDGER DETAILED TABLE */}
      {activeTab === 'fees' && data.detailed && (
        <FeeReportTable
          fees={data.detailed.fees}
          availableClasses={data.detailed.availableClasses}
          availableSections={data.detailed.availableSections}
          availableSessions={data.availableSessions}
          selectedSession={selectedSession}
          onSessionChange={setSelectedSession}
        />
      )}

      {/* VIEW 4: PAYMENT REGISTER DETAILED TABLE */}
      {activeTab === 'payments' && data.detailed && (
        <PaymentRegisterTable
          payments={data.detailed.payments}
          availableSessions={data.availableSessions}
          selectedSession={selectedSession}
          onSessionChange={setSelectedSession}
        />
      )}

      {/* VIEW 5: ADMISSIONS PIPELINE DETAILED TABLE */}
      {activeTab === 'admissions' && data.detailed && (
        <AdmissionsReportTable inquiries={data.detailed.admissions} />
      )}

      {/* VIEW 6: ACADEMIC & RESULTS DETAILED TABLE */}
      {activeTab === 'academics' && data.detailed && (
        <AcademicReportTable
          academics={data.detailed.academics}
          availableClasses={data.detailed.availableClasses}
          availableSessions={data.availableSessions}
          selectedSession={selectedSession}
          onSessionChange={setSelectedSession}
          userRole={currentRole}
        />
      )}

      {/* VIEW 7: EXAMINATION BROADSHEET MATRIX TABLE */}
      {activeTab === 'broadsheet' && data.detailed && (
        <ExaminationBroadsheetTable
          exams={data.detailed.rawExams}
          results={data.detailed.rawResults}
          students={data.detailed.rawStudents}
          availableClasses={data.detailed.availableClasses}
          availableSections={data.detailed.availableSections}
          availableSessions={data.availableSessions}
          selectedSession={selectedSession}
          onSessionChange={setSelectedSession}
          userRole={currentRole}
        />
      )}
    </div>
  )}
</div>
);
};
