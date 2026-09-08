import React from 'react';
import { ShieldCheck, AlertCircle, FileCheck, CheckCircle2, BookOpen, ArrowLeft } from 'lucide-react';

interface AcademicIntegrityPageProps {
  onNavigate: (page: string) => void;
}

export const AcademicIntegrityPage: React.FC<AcademicIntegrityPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-red-900 dark:text-red-200">
              Academic Integrity & Research Ethics Policy
            </h1>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              Official Candidate Usage Mandates for IGNOU Project Drafts
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 leading-relaxed">
          All generated projects, synopses, empirical tables, and dissertations provided by IGNOU Project are strictly classified as <strong>academic research drafts and structural reference materials</strong> designed to assist students in understanding methodology, chapter structuring, data visualization, and theoretical modeling.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Candidate Responsibilities & Verification Protocol
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">1. Review, Verification and Understanding</strong>
              Students must thoroughly read, comprehend, and critique all chapters, empirical matrices, and findings generated in the draft before formal submission to their assigned guide or university study center.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">2. Local Field Data Personalization</strong>
              The sample tables and questionnaires generated serve as representative statistical models. Students are required to conduct actual field surveys and substitute the sample metrics with their authentic primary observations.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">3. Viva Voce Preparation</strong>
              Candidates must be prepared to defend the research methodology, theoretical frameworks, and statistical conclusions during their official university viva voce examinations.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Non-Affiliation Disclaimer</h3>
          <p>
            IGNOU Project is an independent academic software platform and is not affiliated with, sponsored by, or endorsed by Indira Gandhi National Open University (IGNOU). IGNOU, course codes, and curriculum references are used solely for descriptive educational identification purposes.
          </p>
        </div>
      </div>
    </div>
  );
};
