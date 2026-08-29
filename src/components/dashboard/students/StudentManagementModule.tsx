import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit,
  Power,
  RefreshCw,
  Phone,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  UserCheck,
  ShieldCheck,
  Calendar,
  X,
} from 'lucide-react';
import { Student } from '../../../types';
import { studentService } from '../../../services/studentService';
import { StudentFormModal } from './StudentFormModal';
import { StudentDetailModal } from './StudentDetailModal';
import { StudentBulkImportModal } from './StudentBulkImportModal';
import { FileSpreadsheet } from 'lucide-react';
import { formatDateToDisplay } from '../../../utils/dateUtils';

const ALL_CLASSES = [
  'All Classes',
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];

const ALL_SECTIONS = ['All Sections', 'A', 'B', 'C', 'D'];
const ALL_ACADEMIC_YEARS = ['All Years', '2026-2027', '2025-2026', '2024-2025'];
const STATUS_FILTERS = ['All Status', 'Active', 'Inactive'];

export const StudentManagementModule: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err?.message || 'Failed to fetch student directory from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Search Query: Matches Student ID, Admission Number, or Student Name
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesId = (s.studentId || s.id || '').toLowerCase().includes(query);
        const matchesAdm = (s.admissionNumber || '').toLowerCase().includes(query);
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesRoll = (s.rollNumber || '').toLowerCase().includes(query);
        const matchesGuardian = (s.guardianName || '').toLowerCase().includes(query);

        if (!matchesId && !matchesAdm && !matchesName && !matchesRoll && !matchesGuardian) {
          return false;
        }
      }

      // 2. Filter by Class
      if (selectedClass !== 'All Classes' && s.className !== selectedClass) {
        return false;
      }

      // 3. Filter by Section
      if (selectedSection !== 'All Sections' && s.section !== selectedSection) {
        return false;
      }

      // 4. Filter by Academic Year
      if (selectedYear !== 'All Years' && s.academicYear !== selectedYear) {
        return false;
      }

      // 5. Filter by Status
      if (selectedStatus === 'Active' && !s.active) return false;
      if (selectedStatus === 'Inactive' && s.active) return false;

      return true;
    });
  }, [students, searchTerm, selectedClass, selectedSection, selectedYear, selectedStatus]);

  // Metrics
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.active).length;
  const inactiveCount = totalCount - activeCount;
  const classCount = new Set(students.map((s) => s.className)).size;

  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setStudentToEdit(student);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleFormSuccess = (student: Student, isEdit: boolean) => {
    if (isEdit) {
      setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
      setSuccessMessage(`Student ${student.firstName} ${student.lastName} updated successfully.`);
    } else {
      setStudents((prev) => [student, ...prev]);
      setSuccessMessage(`Student ${student.firstName} ${student.lastName} enrolled successfully (Admission No: ${student.admissionNumber}).`);
    }
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleStatusChange = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (selectedStudent && selectedStudent.id === updated.id) {
      setSelectedStudent(updated);
    }
  };

  const handleToggleActiveQuick = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = !student.active;
      await studentService.setStudentActiveStatus(student.id, newStatus);
      handleStatusChange({ ...student, active: newStatus, updatedAt: new Date().toISOString() });
      setSuccessMessage(`Status updated for ${student.firstName}: ${newStatus ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Status toggle failed:', err);
      setError(err?.message || 'Failed to update student active state.');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClass('All Classes');
    setSelectedSection('All Sections');
    setSelectedYear('All Years');
    setSelectedStatus('All Status');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedClass !== 'All Classes' ||
    selectedSection !== 'All Sections' ||
    selectedYear !== 'All Years' ||
    selectedStatus !== 'All Status';

  return (
    <div className="space-y-6">
      {/* Modals */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={studentToEdit}
      />

      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={selectedStudent}
        onEdit={handleOpenEditModal}
        onStatusChange={handleStatusChange}
      />

      <StudentBulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          fetchStudents();
          setSuccessMessage('Bulk student import and provisioning completed successfully.');
          setTimeout(() => setSuccessMessage(null), 6000);
        }}
      />

      {/* Header Banner & CTA */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-900 text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
              Student Master Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enroll new students, batch import cohorts, inspect guardian contacts, and update records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchStudents}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Refresh Student List"
            aria-label="Refresh Student List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-900' : ''}`} />
          </button>
          <button
            id="bulk-import-btn"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-900" />
            Bulk Import (.CSV)
          </button>
          <button
            id="add-student-btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            Enroll New Student
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Enrolled
          </div>
          <div className="text-xl font-bold text-slate-900 font-serif mt-1">
            {totalCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Master Records</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Active Students
          </div>
          <div className="text-xl font-bold text-emerald-700 font-serif mt-1">
            {activeCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Portal Enabled</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
            Inactive / On Leave
          </div>
          <div className="text-xl font-bold text-rose-700 font-serif mt-1">
            {inactiveCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Access Suspended</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            Classes Represented
          </div>
          <div className="text-xl font-bold text-blue-900 font-serif mt-1">
            {classCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Nursery to Class 10</div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="student-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Student ID, Admission No, Student Name, Roll No..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto shrink-0">
            {/* Class */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {/* Section */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              {ALL_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            {/* Academic Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              {ALL_ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary & Clear */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing <strong>{filteredStudents.length}</strong> matching students of{' '}
              <strong>{totalCount}</strong> total records
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-900 font-semibold hover:underline flex items-center gap-1 text-[11px]"
            >
              <X className="w-3 h-3" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto" />
            <p className="text-xs">Loading Student Master Directory from Firestore...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 font-serif">
              {totalCount === 0 ? 'No Students Enrolled Yet' : 'No Students Match Criteria'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {totalCount === 0
                ? 'Get started by adding your first student enrollment record into the Firestore database.'
                : 'Try adjusting your search keywords or resetting the class, section, and status filters.'}
            </p>
            {totalCount === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Enroll First Student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3.5 px-4">Student ID / Adm No.</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class & Sec</th>
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Guardian & Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => handleOpenDetailModal(student)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    {/* ID & Adm */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-950">
                        {student.admissionNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {student.studentId || student.id}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {student.gender} • DOB: {formatDateToDisplay(student.dateOfBirth)}
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {student.className} - {student.section}
                      </span>
                    </td>

                    {/* Roll No */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      #{student.rollNumber}
                    </td>

                    {/* Guardian */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {student.guardianName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        {student.guardianPhone}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          student.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            student.active ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetailModal(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition"
                          title="View Profile"
                          aria-label="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Edit Student"
                          aria-label="Edit Student"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleToggleActiveQuick(student, e)}
                          className={`p-1.5 rounded-lg transition ${
                            student.active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={student.active ? 'Deactivate' : 'Activate'}
                          aria-label={student.active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Total: <strong>{filteredStudents.length}</strong> of {totalCount} students
          </span>
          <span className="text-[11px] text-slate-400">
            Stored securely in Firestore collection <code className="font-mono text-slate-600">/students</code>
          </span>
        </div>
      </div>
    </div>
  );
};
