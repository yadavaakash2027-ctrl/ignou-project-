import React, { useState } from 'react';
import {
  GraduationCap,
  Download,
  Lock,
  Mail,
  User,
  Phone,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentAuthDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  courseCode?: string;
  topicTitle?: string;
  fileType?: 'pdf' | 'docx';
  onSuccess: () => void;
}

export const StudentAuthDownloadModal: React.FC<StudentAuthDownloadModalProps> = ({
  isOpen,
  onClose,
  projectId,
  courseCode,
  topicTitle,
  fileType = 'pdf',
  onSuccess
}) => {
  const { register, login, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [program, setProgram] = useState('MBA');
  const [password, setPassword] = useState('');

  // Login identifier
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const programsList = [
    { code: 'MBA', name: 'Master of Business Administration' },
    { code: 'M.COM', name: 'Master of Commerce' },
    { code: 'BCA', name: 'Bachelor of Computer Applications' },
    { code: 'MCA', name: 'Master of Computer Applications' },
    { code: 'B.COM', name: 'Bachelor of Commerce' },
    { code: 'PGDCA', name: 'Post Graduate Diploma in Computer Applications' },
    { code: 'BA/BAG', name: 'Bachelor of Arts' }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !enrollmentNumber.trim() || !mobileNumber.trim() || !password.trim()) {
      setError('Please fill in all required fields (Name, Email, Enrollment Number, Mobile, Password).');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await register({
      name: name.trim(),
      email: email.trim(),
      enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
      mobileNumber: mobileNumber.trim(),
      program,
      passwordPlain: password
    });

    if (res.success) {
      setLoading(false);
      onSuccess();
    } else {
      setLoading(false);
      setError(res.error || 'Student registration failed. Please check your details.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('Please enter your email or enrollment number and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(loginIdentifier.trim(), loginPassword.trim());

    if (res.success) {
      setLoading(false);
      onSuccess();
    } else {
      setLoading(false);
      setError(res.error || 'Invalid credentials. Please verify and retry.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle({
        enrollmentNumber: enrollmentNumber.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        program
      });
      if (res.success) {
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        setError(res.error || 'Google Authentication was cancelled or failed.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Google Authentication error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 bg-blue-950/60 px-2 py-0.5 rounded">
                Student Verification
              </span>
              <h3 className="text-lg font-extrabold text-white">Student Registration</h3>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Please register your IGNOU student details to securely download and allocate your custom 150+ page dissertation.
          </p>

          {courseCode && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold text-amber-200">
              <FileText className="w-3.5 h-3.5" />
              <span>Project Course: {courseCode} ({fileType.toUpperCase()})</span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            New Student (Sign Up)
          </button>
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'login'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Already Registered (Sign In)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (as per IGNOU ID Card) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aakash Yadav"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Enrollment Number & Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IGNOU Enrollment No. *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2300456789"
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-hidden focus:border-blue-500"
                    />
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Program *
                  </label>
                  <div className="relative">
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    >
                      {programsList.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} ({p.name})
                        </option>
                      ))}
                    </select>
                    <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile / WhatsApp No. *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Saving & Preparing Download...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save Details & Download {fileType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Enrollment Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="2300456789 or email@example.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Sign In & Download {fileType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white dark:bg-slate-900 px-2">Or Continue With</span>
            </div>
          </div>

          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
            🔒 All student credentials and downloads are encrypted and securely authenticated.
          </p>
        </div>
      </div>
    </div>
  );
};
