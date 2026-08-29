import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  UserCheck,
  Building,
  FileText,
  Inbox,
  Send,
} from 'lucide-react';
import { AdmissionInquiry, ContactMessage, Student } from '../../../types';
import { inquiryService, contactService } from '../../../services/inquiryService';
import { InquiryDetailModal } from './InquiryDetailModal';
import { ContactMessageDetailModal } from './ContactMessageDetailModal';
import { StudentFormModal } from '../students/StudentFormModal';

const STATUS_FILTERS = ['All Statuses', 'Pending', 'Contacted', 'Enrolled', 'Rejected'];

const CLASS_FILTERS = [
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

export const AdmissionsDeskModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inquiries' | 'messages'>('inquiries');

  // Inquiries State
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);

  // Contact Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Filters for Inquiries
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedClass, setSelectedClass] = useState('All Classes');

  // Filters for Messages
  const [messageSearchTerm, setMessageSearchTerm] = useState('');

  // Modals
  const [selectedInquiry, setSelectedInquiry] = useState<AdmissionInquiry | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Student Enrollment Conversion Modal
  const [isStudentFormModalOpen, setIsStudentFormModalOpen] = useState(false);
  const [studentFormInitialData, setStudentFormInitialData] = useState<Partial<Student> | null>(null);
  const [convertingInquiry, setConvertingInquiry] = useState<AdmissionInquiry | null>(null);

  // Global Action Feedback
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [actionErrorBanner, setActionErrorBanner] = useState<string | null>(null);

  // Fetch Inquiries
  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    setInquiriesError(null);
    try {
      const data = await inquiryService.getAllInquiries();
      setInquiries(data || []);
    } catch (err: any) {
      console.error('Error fetching inquiries:', err);
      setInquiriesError(err?.message || 'Failed to load admission inquiries.');
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  // Fetch Messages
  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const data = await contactService.getAllContactMessages();
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching contact messages:', err);
      setMessagesError(err?.message || 'Failed to load contact messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'messages' && messages.length === 0 && !isLoadingMessages) {
      fetchMessages();
    }
  }, [activeSubTab]);

  // Quick auto-dismiss for success banners
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  // Filter Inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const studentMatch = (inq.studentName || '').toLowerCase().includes(query);
        const parentMatch = (inq.parentName || '').toLowerCase().includes(query);
        const phoneMatch = (inq.phone || '').toLowerCase().includes(query);
        const emailMatch = (inq.email || '').toLowerCase().includes(query);
        const gradeMatch = (inq.gradeApplying || '').toLowerCase().includes(query);
        if (!studentMatch && !parentMatch && !phoneMatch && !emailMatch && !gradeMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (selectedStatus !== 'All Statuses') {
        const currentStatus = (inq.status || 'pending').toLowerCase();
        if (currentStatus !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 3. Class Filter
      if (selectedClass !== 'All Classes') {
        const inqClass = (inq.gradeApplying || '').toLowerCase();
        const filterClass = selectedClass.toLowerCase();
        if (!inqClass.includes(filterClass)) {
          return false;
        }
      }

      return true;
    });
  }, [inquiries, searchTerm, selectedStatus, selectedClass]);

  // Filter Messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (!messageSearchTerm.trim()) return true;
      const query = messageSearchTerm.trim().toLowerCase();
      const nameMatch = (msg.name || '').toLowerCase().includes(query);
      const emailMatch = (msg.email || '').toLowerCase().includes(query);
      const phoneMatch = (msg.phone || '').toLowerCase().includes(query);
      const subjectMatch = (msg.subject || '').toLowerCase().includes(query);
      const messageMatch = (msg.message || '').toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || subjectMatch || messageMatch;
    });
  }, [messages, messageSearchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const pending = inquiries.filter((i) => !i.status || i.status === 'pending').length;
    const contacted = inquiries.filter((i) => i.status === 'contacted').length;
    const enrolled = inquiries.filter((i) => i.status === 'enrolled').length;
    return { total, pending, contacted, enrolled };
  }, [inquiries]);

  // Modal Open Handlers
  const handleOpenInquiry = (inq: AdmissionInquiry) => {
    setSelectedInquiry(inq);
    setIsInquiryModalOpen(true);
  };

  const handleOpenMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setIsMessageModalOpen(true);
  };

  // Convert Inquiry to Student
  const handleInitiateConversion = (inq: AdmissionInquiry) => {
    // Close detail modal if open
    setIsInquiryModalOpen(false);

    // Split student name cleanly
    const parts = (inq.studentName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '-';

    // Normalize class name to match standard CLASS_OPTIONS
    let normalizedClass = 'Class 1';
    if (inq.gradeApplying) {
      const match = CLASS_FILTERS.find(
        (c) => c !== 'All Classes' && inq.gradeApplying.toLowerCase().includes(c.toLowerCase())
      );
      if (match) {
        normalizedClass = match;
      }
    }

    const prefilledData: Partial<Student> = {
      firstName,
      lastName,
      dateOfBirth: inq.dateOfBirth || '',
      gender: inq.gender === 'Female' ? 'Female' : inq.gender === 'Other' ? 'Other' : 'Male',
      className: normalizedClass,
      section: 'A',
      guardianName: inq.parentName || '',
      guardianRelationship: 'Father',
      guardianPhone: inq.phone || '',
      guardianEmail: inq.email || '',
      address: inq.address || '',
      previousSchool: inq.previousSchool || '',
      academicYear: '2026-2027',
      admissionDate: new Date().toISOString().split('T')[0],
      active: true,
    };

    setConvertingInquiry(inq);
    setStudentFormInitialData(prefilledData);
    setIsStudentFormModalOpen(true);
  };

  // Handle successful student enrollment from conversion
  const handleConversionSuccess = async (createdStudent: Student) => {
    setIsStudentFormModalOpen(false);

    if (convertingInquiry?.id) {
      try {
        const noteMessage = `[Enrolled on ${new Date().toLocaleDateString('en-IN')}] Student ID: ${createdStudent.studentId}, Admission No: ${createdStudent.admissionNumber}. ${convertingInquiry.notes || ''}`.trim();
        await inquiryService.updateInquiryStatus(convertingInquiry.id, 'enrolled', noteMessage);

        setInquiries((prev) =>
          prev.map((i) =>
            i.id === convertingInquiry.id
              ? { ...i, status: 'enrolled', notes: noteMessage, updatedAt: new Date().toISOString() }
              : i
          )
        );

        setSuccessBanner(
          `Student "${createdStudent.firstName} ${createdStudent.lastName}" successfully enrolled (ID: ${createdStudent.studentId}) and admission application marked as Enrolled!`
        );
      } catch (err: any) {
        console.error('Error updating inquiry status after conversion:', err);
        setSuccessBanner(
          `Student "${createdStudent.firstName} ${createdStudent.lastName}" enrolled in database, but failed to auto-update inquiry status.`
        );
      } finally {
        setConvertingInquiry(null);
        setStudentFormInitialData(null);
      }
    } else {
      setSuccessBanner(`Student record created successfully.`);
    }
  };

  // Inquiry Status Updated Callback
  const handleInquiryStatusUpdated = (updated: AdmissionInquiry) => {
    setInquiries((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (selectedInquiry?.id === updated.id) {
      setSelectedInquiry(updated);
    }
  };

  // Inquiry Deleted Callback
  const handleInquiryDeleted = (id: string) => {
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    setSuccessBanner('Admission inquiry deleted successfully.');
  };

  // Message Deleted Callback
  const handleMessageDeleted = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSuccessBanner('Contact message deleted successfully.');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'enrolled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Enrolled
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Contacted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <InquiryDetailModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        inquiry={selectedInquiry}
        onStatusUpdate={handleInquiryStatusUpdated}
        onDelete={handleInquiryDeleted}
        onConvertToStudent={handleInitiateConversion}
      />

      <ContactMessageDetailModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        message={selectedMessage}
        onDelete={handleMessageDeleted}
      />

      <StudentFormModal
        isOpen={isStudentFormModalOpen}
        onClose={() => {
          setIsStudentFormModalOpen(false);
          setConvertingInquiry(null);
          setStudentFormInitialData(null);
        }}
        onSuccess={handleConversionSuccess}
        initialData={studentFormInitialData}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-900" />
              Admissions Desk & Prospective Student Leads
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review incoming student applications from public portal, record follow-ups, and convert verified applicants to enrolled students.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-admissions-btn"
              onClick={activeSubTab === 'inquiries' ? fetchInquiries : fetchMessages}
              disabled={isLoadingInquiries || isLoadingMessages}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-300 disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingInquiries || isLoadingMessages ? 'animate-spin' : ''
                }`}
              />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Success & Error Banners */}
        {successBanner && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionErrorBanner && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{actionErrorBanner}</span>
            </div>
            <button
              onClick={() => setActionErrorBanner(null)}
              className="text-rose-700 hover:text-rose-900 text-xs font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Sub-navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            id="tab-inquiries-btn"
            onClick={() => setActiveSubTab('inquiries')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeSubTab === 'inquiries'
                ? 'border-blue-900 text-blue-900 font-serif text-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Admission Applications
            <span
              className={`ml-1 px-2 py-0.5 text-[10px] rounded-full font-bold ${
                metrics.pending > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metrics.pending} pending / {metrics.total} total
            </span>
          </button>

          <button
            id="tab-messages-btn"
            onClick={() => setActiveSubTab('messages')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeSubTab === 'messages'
                ? 'border-blue-900 text-blue-900 font-serif text-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            General Contact Messages
            <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
              {messages.length}
            </span>
          </button>
        </div>

        {/* TAB 1: ADMISSION APPLICATIONS */}
        {activeSubTab === 'inquiries' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Applications
                </span>
                <span className="text-xl font-bold font-serif text-slate-900 mt-1 block">
                  {metrics.total}
                </span>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Pending Review
                </span>
                <span className="text-xl font-bold font-serif text-amber-900 mt-1 block">
                  {metrics.pending}
                </span>
              </div>

              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Contacted / In Progress
                </span>
                <span className="text-xl font-bold font-serif text-blue-900 mt-1 block">
                  {metrics.contacted}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Enrolled Students
                </span>
                <span className="text-xl font-bold font-serif text-emerald-900 mt-1 block">
                  {metrics.enrolled}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="inquiry-search-input"
                  type="text"
                  placeholder="Search applicant name, parent name, phone, or grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  id="status-filter-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none font-medium"
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  id="class-filter-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none font-medium"
                >
                  {CLASS_FILTERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inquiries Error State */}
            {inquiriesError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{inquiriesError}</span>
                </div>
                <button
                  onClick={fetchInquiries}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingInquiries ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto" />
                <p className="text-xs font-medium">Fetching admission inquiries from Firestore...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              /* Empty State */
              <div className="py-14 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">
                  {inquiries.length === 0
                    ? 'No Admission Inquiries Found'
                    : 'No Inquiries Match Your Filters'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {inquiries.length === 0
                    ? 'When prospective parents submit the public admission form, their applications will appear here in real-time.'
                    : 'Try clearing your search query or selecting "All Statuses" and "All Classes".'}
                </p>
                {inquiries.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatus('All Statuses');
                      setSelectedClass('All Classes');
                    }}
                    className="mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              /* Inquiries Data Table */
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Applicant / Student</th>
                      <th className="py-3 px-4">Class Applying</th>
                      <th className="py-3 px-4">Parent / Guardian</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredInquiries.map((inq) => (
                      <tr
                        key={inq.id || `${inq.studentName}-${inq.phone}`}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Student Name */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="text-blue-950 font-serif text-sm">
                              {inq.studentName}
                            </span>
                            {inq.notes && (
                              <span
                                title="Has internal follow-up notes"
                                className="p-0.5 rounded bg-blue-100 text-blue-800"
                              >
                                <FileText className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            DOB: {inq.dateOfBirth || 'N/A'} • {inq.gender || 'N/A'}
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {inq.gradeApplying}
                          </span>
                        </td>

                        {/* Parent */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{inq.parentName}</div>
                          {inq.email && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={inq.email}>
                              {inq.email}
                            </div>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4">
                          <a
                            href={`tel:${inq.phone}`}
                            className="font-medium text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {inq.phone}
                          </a>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3 px-4 text-slate-600">
                          {inq.createdAt
                            ? new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">{getStatusBadge(inq.status)}</td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenInquiry(inq)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition"
                              title="View Full Application Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleInitiateConversion(inq)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                              title="Convert Application to Enrolled Student"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GENERAL CONTACT MESSAGES */}
        {activeSubTab === 'messages' && (
          <div className="space-y-6">
            {/* Search Bar for Messages */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="message-search-input"
                  type="text"
                  placeholder="Search sender name, email, phone, subject, or message text..."
                  value={messageSearchTerm}
                  onChange={(e) => setMessageSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Messages Error State */}
            {messagesError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{messagesError}</span>
                </div>
                <button
                  onClick={fetchMessages}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingMessages ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto" />
                <p className="text-xs font-medium">Loading contact messages from Firestore...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              /* Empty State */
              <div className="py-14 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">
                  {messages.length === 0 ? 'No Contact Messages Found' : 'No Messages Match Search'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {messages.length === 0
                    ? 'General inquiries submitted via the Contact Us section on the website will be listed here.'
                    : 'Try adjusting your search keywords.'}
                </p>
              </div>
            ) : (
              /* Messages List / Table */
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Sender</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Message Preview</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredMessages.map((msg) => (
                      <tr key={msg.id || `${msg.name}-${msg.createdAt}`} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{msg.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${msg.phone}`}
                              className="text-blue-700 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              {msg.phone}
                            </a>
                            {msg.email && (
                              <span className="truncate max-w-[120px]" title={msg.email}>
                                • {msg.email}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {msg.subject}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={msg.message}>
                          {msg.message}
                        </td>

                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenMessage(msg)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Read
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
