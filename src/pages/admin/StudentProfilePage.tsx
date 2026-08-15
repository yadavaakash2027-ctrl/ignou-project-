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
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentProfileData, AccountStatus, SessionRecord, ActivityLog } from '../../types';

interface StudentProfilePageProps {
  studentId: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, onNavigate }) => {
  const { getAuthHeaders, user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'activity' | 'projects' | 'orders' | 'downloads'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    enrollmentNumber: '',
    mobileNumber: '',
    program: '',
    courseYear: '',
    studyCenterCode: '',
    accountStatus: 'ACTIVE' as AccountStatus
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error('Failed to load student profile');
      }
      const data: StudentProfileData = await res.json();
      setProfileData(data);
      setEditForm({
        name: data.student.name || '',
        email: data.student.email || '',
        enrollmentNumber: data.student.enrollmentNumber || '',
        mobileNumber: data.student.mobileNumber || '',
        program: data.student.program || '',
        courseYear: data.student.courseYear || '1st Year',
        studyCenterCode: data.student.studyCenterCode || 'SC-0700',
        accountStatus: data.student.accountStatus || 'ACTIVE'
      });
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update account status');
      }

      setShowStatusModal(false);
      setStatusReason('');
      setActionSuccess(`Account status successfully updated to ${targetStatus}`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update student profile');
      }

      setShowEditModal(false);
      setActionSuccess('Student profile information updated successfully');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      setShowPasswordModal(false);
      setNewPassword('');
      setActionSuccess('Password reset successfully. Active sessions revoked.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate all active sessions for this student?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${studentId}/terminate-sessions`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to terminate sessions');
      }

      setActionSuccess('All active student sessions have been forcibly terminated');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate sessions');
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '—';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    if (mins < 60) return `${mins}m ${remainingSecs}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'LOGOUT':
        return <LogOut className="w-4 h-4 text-slate-500" />;
      case 'TOPIC_RESERVED':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'PAYMENT_STARTED':
      case 'PAYMENT_VERIFIED':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'PROJECT_GENERATION_STARTED':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'DOWNLOAD_PDF':
      case 'DOWNLOAD_DOCX':
        return <Download className="w-4 h-4 text-teal-600" />;
      case 'ACCOUNT_STATUS_CHANGED':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner border border-red-200 dark:border-red-800">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-mono text-xs font-bold uppercase tracking-wider">
            HTTP 403 • Access Forbidden
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Administrator Access Required
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Detailed student profiles and security audit logs are strictly protected under IGNOU academic data governance policies.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate('admin-login')}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In to Admin Portal</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Return to Student Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Loading comprehensive student telemetry profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{error || 'Student Not Found'}</h2>
        <button
          onClick={() => onNavigate('admin-dashboard', { tab: 'students' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </button>
      </div>
    );
  }

  const { student, stats, activeSessions, sessions, activities, projects, orders, downloads } = profileData;
  const isOnline = activeSessions.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('admin-dashboard', { tab: 'students' })}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Student ID:</span>
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
            {student.id}
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {/* Student Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <span
                title={isOnline ? 'Active Online Session' : 'Offline'}
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {student.name}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    student.accountStatus === 'ACTIVE'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : student.accountStatus === 'SUSPENDED'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                  }`}
                >
                  {student.accountStatus || 'ACTIVE'}
                </span>
                {isOnline && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online Now
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {student.enrollmentNumber}
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{student.program}</span>
                <span>•</span>
                <span>{student.courseYear || '1st Year'}</span>
                <span>•</span>
                <span>Study Center: {student.studyCenterCode || 'SC-0700'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setTargetStatus(student.accountStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
                setShowStatusModal(true);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                student.accountStatus === 'ACTIVE'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {student.accountStatus === 'ACTIVE' ? (
                <>
                  <Ban className="w-3.5 h-3.5" /> Disable / Suspend
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate Account
                </>
              )}
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset Password
            </button>

            {isOnline && (
              <button
                onClick={handleTerminateSessions}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Revoke Sessions
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Logins</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{stats.totalLogins}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Active Sessions</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.activeSessions}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Projects Purchased</span>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.totalProjects}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Paid</span>
            <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">₹{stats.totalPaidAmount.toLocaleString()}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Files Downloaded</span>
            <div className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">{stats.totalDownloads}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Last Active</span>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate" title={student.lastActiveAt}>
              {formatRelativeTime(student.lastActiveAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Personal Information', icon: User },
          { id: 'sessions', label: `Login & Sessions (${sessions.length})`, icon: Laptop },
          { id: 'activity', label: `Activity Timeline (${activities.length})`, icon: Activity },
          { id: 'projects', label: `Projects (${projects.length})`, icon: FileText },
          { id: 'orders', label: `Orders (${orders.length})`, icon: CreditCard },
          { id: 'downloads', label: `Download Logs (${downloads.length})`, icon: Download }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & PERSONAL INFORMATION */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Student Identity & Academic Data</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">IGNOU Enrollment Number</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{student.enrollmentNumber}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Registered Program</span>
                <span className="font-bold text-slate-900 dark:text-white">{student.program}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Curriculum Year</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{student.courseYear || '1st Year'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Study Center Code</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{student.studyCenterCode || 'SC-0700'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Account Role</span>
                <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{student.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Contact & Account Telemetry</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Mobile Number</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.mobileNumber}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Account Created</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(student.createdAt).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Last Login Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300">{student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString() : 'Never'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Last Logout Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300">{student.lastLogoutAt ? new Date(student.lastLogoutAt).toLocaleString() : 'Active / Session open'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Last Activity Ping</span>
                <span className="text-slate-700 dark:text-slate-300">{student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SESSIONS & DEVICES */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Login & Session Logs</h3>
              <p className="text-xs text-slate-500">Hardware device identification, operating system, and IP history.</p>
            </div>
            {isOnline && (
              <button
                onClick={handleTerminateSessions}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Terminate Active Sessions
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Device & Browser</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Login Time</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {sessions.map((sess) => (
                  <tr key={sess.sessionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(sess.deviceType)}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {sess.browser || 'Browser'} on {sess.operatingSystem || 'OS'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{sess.sessionId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sess.status === 'ACTIVE'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 animate-pulse'
                            : sess.status === 'LOGGED_OUT'
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{sess.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(sess.loginAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{formatRelativeTime(sess.lastActiveAt)}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {formatDuration(sess.sessionDurationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Comprehensive Student Activity Trail</h3>
            <p className="text-xs text-slate-500">Chronological telemetry stream tracking logins, downloads, checkouts, and system changes.</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {activities.map((act) => (
              <div key={act.activityId} className="relative flex items-start gap-4">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                </div>

                <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(act.eventType)}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{act.eventType.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(act.timestamp).toLocaleString()} ({formatRelativeTime(act.timestamp)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Purchased & Generated Projects</h3>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No projects purchased by this student yet.</p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.projectId}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{p.courseCode}</span>
                        <span className="text-xs font-bold text-slate-500">• {p.program}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{p.topicTitle}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.status === 'READY' && (
                        <>
                          <a
                            href={`/api/projects/${p.projectId}/download/pdf`}
                            download
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF ({p.pageCount || 150}+ pgs)
                          </a>
                          <a
                            href={`/api/projects/${p.projectId}/download/docx`}
                            download
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                          >
                            <Download className="w-3.5 h-3.5" /> DOCX
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Pages: <b className="text-slate-800 dark:text-slate-200">{p.pageCount || 150}</b></span>
                    <span>Words: <b className="text-slate-800 dark:text-slate-200">{p.wordCount?.toLocaleString() || '35,000'}</b></span>
                    <span>Order: <b className="font-mono text-slate-800 dark:text-slate-200">{p.orderId}</b></span>
                    <span>Created: <b>{new Date(p.createdAt).toLocaleDateString()}</b></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Orders & Payment Invoices</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Topic Title</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="p-3 font-mono font-bold">{o.orderId}</td>
                    <td className="p-3 font-mono font-semibold text-blue-600">{o.courseCode}</td>
                    <td className="p-3 max-w-xs truncate">{o.topicTitle}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">₹{o.amount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{o.razorpayPaymentId || '—'}</td>
                    <td className="p-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DOWNLOADS */}
      {activeTab === 'downloads' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">File Download Records for this Student</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Project ID</th>
                  <th className="p-3">File Format</th>
                  <th className="p-3">Client IP</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {downloads.map((d) => (
                  <tr key={d.id}>
                    <td className="p-3 font-mono">{d.projectId}</td>
                    <td className="p-3 font-bold text-blue-600">{d.fileType}</td>
                    <td className="p-3 font-mono text-slate-500">{d.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(d.downloadedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Modify Student Account Status
            </h3>

            <p className="text-xs text-slate-500">
              Changing the account status to <b>DISABLED</b> or <b>SUSPENDED</b> immediately blocks student login and revokes all active session tokens.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">New Account Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as AccountStatus)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Full Access)</option>
                  <option value="DISABLED">DISABLED (Login Blocked)</option>
                  <option value="SUSPENDED">SUSPENDED (Pending Investigation)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Audit Reason / Justification</label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter administrative rationale for audit trail..."
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {submitting ? 'Updating...' : 'Confirm Status Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" /> Edit Student Information
            </h3>

            <form onSubmit={handleEditProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    value={editForm.enrollmentNumber}
                    onChange={(e) => setEditForm({ ...editForm, enrollmentNumber: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Program</label>
                  <input
                    type="text"
                    value={editForm.program}
                    onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Course Year</label>
                  <input
                    type="text"
                    value={editForm.courseYear}
                    onChange={(e) => setEditForm({ ...editForm, courseYear: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Study Center</label>
                  <input
                    type="text"
                    value={editForm.studyCenterCode}
                    onChange={(e) => setEditForm({ ...editForm, studyCenterCode: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" /> Admin Reset Student Password
            </h3>

            <p className="text-xs text-slate-500">
              Setting a new password will immediately invalidate all existing login sessions for <b>{student.name}</b>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">New Temporary Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {submitting ? 'Resetting...' : 'Set Password & Revoke Sessions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
