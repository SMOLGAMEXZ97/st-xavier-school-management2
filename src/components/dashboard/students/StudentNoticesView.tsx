import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Calendar,
  Users,
  AlertCircle,
  FileText,
  ExternalLink,
  Printer,
  X,
  Sparkles,
} from 'lucide-react';
import { Notice, NoticeCategory } from '../../../types';
import { noticeService } from '../../../services/noticeService';
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

export const StudentNoticesView: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | NoticeCategory>('All');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = noticeService.subscribeToNotices((data) => {
      // Data is already filtered for published notices
      setNotices(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="space-y-1.5 pr-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryBadgeClass(
                      selectedNotice.category
                    )}`}
                  >
                    {selectedNotice.category}
                  </span>
                  {selectedNotice.isUrgent && (
                    <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-red-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>URGENT</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold font-serif text-slate-900 leading-snug">
                  {selectedNotice.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                <span>Published: <strong>{formatDateToDisplay(selectedNotice.date) || selectedNotice.date}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-900" />
                <span>Audience: <strong>{selectedNotice.targetAudience}</strong></span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed mb-6">
              {selectedNotice.summary && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 font-medium text-xs sm:text-sm">
                  {selectedNotice.summary}
                </div>
              )}
              <p className="whitespace-pre-line text-slate-800">{selectedNotice.content}</p>
            </div>

            {(selectedNotice.attachmentName || selectedNotice.attachmentUrl) && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedNotice.attachmentName || 'Official Attachment'}
                    </div>
                    <div className="text-[10px] text-slate-500">Official Notice Circular Document</div>
                  </div>
                </div>
                {selectedNotice.attachmentUrl && (
                  <a
                    href={selectedNotice.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View / Download</span>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Circular</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-900" />
            Student Circulars & Academic Notices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official announcements, examination date sheets, and holiday notifications broadcast by the school.
          </p>
        </div>
      </div>

      {/* Search & Category filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars, exams, holidays..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notice List */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading announcements...</p>
        </div>
      ) : sortedNotices.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No notices found</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try resetting your search or category filter.'
              : 'There are no active circulars at this moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className={`p-4 rounded-xl border transition cursor-pointer hover:border-blue-300 hover:shadow-xs ${
                notice.isUrgent
                  ? 'bg-red-50/40 border-red-200 hover:bg-red-50/70'
                  : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                      notice.category
                    )}`}
                  >
                    {notice.category}
                  </span>
                  {notice.isUrgent && (
                    <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>URGENT</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium whitespace-nowrap shrink-0">
                  <Calendar className="w-3 h-3 text-blue-900" />
                  <span>{formatDateToDisplay(notice.date) || notice.date}</span>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-serif leading-snug">
                {notice.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                {notice.summary || notice.content}
              </p>

              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500">
                  Audience: <strong className="text-slate-700">{notice.targetAudience}</strong>
                </span>
                <span className="text-blue-900 font-bold hover:underline">
                  Read Circular →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
