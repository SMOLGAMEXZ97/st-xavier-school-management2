import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Award,
  Layers,
  ChevronRight,
  Download,
} from 'lucide-react';
import { ACADEMIC_LEVELS } from '../data/schoolData';
import { AcademicLevel } from '../types';

interface AcademicsSectionProps {
  onOpenAdmissionModal: () => void;
}

export const AcademicsSection: React.FC<AcademicsSectionProps> = ({ onOpenAdmissionModal }) => {
  const [selectedLevelId, setSelectedLevelId] = useState<string>(ACADEMIC_LEVELS[0].id);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  const activeLevel: AcademicLevel =
    ACADEMIC_LEVELS.find((lvl) => lvl.id === selectedLevelId) || ACADEMIC_LEVELS[0];

  return (
    <section id="academics" className="py-20 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-amber-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-amber-300/50 shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
            <span>Academic Curriculum & Programs</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            Curriculum Tailored for Every Developmental Stage
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            From foundational pre-primary discovery to rigorous secondary board examinations, our academic pathways cultivate conceptual depth, creative inquiry, and lifelong passion for learning.
          </p>
        </div>

        {/* Academic Level Selector Tabs - Frosted Glass Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {ACADEMIC_LEVELS.map((level) => {
            const isSelected = level.id === selectedLevelId;
            return (
              <button
                key={level.id}
                id={`academic-tab-${level.id}`}
                onClick={() => setSelectedLevelId(level.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-950 to-indigo-950 text-white border-white/20 shadow-xl transform -translate-y-0.5'
                    : 'glass-panel hover:bg-white/90 text-slate-800 border-white/70 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                      isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'glass-panel-subtle text-slate-700 font-semibold'
                    }`}
                  >
                    {level.grades}
                  </span>
                  <Layers className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg leading-snug">
                  {level.name}
                </h3>
                <p className={`text-xs mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                  Age {level.ageGroup}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Wing Details Card - Frosted Glass Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-xl border border-white mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Wing Info */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs font-extrabold px-3.5 py-1 rounded-xl shadow-xs">
                  {activeLevel.grades}
                </span>
                <span className="text-slate-600 text-xs flex items-center gap-1.5 font-medium glass-panel-subtle px-3 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-blue-800" />
                  <span>Timings: {activeLevel.timing}</span>
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {activeLevel.name}
              </h3>
              <p className="text-amber-800 font-bold text-sm sm:text-base mb-4">
                {activeLevel.tagline}
              </p>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6">
                {activeLevel.description}
              </p>

              {/* Key Program Highlights */}
              <div className="mb-6">
                <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Key Pedagogical Highlights</span>
                </h4>
                <div className="space-y-2.5">
                  {activeLevel.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-800 glass-panel-subtle p-2.5 rounded-xl border border-white/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200/60">
                <button
                  id="academic-apply-now-btn"
                  onClick={onOpenAdmissionModal}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md border border-white/20 transition-all transform active:scale-95"
                >
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                  <span>Apply for {activeLevel.name}</span>
                </button>

                <button
                  id="academic-syllabus-btn"
                  onClick={() => setShowSyllabusModal(true)}
                  className="inline-flex items-center gap-2 glass-panel hover:bg-white text-slate-800 border border-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Curriculum & Booklist</span>
                </button>
              </div>
            </div>

            {/* Right Wing: Subjects & Activities Box */}
            <div className="lg:col-span-5 space-y-6">
              {/* Subjects Container */}
              <div className="glass-panel rounded-2xl p-6 border border-white shadow-xs">
                <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Prescribed Subjects</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeLevel.subjects.map((sub, idx) => (
                    <span
                      key={idx}
                      className="glass-panel-subtle text-blue-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200/50"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activities Container */}
              <div className="glass-panel rounded-2xl p-6 border border-white shadow-xs">
                <h4 className="font-bold text-amber-950 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Co-Curricular & Practical Learning</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeLevel.activities.map((act, idx) => (
                    <span
                      key={idx}
                      className="glass-panel-subtle text-amber-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-200/50"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Assessment & Methodology Banner - Frosted Dark Glass */}
        <div className="glass-panel-dark text-white rounded-3xl p-8 sm:p-10 border border-white/15 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-amber-300">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">Continuous Evaluation (CCE)</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Regular unit assessments, project evaluations, and summative term tests to measure real conceptual grasp.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">Remedial Mentoring</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Targeted personalized doubt-clearing sessions for students requiring additional foundational reinforcement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">Olympiad & Talent Exams</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Specialized coaching for National Science Olympiad (NSO), IMO, NTSE, and state talent examinations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus / Curriculum Modal */}
        {showSyllabusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-slate-900">
                      Curriculum & Academic Structure
                    </h3>
                    <p className="text-xs text-slate-500">
                      St. Xavier High School, Tihidi (Session 2026–27)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyllabusModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-700 mb-6">
                <p>
                  Our syllabus is aligned with standard progressive curricula and NEP guidelines. Textbooks and course materials are selected for conceptual clarity, illustrative diagrams, and interactive exercises.
                </p>
                <div className="glass-panel-subtle p-4.5 rounded-2xl border border-blue-200/60">
                  <h4 className="font-bold text-blue-950 text-sm mb-2">Prescribed Publishers & Courseware:</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-blue-900">
                    <li>NCERT & Oxford University Press publications for Core Sciences & Mathematics.</li>
                    <li>Madhubun & State Board approved vernacular literature for Odia & Hindi.</li>
                    <li>Orient Blackswan for Communicative English Language & Phonetics.</li>
                    <li>Kips Computer Courseware for ICT & Coding fundamentals.</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 italic">
                  * Complete printed syllabus booklets and booklists are distributed at the administrative office upon admission confirmation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowSyllabusModal(false);
                    onOpenAdmissionModal();
                  }}
                  className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md border border-white/20 transition-all"
                >
                  Proceed to Admission Inquiry
                </button>
                <button
                  onClick={() => setShowSyllabusModal(false)}
                  className="glass-panel text-slate-700 hover:bg-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
