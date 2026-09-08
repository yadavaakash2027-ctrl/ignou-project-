import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Clock,
  Lock,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { Topic, Program, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../lib/api';

interface ProjectsPageProps {
  initialProgram?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ initialProgram, onNavigate }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState<string>(initialProgram || 'ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialProgram) {
      setSelectedProgram(initialProgram);
    }
  }, [initialProgram]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topRes, progRes, subjRes] = await Promise.all([
        safeFetch<{ topics: Topic[] }>('/topics'),
        safeFetch<{ programs: Program[] }>('/programs'),
        safeFetch<{ subjects: Subject[] }>('/subjects')
      ]);

      setTopics(topRes.data?.topics || []);
      setPrograms(progRes.data?.programs || []);
      setSubjects(subjRes.data?.subjects || []);
    } catch (err) {
      console.error('Failed to load project catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter((t) => {
    if (selectedProgram !== 'ALL' && t.program.toUpperCase() !== selectedProgram.toUpperCase()) {
      return false;
    }
    if (selectedCourse !== 'ALL' && t.courseCode.toUpperCase() !== selectedCourse.toUpperCase()) {
      return false;
    }
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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

  const availableCount = filteredTopics.filter((t) => t.status === 'AVAILABLE').length;

  const handleSelectTopic = (topic: Topic) => {
    if (topic.status === 'AVAILABLE') {
      onNavigate('checkout', { topicId: topic.id, courseCode: topic.courseCode, program: topic.program });
    } else {
      onNavigate('project-details', { topicId: topic.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              IGNOU Project & Topic Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
              Session 2025–26
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse approved academic project topics with atomic single-student allocation and guaranteed 150+ page outputs
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start md:self-auto px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Availability
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Search Keywords / Topic
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search topic or course code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Program Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Program Discipline
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedCourse('ALL');
              }}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Programs (MBA, M.Com, BCA, MCA...)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Course Code Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Course Code
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Course Codes</option>
              {subjects
                .filter((s) => selectedProgram === 'ALL' || s.program.toUpperCase() === selectedProgram.toUpperCase())
                .map((s) => (
                  <option key={s.id} value={s.courseCode}>
                    {s.courseCode} — {s.subjectName}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Allocation Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available for Allocation</option>
              <option value="RESERVED">Currently Reserved</option>
              <option value="USED">Completed / Allocated</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Status Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredTopics.length}</strong> topics (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{availableCount} Available</span>)
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Used / Finalized
            </span>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading academic topic repository...</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Matching Topics Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your program filter or search terms. Alternatively, use our atomic topic allocator to auto-generate a fresh topic.
          </p>
          <button
            onClick={() => {
              setSelectedProgram('ALL');
              setSelectedCourse('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const isAvail = topic.status === 'AVAILABLE';
            const isReserved = topic.status === 'RESERVED';

            return (
              <div
                key={topic.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${
                  isAvail
                    ? 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                    : 'border-slate-200/60 dark:border-slate-800 opacity-90'
                } p-6 flex flex-col justify-between transition group`}
              >
                <div className="space-y-3">
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">
                      {topic.program} • {topic.courseCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isAvail
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : isReserved
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAvail ? 'bg-emerald-500' : isReserved ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      ></span>
                      {topic.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onNavigate('project-details', { topicId: topic.id })}
                    className="text-base font-bold text-slate-900 dark:text-white leading-snug cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                  >
                    {topic.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {topic.description}
                  </p>

                  {/* Focus Areas */}
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Research Constructs:
                    </p>
                    <div className="flex flex-wrap gap-1">
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
                </div>

                {/* Footer action & specs */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-blue-500" /> 150+ Page Verified
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Single Student Lock
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigate('synopsis-generator', { topicId: topic.id, courseCode: topic.courseCode, program: topic.program, title: topic.title })}
                      className="py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Synopsis</span>
                    </button>

                    {isAvail ? (
                      <button
                        onClick={() => handleSelectTopic(topic)}
                        className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('project-details', { topicId: topic.id })}
                        className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                      >
                        Outline
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
