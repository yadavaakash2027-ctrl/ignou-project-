import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  QrCode,
  Copy,
  Check,
  UploadCloud,
  Clock,
  Smartphone,
  Zap
} from 'lucide-react';
import { Topic } from '../types';
import { useAuth } from '../context/AuthContext';
import { GenerationProgressModal } from '../components/GenerationProgressModal';
import { safeFetch } from '../lib/api';

interface CheckoutPageProps {
  topicId?: string;
  courseCode?: string;
  program?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ topicId, courseCode, program, onNavigate }) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Reservation Mode: 'direct_instant' (Instant allocation & generation, no gateway) or 'upi_manual' (Direct UPI QR + UTR)
  const [checkoutMode, setCheckoutMode] = useState<'direct_instant' | 'upi_manual'>('direct_instant');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [orderSubmittedSuccess, setOrderSubmittedSuccess] = useState<{
    orderId: string;
    projectId: string;
    utrNumber?: string;
  } | null>(null);

  const directUpiId = 'ignouprojects@okaxis';
  const directUpiName = 'IGNOU Academic Projects';

  useEffect(() => {
    if (!topicId && !courseCode) {
      setLoading(false);
      return;
    }

    safeFetch<{ topics: Topic[] }>('/topics')
      .then((res) => {
        let found: Topic | undefined;
        if (topicId) {
          found = (res.data?.topics || []).find((t: Topic) => t.id === topicId);
        } else if (courseCode) {
          found = (res.data?.topics || []).find((t: Topic) => t.courseCode === courseCode && t.status === 'AVAILABLE');
        }
        setTopic(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [topicId, courseCode]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(directUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotFile(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Direct Instant Reservation (Gateway-Free)
  const handleDirectInstantGenerate = async () => {
    if (!user) {
      onNavigate('login', { returnTo: 'checkout', topicId, courseCode, program });
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await safeFetch<{ orderId: string; projectId: string; message: string }>('/payment/direct-reserve', {
        method: 'POST',
        body: JSON.stringify({
          topicId: topic?.id,
          courseCode: topic?.courseCode || courseCode || 'MCOP-001'
        })
      });

      if (!res.ok || !res.data?.projectId) {
        throw new Error(res.error || 'Failed to complete direct topic reservation');
      }

      // Open generation modal immediately
      setActiveProjectId(res.data.projectId);
    } catch (err: any) {
      setError(err.message || 'Direct reservation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Direct UPI Order Submission (Scan QR & Submit UTR)
  const handleDirectUpiSubmit = async () => {
    if (!user) {
      onNavigate('login', { returnTo: 'checkout', topicId, courseCode, program });
      return;
    }

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setError('Please enter a valid 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await safeFetch<{ orderId: string; projectId: string; message: string }>('/payment/submit-upi', {
        method: 'POST',
        body: JSON.stringify({
          topicId: topic?.id,
          courseCode: topic?.courseCode || courseCode || 'MCOP-001',
          amount: 1499,
          utrNumber: utrNumber.trim(),
          screenshotUrl: screenshotFile || ''
        })
      });

      if (!res.ok || !res.data?.orderId) {
        throw new Error(res.error || 'Failed to submit UPI payment details');
      }

      setOrderSubmittedSuccess({
        orderId: res.data.orderId,
        projectId: res.data.projectId,
        utrNumber: utrNumber.trim()
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit UPI order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Please Sign In to Reserve Topic
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Topics are assigned exclusively to a student's official IGNOU enrollment number to ensure personalized delivery.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onNavigate('login', { returnTo: 'checkout', topicId, courseCode, program })}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition"
          >
            Student Login
          </button>
          <button
            onClick={() => onNavigate('register', { returnTo: 'checkout', topicId, courseCode, program })}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition"
          >
            Register Enrollment
          </button>
        </div>
      </div>
    );
  }

  // If order was submitted successfully via Direct UPI
  if (orderSubmittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500/20 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Direct Order Submitted Successfully!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your direct payment details have been recorded. No payment gateway was required. The administrator will verify your UTR reference number and unlock your downloads.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-xs font-mono text-left space-y-2 max-w-md mx-auto border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Order Reference:</span>
              <span className="text-slate-900 dark:text-white font-bold">{orderSubmittedSuccess.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Submitted UTR:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{orderSubmittedSuccess.utrNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Verification Pending
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => onNavigate('my-projects')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <span>Go to My Projects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOrderSubmittedSuccess(null)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
            >
              Order Another Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Project Order & Academic Reservation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gateway-free direct allocation for your official IGNOU project dissertation
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Direct Allocation (No Gateway)
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Topic & Student Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Allocated Project Topic
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Allocated to Your Account
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {topic ? topic.title : `Auto-Allocated ${courseCode || user.program} Research Topic`}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {topic ? topic.description : 'A dedicated, non-duplicated academic research dissertation topic aligned with official IGNOU project guidelines.'}
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/40">
                Course: {topic ? topic.courseCode : courseCode || 'MCOP-001'}
              </span>
              <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/40">
                Program: {topic ? topic.program : user.program}
              </span>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Candidate Academic Profile
            </span>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Student Name</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Enrollment Number</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{user.enrollmentNumber}</p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{user.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Mobile Number</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{user.mobileNumber}</p>
              </div>
            </div>
          </div>

          {/* Specifications Checklist */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-3xl border border-blue-100 dark:border-blue-900/50 p-6 space-y-3">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Package Specifications Included:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Programmatic 150+ Rendered Pages
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Certificate from Approved Guide
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Student Declaration of Originality
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Primary Questionnaire & APA 7th Refs
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> High-Resolution Vector PDF
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fully Editable Word DOCX File
              </div>
            </div>
          </div>
        </div>

        {/* Right: Checkout Mode Selection & Direct Action */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Direct Reservation
              </h3>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                No Gateway
              </span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCheckoutMode('direct_instant')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  checkoutMode === 'direct_instant'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Access</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckoutMode('upi_manual')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  checkoutMode === 'upi_manual'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Direct UPI QR</span>
              </button>
            </div>

            {/* MODE 1: DIRECT INSTANT GENERATION */}
            {checkoutMode === 'direct_instant' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs space-y-2">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Instant Academic Generation
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Reserve your assigned topic with zero waiting and no payment gateway. The compiler initiates real-time synthesis of all 150+ pages immediately.
                  </p>
                </div>

                <div className="space-y-2 text-xs border-y border-slate-100 dark:border-slate-700 py-3">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Topic Reservation</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Payment Gateway Fee</span>
                    <span className="line-through text-slate-400">₹0 (Removed)</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1">
                    <span>Access Mode</span>
                    <span className="text-blue-600 dark:text-blue-400">Direct Academic</span>
                  </div>
                </div>

                <button
                  id="direct-instant-reserve-btn"
                  onClick={handleDirectInstantGenerate}
                  disabled={processing}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{processing ? 'Reserving Topic & Compiling...' : 'Confirm & Generate 150+ Pages'}</span>
                </button>
              </div>
            )}

            {/* MODE 2: DIRECT UPI QR TRANSFER (NO GATEWAY) */}
            {checkoutMode === 'upi_manual' && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  {/* Clean SVG QR Code Representation */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=${directUpiId}&pn=${encodeURIComponent(directUpiName)}&am=1499&cu=INR&tn=IGNOU_Project_${topic?.courseCode || 'MCOP001'}`
                      )}`}
                      alt="Direct UPI QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Official Direct UPI ID:</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {directUpiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-bold flex items-center gap-1"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM. Zero gateway charges.
                  </p>
                </div>

                {/* UTR Input Form */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      12-Digit UPI Ref / UTR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 429182749102"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Screenshot Upload (Optional) */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Payment Screenshot (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 font-semibold transition"
                      >
                        <UploadCloud className="w-4 h-4 text-blue-500" />
                        <span>{screenshotFile ? 'Screenshot Attached ✓' : 'Upload Receipt Proof (JPG/PNG)'}</span>
                      </label>
                    </div>
                  </div>

                  <button
                    id="submit-upi-order-btn"
                    onClick={handleDirectUpiSubmit}
                    disabled={processing || !utrNumber.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{processing ? 'Submitting Order...' : 'Submit Order with UTR'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-center text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Direct Academic Transaction
              </div>
              <p>Direct allocation with no third-party payment gateway or merchant fee deductions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Modal */}
      {activeProjectId && (
        <GenerationProgressModal
          projectId={activeProjectId}
          onClose={() => {
            setActiveProjectId(null);
            onNavigate('my-projects');
          }}
          onRefreshProject={() => {}}
        />
      )}
    </div>
  );
};
