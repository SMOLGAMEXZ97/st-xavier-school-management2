import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  RefreshCw,
  Download,
  Printer,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Building,
  Calendar,
  X,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Student, GuardianContactRecord } from '../../../types';
import { studentService } from '../../../services/studentService';
import { GuardianDetailModal } from './GuardianDetailModal';
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

/**
 * Normalizes and groups student records by guardian identity (phone or trimmed name).
 * This eliminates duplicates for siblings while displaying all linked students.
 */
function groupStudentsByGuardian(students: Student[]): GuardianContactRecord[] {
  const map = new Map<string, GuardianContactRecord>();

  for (const student of students) {
    const rawName = (student.guardianName || '').trim();
    const rawPhone = (student.guardianPhone || '').trim();
    const cleanDigits = rawPhone.replace(/\D/g, '');

    // Form unique identifier key
    let guardianKey = '';
    if (cleanDigits && cleanDigits.length >= 7) {
      guardianKey = `phone_${cleanDigits}`;
    } else if (rawName) {
      const cleanAddr = (student.address || '').toLowerCase().trim().slice(0, 20);
      guardianKey = `name_${rawName.toLowerCase()}_${cleanAddr}`;
    } else {
      guardianKey = `student_${student.id || student.studentId || student.admissionNumber}`;
    }

    if (!map.has(guardianKey)) {
      map.set(guardianKey, {
        guardianKey,
        guardianName: rawName || 'Guardian of ' + (student.firstName || 'Student'),
        guardianRelationship: student.guardianRelationship || 'Parent / Guardian',
        guardianPhone: rawPhone || '',
        guardianEmail: student.guardianEmail?.trim() || undefined,
        address: student.address || '',
        students: [student],
        studentCount: 1,
      });
    } else {
      const existing = map.get(guardianKey)!;
      existing.students.push(student);
      existing.studentCount = existing.students.length;

      // Merge email if previously missing
      if (!existing.guardianEmail && student.guardianEmail?.trim()) {
        existing.guardianEmail = student.guardianEmail.trim();
      }
      // Pick the more complete address if existing is short
      if ((!existing.address || existing.address.length < 5) && student.address) {
        existing.address = student.address;
      }
      // If guardian name was placeholder, update with non-empty name
      if (rawName && existing.guardianName.startsWith('Guardian of ')) {
        existing.guardianName = rawName;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.guardianName.localeCompare(b.guardianName)
  );
}

export const GuardianDirectoryModule: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Modals & Selection
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianContactRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load students from Firestore
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentService.getAllStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error loading guardians directory:', err);
      setError(err?.message || 'Failed to fetch guardian directory from student records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Grouped Guardian records
  const allGuardians = useMemo(() => {
    return groupStudentsByGuardian(students);
  }, [students]);

  // Filtered Guardians
  const filteredGuardians = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, '');

    return allGuardians.filter((guardian) => {
      // 1. Search filter: matches guardian name, phone, email, or any linked student's name/admission/roll
      if (query) {
        const matchesGuardianName = guardian.guardianName.toLowerCase().includes(query);
        const matchesGuardianPhone = guardian.guardianPhone.toLowerCase().includes(query) ||
          (queryDigits.length >= 3 && guardian.guardianPhone.replace(/\D/g, '').includes(queryDigits));
        const matchesGuardianEmail = (guardian.guardianEmail || '').toLowerCase().includes(query);
        const matchesAddress = guardian.address.toLowerCase().includes(query);

        const matchesAnyStudent = guardian.students.some((s) => {
          const studentFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
          const studentAdm = (s.admissionNumber || '').toLowerCase();
          const studentId = (s.studentId || '').toLowerCase();
          const studentRoll = (s.rollNumber || '').toLowerCase();

          return (
            studentFullName.includes(query) ||
            studentAdm.includes(query) ||
            studentId.includes(query) ||
            studentRoll.includes(query)
          );
        });

        if (!matchesGuardianName && !matchesGuardianPhone && !matchesGuardianEmail && !matchesAddress && !matchesAnyStudent) {
          return false;
        }
      }

      // 2. Class Filter: guardian matches if ANY linked student is in selected class
      if (selectedClass !== 'All Classes') {
        const hasClass = guardian.students.some((s) => s.className === selectedClass);
        if (!hasClass) return false;
      }

      // 3. Section Filter: guardian matches if ANY linked student is in selected section
      if (selectedSection !== 'All Sections') {
        const hasSection = guardian.students.some((s) => s.section === selectedSection);
        if (!hasSection) return false;
      }

      // 4. Academic Year Filter: guardian matches if ANY linked student is in selected year
      if (selectedYear !== 'All Years') {
        const hasYear = guardian.students.some((s) => s.academicYear === selectedYear);
        if (!hasYear) return false;
      }

      // 5. Status Filter: guardian matches if ANY linked student has matching status
      if (selectedStatus !== 'All Status') {
        const isTargetActive = selectedStatus === 'Active';
        const hasStatus = guardian.students.some((s) => (s.active !== false) === isTargetActive);
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [allGuardians, searchTerm, selectedClass, selectedSection, selectedYear, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const totalGuardians = allGuardians.length;
    const totalLinkedStudents = students.length;
    const activeContacts = allGuardians.filter((g) =>
      g.students.some((s) => s.active !== false)
    ).length;
    const withEmail = allGuardians.filter((g) => Boolean(g.guardianEmail?.trim())).length;

    return {
      totalGuardians,
      totalLinkedStudents,
      activeContacts,
      withEmail,
    };
  }, [allGuardians, students]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedClass !== 'All Classes' ||
    selectedSection !== 'All Sections' ||
    selectedYear !== 'All Years' ||
    selectedStatus !== 'All Status';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClass('All Classes');
    setSelectedSection('All Sections');
    setSelectedYear('All Years');
    setSelectedStatus('All Status');
  };

  const handleOpenDetail = (guardian: GuardianContactRecord) => {
    setSelectedGuardian(guardian);
    setIsDetailModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredGuardians.length === 0) return;

    // Headers
    const headers = [
      'Guardian Name',
      'Relationship',
      'Phone Number',
      'Email Address',
      'Residential Address',
      'Total Wards',
      'Student Name(s)',
      'Admission Number(s)',
      'Class & Section(s)',
      'Roll Number(s)',
      'Student Status',
    ];

    // Escape CSV cell value and prevent formula injection
    const escapeCsv = (val: string | number | undefined | null): string => {
      let str = String(val ?? '').trim();
      // Neutralize formula injection
      if (/^[=\+\-@]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredGuardians.map((g) => {
      const studentNames = g.students.map((s) => `${s.firstName || ''} ${s.lastName || ''}`.trim()).join('; ');
      const admissionNos = g.students.map((s) => s.admissionNumber || '—').join('; ');
      const classes = g.students.map((s) => `${s.className || 'Class 1'} - ${s.section || 'A'}`).join('; ');
      const rolls = g.students.map((s) => s.rollNumber || '—').join('; ');
      const statuses = g.students.map((s) => (s.active !== false ? 'Active' : 'Inactive')).join('; ');

      return [
        escapeCsv(g.guardianName),
        escapeCsv(g.guardianRelationship),
        escapeCsv(g.guardianPhone),
        escapeCsv(g.guardianEmail || ''),
        escapeCsv(g.address),
        escapeCsv(g.studentCount),
        escapeCsv(studentNames),
        escapeCsv(admissionNos),
        escapeCsv(classes),
        escapeCsv(rolls),
        escapeCsv(statuses),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `st_xaviers_guardian_directory_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print view
  const handlePrintDirectory = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-blue-900" />
              Guardians & Contacts Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official parent contact directory, emergency alerts registry, and communication desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchStudents}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
              title="Refresh directory from Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isLoading || filteredGuardians.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
              title="Export filtered directory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-900" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrintDirectory}
              disabled={isLoading || filteredGuardians.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              title="Print directory list"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Directory
            </button>
          </div>
        </div>

        {/* METRIC PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Guardian Profiles</span>
            <span className="text-xl font-bold text-slate-900 font-serif mt-0.5 block">
              {stats.totalGuardians}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-medium text-blue-800 block">Linked Students</span>
            <span className="text-xl font-bold text-blue-950 font-serif mt-0.5 block">
              {stats.totalLinkedStudents}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-800 block">Active Student Contacts</span>
            <span className="text-xl font-bold text-emerald-950 font-serif mt-0.5 block">
              {stats.activeContacts}
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-medium text-indigo-800 block">Reachable via Email</span>
            <span className="text-xl font-bold text-indigo-950 font-serif mt-0.5 block">
              {stats.withEmail}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-rose-900 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load guardian directory</p>
              <p className="text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchStudents}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Guardian Name, Student, Admission No, Phone, or Email..."
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* FILTER DROPDOWNS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              {ALL_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === 'All Sections' ? 'All Sections' : `Section ${sec}`}
                </option>
              ))}
            </select>

            {/* Academic Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              {ALL_ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                title="Reset all active search filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* RESULTS COUNT & FILTER STATUS */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800 font-semibold">{filteredGuardians.length}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{allGuardians.length}</strong> guardian contacts
            {hasActiveFilters && ' (filtered)'}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Student Directory Data
          </span>
        </div>
      </div>

      {/* DIRECTORY TABLE / LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-900" />
            <p className="text-xs font-medium">Extracting guardian directory from institutional records...</p>
          </div>
        ) : filteredGuardians.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-serif">No Guardian Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No guardian profiles match your active search terms or filter selection.'
                : 'No student records have been registered in the system yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Guardian Name & Relationship</th>
                  <th className="py-3.5 px-4">Linked Student(s)</th>
                  <th className="py-3.5 px-4">Class & Section</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGuardians.map((guardian) => {
                  const primaryStudent = guardian.students[0];
                  const hasMultipleStudents = guardian.students.length > 1;
                  const isAnyActive = guardian.students.some((s) => s.active !== false);

                  // Phone link
                  const cleanPhone = guardian.guardianPhone.replace(/\s+/g, '');
                  const telLink = cleanPhone ? `tel:${cleanPhone}` : undefined;

                  // WhatsApp
                  const digits = guardian.guardianPhone.replace(/\D/g, '');
                  const waNumber = digits.length === 10 ? `91${digits}` : digits;
                  const waLink = digits.length >= 7 ? `https://wa.me/${waNumber}` : undefined;

                  // Email
                  const emailLink = guardian.guardianEmail ? `mailto:${guardian.guardianEmail.trim()}` : undefined;

                  return (
                    <tr
                      key={guardian.guardianKey}
                      onClick={() => handleOpenDetail(guardian)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Guardian Name & Relationship */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            {guardian.guardianName.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors text-sm">
                              {guardian.guardianName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {guardian.guardianRelationship || 'Parent'}
                              </span>
                              {hasMultipleStudents && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                  {guardian.studentCount} Wards
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Linked Student(s) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {guardian.students.map((s, sIdx) => {
                            const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
                            return (
                              <div key={s.id || s.studentId || sIdx} className="text-xs">
                                <span className="font-semibold text-slate-900">{name}</span>
                                <span className="text-slate-400 ml-1.5 text-[11px]">
                                  ({s.admissionNumber || s.rollNumber || '—'})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {guardian.students.map((s, sIdx) => (
                            <div key={s.id || s.studentId || sIdx} className="font-medium text-slate-800">
                              {s.className || 'Class 1'} - {s.section || 'A'}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Phone / Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {guardian.guardianPhone ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="font-semibold text-slate-800 font-mono tracking-tight">
                              {guardian.guardianPhone}
                            </span>
                            {telLink && (
                              <a
                                href={telLink}
                                className="p-1 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                title={`Call ${guardian.guardianPhone}`}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                title="Open WhatsApp Chat"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Provided</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        {guardian.guardianEmail ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-slate-700 truncate max-w-[160px]">
                              {guardian.guardianEmail}
                            </span>
                            {emailLink && (
                              <a
                                href={emailLink}
                                className="p-1 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0"
                                title={`Send Email to ${guardian.guardianEmail}`}
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None on file</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4">
                        <span
                          className="text-slate-600 truncate max-w-[180px] block"
                          title={guardian.address || 'No address'}
                        >
                          {guardian.address || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isAnyActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAnyActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isAnyActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(guardian)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="View Complete Guardian Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GUARDIAN DETAIL MODAL */}
      <GuardianDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGuardian(null);
        }}
        guardian={selectedGuardian}
      />
    </div>
  );
};
