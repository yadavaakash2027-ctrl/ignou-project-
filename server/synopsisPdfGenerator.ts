import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { SynopsisData } from '../src/types';
import { STORAGE_DIR } from './db';

export class SynopsisPDFGenerator {
  /**
   * Generates a formal, publication-quality academic IGNOU Project Synopsis PDF
   * strictly adhering to the 11 required sections in exact order.
   */
  static async generateSynopsisPDF(synopsis: SynopsisData): Promise<{ filePath: string; relativeUrl: string; pageCount: number }> {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    const safeEnrollment = synopsis.enrollmentNumber ? synopsis.enrollmentNumber.replace(/[^a-zA-Z0-9_-]/g, '') : 'STUDENT';
    const filename = `IGNOU_Synopsis_${synopsis.courseCode || 'PROPOSAL'}_${safeEnrollment}_${synopsis.id.slice(0, 8)}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 54, bottom: 54, left: 54, right: 54 },
        bufferPages: true,
        autoFirstPage: true
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- COVER PAGE ---
      this.renderCoverPage(doc, synopsis);

      // --- STUDENT & PROJECT DETAILS ---
      doc.addPage();
      this.renderStudentProjectDetails(doc, synopsis);

      // --- SECTION 1: PROJECT TITLE & SECTION 2: INTRODUCTION ---
      doc.addPage();
      this.renderSection1ProjectTitle(doc, synopsis);
      this.renderSection2Introduction(doc, synopsis);

      // --- SECTION 3: PROBLEM STATEMENT ---
      this.renderSection3ProblemStatement(doc, synopsis);

      // --- SECTION 4: OBJECTIVES ---
      this.renderSection4Objectives(doc, synopsis);

      // --- SECTION 5: SCOPE OF THE PROJECT ---
      doc.addPage();
      this.renderSection5Scope(doc, synopsis);

      // --- SECTION 6: LITERATURE REVIEW ---
      doc.addPage();
      this.renderSection6LiteratureReview(doc, synopsis);

      // --- SECTION 7: METHODOLOGY ---
      doc.addPage();
      this.renderSection7Methodology(doc, synopsis);

      // --- SECTION 8: TOOLS & TECHNOLOGIES ---
      doc.addPage();
      this.renderSection8ToolsAndTechnologies(doc, synopsis);

      // --- SECTION 9: EXPECTED OUTCOME ---
      doc.addPage();
      this.renderSection9ExpectedOutcome(doc, synopsis);

      // --- SECTION 10: WORK PLAN / TIMELINE ---
      this.renderSection10WorkPlan(doc, synopsis);

      // --- SECTION 11: REFERENCES / BIBLIOGRAPHY ---
      doc.addPage();
      this.renderSection11References(doc, synopsis);

      // --- RUNNING HEADERS & FOOTERS (Page 2+) ---
      const totalPages = doc.bufferedPageRange().count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Skip header/footer on cover page (page 0)
        if (i > 0) {
          // Running Header
          doc.fontSize(8.5).font('Times-Bold').fillColor('#1E293B');
          const progText = synopsis.program ? `${synopsis.program.toUpperCase()} PROJECT SYNOPSIS` : 'IGNOU PROJECT SYNOPSIS';
          const codeText = synopsis.courseCode ? ` (${synopsis.courseCode})` : '';
          doc.text(`INDIRA GANDHI NATIONAL OPEN UNIVERSITY | ${progText}${codeText}`, 54, 30, {
            align: 'left',
            width: 487
          });
          doc.fontSize(8).font('Times-Italic').fillColor('#64748B');
          const cleanShortTitle = (synopsis.projectTitle || 'Project Synopsis').replace(/\s+/g, ' ').trim();
          doc.text(`Topic: ${cleanShortTitle.length > 70 ? cleanShortTitle.slice(0, 70) + '...' : cleanShortTitle}`, 54, 41, {
            align: 'left',
            width: 487
          });

          // Header horizontal rule
          doc.moveTo(54, 50).lineTo(541, 50).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

          // Running Footer
          doc.moveTo(54, 792).lineTo(541, 792).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
          doc.fontSize(8.5).font('Times-Roman').fillColor('#64748B');
          doc.text(`Enrollment No: ${synopsis.enrollmentNumber || 'IGNOU Student'}`, 54, 798, { align: 'left' });
          doc.font('Times-Bold').text(`Page ${i + 1} of ${totalPages}`, 54, 798, {
            align: 'right',
            width: 487
          });
        }
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          relativeUrl: `/api/synopsis/${synopsis.id}/download/pdf`,
          pageCount: totalPages
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  // ==========================================
  // PAGE 1: STANDARDIZED IGNOU COVER PAGE
  // ==========================================
  private static renderCoverPage(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Outer double border
    doc.rect(28, 28, pageWidth - 56, pageHeight - 56).lineWidth(1.5).strokeColor('#0F172A').stroke();
    doc.rect(32, 32, pageWidth - 64, pageHeight - 64).lineWidth(0.75).strokeColor('#475569').stroke();

    let y = 58;

    // Header: PROPOSAL FOR PROJECT WORK (SYNOPSIS)
    doc.fontSize(15).font('Times-Bold').fillColor('#0F172A').text('PROPOSAL FOR PROJECT WORK (SYNOPSIS)', 54, y, {
      align: 'center',
      width: 487
    });

    y += 24;
    const courseCodeStr = synopsis.courseCode || 'MMPP-001';
    doc.fontSize(12).font('Times-Bold').fillColor('#1E293B').text(`COURSE CODE: ${courseCodeStr.toUpperCase()}`, 54, y, {
      align: 'center',
      width: 487
    });

    y += 20;
    doc.fontSize(10.5).font('Times-Italic').fillColor('#334155').text(
      'Proposal submitted in partial fulfillment of the requirements for the award of the degree of',
      54,
      y,
      { align: 'center', width: 487 }
    );

    y += 18;
    const progFull = synopsis.program === 'MBA'
      ? 'MASTER OF BUSINESS ADMINISTRATION (MBA)'
      : synopsis.program === 'MCA'
      ? 'MASTER OF COMPUTER APPLICATIONS (MCA)'
      : synopsis.program === 'BCA'
      ? 'BACHELOR OF COMPUTER APPLICATIONS (BCA)'
      : synopsis.program === 'M.Com'
      ? 'MASTER OF COMMERCE (M.COM)'
      : `${synopsis.program?.toUpperCase() || 'BACHELOR / MASTER DEGREE'}`;

    doc.fontSize(13.5).font('Times-Bold').fillColor('#0F172A').text(progFull, 54, y, {
      align: 'center',
      width: 487
    });

    y += 35;

    // Topic Label
    doc.fontSize(11).font('Times-Bold').fillColor('#1E293B').text('PROJECT SYNOPSIS TITLE:', 54, y, {
      align: 'center',
      width: 487
    });

    y += 16;

    // Topic Title Box
    const cleanTitle = (synopsis.projectTitle || 'PROJECT SYNOPSIS').toUpperCase();
    const titleBoxWidth = 460;
    const titleBoxX = 54 + (487 - titleBoxWidth) / 2;

    doc.fontSize(12).font('Times-Bold');
    const textHeight = doc.heightOfString(`"${cleanTitle}"`, { width: titleBoxWidth - 30, align: 'center' });
    const boxHeight = Math.max(54, textHeight + 20);

    doc.rect(titleBoxX, y, titleBoxWidth, boxHeight).fillAndStroke('#F8FAFC', '#334155');
    doc.fontSize(12).font('Times-Bold').fillColor('#0F172A').text(`"${cleanTitle}"`, titleBoxX + 15, y + 10, {
      align: 'center',
      width: titleBoxWidth - 30
    });

    y += boxHeight + 40;

    // 2-Column Info Block: Submitted By vs Under Supervision Of
    const col1X = 54;
    const col2X = 316;
    const blockStartY = y;

    // Column 1: Submitted By
    doc.fontSize(11).font('Times-Bold').fillColor('#0F172A').text('SUBMITTED BY:', col1X, blockStartY);
    doc.moveTo(col1X, blockStartY + 14).lineTo(col1X + 140, blockStartY + 14).lineWidth(0.75).strokeColor('#0F172A').stroke();

    let c1y = blockStartY + 22;
    doc.fontSize(10).font('Times-Bold').fillColor('#1E293B').text('Student Name:', col1X, c1y);
    doc.font('Times-Roman').text(synopsis.studentName || 'IGNOU Student', col1X + 85, c1y);

    c1y += 18;
    doc.font('Times-Bold').text('Enrollment No:', col1X, c1y);
    doc.font('Times-Roman').text(synopsis.enrollmentNumber || 'IGNOU-2025-XXXX', col1X + 85, c1y);

    c1y += 18;
    doc.font('Times-Bold').text('Programme:', col1X, c1y);
    doc.font('Times-Roman').text(synopsis.program || 'MCA', col1X + 85, c1y);

    c1y += 18;
    doc.font('Times-Bold').text('Course Code:', col1X, c1y);
    doc.font('Times-Roman').text(synopsis.courseCode || 'BCSP-064', col1X + 85, c1y);

    c1y += 18;
    doc.font('Times-Bold').text('Study Centre:', col1X, c1y);
    doc.font('Times-Roman').text(`${synopsis.studyCenterName || 'Study Centre'} (${synopsis.studyCenterCode || 'SC-0700'})`, col1X + 85, c1y, { width: 140 });

    // Column 2: Under Guidance / Supervision Of
    doc.fontSize(11).font('Times-Bold').fillColor('#0F172A').text('UNDER GUIDANCE OF:', col2X, blockStartY);
    doc.moveTo(col2X, blockStartY + 14).lineTo(col2X + 160, blockStartY + 14).lineWidth(0.75).strokeColor('#0F172A').stroke();

    let c2y = blockStartY + 22;
    const guideName = synopsis.guideName || synopsis.guideBioData?.guideName || 'Approved Project Supervisor';
    doc.fontSize(10).font('Times-Bold').fillColor('#1E293B').text('Supervisor:', col2X, c2y);
    doc.font('Times-Roman').text(guideName, col2X + 80, c2y);

    c2y += 18;
    doc.font('Times-Bold').text('Designation:', col2X, c2y);
    doc.font('Times-Roman').text(synopsis.guideBioData?.designation || 'Academic Counsellor / Guide', col2X + 80, c2y);

    c2y += 18;
    doc.font('Times-Bold').text('Institution:', col2X, c2y);
    doc.font('Times-Roman').text(synopsis.guideBioData?.organization || 'Indira Gandhi National Open University', col2X + 80, c2y, { width: 145 });

    c2y += 28;
    doc.font('Times-Bold').text('Regional Centre:', col2X, c2y);
    doc.font('Times-Roman').text(`${synopsis.regionalCenterName || 'Regional Centre'} (${synopsis.regionalCenterCode || 'RC-07'})`, col2X + 90, c2y, { width: 135 });

    // University Footer Block
    y = 705;
    doc.moveTo(54, y).lineTo(541, y).lineWidth(1).strokeColor('#0F172A').stroke();
    y += 12;

    doc.fontSize(13).font('Times-Bold').fillColor('#0F172A').text(
      'INDIRA GANDHI NATIONAL OPEN UNIVERSITY',
      54,
      y,
      { align: 'center', width: 487 }
    );

    y += 16;
    doc.fontSize(10).font('Times-Roman').fillColor('#334155').text(
      'Maidan Garhi, New Delhi – 110068 (India)',
      54,
      y,
      { align: 'center', width: 487 }
    );

    y += 14;
    doc.fontSize(9.5).font('Times-Bold').fillColor('#0F172A').text(
      `Academic Session: ${synopsis.sessionYear || '2025–2026'}`,
      54,
      y,
      { align: 'center', width: 487 }
    );
  }

  // ==========================================
  // PAGE 2: STUDENT / PROJECT DETAILS
  // ==========================================
  private static renderStudentProjectDetails(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderPageHeader(doc, 'STUDENT & PROJECT PARTICULARS', y);
    y += 35;

    doc.fontSize(10).font('Times-Italic').fillColor('#475569').text(
      'Official proforma record submitted to Indira Gandhi National Open University for project proposal evaluation and approval.',
      54,
      y,
      { align: 'center', width: 487 }
    );
    y += 25;

    // Structured Table of Details
    const details = [
      { label: 'Student Name', value: synopsis.studentName || 'IGNOU Student' },
      { label: 'Enrollment Number', value: synopsis.enrollmentNumber || 'IGNOU-2025-XXXX' },
      { label: 'Degree Programme', value: `${synopsis.program || 'MCA'} (${synopsis.subjectName || 'Computer Applications'})` },
      { label: 'Course Code', value: synopsis.courseCode || 'BCSP-064' },
      { label: 'Project Title', value: synopsis.projectTitle || 'Project Proposal' },
      { label: 'Project Category / Type', value: synopsis.projectType || 'Software Development & Systems Implementation' },
      { label: 'Study Centre', value: `${synopsis.studyCenterName || 'Study Centre'} (Code: ${synopsis.studyCenterCode || 'SC-0700'})` },
      { label: 'Regional Centre', value: `${synopsis.regionalCenterName || 'Regional Centre'} (Code: ${synopsis.regionalCenterCode || 'RC-07'})` },
      { label: 'Approved Supervisor / Guide', value: synopsis.guideName || synopsis.guideBioData?.guideName || 'Approved Project Supervisor' },
      { label: 'Student Email Address', value: synopsis.email || 'student@ignou.ac.in' },
      { label: 'Student Contact Number', value: synopsis.mobileNumber || '+91 98XXXXXXXX' },
      { label: 'Academic Session', value: synopsis.sessionYear || '2025–2026' }
    ];

    details.forEach((row, index) => {
      const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(54, y, 487, 22).fillAndStroke(bg, '#CBD5E1');

      doc.fontSize(9).font('Times-Bold').fillColor('#0F172A').text(row.label, 62, y + 6, { width: 170 });
      doc.font('Times-Roman').fillColor('#1E293B').text(row.value, 235, y + 6, { width: 298 });

      y += 22;
    });

    y += 30;

    // Declaration of Originality
    this.renderSectionHeading(doc, 'ACADEMIC DECLARATION OF ORIGINALITY', y);
    y += 22;

    const decText = synopsis.declaration?.statement ||
      `I hereby declare that this project synopsis titled "${synopsis.projectTitle}" submitted by me to Indira Gandhi National Open University (IGNOU), New Delhi, in partial fulfillment of the requirements for the award of the Degree of ${synopsis.program}, is an authentic and original piece of academic work undertaken under the guidance of my supervisor.\n\nI affirm that this work has not been submitted previously for any degree, diploma, or qualification at this or any other university. All sources, theoretical literature, and technological references cited have been duly referenced in accordance with university academic guidelines.`;

    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(decText, 54, y, {
      align: 'justify',
      lineGap: 4,
      width: 487
    });

    y += 120;

    // Signatures
    const leftX = 54;
    const rightX = 330;

    doc.fontSize(9.5).font('Times-Bold').fillColor('#0F172A').text('Date: ____________________', leftX, y);
    doc.text('Place: ___________________', leftX, y + 18);

    doc.text('____________________________________', rightX, y);
    doc.text('(Signature of Candidate)', rightX + 25, y + 14);
    doc.fontSize(9).font('Times-Roman');
    doc.text(`Name: ${synopsis.studentName || 'Student'}`, rightX + 25, y + 28);
    doc.text(`Enrollment No: ${synopsis.enrollmentNumber || 'IGNOU-XXXX'}`, rightX + 25, y + 40);
  }

  // ==========================================
  // SECTION 1: PROJECT TITLE
  // ==========================================
  private static renderSection1ProjectTitle(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '1. PROJECT TITLE', y);
    y += 26;

    const titleText = (synopsis.projectTitle || 'PROJECT PROPOSAL').toUpperCase();
    doc.rect(54, y, 487, 42).fillAndStroke('#F8FAFC', '#CBD5E1');
    doc.fontSize(11).font('Times-Bold').fillColor('#0F172A').text(`"${titleText}"`, 64, y + 13, {
      align: 'center',
      width: 467
    });

    y += 54;
    doc.y = y;
  }

  // ==========================================
  // SECTION 2: INTRODUCTION
  // ==========================================
  private static renderSection2Introduction(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = doc.y + 10;
    this.renderSectionHeading(doc, '2. INTRODUCTION', y);
    y += 24;

    const text = synopsis.sections11?.section2_introduction ||
      synopsis.introduction?.fullText ||
      `The project titled "${synopsis.projectTitle}" represents an academic and practical investigation undertaken within the curriculum of IGNOU's ${synopsis.program} (${synopsis.courseCode}). In modern organizational and technological environments, addressing operational inefficiencies and information silos requires systematic modeling, robust software architectures, and rigorous testing.\n\nThis project is conceived to explore current challenges in the problem domain, review established benchmarks, and deliver a reliable, accessible solution that empowers stakeholders and optimizes workflow processes.`;

    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(text, 54, y, {
      align: 'justify',
      lineGap: 4,
      width: 487
    });

    doc.y += 20;
  }

  // ==========================================
  // SECTION 3: PROBLEM STATEMENT
  // ==========================================
  private static renderSection3ProblemStatement(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    this.ensureSpace(doc, 150);
    let y = doc.y + 10;
    this.renderSectionHeading(doc, '3. PROBLEM STATEMENT', y);
    y += 24;

    const text = synopsis.sections11?.section3_problemStatement ||
      synopsis.statementOfTheProblem ||
      `In conventional operational workflows, processes related to "${synopsis.projectTitle}" frequently rely upon fragmented data, manual coordination, or legacy tools that lack centralization and security. These practices produce delayed turnaround times, susceptibility to human error, and lack of real-time auditability.\n\nWithout a standardized, automated platform, organizations face recurring resource loss and impaired decision-making. The proposed project directly solves these critical challenges by providing an integrated, scalable system that automates tasks, ensures data validation, and enforces role-based access control.`;

    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(text, 54, y, {
      align: 'justify',
      lineGap: 4,
      width: 487
    });

    doc.y += 20;
  }

  // ==========================================
  // SECTION 4: OBJECTIVES (NUMBERED POINTS)
  // ==========================================
  private static renderSection4Objectives(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    this.ensureSpace(doc, 200);
    let y = doc.y + 10;
    this.renderSectionHeading(doc, '4. OBJECTIVES', y);
    y += 24;

    doc.fontSize(9.5).font('Times-Italic').fillColor('#475569').text(
      'The specific academic and technical objectives formulated for this project are as follows:',
      54,
      y
    );
    y += 18;

    const objectives = synopsis.sections11?.section4_objectives ||
      synopsis.objectivesOfTheStudy || [
        '1. To analyze stakeholder requirements and formulate functional specifications for the system.',
        '2. To design an intuitive, responsive user interface ensuring accessibility across devices.',
        '3. To architect a scalable backend architecture with modular business logic.',
        '4. To normalize the database schema up to Third Normal Form (3NF) to maintain data integrity.',
        '5. To implement role-based access control (RBAC) and validation mechanisms.',
        '6. To perform unit, integration, and user acceptance testing (UAT) to guarantee system reliability.',
        '7. To document deployment and operational procedures for academic evaluation.'
      ];

    objectives.forEach((objText) => {
      const cleanObj = objText.replace(/^\d+\.\s*/, '');
      const match = objText.match(/^(\d+)\./);
      const num = match ? match[1] : '';

      doc.fontSize(9.5).font('Times-Bold').fillColor('#0F172A').text(`${num || '•'}.`, 62, y);
      doc.font('Times-Roman').fillColor('#1E293B').text(cleanObj, 82, y, {
        align: 'justify',
        lineGap: 3.5,
        width: 459
      });

      y += doc.heightOfString(cleanObj, { width: 459, lineGap: 3.5 }) + 7;
    });

    doc.y = y + 10;
  }

  // ==========================================
  // SECTION 5: SCOPE OF THE PROJECT
  // ==========================================
  private static renderSection5Scope(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '5. SCOPE OF THE PROJECT', y);
    y += 24;

    const scope = synopsis.sections11?.section5_scope || {
      coverage: (synopsis.scopeOfTheStudy as any)?.operationalContext || (synopsis.scopeOfTheStudy as any)?.subjectCoverage || `Encompasses the operational lifecycle of ${synopsis.projectTitle}.`,
      features: ['User Authentication & Authorization', 'Interactive Management Dashboard', 'Core Operations Processing', 'Data Validation & Reporting', 'Audit Trails & System Logging'],
      targetUsers: 'System Administrators, Staff Personnel, End Users, and Academic Evaluators.',
      accomplishments: 'Delivers a verified, automated system that eliminates manual errors and speeds processing.',
      limitations: 'Limited to standard institutional infrastructure and simulated external APIs.'
    };

    // 5.1 Project Coverage
    doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text('5.1 Coverage and Operational Context', 54, y);
    y += 15;
    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(scope.coverage, 54, y, { align: 'justify', lineGap: 3.5, width: 487 });
    y += doc.heightOfString(scope.coverage, { width: 487, lineGap: 3.5 }) + 14;

    // 5.2 Main Features / Functions
    doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text('5.2 Main Features and Functional Modules', 54, y);
    y += 15;
    (scope.features || []).forEach((feat: string, idx: number) => {
      doc.fontSize(9.5).font('Times-Bold').fillColor('#0F172A').text(`•`, 64, y);
      doc.font('Times-Roman').fillColor('#1E293B').text(feat, 78, y, { width: 463 });
      y += 16;
    });
    y += 10;

    // 5.3 Target Users
    doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text('5.3 Target Users and Beneficiaries', 54, y);
    y += 15;
    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(scope.targetUsers, 54, y, { align: 'justify', width: 487 });
    y += doc.heightOfString(scope.targetUsers, { width: 487 }) + 14;

    // 5.4 What the System/Research Will Accomplish
    doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text('5.4 System Accomplishments & Deliverables', 54, y);
    y += 15;
    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(scope.accomplishments, 54, y, { align: 'justify', width: 487 });
    y += doc.heightOfString(scope.accomplishments, { width: 487 }) + 14;

    // 5.5 Limitations or Boundaries
    doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text('5.5 Operational Limitations and Boundaries', 54, y);
    y += 15;
    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(scope.limitations, 54, y, { align: 'justify', width: 487 });
    y += doc.heightOfString(scope.limitations, { width: 487 }) + 10;

    doc.y = y;
  }

  // ==========================================
  // SECTION 6: LITERATURE REVIEW
  // ==========================================
  private static renderSection6LiteratureReview(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '6. LITERATURE REVIEW', y);
    y += 24;

    const text = synopsis.sections11?.section6_literatureReview ||
      synopsis.reviewOfLiterature?.fullText ||
      `The literature review for "${synopsis.projectTitle}" synthesizes established academic concepts, software engineering methodologies, and verified institutional standards.\n\nFoundational literature in software engineering (Pressman, 2014; Sommerville, 2016) underscores that rigorous requirements modeling and architectural design significantly minimize defect leakage in complex applications. Relational database paradigms established by Silberschatz et al. (2019) emphasize normal form compliance (3NF) to preserve data consistency and eliminate redundancy.\n\nIndustry frameworks regarding modern web architectures demonstrate marked improvements in concurrency, modularity, and operational throughput. Furthermore, web security standards specified by OWASP (2021) and ISO/IEC guidelines mandate role-based authentication, sanitized data transmission, and rigorous session protection. The proposed project builds upon these validated theoretical foundations without relying upon fabricated data or unverified assumptions.`;

    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(text, 54, y, {
      align: 'justify',
      lineGap: 4,
      width: 487
    });

    doc.y += 20;
  }

  // ==========================================
  // SECTION 7: METHODOLOGY
  // ==========================================
  private static renderSection7Methodology(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '7. METHODOLOGY', y);
    y += 24;

    const methodology = synopsis.sections11?.section7_methodology || {
      fullText: `The methodology follows a disciplined lifecycle tailored to IGNOU academic criteria, advancing through structured engineering and validation phases.`,
      steps: [
        { title: 'Phase 1: Requirement Analysis & Feasibility Study', description: 'Gathering functional and non-functional specifications, formulating the Software Requirements Specification (SRS), and evaluating operational feasibility.' },
        { title: 'Phase 2: System Design & Architecture', description: 'Modeling Data Flow Diagrams (DFD Levels 0, 1, and 2), Unified Modeling Language (UML) class/sequence diagrams, and component interactions.' },
        { title: 'Phase 3: Database Design & Normalization', description: 'Entity-Relationship (ER) modeling, relational schema normalization up to Third Normal Form (3NF), and index optimization.' },
        { title: 'Phase 4: Implementation & Coding', description: 'Modular construction of frontend interfaces, backend controllers, and RESTful API endpoints adhering to standard design patterns.' },
        { title: 'Phase 5: Quality Assurance & Testing', description: 'Execution of comprehensive testing protocols including Unit Testing, Integration Testing, System Verification, and User Acceptance Testing (UAT).' },
        { title: 'Phase 6: Deployment & Configuration', description: 'Configuring hosting environments, database connection pooling, build compilation, and baseline performance optimization.' },
        { title: 'Phase 7: Maintenance & Evaluation', description: 'Establishing logging mechanisms, defect tracking procedures, backup strategies, and formal evaluation against initial project objectives.' }
      ]
    };

    if (methodology.fullText) {
      doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(methodology.fullText, 54, y, {
        align: 'justify',
        lineGap: 3.5,
        width: 487
      });
      y += doc.heightOfString(methodology.fullText, { width: 487, lineGap: 3.5 }) + 16;
    }

    (methodology.steps || []).forEach((step: any, idx: number) => {
      this.ensureSpace(doc, 50);
      if (doc.y > y) y = doc.y;

      doc.fontSize(10).font('Times-Bold').fillColor('#0F172A').text(`7.${idx + 1} ${step.title}`, 54, y);
      y += 14;

      doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(step.description, 64, y, {
        align: 'justify',
        lineGap: 3,
        width: 477
      });
      y += doc.heightOfString(step.description, { width: 477, lineGap: 3 }) + 10;
    });

    doc.y = y;
  }

  // ==========================================
  // SECTION 8: TOOLS & TECHNOLOGIES
  // ==========================================
  private static renderSection8ToolsAndTechnologies(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '8. TOOLS & TECHNOLOGIES', y);
    y += 24;

    doc.fontSize(9.5).font('Times-Italic').fillColor('#475569').text(
      'The selected tools and technologies are aligned directly with the project architecture to ensure scalability, security, and maintainability:',
      54,
      y
    );
    y += 18;

    const tools = synopsis.sections11?.section8_toolsAndTechnologies || [
      { category: 'Programming Languages', items: ['TypeScript / JavaScript (ES2023+)', 'SQL / HTML5 / CSS3'], justification: 'Provides static typing, runtime stability, and universal cross-platform support.' },
      { category: 'Frontend Technologies', items: ['React.js 18+', 'Tailwind CSS', 'Vite'], justification: 'Delivers component-driven, responsive user interfaces with rapid compilation.' },
      { category: 'Backend Technologies', items: ['Node.js', 'Express.js Framework', 'RESTful Architecture'], justification: 'Enables asynchronous, non-blocking request handling and secure middleware pipelines.' },
      { category: 'Database & Storage', items: ['PostgreSQL / SQLite', 'Relational Schemas (3NF)'], justification: 'Guarantees ACID compliance, transactional integrity, and optimized indexing.' },
      { category: 'Development Environment & Tools', items: ['Visual Studio Code', 'Git Version Control', 'Postman / REST Client'], justification: 'Standard industry environment for code authoring, version control, and API testing.' },
      { category: 'Operating System & Infrastructure', items: ['Linux (Ubuntu LTS) / Windows 11 / macOS', 'Node.js Runtime'], justification: 'Ensures broad deployment compatibility across containerized servers and academic workstations.' }
    ];

    // Table Header
    doc.rect(54, y, 487, 22).fillAndStroke('#F1F5F9', '#CBD5E1');
    doc.fontSize(9).font('Times-Bold').fillColor('#0F172A');
    doc.text('Category', 60, y + 6);
    doc.text('Selected Tools & Frameworks', 185, y + 6);
    doc.text('Technical Justification', 345, y + 6);

    y += 22;

    tools.forEach((t: any, idx: number) => {
      const itemsStr = Array.isArray(t.items) ? t.items.join(', ') : t.items;
      const justStr = t.justification || 'Standard academic toolchain.';

      doc.fontSize(8.5).font('Times-Roman');
      const hItems = doc.heightOfString(itemsStr, { width: 150 });
      const hJust = doc.heightOfString(justStr, { width: 185 });
      const rowHeight = Math.max(26, hItems + 12, hJust + 12);

      this.ensureSpace(doc, rowHeight);
      if (doc.y > y) y = doc.y;

      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(54, y, 487, rowHeight).fillAndStroke(bg, '#E2E8F0');

      doc.fontSize(8.5).font('Times-Bold').fillColor('#0F172A').text(t.category, 60, y + 6, { width: 120 });
      doc.font('Times-Roman').fillColor('#1E293B').text(itemsStr, 185, y + 6, { width: 150 });
      doc.text(justStr, 345, y + 6, { width: 185 });

      y += rowHeight;
    });

    doc.y = y + 10;
  }

  // ==========================================
  // SECTION 9: EXPECTED OUTCOME
  // ==========================================
  private static renderSection9ExpectedOutcome(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '9. EXPECTED OUTCOME', y);
    y += 24;

    const text = synopsis.sections11?.section9_expectedOutcome ||
      synopsis.expectedOutcome?.fullText ||
      `The successful execution of "${synopsis.projectTitle}" will deliver a reliable, fully documented system that accomplishes the established objectives. Key expected outcomes include:\n\n1. Functional Automation: Streamlining manual administrative steps and reducing transaction turnaround time by an estimated 40–60%.\n2. Data Integrity: Eliminating data redundancy and entry errors through schema normalization and automated validation.\n3. User Accessibility: Providing an intuitive, responsive interface accessible across standard web and mobile devices.\n4. Academic Fulfillment: Delivering a comprehensive IGNOU Project Report demonstrating practical mastery of the degree curriculum.`;

    doc.fontSize(9.5).font('Times-Roman').fillColor('#1E293B').text(text, 54, y, {
      align: 'justify',
      lineGap: 4,
      width: 487
    });

    doc.y += 20;
  }

  // ==========================================
  // SECTION 10: WORK PLAN / TIMELINE
  // ==========================================
  private static renderSection10WorkPlan(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    this.ensureSpace(doc, 220);
    let y = doc.y + 10;
    this.renderSectionHeading(doc, '10. WORK PLAN / TIMELINE', y);
    y += 24;

    doc.fontSize(9.5).font('Times-Italic').fillColor('#475569').text(
      'The proposed project work plan is scheduled across seven sequential academic phases:',
      54,
      y
    );
    y += 18;

    const workPlan = synopsis.sections11?.section10_workPlan || [
      { phase: 'Phase 1', duration: 'Weeks 1–2', activities: 'Topic Selection, Preliminary Survey & Requirement Analysis', deliverables: 'Project Synopsis Draft & Guide Approval' },
      { phase: 'Phase 2', duration: 'Weeks 3–4', activities: 'Literature Review & Theoretical Modeling', deliverables: 'Literature Review Document' },
      { phase: 'Phase 3', duration: 'Weeks 5–6', activities: 'System Architecture, DFD/UML & Database Design', deliverables: 'SRS Document & Schema Diagrams' },
      { phase: 'Phase 4', duration: 'Weeks 7–10', activities: 'Core Implementation, Coding & Integration', deliverables: 'Functional Alpha Application Build' },
      { phase: 'Phase 5', duration: 'Weeks 11–12', activities: 'Testing (Unit, Integration, System) & Verification', deliverables: 'Test Case Reports & Bug Fix Log' },
      { phase: 'Phase 6', duration: 'Weeks 13–14', activities: 'Documentation & Project Report Drafting', deliverables: 'Draft Project Dissertation Report' },
      { phase: 'Phase 7', duration: 'Weeks 15–16', activities: 'Final Verification, Plagiarism Check & Submission', deliverables: 'Bound Project Report for Viva-Voce' }
    ];

    // Table Header
    doc.rect(54, y, 487, 20).fillAndStroke('#F1F5F9', '#CBD5E1');
    doc.fontSize(8.5).font('Times-Bold').fillColor('#0F172A');
    doc.text('Phase', 60, y + 5);
    doc.text('Timeline', 115, y + 5);
    doc.text('Key Activities & Tasks', 185, y + 5);
    doc.text('Deliverables', 370, y + 5);

    y += 20;

    workPlan.forEach((p: any, idx: number) => {
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(54, y, 487, 22).fillAndStroke(bg, '#E2E8F0');

      doc.fontSize(8.5).font('Times-Bold').fillColor('#0F172A').text(p.phase, 60, y + 6);
      doc.font('Times-Roman').fillColor('#334155').text(p.duration, 115, y + 6);
      doc.font('Times-Roman').fillColor('#1E293B').text(p.activities, 185, y + 6, { width: 175 });
      doc.font('Times-Bold').fillColor('#0F172A').text(p.deliverables, 370, y + 6, { width: 165 });

      y += 22;
    });

    doc.y = y + 15;
  }

  // ==========================================
  // SECTION 11: REFERENCES / BIBLIOGRAPHY
  // ==========================================
  private static renderSection11References(doc: PDFKit.PDFDocument, synopsis: SynopsisData) {
    let y = 65;
    this.renderSectionHeading(doc, '11. REFERENCES / BIBLIOGRAPHY', y);
    y += 26;

    const refs = synopsis.sections11?.section11_references || (synopsis.references || []).map(r => r.citation) || [
      'Sommerville, I. (2016). Software Engineering (10th ed.). Pearson Education. ISBN: 978-0133943030.',
      'Pressman, R. S., & Maxim, B. R. (2014). Software Engineering: A Practitioner\'s Approach (8th ed.). McGraw-Hill Education.',
      'Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). Database System Concepts (7th ed.). McGraw-Hill Education.',
      'Elmasri, R., & Navathe, S. B. (2015). Fundamentals of Database Systems (7th ed.). Pearson.',
      'Indira Gandhi National Open University (IGNOU). (2024). Guidelines for Project Work: School of Computer and Information Sciences (SOCIS). New Delhi: IGNOU.',
      'OWASP Foundation. (2021). OWASP Top 10: The Ten Most Critical Web Application Security Risks. https://owasp.org/Top10/',
      'IEEE Computer Society. (2014). Guide to the Software Engineering Body of Knowledge (SWEBOK Guide V3.0). IEEE.'
    ];

    refs.forEach((refText: string, idx: number) => {
      this.ensureSpace(doc, 40);
      if (doc.y > y) y = doc.y;

      doc.fontSize(9.5).font('Times-Bold').fillColor('#0F172A').text(`[${idx + 1}]`, 54, y);
      doc.font('Times-Roman').fillColor('#1E293B').text(refText, 78, y, {
        align: 'justify',
        lineGap: 3.5,
        width: 463
      });
      y += doc.heightOfString(refText, { width: 463, lineGap: 3.5 }) + 8;
    });

    doc.y = y;
  }

  // ==========================================
  // HELPER RENDERING METHODS
  // ==========================================
  private static ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 40;
    if (doc.y + neededHeight > bottomLimit) {
      doc.addPage();
      doc.y = 65;
    }
  }

  private static renderPageHeader(doc: PDFKit.PDFDocument, title: string, y: number) {
    doc.fontSize(13).font('Times-Bold').fillColor('#0F172A').text(title, 54, y, {
      align: 'center',
      width: 487
    });
    doc.moveTo(54, y + 18).lineTo(541, y + 18).lineWidth(1).strokeColor('#0F172A').stroke();
  }

  private static renderSectionHeading(doc: PDFKit.PDFDocument, title: string, y: number) {
    doc.fontSize(11.5).font('Times-Bold').fillColor('#0F172A').text(title, 54, y);
    doc.moveTo(54, y + 15).lineTo(541, y + 15).lineWidth(0.75).strokeColor('#94A3B8').stroke();
  }
}
