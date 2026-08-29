import React, { useState } from 'react';
import {
  Users,
  Award,
  GraduationCap,
  Sparkles,
  BookOpen,
  Mail,
  Briefcase,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { FACULTY_MEMBERS } from '../data/schoolData';
import { FacultyMember } from '../types';

export const FacultySection: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [activeFacultyModal, setActiveFacultyModal] = useState<FacultyMember | null>(null);

  const departments = [
    'All',
    'Administration',
    'Science & Math',
    'Languages',
    'Social Studies',
    'Primary Wing',
    'Sports & Arts',
  ];

  const filteredFaculty =
    selectedDept === 'All'
      ? FACULTY_MEMBERS
      : FACULTY_MEMBERS.filter((fac) => fac.department === selectedDept);

  return (
    <section id="faculty" className="py-20 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-blue-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200/50 shadow-xs">
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>Dedicated Mentors & Educators</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            Meet Our Experienced Faculty
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Our certified and passionate educators bring decades of pedagogical expertise, warmth, and individualized mentoring to every student at St. Xavier High School.
          </p>
        </div>

        {/* Department Filter Bar - Frosted Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {departments.map((dept) => {
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                id={`dept-filter-${dept.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedDept(dept)}
                className={`px-4.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg border-white/20'
                    : 'glass-panel text-slate-700 hover:text-blue-950 hover:bg-white/80 border-white/60 shadow-xs'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>

        {/* Faculty Grid - Frosted Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredFaculty.map((faculty) => (
            <div
              key={faculty.id}
              id={`faculty-card-${faculty.id}`}
              className="glass-panel rounded-3xl border border-white shadow-md overflow-hidden hover:shadow-xl glass-card-hover transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Faculty Photo */}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={faculty.image}
                    alt={faculty.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 glass-panel-dark text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-white/20 shadow-md">
                    {faculty.experienceYears}+ Yrs Exp
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 text-white backdrop-blur-[2px]">
                    <span className="text-xs font-semibold text-amber-300 tracking-wide">
                      {faculty.department}
                    </span>
                  </div>
                </div>

                {/* Faculty Details */}
                <div className="p-5">
                  <h3 className="font-serif font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-950 transition-colors">
                    {faculty.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-900 mb-2">
                    {faculty.designation}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{faculty.qualification}</span>
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {faculty.bio}
                  </p>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="px-5 pb-5 pt-0">
                <button
                  id={`faculty-details-btn-${faculty.id}`}
                  onClick={() => setActiveFacultyModal(faculty)}
                  className="w-full inline-flex items-center justify-center gap-1.5 glass-panel-subtle hover:bg-blue-900 hover:text-white text-blue-950 border border-white hover:border-blue-900 text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <span>View Full Profile & Bio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-700 group-hover:text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Teacher Quality & Training Pledge Strip - Frosted Glass */}
        <div className="glass-panel rounded-3xl border border-white p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/40">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-slate-900 mb-1">
                Continuous Teacher Development Programs
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Our faculty regularly undergoes pedagogical workshops, CBSE-aligned training modules, and digital classroom certifications to stay abreast of contemporary education methods.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 glass-panel-subtle text-blue-950 font-bold text-xs px-4 py-2.5 rounded-2xl border border-blue-200/50 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>100% Certified Teaching Staff</span>
            </span>
          </div>
        </div>

        {/* Faculty Modal - Frosted Glass */}
        {activeFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel bg-white/95 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={activeFacultyModal.image}
                    alt={activeFacultyModal.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      {activeFacultyModal.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-900">
                      {activeFacultyModal.designation}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {activeFacultyModal.department}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveFacultyModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600 mb-6">
                <div className="glass-panel-subtle p-4 rounded-2xl border border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Academic Credentials</div>
                  <div className="text-xs text-slate-900 font-bold">{activeFacultyModal.qualification}</div>
                  <div className="text-xs text-slate-600 mt-1">{activeFacultyModal.experienceYears} Years of Academic Teaching Experience</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Specialization & Focus</div>
                  <div className="text-xs text-slate-900 font-semibold">{activeFacultyModal.specialization}</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Teaching Philosophy & Bio</div>
                  <p className="text-xs leading-relaxed text-slate-700">{activeFacultyModal.bio}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveFacultyModal(null)}
                  className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md border border-white/20 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
