import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  Heart,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { SCHOOL_INFO } from '../data/schoolData';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenAdmissionModal: () => void;
  onNavigatePortal?: (portal: 'student' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmissionModal, onNavigatePortal }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="relative text-slate-300 border-t border-slate-800/80 overflow-hidden bg-slate-950/90 backdrop-blur-xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Banner Accent */}
      <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-blue-950/90 backdrop-blur-md py-6 text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-serif font-bold text-base sm:text-lg">
                Admissions Open for Academic Session 2026–2027
              </h4>
              <p className="text-xs text-blue-200">
                Playgroup/Nursery to Class IX • Limited seats to maintain optimal 1:18 teacher-student ratio
              </p>
            </div>
          </div>
          <button
            id="footer-quick-apply-btn"
            onClick={onOpenAdmissionModal}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all shrink-0 active:scale-95"
          >
            Apply for Admission Online
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand & Crest Column */}
          <div className="lg:col-span-4 space-y-4">
            <SchoolLogo size="lg" lightText showText />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              St. Xavier High School, Tihidi is a co-educational institution committed to academic brilliance, moral integrity, physical fitness, and holistic character formation in Bhadrak District, Odisha.
            </p>
            <div className="pt-2 text-xs text-amber-300 font-semibold italic">
              “{SCHOOL_INFO.motto}”
            </div>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Government Recognized Institution (Estd. 2014)</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3">
            <h4 className="font-serif font-bold text-white text-base mb-4 tracking-wider uppercase">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  About Our Heritage & Vision
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('academics')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Curriculum & Academic Wings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faculty')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Faculty & Mentors Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Campus Gallery & Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('notices')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  School Circulars & Notice Board
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admissions')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Admission Guidelines 2026–27
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Contact & Location Directions
                </button>
              </li>
              {onNavigatePortal && (
                <>
                  <li className="pt-2 border-t border-white/10">
                    <button
                      id="footer-student-portal-link"
                      onClick={() => onNavigatePortal('student')}
                      className="text-amber-300 hover:text-amber-200 transition-colors text-left font-medium flex items-center gap-1.5"
                    >
                      <span>Student & Guardian Portal</span>
                    </button>
                  </li>
                  <li>
                    <button
                      id="footer-staff-portal-link"
                      onClick={() => onNavigatePortal('admin')}
                      className="text-slate-400 hover:text-slate-200 transition-colors text-left font-medium flex items-center gap-1.5"
                    >
                      <span>Staff & Admin Console</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Academic Wings Column */}
          <div className="lg:col-span-2">
            <h4 className="font-serif font-bold text-white text-base mb-4 tracking-wider uppercase">
              Academic Wings
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>Playgroup & Nursery</li>
              <li>LKG & UKG Wing</li>
              <li>Primary (Class I – V)</li>
              <li>Middle (Class VI – VIII)</li>
              <li>Secondary (Class IX – X)</li>
              <li>Science & Math Labs</li>
              <li>Computer & Coding Lab</li>
              <li>Sports & Martial Arts</li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif font-bold text-white text-base mb-4 tracking-wider uppercase">
              School Office
            </h4>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{SCHOOL_INFO.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`tel:${SCHOOL_INFO.phonePrimary}`} className="hover:text-white transition-colors">
                {SCHOOL_INFO.phonePrimary}
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`mailto:${SCHOOL_INFO.email}`} className="hover:text-white transition-colors break-all">
                {SCHOOL_INFO.email}
              </a>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Office: Mon – Sat (8:00 AM – 2:30 PM)</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Back to Top Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} St. Xavier High School, Tihidi, Bhadrak, Odisha. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500">Established 2014</span>
            <span>•</span>
            <button
              id="back-to-top-btn"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
