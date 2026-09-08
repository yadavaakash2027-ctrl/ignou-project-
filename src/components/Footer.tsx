import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Lock
} from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Integrity Highlight strip */}
      <div className="bg-blue-950 border-b border-blue-900/60 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-slate-300">
              <strong className="text-white">Academic Integrity Notice:</strong> All generated projects and synopses are provided as personalized academic project drafts and reference research material to assist students in understanding methodology and structuring. Students should review, verify, understand, edit and personalize the material before official university evaluation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('academic-integrity')}
            className="text-blue-400 hover:text-blue-300 font-semibold whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            Full Integrity Policy <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">IGNOU PROJECT</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              The dedicated academic project preparation, atomic topic allocation, and 150+ page dissertation compiler platform for IGNOU students across BCA, MCA, B.Com, M.Com, MBA, PGDCA, and BA/BAG disciplines.
            </p>
            <div className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2.5">
              ⚠️ <strong>Independent Disclaimer:</strong> IGNOU Project is an independent educational platform and is not affiliated with, endorsed by, or representative of Indira Gandhi National Open University.
            </div>
          </div>

          {/* Col 2: Supported Programs */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Programs</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  M.Com (MCOP-001 / MCO-021)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  MBA (MMPP-001 / MS-100)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  BCA (BCSP-064)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  MCA (MCSP-060)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  B.Com (BCOE-141 / BCOE-143)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  PGDCA (MCSP-040)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                  BA / BAG (BECE-141)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Hub */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Student Hub</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('student-dashboard')} className="hover:text-blue-400 transition">
                  Student Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-projects')} className="hover:text-blue-400 transition">
                  My Downloads & Projects
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-blue-400 transition">
                  Topic Availability Search
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-blue-400 transition">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('academic-integrity')} className="hover:text-blue-400 transition">
                  150+ Page Validation Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-login')} className="hover:text-red-400 text-xs font-semibold mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-red-400" /> Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Help & Policies */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Support & Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-blue-400 transition">
                  About Platform
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-blue-400 transition">
                  Contact Academic Desk
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-blue-400 transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-blue-400 transition">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('academic-integrity')} className="hover:text-blue-400 transition">
                  Academic Ethics
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} IGNOU Project. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <FileCheck className="w-4 h-4 text-blue-400" /> Guaranteed 150+ Actual PDF Pages
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Atomic One-Time Topic Allocation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
