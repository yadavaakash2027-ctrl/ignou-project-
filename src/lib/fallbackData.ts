import { Program, Subject, Topic } from '../types';

export const FALLBACK_PROGRAMS: Program[] = [
  {
    id: 'prog_bca',
    code: 'BCA',
    name: 'Bachelor of Computer Applications',
    level: 'Bachelor',
    durationYears: 3,
    projectCourseCodes: ['BCSP-064', 'BCS-053'],
    description: 'Undergraduate computer applications degree with final semester major software project and viva-voce.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_mca',
    code: 'MCA',
    name: 'Master of Computer Applications',
    level: 'Master',
    durationYears: 2,
    projectCourseCodes: ['MCSP-060', 'MCS-224'],
    description: 'Postgraduate computer application program focusing on advanced software engineering and research project.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_bcom',
    code: 'B.Com',
    name: 'Bachelor of Commerce',
    level: 'Bachelor',
    durationYears: 3,
    projectCourseCodes: ['BCOE-141', 'BCOE-143', 'ECO-03'],
    description: 'Undergraduate commerce degree examining commercial principles, business economics, and financial systems.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_mcom',
    code: 'M.Com',
    name: 'Master of Commerce',
    level: 'Master',
    durationYears: 2,
    projectCourseCodes: ['MCOP-001', 'MCO-021', 'MCO-003'],
    description: 'Postgraduate commerce program requiring in-depth research methodology and a comprehensive 150+ page dissertation/project.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_mba',
    code: 'MBA',
    name: 'Master of Business Administration',
    level: 'Master',
    durationYears: 2,
    projectCourseCodes: ['MS-100', 'MMPP-001', 'MS-28', 'MMPH-001'],
    description: 'Flagship management program requiring exhaustive empirical field work, organizational analysis, and strategic project report.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_pgdca',
    code: 'PGDCA',
    name: 'Post Graduate Diploma in Computer Applications',
    level: 'Diploma',
    durationYears: 1,
    projectCourseCodes: ['MCSP-040', 'MCS-201'],
    description: 'Specialized postgraduate diploma with practical application development and project work.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'prog_ba',
    code: 'BA/BAG',
    name: 'Bachelor of Arts (General / Honours)',
    level: 'Bachelor',
    durationYears: 3,
    projectCourseCodes: ['BECE-141', 'BPAE-141', 'BSOE-141'],
    description: 'Interdisciplinary humanities and social sciences program with research application in Economics, Public Administration, and Sociology.',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const FALLBACK_SUBJECTS: Subject[] = [
  {
    id: 'subj_mcop001',
    program: 'M.Com',
    courseCode: 'MCOP-001',
    subjectName: 'Project Work / Dissertation in Commerce',
    description: 'Comprehensive research project on Corporate Finance, Marketing Management, Banking Operations, or International Business.',
    creditCount: 6,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_mco021',
    program: 'M.Com',
    courseCode: 'MCO-021',
    subjectName: 'Managerial Economics & Market Research',
    description: 'Applied economic theories, econometric forecasting, and pricing strategy investigations for industrial and consumer markets.',
    creditCount: 4,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_bcoe141',
    program: 'B.Com',
    courseCode: 'BCOE-141',
    subjectName: 'Principles of Marketing & Consumer Analytics',
    description: 'Empirical survey project analyzing consumer behavior, digital marketing effectiveness, and supply chain logistics.',
    creditCount: 6,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_ms100',
    program: 'MBA',
    courseCode: 'MS-100',
    subjectName: 'Project Course in Management',
    description: 'Flagship MBA dissertation covering Human Resource Management, Strategic Financial Management, Operations Research, and Brand Equity.',
    creditCount: 6,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_mmpp001',
    program: 'MBA',
    courseCode: 'MMPP-001',
    subjectName: 'Project Work in Master of Business Administration',
    description: 'Revised syllabus MBA major research dissertation with extensive primary data collection, statistical hypothesis testing, and policy recommendations.',
    creditCount: 8,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_bcsp064',
    program: 'BCA',
    courseCode: 'BCSP-064',
    subjectName: 'BCA Major Project',
    description: 'Full-stack software application lifecycle project including SRS, ER Diagrams, DFDs, Database Schema, Implementation, Testing, and User Manual.',
    creditCount: 8,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_mcsp060',
    program: 'MCA',
    courseCode: 'MCSP-060',
    subjectName: 'MCA Major Project Work',
    description: 'Advanced distributed systems, cloud applications, AI/ML pipelines, or enterprise security management systems with rigorous architectural verification.',
    creditCount: 16,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_mcsp040',
    program: 'PGDCA',
    courseCode: 'MCSP-040',
    subjectName: 'PGDCA Project Course',
    description: 'Practical database-driven software design, web services, and user interface development report.',
    creditCount: 4,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'subj_bece141',
    program: 'BA/BAG',
    courseCode: 'BECE-141',
    subjectName: 'Applied Economics & Development Policy',
    description: 'Socio-economic field survey on rural microfinance, agricultural pricing, public distribution system, or urban informal labor.',
    creditCount: 6,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

export const FALLBACK_TOPICS: Topic[] = [
  {
    id: 'top_eco_01',
    subjectId: 'subj_mco021',
    courseCode: 'MCO-021',
    program: 'M.Com',
    title: 'Demand Analysis & Econometric Forecasting for Fast Moving Consumer Goods (FMCG)',
    description: 'Comprehensive study of consumer demand elasticity, predictive regression models, and supply chain inventory planning across urban and semi-urban retail clusters.',
    focusAreas: ['Price Elasticity', 'Demand Forecasting Models', 'Consumer Purchase Patterns', 'FMCG Market Structure'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_eco_02',
    subjectId: 'subj_mco021',
    courseCode: 'MCO-021',
    program: 'M.Com',
    title: 'Pricing Strategies of Tech Giants and Their Impact on Market Competition in India',
    description: 'In-depth analysis of predatory pricing, dynamic algorithmic pricing, platform economics, and antitrust regulatory oversight in digital marketplaces.',
    focusAreas: ['Dynamic Pricing', 'Digital Platform Competition', 'Antitrust Economics', 'Consumer Welfare'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_mcom_01',
    subjectId: 'subj_mcop001',
    courseCode: 'MCOP-001',
    program: 'M.Com',
    title: 'Working Capital Management and Liquidity Performance of Listed Indian Pharmaceutical Companies',
    description: 'Empirical financial research using Cash Conversion Cycle (CCC), ratio analysis, and regression modeling over a 5-year longitudinal dataset.',
    focusAreas: ['Cash Conversion Cycle', 'Liquidity vs Profitability', 'Receivables Management', 'Inventory Turnover'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_mcom_02',
    subjectId: 'subj_mcop001',
    courseCode: 'MCOP-001',
    program: 'M.Com',
    title: 'Digital Banking Adoption and Customer Perception of UPI and Neo-Banking Ecosystems in Tier-2 Indian Cities',
    description: 'Primary survey-based research investigating technology acceptance (TAM model), transaction security perceptions, and grievance redressal efficiency.',
    focusAreas: ['Technology Acceptance Model', 'UPI Transaction Volume', 'Cybersecurity Perceptions', 'Tier-2 Financial Inclusion'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_mba_01',
    subjectId: 'subj_ms100',
    courseCode: 'MS-100',
    program: 'MBA',
    title: 'Evaluating the Strategic Impact of Employee Engagement and Retention Frameworks in Indian ITES Sector',
    description: 'Exhaustive empirical study measuring psychological safety, hybrid work dynamics, employee attrition drivers, and organizational citizenship behaviors.',
    focusAreas: ['Hybrid Work Ergonomics', 'Attrition Root-Cause Analysis', 'Total Rewards Strategy', 'Work-Life Balance Indices'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_mba_02',
    subjectId: 'subj_ms100',
    courseCode: 'MS-100',
    program: 'MBA',
    title: 'Omnichannel Supply Chain Agility and Inventory Optimization in Quick-Commerce Enterprises',
    description: 'Quantitative investigation into micro-fulfillment dark store algorithms, demand spike forecasting, and last-mile route optimization.',
    focusAreas: ['Dark Store Layout', 'Last-Mile Unit Economics', 'Real-Time Inventory Auditing', 'Bullwhip Effect Mitigation'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_bca_01',
    subjectId: 'subj_bcsp064',
    courseCode: 'BCSP-064',
    program: 'BCA',
    title: 'Smart Healthcare Appointment and Tele-Consultation Management System with Real-Time Doctor Scheduling',
    description: 'Full-stack software engineering project with JWT authentication, role-based access control (Doctor, Patient, Admin), video room token generation, prescription PDF generation, and automated slot locking.',
    focusAreas: ['React & Node.js Architecture', 'Role-Based Access Control', 'Automated Slot Booking Engine', 'ER & DFD Diagrams'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_bca_02',
    subjectId: 'subj_bcsp064',
    courseCode: 'BCSP-064',
    program: 'BCA',
    title: 'Cloud-Enabled Inventory & Point of Sale (POS) Billing Management System for Multi-Outlet Retailers',
    description: 'Comprehensive software solution featuring barcode scanning, GST calculation, stock threshold alerts, sales reporting analytics, and offline-sync capabilities.',
    focusAreas: ['Inventory State Machine', 'Automated GST Invoice Generator', 'Multi-Store Database Design', 'Software Testing Suites'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_mca_01',
    subjectId: 'subj_mcsp060',
    courseCode: 'MCSP-060',
    program: 'MCA',
    title: 'Decentralized Academic Credential Verification and Student Portfolio Management System Using Distributed Ledgers',
    description: 'Architectural enterprise project with cryptographic certificate hashing, tamper-proof verification APIs, QR code authenticity validation, and high-throughput document verification pipelines.',
    focusAreas: ['Cryptographic Verification', 'Microservice Architecture', 'High-Concurreny API Gateway', 'Automated Verification Flow'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_pgdca_01',
    subjectId: 'subj_mcsp040',
    courseCode: 'MCSP-040',
    program: 'PGDCA',
    title: 'Automated Student Grievance Redressal and Ticket Tracking Portal for Open & Distance Learning Universities',
    description: 'Full lifecycle web system with priority SLA escalations, department-wise ticket assignment, real-time status notifications, and feedback rating analytics.',
    focusAreas: ['Ticket Escalation Engine', 'Relational Schema Design', 'Responsive UI Design', 'Security Validation'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'top_ba_01',
    subjectId: 'subj_bece141',
    courseCode: 'BECE-141',
    program: 'BA/BAG',
    title: 'An Evaluative Field Study on Rural Microfinance and Self-Help Group (SHG) Economic Empowerment in Rural India',
    description: 'Socio-economic research measuring income generation capacity, female labor participation rates, credit repayment behavior, and financial literacy among SHG members.',
    focusAreas: ['Self-Help Group Dynamics', 'Micro-Credit Delivery', 'Household Income Growth', 'Empirical Survey Methodology'],
    status: 'AVAILABLE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];
