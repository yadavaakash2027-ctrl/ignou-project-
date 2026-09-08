import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber
} from 'docx';
import fs from 'fs';
import path from 'path';
import { SynopsisData } from '../src/types';
import { STORAGE_DIR } from './db';

export class SynopsisDocxGenerator {
  /**
   * Generates a formal academic Microsoft Word (.docx) IGNOU Project Proposal (Synopsis)
   * (18–25+ pages) with standardized Cover Page and all 26 academic sections.
   */
  static async generateSynopsisDocx(synopsis: SynopsisData): Promise<{ filePath: string; relativeUrl: string }> {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    const safeEnrollment = synopsis.enrollmentNumber ? synopsis.enrollmentNumber.replace(/[^a-zA-Z0-9_-]/g, '') : 'STUDENT';
    const filename = `IGNOU_Synopsis_${synopsis.courseCode || 'PROPOSAL'}_${safeEnrollment}_${synopsis.id.slice(0, 8)}.docx`;
    const filePath = path.join(STORAGE_DIR, filename);

    const docChildren: any[] = [];

    const progVal = synopsis.program || 'MBA';
    const courseCodeVal = synopsis.courseCode || 'MMPP-001';
    const studentNameVal = synopsis.studentName || 'IGNOU Student';
    const enrollmentVal = synopsis.enrollmentNumber || 'IGNOU-2025-XXXX';
    const cleanTitle = (synopsis.projectTitle || 'PROJECT PROPOSAL').trim().replace(/^"+|"+$/g, '');
    const orgName = synopsis.organizationName || 'Target Organization / Enterprise';

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROPOSAL FOR PROJECT WORK',
            bold: true,
            size: 32,
            font: 'Times New Roman',
            color: '0F172A'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `COURSE CODE: ${courseCodeVal.toUpperCase()}`,
            bold: true,
            size: 24,
            font: 'Times New Roman',
            color: '1E293B'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Proposal submitted in partial fulfillment of the requirements for the award of the degree of',
            italics: true,
            size: 21,
            font: 'Times New Roman',
            color: '334155'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: progVal === 'MBA'
              ? 'MASTER OF BUSINESS ADMINISTRATION (MBA)'
              : progVal === 'MCA'
              ? 'MASTER OF COMPUTER APPLICATIONS (MCA)'
              : progVal === 'BCA'
              ? 'BACHELOR OF COMPUTER APPLICATIONS (BCA)'
              : progVal === 'M.Com'
              ? 'MASTER OF COMMERCE (M.COM)'
              : `${progVal.toUpperCase()}`,
            bold: true,
            size: 26,
            font: 'Times New Roman',
            color: '0F172A'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROJECT PROPOSAL TITLE:',
            bold: true,
            size: 22,
            font: 'Times New Roman',
            color: '1E293B'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `"${cleanTitle.toUpperCase()}"`,
                        bold: true,
                        size: 24,
                        font: 'Times New Roman',
                        color: '0F172A'
                      })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 180, after: 180 }
                  })
                ],
                shading: { fill: 'F8FAFC' }
              })
            ]
          })
        ]
      }),
      new Paragraph({ spacing: { after: 280 } }),

      // 2-Column Info Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'SUBMITTED BY:', bold: true, size: 22, font: 'Times New Roman', color: '0F172A' })
                    ],
                    spacing: { after: 80 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Student Name: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: studentNameVal, size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Enrollment No: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: enrollmentVal, size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Programme: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: progVal, size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Study Centre: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: `${synopsis.studyCenterName || 'Study Centre'} (${synopsis.studyCenterCode || 'SC-0700'})`, size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  })
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'UNDER GUIDANCE OF:', bold: true, size: 22, font: 'Times New Roman', color: '0F172A' })
                    ],
                    spacing: { after: 80 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Supervisor: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: synopsis.guideBioData?.guideName || 'Approved Project Supervisor', size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Designation: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: synopsis.guideBioData?.designation || 'Academic Counsellor / Guide', size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Institution: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: synopsis.guideBioData?.organization || 'Indira Gandhi National Open University', size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Regional Centre: ', bold: true, size: 20, font: 'Times New Roman' }),
                      new TextRun({ text: `${synopsis.regionalCenterName || 'Regional Centre'} (${synopsis.regionalCenterCode || 'RC-07'})`, size: 20, font: 'Times New Roman' })
                    ],
                    spacing: { after: 60 }
                  })
                ]
              })
            ]
          })
        ]
      }),
      new Paragraph({ spacing: { after: 280 } }),

      // University Bottom Block
      new Paragraph({
        children: [
          new TextRun({
            text: 'INDIRA GANDHI NATIONAL OPEN UNIVERSITY',
            bold: true,
            size: 26,
            font: 'Times New Roman',
            color: '0F172A'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'School of Management Studies / SOCIS, Maidan Garhi, New Delhi – 110068',
            size: 20,
            font: 'Times New Roman',
            color: '334155'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Academic Session: ${synopsis.sessionYear || '2025–2026'}`,
            bold: true,
            size: 20,
            font: 'Times New Roman',
            color: '0F172A'
          })
        ],
        alignment: AlignmentType.CENTER,
        pageBreakBefore: false
      })
    );

    // ==========================================
    // PAGE 2: STUDENT DECLARATION & GUIDE CERTIFICATE
    // ==========================================
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'DECLARATION BY THE STUDENT',
            bold: true,
            size: 26,
            font: 'Times New Roman',
            underline: {}
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        pageBreakBefore: true
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: synopsis.declaration?.statement ||
              `I hereby declare that this project proposal entitled "${cleanTitle}" submitted by me to Indira Gandhi National Open University (IGNOU), New Delhi, in partial fulfillment of the requirements for the award of the Degree of ${progVal}, is an original record of academic work carried out under the guidance of my approved supervisor.\n\nI confirm that this proposal has not formed the basis for the award of any degree, diploma, associateship, fellowship, or other similar titles in this or any other university or institution of higher learning. All secondary sources, empirical references, and institutional data cited herein have been acknowledged in accordance with formal academic integrity standards.`,
            size: 22,
            font: 'Times New Roman'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date: ____________________\nPlace: ___________________', bold: true, size: 20, font: 'Times New Roman' }),
          new TextRun({ text: '\t\t\t\t\t____________________________________\n\t\t\t\t\t(Signature of the Student)\n', size: 20, font: 'Times New Roman' }),
          new TextRun({ text: `\t\t\t\t\tName: ${studentNameVal}\n\t\t\t\t\tEnrollment No: ${enrollmentVal}`, size: 20, font: 'Times New Roman' })
        ],
        spacing: { after: 280 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'CERTIFICATE OF THE APPROVED SUPERVISOR',
            bold: true,
            size: 24,
            font: 'Times New Roman',
            underline: {}
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `This is to certify that the project proposal entitled "${cleanTitle}" submitted by ${studentNameVal} (Enrollment No: ${enrollmentVal}) has been formulated under my academic supervision and guidance.\n\nI have scrutinized the proposal, research design, methodology, and survey instruments, and find them in full compliance with the academic standards and guidelines prescribed by Indira Gandhi National Open University (IGNOU). I recommend this proposal for formal evaluation and registration.`,
            size: 22,
            font: 'Times New Roman'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date: ____________________\nPlace: ___________________', bold: true, size: 20, font: 'Times New Roman' }),
          new TextRun({ text: '\t\t\t\t\t____________________________________\n\t\t\t\t\t(Signature of the Supervisor / Guide)\n', size: 20, font: 'Times New Roman' }),
          new TextRun({ text: `\t\t\t\t\tName: ${synopsis.guideBioData?.guideName || 'Approved Supervisor'}`, size: 20, font: 'Times New Roman' })
        ]
      })
    );

    // ==========================================
    // PAGE 3: TABLE OF CONTENTS
    // ==========================================
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'TABLE OF CONTENTS',
            bold: true,
            size: 26,
            font: 'Times New Roman',
            underline: {}
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        pageBreakBefore: true
      })
    );

    const tocList = [
      { num: '—', title: 'Cover Page & Academic Identification', page: '1' },
      { num: '—', title: 'Student Declaration & Supervisor Certificate', page: '2' },
      { num: '—', title: 'Table of Contents', page: '3' },
      { num: '1.0', title: 'Title of the Study', page: '4' },
      { num: '2.0', title: 'Introduction & Conceptual Foundations', page: '4' },
      { num: '3.0', title: 'Background of the Study & Industry Context', page: '5' },
      { num: '4.0', title: 'Role of HR / Domain Professionals in the Organization', page: '6' },
      { num: '5.0', title: 'Need for the Study (Detailed 7-Point Analysis)', page: '7' },
      { num: '6.0', title: 'HR / Organizational Vision, Mission & Strategic Objectives', page: '8' },
      { num: '7.0', title: 'Scope of the Study & Operational Boundaries', page: '9' },
      { num: '8.0', title: 'Statement of the Research Problem', page: '10' },
      { num: '9.0', title: 'Objectives of the Study', page: '10' },
      { num: '10.0', title: 'Research Questions', page: '11' },
      { num: '11.0', title: 'Hypotheses Formulation (Null & Alternate)', page: '11' },
      { num: '12.0', title: 'Significance of the Study across Key Stakeholder Groups', page: '12' },
      { num: '13.0', title: 'Research Methodology & Analytical Framework', page: '13' },
      { num: '14.0', title: 'Research Instruments (Questionnaire & Interview Schedules)', page: '14' },
      { num: '15.0', title: 'Sources of Data (Primary & Secondary Repositories)', page: '15' },
      { num: '16.0', title: 'Sampling Design & Stratification Protocols', page: '15' },
      { num: '17.0', title: 'Tools & Techniques of Data Analysis', page: '16' },
      { num: '18.0', title: 'Review of Literature & Empirical Syntheses (2015–2025)', page: '17' },
      { num: '19.0', title: 'Expected Outcomes & Academic Contributions', page: '18' },
      { num: '20.0', title: 'Limitations of the Study', page: '18' },
      { num: '21.0', title: 'Proposed Chapterization Scheme (Chapters 1 to 6)', page: '19' },
      { num: '22.0', title: 'Time Schedule & Milestone Work Plan (Gantt Structure)', page: '20' },
      { num: '23.0', title: 'Research Questionnaire (Sections A, B, and C)', page: '21' },
      { num: '24.0', title: 'References & Scholarly Bibliography (APA Format)', page: '23' },
      { num: '25.0', title: 'Supervisor / Guide Bio-Data Proforma (Official IGNOU Form)', page: '24' }
    ];

    const tocRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'S.No.', bold: true, size: 20, font: 'Times New Roman' })] })],
            shading: { fill: 'F1F5F9' }
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Section Description / Academic Topic', bold: true, size: 20, font: 'Times New Roman' })] })],
            shading: { fill: 'F1F5F9' }
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Page No.', bold: true, size: 20, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })],
            shading: { fill: 'F1F5F9' }
          })
        ]
      })
    ];

    tocList.forEach((item, idx) => {
      tocRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.num, bold: true, size: 19, font: 'Times New Roman' })] })],
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' }
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.title, size: 19, font: 'Times New Roman' })] })],
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' }
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.page, bold: true, size: 19, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })],
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' }
            })
          ]
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tocRows
      })
    );

    // ==========================================
    // ALL 26 ACADEMIC SECTIONS
    // ==========================================

    const addSectionHeader = (title: string, breakBefore: boolean = true) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 24,
              font: 'Times New Roman',
              underline: {}
            })
          ],
          spacing: { before: 240, after: 120 },
          pageBreakBefore: breakBefore
        })
      );
    };

    const addSubHeading = (title: string) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 22,
              font: 'Times New Roman'
            })
          ],
          spacing: { before: 140, after: 80 }
        })
      );
    };

    const addJustifiedText = (text?: string) => {
      if (!text) return;
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 22,
              font: 'Times New Roman'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        })
      );
    };

    // 1.0 Title
    addSectionHeader('1.0 TITLE OF THE STUDY', true);
    addJustifiedText(`"${cleanTitle.toUpperCase()}"`);

    // 2.0 Introduction
    addSectionHeader('2.0 INTRODUCTION & CONCEPTUAL FOUNDATIONS', false);
    const intro = synopsis.introduction;
    if (intro) {
      if (intro.meaningOfTopic) {
        addSubHeading('2.1 Meaning and Conceptual Foundations of the Topic');
        addJustifiedText(intro.meaningOfTopic);
      }
      if (intro.importance) {
        addSubHeading('2.2 Importance of the Study in Contemporary Business Context');
        addJustifiedText(intro.importance);
      }
      if (intro.currentBusinessRelevance) {
        addSubHeading('2.3 Current Business and Sectoral Relevance');
        addJustifiedText(intro.currentBusinessRelevance);
      }
      if (intro.whyTopicSelected) {
        addSubHeading('2.4 Rationale for Topic Selection');
        addJustifiedText(intro.whyTopicSelected);
      }
    }

    // 3.0 Background
    addSectionHeader('3.0 BACKGROUND OF THE STUDY & INDUSTRY PROFILE', true);
    const bg = synopsis.backgroundOfStudy;
    if (bg) {
      addSubHeading('3.1 Macro and Sectoral Industry Environment');
      addJustifiedText(bg.industryContext);
      addSubHeading(`3.2 Profile and Operational Context of ${orgName}`);
      addJustifiedText(bg.organizationalContext);
      addSubHeading('3.3 Emergence and Background of the Research Problem');
      addJustifiedText(bg.problemBackground);
    }

    // 4.0 Role of Professionals
    addSectionHeader('4.0 ROLE OF HR / DOMAIN PROFESSIONALS IN THE ORGANIZATION', false);
    const role = synopsis.roleOfProfessionals;
    if (role) {
      addJustifiedText(role.roleDescription);
      addSubHeading('Key Strategic Responsibilities & Functional Mandates:');
      role.keyFunctions.forEach(fn => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${fn}`, size: 21, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 }
          })
        );
      });
    }

    // 5.0 Need for the Study (Detailed 7 Points)
    addSectionHeader('5.0 NEED FOR THE STUDY (DETAILED 7-POINT DIMENSIONAL ANALYSIS)', true);
    const need = synopsis.needForStudyDetailed;
    if (need) {
      [
        { title: '5.1 Employee Development & Individual Growth', text: need.employeeDevelopment },
        { title: '5.2 Performance Improvement & Task Efficiency', text: need.performanceImprovement },
        { title: '5.3 Skill Development & Competency Matrix Bridging', text: need.skillDevelopment },
        { title: '5.4 Productivity Enhancement & Operational Throughput', text: need.productivityEnhancement },
        { title: '5.5 Quality Improvement & Error Minimization', text: need.qualityImprovement },
        { title: '5.6 Technology Adaptation & Digital Readiness', text: need.technologyAdaptation },
        { title: '5.7 Sustainable Organizational Growth & Market Leadership', text: need.organizationalGrowth }
      ].forEach(dim => {
        addSubHeading(dim.title);
        addJustifiedText(dim.text);
      });
    }

    // 6.0 Vision, Mission & Objectives
    addSectionHeader('6.0 HR / ORGANIZATIONAL VISION, MISSION & STRATEGIC OBJECTIVES', true);
    const vm = synopsis.visionMissionObjectives;
    if (vm) {
      addSubHeading('Vision Statement:');
      addJustifiedText(`"${vm.vision}"`);
      addSubHeading('Mission Statement:');
      addJustifiedText(`"${vm.mission}"`);
      addSubHeading('Strategic HR Goals & Objectives:');
      vm.strategicObjectives.forEach(o => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${o}`, size: 21, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 }
          })
        );
      });
    }

    // 7.0 Scope of the Study
    addSectionHeader('7.0 SCOPE OF THE STUDY & OPERATIONAL BOUNDARIES', false);
    const sc = synopsis.scopeOfTheStudy;
    if (sc) {
      addJustifiedText(`1. Research Domain: ${sc.researchArea}`);
      addJustifiedText(`2. Organizational Scope: ${sc.organizationCoverage || orgName}`);
      addJustifiedText(`3. Target Population & Coverage: ${sc.employeeCoverage || sc.targetPopulation}`);
      addJustifiedText(`4. Temporal Scope: ${sc.timePeriod}`);
      if (sc.areasIncluded && sc.areasIncluded.length > 0) {
        addSubHeading('Areas Included:');
        sc.areasIncluded.forEach(a => {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${a}`, size: 21, font: 'Times New Roman' })],
              spacing: { after: 40 }
            })
          );
        });
      }
    }

    // 8.0 Statement of Problem
    addSectionHeader('8.0 STATEMENT OF THE RESEARCH PROBLEM', true);
    addJustifiedText(synopsis.statementOfTheProblem);

    // 9.0 Objectives
    addSectionHeader('9.0 OBJECTIVES OF THE STUDY', false);
    (synopsis.objectivesOfTheStudy || []).forEach((obj, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: obj, size: 22, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 }
        })
      );
    });

    // 10.0 Research Questions
    addSectionHeader('10.0 RESEARCH QUESTIONS', false);
    (synopsis.researchQuestions || []).forEach((rq, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `RQ ${idx + 1}: `, bold: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: rq.replace(/^RQ\d+:\s*/i, ''), size: 22, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 }
        })
      );
    });

    // 11.0 Hypotheses
    addSectionHeader('11.0 HYPOTHESES FORMULATION', true);
    const hyp = synopsis.hypothesis;
    if (hyp && hyp.hasHypothesis) {
      addSubHeading('Null Hypotheses (H0):');
      (hyp.nullHypotheses || []).forEach(h => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${h}`, size: 21, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 }
          })
        );
      });
      addSubHeading('Alternate Hypotheses (H1):');
      (hyp.alternateHypotheses || []).forEach(h => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${h}`, size: 21, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 }
          })
        );
      });
      addJustifiedText(`Theoretical Rationale: ${hyp.rationale}`);
    }

    // 12.0 Significance
    addSectionHeader('12.0 SIGNIFICANCE OF THE STUDY', false);
    const sig = synopsis.significanceOfTheStudy;
    if (sig) {
      addJustifiedText(`1. For Organization: ${sig.forOrganization}`);
      addJustifiedText(`2. For Employees: ${sig.forEmployees}`);
      addJustifiedText(`3. For HR Department: ${sig.forHRDepartment}`);
      addJustifiedText(`4. For Top Management: ${sig.forManagement}`);
      addJustifiedText(`5. For Academic Scholars: ${sig.forResearchers}`);
    }

    // 13.0 Methodology
    addSectionHeader('13.0 RESEARCH METHODOLOGY & ANALYTICAL FRAMEWORK', true);
    const meth = synopsis.researchMethodology;
    if (meth) {
      addJustifiedText(`• Research Design: ${meth.researchDesign}`);
      addJustifiedText(`• Nature of Study: ${meth.natureOfStudy || meth.researchType}`);
      addJustifiedText(`• Population: ${meth.population}`);
      addJustifiedText(`• Sampling Unit: ${meth.samplingUnit}`);
      addJustifiedText(`• Sample Size: ${meth.sampleSize}`);
      addJustifiedText(`• Sampling Method: ${meth.samplingTechnique || meth.samplingMethod}`);
      addJustifiedText(`• Data Collection: ${meth.dataCollectionTools}`);
      addJustifiedText(`• Data Analysis: ${meth.dataAnalysisMethod}`);
      if (meth.descriptiveResearchRationale) {
        addSubHeading('Rationale for Descriptive Research Design:');
        addJustifiedText(meth.descriptiveResearchRationale);
      }
    }

    // 14.0 Instruments
    addSectionHeader('14.0 RESEARCH INSTRUMENTS & FIELD PROTOCOLS', false);
    const inst = synopsis.researchInstruments;
    if (inst) {
      addJustifiedText(inst.questionnaireDesign);
      addJustifiedText(inst.interviewDiscussion);
      addJustifiedText(inst.observation);
    }

    // 15.0 Sources of Data
    addSectionHeader('15.0 SOURCES OF DATA', true);
    const src = synopsis.sourcesOfData;
    if (src) {
      addSubHeading('A. Primary Data Sources:');
      (src.primaryDataSources || []).forEach(s => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${s}`, size: 21, font: 'Times New Roman' })],
            spacing: { after: 40 }
          })
        );
      });
      addSubHeading('B. Secondary Data Sources:');
      (src.secondaryDataSources || []).forEach(s => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${s}`, size: 21, font: 'Times New Roman' })],
            spacing: { after: 40 }
          })
        );
      });
    }

    // 16.0 Sampling Design
    addSectionHeader('16.0 SAMPLING DESIGN & PROTOCOLS', false);
    const samp = synopsis.samplingDesign;
    if (samp) {
      addJustifiedText(`Population: ${samp.population}`);
      addJustifiedText(`Sampling Unit: ${samp.samplingUnit}`);
      addJustifiedText(`Sample Size: ${samp.sampleSize}`);
      addJustifiedText(`Sampling Technique: ${samp.samplingTechnique}`);
      addJustifiedText(`Rationale: ${samp.rationale}`);
    }

    // 17.0 Tools & Techniques
    addSectionHeader('17.0 TOOLS AND TECHNIQUES OF DATA ANALYSIS', false);
    const tools = synopsis.toolsAndTechniques;
    if (tools) {
      [tools.frequencyAnalysis, tools.percentageAnalysis, tools.tabularRepresentation, tools.graphicalTools, tools.meanScoreAnalysis, tools.comparativeAnalysis].filter(Boolean).forEach(t => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${t}`, size: 21, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 }
          })
        );
      });
    }

    // 18.0 Review of Literature
    addSectionHeader('18.0 REVIEW OF LITERATURE & EMPIRICAL SYNTHESES (2015–2025)', true);
    const lit = synopsis.reviewOfLiterature;
    if (lit) {
      addJustifiedText(lit.overview);
      if (lit.thematicReview) {
        addSubHeading('Thematic Review of Literature:');
        addJustifiedText(lit.thematicReview);
      }
      addSubHeading('Key Empirical & Seminal Studies:');
      (lit.studies || []).forEach((st, idx) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${idx + 1}. ${st.authorYear} - "${st.title}": `, bold: true, size: 21, font: 'Times New Roman' }),
              new TextRun({ text: st.findings, size: 21, font: 'Times New Roman' })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 80 }
          })
        );
      });
      if (lit.researchGap) {
        addSubHeading('Research Gap:');
        addJustifiedText(lit.researchGap);
      }
    }

    // 19.0 Expected Outcomes
    addSectionHeader('19.0 EXPECTED OUTCOMES OF THE STUDY', true);
    const out = synopsis.expectedOutcome;
    if (out) {
      addJustifiedText(`1. Academic Deliverables: ${out.deliverables}`);
      addJustifiedText(`2. Practical & Managerial Impact: ${out.practicalImpact}`);
      addJustifiedText(`3. Scholarly Contribution: ${out.academicValue}`);
      addJustifiedText(`4. Organizational Benefits: ${out.expectedOrganizationalBenefits || out.practicalImpact}`);
    }

    // 20.0 Limitations
    addSectionHeader('20.0 LIMITATIONS OF THE STUDY', false);
    (synopsis.limitationsOfTheStudy || []).forEach((lim, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: lim, size: 22, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 }
        })
      );
    });

    // 21.0 Chapterization
    addSectionHeader('21.0 PROPOSED CHAPTERIZATION SCHEME', true);
    (synopsis.proposedChapterization || []).forEach(ch => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Chapter ${ch.chapterNumber}: ${ch.chapterTitle}`, bold: true, size: 22, font: 'Times New Roman' })
          ],
          spacing: { before: 80, after: 40 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: ch.description, size: 21, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 }
        })
      );
    });

    // 22.0 Time Schedule
    addSectionHeader('22.0 TIME SCHEDULE & MILESTONE WORK PLAN', false);
    (synopsis.timeSchedule || []).forEach(ts => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${ts.stage} (${ts.timePeriod}): `, bold: true, size: 21, font: 'Times New Roman' }),
            new TextRun({ text: ts.description, size: 21, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60 }
        })
      );
    });

    // 23.0 Questionnaire
    addSectionHeader('23.0 RESEARCH QUESTIONNAIRE (SURVEY INSTRUMENT)', true);
    const q = synopsis.questionnaire;
    if (q) {
      addSubHeading(q.title || 'RESEARCH QUESTIONNAIRE');
      addJustifiedText(q.introductionNote);
      if (q.sectionA) {
        addSubHeading(q.sectionA.sectionTitle);
        q.sectionA.items.forEach(item => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${item.questionNumber}. ${item.questionText}`, bold: true, size: 21, font: 'Times New Roman' }),
                new TextRun({ text: item.options ? `\nOptions: [  ] ${item.options.join('   [  ] ')}` : '', size: 20, font: 'Times New Roman' })
              ],
              spacing: { after: 80 }
            })
          );
        });
      }
      if (q.sectionB) {
        addSubHeading(q.sectionB.sectionTitle);
        q.sectionB.items.forEach(item => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${item.questionNumber}. ${item.questionText}`, bold: true, size: 21, font: 'Times New Roman' }),
                new TextRun({ text: item.options ? `\nOptions: [  ] ${item.options.join('   [  ] ')}` : '', size: 20, font: 'Times New Roman' })
              ],
              spacing: { after: 80 }
            })
          );
        });
      }
      if (q.sectionC) {
        addSubHeading(q.sectionC.sectionTitle);
        q.sectionC.items.forEach(item => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${item.questionNumber}. ${item.questionText}  [ 1=SD  2=D  3=N  4=A  5=SA ]`, size: 21, font: 'Times New Roman' })
              ],
              spacing: { after: 60 }
            })
          );
        });
      }
    }

    // 24.0 References
    addSectionHeader('24.0 REFERENCES & SCHOLARLY BIBLIOGRAPHY (APA FORMAT)', true);
    (synopsis.references || []).forEach((ref, idx) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${idx + 1}] `, bold: true, size: 21, font: 'Times New Roman' }),
            new TextRun({ text: ref.citation, size: 21, font: 'Times New Roman' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 }
        })
      );
    });

    // 25.0 Guide Biodata
    addSectionHeader('25.0 PROFORMA FOR APPROVAL OF PROJECT PROPOSAL (SYNOPSIS)', true);
    const guideRows = [
      { field: '1. Enrollment No. of Student:', value: enrollmentVal },
      { field: '2. Name of Student:', value: studentNameVal },
      { field: '3. Programme / Course Code:', value: `${progVal} / ${courseCodeVal}` },
      { field: '4. Regional Centre / Study Centre:', value: `${synopsis.regionalCenterCode || 'RC-07'} / ${synopsis.studyCenterCode || 'SC-0700'}` },
      { field: '5. Proposed Project Title:', value: cleanTitle },
      { field: '6. Name of Proposed Supervisor:', value: synopsis.guideBioData?.guideName || 'Approved Project Supervisor' },
      { field: '7. Academic Qualifications of Guide:', value: synopsis.guideBioData?.qualification || 'Ph.D / MBA / Post Graduate' },
      { field: '8. Designation & Official Address:', value: `${synopsis.guideBioData?.designation || 'Academic Counsellor'}, ${synopsis.guideBioData?.organization || 'IGNOU Study Centre'}` },
      { field: '9. Total Teaching Experience:', value: synopsis.guideBioData?.teachingExperience || '10+ Years' },
      { field: '10. Number of Students Supervised:', value: synopsis.guideBioData?.supervisionExperience || 'Within Prescribed IGNOU Norms (≤ 5 Candidates)' }
    ];

    guideRows.forEach(r => {
      addJustifiedText(`• ${r.field} ${r.value}`);
    });

    // Final Document Assembly with Running Headers and Footers
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440
              }
            }
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `INDIRA GANDHI NATIONAL OPEN UNIVERSITY | ${progVal.toUpperCase()} PROJECT PROPOSAL (${courseCodeVal})`,
                      size: 16,
                      font: 'Times New Roman',
                      color: '64748B'
                    })
                  ],
                  alignment: AlignmentType.LEFT
                })
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'IGNOU Academic Project Proposal & Research Blueprint\t\tPage ',
                      size: 16,
                      font: 'Times New Roman',
                      color: '64748B'
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT]
                    })
                  ]
                })
              ]
            })
          },
          children: docChildren
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return {
      filePath,
      relativeUrl: `/api/synopsis/${synopsis.id}/download/docx`
    };
  }
}
