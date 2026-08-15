import React, { useState, useEffect } from 'react';
import {
  FolderDown,
  FileText,
  Download,
  FileCheck,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProjectRecord } from '../types';
import { GenerationProgressModal } from '../components/GenerationProgressModal';
import { safeFetch, buildApiUrl } from '../lib/api';

interface MyProjectsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const MyProjectsPage: React.FC<MyProjectsPageProps> = ({ onNavigate }) => {
  const { user, getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalProjectId, setActiveModalProjectId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDownload = (projectId: string, type: 'pdf' | 'docx', courseCode: string) => {
    const url = buildApiUrl(`/projects/${projectId}/download/${type}`);
    fetch(url, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `IGNOU_${courseCode}_${user?.enrollmentNumber || 'Draft'}.${type}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        alert(err.message || 'Download error');
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Generated Projects & Dissertations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download your completed 150+ page PDF and Word documents with verification logs
          </p>
        </div>

        <button
          onClick={fetchProjects}
          className="self-start md:self-auto px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading your project library...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 space-y-4">
          <FolderDown className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Projects in Your Library</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You have not allocated any project topics yet. Select a topic from our catalog to initiate the 150+ page academic synthesis engine.
          </p>
          <button
            onClick={() => onNavigate('projects')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Explore Projects Directory
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const isReady = project.status === 'READY';
            const isFailed = project.status === 'FAILED';

            return (
              <div
                key={project.projectId}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase">
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
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-1">
                      {project.topicTitle}
                    </h2>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setActiveModalProjectId(project.projectId)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isReady ? 'View Compiler Logs' : 'Track Live Progress'}</span>
                    </button>

                    {isReady && (
                      <>
                        <button
                          onClick={() => handleDownload(project.projectId, 'pdf', project.courseCode)}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF ({project.pageCount} Pages)
                        </button>
                        <button
                          onClick={() => handleDownload(project.projectId, 'docx', project.courseCode)}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-300" /> Download DOCX
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quality Metrics & Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Total Rendered Pages</span>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {project.pageCount > 0 ? `${project.pageCount} Pages` : 'Synthesizing...'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Total Word Count</span>
                    <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                      {project.wordCount > 0 ? `${project.wordCount.toLocaleString()} Words` : 'Synthesizing...'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Duplicate Check Score</span>
                    <div className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {project.qualityReport ? `${project.qualityReport.duplicateScore}% (Original)` : 'Pending'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Institutional Forms</span>
                    <div className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      Guide Form + Decl.
                    </div>
                  </div>
                </div>

                {/* Chapters Summary if available */}
                {project.chaptersSummary && project.chaptersSummary.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Synthesized Chapter Structure:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      {project.chaptersSummary.map((ch) => (
                        <div
                          key={ch.number}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                        >
                          <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-300">
                            Ch {ch.number}: {ch.title.slice(0, 20)}...
                          </span>
                          <span className="font-bold text-blue-600 shrink-0">~{ch.pages}p</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Generation Progress Modal */}
      {activeModalProjectId && (
        <GenerationProgressModal
          projectId={activeModalProjectId}
          onClose={() => setActiveModalProjectId(null)}
          onRefreshProject={fetchProjects}
        />
      )}
    </div>
  );
};
