import React, { useState } from 'react';
import {
  FileText,
  Download,
  ChevronRight,
  Edit3,
  Save,
  RefreshCw,
  CheckCircle2,
  ListOrdered,
  Layers,
  BookOpen,
  Calendar,
  Wrench,
  Target,
  Sparkles,
  Award,
  User,
  School,
  FileCheck
} from 'lucide-react';
import { SynopsisData, Synopsis11Sections } from '../types';
import { buildApiUrl } from '../lib/api';

interface Synopsis11SectionViewerProps {
  synopsis: SynopsisData;
  onUpdateSynopsis: (updated: SynopsisData) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSaveEdits: () => void;
  saving: boolean;
  onRegenerateSection?: (sectionKey: string) => void;
}

export const Synopsis11SectionViewer: React.FC<Synopsis11SectionViewerProps> = ({
  synopsis,
  onUpdateSynopsis,
  isEditing,
  onToggleEdit,
  onSaveEdits,
  saving,
  onRegenerateSection
}) => {
  const [activeSection, setActiveSection] = useState<string>('cover');

  const s11: Synopsis11Sections = synopsis.sections11 || {
    section1_projectTitle: synopsis.projectTitle,
    section2_introduction: synopsis.introduction?.fullText || synopsis.introduction?.meaningOfTopic || '',
    section3_problemStatement: synopsis.statementOfTheProblem || '',
    section4_objectives: synopsis.objectivesOfTheStudy || [],
    section5_scope: {
      coverage: synopsis.scopeOfTheStudy?.operationalContext || '',
      features: synopsis.scopeOfTheStudy?.mainFeatures || [],
      targetUsers: synopsis.scopeOfTheStudy?.targetUsers || '',
      accomplishments: synopsis.scopeOfTheStudy?.accomplishments || '',
      limitations: synopsis.limitationsOfTheStudy?.[0] || '',
      fullText: synopsis.scopeOfTheStudy?.fullText || ''
    },
    section6_literatureReview: synopsis.reviewOfLiterature?.overview || '',
    section7_methodology: {
      type: synopsis.researchMethodology?.researchDesign || 'Applied System Development',
      steps: (synopsis.researchMethodology?.lifecyclePhases || []).map((p) => ({
        title: p.phaseName,
        description: p.activities
      })),
      fullText: synopsis.researchMethodology?.fullText || ''
    },
    section8_toolsAndTechnologies: (synopsis.toolsAndTechniques?.categories || []).map((c) => ({
      category: c.category,
      items: c.tools,
      justification: c.justification
    })),
    section9_expectedOutcome: synopsis.expectedOutcomes?.[0]?.description || synopsis.expectedOutcomes?.[0]?.title || '',
    section10_workPlan: (synopsis.timeSchedule || []).map((t) => ({
      phase: t.stage,
      duration: t.timePeriod,
      activities: t.description,
      deliverables: 'Documented Report & Artefacts'
    })),
    section11_references: (synopsis.references || []).map((r) => r.citation)
  };

  const updateS11 = (partial: Partial<Synopsis11Sections>) => {
    const next: Synopsis11Sections = { ...s11, ...partial };
    onUpdateSynopsis({
      ...synopsis,
      sections11: next
    });
  };

  const SECTIONS_LIST = [
    { id: 'cover', label: '📄 Cover Page' },
    { id: 'particulars', label: '📋 Student & Project Details' },
    { id: 'sec1_title', label: '1. Project Title' },
    { id: 'sec2_intro', label: '2. Introduction' },
    { id: 'sec3_problem', label: '3. Problem Statement' },
    { id: 'sec4_objectives', label: '4. Objectives' },
    { id: 'sec5_scope', label: '5. Scope of the Project' },
    { id: 'sec6_literature', label: '6. Literature Review' },
    { id: 'sec7_methodology', label: '7. Methodology' },
    { id: 'sec8_tools', label: '8. Tools & Technologies' },
    { id: 'sec9_outcome', label: '9. Expected Outcome' },
    { id: 'sec10_timeline', label: '10. Work Plan / Timeline' },
    { id: 'sec11_references', label: '11. References / Bibliography' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-bold">
              Official 11-Section IGNOU Standard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Course: {synopsis.courseCode} ({synopsis.program})
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            "{synopsis.projectTitle}"
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleEdit}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              isEditing
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Editing Mode Active' : 'Edit Synopsis'}
          </button>

          {isEditing && (
            <button
              onClick={onSaveEdits}
              disabled={saving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          <a
            href={buildApiUrl(synopsis.pdfUrl || `/api/synopsis/${synopsis.id}/download/pdf`)}
            download
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>

          <a
            href={buildApiUrl(synopsis.docxUrl || `/api/synopsis/${synopsis.id}/download/docx`)}
            download
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            Download Word (DOCX)
          </a>
        </div>
      </div>

      {/* Main Layout: 11 Sections Left Sidebar + Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: 11 Sections Navigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1 self-start">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            11 Main Sections
          </div>

          {SECTIONS_LIST.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{s.label}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 ${activeSection === s.id ? 'opacity-100' : 'opacity-30'}`}
              />
            </button>
          ))}
        </div>

        {/* Right 3 Columns: Active Section Content Viewer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[500px]">
            {/* Header of Active Section */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {activeSection === 'cover' && 'Project Proposal Cover Page'}
                {activeSection === 'particulars' && 'Student & Project Details (Proforma)'}
                {activeSection === 'sec1_title' && '1. PROJECT TITLE'}
                {activeSection === 'sec2_intro' && '2. INTRODUCTION'}
                {activeSection === 'sec3_problem' && '3. PROBLEM STATEMENT'}
                {activeSection === 'sec4_objectives' && '4. OBJECTIVES'}
                {activeSection === 'sec5_scope' && '5. SCOPE OF THE PROJECT'}
                {activeSection === 'sec6_literature' && '6. LITERATURE REVIEW'}
                {activeSection === 'sec7_methodology' && '7. METHODOLOGY'}
                {activeSection === 'sec8_tools' && '8. TOOLS & TECHNOLOGIES'}
                {activeSection === 'sec9_outcome' && '9. EXPECTED OUTCOME'}
                {activeSection === 'sec10_timeline' && '10. WORK PLAN / TIMELINE'}
                {activeSection === 'sec11_references' && '11. REFERENCES / BIBLIOGRAPHY'}
              </h3>

              {onRegenerateSection && activeSection !== 'cover' && activeSection !== 'particulars' && (
                <button
                  onClick={() => onRegenerateSection(activeSection)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              )}
            </div>

            {/* SECTION: COVER PAGE */}
            {activeSection === 'cover' && (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 p-4 sm:p-6 shadow-xl rounded-none max-w-2xl mx-auto font-serif text-slate-900 dark:text-slate-100">
                <div className="border border-slate-700 dark:border-slate-300 p-6 sm:p-8 space-y-6 text-center">
                  <h4 className="text-base sm:text-lg font-bold uppercase">
                    INDIRA GANDHI NATIONAL OPEN UNIVERSITY
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    School of Computer and Information Sciences (SOCIS) / School of Management Studies (SOMS)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Maidan Garhi, New Delhi – 110068
                  </p>

                  <div className="pt-4 border-t border-b border-slate-300 dark:border-slate-700 py-3">
                    <span className="text-xs tracking-widest uppercase font-bold text-slate-500">
                      PROJECT PROPOSAL SYNOPSIS
                    </span>
                    <h2 className="text-base sm:text-lg font-bold mt-2 text-blue-900 dark:text-blue-200">
                      {s11.section1_projectTitle || synopsis.projectTitle}
                    </h2>
                  </div>

                  <p className="text-xs italic text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Proposal submitted in partial fulfillment of the requirements for the award of the degree of{' '}
                    <span className="font-semibold">{synopsis.program}</span> in Course{' '}
                    <span className="font-semibold">{synopsis.courseCode}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-left text-xs pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">Submitted By:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{synopsis.studentName}</p>
                      <p>Enrol: {synopsis.enrollmentNumber}</p>
                      <p>Study Centre: {synopsis.studyCenterCode}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">Supervisor / Guide:</span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {synopsis.guideName || synopsis.guideBioData?.guideName || 'Academic Project Supervisor'}
                      </p>
                      <p>Academic Year: {synopsis.sessionYear}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: PARTICULARS & DECLARATION */}
            {activeSection === 'particulars' && (
              <div className="space-y-6">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Candidate & Project Identification Table
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50 w-1/3">Student Name</td>
                        <td className="p-3">{synopsis.studentName}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50">Enrollment Number</td>
                        <td className="p-3 font-mono">{synopsis.enrollmentNumber}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50">Programme & Course</td>
                        <td className="p-3">{synopsis.program} ({synopsis.courseCode})</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50">Project Category / Type</td>
                        <td className="p-3">{synopsis.projectType || 'Software Development & Systems'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50">Student Contact</td>
                        <td className="p-3">
                          {synopsis.email || 'Registered Email'} | {synopsis.mobileNumber || 'Registered Mobile'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold bg-slate-50/50 dark:bg-slate-800/50">Study Centre & Regional Centre</td>
                        <td className="p-3">
                          {synopsis.studyCenterCode} ({synopsis.studyCenterName}) | {synopsis.regionalCenterCode} ({synopsis.regionalCenterName})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Academic Declaration of Originality
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic">
                    "I hereby certify that this project proposal synopsis entitled '{s11.section1_projectTitle}' is my original work. It has not been submitted previously in part or in full for the award of any other degree, diploma, or qualification at Indira Gandhi National Open University or any other institution."
                  </p>
                  <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Place: New Delhi</p>
                      <p className="text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">{synopsis.studentName}</p>
                      <p className="text-slate-500">(Signature of the Student)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: PROJECT TITLE */}
            {activeSection === 'sec1_title' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 1 presents the approved project title prominently for official IGNOU committee evaluation.
                </p>
                {isEditing ? (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Project Title</label>
                    <input
                      type="text"
                      value={s11.section1_projectTitle}
                      onChange={(e) => updateS11({ section1_projectTitle: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl text-center">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
                      1. APPROVED PROJECT TITLE
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {s11.section1_projectTitle}
                    </h2>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: INTRODUCTION */}
            {activeSection === 'sec2_intro' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 2 provides the academic background, context, and necessity of the project topic.
                </p>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={s11.section2_introduction}
                    onChange={(e) => updateS11({ section2_introduction: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                    {s11.section2_introduction.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: PROBLEM STATEMENT */}
            {activeSection === 'sec3_problem' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 3 explains the critical issues, inefficiencies, and risks of existing manual/archaic practices.
                </p>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={s11.section3_problemStatement}
                    onChange={(e) => updateS11({ section3_problemStatement: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                    {s11.section3_problemStatement.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: OBJECTIVES */}
            {activeSection === 'sec4_objectives' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 4 articulates clear, actionable, numbered objectives formulated specifically for IGNOU guidelines.
                </p>
                {isEditing ? (
                  <textarea
                    rows={10}
                    value={s11.section4_objectives.join('\n')}
                    onChange={(e) =>
                      updateS11({
                        section4_objectives: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                      })
                    }
                    placeholder="Enter one objective per line"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="space-y-3">
                    {s11.section4_objectives.map((obj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 pt-0.5 leading-relaxed">
                          {obj.replace(/^\d+[\.\)]\s*/, '')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: SCOPE OF THE PROJECT */}
            {activeSection === 'sec5_scope' && (
              <div className="space-y-6">
                <p className="text-xs text-slate-500">
                  Section 5 defines the operational context, main functional features, target users, deliverables, and boundaries.
                </p>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">5.1 Coverage & Operational Context</label>
                      <textarea
                        rows={3}
                        value={s11.section5_scope.coverage}
                        onChange={(e) =>
                          updateS11({
                            section5_scope: { ...s11.section5_scope, coverage: e.target.value }
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">5.2 Key Features / Modules (One per line)</label>
                      <textarea
                        rows={4}
                        value={s11.section5_scope.features.join('\n')}
                        onChange={(e) =>
                          updateS11({
                            section5_scope: {
                              ...s11.section5_scope,
                              features: e.target.value.split('\n').filter((f) => f.trim().length > 0)
                            }
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">5.3 Target Users & Stakeholders</label>
                      <input
                        type="text"
                        value={s11.section5_scope.targetUsers}
                        onChange={(e) =>
                          updateS11({
                            section5_scope: { ...s11.section5_scope, targetUsers: e.target.value }
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">5.4 Expected System Accomplishments</label>
                      <textarea
                        rows={3}
                        value={s11.section5_scope.accomplishments}
                        onChange={(e) =>
                          updateS11({
                            section5_scope: { ...s11.section5_scope, accomplishments: e.target.value }
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">5.5 Operational Limitations</label>
                      <textarea
                        rows={2}
                        value={s11.section5_scope.limitations}
                        onChange={(e) =>
                          updateS11({
                            section5_scope: { ...s11.section5_scope, limitations: e.target.value }
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                        5.1 Coverage & Context
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {s11.section5_scope.coverage}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                        5.2 Main Functional Features & Sub-systems
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {s11.section5_scope.features.map((feat, i) => (
                          <li key={i}>{feat}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                          5.3 Target Users
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {s11.section5_scope.targetUsers}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                          5.4 Accomplishments
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {s11.section5_scope.accomplishments}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                        5.5 Limitations & Operational Boundaries
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {s11.section5_scope.limitations}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 6: LITERATURE REVIEW */}
            {activeSection === 'sec6_literature' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 6 reviews existing peer-reviewed studies and authoritative frameworks, identifying clear research gaps.
                </p>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={s11.section6_literatureReview}
                    onChange={(e) => updateS11({ section6_literatureReview: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                    {s11.section6_literatureReview.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 7: METHODOLOGY */}
            {activeSection === 'sec7_methodology' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 7 details the step-by-step engineering/research methodology through structured phases.
                </p>
                {isEditing ? (
                  <textarea
                    rows={12}
                    value={s11.section7_methodology.fullText}
                    onChange={(e) =>
                      updateS11({
                        section7_methodology: { ...s11.section7_methodology, fullText: e.target.value }
                      })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 font-semibold">
                      Methodological Framework: {s11.section7_methodology.type}
                    </div>

                    <div className="space-y-3">
                      {s11.section7_methodology.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {step.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 pl-7">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 8: TOOLS & TECHNOLOGIES */}
            {activeSection === 'sec8_tools' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 8 details the concrete programming languages, databases, servers, and justification for selection.
                </p>
                <div className="space-y-3">
                  {s11.section8_toolsAndTechnologies.map((toolGroup, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {toolGroup.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                          {toolGroup.items.join(', ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Justification: </span>
                        {toolGroup.justification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 9: EXPECTED OUTCOME */}
            {activeSection === 'sec9_outcome' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 9 outlines the direct tangible outputs, measurable efficiencies, and institutional value.
                </p>
                {isEditing ? (
                  <textarea
                    rows={10}
                    value={s11.section9_expectedOutcome}
                    onChange={(e) => updateS11({ section9_expectedOutcome: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
                    {s11.section9_expectedOutcome.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 10: WORK PLAN / TIMELINE */}
            {activeSection === 'sec10_timeline' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 10 lays out the sequential timeline across all developmental phases.
                </p>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5 text-left">Phase / Stage</th>
                        <th className="p-2.5 text-left">Duration</th>
                        <th className="p-2.5 text-left">Activities & Milestones</th>
                        <th className="p-2.5 text-left">Deliverables</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {s11.section10_workPlan.map((plan, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">{plan.phase}</td>
                          <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-400">{plan.duration}</td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">{plan.activities}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{plan.deliverables}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 11: REFERENCES */}
            {activeSection === 'sec11_references' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Section 11 provides academic citations, textbooks, and documentation conforming to APA / IEEE standards.
                </p>
                {isEditing ? (
                  <textarea
                    rows={10}
                    value={s11.section11_references.join('\n')}
                    onChange={(e) =>
                      updateS11({
                        section11_references: e.target.value.split('\n').filter((r) => r.trim().length > 0)
                      })
                    }
                    placeholder="Enter one citation per line"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="space-y-2">
                    {s11.section11_references.map((ref, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3"
                      >
                        <span className="text-xs font-bold text-slate-400 font-mono shrink-0">
                          [{i + 1}]
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {ref}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
