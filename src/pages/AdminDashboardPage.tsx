import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  FileText,
  CreditCard,
  Download,
  Settings,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Search,
  Check,
  Trash2,
  Edit,
  ExternalLink,
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  Activity,
  Ban,
  UserCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calendar,
  KeyRound,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Topic, Program, Subject, OrderRecord, Student, GenerationJob, AccountStatus, AdminAuditLog } from '../types';

interface AdminDashboardProps {
  initialTab?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardProps> = ({ initialTab, onNavigate }) => {
  const { user, getAuthHeaders, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'topics' | 'jobs' | 'orders' | 'downloads' | 'audit' | 'settings'>(
    (initialTab as any) || 'overview'
  );
  const [stats, setStats] = useState<any>(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [settings, setSettings] = useState<any>({
    minPageCount: 150,
    duplicateThresholdPercentage: 20,
    razorpayKeyId: 'rzp_test_mock_ignou',
    razorpaySecret: 'rzp_mock_secret',
    geminiApiKey: 'MY_GEMINI_API_KEY',
    academicDisclaimer: 'All generated projects are provided as academic reference materials.',
    dataRetention: {
      loginHistoryDays: 90,
      sessionLogsDays: 30,
      activityLogsDays: 180,
      downloadLogsDays: 365,
      autoPurgeEnabled: true
    }
  });

  // Advanced Student Management State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [studentActivityFilter, setStudentActivityFilter] = useState('ALL');
  const [studentSortBy, setStudentSortBy] = useState('lastActiveAt');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotalCount, setStudentTotalCount] = useState(0);
  const [studentStatsSummary, setStudentStatsSummary] = useState({
    total: 0,
    active: 0,
    disabled: 0,
    suspended: 0,
    onlineNow: 0
  });

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    program: 'MBA',
    courseCode: 'MMPP-001',
    title: '',
    description: '',
    focusAreas: 'Empirical Analysis, Supply Chain, Optimization'
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [studentSearch, studentStatusFilter, studentActivityFilter, studentSortBy, studentPage]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [stRes, topRes, progRes, ordRes, jobRes, dlRes, setRes, auditRes, analRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: getAuthHeaders() }),
        fetch('/api/topics'),
        fetch('/api/programs'),
        fetch('/api/admin/orders', { headers: getAuthHeaders() }),
        fetch('/api/admin/jobs', { headers: getAuthHeaders() }),
        fetch('/api/admin/downloads', { headers: getAuthHeaders() }),
        fetch('/api/admin/settings', { headers: getAuthHeaders() }),
        fetch('/api/admin/audit-logs', { headers: getAuthHeaders() }),
        fetch('/api/admin/analytics/detailed', { headers: getAuthHeaders() })
      ]);

      if (stRes.ok) setStats((await stRes.json()).stats);
      if (topRes.ok) setTopics((await topRes.json()).topics || []);
      if (progRes.ok) setPrograms((await progRes.json()).programs || []);
      if (ordRes.ok) setOrders((await ordRes.json()).orders || []);
      if (jobRes.ok) setJobs((await jobRes.json()).jobs || []);
      if (dlRes.ok) setDownloads((await dlRes.json()).downloads || []);
      if (setRes.ok) setSettings((await setRes.json()).settings || settings);
      if (auditRes.ok) setAuditLogs((await auditRes.json()).auditLogs || []);
      if (analRes.ok) setDetailedAnalytics(await analRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: studentSearch,
        status: studentStatusFilter,
        filter: studentActivityFilter,
        sortBy: studentSortBy,
        page: String(studentPage),
        limit: '10'
      });

      const res = await fetch(`/api/admin/students?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setStudentTotalPages(data.pagination?.totalPages || 1);
        setStudentTotalCount(data.pagination?.total || 0);
        if (data.summary) {
          setStudentStatsSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleToggleStudentStatus = async (studentId: string, currentStatus: AccountStatus, studentName: string) => {
    const newStatus: AccountStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const reason = prompt(`Reason for changing ${studentName}'s status to ${newStatus}:`, 'Administrative status toggle');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (res.ok) {
        setNotification(`Account status for ${studentName} changed to ${newStatus}`);
        setTimeout(() => setNotification(null), 4000);
        fetchStudents();
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurgeLogs = async () => {
    if (!window.confirm('Execute automated data retention cleanup policy now? This permanently purges expired logs per configured thresholds.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/retention/purge', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Retention purge completed successfully! Purged: ${data.result.purgedSessions} sessions, ${data.result.purgedActivityLogs} activity logs, ${data.result.purgedDownloadLogs} download logs.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title || !newTopic.courseCode) return;

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          program: newTopic.program,
          courseCode: newTopic.courseCode,
          title: newTopic.title,
          description: newTopic.description,
          focusAreas: newTopic.focusAreas.split(',').map((s) => s.trim())
        })
      });

      if (res.ok) {
        setShowAddTopicModal(false);
        setNewTopic({
          program: 'MBA',
          courseCode: 'MMPP-001',
          title: '',
          description: '',
          focusAreas: 'Empirical Analysis, Strategy, Optimization'
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setNotification('Settings and retention policies updated successfully!');
        setTimeout(() => setNotification(null), 4000);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
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

  if (!user || user.role !== 'admin') {
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
            This management console is strictly restricted to authorized IGNOU Project Hub administrators and faculty coordinators.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold uppercase">
              Administrator Portal
            </span>
            <span className="text-xs text-slate-500 font-semibold">Faculty & Student Telemetry Controls</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            IGNOU Project Hub Control Center
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Authenticated as: <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong></span>
            <span>•</span>
            <span className="font-mono text-slate-400">{user.email}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              fetchAdminData();
              fetchStudents();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || studentsLoading ? 'animate-spin' : ''}`} /> Refresh Telemetry
          </button>
          <button
            onClick={() => setShowAddTopicModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Topic to Pool
          </button>
          <button
            onClick={async () => {
              await logout();
              onNavigate('admin-login');
            }}
            className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview Analytics', icon: Layers },
          { id: 'students', label: `Student Management (${studentTotalCount || stats?.totalStudents || 0})`, icon: Users },
          { id: 'topics', label: `Topics Pool (${topics.length})`, icon: FileText },
          { id: 'jobs', label: `Generation Pipeline (${jobs.length})`, icon: Sparkles },
          { id: 'orders', label: `Orders & Revenue (${orders.length})`, icon: CreditCard },
          { id: 'downloads', label: `Download Trail (${downloads.length})`, icon: Download },
          { id: 'audit', label: `Admin Audit Logs (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'settings', label: 'System Settings', icon: Settings }
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => setActiveTab('students')}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Students</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.totalStudents || studentTotalCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {studentStatsSummary.active} Active • {studentStatsSummary.onlineNow} Online Now
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Topics in Pool</span>
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats?.availableTopics || topics.filter((t) => t.status === 'AVAILABLE').length} Avail
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Out of {topics.length} total curated topics</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Generated Projects</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.totalProjects || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">150+ Page Verified Dissertations</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Revenue</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                ₹{(stats?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{orders.filter((o) => o.status === 'PAID').length} Paid Orders</p>
            </div>
          </div>

          {/* Telemetry Breakdown */}
          {detailedAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Registration Velocity
                </h4>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {detailedAnalytics.registrationsLast7Days}
                </div>
                <p className="text-xs text-slate-500">New IGNOU candidates registered across the last 7 calendar days.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-600" /> Active Session Count
                </h4>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {detailedAnalytics.activeSessionsCount}
                </div>
                <p className="text-xs text-slate-500">Concurrent student web and mobile sessions currently authorized.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> Retention Health
                </h4>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  90-Day Policy
                </div>
                <p className="text-xs text-slate-500">Automated session, activity, and download telemetry purging active.</p>
              </div>
            </div>
          )}

          {/* Quality Benchmark Guarantee Strip */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-300">
                150+ Page Validation Threshold
              </span>
              <h3 className="text-lg font-bold">Academic Integrity & Page-Depth Guard Active</h3>
              <p className="text-xs text-slate-300">
                Every generated project is validated programmatically. Any dissertation below {settings.minPageCount} pages is automatically supplemented with econometric models.
              </p>
            </div>
            <div className="text-center bg-white/10 px-6 py-3 rounded-2xl border border-white/10 shrink-0">
              <div className="text-2xl font-black text-emerald-400">{settings.minPageCount}+ Pages</div>
              <div className="text-[11px] text-blue-200">Strict Minimum Floor</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT MANAGEMENT (ADVANCED) */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
          {/* Header & Metrics */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Student Profile & Activity Management
              </h3>
              <p className="text-xs text-slate-500">
                Real-time student registry, login histories, device identifiers, and academic telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl font-bold text-slate-700 dark:text-slate-300">
                Total: {studentTotalCount}
              </span>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold">
                Active: {studentStatsSummary.active}
              </span>
              {studentStatsSummary.suspended + studentStatsSummary.disabled > 0 && (
                <span className="px-3 py-1 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl font-bold">
                  Blocked: {studentStatsSummary.suspended + studentStatsSummary.disabled}
                </span>
              )}
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, email, enrollment, program..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <select
                value={studentStatusFilter}
                onChange={(e) => {
                  setStudentStatusFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Accounts Only</option>
                <option value="DISABLED">Disabled Accounts Only</option>
                <option value="SUSPENDED">Suspended Accounts Only</option>
              </select>
            </div>

            <div>
              <select
                value={studentActivityFilter}
                onChange={(e) => {
                  setStudentActivityFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="ALL">All Activity Windows</option>
                <option value="24h">Active within Last 24 Hours</option>
                <option value="7d">Active within Last 7 Days</option>
                <option value="30d">Active within Last 30 Days</option>
                <option value="never">Never Logged In</option>
              </select>
            </div>

            <div>
              <select
                value={studentSortBy}
                onChange={(e) => setStudentSortBy(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="lastActiveAt">Sort by: Last Active Time</option>
                <option value="totalLoginCount">Sort by: Total Logins</option>
                <option value="createdAt">Sort by: Registration Date</option>
                <option value="name">Sort by: Student Name</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Student & Identity</th>
                  <th className="p-3">Program & Year</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Logins & Orders</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {studentsLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading student directory...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No students match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const isOnline = (s.activeSessionsCount || 0) > 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                {s.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                  isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{s.name}</span>
                                {isOnline && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Online
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 flex items-center gap-2">
                                <span className="font-mono text-blue-600 dark:text-blue-400">{s.enrollmentNumber}</span>
                                <span>•</span>
                                <span>{s.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{s.program}</div>
                          <div className="text-slate-500 text-[11px]">{s.courseYear || '1st Year'} • {s.studyCenterCode || 'SC-0700'}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : s.accountStatus === 'SUSPENDED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {s.accountStatus || 'ACTIVE'}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white" title={s.lastActiveAt}>
                            {formatRelativeTime(s.lastActiveAt)}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            Joined: {new Date(s.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {s.totalLoginCount || 1} logins • {s.purchasedProjectsCount || 0} projects
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Paid: ₹{(s.totalPaidAmount || 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStudentStatus(s.id, s.accountStatus, s.name)}
                              title={s.accountStatus === 'ACTIVE' ? 'Disable Student Account' : 'Activate Student Account'}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                                s.accountStatus === 'ACTIVE'
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                              }`}
                            >
                              {s.accountStatus === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => onNavigate('admin-student-profile', { studentId: s.id })}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500">
              Page {studentPage} of {studentTotalPages} ({studentTotalCount} students)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={studentPage <= 1}
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={studentPage >= studentTotalPages}
                onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPICS POOL */}
      {activeTab === 'topics' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Academic Topic Pool ({topics.length} Total)
            </h3>
            <button
              onClick={() => setShowAddTopicModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Topic
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Program</th>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Topic Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Allocated To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {topics.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{t.program}</td>
                    <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{t.courseCode}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-md">{t.title}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : t.status === 'RESERVED'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{t.allocatedToStudentId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GENERATION JOBS */}
      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Active & Historic Generation Pipeline Jobs
          </h3>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.generationId}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {job.courseCode}
                    </span>{' '}
                    — <span className="font-bold text-slate-900 dark:text-white">{job.topicTitle}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {job.status} ({job.progress}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>

                {job.logs && job.logs.length > 0 && (
                  <div className="text-[11px] font-mono bg-slate-950 text-slate-300 p-2.5 rounded-xl max-h-24 overflow-y-auto space-y-0.5">
                    {job.logs.slice(-3).map((l, idx) => (
                      <div key={idx}>
                        <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="text-blue-400 font-bold">{l.step}:</span> {l.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS & REVENUE */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Orders & Payment Transactions ({orders.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Enrollment</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="p-3 font-mono font-bold">{o.orderId}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{o.studentName}</td>
                    <td className="p-3 font-mono text-slate-500">{o.enrollmentNumber}</td>
                    <td className="p-3 font-mono font-semibold text-blue-600">{o.courseCode}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">₹{o.amount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        {o.status}
                      </span>
                    </td>
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            File Download Audit Trail ({downloads.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Project ID</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {downloads.map((d) => (
                  <tr key={d.id}>
                    <td className="p-3 font-mono">{d.projectId}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{d.studentName}</td>
                    <td className="p-3 font-bold text-blue-600">{d.fileType}</td>
                    <td className="p-3 font-mono text-slate-400">{d.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-500">{new Date(d.downloadedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ADMIN AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Administrative Audit Trail
              </h3>
              <p className="text-xs text-slate-500">Immutable security logs tracking profile views, status modifications, and system configuration updates.</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              {auditLogs.length} Logged Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Administrator</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Student / Entity</th>
                  <th className="p-3">Metadata</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{log.adminName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300">
                      {log.studentName || log.targetId || log.targetType}
                    </td>
                    <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="p-3 font-sans text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM SETTINGS & DATA RETENTION */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                System & Quality Assurance Configuration
              </h3>
              <p className="text-xs text-slate-500">Control dissertation standards, Razorpay credentials, and telemetry retention.</p>
            </div>

            <button
              type="button"
              onClick={handlePurgeLogs}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Expired Logs Now
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Academic Standards */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Output Standards</h4>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Strict Minimum Page Threshold (Hard Minimum)
                </label>
                <input
                  type="number"
                  value={settings.minPageCount}
                  onChange={(e) => setSettings({ ...settings, minPageCount: Number(e.target.value) })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duplicate Overlap Detection Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.duplicateThresholdPercentage}
                  onChange={(e) => setSettings({ ...settings, duplicateThresholdPercentage: Number(e.target.value) })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            {/* Telemetry Retention Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Data Retention & Privacy Controls</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login History Retention (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.dataRetention?.loginHistoryDays || 90}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetention: {
                          ...(settings.dataRetention || {}),
                          loginHistoryDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Active Session Expiry / Retention (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.dataRetention?.sessionLogsDays || 30}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetention: {
                          ...(settings.dataRetention || {}),
                          sessionLogsDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Activity Logs Retention (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.dataRetention?.activityLogsDays || 180}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetention: {
                          ...(settings.dataRetention || {}),
                          activityLogsDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Download Audit Retention (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.dataRetention?.downloadLogsDays || 365}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetention: {
                          ...(settings.dataRetention || {}),
                          downloadLogsDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Disclaimer */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment & Disclaimer</h4>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  value={settings.razorpayKeyId}
                  onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Disclaimer Notice (Included in All Generated PDFs)
                </label>
                <textarea
                  rows={3}
                  value={settings.academicDisclaimer}
                  onChange={(e) => setSettings({ ...settings, academicDisclaimer: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              Save System Configuration
            </button>
          </form>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Project Topic to Available Pool
            </h3>

            <form onSubmit={handleCreateTopic} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Program</label>
                  <select
                    value={newTopic.program}
                    onChange={(e) => setNewTopic({ ...newTopic, program: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Course Code</label>
                  <input
                    type="text"
                    value={newTopic.courseCode}
                    onChange={(e) => setNewTopic({ ...newTopic, courseCode: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    placeholder="MCOP-001"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Research Topic Title</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="e.g. Empirical Study on Financial Derivatives in Indian Capital Markets"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Topic Description</label>
                <textarea
                  rows={3}
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="Comprehensive dissertation detailing econometric modeling and field surveys..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Focus Areas (Comma Separated)</label>
                <input
                  type="text"
                  value={newTopic.focusAreas}
                  onChange={(e) => setNewTopic({ ...newTopic, focusAreas: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save to Topic Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
