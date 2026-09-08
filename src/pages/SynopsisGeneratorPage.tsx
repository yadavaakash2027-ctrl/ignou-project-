import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
  School,
  Calendar,
  Layers,
  Edit3,
  RefreshCw,
  Save,
  Check,
  ChevronRight,
  Printer,
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { SynopsisData, Program, Subject, Topic, Student } from '../types';
import { safeFetch, safePost, safePut, buildApiUrl } from '../lib/api';
import { Synopsis11SectionViewer } from '../components/Synopsis11SectionViewer';

interface SynopsisGeneratorPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  currentUser?: Student | null;
  initialTopicId?: string;
  initialProgram?: string;
  initialCourseCode?: string;
  initialTitle?: string;
}

const PROGRAM_COURSES: Record<string, Array<{ code: string; name: string }>> = {
  MBA: [
    { code: 'MMPP-001', name: 'Project Course in MBA (Revised Curriculum)' },
    { code: 'MS-100', name: 'Project Work in Management (General MBA)' },
    { code: 'MS-28', name: 'Research Methodology for Management Decisions' },
    { code: 'MMPH-001', name: 'Human Resource Management Project' }
  ],
  MCA: [
    { code: 'MCSP-060', name: 'MCA Major Project & Software Development' },
    { code: 'MCS-224', name: 'Software Project Management & Implementation' },
    { code: 'MCS-044', name: 'Mini Project in Computer Applications' }
  ],
  BCA: [
    { code: 'BCSP-064', name: 'BCA Final Semester Major Project' },
    { code: 'BCSL-058', name: 'Computer Network & Web Systems Lab Project' }
  ],
  'M.Com': [
    { code: 'MCOP-001', name: 'M.Com Project Work in Commerce & Finance' },
    { code: 'MCO-021', name: 'Managerial Economics Research Project' },
    { code: 'MCO-003', name: 'Research Methodology and Statistical Analysis' }
  ],
  'B.Com': [
    { code: 'BCOE-141', name: 'Principles of Marketing Project' },
    { code: 'BCOE-143', name: 'Fundamentals of Financial Management Project' }
  ],
  PGDCA: [
    { code: 'MCSP-040', name: 'PGDCA Major Project Work' },
    { code: 'MCS-201', name: 'Programming in C/C++ Project' }
  ],
  BA: [
    { code: 'BECE-016', name: 'Economics Project Work' },
    { code: 'BPAE-104', name: 'Personnel Administration Project' }
  ]
};

export const SynopsisGeneratorPage: React.FC<SynopsisGeneratorPageProps> = ({
  onNavigate,
  currentUser,
  initialTopicId,
  initialProgram,
  initialCourseCode,
  initialTitle
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'viewer' | 'history'>('generate');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [program, setProgram] = useState<string>(initialProgram || currentUser?.program || 'MBA');
  const [courseCode, setCourseCode] = useState<string>(initialCourseCode || 'MMPP-001');
  const [subjectName, setSubjectName] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>(initialTitle || '');
  const [researchTopic, setResearchTopic] = useState<string>('');
  const [topicSelectionMode, setTopicSelectionMode] = useState<'directory' | 'custom'>('directory');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');

  // Candidate & Project Detailed Inputs
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState<string>(currentUser?.mobileNumber || '');
  const [projectType, setProjectType] = useState<string>('Software Development');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [preferredTechnologies, setPreferredTechnologies] = useState<string>('React, Node.js, Express, PostgreSQL, Tailwind CSS');
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');

  // Student Details
  const [studentName, setStudentName] = useState<string>(currentUser?.name || '');
  const [enrollmentNumber, setEnrollmentNumber] = useState<string>(currentUser?.enrollmentNumber || '');
  const [studyCenterCode, setStudyCenterCode] = useState<string>(currentUser?.studyCenterCode || 'SC-0700');
  const [studyCenterName, setStudyCenterName] = useState<string>('Regional Study Centre, IGNOU');
  const [regionalCenterCode, setRegionalCenterCode] = useState<string>('RC-07');
  const [regionalCenterName, setRegionalCenterName] = useState<string>('Delhi Regional Centre');
  const [sessionYear, setSessionYear] = useState<string>('2025–2026');

  // Guide Bio-Data State
  const [guideName, setGuideName] = useState<string>('');
  const [guideQualification, setGuideQualification] = useState<string>('');
  const [guideSpecialization, setGuideSpecialization] = useState<string>('');
  const [guideDesignation, setGuideDesignation] = useState<string>('');
  const [guideOrganization, setGuideOrganization] = useState<string>('');
  const [guideOfficialAddress, setGuideOfficialAddress] = useState<string>('');
  const [guideEmail, setGuideEmail] = useState<string>('');
  const [guideMobile, setGuideMobile] = useState<string>('');
  const [guideTeachingExp, setGuideTeachingExp] = useState<string>('');
  const [guideResearchExp, setGuideResearchExp] = useState<string>('');
  const [guideSupervisionExp, setGuideSupervisionExp] = useState<string>('');

  // Catalog Data
  const [topics, setTopics] = useState<Topic[]>([]);
  const [savedSynopses, setSavedSynopses] = useState<SynopsisData[]>([]);

  // Active Loaded Synopsis
  const [currentSynopsis, setCurrentSynopsis] = useState<SynopsisData | null>(null);
  const [activeViewerSection, setActiveViewerSection] = useState<string>('cover');
  const [isEditing, setIsEditing] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [regenModalSection, setRegenModalSection] = useState<string | null>(null);

  // Sync course choices when program changes
  useEffect(() => {
    const list = PROGRAM_COURSES[program] || [];
    if (list.length > 0 && !list.some((c) => c.code === courseCode)) {
      setCourseCode(list[0].code);
      setSubjectName(list[0].name);
    }
  }, [program]);

  // Load topics and saved synopses
  useEffect(() => {
    safeFetch<{ topics: Topic[] }>('/topics')
      .then((res) => {
        if (res.data?.topics) {
          setTopics(res.data.topics);
          if (initialTopicId) {
            const found = res.data.topics.find((t) => t.id === initialTopicId);
            if (found) {
              setProjectTitle(found.title);
              setResearchTopic(found.description);
              setCourseCode(found.courseCode);
              setProgram(found.program);
              setSelectedTopicId(found.id);
            }
          }
        }
      })
      .catch(console.error);

    loadSavedSynopses();
  }, [initialTopicId]);

  const loadSavedSynopses = () => {
    safeFetch<{ synopses: SynopsisData[] }>('/synopsis/my-synopses')
      .then((res) => {
        if (res.data?.synopses) {
          setSavedSynopses(res.data.synopses);
        }
      })
      .catch(() => {});
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t.id === topicId);
    if (found) {
      setProjectTitle(found.title);
      setResearchTopic(found.description);
      setCourseCode(found.courseCode);
      setProgram(found.program);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      setError('Please provide a valid Project Title or select an approved topic.');
      return;
    }

    setError(null);
    setGenerating(true);
    setGenStep(1);

    // Generation step interval animation
    const timer = setInterval(() => {
      setGenStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 900);

    try {
      const res = await safePost<{ synopsis: SynopsisData }>('/synopsis/generate', {
        program,
        courseCode,
        subjectName,
        projectTitle: projectTitle.trim(),
        researchTopic: researchTopic.trim() || projectTitle.trim(),
        topicId: selectedTopicId || undefined,
        studentName: studentName.trim() || currentUser?.name || 'IGNOU Student',
        enrollmentNumber: enrollmentNumber.trim() || currentUser?.enrollmentNumber || 'IGNOU-2025-XXXX',
        studyCenterCode: studyCenterCode.trim() || 'SC-0700',
        studyCenterName,
        regionalCenterCode,
        regionalCenterName,
        sessionYear,
        email: email.trim() || currentUser?.email,
        mobileNumber: mobileNumber.trim() || currentUser?.mobileNumber,
        projectType,
        projectDescription: projectDescription.trim(),
        preferredTechnologies: preferredTechnologies.trim(),
        additionalRequirements: additionalRequirements.trim(),
        guideName: guideName.trim(),
        guideBioData: {
          guideName: guideName.trim(),
          qualification: guideQualification.trim(),
          specialization: guideSpecialization.trim(),
          designation: guideDesignation.trim(),
          organization: guideOrganization.trim(),
          officialAddress: guideOfficialAddress.trim(),
          email: guideEmail.trim(),
          mobileNumber: guideMobile.trim(),
          teachingExperience: guideTeachingExp.trim(),
          researchExperience: guideResearchExp.trim(),
          supervisionExperience: guideSupervisionExp.trim(),
          declarationAccepted: true
        }
      });

      clearInterval(timer);
      setGenStep(7);

      if (res.data?.synopsis) {
        setCurrentSynopsis(res.data.synopsis);
        setActiveTab('viewer');
        setActiveViewerSection('cover');
        setSuccessMsg('Complete 16-Section IGNOU Synopsis successfully generated!');
        loadSavedSynopses();
      } else {
        setError(res.error || 'Failed to generate synopsis. Please try again.');
      }
    } catch (err: any) {
      clearInterval(timer);
      setError(err.message || 'An error occurred during synopsis synthesis.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSynopsisEdits = async () => {
    if (!currentSynopsis) return;
    setLoading(true);
    try {
      const res = await safePut<{ synopsis: SynopsisData }>(`/synopsis/${currentSynopsis.id}`, currentSynopsis);
      if (res.data?.synopsis) {
        setCurrentSynopsis(res.data.synopsis);
        setIsEditing(false);
        setSuccessMsg('Synopsis changes saved successfully!');
        loadSavedSynopses();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSection = async () => {
    if (!currentSynopsis || !regenModalSection) return;
    setLoading(true);
    try {
      const res = await safePost<{ synopsis: SynopsisData }>(`/synopsis/${currentSynopsis.id}/regenerate-section`, {
        sectionKey: regenModalSection,
        instructions: regenPrompt
      });
      if (res.data?.synopsis) {
        setCurrentSynopsis(res.data.synopsis);
        setRegenModalSection(null);
        setRegenPrompt('');
        setSuccessMsg(`Section "${regenModalSection}" regenerated successfully!`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate section.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered topics for current program/course
  const filteredTopics = topics.filter(
    (t) => t.program.toLowerCase() === program.toLowerCase() || t.courseCode.toLowerCase() === courseCode.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-full text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                IGNOU Official Standard Proposal Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                IGNOU Project Proposal & Synopsis Generator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Generate topic-specific, 16-point academic research proposals with verifiable literature syntheses, complete chapterization, Gantt timelines, and an editable Guide Bio-Data / Supervisor Details Form.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'generate'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Proposal
              </button>
              {currentSynopsis && (
                <button
                  onClick={() => setActiveTab('viewer')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'viewer'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Proposal Viewer & Editor
                </button>
              )}
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Saved Proposals ({savedSynopses.length})
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 dark:text-emerald-300 hover:underline">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: GENERATE NEW PROPOSAL FORM */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Cols: Form */}
            <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-6">

              {/* Step 1: Program & Course */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Academic Degree & Course Code</h3>
                    <p className="text-xs text-slate-500">Select your IGNOU program to tailor the research methodology</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Degree Program *
                    </label>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {Object.keys(PROGRAM_COURSES).map((p) => (
                        <option key={p} value={p}>
                          IGNOU {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Course Code *
                    </label>
                    <select
                      value={courseCode}
                      onChange={(e) => {
                        setCourseCode(e.target.value);
                        const match = (PROGRAM_COURSES[program] || []).find((c) => c.code === e.target.value);
                        if (match) setSubjectName(match.name);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {(PROGRAM_COURSES[program] || []).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Research Project Topic */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Research Title & Topic</h3>
                      <p className="text-xs text-slate-500">Choose from verified topics or enter your approved dissertation title</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setTopicSelectionMode('directory')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        topicSelectionMode === 'directory'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Topic Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopicSelectionMode('custom')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        topicSelectionMode === 'custom'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Custom Title
                    </button>
                  </div>
                </div>

                {topicSelectionMode === 'directory' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Approved Topic ({filteredTopics.length} available for {program})
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => handleTopicSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="">-- Choose from approved topics --</option>
                      {filteredTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.courseCode}] {t.title.slice(0, 85)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Research Title *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Online Examination and Automated Evaluation System"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Category / Type *
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="Software Development">Software Development & Systems</option>
                      <option value="Web & Cloud Application">Web & Cloud Application</option>
                      <option value="Database Systems Implementation">Database Systems Implementation</option>
                      <option value="Mobile App Development">Mobile App Development</option>
                      <option value="Machine Learning / AI System">Machine Learning & Data Intelligence</option>
                      <option value="Research-based Empirical Study">Research-based Empirical Study</option>
                      <option value="Management & Organizational Study">Management & Strategic Analysis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Technologies & Tools
                    </label>
                    <input
                      type="text"
                      value={preferredTechnologies}
                      onChange={(e) => setPreferredTechnologies(e.target.value)}
                      placeholder="e.g. React, Node.js, Express, PostgreSQL, Tailwind CSS"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Description / Core Problem Context (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Briefly describe the key problem, target users, or special modules you want in this synopsis..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Requirements or Specific Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="e.g. Must include role-based authentication and 3NF database schema"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Step 3: Student & Centre Information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Student & University Centre Details</h3>
                    <p className="text-xs text-slate-500">Official IGNOU cover page and particulars</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      placeholder="e.g. 2108746281"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@ignou.ac.in"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Study Centre (Code & Name)
                    </label>
                    <input
                      type="text"
                      value={studyCenterCode}
                      onChange={(e) => setStudyCenterCode(e.target.value)}
                      placeholder="e.g. SC-0700 (Delhi)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Regional Centre (Code & Name)
                    </label>
                    <input
                      type="text"
                      value={regionalCenterCode}
                      onChange={(e) => setRegionalCenterCode(e.target.value)}
                      placeholder="e.g. RC-07 (Delhi-I)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Guide Bio-Data / Supervisor Details Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Guide Bio-Data / Supervisor Form</h3>
                      <p className="text-xs text-slate-500">Fill your academic supervisor’s details (also editable later & printable with signature blanks)</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">
                    Editable & Non-Fictitious
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Guide / Supervisor Full Name
                    </label>
                    <input
                      type="text"
                      value={guideName}
                      onChange={(e) => setGuideName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Chandra"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Educational Qualifications
                    </label>
                    <input
                      type="text"
                      value={guideQualification}
                      onChange={(e) => setGuideQualification(e.target.value)}
                      placeholder="e.g. Ph.D., MBA, M.Com, UGC-NET"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={guideSpecialization}
                      onChange={(e) => setGuideSpecialization(e.target.value)}
                      placeholder="e.g. Financial Analytics / Cloud Computing"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Present Designation
                    </label>
                    <input
                      type="text"
                      value={guideDesignation}
                      onChange={(e) => setGuideDesignation(e.target.value)}
                      placeholder="e.g. Associate Professor / Principal Consultant"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization / University
                    </label>
                    <input
                      type="text"
                      value={guideOrganization}
                      onChange={(e) => setGuideOrganization(e.target.value)}
                      placeholder="e.g. University of Delhi / IGNOU Study Centre"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Address
                    </label>
                    <input
                      type="text"
                      value={guideOfficialAddress}
                      onChange={(e) => setGuideOfficialAddress(e.target.value)}
                      placeholder="e.g. Department of Management Studies, New Delhi"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teaching Experience (Years)
                    </label>
                    <input
                      type="text"
                      value={guideTeachingExp}
                      onChange={(e) => setGuideTeachingExp(e.target.value)}
                      placeholder="e.g. 12 Years"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Students Previously Guided
                    </label>
                    <input
                      type="text"
                      value={guideSupervisionExp}
                      onChange={(e) => setGuideSupervisionExp(e.target.value)}
                      placeholder="e.g. 24 Master's Students"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={generating}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Synthesizing Official 11 IGNOU Sections (Step {genStep}/6)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Official 11-Section IGNOU Synopsis</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Right 1 Col: Standard 11 Sections Checklist */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Official 11-Section IGNOU Structure
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    'Cover Page (Standard IGNOU Proforma)',
                    'Student / Project Particulars & Declaration',
                    '1. PROJECT TITLE',
                    '2. INTRODUCTION',
                    '3. PROBLEM STATEMENT',
                    '4. OBJECTIVES (Numbered Points)',
                    '5. SCOPE OF THE PROJECT (5 Sub-areas)',
                    '6. LITERATURE REVIEW (Authentic & Verifiable)',
                    '7. METHODOLOGY (Step-by-Step Lifecycle)',
                    '8. TOOLS & TECHNOLOGIES (Specific Stack)',
                    '9. EXPECTED OUTCOME',
                    '10. WORK PLAN / TIMELINE (Phase 1–7)',
                    '11. REFERENCES / BIBLIOGRAPHY'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 py-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">Academic Integrity Assured:</p>
                  Formatted strictly in the mandatory 11-section IGNOU sequence with authentic academic references and non-fictitious methodology.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: FULL SYNOPSIS VIEWER & LIVE SECTION EDITOR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'viewer' && currentSynopsis && (
          currentSynopsis.sections11 ? (
            <Synopsis11SectionViewer
              synopsis={currentSynopsis}
              onUpdateSynopsis={setCurrentSynopsis}
              isEditing={isEditing}
              onToggleEdit={() => setIsEditing(!isEditing)}
              onSaveEdits={handleSaveSynopsisEdits}
              saving={loading}
              onRegenerateSection={(secKey) => {
                setRegenModalSection(secKey);
              }}
            />
          ) : (
          <div className="space-y-6">

            {/* Action Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md text-xs font-bold">
                    {currentSynopsis.program} ({currentSynopsis.courseCode})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ~{currentSynopsis.pageEstimate} Pages | {currentSynopsis.wordCount} Words
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  "{currentSynopsis.projectTitle}"
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isEditing
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Editing Mode Active' : 'Edit Content'}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveSynopsisEdits}
                    disabled={loading}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Edits
                  </button>
                )}

                <a
                  href={buildApiUrl(currentSynopsis.pdfUrl || `/api/synopsis/${currentSynopsis.id}/download/pdf`)}
                  download
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>

                <a
                  href={buildApiUrl(currentSynopsis.docxUrl || `/api/synopsis/${currentSynopsis.id}/download/docx`)}
                  download
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download DOCX
                </a>
              </div>
            </div>

            {/* Main Content Layout: Section Navigation Tabs on Left, Content on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* Left Column: Sections List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1 self-start">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Proposal Structure
                </div>

                {[
                  { id: 'cover', label: '📄 Cover Page (Proposal)' },
                  { id: 'declaration', label: '📝 Student Declaration' },
                  { id: 'intro', label: '1. Introduction' },
                  { id: 'background', label: '2. Background & Industry Profile' },
                  { id: 'role', label: '3. Role of HR / Professionals' },
                  { id: 'need7', label: '4. Need for Study (7 Dimensions)' },
                  { id: 'vision', label: '5. Vision, Mission & Objectives' },
                  { id: 'scope', label: '6. Scope of the Study' },
                  { id: 'problem', label: '7. Statement of the Problem' },
                  { id: 'obj', label: '8. Objectives of the Study' },
                  { id: 'rq', label: '9. Research Questions' },
                  { id: 'hyp', label: '10. Hypotheses Formulation' },
                  { id: 'sig', label: '11. Significance of the Study' },
                  { id: 'method', label: '12. Research Methodology' },
                  { id: 'inst', label: '13. Research Instruments' },
                  { id: 'sources', label: '14. Sources of Data' },
                  { id: 'sampling', label: '15. Sampling Design' },
                  { id: 'tools', label: '16. Tools & Techniques of Analysis' },
                  { id: 'lit', label: '17. Review of Literature' },
                  { id: 'outcome', label: '18. Expected Outcomes' },
                  { id: 'limit', label: '19. Limitations of the Study' },
                  { id: 'chapter', label: '20. Proposed Chapterization' },
                  { id: 'time', label: '21. Time Schedule (Gantt)' },
                  { id: 'quest', label: '22. Research Questionnaire' },
                  { id: 'refs', label: '23. References / Bibliography' },
                  { id: 'guide', label: '⭐ 24. Guide Bio-Data Proforma' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveViewerSection(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      activeViewerSection === s.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{s.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${activeViewerSection === s.id ? 'opacity-100' : 'opacity-30'}`} />
                  </button>
                ))}
              </div>

              {/* Right 3 Columns: Active Section Content Viewer / Editor */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[500px]">

                  {/* Section Title Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                      {activeViewerSection === 'cover' && 'Project Proposal Cover Page'}
                      {activeViewerSection === 'declaration' && 'Student Declaration & Academic Certificate'}
                      {activeViewerSection === 'intro' && '1. Introduction'}
                      {activeViewerSection === 'background' && '2. Background of the Study & Industry Profile'}
                      {activeViewerSection === 'role' && '3. Role of HR / Domain Professionals'}
                      {activeViewerSection === 'need7' && '4. Need for the Study (Detailed 7 Dimensions)'}
                      {activeViewerSection === 'vision' && '5. Vision, Mission & Strategic Objectives'}
                      {activeViewerSection === 'scope' && '6. Scope of the Study'}
                      {activeViewerSection === 'problem' && '7. Statement of the Problem'}
                      {activeViewerSection === 'obj' && '8. Objectives of the Study'}
                      {activeViewerSection === 'rq' && '9. Research Questions'}
                      {activeViewerSection === 'hyp' && '10. Hypotheses Formulation'}
                      {activeViewerSection === 'sig' && '11. Significance of the Study'}
                      {activeViewerSection === 'method' && '12. Research Methodology'}
                      {activeViewerSection === 'inst' && '13. Research Instruments'}
                      {activeViewerSection === 'sources' && '14. Sources of Data'}
                      {activeViewerSection === 'sampling' && '15. Sampling Design'}
                      {activeViewerSection === 'tools' && '16. Tools & Techniques of Data Analysis'}
                      {activeViewerSection === 'lit' && '17. Review of Literature'}
                      {activeViewerSection === 'outcome' && '18. Expected Outcomes'}
                      {activeViewerSection === 'limit' && '19. Limitations of the Study'}
                      {activeViewerSection === 'chapter' && '20. Proposed Chapterization'}
                      {activeViewerSection === 'time' && '21. Time Schedule (Gantt Chart)'}
                      {activeViewerSection === 'quest' && '22. Research Questionnaire'}
                      {activeViewerSection === 'refs' && '23. References / Bibliography'}
                      {activeViewerSection === 'guide' && '⭐ 24. Guide Bio-Data & Approval Proforma'}
                    </h3>

                    {/* Section Regeneration Action */}
                    {activeViewerSection !== 'cover' && activeViewerSection !== 'guide' && (
                      <button
                        onClick={() => setRegenModalSection(activeViewerSection)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate Section
                      </button>
                    )}
                  </div>

                  {/* 1. COVER PAGE PREVIEW */}
                  {activeViewerSection === 'cover' && (
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 p-2 sm:p-3 shadow-xl rounded-none max-w-2xl mx-auto font-serif text-slate-900 dark:text-slate-100">
                      {/* Inner border for academic double-line effect */}
                      <div className="border border-slate-700 dark:border-slate-300 p-6 sm:p-8 space-y-6">
                        {/* 1. Top Centered: INDIRA GANDHI NATIONAL OPEN UNIVERSITY */}
                        <div className="text-center space-y-1">
                          <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white uppercase">
                            INDIRA GANDHI NATIONAL OPEN UNIVERSITY
                          </h4>
                          <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                            School of{' '}
                            {(() => {
                              const p = (currentSynopsis.program || '').toUpperCase();
                              if (p.includes('BCA') || p.includes('MCA') || p.includes('PGDCA') || p.includes('CIT') || p.includes('COMPUTER') || p.includes('CS') || p.includes('IT')) return 'Computer and Information Sciences (SOCIS)';
                              if (p.includes('MBA') || p.includes('B.COM') || p.includes('M.COM') || p.includes('MANAGEMENT') || p.includes('BBA')) return 'Management Studies (SOMS)';
                              if (p.includes('BED') || p.includes('MED') || p.includes('MAEDU') || p.includes('EDUCATION')) return 'Education (SOE)';
                              if (p.includes('MAPC') || p.includes('BAPCH') || p.includes('PSYCHOLOGY') || p.includes('MSW') || p.includes('BSW') || p.includes('ECONOMICS') || p.includes('POLITICAL') || p.includes('HISTORY') || p.includes('SOCIOLOGY')) return 'Social Sciences (SOSS)';
                              if (p.includes('TOURISM') || p.includes('BTS') || p.includes('MTM')) return 'Tourism and Hospitality Service Sector (SOTHSM)';
                              if (p.includes('HEALTH') || p.includes('NURSING') || p.includes('DNA')) return 'Health Sciences (SOHS)';
                              if (p.includes('SCIENCE') || p.includes('BSC') || p.includes('MSC')) return 'Pure and Applied Sciences (SOS)';
                              return 'Computer and Information Sciences (SOCIS)';
                            })()}
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                            Maidan Garhi, New Delhi – 110068
                          </p>
                        </div>

                        {/* Separator */}
                        <div className="w-4/5 mx-auto border-b border-slate-400 dark:border-slate-600"></div>

                        {/* Submission Statement */}
                        <div className="text-center px-2">
                          <p className="text-[11px] sm:text-xs font-bold leading-relaxed tracking-tight text-slate-900 dark:text-slate-200 uppercase">
                            A DISSERTATION / PROJECT REPORT SUBMITTED IN PARTIAL FULFILLMENT OF<br />
                            THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF
                          </p>
                        </div>

                        {/* Program & Course Code */}
                        <div className="text-center space-y-1">
                          <h5 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white uppercase tracking-wide">
                            {currentSynopsis.program && currentSynopsis.program !== 'undefined' && currentSynopsis.program !== 'null'
                              ? currentSynopsis.program.toUpperCase()
                              : 'BACHELOR OF COMPUTER APPLICATIONS (BCA)'}
                          </h5>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                            COURSE CODE: {(currentSynopsis.courseCode || 'BCSP-064').toUpperCase()}
                          </p>
                        </div>

                        {/* ON THE TOPIC & Title Box */}
                        <div className="space-y-2 text-center">
                          <p className="text-xs font-serif italic text-slate-700 dark:text-slate-300">
                            ON THE TOPIC:
                          </p>
                          <div className="border border-slate-500 dark:border-slate-500 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3 max-w-xl mx-auto rounded-none">
                            <p className="text-xs sm:text-sm font-bold leading-snug text-slate-950 dark:text-white uppercase">
                              "{currentSynopsis.projectTitle ? currentSynopsis.projectTitle.trim().replace(/^"+|"+$/g, '') : 'PROJECT TITLE'}"
                            </p>
                          </div>
                        </div>

                        {/* Two Columns: SUBMITTED BY & UNDER THE SUPERVISION OF */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
                          {/* Left: SUBMITTED BY */}
                          <div className="space-y-1.5 text-xs">
                            <p className="font-bold text-slate-950 dark:text-white text-xs tracking-wider uppercase pb-1 border-b border-slate-300 dark:border-slate-700">
                              SUBMITTED BY:
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold text-slate-950 dark:text-white">Name:</strong>{' '}
                              {currentSynopsis.studentName && currentSynopsis.studentName !== 'IGNOU Student' && currentSynopsis.studentName !== 'undefined' && currentSynopsis.studentName !== 'null'
                                ? currentSynopsis.studentName.trim()
                                : '___________________________'}
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold text-slate-950 dark:text-white">Enrollment No.:</strong>{' '}
                              {currentSynopsis.enrollmentNumber && currentSynopsis.enrollmentNumber !== 'IGNOU-2025-XXXX' && currentSynopsis.enrollmentNumber !== 'undefined' && currentSynopsis.enrollmentNumber !== 'null'
                                ? currentSynopsis.enrollmentNumber.trim()
                                : '__________________'}
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold text-slate-950 dark:text-white">Program:</strong>{' '}
                              {currentSynopsis.program && currentSynopsis.program !== 'undefined' && currentSynopsis.program !== 'null'
                                ? currentSynopsis.program
                                : '_________________________'}
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold text-slate-950 dark:text-white">Regional Centre:</strong>{' '}
                              {currentSynopsis.regionalCenterName || currentSynopsis.regionalCenterCode
                                ? `${currentSynopsis.regionalCenterName || ''} ${currentSynopsis.regionalCenterCode ? `(${currentSynopsis.regionalCenterCode})` : ''}`.trim()
                                : (currentSynopsis.coverPage?.regionalCenter || 'RC Delhi-II (07)')}
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold text-slate-950 dark:text-white">Study Centre Code:</strong>{' '}
                              {currentSynopsis.studyCenterCode || currentSynopsis.studyCenterName
                                ? `${currentSynopsis.studyCenterCode || ''} ${currentSynopsis.studyCenterName ? `- ${currentSynopsis.studyCenterName}` : ''}`.trim()
                                : (currentSynopsis.coverPage?.studyCenter || 'SC-0713')}
                            </p>
                          </div>

                          {/* Right: UNDER THE SUPERVISION OF */}
                          <div className="space-y-1.5 text-xs">
                            <p className="font-bold text-slate-950 dark:text-white text-xs tracking-wider uppercase pb-1 border-b border-slate-300 dark:border-slate-700">
                              UNDER THE SUPERVISION OF:
                            </p>
                            {currentSynopsis.guideBioData?.guideName &&
                            currentSynopsis.guideBioData.guideName.trim() !== '' &&
                            currentSynopsis.guideBioData.guideName !== '[To be assigned / approved]' &&
                            currentSynopsis.guideBioData.guideName !== '[Supervisor Assigned]' &&
                            currentSynopsis.guideBioData.guideName !== 'undefined' &&
                            currentSynopsis.guideBioData.guideName !== 'null' ? (
                              <>
                                <p className="font-bold text-slate-950 dark:text-white">
                                  {currentSynopsis.guideBioData.guideName.trim()}
                                </p>
                                {currentSynopsis.guideBioData.qualification && (
                                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                                    {currentSynopsis.guideBioData.qualification}
                                  </p>
                                )}
                                {currentSynopsis.guideBioData.designation && (
                                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                                    {currentSynopsis.guideBioData.designation}
                                  </p>
                                )}
                                {currentSynopsis.guideBioData.organization && (
                                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                                    {currentSynopsis.guideBioData.organization}
                                  </p>
                                )}
                                <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                                  Approved IGNOU Project Guide
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                                  Academic Session: {currentSynopsis.sessionYear || currentSynopsis.coverPage?.sessionYear || '2025–2026'}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-slate-800 dark:text-slate-200">
                                  ____________________________________
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                  Project Supervisor / Academic Counsellor
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                  School of{' '}
                                  {(() => {
                                    const p = (currentSynopsis.program || '').toUpperCase();
                                    if (p.includes('BCA') || p.includes('MCA') || p.includes('PGDCA') || p.includes('CIT') || p.includes('COMPUTER') || p.includes('CS') || p.includes('IT')) return 'Computer and Information Sciences (SOCIS)';
                                    if (p.includes('MBA') || p.includes('B.COM') || p.includes('M.COM') || p.includes('MANAGEMENT') || p.includes('BBA')) return 'Management Studies (SOMS)';
                                    if (p.includes('BED') || p.includes('MED') || p.includes('MAEDU') || p.includes('EDUCATION')) return 'Education (SOE)';
                                    if (p.includes('MAPC') || p.includes('BAPCH') || p.includes('PSYCHOLOGY') || p.includes('MSW') || p.includes('BSW') || p.includes('ECONOMICS') || p.includes('POLITICAL') || p.includes('HISTORY') || p.includes('SOCIOLOGY')) return 'Social Sciences (SOSS)';
                                    if (p.includes('TOURISM') || p.includes('BTS') || p.includes('MTM')) return 'Tourism and Hospitality Service Sector (SOTHSM)';
                                    if (p.includes('HEALTH') || p.includes('NURSING') || p.includes('DNA')) return 'Health Sciences (SOHS)';
                                    if (p.includes('SCIENCE') || p.includes('BSC') || p.includes('MSC')) return 'Pure and Applied Sciences (SOS)';
                                    return 'Computer and Information Sciences (SOCIS)';
                                  })()}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                  Approved IGNOU Project Guide
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                  Academic Session: {currentSynopsis.sessionYear || currentSynopsis.coverPage?.sessionYear || '2025–2026'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DECLARATION PREVIEW */}
                  {activeViewerSection === 'declaration' && (
                    <div className="space-y-4 font-serif text-slate-800 dark:text-slate-200">
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                        <h4 className="text-center font-bold text-base uppercase text-slate-900 dark:text-white underline">
                          STUDENT DECLARATION & CERTIFICATE OF ORIGINALITY
                        </h4>
                        <p className="text-xs sm:text-sm leading-relaxed text-justify">
                          {currentSynopsis.declaration?.studentDeclaration ||
                            `I hereby declare that the project proposal entitled "${currentSynopsis.projectTitle}" submitted by me to the Indira Gandhi National Open University (IGNOU) in partial fulfillment of the requirements for the degree of ${currentSynopsis.program || 'MBA'} is an authentic record of original research carried out by me under the guidance and supervision of my approved project supervisor.`}
                        </p>
                        <div className="pt-6 grid grid-cols-2 gap-6 text-xs font-sans">
                          <div>
                            <p><strong>Name:</strong> {currentSynopsis.studentName || 'IGNOU Student'}</p>
                            <p><strong>Enrollment No:</strong> {currentSynopsis.enrollmentNumber || 'IGNOU-2025-XXXX'}</p>
                            <p><strong>Date:</strong> _________________</p>
                          </div>
                          <div className="text-right">
                            <p><strong>Place:</strong> New Delhi / Regional Centre</p>
                            <p><strong>Signature:</strong> _________________</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. INTRODUCTION */}
                  {activeViewerSection === 'intro' && (
                    <div className="space-y-4">
                      {isEditing ? (
                        <textarea
                          rows={12}
                          value={currentSynopsis.introduction.fullText}
                          onChange={(e) =>
                            setCurrentSynopsis({
                              ...currentSynopsis,
                              introduction: { ...currentSynopsis.introduction, fullText: e.target.value }
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                        />
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                          {currentSynopsis.introduction.fullText.split('\n\n').map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. BACKGROUND & INDUSTRY PROFILE */}
                  {activeViewerSection === 'background' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">2.1 Sectoral and Industry Environment</span>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{currentSynopsis.backgroundOfStudy?.industryContext || 'Comprehensive sectoral overview analyzing industrial landscape, regulatory framework, and contemporary dynamics.'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">2.2 Profile and Operational Context of Organization</span>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{currentSynopsis.backgroundOfStudy?.organizationalContext || 'Detailed enterprise structure, operating verticals, operational throughput, and strategic positioning.'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">2.3 Problem Emergence & Context</span>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{currentSynopsis.backgroundOfStudy?.problemBackground || 'Detailed historical emergence of the research problem and diagnostic triggers.'}</p>
                      </div>
                    </div>
                  )}

                  {/* 3. ROLE OF HR / PROFESSIONALS */}
                  {activeViewerSection === 'role' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">Role & Functional Scope of Professionals</span>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{currentSynopsis.roleOfProfessionals?.roleDescription || 'Strategic positioning and functional responsibilities within the target enterprise.'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">Core Functional Responsibilities:</span>
                        <div className="space-y-1.5 pl-2">
                          {(currentSynopsis.roleOfProfessionals?.keyFunctions || []).map((fn, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span className="text-slate-700 dark:text-slate-300">{fn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. NEED FOR STUDY (7 DIMENSIONS) */}
                  {activeViewerSection === 'need7' && (
                    <div className="space-y-3 text-xs">
                      {[
                        { title: '4.1 Employee Development & Individual Growth', val: currentSynopsis.needForStudyDetailed?.employeeDevelopment },
                        { title: '4.2 Performance Improvement & Task Efficiency', val: currentSynopsis.needForStudyDetailed?.performanceImprovement },
                        { title: '4.3 Skill Development & Competency Matrix Bridging', val: currentSynopsis.needForStudyDetailed?.skillDevelopment },
                        { title: '4.4 Productivity Enhancement & Operational Throughput', val: currentSynopsis.needForStudyDetailed?.productivityEnhancement },
                        { title: '4.5 Quality Improvement & Error Minimization', val: currentSynopsis.needForStudyDetailed?.qualityImprovement },
                        { title: '4.6 Technology Adaptation & Digital Readiness', val: currentSynopsis.needForStudyDetailed?.technologyAdaptation },
                        { title: '4.7 Sustainable Organizational Growth & Market Leadership', val: currentSynopsis.needForStudyDetailed?.organizationalGrowth }
                      ].map((dim, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-600 block">{dim.title}</span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{dim.val || 'Structured empirical justification across organizational and operational vectors.'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 5. VISION, MISSION & OBJECTIVES */}
                  {activeViewerSection === 'vision' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">Organizational Vision</span>
                        <p className="italic text-slate-700 dark:text-slate-300">{currentSynopsis.visionMissionObjectives?.vision || 'Empowering operational and human capital benchmark excellence.'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">Mission Statement</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{currentSynopsis.visionMissionObjectives?.mission || 'Systematic enhancement of capabilities and total quality management.'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-blue-600 block text-sm">Strategic Mandates & Goals</span>
                        <div className="space-y-1.5 pl-2">
                          {(currentSynopsis.visionMissionObjectives?.strategicObjectives || []).map((so, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span className="text-slate-700 dark:text-slate-300">{so}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. NEED FOR THE STUDY */}
                  {activeViewerSection === 'need' && (
                    <div className="space-y-4">
                      {isEditing ? (
                        <textarea
                          rows={12}
                          value={currentSynopsis.needAndSignificance.needForStudy || currentSynopsis.needAndSignificance.whyNeeded}
                          onChange={(e) =>
                            setCurrentSynopsis({
                              ...currentSynopsis,
                              needAndSignificance: {
                                ...currentSynopsis.needAndSignificance,
                                needForStudy: e.target.value,
                                whyNeeded: e.target.value
                              }
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                        />
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                          {(currentSynopsis.needAndSignificance.needForStudy || currentSynopsis.needAndSignificance.whyNeeded || currentSynopsis.needAndSignificance.fullText).split('\n\n').map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. SIGNIFICANCE OF THE STUDY */}
                  {activeViewerSection === 'sig' && (
                    <div className="space-y-4">
                      {isEditing ? (
                        <textarea
                          rows={12}
                          value={currentSynopsis.needAndSignificance.significanceOfStudy || currentSynopsis.needAndSignificance.fullText}
                          onChange={(e) =>
                            setCurrentSynopsis({
                              ...currentSynopsis,
                              needAndSignificance: {
                                ...currentSynopsis.needAndSignificance,
                                significanceOfStudy: e.target.value
                              }
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                        />
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                          {(currentSynopsis.needAndSignificance.significanceOfStudy || currentSynopsis.needAndSignificance.fullText).split('\n\n').map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. LITERATURE REVIEW */}
                  {activeViewerSection === 'lit' && (
                    <div className="space-y-6">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {currentSynopsis.reviewOfLiterature.overview}
                      </p>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Key Literature Anchors & Syntheses
                        </h4>
                        {currentSynopsis.reviewOfLiterature.studies.map((s, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {s.authorYear} — "{s.title}"
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md font-semibold">
                                {s.verificationStatus}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{s.findings}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 font-medium">
                        {currentSynopsis.reviewOfLiterature.researchGap}
                      </div>
                    </div>
                  )}

                  {/* 6. PROBLEM STATEMENT */}
                  {activeViewerSection === 'problem' && (
                    <div className="space-y-4">
                      {isEditing ? (
                        <textarea
                          rows={8}
                          value={currentSynopsis.statementOfTheProblem}
                          onChange={(e) =>
                            setCurrentSynopsis({ ...currentSynopsis, statementOfTheProblem: e.target.value })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {currentSynopsis.statementOfTheProblem}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 7. OBJECTIVES */}
                  {activeViewerSection === 'obj' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">
                        Formal research objectives directly aligned with the problem statement:
                      </p>
                      {currentSynopsis.objectivesOfTheStudy.map((obj, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 pt-0.5">{obj}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 8. RESEARCH QUESTIONS */}
                  {activeViewerSection === 'rq' && (
                    <div className="space-y-3">
                      {currentSynopsis.researchQuestions.map((rq, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-md shrink-0">
                            RQ {i + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 pt-0.5">
                            {rq.replace(/^RQ\d+:\s*/i, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 9. HYPOTHESIS */}
                  {activeViewerSection === 'hyp' && (
                    <div className="space-y-4">
                      {currentSynopsis.hypothesis.hasHypothesis ? (
                        <>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{currentSynopsis.hypothesis.rationale}</p>
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Null Hypotheses (H0):</h4>
                            {currentSynopsis.hypothesis.nullHypotheses.map((h0, i) => (
                              <div key={i} className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg text-xs text-red-900 dark:text-red-200">
                                • {h0}
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Alternate Hypotheses (H1):</h4>
                            {currentSynopsis.hypothesis.alternateHypotheses.map((h1, i) => (
                              <div key={i} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                                • {h1}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {currentSynopsis.hypothesis.fullText}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 10. SCOPE */}
                  {activeViewerSection === 'scope' && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-blue-600 block mb-1">Research Domain</span>
                          <span>{currentSynopsis.scopeOfTheStudy.researchArea}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-blue-600 block mb-1">Target Population</span>
                          <span>{currentSynopsis.scopeOfTheStudy.targetPopulation}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-blue-600 block mb-1">Time Horizon</span>
                          <span>{currentSynopsis.scopeOfTheStudy.timePeriod}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-blue-600 block mb-1">Subject Coverage</span>
                          <span>{currentSynopsis.scopeOfTheStudy.subjectCoverage}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 11. RESEARCH METHODOLOGY */}
                  {activeViewerSection === 'method' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-600">Research Type & Design</span>
                          <p>{currentSynopsis.researchMethodology.researchType}</p>
                          <p className="text-slate-500">{currentSynopsis.researchMethodology.researchDesign}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-600">Sampling & Sample Size</span>
                          <p><strong>Sample Size:</strong> {currentSynopsis.researchMethodology.sampleSize}</p>
                          <p><strong>Sampling Method:</strong> {currentSynopsis.researchMethodology.samplingMethod}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-600">Data Sources & Tools</span>
                          <p><strong>Primary:</strong> {currentSynopsis.researchMethodology.primaryData}</p>
                          <p><strong>Secondary:</strong> {currentSynopsis.researchMethodology.secondaryData}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-600">Data Analysis & Statistical Tools</span>
                          <p>{currentSynopsis.researchMethodology.dataAnalysisMethod}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 12. LIMITATIONS */}
                  {activeViewerSection === 'limit' && (
                    <div className="space-y-3">
                      {currentSynopsis.limitationsOfTheStudy.map((lim, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 13. PROPOSED CHAPTERIZATION */}
                  {activeViewerSection === 'chapter' && (
                    <div className="space-y-3">
                      {currentSynopsis.proposedChapterization.map((ch) => (
                        <div key={ch.chapterNumber} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-lg shrink-0">
                            Chapter {ch.chapterNumber}
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">{ch.chapterTitle}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{ch.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 14. TIME SCHEDULE */}
                  {activeViewerSection === 'time' && (
                    <div className="space-y-3">
                      {currentSynopsis.timeSchedule.map((t, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{t.stage}</span>
                            <p className="text-slate-500">{t.description}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold rounded-md shrink-0">
                            {t.timePeriod}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 15. EXPECTED OUTCOME */}
                  {activeViewerSection === 'outcome' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                        <span className="font-bold text-blue-600">Tangible Deliverables</span>
                        <p>{currentSynopsis.expectedOutcome.deliverables}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                        <span className="font-bold text-blue-600">Practical & Managerial Impact</span>
                        <p>{currentSynopsis.expectedOutcome.practicalImpact}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                        <span className="font-bold text-blue-600">Academic Contribution</span>
                        <p>{currentSynopsis.expectedOutcome.academicValue}</p>
                      </div>
                    </div>
                  )}

                  {/* 16. REFERENCES */}
                  {activeViewerSection === 'refs' && (
                    <div className="space-y-3">
                      {currentSynopsis.references.map((r, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">[{i + 1}]</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">{r.citation}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 italic block pl-6">
                            Status: {r.verificationTag}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ⭐ 17. GUIDE BIO-DATA / SUPERVISOR DETAILS FORM */}
                  {activeViewerSection === 'guide' && (
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                            Guide / Supervisor Bio-Data & Approval Form
                          </h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Included in PDF & DOCX downloads. Can be edited here or physically signed after printing.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">1. Full Name of Guide:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.guideName || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, guideName: e.target.value }
                              })
                            }
                            placeholder="e.g. Dr. A. K. Sharma"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">2. Educational Qualifications:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.qualification || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, qualification: e.target.value }
                              })
                            }
                            placeholder="e.g. Ph.D., MBA, M.Phil, UGC-NET"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">3. Area of Specialization:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.specialization || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, specialization: e.target.value }
                              })
                            }
                            placeholder="e.g. Strategic Management / Software Architecture"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">4. Designation:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.designation || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, designation: e.target.value }
                              })
                            }
                            placeholder="e.g. Associate Professor"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">5. Organization / Institution:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.organization || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, organization: e.target.value }
                              })
                            }
                            placeholder="e.g. Delhi University / IGNOU Study Centre"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">6. Official Postal Address:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.officialAddress || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, officialAddress: e.target.value }
                              })
                            }
                            placeholder="e.g. Department of Commerce, New Delhi"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">7. Teaching Experience:</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.teachingExperience || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, teachingExperience: e.target.value }
                              })
                            }
                            placeholder="e.g. 10 Years"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">8. Previous Supervision (Students):</label>
                          <input
                            type="text"
                            value={currentSynopsis.guideBioData?.supervisionExperience || ''}
                            onChange={(e) =>
                              setCurrentSynopsis({
                                ...currentSynopsis,
                                guideBioData: { ...currentSynopsis.guideBioData, supervisionExperience: e.target.value }
                              })
                            }
                            placeholder="e.g. 18 Students"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Official Declaration Box */}
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-4">
                        <div>
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block mb-1">
                            OFFICIAL SUPERVISOR DECLARATION:
                          </span>
                          <p className="text-xs italic text-slate-700 dark:text-slate-300">
                            "I certify that I am willing to guide the student for the proposed project work and that the information provided above is correct."
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
                          <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-lg bg-white dark:bg-slate-900 space-y-6">
                            <span className="text-[11px] text-slate-400 block">Guide Signature:</span>
                            <div className="border-b border-slate-300 dark:border-slate-700 pb-1 text-slate-400">
                              Date: ____________________
                            </div>
                          </div>

                          <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-lg bg-white dark:bg-slate-900 space-y-6">
                            <span className="text-[11px] text-slate-400 block">Student Signature:</span>
                            <div className="border-b border-slate-300 dark:border-slate-700 pb-1 text-slate-400">
                              Date: ____________________
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
          )
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: SAVED PROPOSALS HISTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Saved Project Proposals</h3>
              <button
                onClick={() => setActiveTab('generate')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                + New Proposal
              </button>
            </div>

            {savedSynopses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm">No saved synopses yet.</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                >
                  Generate Your First Proposal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSynopses.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-xs font-bold">
                        {s.program} ({s.courseCode})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      "{s.projectTitle}"
                    </h4>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span>{s.wordCount} words</span>
                      <span>~{s.pageEstimate} pages</span>
                      <span>Student: {s.studentName}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setCurrentSynopsis(s);
                          setActiveTab('viewer');
                          setActiveViewerSection('cover');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex-1 text-center"
                      >
                        Open & Edit
                      </button>
                      <a
                        href={buildApiUrl(s.pdfUrl || `/api/synopsis/${s.id}/download/pdf`)}
                        download
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        PDF
                      </a>
                      <a
                        href={buildApiUrl(s.docxUrl || `/api/synopsis/${s.id}/download/docx`)}
                        download
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        DOCX
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Section Regeneration Modal */}
      {regenModalSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Regenerate Section: {regenModalSection}
            </h3>
            <p className="text-xs text-slate-500">
              Provide custom instructions or focus areas for this section (e.g. "Focus on fintech apps in Tier-2 Indian cities with SPSS regression analysis").
            </p>
            <textarea
              rows={4}
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder="Enter custom focus instructions or leave blank for default academic refinement..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRegenModalSection(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateSection}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                {loading ? 'Regenerating...' : 'Regenerate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
