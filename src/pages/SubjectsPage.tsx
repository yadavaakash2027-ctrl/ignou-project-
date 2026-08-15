import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, ArrowRight, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { Subject, Program } from '../types';
import { safeFetch } from '../lib/api';

interface SubjectsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onNavigate }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProg, setSelectedProg] = useState<string>('ALL');

  useEffect(() => {
    safeFetch<{ subjects: Subject[] }>('/subjects')
      .then((res) => setSubjects(res.data?.subjects || []))
      .catch(console.error);

    safeFetch<{ programs: Program[] }>('/programs')
      .then((res) => setPrograms(res.data?.programs || []))
      .catch(console.error);
  }, []);

  const filtered = subjects.filter(
    (s) => selectedProg === 'ALL' || s.program.toUpperCase() === selectedProg.toUpperCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            IGNOU Subject & Course Code Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Course structures, credit allocations, and subject syllabi with project dissertation components
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedProg('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedProg === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProg(p.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedProg === p.code
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((subj) => (
          <div
            key={subj.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                  {subj.program}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {subj.creditCount} Credits
                </span>
              </div>

              <div>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {subj.courseCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                  {subj.subjectName}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {subj.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Project / Dissertation Component Active
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => onNavigate('projects', { program: subj.program, courseCode: subj.courseCode })}
                className="w-full py-2.5 bg-slate-900 text-white dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>View {subj.courseCode} Topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
