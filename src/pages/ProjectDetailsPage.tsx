import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Lock,
  Layers,
  Check,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { Topic, Subject } from '../types';
import { safeFetch } from '../lib/api';

interface ProjectDetailsPageProps {
  topicId: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ topicId, onNavigate }) => {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeFetch<{ topics: Topic[] }>('/topics')
      .then((res) => {
        const found = (res.data?.topics || []).find((t: Topic) => t.id === topicId);
        setTopic(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading topic syllabus and chapter structure...
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Topic Not Found</h2>
        <button
          onClick={() => onNavigate('projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Topics Directory
        </button>
      </div>
    );
  }

  const isAvail = topic.status === 'AVAILABLE';

  const chaptersOutline = [
    {
      num: 1,
      title: 'Introduction, Sectoral Context & Background',
      pages: '22 Pages',
      desc: 'Industry macro determinants, problem statement, research significance, and scope.'
    },
    {
      num: 2,
      title: 'Literature Review & Theoretical Syntheses',
      pages: '24 Pages',
      desc: '35+ Empirical study matrices, theoretical paradigms, and critical research gap formulation.'
    },
    {
      num: 3,
      title: 'Conceptual Framework, Hypotheses & Variable Operationalization',
      pages: '22 Pages',
      desc: 'Independent, dependent, and moderating variables, structural path model, and formal null hypotheses.'
    },
    {
      num: 4,
      title: 'Research Methodology, Sampling Architecture & Instrument Validation',
      pages: '24 Pages',
      desc: 'Positivist mixed-methods design, stratified random sampling (N=250), Cronbach alpha (0.88), and ethical compliance.'
    },
    {
      num: 5,
      title: 'Comprehensive Empirical Data Analysis & Econometric Modeling',
      pages: '30 Pages',
      desc: 'Descriptive frequency profiles, cross-tabulations, bivariate correlation matrices, and OLS multiple regression models.'
    },
    {
      num: 6,
      title: 'Empirical Findings, Hypothesis Testing & Deep Discussion',
      pages: '18 Pages',
      desc: 'Formal statistical acceptance/rejection table, theoretical alignment, and organizational comparative benchmarking.'
    },
    {
      num: 7,
      title: 'Strategic Implications, Practical Recommendations & Phased Roadmap',
      pages: '14 Pages',
      desc: '3-phase strategic implementation blueprint, executive risk matrices, policy recommendations, and conclusion.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <button
        onClick={() => onNavigate('projects')}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects Directory
      </button>

      {/* Header Topic Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase">
              {topic.program} • {topic.courseCode}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Session 2025–2026</span>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
              isAvail
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAvail ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {topic.status === 'AVAILABLE' ? 'Available for Allocation' : 'Currently Reserved'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {topic.title}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {topic.description}
        </p>

        {/* Focus Areas */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Key Academic Constructs & Focus Areas:
          </p>
          <div className="flex flex-wrap gap-2">
            {topic.focusAreas.map((f, i) => (
              <span
                key={i}
                className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Highlight Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">150+ Pages</div>
            <div className="text-[11px] text-slate-500">Programmatic Guarantee</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Single Lock</div>
            <div className="text-[11px] text-slate-500">Atomic Student Assignment</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-lg font-bold text-slate-900 dark:text-white">PDF + DOCX</div>
            <div className="text-[11px] text-slate-500">Instant Download</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">Full Synopsis</div>
            <div className="text-[11px] text-slate-500">Guide Approval Form</div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <div className="text-xs text-slate-400">Complete 150+ Page Dissertation Package:</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">₹1,499 <span className="text-xs text-slate-400 font-normal">incl. all taxes</span></div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('synopsis-generator', { topicId: topic.id, courseCode: topic.courseCode, program: topic.program, title: topic.title })}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-blue-500" />
              <span>Generate Synopsis (Proposal)</span>
            </button>

            {isAvail ? (
              <button
                onClick={() => onNavigate('checkout', { topicId: topic.id, courseCode: topic.courseCode, program: topic.program })}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Reserve Full Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"
              >
                Topic Already Allocated
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7 Chapters Breakdown Accordion / List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Complete 7-Chapter Academic Blueprint
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized IGNOU Project Report structure generated and compiled by our engine
          </p>
        </div>

        <div className="space-y-3">
          {chaptersOutline.map((ch) => (
            <div
              key={ch.num}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                    Chapter {ch.num}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ch.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-0 sm:pl-1">{ch.desc}</p>
              </div>

              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
                {ch.pages}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Forms Included */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Included Front Matter & Institutional Forms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Official IGNOU Cover Page
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Guide Approval & Certificate Form
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Student Declaration Form
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Acknowledgement & Dedication
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Executive Abstract & Keywords
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Primary Survey Questionnaire
          </div>
        </div>
      </div>
    </div>
  );
};
