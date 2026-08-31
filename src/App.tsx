import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
 import { AboutSection } from './components/AboutSection';
import { AcademicsSection } from './components/AcademicsSection';
import { FacultySection } from './components/FacultySection';
import { GallerySection } from './components/GallerySection';
import { NoticesSection } from './components/NoticesSection';
import { AdmissionsSection } from './components/AdmissionsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdmissionModal } from './components/AdmissionModal';
import { AdminLogin } from './components/auth/AdminLogin';
import { StudentLogin } from './components/auth/StudentLogin';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

type RouteView = 'public' | 'student-login' | 'admin-login' | 'student-dashboard' | 'admin-dashboard';

export default function App() {
  const { currentUser, userProfile, role, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<RouteView>('public');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState<boolean>(false);

  // Sync initial URL path
  const syncRouteFromPath = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin/login') {
      setCurrentView('admin-login');
    } else if (path === '/student/login') {
      setCurrentView('student-login');
    } else if (path.startsWith('/admin')) {
      setCurrentView(currentUser && role && role !== 'student' ? 'admin-dashboard' : 'admin-login');
    } else if (path.startsWith('/student')) {
      setCurrentView(currentUser && role === 'student' ? 'student-dashboard' : 'student-login');
    } else {
      setCurrentView('public');
    }
  }, [currentUser, role]);

  useEffect(() => {
    syncRouteFromPath();
    window.addEventListener('popstate', syncRouteFromPath);
    return () => window.removeEventListener('popstate', syncRouteFromPath);
  }, [syncRouteFromPath]);

  // Handle automatic route adjustments when auth state resolves
  useEffect(() => {
    if (isLoading) return;

    if (currentUser && userProfile?.active) {
      if (role === 'student' && (currentView === 'student-login' || currentView === 'public' && window.location.pathname.startsWith('/student'))) {
        setCurrentView('student-dashboard');
      } else if (role && role !== 'student' && (currentView === 'admin-login' || currentView === 'public' && window.location.pathname.startsWith('/admin'))) {
        setCurrentView('admin-dashboard');
      }
    } else if (!currentUser) {
      if (currentView === 'student-dashboard') {
        setCurrentView('student-login');
      } else if (currentView === 'admin-dashboard') {
        setCurrentView('admin-login');
      }
    }
  }, [currentUser, userProfile, role, isLoading, currentView]);

  // Navigate helper updating history
  const navigateTo = (view: RouteView, path: string) => {
    setCurrentView(view);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePortalNavigate = (portal: 'student' | 'admin') => {
    if (portal === 'student') {
      if (currentUser && role === 'student') {
        navigateTo('student-dashboard', '/student');
      } else {
        navigateTo('student-login', '/student/login');
      }
    } else {
      if (currentUser && role && role !== 'student') {
        navigateTo('admin-dashboard', '/admin');
      } else {
        navigateTo('admin-login', '/admin/login');
      }
    }
  };

  // Smooth scroll to section
  const handleNavigate = (sectionId: string) => {
    if (currentView !== 'public') {
      setCurrentView('public');
      window.history.pushState(null, '', '/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 16;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    if (currentView !== 'public') return;

    const sections = ['home', 'about', 'academics', 'faculty', 'gallery', 'notices', 'admissions', 'contact'];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  // Show initial loader only for protected dashboard views while checking existing session
  if (isLoading && (currentView === 'student-dashboard' || currentView === 'admin-dashboard')) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-xs tracking-wider uppercase text-slate-400 font-semibold">
          Verifying Security Credentials...
        </p>
      </div>
    );
  }

  // Render Student Login
  if (currentView === 'student-login') {
    return (
      <div className="min-h-screen bg-slate-900 selection:bg-blue-900 selection:text-white">
        <StudentLogin
          onNavigateHome={() => navigateTo('public', '/')}
          onNavigateStaffLogin={() => navigateTo('admin-login', '/admin/login')}
          onLoginSuccess={() => navigateTo('student-dashboard', '/student')}
        />
      </div>
    );
  }

  // Render Admin / Staff Login
  if (currentView === 'admin-login') {
    return (
      <div className="min-h-screen bg-slate-950 selection:bg-amber-400 selection:text-slate-950">
        <AdminLogin
          onNavigateHome={() => navigateTo('public', '/')}
          onNavigateStudentLogin={() => navigateTo('student-login', '/student/login')}
          onLoginSuccess={() => navigateTo('admin-dashboard', '/admin')}
        />
      </div>
    );
  }

  // Render Protected Student Dashboard
  if (currentView === 'student-dashboard') {
    return (
      <StudentDashboard
        onNavigateHome={() => navigateTo('public', '/')}
      />
    );
  }

  // Render Protected Admin Dashboard
  if (currentView === 'admin-dashboard') {
    return (
      <AdminDashboard
        onNavigateHome={() => navigateTo('public', '/')}
      />
    );
  }

  // Render Public School Website
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glows for Frosted Glass Refraction */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[30rem] h-[30rem] bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-1/4 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        onNavigatePortal={handlePortalNavigate}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero
          onNavigate={handleNavigate}
          onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        />
        <AboutSection onNavigate={handleNavigate} />
        <AcademicsSection
          onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        />
        <FacultySection />
        <GallerySection />
        <NoticesSection />
        <AdmissionsSection />
        <TestimonialsSection />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        onNavigatePortal={handlePortalNavigate}
      />

      {/* Admission Quick Action Modal */}
      <AdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
      />
    </div>
  );
}
