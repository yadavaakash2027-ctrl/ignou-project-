import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Layers, ArrowRight, Filter, ShieldCheck, FileText, Check } from 'lucide-react';
import { Topic, Program, Subject } from '../types';
import { safeFetch } from '../lib/api';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    safeFetch<{ topics: Topic[] }>('/topics')
      .then((res) => setTopics(res.data?.topics || []))
      .catch(console.error);

    safeFetch<{ programs: Program[] }>('/programs')
      .then((res) => setPrograms(res.data?.programs || []))
      .catch(console.error);
  }, []);

  const filteredTopics = topics.filter((t) => {
    if (selectedProgram !== 'ALL' && t.program.toUpperCase() !== selectedProgram.toUpperCase()) {
      return false;
    }
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
      return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCourse = t.courseCode.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchFocus = t.focusAreas.some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchCourse && !matchDesc && !matchFocus) {
        return false;
      }
    }
    return true;
  });

  const popularSearches = [
    'MCOP-001',
    'MMPP-001',
    'BCSP-064',
    'MCSP-060',
    'Financial Literacy',
    'Supply Chain Optimization',
    'Machine Learning',
    'HR Analytics'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Search IGNOU Academic Topics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Find approved project dissertations by course code, research keywords, or discipline
        </p>

        {/* Search input bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type course code (e.g. MCOP-001) or research keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-blue-500/50 dark:border-blue-500/40 rounded-2xl text-slate-900 dark:text-white text-base shadow-lg focus:outline-hidden focus:border-blue-600"
          />
          <Search className="w-5 h-5 text-blue-500 absolute left-4 top-4" />
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-semibold">Popular:</span>
          {popularSearches.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(s)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Results */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Showing <span className="text-blue-600 dark:text-blue-400">{filteredTopics.length}</span> results
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.code}>
                {p.code} ({p.name})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="USED">Used</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Topics Found for "{query}"</h3>
            <p className="text-xs text-slate-500">Try searching for broader terms like "Marketing", "Finance", or "Database".</p>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isAvail = topic.status === 'AVAILABLE';

            return (
              <div
                key={topic.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase">
                      {topic.program} • {topic.courseCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isAvail
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>

                  <h3
                    onClick={() => onNavigate('project-details', { topicId: topic.id })}
                    className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
                  >
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {topic.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {topic.focusAreas.map((f, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-center justify-between gap-2">
                  <div className="text-right hidden md:block">
                    <span className="text-xs text-slate-400">Verified Format</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">150+ Pages</div>
                  </div>

                  {isAvail ? (
                    <button
                      onClick={() => onNavigate('checkout', { topicId: topic.id, courseCode: topic.courseCode, program: topic.program })}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                    >
                      <span>Reserve & Generate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('project-details', { topicId: topic.id })}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                    >
                      View Outline
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
