import React, { useState } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';

export const AboutPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <button
      onClick={() => onNavigate('home')}
      className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Home
    </button>
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
        About IGNOU Project Hub
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        IGNOU Project Hub was engineered to solve the persistent challenges faced by distance education students preparing major project reports and dissertations. Distance learners often lack direct access to continuous on-campus research methodology counseling, statistical modeling software, and structured dissertation blueprints.
      </p>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Our specialized academic synthesis engine generates comprehensive, 150+ page research frameworks adhering strictly to the structural and methodological requirements laid down by IGNOU faculties across Management (MBA), Commerce (M.Com, B.Com), Computer Sciences (BCA, MCA, PGDCA), and Social Sciences (BA/BAG).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-center">
          <div className="text-2xl font-bold text-blue-600">150+ Pages</div>
          <div className="text-xs text-slate-500 mt-1">Guaranteed Depth</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-center">
          <div className="text-2xl font-bold text-emerald-600">Single Lock</div>
          <div className="text-xs text-slate-500 mt-1">No Duplicate Topics</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-center">
          <div className="text-2xl font-bold text-purple-600">Dual Export</div>
          <div className="text-xs text-slate-500 mt-1">PDF & Word DOCX</div>
        </div>
      </div>
    </div>
  </div>
);

export const ContactPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Academic Help Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have questions regarding course codes, topic allocation, or 150+ page format specifications? Reach out to our academic support team.
          </p>
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-blue-600" /> support@ignouprojecthub.com
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-blue-600" /> +91 98765 43210 (10 AM – 6 PM IST)
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-blue-600" /> Sector 62, Institutional Area, Noida, UP
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Send an Academic Query</h2>
          {submitted ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">
              Thank you! Our research coordinator will respond within 24 hours.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">Your Name</label>
                <input required type="text" className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Enrollment & Program</label>
                <input required type="text" placeholder="e.g. 2300456789 (MBA)" className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Query</label>
                <textarea required rows={3} className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md">
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    {
      q: 'How does the platform ensure exactly 150+ pages in PDF?',
      a: 'The PDF compilation engine renders all 7 chapters at 1.5 line spacing with justified text, standardized 1-inch margins, complete data tables, case studies, questionnaires, and bibliography. If the measured page buffer is < 150 pages, the engine programmatically appends expanded econometric analyses until the 150-page threshold is validated.'
    },
    {
      q: 'Is this project safe to submit to IGNOU?',
      a: 'The projects are provided as comprehensive academic drafts and structural frameworks. You should review, verify, and personalize the empirical survey findings with your authentic local data prior to official submission.'
    },
    {
      q: 'Can I edit the generated project?',
      a: 'Yes. Every project includes instant downloads of both a printable high-resolution PDF and a fully editable Microsoft Word (.docx) document.'
    },
    {
      q: 'What if I need a topic for a course code not listed?',
      a: 'Administrators continuously seed fresh topics across all IGNOU faculties. You can also request a custom topic from the contact desk.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h1>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden p-5 shadow-2xs">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left font-bold text-sm text-slate-900 dark:text-white flex justify-between items-center"
              >
                <span>{faq.q}</span>
                {openIdx === idx ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openIdx === idx && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <button
      onClick={() => onNavigate('home')}
      className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Home
    </button>
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
      <p>We respect the confidentiality and privacy of our student users. We collect only necessary details (Student Name, Email, Mobile Number, Program, and Enrollment Number) to allocate unique academic project topics and personalize dissertation front matter.</p>
      <p>We do not sell, rent, or distribute candidate records to any third parties. All file downloads and transaction logs are encrypted using 256-bit SSL protocols.</p>
    </div>
  </div>
);

export const TermsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <button
      onClick={() => onNavigate('home')}
      className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Home
    </button>
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">Terms & Conditions</h1>
      <p>By accessing and purchasing academic project drafts from IGNOU Project Hub, candidates acknowledge that all generated documents serve exclusively as educational references and draft frameworks.</p>
      <p>Candidates are solely responsible for reviewing and updating their project with real field survey data before submitting to their respective IGNOU regional study centers.</p>
    </div>
  </div>
);
