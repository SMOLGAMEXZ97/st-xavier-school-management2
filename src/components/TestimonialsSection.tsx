import React from 'react';
import { Quote, Star, Sparkles, HeartHandshake } from 'lucide-react';
import { TESTIMONIALS } from '../data/schoolData';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 text-white relative overflow-hidden bg-slate-900/90 backdrop-blur-xl">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-panel-dark text-amber-300 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-md">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Parent & Alumni Voices</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            Words of Trust & Appreciation
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Discover how St. Xavier High School, Tihidi has shaped the intellectual and moral foundations of hundreds of young scholars over the past decade.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              id={`testimonial-card-${item.id}`}
              className="glass-panel-dark rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/15 hover:border-amber-400/40 transition-all duration-300 shadow-xl glass-card-hover"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic mb-6">
                  “{item.quote}”
                </p>
              </div>

              {/* Author Profile */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-400/70 shadow-sm"
                />
                <div>
                  <h4 className="font-serif font-bold text-white text-sm sm:text-base">
                    {item.name}
                  </h4>
                  <p className="text-xs text-amber-300 font-medium">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
