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
  LogOut,
  Menu,
  X,
  Eye,
  UserX,
  History,
  Phone,
  Mail,
  BookOpen,
  UserPlus,
  FileSpreadsheet,
  Database,
  Save,
  Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Topic, Program, Subject, OrderRecord, Student, GenerationJob, AccountStatus, AdminAuditLog } from '../types';

interface AdminDashboardProps {
  initialTab?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

async function safeJson<T = any>(res: Response | null | undefined): Promise<T | null> {
  if (!res) return null;
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const AdminDashboardPage: React.FC<AdminDashboardProps> = ({ initialTab, onNavigate }) => {
  const { user, getAuthHeaders, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'login-history' | 'projects' | 'orders' | 'downloads' | 'audit' | 'settings'>(
    (initialTab as any) || 'overview'
  );
  
  // Real Firestore students & downloads
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [firestoreDownloads, setFirestoreDownloads] = useState<any[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Other backend datasets (topics, programs, orders, jobs)
  const [topics, setTopics] = useState<Topic[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [settings, setSettings] = useState<any>({
    minPageCount: 150,
    duplicateThresholdPercentage: 20,
    directUpiId: 'ignouprojects@okaxis',
    directUpiName: 'IGNOU Academic Projects',
    paymentMode: 'Direct / UPI (No Gateway)',
    geminiApiKey: 'GEMINI_AI_STUDIO_LIVE',
    academicDisclaimer: 'All generated projects are provided as genuine academic reference materials.'
  });

  // Screenshot preview modal for manual UPI orders
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Search & Filter for All Students Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'lastLogin' | 'name' | 'enrollment'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mobile sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick status update modal
  const [statusModalStudent, setStatusModalStudent] = useState<any | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    studentId: '',
    enrollmentNumber: '',
    email: '',
    mobileNumber: '',
    name: '',
    program: 'BCA',
    courseYear: '1st Year',
    studyCenterCode: 'SC-0700',
    accountStatus: 'ACTIVE' as AccountStatus,
    password: 'Student@123'
  });
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Edit Student Modal State
  const [editStudentModal, setEditStudentModal] = useState<any | null>(null);
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentError, setEditStudentError] = useState<string | null>(null);

  // Delete Student State
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // InsForge Storage State
  const [insforgeStatus, setInsforgeStatus] = useState<{
    connected: boolean;
    projectUrl: string;
    totalStudents: number;
  }>({
    connected: true,
    projectUrl: 'https://8u4grv85.us-east.insforge.app',
    totalStudents: 0
  });
  const [insforgeSyncing, setInsforgeSyncing] = useState(false);
  const [insforgeSyncMsg, setInsforgeSyncMsg] = useState<string | null>(null);

  const fetchInsforgeStatus = async () => {
    try {
      const res = await fetch('/api/insforge/status');
      if (res && res.ok) {
        const data = await safeJson(res);
        if (data) setInsforgeStatus(data);
      }
    } catch {
      // ignore
    }
  };

  const handleSyncToInsForge = async () => {
    setInsforgeSyncing(true);
    setInsforgeSyncMsg(null);
    try {
      const res = await fetch('/api/insforge/sync', { method: 'POST' });
      if (res && res.ok) {
        const data = await safeJson(res);
        setInsforgeSyncMsg(data?.message || 'Synced successfully!');
        fetchInsforgeStatus();
      }
    } catch (err: any) {
      setInsforgeSyncMsg('Sync failed: ' + (err?.message || 'Network error'));
    } finally {
      setInsforgeSyncing(false);
    }
  };

  // 1. Fetch Students & Downloads from backend API
  const fetchStudentsAndDownloads = async () => {
    setFirestoreLoading(true);
    setFirestoreError(null);
    fetchInsforgeStatus();
    try {
      const [stuRes, dlRes] = await Promise.all([
        fetch('/api/admin/students?limit=200', { headers: getAuthHeaders() }).catch(() => null),
        fetch('/api/admin/downloads', { headers: getAuthHeaders() }).catch(() => null)
      ]);

      if (stuRes && stuRes.ok) {
        const data = await safeJson(stuRes);
        if (data?.students) setAllStudents(data.students);
      }
      if (dlRes && dlRes.ok) {
        const data = await safeJson(dlRes);
        if (data?.downloads) setFirestoreDownloads(data.downloads);
      }
    } catch (err: any) {
      setFirestoreError(err.message || 'Failed to load students data');
    } finally {
      setFirestoreLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndDownloads();
  }, []);

  // 2. Fetch ancillary items (topics, programs, orders, jobs)
  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      const [topRes, progRes, ordRes, jobRes, auditRes] = await Promise.all([
        fetch('/api/topics').catch(() => null),
        fetch('/api/programs').catch(() => null),
        fetch('/api/admin/orders', { headers: getAuthHeaders() }).catch(() => null),
        fetch('/api/admin/jobs', { headers: getAuthHeaders() }).catch(() => null),
        fetch('/api/admin/audit-logs', { headers: getAuthHeaders() }).catch(() => null)
      ]);

      const [topData, progData, ordData, jobData, auditData] = await Promise.all([
        safeJson(topRes),
        safeJson(progRes),
        safeJson(ordRes),
        safeJson(jobRes),
        safeJson(auditRes)
      ]);

      if (topData?.topics) setTopics(topData.topics);
      if (progData?.programs) setPrograms(progData.programs);
      if (ordData?.orders) setOrders(ordData.orders);
      if (jobData?.jobs) setJobs(jobData.jobs);
      if (auditData?.auditLogs) setAuditLogs(auditData.auditLogs);
    } catch (err) {
      console.warn('Auxiliary admin data fetch notice:', err);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      const data = await safeJson(res);
      if (res && res.ok) {
        showNotification('Order approved & project generation unlocked');
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: 'PAID' } : o)));
      } else {
        showNotification(data?.error || 'Failed to approve order');
      }
    } catch {
      showNotification('Error approving order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('Enter reason for order rejection:', 'Invalid UTR or unverified transaction');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason })
      });
      const data = await safeJson(res);
      if (res && res.ok) {
        showNotification('Order marked as rejected');
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: 'REJECTED', rejectionReason: reason } : o)));
      } else {
        showNotification(data?.error || 'Failed to reject order');
      }
    } catch {
      showNotification('Error rejecting order');
    }
  };

  // -------------------------------------------------------------
  // REAL-TIME STATS CALCULATION (NO HARDCODING)
  // -------------------------------------------------------------
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const totalStudentsCount = allStudents.length;
  const activeStudentsCount = allStudents.filter((s) => s.accountStatus === 'ACTIVE').length;
  
  const newStudentsTodayCount = allStudents.filter((s) => {
    if (!s.createdAt || s.createdAt === '—') return false;
    const time = new Date(s.createdAt).getTime();
    return !isNaN(time) && time >= startOfToday;
  }).length;

  const totalLoginsTodayCount = allStudents.filter((s) => {
    if (!s.lastLoginAt || s.lastLoginAt === '—') return false;
    const time = new Date(s.lastLoginAt).getTime();
    return !isNaN(time) && time >= startOfToday;
  }).length;

  const totalLogoutsTodayCount = allStudents.filter((s) => {
    if (!s.lastLogoutAt || s.lastLogoutAt === '—') return false;
    const time = new Date(s.lastLogoutAt).getTime();
    return !isNaN(time) && time >= startOfToday;
  }).length;

  // -------------------------------------------------------------
  // FILTERING, SEARCHING & SORTING STUDENTS
  // -------------------------------------------------------------
  const filteredStudents = allStudents.filter((student) => {
    // Search query matches Name, Enrollment Number, Mobile, Email, Student ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (student.name || '').toLowerCase().includes(q) || (student.fullName || '').toLowerCase().includes(q);
      const matchEnroll = (student.enrollmentNumber || '').toLowerCase().includes(q);
      const matchMobile = (student.mobileNumber || '').toLowerCase().includes(q);
      const matchEmail = (student.email || '').toLowerCase().includes(q);
      const matchId = (student.id || '').toLowerCase().includes(q) || (student.studentId || '').toLowerCase().includes(q);

      if (!matchName && !matchEnroll && !matchMobile && !matchEmail && !matchId) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL' && student.accountStatus !== statusFilter) {
      return false;
    }

    // Program filter
    if (programFilter !== 'ALL' && student.program !== programFilter) {
      return false;
    }

    return true;
  });

  // Sort
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'lastLogin') {
      return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
    }
    if (sortBy === 'name') {
      return (a.name || a.fullName || '').localeCompare(b.name || b.fullName || '');
    }
    if (sortBy === 'enrollment') {
      return (a.enrollmentNumber || '').localeCompare(b.enrollmentNumber || '');
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Create and Store New Student Record
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);
    setAddStudentLoading(true);

    try {
      if (!addStudentForm.name.trim()) {
        throw new Error('Please enter Student Full Name.');
      }
      if (!addStudentForm.enrollmentNumber.trim()) {
        throw new Error('Please enter IGNOU Enrollment Number.');
      }
      if (!addStudentForm.email.trim()) {
        throw new Error('Please enter Student Email ID.');
      }
      if (!addStudentForm.mobileNumber.trim()) {
        throw new Error('Please enter Student Phone / Mobile Number.');
      }

      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(addStudentForm)
      });

      const data = await safeJson(res);
      if (!res || !res.ok) {
        throw new Error(data?.error || 'Failed to save student record');
      }

      showNotification(`Student ${data?.student?.name || addStudentForm.name} saved successfully!`);
      setShowAddStudentModal(false);
      setAddStudentForm({
        studentId: '',
        enrollmentNumber: '',
        email: '',
        mobileNumber: '',
        name: '',
        program: 'BCA',
        courseYear: '1st Year',
        studyCenterCode: 'SC-0700',
        accountStatus: 'ACTIVE',
        password: 'Student@123'
      });
      fetchStudentsAndDownloads();
    } catch (err: any) {
      setAddStudentError(err.message || 'Error occurred while storing student record');
    } finally {
      setAddStudentLoading(false);
    }
  };

  // Edit Existing Student Record
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentModal) return;
    setEditStudentError(null);
    setEditStudentLoading(true);

    try {
      const res = await fetch(`/api/admin/students/${editStudentModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(editStudentModal)
      });

      const data = await safeJson(res);
      if (!res || !res.ok) {
        throw new Error(data?.error || 'Failed to update student record');
      }

      showNotification(`Student profile updated successfully.`);
      setEditStudentModal(null);
      fetchStudentsAndDownloads();
    } catch (err: any) {
      setEditStudentError(err.message || 'Error updating student');
    } finally {
      setEditStudentLoading(false);
    }
  };

  // Delete Student Record
  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${deleteConfirmStudent.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await safeJson(res);
      if (!res || !res.ok) {
        throw new Error(data?.error || 'Failed to delete student');
      }
      showNotification(`Student record removed from repository.`);
      setDeleteConfirmStudent(null);
      fetchStudentsAndDownloads();
    } catch (err: any) {
      showNotification(`Delete failed: ${err.message || 'Error occurred'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export Student Directory to CSV
  const handleExportCSV = () => {
    if (allStudents.length === 0) {
      showNotification('No student records available to export.');
      return;
    }

    const headers = ['Student ID', 'Enrollment Number', 'Full Name', 'Email ID', 'Phone Number', 'Program', 'Study Center', 'Account Status', 'Signup Date', 'Last Login'];
    const rows = allStudents.map((st) => [
      `"${st.studentId || st.id || ''}"`,
      `"${st.enrollmentNumber || ''}"`,
      `"${(st.name || st.fullName || '').replace(/"/g, '""')}"`,
      `"${st.email || ''}"`,
      `"${st.mobileNumber || ''}"`,
      `"${st.program || ''}"`,
      `"${st.studyCenterCode || 'SC-0700'}"`,
      `"${st.accountStatus || 'ACTIVE'}"`,
      `"${st.createdAt ? new Date(st.createdAt).toLocaleDateString() : ''}"`,
      `"${st.lastLoginAt ? new Date(st.lastLoginAt).toLocaleString() : 'Never'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IGNOU_Student_Repository_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Student Directory exported to CSV successfully.');
  };

  const handleUpdateStatus = async (studentId: string, newStatus: AccountStatus) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await safeJson(res);
      if (res && res.ok) {
        showNotification(`Student status updated to ${newStatus}`);
        setStatusModalStudent(null);
        fetchStudentsAndDownloads();
      } else {
        showNotification(`Failed to update status: ${data?.error || 'Request failed'}`);
      }
    } catch (err: any) {
      showNotification(`Failed to update status: ${err.message || 'Error occurred'}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out from the Admin Portal?')) {
      await logout();
      onNavigate('admin-login');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users, badge: allStudents.length },
    { id: 'login-history', label: 'Login History', icon: History },
    { id: 'projects', label: 'Projects', icon: FileText, badge: topics.length },
    { id: 'orders', label: 'Payments', icon: CreditCard, badge: orders.length },
    { id: 'downloads', label: 'Downloads', icon: Download, badge: firestoreDownloads.length },
    { id: 'audit', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">IGNOU Admin</h1>
            <p className="text-[10px] text-slate-400 font-mono">Live Firebase</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ============================================================== */}
      {/* SIDEBAR NAVIGATION */}
      {/* ============================================================== */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900 border-r border-slate-800/80 flex-shrink-0 flex flex-col z-30`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/20 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white">ADMIN PORTAL</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">ignou-project-hub</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center text-xs font-bold font-mono">
              ADM
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Firebase Auth Role: Admin
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-bold transition-colors border border-slate-700 hover:border-red-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Breadcrumb & Live Sync Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Admin Portal</span>
              <span>/</span>
              <span className="text-red-400 font-semibold uppercase">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {activeTab === 'overview' && 'Administrative Overview'}
              {activeTab === 'students' && 'All Registered Students'}
              {activeTab === 'login-history' && 'Student Login & Session Records'}
              {activeTab === 'projects' && 'Curriculum & Project Management'}
              {activeTab === 'orders' && 'Payment Transactions'}
              {activeTab === 'downloads' && 'Project Downloads Audit'}
              {activeTab === 'audit' && 'Security & Activity Logs'}
              {activeTab === 'settings' && 'Platform Configuration'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-[11px]">Real-time Firestore Connected</span>
            </div>
            <button
              onClick={() => {
                fetchAuxiliaryData();
                showNotification('Refreshed real-time sync with database');
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Firestore Security Rules / Permissions Helper Banner */}
        {firestoreError && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Firestore Security Rules Notice: {firestoreError}</span>
            </div>
            <p className="text-amber-300/80 leading-relaxed">
              If your Firebase project <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-amber-200">ignou-project-hub-236e1</code> is in default locked mode, paste the provided <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-amber-200">firestore.rules</code> into your Firebase Console &rarr; Firestore Database &rarr; Rules tab and click <strong>Publish</strong>.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW (DASHBOARD STATS) */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Real Firebase Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: TOTAL STUDENTS */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-2 hover:border-slate-700 transition-colors shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL STUDENTS</span>
                  <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{firestoreLoading ? '—' : totalStudentsCount}</span>
                  <span className="text-[10px] text-blue-400 font-semibold font-mono">Real Firebase</span>
                </div>
                <p className="text-[11px] text-slate-500">Verified IGNOU enrolled student accounts</p>
              </div>

              {/* Card 2: ACTIVE STUDENTS */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-2 hover:border-slate-700 transition-colors shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">ACTIVE STUDENTS</span>
                  <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{firestoreLoading ? '—' : activeStudentsCount}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold font-mono">Active status</span>
                </div>
                <p className="text-[11px] text-slate-500">Currently permitted academic accounts</p>
              </div>

              {/* Card 3: NEW STUDENTS TODAY */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-2 hover:border-slate-700 transition-colors shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">NEW TODAY</span>
                  <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">{firestoreLoading ? '—' : newStudentsTodayCount}</span>
                  <span className="text-[10px] text-amber-400 font-semibold font-mono">Past 24h</span>
                </div>
                <p className="text-[11px] text-slate-500">Newly registered students today</p>
              </div>

              {/* Card 4: TOTAL LOGINS TODAY */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-2 hover:border-slate-700 transition-colors shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">LOGINS TODAY</span>
                  <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                    <History className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-400">{firestoreLoading ? '—' : totalLoginsTodayCount}</span>
                  <span className="text-[10px] text-purple-400 font-semibold font-mono">Sessions</span>
                </div>
                <p className="text-[11px] text-slate-500">Authentication sessions active today</p>
              </div>

              {/* Card 5: TOTAL LOGOUTS TODAY */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-2 hover:border-slate-700 transition-colors shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">LOGOUTS TODAY</span>
                  <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40">
                    <LogOut className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-400">{firestoreLoading ? '—' : totalLogoutsTodayCount}</span>
                  <span className="text-[10px] text-rose-400 font-semibold font-mono">Terminated</span>
                </div>
                <p className="text-[11px] text-slate-500">Properly closed student sessions</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Real Student Registrations */}
              <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Registered Students</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                  >
                    View All ({allStudents.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {firestoreLoading ? (
                  <div className="py-12 text-center text-slate-500 text-xs">Loading live Firebase data...</div>
                ) : allStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                    No students have registered yet. When a student signs up on the website, they will appear here in real time.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {allStudents.slice(0, 5).map((st) => (
                      <div key={st.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono">
                            {(st.name || st.fullName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{st.name || st.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {st.enrollmentNumber} • {st.program}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                            }`}
                          >
                            {st.accountStatus || 'ACTIVE'}
                          </span>
                          <button
                            onClick={() => onNavigate('admin-student-profile', { studentId: st.id })}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-[11px] border border-slate-700"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Downloads & System Activity */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Latest Downloads</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    All ({firestoreDownloads.length})
                  </button>
                </div>

                {firestoreDownloads.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                    No downloads logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {firestoreDownloads.slice(0, 5).map((dl) => (
                      <div key={dl.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="overflow-hidden pr-2">
                          <p className="font-semibold text-white truncate">{dl.topicTitle || dl.courseCode}</p>
                          <p className="text-[11px] text-slate-400 truncate font-mono">
                            {dl.studentName} ({dl.enrollmentNumber})
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-400 rounded text-[10px] font-mono uppercase font-bold border border-blue-800/40">
                          {dl.fileType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ALL STUDENTS (REAL DATA REPOSITORY) */}
        {/* ============================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Top Management & Repository Action Bar */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-red-500" />
                  <h2 className="text-base font-bold text-white tracking-tight">Student Data Repository</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Store, manage, verify, and track student ID, enrollment number, email ID, and mobile number records.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="admin-add-student-btn"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Store New Student</span>
                </button>
                <button
                  id="admin-export-csv-btn"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download all student records in CSV format"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={fetchStudentsAndDownloads}
                  disabled={firestoreLoading}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                  title="Refresh student repository data"
                >
                  <RefreshCw className={`w-4 h-4 ${firestoreLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* InsForge PostgreSQL Cloud Storage Live Banner */}
            <div className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">InsForge PostgreSQL Live Storage</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Connected
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Project:</span>
                    <span className="text-indigo-300 font-mono">IGNOU PROJECT HUB</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Host: <span className="font-mono text-slate-400">{insforgeStatus.projectUrl}</span> &bull; Stored Records: <span className="font-bold text-emerald-400">{insforgeStatus.totalStudents}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">📱 मोबाइल नंबर (Mobile No.)</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">📧 ईमेल आईडी (Email ID)</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🎓 एनरोलमेंट नंबर (Enrollment No.)</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">👤 नाम (Student Name)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {insforgeSyncMsg && (
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      {insforgeSyncMsg}
                    </span>
                  )}
                  <button
                    onClick={handleSyncToInsForge}
                    disabled={insforgeSyncing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${insforgeSyncing ? 'animate-spin' : ''}`} />
                    <span>{insforgeSyncing ? 'Syncing to InsForge...' : 'Sync Students to InsForge'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search, Filter & Sorting Bar */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search ID, Enroll #, Email, Mobile..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="ACTIVE">ACTIVE only</option>
                    <option value="DISABLED">DISABLED only</option>
                    <option value="SUSPENDED">SUSPENDED only</option>
                  </select>
                </div>

                {/* Program Filter */}
                <div>
                  <select
                    value={programFilter}
                    onChange={(e) => {
                      setProgramFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">All Programs</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Com">M.Com</option>
                    <option value="B.Com">B.Com</option>
                    <option value="PGDCA">PGDCA</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="lastLogin">Sort: Recent Login First</option>
                    <option value="name">Sort: Student Name (A-Z)</option>
                    <option value="enrollment">Sort: Enrollment Number</option>
                  </select>
                </div>
              </div>

              {/* Filter feedback */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div>
                  Showing <span className="text-white font-bold">{sortedStudents.length}</span> of{' '}
                  <span className="text-white font-bold">{allStudents.length}</span> stored students
                </div>
                {(searchQuery || statusFilter !== 'ALL' || programFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setProgramFilter('ALL');
                    }}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">IGNOU Enrollment #</th>
                      <th className="px-4 py-3.5">Mobile / Phone</th>
                      <th className="px-4 py-3.5">Email Address</th>
                      <th className="px-4 py-3.5">Program</th>
                      <th className="px-4 py-3.5">Registered</th>
                      <th className="px-4 py-3.5">Account Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {firestoreLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          Fetching real-time student directory...
                        </td>
                      </tr>
                    ) : paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          No matching students found in repository.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((st) => {
                        return (
                          <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Student Name */}
                            <td className="px-4 py-3.5 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-[11px] font-mono flex-shrink-0">
                                  {(st.name || st.fullName || 'S').charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[140px]">{st.name || st.fullName}</span>
                              </div>
                            </td>

                            {/* Student ID */}
                            <td className="px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap text-[11px]">
                              <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded">
                                {st.studentId || st.id}
                              </span>
                            </td>

                            {/* IGNOU Enrollment # */}
                            <td className="px-4 py-3.5 font-mono font-bold text-red-400 whitespace-nowrap">
                              {st.enrollmentNumber || '—'}
                            </td>

                            {/* Mobile Number */}
                            <td className="px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap">
                              {st.mobileNumber || '—'}
                            </td>

                            {/* Email */}
                            <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap text-[11px]">
                              {st.email || '—'}
                            </td>

                            {/* Program */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-semibold text-[10px] font-mono border border-slate-700">
                                {st.program || '—'}
                              </span>
                            </td>

                            {/* Signup Date */}
                            <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                              {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : '—'}
                            </td>

                            {/* Account Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <button
                                onClick={() => setStatusModalStudent(st)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                  st.accountStatus === 'ACTIVE'
                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900'
                                    : st.accountStatus === 'SUSPENDED'
                                    ? 'bg-amber-950/80 text-amber-400 border-amber-800/60 hover:bg-amber-900'
                                    : 'bg-rose-950/80 text-rose-400 border-rose-800/60 hover:bg-rose-900'
                                }`}
                                title="Click to modify account status"
                              >
                                {st.accountStatus || 'ACTIVE'}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onNavigate('admin-student-profile', { studentId: st.id })}
                                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs shadow-xs inline-flex items-center gap-1 transition-colors"
                                  title="View full student academic dossier & activity"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Profile</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setEditStudentModal({
                                      id: st.id,
                                      name: st.name || st.fullName || '',
                                      enrollmentNumber: st.enrollmentNumber || '',
                                      email: st.email || '',
                                      mobileNumber: st.mobileNumber || '',
                                      program: st.program || 'BCA',
                                      courseYear: st.courseYear || '1st Year',
                                      studyCenterCode: st.studyCenterCode || 'SC-0700',
                                      accountStatus: st.accountStatus || 'ACTIVE'
                                    })
                                  }
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                                  title="Edit student information"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmStudent(st)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors"
                                  title="Delete student record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Page <span className="text-white font-bold">{currentPage}</span> of{' '}
                    <span className="text-white font-bold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LOGIN HISTORY */}
        {/* ============================================================== */}
        {activeTab === 'login-history' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">Student Login History & Active Sessions</h2>
                </div>
                <span className="text-xs text-slate-400">Queried directly from Firestore subcollections</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Enrollment #</th>
                      <th className="px-4 py-3.5">Program</th>
                      <th className="px-4 py-3.5">Last Login Time</th>
                      <th className="px-4 py-3.5">Last Logout Time</th>
                      <th className="px-4 py-3.5">Total Login Count</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-white">{st.name || st.fullName}</td>
                        <td className="px-4 py-3.5 font-mono text-red-400">{st.enrollmentNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-300">{st.program}</td>
                        <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                          {st.lastLoginAt ? new Date(st.lastLoginAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                          {st.lastLogoutAt ? new Date(st.lastLogoutAt).toLocaleString() : 'Active / Session open'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white font-mono">{st.totalLoginCount || 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                            {st.accountStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => onNavigate('admin-student-profile', { studentId: st.id })}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                          >
                            View Sessions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PROJECTS */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Project Topics & Curriculums</h2>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Explore Public Catalog
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t) => (
                  <div key={t.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 bg-slate-800 text-red-400 rounded font-mono font-bold">
                        {t.courseCode}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.program}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-2">{t.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: DIRECT ORDERS & UPI PAYMENTS (NO GATEWAY) */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Direct Academic Orders & UPI Transactions</h2>
                    <p className="text-xs text-slate-400">Zero-gateway direct order verification and instant download unlock</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 font-bold">
                    {orders.filter(o => o.status === 'PAID').length} Approved
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/50 text-amber-400 font-bold">
                    {orders.filter(o => o.status === 'PENDING').length} Pending Review
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Order ID</th>
                      <th className="px-4 py-3.5">Student / Enrollment</th>
                      <th className="px-4 py-3.5">Course</th>
                      <th className="px-4 py-3.5">Method</th>
                      <th className="px-4 py-3.5">UTR / Txn Ref</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Proof</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          No direct academic orders submitted yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3.5 font-mono text-slate-400">{o.orderId}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white">{o.studentName}</div>
                            <div className="font-mono text-[11px] text-red-400">{o.enrollmentNumber}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">{o.courseCode}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/50">
                              {o.paymentMethod || 'DIRECT_RESERVATION'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            {o.utrNumber ? (
                              <span className="font-bold text-blue-400">{o.utrNumber}</span>
                            ) : (
                              <span className="text-slate-500 italic">Direct Allocation</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">
                            ₹{o.amount ?? (o as any).amountPaid ?? 1499}
                          </td>
                          <td className="px-4 py-3.5">
                            {o.screenshotUrl ? (
                              <button
                                onClick={() => setPreviewScreenshot(o.screenshotUrl!)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px]">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                                  : o.status === 'REJECTED'
                                  ? 'bg-red-950 text-red-400 border-red-800/50'
                                  : 'bg-amber-950 text-amber-400 border-amber-800/50'
                              }`}
                            >
                              {o.status}
                            </span>
                            {o.rejectionReason && (
                              <div className="text-[10px] text-red-400 mt-1 max-w-xs truncate" title={o.rejectionReason}>
                                {o.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {o.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveOrder(o.orderId)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  title="Verify and unlock project"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(o.orderId)}
                                  className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-800/60 text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  title="Reject invalid payment"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-mono">Verified</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: DOWNLOADS */}
        {/* ============================================================== */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Real-Time Project Downloads Log</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">{firestoreDownloads.length} records in Firestore</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Enrollment #</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Program</th>
                      <th className="px-4 py-3.5">Course Code</th>
                      <th className="px-4 py-3.5">File Type</th>
                      <th className="px-4 py-3.5">Downloaded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {firestoreDownloads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No project download events recorded yet.
                        </td>
                      </tr>
                    ) : (
                      firestoreDownloads.map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3.5 font-bold text-white">{dl.studentName}</td>
                          <td className="px-4 py-3.5 font-mono text-red-400 font-bold">{dl.enrollmentNumber}</td>
                          <td className="px-4 py-3.5 text-slate-300">{dl.email}</td>
                          <td className="px-4 py-3.5 font-mono">{dl.program}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">{dl.courseCode}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-950 text-blue-400 uppercase border border-blue-800/40">
                              {dl.fileType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                            {dl.downloadedAt ? new Date(dl.downloadedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: ACTIVITY LOGS */}
        {/* ============================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">System Security & Activity Logs</h2>
                </div>
                <span className="text-xs text-slate-400">Real-time authentication and access events</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No critical security audit events logged yet.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.auditId} className="py-3 flex items-start justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{log.action}</p>
                        <p className="text-slate-400 text-[11px]">
                          Target: {log.targetType} {log.studentName && `(${log.studentName})`}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: SETTINGS */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-lg max-w-2xl">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                <h2 className="text-base font-bold text-white">Platform Configurations</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Firebase Project ID</label>
                  <input
                    type="text"
                    disabled
                    value="ignou-project-hub-236e1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Direct UPI ID (No Gateway)</label>
                  <input
                    type="text"
                    value={settings.directUpiId || 'ignouprojects@okaxis'}
                    onChange={(e) => setSettings({ ...settings, directUpiId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono"
                    placeholder="e.g. yourname@upi"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">UPI Beneficiary / Organization Name</label>
                  <input
                    type="text"
                    value={settings.directUpiName || 'IGNOU Academic Projects'}
                    onChange={(e) => setSettings({ ...settings, directUpiName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    placeholder="e.g. IGNOU Academic Services"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Academic Integrity Notice</label>
                  <textarea
                    rows={3}
                    value={settings.academicDisclaimer}
                    onChange={(e) => setSettings({ ...settings, academicDisclaimer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  onClick={() => showNotification('Configuration settings updated')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* ADD / STORE NEW STUDENT MODAL */}
      {/* ============================================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Store New Student Record</h3>
                  <p className="text-[11px] text-slate-400">Add student credentials and contact info to repository</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setAddStudentError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addStudentError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{addStudentError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Student Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={addStudentForm.name}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    IGNOU Enrollment # <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2601009842"
                    value={addStudentForm.enrollmentNumber}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, enrollmentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Student ID</label>
                    <button
                      type="button"
                      onClick={() =>
                        setAddStudentForm({
                          ...addStudentForm,
                          studentId: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                        })
                      }
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                    >
                      Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. STU-2026-1044"
                    value={addStudentForm.studentId}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Email ID */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@gmail.com"
                    value={addStudentForm.email}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Mobile / Phone Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone / Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={addStudentForm.mobileNumber}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Program */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Degree Program</label>
                  <select
                    value={addStudentForm.program}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, program: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="MBA">MBA (Master of Business Admin)</option>
                    <option value="MCA">MCA (Master of Computer Apps)</option>
                    <option value="BCA">BCA (Bachelor of Computer Apps)</option>
                    <option value="M.Com">M.Com (Master of Commerce)</option>
                    <option value="B.Com">B.Com (Bachelor of Commerce)</option>
                    <option value="PGDCA">PGDCA</option>
                    <option value="BA">BA / BAG</option>
                  </select>
                </div>

                {/* Study Center Code */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Study Center Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SC-0700"
                    value={addStudentForm.studyCenterCode}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, studyCenterCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Initial Password */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={addStudentForm.password}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Status</label>
                  <select
                    value={addStudentForm.accountStatus}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, accountStatus: e.target.value as AccountStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStudentLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addStudentLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Student Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT STUDENT MODAL */}
      {/* ============================================================== */}
      {editStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Edit Student Record</h3>
                  <p className="text-[11px] text-slate-400">Update student enrollment and contact data</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditStudentModal(null);
                  setEditStudentError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editStudentError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{editStudentError}</span>
              </div>
            )}

            <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={editStudentModal.name}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IGNOU Enrollment #</label>
                  <input
                    type="text"
                    required
                    value={editStudentModal.enrollmentNumber}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, enrollmentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student ID</label>
                  <input
                    type="text"
                    value={editStudentModal.studentId || editStudentModal.id}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    value={editStudentModal.email}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone / Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={editStudentModal.mobileNumber}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Degree Program</label>
                  <select
                    value={editStudentModal.program}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, program: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Com">M.Com</option>
                    <option value="B.Com">B.Com</option>
                    <option value="PGDCA">PGDCA</option>
                    <option value="BA">BA / BAG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Status</label>
                  <select
                    value={editStudentModal.accountStatus}
                    onChange={(e) => setEditStudentModal({ ...editStudentModal, accountStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditStudentModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStudentLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editStudentLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Student Record</h3>
                <p className="text-xs text-rose-400/90">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-bold text-white">{deleteConfirmStudent.name || deleteConfirmStudent.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enrollment #:</span>
                <span className="font-mono text-red-400 font-bold">{deleteConfirmStudent.enrollmentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{deleteConfirmStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-300 font-mono">{deleteConfirmStudent.mobileNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Deleting this record will revoke access for this student and clear associated active sessions.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STATUS CHANGE MODAL */}
      {/* ============================================================== */}
      {statusModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Update Account Status</h3>
              <button onClick={() => setStatusModalStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{statusModalStudent.name || statusModalStudent.fullName}</p>
              <p className="text-slate-400 font-mono">
                Enrollment: {statusModalStudent.enrollmentNumber} • Program: {statusModalStudent.program}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Select New Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ACTIVE', 'SUSPENDED', 'DISABLED'] as AccountStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(statusModalStudent.id, st)}
                    disabled={statusUpdating}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      statusModalStudent.accountStatus === st
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Payment Screenshot Proof</h3>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={previewScreenshot}
                alt="Payment proof screenshot"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
