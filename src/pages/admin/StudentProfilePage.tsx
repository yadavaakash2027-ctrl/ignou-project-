import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  FileText,
  CreditCard,
  Download,
  Activity,
  KeyRound,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  LogOut,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  ExternalLink,
  Lock,
  History,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Student, AccountStatus, SessionRecord, ActivityLog } from '../../types';

interface StudentProfilePageProps {
  studentId: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, onNavigate }) => {
  const { getAuthHeaders, user: currentUser } = useAuth();
  
  // Real Firestore data
  const [student, setStudent] = useState<any | null>(null);
  const [loginHistory, setLoginHistory] = useState<SessionRecord[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active navigation tab inside profile
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'projects' | 'orders' | 'downloads'>('overview');

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    enrollmentNumber: '',
    mobileNumber: '',
    program: '',
    courseYear: '1st Year',
    studyCenterCode: '07107',
    accountStatus: 'ACTIVE' as AccountStatus
  });

  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Student Profile, Login History and Downloads
  const fetchProfileFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          setStudent(data.student);
          setEditForm({
            name: data.student.name || data.student.fullName || '',
            email: data.student.email || '',
            enrollmentNumber: data.student.enrollmentNumber || '',
            mobileNumber: data.student.mobileNumber || '',
            program: data.student.program || '',
            courseYear: data.student.courseYear || '1st Year',
            studyCenterCode: data.student.studyCenterCode || '07107',
            accountStatus: data.student.accountStatus || 'ACTIVE'
          });
          if (data.sessions) setLoginHistory(data.sessions);
          if (data.downloads) setDownloads(data.downloads);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to load student profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while fetching student data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileFromApi();
  }, [studentId]);

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleStatusUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: targetStatus, reason: statusReason })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Account status updated to ${targetStatus}`);
        setStudent((prev: any) => (prev ? { ...prev, accountStatus: targetStatus } : prev));
      } else {
        showToast(`Failed: ${data.error || 'Update failed'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
      setShowStatusModal(false);
      setStatusReason('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.student) setStudent(data.student);
        showToast('Student profile successfully updated');
        setShowEditModal(false);
      } else {
        showToast(`Failed: ${data.error || 'Update failed'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8 bg-slate-950 text-slate-100">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Loading student profile from Firestore...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-black text-white">Student Record Not Found</h2>
          <p className="text-xs text-slate-400">
            No profile exists in Firestore for student ID: <code className="font-mono text-red-400">{studentId}</code>
          </p>
          <button
            onClick={() => onNavigate('admin-dashboard', { tab: 'students' })}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
          >
            Return to All Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Top Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-dashboard', { tab: 'students' })}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Back to All Students"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Admin</span>
              <span>/</span>
              <span>Students</span>
              <span>/</span>
              <span className="text-red-400 font-mono font-semibold">{student.enrollmentNumber || student.id}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{student.fullName || student.name}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  student.accountStatus === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                    : 'bg-rose-950 text-rose-400 border-rose-800/60'
                }`}
              >
                {student.accountStatus || 'ACTIVE'}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetStatus(student.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
              setShowStatusModal(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Ban className="w-4 h-4 text-amber-400" />
            <span>Change Status</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Info', icon: User },
          { id: 'sessions', label: `Login History (${loginHistory.length})`, icon: History },
          { id: 'downloads', label: `Downloads (${downloads.length})`, icon: Download },
          { id: 'projects', label: 'Project Info', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: OVERVIEW (PERSONAL & LOGIN INFORMATION) */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PERSONAL INFORMATION CARD */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">PERSONAL INFORMATION</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Firestore: students/{student.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Full Name</span>
                <p className="font-bold text-white text-sm">{student.fullName || student.name || '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Student ID</span>
                <p className="font-mono font-bold text-slate-300 text-sm">{student.studentId || student.firebaseUid || student.id}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">IGNOU Enrollment Number</span>
                <p className="font-mono font-black text-red-400 text-sm">{student.enrollmentNumber || '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Mobile Number</span>
                <p className="font-mono font-bold text-slate-200 text-sm">{student.mobileNumber || '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Email Address</span>
                <p className="font-bold text-slate-200 text-sm truncate">{student.email || '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Program Code</span>
                <p className="font-mono font-bold text-white text-sm">{student.program || '—'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Account Status</span>
                <p className="font-bold text-emerald-400 text-sm">{student.accountStatus || 'ACTIVE'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Signup Date</span>
                <p className="font-mono text-slate-300 text-sm">
                  {student.createdAt ? new Date(student.createdAt).toLocaleString() : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Study Center Code</span>
                <p className="font-mono text-slate-300 text-sm">{student.studyCenterCode || '07107'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Course Year</span>
                <p className="text-slate-300 text-sm font-semibold">{student.courseYear || '1st Year'}</p>
              </div>
            </div>
          </div>

          {/* LOGIN INFORMATION CARD */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">LOGIN INFORMATION</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Last Login</span>
                <p className="font-mono font-bold text-white text-sm">
                  {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString() : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Last Logout</span>
                <p className="font-mono font-bold text-slate-300 text-sm">
                  {student.lastLogoutAt ? new Date(student.lastLogoutAt).toLocaleString() : 'Session Active / None'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Total Login Count</span>
                <p className="font-mono font-black text-purple-400 text-xl">{student.totalLoginCount || 1}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 font-medium">Last Active (Heartbeat)</span>
                <p className="font-mono text-slate-300 text-xs">
                  {student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: LOGIN HISTORY (SUBCOLLECTION) */}
      {/* ============================================================== */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                LOGIN HISTORY (students/{student.id}/loginHistory)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{loginHistory.length} total sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Login Date</th>
                  <th className="px-4 py-3">Login Time</th>
                  <th className="px-4 py-3">Logout Date</th>
                  <th className="px-4 py-3">Logout Time</th>
                  <th className="px-4 py-3">Session Duration</th>
                  <th className="px-4 py-3">Session Status</th>
                  <th className="px-4 py-3">Device / Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loginHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No recorded login sessions yet for this student.
                    </td>
                  </tr>
                ) : (
                  loginHistory.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {s.loginAt ? new Date(s.loginAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {s.loginAt ? new Date(s.loginAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {s.logoutAt ? new Date(s.logoutAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {s.logoutAt ? new Date(s.logoutAt).toLocaleTimeString() : 'Active'}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                        {s.sessionDurationSeconds
                          ? `${Math.floor(s.sessionDurationSeconds / 60)}m ${s.sessionDurationSeconds % 60}s`
                          : (s as any).sessionDuration || 'Active'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {s.browser} • {s.operatingSystem} ({s.deviceType})
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: DOWNLOAD INFORMATION */}
      {/* ============================================================== */}
      {activeTab === 'downloads' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">DOWNLOAD INFORMATION</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{downloads.length} logged downloads</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Downloaded Project Title</th>
                  <th className="px-4 py-3">File Type</th>
                  <th className="px-4 py-3">Download Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {downloads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No project downloads logged for this student yet.
                    </td>
                  </tr>
                ) : (
                  downloads.map((dl) => (
                    <tr key={dl.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-red-400">{dl.courseCode}</td>
                      <td className="px-4 py-3 font-semibold text-white">{dl.topicTitle || 'IGNOU Dissertation Report'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-950 text-blue-400 uppercase border border-blue-800/40">
                          {dl.fileType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                        {dl.downloadedAt ? new Date(dl.downloadedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: PROJECT INFORMATION */}
      {/* ============================================================== */}
      {activeTab === 'projects' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">PROJECT INFORMATION</h2>
            </div>
          </div>

          <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Active Curriculum Program: {student.program}</span>
              <span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono font-bold text-[10px]">
                SYLLABUS 2026
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Student is enrolled in {student.program} dissertation curriculum. Any academic generation requests or downloaded synopsis files for course codes like {student.program === 'MBA' ? 'MMPP-001' : student.program === 'MCA' ? 'MCSP-060' : 'BCSP-064'} are synchronized with their student identity.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MODAL */}
      {/* ============================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Student Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.enrollmentNumber}
                    onChange={(e) => setEditForm({ ...editForm, enrollmentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Program</label>
                  <input
                    type="text"
                    required
                    value={editForm.program}
                    onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Account Status</label>
                  <select
                    value={editForm.accountStatus}
                    onChange={(e) => setEditForm({ ...editForm, accountStatus: e.target.value as AccountStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STATUS CHANGE MODAL */}
      {/* ============================================================== */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Change Account Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-400">Select Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ACTIVE', 'SUSPENDED', 'DISABLED'] as AccountStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTargetStatus(st)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                      targetStatus === st
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reason for status change (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Administrative verification"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Updating...' : 'Confirm Status Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
