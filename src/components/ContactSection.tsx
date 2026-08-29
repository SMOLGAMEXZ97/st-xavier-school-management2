import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { SCHOOL_INFO, FAQS } from '../data/schoolData';
import { contactService } from '../services/inquiryService';
import { ContactMessage } from '../types';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactMessage>({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS[0].id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setSubmitResult({
        success: false,
        message: 'Please provide your Name, Phone Number, and Message.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await contactService.sendMessage(formData);
      setSubmitResult({ success: true, message: res.message });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    } catch {
      setSubmitResult({
        success: false,
        message: 'Could not send message. Please contact us via phone directly at ' + SCHOOL_INFO.phonePrimary,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      {/* Ambient background blob */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 glass-panel-subtle text-blue-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200/50 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-700" />
            <span>Reach Out & Visit Us</span>
          </div>
          <h2 className="font-serif font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-4">
            Contact St. Xavier High School, Tihidi
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Have questions regarding admissions, curriculum, or school bus transport? Our administrative desk is here to assist you.
          </p>
        </div>

        {/* Contact Info Cards - Frosted Glass */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {/* Address Card */}
          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-900 flex items-center justify-center mb-4 border border-blue-200/50">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Campus Address</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
              {SCHOOL_INFO.location}
            </p>
            <span className="text-[11px] font-semibold text-blue-900 glass-panel-subtle px-2.5 py-1 rounded-lg border border-blue-200/50">
              Near Block Office / Main Road
            </span>
          </div>

          {/* Phone Numbers */}
          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center mb-4 border border-amber-200/50">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Phone Helpline</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-1">
              <a href={`tel:${SCHOOL_INFO.phonePrimary}`} className="font-semibold text-blue-900 hover:underline">
                {SCHOOL_INFO.phonePrimary}
              </a>
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              <a href={`tel:${SCHOOL_INFO.phoneSecondary}`} className="font-semibold text-blue-900 hover:underline">
                {SCHOOL_INFO.phoneSecondary}
              </a>
            </p>
          </div>

          {/* Email Contacts */}
          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200/50">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Official Email</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-1 break-all">
              <a href={`mailto:${SCHOOL_INFO.email}`} className="font-medium text-blue-900 hover:underline">
                {SCHOOL_INFO.email}
              </a>
            </p>
            <p className="text-xs text-slate-500">Admissions & General Enquiries</p>
          </div>

          {/* Working Hours */}
          <div className="glass-panel rounded-3xl p-6 border border-white shadow-md glass-card-hover transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-700 flex items-center justify-center mb-4 border border-purple-200/50">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Office Hours</h3>
            <p className="text-xs sm:text-sm text-slate-700 font-semibold mb-1">
              Mon – Sat: 8:00 AM – 2:30 PM
            </p>
            <p className="text-xs text-slate-500">
              (Public visitors welcomed during working hours)
            </p>
          </div>
        </div>

        {/* Contact Form & Directions Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          {/* Send Message Form - Frosted Panel */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-xl">
            <div className="mb-6 pb-4 border-b border-slate-200/60">
              <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">
                Send a Message to the School Office
              </h3>
              <p className="text-xs text-slate-500">
                Please leave your details below and our team will get back to you promptly.
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
                    {submitResult.success ? 'Message Sent!' : 'Error Sending'}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed">{submitResult.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="msg-name">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="msg-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priyabrata Rout"
                    className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="msg-phone">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="msg-phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 94370 00000"
                    className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="msg-email">
                    Email Address
                  </label>
                  <input
                    id="msg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="msg-subject">
                    Subject / Category
                  </label>
                  <select
                    id="msg-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Admission Question">Admission Question</option>
                    <option value="Bus Route & Transport">Bus Route & Transport</option>
                    <option value="Fee Structure & Documents">Fee Structure & Documents</option>
                    <option value="Academic Feedback">Academic Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="msg-text">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="msg-text"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist you today? Please share any specific question..."
                  className="w-full px-3.5 py-2.5 glass-input text-sm text-slate-900 resize-none"
                />
              </div>

              <button
                id="msg-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md border border-white/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Sending Message...' : 'Send Message to School'}</span>
              </button>
            </form>
          </div>

          {/* Location & Directions Card - Frosted Dark Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel-dark text-white rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Navigation className="w-4 h-4" />
                <span>How to Reach Us</span>
              </div>
              <h3 className="font-serif font-bold text-xl mb-3">
                Located in Tihidi, Bhadrak
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                St. Xavier High School is strategically positioned on the main arterial route in Tihidi, making it easily accessible from Bhadrak town, Pirahat, Chandbali, and adjoining rural panchayats.
              </p>

              {/* Distances strip */}
              <div className="space-y-2.5 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>From Bhadrak Railway Station / Town</span>
                  <span className="font-bold text-amber-300">~18 km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>From Pirahat Junction</span>
                  <span className="font-bold text-amber-300">~6 km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>From Chandbali Route</span>
                  <span className="font-bold text-amber-300">Direct Highway Access</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                <a
                  href={`https://maps.google.com/?q=St+Xavier+High+School+Tihidi+Bhadrak+Odisha`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>

            {/* School Emergency / Helpdesk Note */}
            <div className="glass-panel rounded-3xl border border-white p-5 text-blue-950 shadow-md">
              <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Parents & Visitor Protocol</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                For student security, all campus visitors are requested to register at the main security gate upon arrival and obtain a visitor pass before proceeding to the administrative office.
              </p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions (FAQ) Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 glass-panel-subtle text-amber-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-amber-300/50 shadow-xs">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Got Questions?</span>
            </div>
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  id={`faq-${faq.id}`}
                  className="glass-panel rounded-2xl border border-white shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none hover:bg-white/50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif font-bold text-slate-900 text-sm sm:text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-900' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200/50 glass-panel-subtle">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
