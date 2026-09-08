import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  FileText,
  Clock,
  RefreshCw,
  X,
  Layers,
  Check,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { GenerationJob, ProjectRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../lib/api';
import { StudentAuthDownloadModal } from './StudentAuthDownloadModal';
import { downloadProjectFile } from '../lib/downloadService';

interface ModalProps {
  projectId: string;
  onClose: () => void;
  onRefreshProject?: () => void;
}

export const GenerationProgressModal: React.FC<ModalProps> = ({ projectId, onClose, onRefreshProject }) => {
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingType, setDownloadingType] = useState<'pdf' | 'docx' | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState<'pdf' | 'docx'>('pdf');

  const fetchStatus = async () => {
    try {
      const res = await safeFetch<{ project: ProjectRecord; job?: GenerationJob }>(`/projects/${projectId}`);
      if (res.ok && res.data) {
        setProject(res.data.project);
        setJob(res.data.job || null);
        if (res.data.project.status === 'READY') {
          onRefreshProject?.();
        }
      } else {
        setError(res.error || 'Failed to fetch project progress');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 2.5 seconds if generation is in progress
    const interval = setInterval(() => {
      if (project?.status !== 'READY' && project?.status !== 'FAILED') {
        fetchStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [projectId, project?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await safeFetch<{ job: GenerationJob }>(`/projects/${projectId}/retry`, {
        method: 'POST'
      });
      if (res.ok && res.data) {
        setJob(res.data.job);
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  const executeDownload = async (type: 'pdf' | 'docx') => {
    setDownloadError(null);
    setDownloadingType(type);
    try {
      await downloadProjectFile({
        projectId,
        fileType: type,
        courseCode: project?.courseCode || 'PROJECT',
        topicTitle: project?.topicTitle,
        enrollmentNumber: project?.enrollmentNumber || user?.enrollmentNumber
      });
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download project file. Please try again.');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownload = (type: 'pdf' | 'docx') => {
    if (!user) {
      setPendingDownloadType(type);
      setAuthModalOpen(true);
      return;
    }
    executeDownload(type);
  };

  const steps = [
    { label: 'Topic Reserved', done: true },
    { label: 'Chapter-by-Chapter Synthesis', done: (job?.progress || 0) >= 60 || project?.status === 'READY' },
    { label: 'Duplicate & Quality Check', done: (job?.progress || 0) >= 70 || project?.status === 'READY' },
    { label: '150+ Page PDF Compilation', done: (job?.progress || 0) >= 80 || project?.status === 'READY' },
    { label: 'DOCX Document Build', done: (job?.progress || 0) >= 90 || project?.status === 'READY' },
    { label: 'Verified & Ready', done: project?.status === 'READY' }
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold">Academic Project Generation Engine</h3>
                <p className="text-xs text-blue-200">
                  {project ? `${project.program} (${project.courseCode}) — ${project.topicTitle.slice(0, 45)}...` : 'Processing Request...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium">Connecting to Academic Generation Server...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Generation Error</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Progress Bar & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      {project?.status === 'READY' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Academic Compilation Complete
                        </span>
                      ) : project?.status === 'FAILED' ? (
                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Generation Paused
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Active: {job?.currentPart || 'Synthesizing'}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {project?.status === 'READY' ? '100%' : `${job?.progress || 15}%`}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        project?.status === 'READY'
                          ? 'bg-emerald-500'
                          : project?.status === 'FAILED'
                          ? 'bg-red-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${project?.status === 'READY' ? 100 : job?.progress || 15}%` }}
                    ></div>
                  </div>
                </div>

                {/* Verified Metrics Badge (when READY) */}
                {project?.status === 'READY' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        150+ Page Quality Verification Passed
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                        VERIFIED
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center pt-1">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-emerald-100 dark:border-emerald-900">
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                          {project.pageCount} Pages
                        </div>
                        <div className="text-[11px] text-slate-500">Actual PDF Pages</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-emerald-100 dark:border-emerald-900">
                        <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                          {project.wordCount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500">Academic Words</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-emerald-100 dark:border-emerald-900">
                        <div className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                          7 Chapters
                        </div>
                        <div className="text-[11px] text-slate-500">+ Questionnaire & Refs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Checklist */}
                <div className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Generation Milestones
                  </p>
                  <div className="space-y-1.5">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs">
                        {step.done ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"></div>
                        )}
                        <span className={step.done ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Terminal / Step Logs */}
                {job?.logs && job.logs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Live Compiler Log
                    </p>
                    <div className="max-h-36 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl space-y-1 border border-slate-800">
                      {job.logs.map((log, lIdx) => (
                        <div key={lIdx} className="leading-tight">
                          <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                          <span className="text-blue-400 font-semibold">{log.step}:</span>{' '}
                          <span className="text-slate-200">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download Error Banner */}
                {downloadError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">Download Failed</p>
                      <p className="mt-0.5">{downloadError}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  {project?.status === 'READY' ? (
                    <>
                      <button
                        id="download-pdf-modal-btn"
                        onClick={() => handleDownload('pdf')}
                        disabled={downloadingType !== null}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 shadow-md flex items-center justify-center gap-2 transition"
                      >
                        {downloadingType === 'pdf' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Downloading...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4" /> Download PDF ({project.pageCount} Pages)
                          </>
                        )}
                      </button>
                      <button
                        id="download-docx-modal-btn"
                        onClick={() => handleDownload('docx')}
                        disabled={downloadingType !== null}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white dark:bg-slate-700 font-bold text-sm hover:bg-slate-900 disabled:opacity-60 shadow-md flex items-center justify-center gap-2 transition"
                      >
                        {downloadingType === 'docx' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Downloading...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-blue-400" /> Download Editable DOCX
                          </>
                        )}
                      </button>
                    </>
                  ) : project?.status === 'FAILED' ? (
                    <button
                      onClick={handleRetry}
                      disabled={retrying}
                      className="w-full py-3 px-4 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} /> Resume Failed Chapter
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-xs text-slate-500 font-medium">
                      Compilation in progress. Please keep this window open or check back in your dashboard.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {authModalOpen && (
        <StudentAuthDownloadModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          projectId={projectId}
          courseCode={project?.courseCode}
          topicTitle={project?.topicTitle}
          fileType={pendingDownloadType}
          onSuccess={() => {
            setAuthModalOpen(false);
            executeDownload(pendingDownloadType);
          }}
        />
      )}
    </>
  );
};

