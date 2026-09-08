import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileText,
  FileCheck,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Program, Topic, Subject } from '../types';
import { safeFetch } from '../lib/api';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    safeFetch<{ programs: Program[] }>('/programs')
      .then((res) => setPrograms(res.data?.programs || []))
      .catch(console.error);

    safeFetch<{ topics: Topic[] }>('/topics')
      .then((res) => setTopics(res.data?.topics || []))
      .catch(console.error);

    safeFetch<{ subjects: Subject[] }>('/subjects')
      .then((res) => setSubjects(res.data?.subjects || []))
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { q: searchQuery.trim() });
    }
  };

  const availableTopicsCount = topics.filter((t) => t.status === 'AVAILABLE').length;

  const faqs = [
    {
      q: 'Does the generated project report strictly guarantee 150+ pages?',
      a: 'Yes. Our academic generation engine programmatically compiles all 7 chapters, empirical tables, case studies, questionnaires, and references into a high-density A4 format with verified page count validation ensuring each project is 150+ rendered pages.'
    },
    {
      q: 'How does Atomic Topic Allocation work?',
      a: 'To maintain academic integrity and prevent duplicate submissions across IGNOU study centers, each topic is assigned exclusively upon reservation and permanently marked as COMPLETED once generated for a student. No two students receive the same project dissertation.'
    },
    {
      q: 'Are Guide Approval Certificate and Student Declaration included?',
      a: 'Yes. Every project includes an authentic IGNOU cover page, Certificate of Authenticity with Project Guide credentials, Student Declaration of Originality, Acknowledgement, Executive Abstract, Table of Contents, and References formatted to official IGNOU project guidelines.'
    },
    {
      q: 'In what formats can I download the project?',
      a: 'You receive instant downloads in both high-resolution vector PDF (ready for printing/binding) and fully editable Microsoft Word (.docx) format so you can personalize your local field survey findings.'
    },
    {
      q: 'What is the Academic Integrity Policy of this platform?',
      a: 'All documents generated are provided as personalized academic drafts, structural frameworks, and research reference materials. Candidates are expected to review, customize, verify, and incorporate their authentic local data prior to official university evaluation.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>2025–2026 Academic Session | Guaranteed 150+ Page Projects</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Professional IGNOU Projects, <br className="hidden sm:inline" />
            <span className="text-blue-300">Synopsis & Topic Allocation</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Full-length 150+ page research dissertations, comprehensive synopses, and atomic one-time topic allocation for M.Com, MBA, BCA, MCA, B.Com, PGDCA & BA/BAG students.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-4">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-2xl border border-blue-200 dark:border-slate-700">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter Course Code (e.g. MCOP-001, MMPP-001, BCSP-064) or Subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-slate-900 dark:text-white bg-transparent text-sm focus:outline-hidden placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition whitespace-nowrap"
              >
                Find Topic
              </button>
            </div>
          </form>

          {/* Hero Stats */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-white">150+</div>
              <div className="text-xs text-blue-200">Strict Page Guarantee</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-emerald-400">{availableTopicsCount}+</div>
              <div className="text-xs text-blue-200">Available Fresh Topics</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-white">7 Disciplines</div>
              <div className="text-xs text-blue-200">M.Com, MBA, BCA, MCA +</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-amber-300">PDF + DOCX</div>
              <div className="text-xs text-blue-200">Instant Dual Formats</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROGRAM SELECTOR CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Select Your IGNOU Program
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse approved project courses and allocated topic pools by degree
            </p>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="mt-4 md:mt-0 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View All Programs <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((prog) => {
            const progTopics = topics.filter((t) => t.program.toUpperCase() === prog.code.toUpperCase());
            const availableCount = progTopics.filter((t) => t.status === 'AVAILABLE').length;

            return (
              <div
                key={prog.id}
                onClick={() => onNavigate('projects', { program: prog.code })}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                      {prog.level}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {availableCount} Topics
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {prog.name} ({prog.code})
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {prog.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Course Codes:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {prog.projectCourseCodes.map((cc) => (
                        <span
                          key={cc}
                          className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {cc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Explore Project Topics</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SYNOPSIS & PROPOSAL GENERATOR SPOTLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-300/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official 16-Point Research Blueprint & Supervisor Form</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Instant IGNOU Synopsis Generator
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Generate a complete, structured, topic-specific project proposal with Review of Literature matrix, Hypotheses, Methodology, Chapterization, and an editable Guide Bio-Data Form.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-blue-200 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-white/10">16 Structured Points</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10">Real APA 7th Citations</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10">Editable Guide Bio-Data</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10">PDF & DOCX Export</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigate('synopsis-generator')}
              className="px-6 py-3.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-blue-700" />
              <span>Generate My Synopsis Now</span>
              <ArrowRight className="w-4 h-4 text-blue-700" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. 4-STEP ACADEMIC GENERATION WORKFLOW */}
      <section className="bg-slate-50 dark:bg-slate-800/50 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              The 4-Step Academic Engineering Process
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              How IGNOU Project synthesizes, formats, validates, and serves 150+ page dissertations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Unique Topic Allocation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dedicated research topics are allocated directly to each candidate to prevent overlap across regional centers.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Chapter-by-Chapter AI
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Content is generated sequentially across 7 structured chapters with econometric tables, literature matrix, and case studies.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                150+ Page Validation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Programmatic PDF compiler calculates exact rendered page count and auto-expands empirical sections if under 150 pages.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Instant PDF & DOCX
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Download printable high-res PDF and editable Word DOCX with guide certificate, declaration, and survey questionnaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PDF STRUCTURE & CHAPTER PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30">
                Official Dissertation Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Complete Academic Standard with Front Matter, Data Tables & Appendices
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every generated project strictly complies with IGNOU dissertation format, containing all required institutional sections:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>University Header & Cover Page</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Guide Certificate & Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Student Declaration Form</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Executive Abstract & Keywords</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>7 Full Academic Chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10+ Empirical Data Tables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>40+ APA 7th References</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Primary Survey Questionnaire</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('projects')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  Browse Available Topics <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual preview card */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">Table of Contents Preview</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  154 Pages Total
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 py-1">
                  <span>Certificate of Guide Approval</span>
                  <span className="text-blue-400">Page ii</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1">
                  <span>Student Declaration of Originality</span>
                  <span className="text-blue-400">Page iii</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 1: Introduction & Background</span>
                  <span className="text-blue-400">Page 1–22</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 2: Literature Review Matrix</span>
                  <span className="text-blue-400">Page 23–45</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 3: Conceptual Framework</span>
                  <span className="text-blue-400">Page 46–68</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 4: Research Methodology</span>
                  <span className="text-blue-400">Page 69–92</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 5: Data Analysis & Tables</span>
                  <span className="text-blue-400">Page 93–122</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 6: Findings & Validation</span>
                  <span className="text-blue-400">Page 123–140</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 py-1 font-bold text-white">
                  <span>Chapter 7: Strategy & Roadmap</span>
                  <span className="text-blue-400">Page 141–154</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACADEMIC INTEGRITY NOTICE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
              Important Academic Ethics & Usage Guidelines
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
              All generated projects, synopses, and research drafts are provided as personalized academic project drafts and reference research material to assist students in understanding methodology and structuring. Students should review, verify, understand, edit and personalize the material before official university evaluation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('academic-integrity')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* 6. FAQS ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Common questions about IGNOU project guidelines, page counts, and downloads
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
