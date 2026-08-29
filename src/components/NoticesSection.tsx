import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Calendar,
  AlertCircle,
  Sparkles,
  FileText,
  Download,
  Printer,
  ChevronRight,
  Filter,
  Users,
  X,
} from 'lucide-react';
import { noticeService } from '../services/noticeService';
import { Notice } from '../types';

export const NoticesSection: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeNoticeModal, setActiveNoticeModal] = useState<Notice | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates from Firestore
    const unsubscribe = noticeService.subscribeToNotices(
      (data) => {
        setNotices(data);
        setLoading(false);
      },
      (err) => {
        console.warn('Live notices subscription error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const categories = ['All', 'Academics', 'Examinations', 'Events', 'Holidays', 'Circulars'];

  const filteredNotices = notices.filter((notice) => {
    const matchesCategory =
      selectedCategory === 'All' || notice.category === selectedCategory;
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="notices" className="py-20 relative overflow-hidden">
      {/* Ambient blob */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-blue-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200/50 shadow-xs">
            <Bell className="w-3.5 h-3.5 text-blue-700" />
            <span>Official Announcements & Circulars</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            School Notice Board
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Stay updated with the latest academic circulars, examination schedules, event alerts, and holiday notifications from the school administration.
          </p>
        </div>

        {/* Search & Category Filter Bar - Frosted Glass Container */}
        <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-white shadow-lg mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="notice-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search circulars, exams, events..."
                className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`notice-filter-${cat.toLowerCase()}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md border-white/20'
                        : 'glass-panel-subtle text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notice List Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Loading notices...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-white">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-slate-800">No notices found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keywords or category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                id={`notice-card-${notice.id}`}
                className={`glass-panel rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between shadow-md glass-card-hover ${
                  notice.isUrgent
                    ? 'border-amber-300 ring-2 ring-amber-300/40 bg-amber-50/40'
                    : 'border-white'
                }`}
              >
                <div>
                  {/* Notice Badges Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${getCategoryBadgeClass(
                        notice.category
                      )}`}
                    >
                      {notice.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {notice.isUrgent && (
                        <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-red-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>URGENT</span>
                        </span>
                      )}
                      {notice.isNew && !notice.isUrgent && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-blue-200">
                          <Sparkles className="w-3 h-3" />
                          <span>NEW</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notice Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>Published: {notice.date}</span>
                  </div>

                  {/* Notice Title */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug hover:text-blue-950 transition-colors">
                    {notice.title}
                  </h3>

                  {/* Notice Summary */}
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {notice.summary}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{notice.targetAudience}</span>
                  </span>

                  <button
                    id={`view-notice-btn-${notice.id}`}
                    onClick={() => setActiveNoticeModal(notice)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-950 hover:text-white bg-blue-50/80 hover:bg-blue-900 px-3.5 py-1.5 rounded-xl border border-blue-200/60 hover:border-blue-900 transition-all shadow-xs"
                  >
                    <span>Read Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notice Modal */}
        {activeNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getCategoryBadgeClass(
                        activeNoticeModal.category
                      )}`}
                    >
                      {activeNoticeModal.category}
                    </span>
                    {activeNoticeModal.isUrgent && (
                      <span className="bg-red-500/15 text-red-700 text-xs font-extrabold px-2.5 py-0.5 rounded-lg border border-red-200">
                        URGENT
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-700" />
                      <span>{activeNoticeModal.date}</span>
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 leading-snug">
                    {activeNoticeModal.title}
                  </h3>
                </div>

                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 transition-colors"
                  aria-label="Close Notice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target Audience Bar */}
              <div className="glass-panel-subtle px-4 py-2.5 rounded-2xl border border-blue-200/60 text-xs text-slate-700 flex items-center gap-2 mb-6 font-medium">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Applicable Audience: <strong className="text-slate-900">{activeNoticeModal.targetAudience}</strong></span>
              </div>

              {/* Notice Body */}
              <div className="text-sm text-slate-700 leading-relaxed space-y-4 mb-8">
                <p className="font-semibold text-slate-900">{activeNoticeModal.summary}</p>
                <div className="border-t border-slate-200/60 pt-4">
                  <p>{activeNoticeModal.content}</p>
                </div>
              </div>

              {/* Attachment if any */}
              {activeNoticeModal.attachmentName && (
                <div className="glass-panel-subtle border border-blue-200/80 p-4.5 rounded-2xl flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-900" />
                    <div>
                      <div className="text-xs font-bold text-blue-950">
                        {activeNoticeModal.attachmentName}
                      </div>
                      <div className="text-[11px] text-blue-800">Official Circular Document</div>
                    </div>
                  </div>
                  {activeNoticeModal.attachmentUrl ? (
                    <a
                      href={activeNoticeModal.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={activeNoticeModal.attachmentName}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md border border-white/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md border border-white/20"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Document</span>
                    </button>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 glass-panel text-slate-700 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-white transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Circular</span>
                </button>

                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md border border-white/20 transition-all"
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
