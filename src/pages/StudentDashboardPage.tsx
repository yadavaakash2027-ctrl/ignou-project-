import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  FileText,
  FileCheck,
  Download,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  FolderDown,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProjectRecord, GenerationJob } from '../types';
import { GenerationProgressModal } from '../components/GenerationProgressModal';
import { StudentAuthDownloadModal } from '../components/StudentAuthDownloadModal';
import { safeFetch } from '../lib/api';
import { downloadProjectFile } from '../lib/downloadService';

interface StudentDashboardProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalProjectId, setActiveModalProjectId] = useState<string | null>(null);
  const [allocating, setAllocating] = useState(false);
  const [allocationMsg, setAllocationMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [authDownloadModal, setAuthDownloadModal] = useState<{
    open: boolean;
    projectId: string;
    courseCode: string;
    topicTitle: string;
    fileType: 'pdf' | 'docx';
  }>({
    open: false,
    projectId: '',
    courseCode: '',
    topicTitle: '',
    fileType: 'pdf'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await safeFetch<{ projects: ProjectRecord[] }>('/projects');
      if (res.ok && res.data) {
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAllocate = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setAllocating(true);
    setAllocationMsg(null);

    // Map course code based on program
    let defaultCourse = 'MCOP-001';
    if (user.program.toUpperCase() === 'MBA') defaultCourse = 'MMPP-001';
    if (user.program.toUpperCase() === 'BCA') defaultCourse = 'BCSP-064';
    if (user.program.toUpperCase() === 'MCA') defaultCourse = 'MCSP-060';
    if (user.program.toUpperCase() === 'B.COM') defaultCourse = 'BCOE-141';
    if (user.program.toUpperCase() === 'PGDCA') defaultCourse = 'MCSP-040';

    try {
      const res = await safeFetch<{ topic: any }>('/topics/allocate', {
        method: 'POST',
        body: JSON.stringify({ courseCode: defaultCourse, program: user.program })
      });
      if (res.ok && res.data?.topic) {
        onNavigate('checkout', { topicId: res.data.topic.id, courseCode: res.data.topic.courseCode, program: res.data.topic.program });
      } else {
        setAllocationMsg(res.error || 'Failed to allocate fresh topic.');
      }
    } catch (err: any) {
      setAllocationMsg(err.message || 'Allocation request error');
    } finally {
      setAllocating(false);
    }
  };

  const executeDownload = async (projectId: string, type: 'pdf' | 'docx', courseCode: string, topicTitle?: string) => {
    setDownloadingId(`${projectId}_${type}`);
    try {
      await downloadProjectFile({
        projectId,
        fileType: type,
        courseCode,
        topicTitle,
        enrollmentNumber: user?.enrollmentNumber
      });
    } catch (err: any) {
      alert(err.message || 'Failed to download project file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = (projectId: string, type: 'pdf' | 'docx', courseCode: string, topicTitle?: string) => {
    if (!user) {
      setAuthDownloadModal({
        open: true,
        projectId,
        courseCode,
        topicTitle: topicTitle || 'IGNOU Dissertation',
        fileType: type
      });
      return;
    }
    executeDownload(projectId, type, courseCode, topicTitle);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase">
              {user?.program} Student Portal
            </span>
            <span className="text-xs text-blue-300">Enrollment: {user?.enrollmentNumber}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Manage your allocated project dissertations, synopsis documents, and verified 150+ page downloads
          </p>
        </div>

        <button
          onClick={handleQuickAllocate}
          disabled={allocating}
          className="px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{allocating ? 'Allocating Topic...' : `Start New ${user?.program} Project`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {allocationMsg && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{allocationMsg}</span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{projects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Allocated Projects</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {projects.reduce((sum, p) => sum + (p.pageCount || 0), 0)} Pages
            </div>
            <div className="text-xs text-slate-500 font-medium">Verified Generated Pages</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">Active</div>
            <div className="text-xs text-slate-500 font-medium">Atomic Lock Protected</div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-blue-600" /> My Projects & Dissertation Files
          </h2>
          <button
            onClick={fetchProjects}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading your projects...</div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Projects Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't reserved or generated any project dissertations yet. Allocate your first topic to begin 150+ page generation.
            </p>
            <button
              onClick={() => onNavigate('projects')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Browse Available Topics
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const isReady = project.status === 'READY';
              const isFailed = project.status === 'FAILED';

              return (
                <div
                  key={project.projectId}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase">
                        {project.program} • {project.courseCode}
                      </span>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isReady
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : isFailed
                            ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isReady && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {isReady ? `VERIFIED: ${project.pageCount} PAGES` : project.status}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        Ordered: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {project.topicTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Subject: <strong>{project.subjectName}</strong></span>
                      {project.wordCount > 0 && (
                        <span>Words: <strong>{project.wordCount.toLocaleString()}</strong></span>
                      )}
                      <span>Price: <strong>₹{project.price}</strong> ({project.paymentStatus})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setActiveModalProjectId(project.projectId)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isReady ? 'View Quality Logs' : 'Live Generation'}</span>
                    </button>

                    {isReady && (
                      <>
                        <button
                          onClick={() => handleDownload(project.projectId, 'pdf', project.courseCode)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF ({project.pageCount}p)
                        </button>
                        <button
                          onClick={() => handleDownload(project.projectId, 'docx', project.courseCode)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-300" /> DOCX
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generation Progress Modal */}
      {activeModalProjectId && (
        <GenerationProgressModal
          projectId={activeModalProjectId}
          onClose={() => setActiveModalProjectId(null)}
          onRefreshProject={fetchProjects}
        />
      )}

      {/* Student Auth Download Modal */}
      {authDownloadModal.open && (
        <StudentAuthDownloadModal
          isOpen={authDownloadModal.open}
          onClose={() => setAuthDownloadModal(prev => ({ ...prev, open: false }))}
          projectId={authDownloadModal.projectId}
          courseCode={authDownloadModal.courseCode}
          topicTitle={authDownloadModal.topicTitle}
          fileType={authDownloadModal.fileType}
          onSuccess={() => {
            const { projectId, fileType, courseCode, topicTitle } = authDownloadModal;
            setAuthDownloadModal(prev => ({ ...prev, open: false }));
            executeDownload(projectId, fileType, courseCode, topicTitle);
          }}
        />
      )}
    </div>
  );
};
