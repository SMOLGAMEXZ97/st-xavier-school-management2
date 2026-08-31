import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  Globe,
  Lock,
  Eye,
  BookOpen,
  Users,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Exam, ExamResult, Student, ExamStatus } from '../../../types';
import { examService } from '../../../services/examService';
import { studentService } from '../../../services/studentService';
import { useAuth } from '../../../context/AuthContext';
import { EXAM_TYPE_LABELS, calculateGrade } from '../../../utils/gradeUtils';
import { formatDateToDisplay } from '../../../utils/dateUtils';
import { CreateExamModal } from './CreateExamModal';
import { MarksEntryModal } from './MarksEntryModal';
import { ExamAnalyticsView } from './ExamAnalyticsView';
import { ReportCardModal } from './ReportCardModal';

const CLASS_FILTERS = [
  'All Classes',
  'Class 10',
  'Class 9',
  'Class 8',
  'Class 7',
  'Class 6',
  'Class 5',
  'Class 4',
  'Class 3',
  'Class 2',
  'Class 1',
  'UKG',
  'LKG',
  'Nursery',
];

const ACADEMIC_YEAR_FILTERS = ['All Sessions', '2026-2027', '2025-2026', '2024-2025'];
const STATUS_FILTERS = ['All Statuses', 'draft', 'scheduled', 'ongoing', 'completed', 'published'];

export const ExaminationManagementModule: React.FC = () => {
  const { role, userProfile } = useAuth();
  const userRole = role || userProfile?.role || 'staff';

  const canManageExams = userRole === 'super_admin' || userRole === 'exam_editor' || userRole === 'staff';
  const canPublish = userRole === 'super_admin' || userRole === 'exam_editor';

  const [activeTab, setActiveTab] = useState<'schedules' | 'results'>('schedules');
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All Sessions');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedExamFilter, setSelectedExamFilter] = useState('All Exams');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [activeMarksExam, setActiveMarksExam] = useState<Exam | null>(null);
  const [activeAnalyticsExam, setActiveAnalyticsExam] = useState<Exam | null>(null);
  const [activeReportCard, setActiveReportCard] = useState<{ result: ExamResult; exam?: Exam; student?: Student } | null>(null);
  const [deleteConfirmExamId, setDeleteConfirmExamId] = useState<string | null>(null);
  const [publishConfirmExam, setPublishConfirmExam] = useState<Exam | null>(null);

  // Load all data
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [fetchedExams, fetchedStudents, fetchedResults] = await Promise.all([
        examService.getAllExams(),
        studentService.getAllStudents(),
        examService.getAllResults(),
      ]);

      setExams(fetchedExams || []);
      setStudents(fetchedStudents || []);
      setResults(fetchedResults || []);
    } catch (err: any) {
      console.error('Error loading examinations data:', err);
      setNotification({
        type: 'error',
        message: 'Failed to load examinations data. Please verify your connection.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveExam = async (examData: Omit<Exam, 'id'>, examId?: string) => {
    try {
      if (examId) {
        await examService.updateExam(examId, examData);
        setNotification({ type: 'success', message: 'Examination schedule updated successfully.' });
      } else {
        await examService.createExam(examData);
        setNotification({ type: 'success', message: 'New examination schedule created successfully.' });
      }
      setShowCreateModal(false);
      setExamToEdit(null);
      await loadData(true);
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to save examination.');
    }
  };

  const handleTogglePublish = (examItem: Exam) => {
    if (!canPublish) {
      setNotification({
        type: 'error',
        message: 'Only Super Admin or Examination Controllers can publish or unpublish official results.',
      });
      return;
    }
    setPublishConfirmExam(examItem);
  };

  const executeTogglePublish = async (examItem: Exam) => {
    const nextPublished = examItem.status !== 'published';
    try {
      await examService.publishExam(examItem.id, nextPublished);
      setNotification({
        type: 'success',
        message: nextPublished
          ? `Results for "${examItem.name}" have been published to the student portal!`
          : `Results for "${examItem.name}" reverted to draft status.`,
      });
      setPublishConfirmExam(null);
      await loadData(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to update publication status.' });
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await examService.deleteExam(examId);
      setDeleteConfirmExamId(null);
      setNotification({ type: 'success', message: 'Examination schedule deleted successfully.' });
      await loadData(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to delete examination schedule.' });
    }
  };

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalExams = exams.length;
    const ongoingCount = exams.filter((e) => e.status === 'ongoing' || e.status === 'scheduled').length;
    const completedCount = exams.filter((e) => e.status === 'completed').length;
    const publishedCount = exams.filter((e) => e.status === 'published').length;
    const totalResults = results.length;

    return {
      totalExams,
      ongoingCount,
      completedCount,
      publishedCount,
      totalResults,
    };
  }, [exams, results]);

  // Student Map
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.studentId || s.id, s));
    return map;
  }, [students]);

  // Exam Map
  const examMap = useMemo(() => {
    const map = new Map<string, Exam>();
    exams.forEach((e) => map.set(e.id, e));
    return map;
  }, [exams]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (e.name || '').toLowerCase().includes(q);
        const matchClass = (e.className || '').toLowerCase().includes(q);
        if (!matchName && !matchClass) return false;
      }
      // Academic year
      if (selectedAcademicYear !== 'All Sessions' && e.academicYear !== selectedAcademicYear) {
        return false;
      }
      // Class
      if (selectedClass !== 'All Classes' && e.className !== selectedClass) {
        return false;
      }
      // Status
      if (selectedStatus !== 'All Statuses' && e.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [exams, searchQuery, selectedAcademicYear, selectedClass, selectedStatus]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const st = studentMap.get(r.studentId);
      const studentName = (r.studentName || `${st?.firstName} ${st?.lastName}` || '').toLowerCase();
      const adm = (r.admissionNumber || st?.admissionNumber || '').toLowerCase();
      const roll = (r.rollNumber || st?.rollNumber || '').toLowerCase();

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!studentName.includes(q) && !adm.includes(q) && !roll.includes(q) && !(r.examName || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      // Exam Filter
      if (selectedExamFilter !== 'All Exams' && r.examId !== selectedExamFilter) {
        return false;
      }
      // Class
      if (selectedClass !== 'All Classes') {
        const cls = r.className || st?.className;
        if (cls !== selectedClass) return false;
      }
      // Academic Year
      if (selectedAcademicYear !== 'All Sessions') {
        const yr = r.academicYear || st?.academicYear;
        if (yr !== selectedAcademicYear) return false;
      }
      return true;
    });
  }, [results, studentMap, searchQuery, selectedExamFilter, selectedClass, selectedAcademicYear]);

  return (
    <div id="examination-management-module" className="space-y-6">
      {/* Module Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-900 text-amber-400 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
                Examinations & Results Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Assessment scheduling, subject mark entry, CBSE grade calculation, and report card publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="refresh-exams-btn"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh examination records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-900' : ''}`} />
          </button>

          {canManageExams && (
            <button
              id="create-exam-btn"
              onClick={() => {
                setExamToEdit(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Examination</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            &times;
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Exams
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {metrics.totalExams}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Assessment schedules</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            Scheduled / Active
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
            {metrics.ongoingCount}
          </div>
          <div className="text-[10px] text-indigo-500 mt-0.5">Ongoing evaluations</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
            Completed (Draft)
          </div>
          <div className="text-2xl font-black font-mono text-amber-700 mt-1">
            {metrics.completedCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">Evaluation ready</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Published Terms
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {metrics.publishedCount}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Live on Student Portal</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
            Evaluated Scores
          </div>
          <div className="text-2xl font-black font-mono text-blue-950 mt-1">
            {metrics.totalResults}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Individual scorecards</div>
        </div>
      </div>

      {/* Sub-Tabs: Exams Schedule vs Master Marksheets */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Examinations & Schedules ({exams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'results'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Student Scorecards & Master Directory ({results.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'schedules'
                ? 'Search exams by title or class...'
                : 'Search scorecards by student name, roll no, admission no...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Exam Filter (Results Tab Only) */}
          {activeTab === 'results' && (
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium max-w-44 truncate"
            >
              <option value="All Exams">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          )}

          {/* Academic Session */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium"
          >
            {ACADEMIC_YEAR_FILTERS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium"
          >
            {CLASS_FILTERS.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Status Filter (Schedules Tab Only) */}
          {activeTab === 'schedules' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium capitalize"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* =========================================================================
         TAB 1: EXAMINATIONS & SCHEDULES LIST
         ========================================================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 animate-bounce text-blue-900" />
              <p className="text-xs font-semibold">Loading examinations schedule...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 font-serif">No Examination Schedules Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedClass !== 'All Classes' || selectedStatus !== 'All Statuses'
                  ? 'No examinations match the active search and filter criteria.'
                  : 'Start by creating your first institutional examination schedule.'}
              </p>
              {canManageExams && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Examination
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map((examItem) => {
                const typeConfig = EXAM_TYPE_LABELS[examItem.examType || 'half_yearly'] || EXAM_TYPE_LABELS.half_yearly;
                const subjectCount = examItem.subjects?.length || 0;
                const examResultCount = results.filter((r) => r.examId === examItem.id).length;

                return (
                  <div
                    key={examItem.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Header & Status Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeConfig.badgeColor}`}>
                              {typeConfig.label}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {examItem.academicYear}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 font-serif mt-1.5">
                            {examItem.name}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {examItem.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                              <Globe className="w-3 h-3" />
                              Published
                            </span>
                          ) : examItem.status === 'ongoing' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                              Ongoing
                            </span>
                          ) : examItem.status === 'scheduled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                              Scheduled
                            </span>
                          ) : examItem.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                              <Lock className="w-3 h-3" />
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Division & Details Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-50 text-xs border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Class / Division</span>
                          <span className="font-bold text-slate-800">
                            {examItem.className} {examItem.section !== 'All' ? `(${examItem.section})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Subject Syllabus</span>
                          <span className="font-bold text-slate-800">
                            {subjectCount} Subjects ({examItem.totalMaxMarks || 600}M)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Evaluated Students</span>
                          <span className="font-bold text-blue-900 font-mono">
                            {examResultCount} Students
                          </span>
                        </div>
                      </div>

                      {/* Date details */}
                      {(examItem.startDate || examItem.resultDate) && (
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 font-medium">
                          {examItem.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Begins: {formatDateToDisplay(examItem.startDate)}
                            </span>
                          )}
                          {examItem.resultDate && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              Results: {formatDateToDisplay(examItem.resultDate)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {canManageExams && (
                          <button
                            id={`enter-marks-btn-${examItem.id}`}
                            onClick={() => setActiveMarksExam(examItem)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Enter / Edit Marks</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveAnalyticsExam(examItem)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-blue-900" />
                          <span>Analytics</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {canPublish && (
                          <button
                            onClick={() => handleTogglePublish(examItem)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                              examItem.status === 'published'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={examItem.status === 'published' ? 'Unpublish Results' : 'Publish Results to Portal'}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canManageExams && (
                          <button
                            onClick={() => {
                              setExamToEdit(examItem);
                              setShowCreateModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Exam Schedule"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {userRole === 'super_admin' && (
                          <button
                            onClick={() => setDeleteConfirmExamId(examItem.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         TAB 2: MASTER RESULTS & STUDENT SCORECARDS DIRECTORY
         ========================================================================= */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif">
                Master Examination Scorecards Register
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Showing {filteredResults.length} student marksheet records.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Student Particulars</th>
                  <th className="py-3 px-3.5">Examination</th>
                  <th className="py-3 px-3.5 text-center">Class / Div</th>
                  <th className="py-3 px-3.5 text-center">Total Marks</th>
                  <th className="py-3 px-3.5 text-center">% Score</th>
                  <th className="py-3 px-3.5 text-center">Grade</th>
                  <th className="py-3 px-3.5 text-center">Result Status</th>
                  <th className="py-3 px-3.5 text-center">Visibility</th>
                  <th className="py-3 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-900" />
                      Loading scorecards database...
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                      No scorecards found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((resultItem) => {
                    const st = studentMap.get(resultItem.studentId);
                    const ex = examMap.get(resultItem.examId);
                    const isPassed = resultItem.resultStatus === 'passed' || (!resultItem.resultStatus && resultItem.percentage >= 33);

                    return (
                      <tr key={resultItem.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-xs">
                            {resultItem.studentName || `${st?.firstName} ${st?.lastName}`.trim()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Adm: {resultItem.admissionNumber || st?.admissionNumber || '-'} • Roll: {resultItem.rollNumber || st?.rollNumber || '-'}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">
                            {resultItem.examName || ex?.name || 'Examination'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {resultItem.academicYear || ex?.academicYear || '2025-2026'}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-slate-700">
                            {resultItem.className || st?.className || '-'}
                          </span>
                        </td>

                        <td className="p-3.5 text-center font-mono font-black text-slate-900">
                          {resultItem.totalMarks} / {resultItem.totalMaxMarks || (Object.keys(resultItem.subjects || {}).length * 100)}
                        </td>

                        <td className="p-3.5 text-center font-mono font-bold text-blue-950">
                          {resultItem.percentage?.toFixed(1)}%
                        </td>

                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                            {resultItem.grade || calculateGrade(resultItem.percentage || 0).grade}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : resultItem.resultStatus === 'compartment'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {resultItem.resultStatus || (isPassed ? 'PASSED' : 'FAILED')}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {resultItem.published ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Globe className="w-2.5 h-2.5" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <Lock className="w-2.5 h-2.5" />
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReportCard({
                                result: resultItem,
                                exam: ex,
                                student: st,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      {deleteConfirmExamId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Delete Examination Schedule?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently remove the examination and all associated student marksheet entries from Firestore. This action cannot be reversed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmExamId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExam(deleteConfirmExamId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Yes, Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish / Unpublish Confirmation Modal */}
      {publishConfirmExam && (
        <div
          id="publish-confirm-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 mx-auto flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {publishConfirmExam.status === 'published' ? 'Revert Results to Draft?' : 'Publish Examination Results?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {publishConfirmExam.status === 'published'
                  ? `Students and parents will no longer be able to view report cards or marks for "${publishConfirmExam.name}" on the student portal.`
                  : `This will make official scorecards and grades for "${publishConfirmExam.name}" immediately viewable and printable by students in Class ${publishConfirmExam.className}.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPublishConfirmExam(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeTogglePublish(publishConfirmExam)}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer shadow-sm ${
                  publishConfirmExam.status === 'published'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                {publishConfirmExam.status === 'published' ? 'Revert to Draft' : 'Yes, Publish to Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {showCreateModal && (
        <CreateExamModal
          examToEdit={examToEdit}
          onSave={handleSaveExam}
          onClose={() => {
            setShowCreateModal(false);
            setExamToEdit(null);
          }}
        />
      )}

      {/* Marks Entry Modal */}
      {activeMarksExam && (
        <MarksEntryModal
          exam={activeMarksExam}
          students={students}
          onClose={() => setActiveMarksExam(null)}
          onResultsSaved={() => loadData(true)}
        />
      )}

      {/* Exam Analytics Modal */}
      {activeAnalyticsExam && (
        <ExamAnalyticsView
          exam={activeAnalyticsExam}
          students={students}
          onClose={() => setActiveAnalyticsExam(null)}
        />
      )}

      {/* Official Report Card Printable Modal */}
      {activeReportCard && (
        <ReportCardModal
          result={activeReportCard.result}
          exam={activeReportCard.exam}
          student={activeReportCard.student}
          onClose={() => setActiveReportCard(null)}
        />
      )}
    </div>
  );
};
