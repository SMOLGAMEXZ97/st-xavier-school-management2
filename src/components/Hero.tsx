import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Bell,
  Image as ImageIcon,
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Monitor,
  FlaskConical,
  Trophy,
  Bus,
} from 'lucide-react';
import { SCHOOL_INFO } from '../data/schoolData';
import { SchoolLogo } from './SchoolLogo';

interface HeroProps {
  onNavigate: (sectionId: string) => void;
  onOpenAdmissionModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onOpenAdmissionModal }) => {
  return (
    <section id="home" className="relative pt-28 sm:pt-36 pb-16 md:pb-24 overflow-hidden bg-slate-950 text-white">
      {/* Background with Dark Academic Theme & Subtle Overlay Pattern */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=80"
          alt="School Campus Background"
          className="w-full h-full object-cover object-center opacity-20 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950" />
      </div>

      {/* Decorative Glowing Accent Orbs for Glass Refraction */}
      <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-28 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Frosted Pill Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 glass-panel-dark px-4 py-1.5 rounded-full text-xs sm:text-sm text-amber-300 font-semibold border border-amber-400/30 shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>Admissions Open for Academic Year 2026–2027 • Playgroup to Class IX</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <SchoolLogo size="xl" />
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
            St. Xavier High School
            <span className="block text-2xl sm:text-3xl md:text-4xl text-amber-400 font-sans font-bold mt-2">
              Tihidi, Bhadrak, Odisha
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            Empowering students with strong academic foundations, ethical values, and 21st-century skills. Established in 2014, nurturing future leaders through holistic education.
          </p>

          {/* Frosted Glass Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <button
              id="hero-apply-btn"
              onClick={onOpenAdmissionModal}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
            >
              <GraduationCap className="w-5 h-5 text-slate-900" />
              <span>Apply for Admission</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>

            <button
              id="hero-explore-academics-btn"
              onClick={() => onNavigate('academics')}
              className="inline-flex items-center gap-2 glass-panel-dark hover:bg-slate-800/80 text-white border border-white/20 font-semibold px-5 py-3.5 rounded-2xl transition-all text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4 text-blue-300" />
              <span>Explore Academics</span>
            </button>

            <button
              id="hero-view-notices-btn"
              onClick={() => onNavigate('notices')}
              className="inline-flex items-center gap-2 glass-panel-dark hover:bg-slate-800/80 text-blue-100 border border-blue-400/30 font-semibold px-5 py-3.5 rounded-2xl transition-all text-sm sm:text-base"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>School Notices</span>
            </button>

            <button
              id="hero-view-gallery-btn"
              onClick={() => onNavigate('gallery')}
              className="inline-flex items-center gap-2 glass-panel-dark hover:bg-slate-800/80 text-slate-200 border border-white/15 font-semibold px-4.5 py-3.5 rounded-2xl transition-all text-sm sm:text-base"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Campus Tour</span>
            </button>
          </div>

          {/* Quick Statistics Strip - Frosted Acrylic Glass */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-white/10">
            {SCHOOL_INFO.stats.map((stat, index) => (
              <div
                key={index}
                id={`stat-card-${index}`}
                className="glass-panel-dark p-4.5 rounded-2xl text-center border border-white/15 hover:border-amber-400/40 glass-card-hover transition-all"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-0.5 font-serif">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mb-0.5">
                  {stat.label}
                </div>
                <div className="text-[11px] text-slate-400">
                  {stat.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Feature Highlights Banner - Frosted Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="glass-panel-dark p-5 rounded-2xl border border-white/15 flex items-start gap-3.5 glass-card-hover">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0 text-blue-300">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Smart Classrooms</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Interactive digital smart panels for engaging visual and concept learning.
              </p>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-white/15 flex items-start gap-3.5 glass-card-hover">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Modern Science & IT Labs</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hands-on experimental science labs and computer programming workstation suites.
              </p>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-white/15 flex items-start gap-3.5 glass-card-hover">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Sports & Co-Curriculars</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Athletics, martial arts, yoga, debates, cultural arts, and Olympiad mentoring.
              </p>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-white/15 flex items-start gap-3.5 glass-card-hover">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Safe Bus Transport</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                GPS-monitored fleet connecting Tihidi and surrounding panchayats of Bhadrak.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
