import React, { useState } from 'react';
import {
  Target,
  Compass,
  HeartHandshake,
  Award,
  Sparkles,
  CheckCircle2,
  Laptop,
  FlaskConical,
  Monitor,
  BookOpen,
  Trophy,
  Bus,
  ShieldCheck,
  Droplets,
  Quote,
} from 'lucide-react';
import { SCHOOL_INFO, SCHOOL_FACILITIES } from '../data/schoolData';
import { SchoolLogo } from './SchoolLogo';

const iconMap: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-6 h-6" />,
  FlaskConical: <FlaskConical className="w-6 h-6" />,
  Monitor: <Monitor className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  Trophy: <Trophy className="w-6 h-6" />,
  Bus: <Bus className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Droplets: <Droplets className="w-6 h-6" />,
};

interface AboutSectionProps {
  onNavigate: (sectionId: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'vision' | 'mission' | 'values' | 'history'>('vision');

  return (
    <section id="about" className="py-20 relative overflow-hidden">
      {/* Decorative Blur Background Blob */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-blue-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200/50 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Discover Our Heritage & Vision</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            About St. Xavier High School, Tihidi
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Established in 2014 in the educational heart of Tihidi, Bhadrak, our institution has been dedicated to moulding bright, empathetic, and disciplined citizens equipped for tomorrow’s world.
          </p>
        </div>

        {/* Principal's Desk & Introduction Card - Frosted Glass Panel */}
        <div className="glass-panel rounded-3xl overflow-hidden mb-16 shadow-xl border border-white/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Principal Image & Badge */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-950 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <SchoolLogo size="md" lightText />
                </div>
                <div className="relative mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
                    alt="Classroom Instruction at St. Xavier High School"
                    className="w-full h-56 sm:h-64 object-cover rounded-2xl shadow-lg border-2 border-white/20"
                  />
                  <div className="absolute -bottom-3 -right-3 glass-panel-dark text-amber-300 text-xs font-extrabold px-3.5 py-1.5 rounded-xl border border-amber-400/40 shadow-lg">
                    Estd. 2014 • Tihidi
                  </div>
                </div>
              </div>

              <div className="border-t border-white/15 pt-4">
                <h4 className="font-serif font-bold text-lg text-white">Mr. Ashok Kumar Mohanty</h4>
                <p className="text-xs text-amber-300 font-medium">Principal & Head of Institution</p>
                <p className="text-[11px] text-blue-200 mt-0.5">M.Sc., M.Ed | 22+ Years in Educational Leadership</p>
              </div>
            </div>

            {/* Principal's Message & Core Belief */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center backdrop-blur-md bg-white/40">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <Quote className="w-8 h-8 opacity-50 rotate-180 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-widest text-blue-950">From the Principal’s Desk</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-snug">
                “Every child possesses unique genius waiting to be ignited through compassionate guidance.”
              </h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4">
                Welcome to St. Xavier High School, Tihidi. Since our founding in 2014, our constant endeavor has been to harmonize academic excellence with moral integrity and holistic character formation. We believe education transcends textbooks—it is the art of fostering critical inquiry, physical stamina, cultural pride, and universal human empathy.
              </p>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6">
                Our modern digital classrooms, well-stocked laboratories, dedicated faculty, and co-curricular programs ensure that every student who walks through our gates is empowered to dream big and achieve greatness in any corner of the globe.
              </p>

              {/* Quick Checklist - Frosted Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5 text-sm text-slate-800 font-semibold glass-panel-subtle px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Board Exam Success Track</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-800 font-semibold glass-panel-subtle px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multilingual Mastery (Eng, Odia, Hindi)</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-800 font-semibold glass-panel-subtle px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Personalized Remedial Mentoring</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-800 font-semibold glass-panel-subtle px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Disciplined & Value-Centric Culture</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision, Mission, Values & History Interactive Cards */}
        <div className="mb-20">
          {/* Tabs header */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              id="tab-vision-btn"
              onClick={() => setActiveTab('vision')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 'vision'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/30'
                  : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Our Vision</span>
            </button>

            <button
              id="tab-mission-btn"
              onClick={() => setActiveTab('mission')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 'mission'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/30'
                  : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Our Mission</span>
            </button>

            <button
              id="tab-values-btn"
              onClick={() => setActiveTab('values')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 'values'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/30'
                  : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Core Values</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/30'
                  : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>History & Milestone</span>
            </button>
          </div>

          {/* Tab Content Display - Frosted Glass Container */}
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white shadow-lg min-h-[260px] flex items-center">
            {activeTab === 'vision' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
                <div className="md:col-span-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">
                    <Compass className="w-4 h-4 text-blue-700" />
                    <span>Vision 2030</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
                    To be a beacon of progressive, holistic, and value-based education in Odisha.
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base mb-4">
                    Our vision is to nurture responsible global citizens who possess intellectual curiosity, emotional intelligence, unwavering ethical integrity, and a passion for community service. We envision an educational space where traditional Indian cultural values harmoniously blend with modern scientific thinking and digital literacy.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="glass-panel-subtle text-blue-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200/50">Scientific Temperament</span>
                    <span className="glass-panel-subtle text-amber-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-200/50">Ethical Leadership</span>
                    <span className="glass-panel-subtle text-emerald-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200/50">Environmental Stewardship</span>
                  </div>
                </div>
                <div className="md:col-span-4 glass-panel-subtle p-6 rounded-2xl border border-white text-center">
                  <div className="w-16 h-16 bg-blue-600/15 text-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200/60">
                    <Compass className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-serif font-bold text-slate-900 italic">
                    “Knowledge is Light • Truth & Discipline”
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">School Guiding Motto</p>
                </div>
              </div>
            )}

            {activeTab === 'mission' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
                <div className="md:col-span-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">
                    <Target className="w-4 h-4 text-blue-700" />
                    <span>Our Educational Mission</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
                    Delivering transformative education that unlocks every student’s highest potential.
                  </h3>
                  <ul className="space-y-2.5 text-slate-700 text-sm sm:text-base">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>Provide high-quality, English-medium education accessible to all sections of society in Tihidi and Bhadrak district.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>Cultivate creative problem-solving, digital skills, and experiential STEM learning from primary grades.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                      <span>Instill respect for cultural diversity, regional heritage, constitutional values, and environmental protection.</span>
                    </li>
                  </ul>
                </div>
                <div className="md:col-span-4 glass-panel-subtle p-6 rounded-2xl border border-white text-center">
                  <div className="w-16 h-16 bg-amber-500/15 text-amber-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
                    <Target className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-serif font-bold text-slate-900 italic">
                    “100% Student-Centric Pedagogy”
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Inclusive Learning Environment</p>
                </div>
              </div>
            )}

            {activeTab === 'values' && (
              <div className="w-full">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-4">
                  <HeartHandshake className="w-4 h-4 text-blue-700" />
                  <span>The Xavier 5-Pillar Core Values</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="glass-panel-subtle p-4 rounded-2xl border border-white glass-card-hover">
                    <div className="w-8 h-8 bg-blue-600/20 text-blue-950 font-bold rounded-xl flex items-center justify-center mb-2 text-sm border border-blue-300/50">1</div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Integrity</h4>
                    <p className="text-xs text-slate-600">Uncompromising honesty, truthfulness, and moral courage in words and deeds.</p>
                  </div>
                  <div className="glass-panel-subtle p-4 rounded-2xl border border-white glass-card-hover">
                    <div className="w-8 h-8 bg-amber-500/20 text-amber-950 font-bold rounded-xl flex items-center justify-center mb-2 text-sm border border-amber-300/50">2</div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Excellence</h4>
                    <p className="text-xs text-slate-600">Pursuing the highest benchmarks in academics, sports, and personal development.</p>
                  </div>
                  <div className="glass-panel-subtle p-4 rounded-2xl border border-white glass-card-hover">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-950 font-bold rounded-xl flex items-center justify-center mb-2 text-sm border border-emerald-300/50">3</div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Discipline</h4>
                    <p className="text-xs text-slate-600">Self-control, punctual habits, respect for elders, and structured study routines.</p>
                  </div>
                  <div className="glass-panel-subtle p-4 rounded-2xl border border-white glass-card-hover">
                    <div className="w-8 h-8 bg-indigo-500/20 text-indigo-950 font-bold rounded-xl flex items-center justify-center mb-2 text-sm border border-indigo-300/50">4</div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Empathy</h4>
                    <p className="text-xs text-slate-600">Kindness toward peers, reverence for nature, and active service for the underprivileged.</p>
                  </div>
                  <div className="glass-panel-subtle p-4 rounded-2xl border border-white glass-card-hover">
                    <div className="w-8 h-8 bg-rose-500/20 text-rose-950 font-bold rounded-xl flex items-center justify-center mb-2 text-sm border border-rose-300/50">5</div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Innovation</h4>
                    <p className="text-xs text-slate-600">Courage to question, think independently, and harness technology for social good.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
                <div className="md:col-span-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">
                    <Award className="w-4 h-4 text-blue-700" />
                    <span>A Decade of Academic Distinction (2014 – Present)</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
                    From a humble beginning with 80 students to a premier educational hub.
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base mb-4">
                    Founded in 2014 by visionary educationists in Tihidi, St. Xavier High School was created to bridge the rural-urban education gap in Bhadrak. Over the past decade, the school has expanded its infrastructure to multi-story modern wings, state-of-the-art labs, sports arenas, and achieved consistent 100% board examination distinctions.
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="glass-panel-subtle p-3 rounded-xl border border-white">
                      <div className="font-bold text-blue-950 text-base font-serif">2014</div>
                      <div className="text-[11px] text-slate-600">Foundation Year</div>
                    </div>
                    <div className="glass-panel-subtle p-3 rounded-xl border border-white">
                      <div className="font-bold text-blue-950 text-base font-serif">1200+</div>
                      <div className="text-[11px] text-slate-600">Scholars Enrolled</div>
                    </div>
                    <div className="glass-panel-subtle p-3 rounded-xl border border-white">
                      <div className="font-bold text-blue-950 text-base font-serif">100%</div>
                      <div className="text-[11px] text-slate-600">Board Distinction</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 glass-panel-subtle p-6 rounded-2xl border border-white text-center">
                  <div className="w-16 h-16 bg-emerald-500/15 text-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200/60">
                    <Award className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-serif font-bold text-slate-900 italic">
                    “10+ Glorious Years in Tihidi, Bhadrak”
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Dedicated to Educational Excellence</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campus Facilities & Infrastructure Grid - Frosted Cards */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mb-3">
              World-Class Campus Infrastructure
            </h3>
            <p className="text-slate-600 text-sm sm:text-base">
              Designed to foster an inspiring, safe, and technologically enriched learning environment for every child.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SCHOOL_FACILITIES.map((facility, idx) => (
              <div
                key={idx}
                id={`facility-card-${idx}`}
                className="glass-panel rounded-2xl p-6 border border-white shadow-md glass-card-hover group transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-900 flex items-center justify-center mb-4 group-hover:bg-blue-900 group-hover:text-white transition-all border border-blue-200/40">
                  {iconMap[facility.icon] || <Laptop className="w-6 h-6" />}
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-950 transition-colors">
                  {facility.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
