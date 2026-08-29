import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Calendar,
  FileCheck,
  UserCheck,
  Send,
  Sparkles,
  PhoneCall,
  Clock,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { SCHOOL_INFO } from '../data/schoolData';
import { AdmissionInquiry } from '../types';
import { DateInput } from './common/DateInput';

export const AdmissionsSection: React.FC = () => {
  const [formData, setFormData] = useState<AdmissionInquiry>({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    gradeApplying: 'Playgroup / Nursery',
    dateOfBirth: '',
    gender: 'Male',
    previousSchool: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const gradesList = [
    'Playgroup / Nursery',
    'LKG (Lower Kindergarten)',
    'UKG (Upper Kindergarten)',
    'Class I',
    'Class II',
    'Class III',
    'Class IV',
    'Class V',
    'Class VI',
    'Class VII',
    'Class VIII',
    'Class IX',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.parentName.trim() || !formData.phone.trim()) {
      setSubmitResult({
        success: false,
        message: 'Please fill out all required fields (Student Name, Parent Name, and Phone Number).',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await inquiryService.submitInquiry(formData);
      setSubmitResult({ success: true, message: res.message });
      setFormData({
        studentName: '',
        parentName: '',
        email: '',
        phone: '',
        gradeApplying: 'Playgroup / Nursery',
        dateOfBirth: '',
        gender: 'Male',
        previousSchool: '',
        message: '',
      });
    } catch (err) {
      setSubmitResult({
        success: false,
        message: 'Something went wrong while submitting. Please call the admission desk directly.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="admissions" className="py-20 relative overflow-hidden">
      {/* Ambient glowing blob */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-amber-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-amber-300/50 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Enrollment & Admissions 2026–2027</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            Join the St. Xavier Family
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            We welcome young learners from Playgroup/Nursery up to Class IX into our stimulating and caring educational community in Tihidi, Bhadrak.
          </p>
        </div>

        {/* 4-Step Admission Journey - Frosted Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-xs border border-white/20">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">1. Submit Inquiry</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fill out the online application form below or collect the admission kit from our school office.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-xs border border-white/20">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">2. Campus Interaction</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Visit our campus with your child for a friendly readiness dialogue and campus walkthrough.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-xs border border-white/20">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">3. Document Check</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Submit birth certificate, transfer certificate (for Class II+), passport photos & Aadhaar copies.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-xs border border-white/20">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">4. Admission Finalized</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Complete enrollment formalities, receive the uniform & booklist kit, and begin your educational journey!
            </p>
          </div>
        </div>

        {/* Form and Document Requirements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Requirements & Age Criteria - Frosted Dark Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Age Criteria Card */}
            <div className="glass-panel-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/15">
              <h3 className="font-serif font-bold text-xl mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Age Criteria (As of March 31, 2026)</span>
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-blue-100 mb-6">
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="font-semibold">Nursery / Playgroup</span>
                  <span className="text-amber-300 font-bold">3+ Years</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="font-semibold">LKG (Lower Kindergarten)</span>
                  <span className="text-amber-300 font-bold">4+ Years</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="font-semibold">UKG (Upper Kindergarten)</span>
                  <span className="text-amber-300 font-bold">5+ Years</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="font-semibold">Class I</span>
                  <span className="text-amber-300 font-bold">6+ Years</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="font-semibold">Classes II to IX</span>
                  <span className="text-amber-300 font-bold">As per Transfer Cert.</span>
                </li>
              </ul>

              {/* Required Documents */}
              <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>Documents Checklist</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Original Birth Certificate (Municipality/Panchayat)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Original Transfer Certificate (TC) for Class II onwards</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>4 Passport-size photographs of the student</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Copy of Aadhaar card of student and parents</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Report card from previous recognized school</span>
                </div>
              </div>
            </div>

            {/* Direct Admission Helpline */}
            <div className="glass-panel rounded-3xl p-6 border border-white shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Admission Desk Helpline</h4>
                <a
                  href={`tel:${SCHOOL_INFO.phonePrimary}`}
                  className="font-extrabold text-blue-950 hover:text-blue-700 text-base"
                >
                  {SCHOOL_INFO.phonePrimary}
                </a>
                <p className="text-xs text-slate-600">Mon - Sat: 8:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Admission Form - Frosted Glass */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-xl">
              <div className="mb-6 pb-4 border-b border-slate-200/60">
                <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">
                  Online Admission Inquiry Form
                </h3>
                <p className="text-xs text-slate-500">
                  Please submit details below. Our admissions counselor will call you to schedule interaction and campus tour.
                </p>
              </div>

              {submitResult && (
                <div
                  className={`p-4 rounded-2xl mb-6 text-sm flex items-start gap-3 border shadow-xs ${
                    submitResult.success
                      ? 'bg-emerald-500/15 border-emerald-200 text-emerald-950'
                      : 'bg-red-500/15 border-red-200 text-red-950'
                  }`}
                >
                  {submitResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {submitResult.success ? 'Inquiry Submitted!' : 'Submission Failed'}
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed">{submitResult.message}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-student-name">
                      Student’s Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="inq-student-name"
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="e.g. Subhashree Dash"
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    />
                  </div>

                  {/* Parent / Guardian Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-parent-name">
                      Parent / Guardian Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="inq-parent-name"
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra Dash"
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-phone">
                      Mobile / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="inq-phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 94370 00000"
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-email">
                      Email Address (Optional)
                    </label>
                    <input
                      id="inq-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Grade Applying */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-grade">
                      Class / Grade Applying For <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="inq-grade"
                      value={formData.gradeApplying}
                      onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    >
                      {gradesList.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-gender">
                      Gender
                    </label>
                    <select
                      id="inq-gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    >
                      <option value="Male">Boy (Male)</option>
                      <option value="Female">Girl (Female)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DOB */}
                  <div>
                    <DateInput
                      id="inq-dob"
                      label="Date of Birth"
                      value={formData.dateOfBirth}
                      onChange={(displayVal, isoVal) =>
                        setFormData({ ...formData, dateOfBirth: isoVal || displayVal })
                      }
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  {/* Previous School */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-prev-school">
                      Previous School Attended (If any)
                    </label>
                    <input
                      id="inq-prev-school"
                      type="text"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                      placeholder="School name & city"
                      className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inq-message">
                    Special Inquiries / Bus Transport Request
                  </label>
                  <textarea
                    id="inq-message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide your village/location in Tihidi or any specific query..."
                    className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  id="inq-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md border border-white/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{submitting ? 'Submitting Application...' : 'Submit Admission Inquiry'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
