import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Menu,
  X,
  Bell,
  GraduationCap,
  ChevronRight,
  Sparkles,
  Shield,
  User,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { SCHOOL_INFO } from '../data/schoolData';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenAdmissionModal: () => void;
  onNavigatePortal?: (portal: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  onOpenAdmissionModal,
  onNavigatePortal,
}) => {
  const { currentUser, userProfile, role } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'academics', label: 'Academics' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'notices', label: 'Notices' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handlePortalClick = (portal: 'student' | 'admin') => {
    if (onNavigatePortal) {
      onNavigatePortal(portal);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="relative w-full z-40 transition-all duration-300">
      {/* Top Notification Bar & Quick Contact (Desktop & Tablet) */}
      <div className="bg-slate-950 text-blue-100 text-xs border-b border-slate-800 py-1.5 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          {/* Contact Details */}
          <div className="flex items-center gap-4 flex-wrap">
            <a
              id="topbar-phone"
              href={`tel:${SCHOOL_INFO.phonePrimary}`}
              className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{SCHOOL_INFO.phonePrimary}</span>
            </a>
            <span className="hidden md:inline text-white/20">|</span>
            <a
              id="topbar-email"
              href={`mailto:${SCHOOL_INFO.email}`}
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>{SCHOOL_INFO.email}</span>
            </a>
            <span className="hidden lg:inline text-white/20">|</span>
            <span className="hidden lg:inline-flex items-center gap-1 text-blue-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Tihidi, Bhadrak, Odisha</span>
            </span>
          </div>

          {/* Quick Notice Ticker & Portal Buttons */}
          <div className="flex items-center gap-2.5">
            {currentUser && userProfile ? (
              <button
                onClick={() => handlePortalClick(role === 'student' ? 'student' : 'admin')}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-semibold hover:bg-emerald-500/30 transition"
              >
                <User className="w-3 h-3" />
                <span>My Dashboard ({userProfile.displayName || role})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="topbar-student-portal-btn"
                  onClick={() => handlePortalClick('student')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Student & Guardian Portal</span>
                </button>
                <span className="text-white/20">|</span>
                <button
                  id="topbar-admin-portal-btn"
                  onClick={() => handlePortalClick('admin')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition"
                >
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Staff Login</span>
                </button>
              </div>
            )}

            <div className="hidden xl:flex items-center gap-1.5 text-amber-300 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/30">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span className="font-semibold text-[11px]">Admissions Open 2026–27</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        id="primary-navigation"
        aria-label="Main Navigation"
        className="w-full bg-white border-b border-slate-200 py-2 sm:py-2.5 shadow-xs transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & School Branding */}
          <button
            id="nav-brand-logo"
            onClick={() => handleLinkClick('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl p-1 group transition-colors hover:bg-slate-50"
            aria-label="St. Xavier High School Home"
          >
            <SchoolLogo size="sm" />
            <div className="flex flex-col">
              <span className="font-serif font-extrabold text-blue-950 tracking-tight text-base sm:text-lg md:text-xl group-hover:text-blue-800 transition-colors leading-tight">
                St. Xavier High School
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Tihidi, Bhadrak • Estd. 2014
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-all relative ${
                    isActive
                      ? 'text-blue-950 bg-blue-50 border border-blue-200/70 font-bold shadow-xs'
                      : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-blue-700 to-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Hamburger (3 Lines Button) */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 shadow-2xl space-y-1 mt-2 mx-2 rounded-2xl border animate-in slide-in-from-top-2 duration-200"
          >
            <div className="py-2 border-b border-slate-200 mb-2">
              <div className="flex items-center gap-2 text-xs text-amber-950 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Admissions open for 2026-27 (Nursery to Class IX)</span>
              </div>
            </div>

            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  id={`mobile-nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl text-left transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white font-bold shadow-md'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-blue-900'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
                </button>
              );
            })}

            {/* Mobile Portal Buttons */}
            <div className="pt-2 pb-1 grid grid-cols-2 gap-2">
              <button
                id="mobile-student-portal-btn"
                onClick={() => handlePortalClick('student')}
                className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 font-bold text-xs py-2 px-3 rounded-xl transition"
              >
                <GraduationCap className="w-4 h-4 text-blue-800" />
                <span>Student Portal</span>
              </button>
              <button
                id="mobile-staff-portal-btn"
                onClick={() => handlePortalClick('admin')}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl transition"
              >
                <Shield className="w-4 h-4 text-slate-700" />
                <span>Staff Portal</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <button
                id="mobile-menu-apply-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmissionModal();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>Apply for Admission (2026–27)</span>
              </button>

              <div className="flex items-center justify-around pt-2 text-xs text-slate-600">
                <a href={`tel:${SCHOOL_INFO.phonePrimary}`} className="flex items-center gap-1 text-blue-900 font-semibold">
                  <Phone className="w-3 h-3" /> Call Office
                </a>
                <span>•</span>
                <a href={`mailto:${SCHOOL_INFO.email}`} className="flex items-center gap-1 text-blue-900 font-semibold">
                  <Mail className="w-3 h-3" /> Send Email
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

