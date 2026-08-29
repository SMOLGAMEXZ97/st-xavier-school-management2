import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Layers,
} from 'lucide-react';
import { GALLERY_ITEMS } from '../data/schoolData';
import { GalleryItem } from '../types';

export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const categories = [
    'All',
    'Campus & Labs',
    'Events & Celebrations',
    'Sports & Athletics',
    'Science & Arts',
    'Student Life',
  ];

  const filteredItems =
    selectedCategory === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  const handleOpenLightbox = (item: GalleryItem) => {
    const idx = GALLERY_ITEMS.findIndex((i) => i.id === item.id);
    setActiveLightboxIndex(idx !== -1 ? idx : 0);
  };

  const handleNext = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((activeLightboxIndex + 1) % GALLERY_ITEMS.length);
    }
  };

  const handlePrev = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex(
        (activeLightboxIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length
      );
    }
  };

  const currentLightboxItem =
    activeLightboxIndex !== null ? GALLERY_ITEMS[activeLightboxIndex] : null;

  return (
    <section id="gallery" className="py-20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-emerald-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-300/50 shadow-xs">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Campus Moments & Milestones</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            School Life & Photo Gallery
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Take a visual tour through our vibrant campus, state-of-the-art learning facilities, annual sports meets, and cultural celebrations.
          </p>
        </div>

        {/* Category Filters - Frosted Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`gallery-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/20'
                    : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60 shadow-xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid - Frosted Framed Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`gallery-item-${item.id}`}
              onClick={() => handleOpenLightbox(item)}
              className="group relative bg-slate-900/40 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-4/3 border border-white/80 glass-card-hover"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                loading="lazy"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Top Badge - Frosted */}
              <div className="absolute top-3.5 left-3.5">
                <span className="glass-panel-dark text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-white/20 shadow-md">
                  {item.category}
                </span>
              </div>

              {/* Hover Zoom Icon */}
              <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-2xl bg-white/25 backdrop-blur-md text-white flex items-center justify-center border border-white/40 opacity-0 group-hover:opacity-100 transition-all shadow-md">
                <Maximize2 className="w-4 h-4" />
              </div>

              {/* Caption Content */}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white transform group-hover:-translate-y-1 transition-transform">
                <h3 className="font-serif font-bold text-base sm:text-lg mb-1 leading-snug text-white drop-shadow-xs">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed opacity-95">
                  {item.caption}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 mt-2 font-semibold">
                  <Calendar className="w-3 h-3 text-amber-300" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fullscreen Lightbox Modal - Frosted Dark Glass */}
        {currentLightboxItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in">
            <button
              id="lightbox-close-btn"
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all z-50 shadow-lg"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Button */}
            <button
              id="lightbox-prev-btn"
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all z-50 shadow-lg"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              id="lightbox-next-btn"
              onClick={handleNext}
              className="absolute right-4 sm:right-8 p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all z-50 shadow-lg"
              aria-label="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image and Caption Container */}
            <div className="max-w-4xl w-full glass-panel-dark rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="relative flex-1 bg-black/60 flex items-center justify-center overflow-hidden">
                <img
                  src={currentLightboxItem.imageUrl}
                  alt={currentLightboxItem.title}
                  className="max-h-[65vh] w-auto max-w-full object-contain"
                />
              </div>
              <div className="p-6 bg-slate-950/70 backdrop-blur-md text-white border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {currentLightboxItem.category}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Photo {activeLightboxIndex! + 1} of {GALLERY_ITEMS.length}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white mb-2">
                  {currentLightboxItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentLightboxItem.caption}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
