import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Users,
  FileText,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Notice, NoticeCategory, NoticeStatus } from '../../../types';
import { noticeService } from '../../../services/noticeService';
import { useAuth } from '../../../context/AuthContext';
import { NoticeFormModal } from './NoticeFormModal';
import { NoticeDetailModal } from './NoticeDetailModal';
import { DeleteNoticeModal } from './DeleteNoticeModal';
import { formatDateToDisplay } from '../../../utils/dateUtils';

const CATEGORIES: ('All' | NoticeCategory)[] = [
  'All',
  'Academics',
  'Examinations',
  'Events',
  'Holidays',
  'Circulars',
  'General',
];

export const NoticeManagementModule: React.FC = () => {
  const { userProfile } = useAuth();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | NoticeCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [detailModalNotice, setDetailModalNotice] = useState<Notice | null>(null);
  const [deleteModalNotice, setDeleteModalNotice] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Subscribe to real-time administrative notices
  useEffect(() => {
    setLoading(true);
    const unsubscribe = noticeService.subscribeToAllNotices(
      (data) => {
        setNotices(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter and sort notices
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.targetAudience && n.targetAudience.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || n.category === selectedCategory;

    const noticeStatus = n.status || 'published';
    const matchesStatus =
      selectedStatus === 'all' || noticeStatus === selectedStatus;

    const matchesUrgent = !showUrgentOnly || Boolean(n.isUrgent);

    return matchesSearch && matchesCategory && matchesStatus && matchesUrgent;
  });

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    // Priority for Urgent notices, then date
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;

    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();

    if (sortOrder === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  // Calculate statistics
  const totalNotices = notices.length;
  const publishedCount = notices.filter((n) => (n.status || 'published') === 'published').length;
  const draftCount = notices.filter((n) => n.status === 'draft').length;
  const urgentCount = notices.filter((n) => n.isUrgent).length;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorBanner(msg);
      setTimeout(() => setErrorBanner(null), 5000);
    } else {
      setSuccessBanner(msg);
      setTimeout(() => setSuccessBanner(null), 4000);
    }
  };

  // CRUD Handlers
  const handleOpenCreate = () => {
    setNoticeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setNoticeToEdit(notice);
    setIsFormModalOpen(true);
  };

  const handleSaveNotice = async (
    formData: Omit<Notice, 'id'>,
    existingId?: string
  ) => {
    setIsSaving(true);
    try {
      if (existingId) {
        await noticeService.updateNotice(existingId, formData);
        showNotification(`Notice "${formData.title}" updated successfully.`);
      } else {
        await noticeService.createNotice(formData, userProfile?.email);
        showNotification(
          `Notice "${formData.title}" ${
            formData.status === 'draft' ? 'saved as draft' : 'published to notice board'
          } successfully.`
        );
      }
      setIsFormModalOpen(false);
      setNoticeToEdit(null);
    } catch (err: any) {
      console.error('Error saving notice:', err);
      throw err; // propagates to NoticeFormModal for inline feedback
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (notice: Notice) => {
    try {
      const currentStatus = notice.status || 'published';
      const newStatus = await noticeService.togglePublishStatus(notice.id, currentStatus);
      showNotification(
        `Notice "${notice.title}" is now ${newStatus === 'published' ? 'Published' : 'moved to Drafts'}.`
      );
      if (detailModalNotice?.id === notice.id) {
        setDetailModalNotice((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      showNotification(`Failed to update publish status: ${err.message}`, true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalNotice) return;
    setIsDeleting(true);
    try {
      await noticeService.deleteNotice(deleteModalNotice.id);
      showNotification(`Notice "${deleteModalNotice.title}" deleted.`);
      setDeleteModalNotice(null);
      if (detailModalNotice?.id === deleteModalNotice.id) {
        setDetailModalNotice(null);
      }
    } catch (err: any) {
      showNotification(`Failed to delete notice: ${err.message}`, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Examinations':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'Academics':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Events':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Holidays':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Circulars':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'General':
      default:
        return 'bg-sky-100 text-sky-900 border-sky-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Modals */}
      <NoticeFormModal
        isOpen={isFormModalOpen}
        noticeToEdit={noticeToEdit}
        isSaving={isSaving}
        onSave={handleSaveNotice}
        onClose={() => {
          setIsFormModalOpen(false);
          setNoticeToEdit(null);
        }}
      />

      <NoticeDetailModal
        isOpen={Boolean(detailModalNotice)}
        notice={detailModalNotice}
        onClose={() => setDetailModalNotice(null)}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      <DeleteNoticeModal
        isOpen={Boolean(deleteModalNotice)}
        notice={deleteModalNotice}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalNotice(null)}
      />

      {/* Header Banner & Action Button */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
              Notice Board Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Publish academic circulars, exam schedules, and holiday announcements with live synchronization.
          </p>
        </div>

        <button
          id="create-notice-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notice</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-rose-700 hover:text-rose-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Notices
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-1">
            {totalNotices}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">All active records</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Published
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-900 mt-1">
            {publishedCount}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Visible on portal & web</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Drafts
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-amber-900 mt-1">
            {draftCount}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Unpublished previews</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Urgent Circulars
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-rose-900 mt-1">
            {urgentCount}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">Priority badges enabled</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admin-notice-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, content, audience..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status and Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              id="notice-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-900/20"
            >
              <option value="all">All Statuses ({totalNotices})</option>
              <option value="published">Published ({publishedCount})</option>
              <option value="draft">Drafts ({draftCount})</option>
            </select>

            {/* Urgent Filter Toggle */}
            <button
              id="notice-urgent-filter-btn"
              onClick={() => setShowUrgentOnly((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                showUrgentOnly
                  ? 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Urgent Only</span>
            </button>

            {/* Sort Toggle */}
            <button
              id="notice-sort-toggle-btn"
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-900" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold px-1 shrink-0">Category:</span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`notice-category-pill-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notice List Table / Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <div className="w-6 h-6 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading notices from Firestore...</p>
          </div>
        ) : sortedNotices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 font-serif">No notices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'all' || showUrgentOnly
                ? 'No notices match your selected filters. Try clearing your search query or filters.'
                : 'No notices have been created yet. Click "Create Notice" above to publish your first circular.'}
            </p>
            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'all' || showUrgentOnly) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedStatus('all');
                  setShowUrgentOnly(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Notice Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedNotices.map((notice) => {
                  const isPublished = (notice.status || 'published') === 'published';
                  return (
                    <tr
                      key={notice.id}
                      id={`notice-row-${notice.id}`}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Title & Urgent Badge */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-start gap-2">
                          {notice.isUrgent && (
                            <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-200 shrink-0 mt-0.5">
                              <AlertCircle className="w-3 h-3" />
                              <span>URGENT</span>
                            </span>
                          )}
                          <div>
                            <button
                              onClick={() => setDetailModalNotice(notice)}
                              className="font-bold text-slate-900 hover:text-blue-900 text-left transition leading-snug line-clamp-2"
                            >
                              {notice.title}
                            </button>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                              {notice.summary || notice.content}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryBadgeClass(
                            notice.category
                          )}`}
                        >
                          {notice.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-900" />
                          <span>{formatDateToDisplay(notice.date) || notice.date}</span>
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{notice.targetAudience || 'All'}</span>
                        </span>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          id={`toggle-status-btn-${notice.id}`}
                          onClick={() => handleToggleStatus(notice)}
                          title={`Click to ${isPublished ? 'move to draft' : 'publish'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-600" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`view-notice-btn-${notice.id}`}
                            onClick={() => setDetailModalNotice(notice)}
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                            title="View details & preview"
                            aria-label="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`edit-notice-btn-${notice.id}`}
                            onClick={() => handleOpenEdit(notice)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Notice"
                            aria-label="Edit Notice"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-notice-btn-${notice.id}`}
                            onClick={() => setDeleteModalNotice(notice)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Notice"
                            aria-label="Delete Notice"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
