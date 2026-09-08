import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storeStudentInInsForge } from './insforge';
import {
  Program,
  Subject,
  Topic,
  Student,
  ProjectRecord,
  GenerationJob,
  OrderRecord,
  DownloadLog,
  SystemStats,
  SessionRecord,
  ActivityLog,
  AdminAuditLog,
  DataRetentionSettings,
  StudentProfileData,
  SynopsisData,
  ChapterContent
} from '../src/types';

interface DatabaseSchema {
  programs: Program[];
  subjects: Subject[];
  topics: Topic[];
  students: Student[];
  passwords: Record<string, string>; // userId -> passwordHash/salt
  sessions: SessionRecord[];
  activityLogs: ActivityLog[];
  adminAuditLogs: AdminAuditLog[];
  projects: ProjectRecord[];
  synopses: SynopsisData[];
  jobs: GenerationJob[];
  orders: OrderRecord[];
  downloads: DownloadLog[];
  settings: {
    minPageCount: number;
    targetPageRange: string;
    duplicateThreshold: number;
    academicIntegrityNotice: string;
    directUpiId?: string;
    directUpiName?: string;
    paymentMode?: 'DIRECT_FREE' | 'DIRECT_UPI_MANUAL' | 'HYBRID';
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    retention: DataRetentionSettings;
  };
}

const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
export const DATA_DIR = process.env.DATA_DIR || (isServerless ? path.join('/tmp', 'ignou_data') : path.join(process.cwd(), 'data'));
export const DB_FILE = path.join(DATA_DIR, 'database.json');
export const STORAGE_DIR = path.join(DATA_DIR, 'generated_files');

// Ensure directories exist safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (dirErr) {
  console.warn('[DB] Notice: Directory creation fallback for serverless:', dirErr);
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_ignou_salt_2026').digest('hex');
}

function seedDatabase(): DatabaseSchema {
  const defaultAdminId = 'admin_01';
  const defaultStudentId = 'student_01';
  const nowIso = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const programs: Program[] = [
    {
      id: 'prog_bca',
      code: 'BCA',
      name: 'Bachelor of Computer Applications',
      level: 'Bachelor',
      durationYears: 3,
      projectCourseCodes: ['BCSP-064', 'BCSL-058'],
      description: 'Undergraduate computer applications degree with final semester major software project and viva-voce.',
      isActive: true,
      createdAt: nowIso
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
      createdAt: nowIso
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
      createdAt: nowIso
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
      createdAt: nowIso
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
      createdAt: nowIso
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
      createdAt: nowIso
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
      createdAt: nowIso
    }
  ];

  const subjects: Subject[] = [
    // M.Com / B.Com
    {
      id: 'subj_mcop001',
      program: 'M.Com',
      courseCode: 'MCOP-001',
      subjectName: 'Project Work / Dissertation in Commerce',
      description: 'Comprehensive research project on Corporate Finance, Marketing Management, Banking Operations, or International Business.',
      creditCount: 6,
      hasProjectComponent: true,
      activeStatus: true,
      createdAt: nowIso,
      updatedAt: nowIso
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
      createdAt: nowIso,
      updatedAt: nowIso
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
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // MBA
    {
      id: 'subj_ms100',
      program: 'MBA',
      courseCode: 'MS-100',
      subjectName: 'Project Course in Management',
      description: 'Flagship MBA dissertation covering Human Resource Management, Strategic Financial Management, Operations Research, and Brand Equity.',
      creditCount: 6,
      hasProjectComponent: true,
      activeStatus: true,
      createdAt: nowIso,
      updatedAt: nowIso
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
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // BCA / MCA
    {
      id: 'subj_bcsp064',
      program: 'BCA',
      courseCode: 'BCSP-064',
      subjectName: 'BCA Major Project',
      description: 'Full-stack software application lifecycle project including SRS, ER Diagrams, DFDs, Database Schema, Implementation, Testing, and User Manual.',
      creditCount: 8,
      hasProjectComponent: true,
      activeStatus: true,
      createdAt: nowIso,
      updatedAt: nowIso
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
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // PGDCA
    {
      id: 'subj_mcsp040',
      program: 'PGDCA',
      courseCode: 'MCSP-040',
      subjectName: 'PGDCA Project Course',
      description: 'Practical database-driven software design, web services, and user interface development report.',
      creditCount: 4,
      hasProjectComponent: true,
      activeStatus: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // BA / BAG
    {
      id: 'subj_bece141',
      program: 'BA/BAG',
      courseCode: 'BECE-141',
      subjectName: 'Applied Economics & Development Policy',
      description: 'Socio-economic field survey on rural microfinance, agricultural pricing, public distribution system, or urban informal labor.',
      creditCount: 6,
      hasProjectComponent: true,
      activeStatus: true,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  const topics: Topic[] = [
    // Economics / M.Com (MCOP-001 & MCO-021)
    {
      id: 'top_eco_01',
      subjectId: 'subj_mco021',
      courseCode: 'MCO-021',
      program: 'M.Com',
      title: 'Demand Analysis & Econometric Forecasting for Fast Moving Consumer Goods (FMCG)',
      description: 'Comprehensive study of consumer demand elasticity, predictive regression models, and supply chain inventory planning across urban and semi-urban retail clusters.',
      focusAreas: ['Price Elasticity', 'Demand Forecasting Models', 'Consumer Purchase Patterns', 'FMCG Market Structure'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
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
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_eco_03',
      subjectId: 'subj_mco021',
      courseCode: 'MCO-021',
      program: 'M.Com',
      title: 'Impact of Inflation on Consumer Purchasing Power and Small & Medium Enterprises (SMEs)',
      description: 'Empirical investigation into wholesale vs consumer inflation transmission, cost-push margin compression, and SME coping mechanisms during macroeconomic volatility.',
      focusAreas: ['Inflationary Pressures', 'Household Purchasing Power', 'SME Profitability', 'Input Cost Volatility'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_eco_04',
      subjectId: 'subj_mco021',
      courseCode: 'MCO-021',
      program: 'M.Com',
      title: 'Market Structure Analysis: Oligopolistic Competition and Tariff Wars in Indian Telecom',
      description: 'Analysis of Herfindahl-Hirschman Index (HHI), ARPU trends, capital expenditure in 5G rollout, and regulatory policy shifts in the Indian telecommunications landscape.',
      focusAreas: ['Oligopolistic Pricing', 'ARPU Dynamics', 'Market Concentration Index', '5G Infrastructure CAPEX'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_eco_05',
      subjectId: 'subj_mco021',
      courseCode: 'MCO-021',
      program: 'M.Com',
      title: 'Cost-Volume-Profit Analysis and Break-Even Optimization for Light Manufacturing Units',
      description: 'Quantitative case study evaluating marginal costing techniques, fixed vs variable cost segregation, and safety margin maximization for manufacturing startups.',
      focusAreas: ['Break-Even Analysis', 'Contribution Margin', 'Operating Leverage', 'Cost Behavior Optimization'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_eco_06',
      subjectId: 'subj_mco021',
      courseCode: 'MCO-021',
      program: 'M.Com',
      title: 'Economies of Scale and Long-Run Average Cost Curve Dynamics in E-Commerce Platforms',
      description: 'Theoretical and empirical evaluation of fulfillment center automation, customer acquisition CAC reduction, and multi-sided platform scale advantages.',
      focusAreas: ['Long-Run Cost Curves', 'Network Effects', 'Fulfillment Automation', 'Customer Acquisition Cost'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // M.Com MCOP-001
    {
      id: 'top_mcom_01',
      subjectId: 'subj_mcop001',
      courseCode: 'MCOP-001',
      program: 'M.Com',
      title: 'Working Capital Management and Liquidity Performance of Listed Indian Pharmaceutical Companies',
      description: 'Empirical financial research using Cash Conversion Cycle (CCC), ratio analysis, and regression modeling over a 5-year longitudinal dataset.',
      focusAreas: ['Cash Conversion Cycle', 'Liquidity vs Profitability', 'Receivables Management', 'Inventory Turnover'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_mcom_02',
      subjectId: 'subj_mcop001',
      courseCode: 'MCOP-001',
      program: 'M.Com',
      title: 'Non-Performing Assets (NPAs) Resolution and Credit Risk Mitigation in Indian Public Sector Banks',
      description: 'Comprehensive analysis of Insolvency and Bankruptcy Code (IBC) impact, SARFAESI proceedings, and restructured asset recovery metrics.',
      focusAreas: ['Gross & Net NPAs', 'IBC Resolution Timeline', 'Credit Appraisal Framework', 'Provisioning Coverage'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // MBA MS-100 / MMPP-001
    {
      id: 'top_mba_01',
      subjectId: 'subj_mmpp001',
      courseCode: 'MMPP-001',
      program: 'MBA',
      title: 'Impact of Hybrid Work Models on Employee Engagement, Productivity, and Attrition in IT Sector',
      description: 'Extensive empirical study utilizing Job Demands-Resources (JD-R) model, Likert questionnaire across 150 IT professionals, and structural equation insights.',
      focusAreas: ['Employee Engagement Index', 'Organizational Commitment', 'Burnout & Work-Life Balance', 'Retention Strategies'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_mba_02',
      subjectId: 'subj_mmpp001',
      courseCode: 'MMPP-001',
      program: 'MBA',
      title: 'Digital Banking Adoption and Customer Experience (CX) Benchmarking in Private vs Public Banks',
      description: 'TAM (Technology Acceptance Model) assessment analyzing perceived ease of use, security perceptions, and Net Promoter Scores (NPS).',
      focusAreas: ['Technology Acceptance Model', 'Omnichannel CX', 'Mobile Banking Security', 'Customer Retention Rate'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_mba_03',
      subjectId: 'subj_ms100',
      courseCode: 'MS-100',
      program: 'MBA',
      title: 'Green Supply Chain Management Practices and Sustainable Competitive Advantage in Auto Sector',
      description: 'Evaluation of reverse logistics, eco-friendly procurement, carbon footprint audits, and ISO 14001 compliance among Tier-1 automotive suppliers.',
      focusAreas: ['Reverse Logistics', 'Sustainable Procurement', 'Carbon Auditing', 'Circular Economy Integration'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // BCA BCSP-064
    {
      id: 'top_bca_01',
      subjectId: 'subj_bcsp064',
      courseCode: 'BCSP-064',
      program: 'BCA',
      title: 'Decentralized Academic Credential Verification and Student Record Management System',
      description: 'Full software project document with complete SRS, architectural design, cryptographic document verification hash engine, and role-based access control.',
      focusAreas: ['Software Requirements Specification', 'ER & DFD Diagrams', 'Relational DB Schema', 'Security & Verification API'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'top_bca_02',
      subjectId: 'subj_bcsp064',
      courseCode: 'BCSP-064',
      program: 'BCA',
      title: 'Intelligent Inventory and Point-of-Sale ERP for Multi-Branch Retail Chains',
      description: 'End-to-end software engineering project report with automated reorder level triggers, GST billing module, and real-time synchronization.',
      focusAreas: ['System Architecture', 'UML Class Modeling', 'Relational Normalization (3NF)', 'Test Case Matrix'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // MCA MCSP-060
    {
      id: 'top_mca_01',
      subjectId: 'subj_mcsp060',
      courseCode: 'MCSP-060',
      program: 'MCA',
      title: 'Distributed Microservices Architecture for High-Concurrency Healthcare Telemedicine Platform',
      description: 'Advanced postgraduate software dissertation covering Dockerized microservices, Kafka event bus, HIPAA-compliant encryption, and automated load balancing.',
      focusAreas: ['Microservice Decomposition', 'Event-Driven Architecture', 'HL7/HIPAA Data Security', 'Performance Benchmarking'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    // BA / BAG
    {
      id: 'top_ba_01',
      subjectId: 'subj_bece141',
      courseCode: 'BECE-141',
      program: 'BA/BAG',
      title: 'Effectiveness of Microfinance Self-Help Groups (SHGs) in Women Empowerment & Rural Livelihoods',
      description: 'Empirical socio-economic field assessment evaluating income generation, decision-making autonomy, and financial literacy among rural SHG members.',
      focusAreas: ['SHG Credit Disbursement', 'Women Empowerment Index', 'Income Diversification', 'Rural Financial Inclusion'],
      status: 'AVAILABLE',
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  const adminPassword = process.env.ADMIN_PASSWORD || '8340650759';

  const students: Student[] = [
    {
      id: 'admin_root',
      name: 'Aakash Yadav (Admin)',
      email: 'aakashyadav2024@gmail.com',
      enrollmentNumber: 'ADMIN-2026-HQ',
      mobileNumber: '+91 8340650759',
      program: 'MBA',
      studyCenterCode: 'SC-0700',
      role: 'admin',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      totalLoginCount: 12,
      totalSessionCount: 12,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'admin_alt',
      name: 'Academic Administrator',
      email: 'admin@ignouprojecthub.in',
      enrollmentNumber: 'ADMIN-2026-ALT',
      mobileNumber: '+91 9876543210',
      program: 'MCA',
      studyCenterCode: 'SC-0700',
      role: 'admin',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      totalLoginCount: 5,
      totalSessionCount: 5,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-001',
      name: 'Aarav Kumar',
      email: 'aarav.kumar.demo@gmail.com',
      enrollmentNumber: '2601000001',
      mobileNumber: '9000000001',
      program: 'M.Com',
      courseYear: '2nd Year',
      studyCenterCode: 'SC-0713',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: oneHourAgo,
      lastLogoutAt: new Date(Date.now() - 1800000).toISOString(),
      lastActiveAt: new Date(Date.now() - 300000).toISOString(),
      totalLoginCount: 6,
      totalSessionCount: 6,
      createdAt: '2026-08-05T14:30:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-002',
      name: 'Rohan Sharma',
      email: 'rohan.sharma.demo@gmail.com',
      enrollmentNumber: '2601000002',
      mobileNumber: '9000000002',
      program: 'MBA',
      courseYear: 'Final Year',
      studyCenterCode: 'SC-0700',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - 120000).toISOString(),
      lastActiveAt: new Date(Date.now() - 60000).toISOString(),
      totalLoginCount: 9,
      totalSessionCount: 9,
      createdAt: '2026-08-06T10:15:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-003',
      name: 'Aditya Verma',
      email: 'aditya.verma.demo@gmail.com',
      enrollmentNumber: '2601000003',
      mobileNumber: '9000000003',
      program: 'BCA',
      courseYear: '3rd Year',
      studyCenterCode: 'SC-1001',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: new Date(Date.now() - 7200000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
      totalLoginCount: 4,
      totalSessionCount: 4,
      createdAt: '2026-08-07T09:00:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-004',
      name: 'Ananya Singh',
      email: 'ananya.singh.demo@gmail.com',
      enrollmentNumber: '2601000004',
      mobileNumber: '9000000004',
      program: 'MCA',
      courseYear: 'Final Year',
      studyCenterCode: 'SC-0504',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 82800000).toISOString(),
      lastActiveAt: new Date(Date.now() - 82800000).toISOString(),
      totalLoginCount: 5,
      totalSessionCount: 5,
      createdAt: '2026-08-08T11:20:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-005',
      name: 'Priya Kumari',
      email: 'priya.kumari.demo@gmail.com',
      enrollmentNumber: '2601000005',
      mobileNumber: '9000000005',
      program: 'PGDCA',
      courseYear: '1st Year',
      studyCenterCode: 'SC-1602',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: false,
      phoneVerified: false,
      lastLoginAt: new Date(Date.now() - 172800000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 171000000).toISOString(),
      lastActiveAt: new Date(Date.now() - 171000000).toISOString(),
      totalLoginCount: 2,
      totalSessionCount: 2,
      createdAt: '2026-08-09T16:45:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-006',
      name: 'Rahul Gupta',
      email: 'rahul.gupta.demo@gmail.com',
      enrollmentNumber: '2601000006',
      mobileNumber: '9000000006',
      program: 'BA/BAG',
      courseYear: '3rd Year',
      studyCenterCode: 'SC-2801',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - 43200000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 39600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 39600000).toISOString(),
      totalLoginCount: 7,
      totalSessionCount: 7,
      createdAt: '2026-08-10T12:10:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-007',
      name: 'Neha Yadav',
      email: 'neha.yadav.demo@gmail.com',
      enrollmentNumber: '2601000007',
      mobileNumber: '9000000007',
      program: 'M.Com',
      courseYear: '1st Year',
      studyCenterCode: 'SC-0902',
      role: 'student',
      accountStatus: 'DISABLED',
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: new Date(Date.now() - 259200000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 259200000).toISOString(),
      lastActiveAt: new Date(Date.now() - 259200000).toISOString(),
      totalLoginCount: 3,
      totalSessionCount: 3,
      createdAt: '2026-08-11T08:30:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-008',
      name: 'Vivek Kumar',
      email: 'vivek.kumar.demo@gmail.com',
      enrollmentNumber: '2601000008',
      mobileNumber: '9000000008',
      program: 'MBA',
      courseYear: '2nd Year',
      studyCenterCode: 'SC-0103',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - 14400000).toISOString(),
      lastLogoutAt: new Date(Date.now() - 10800000).toISOString(),
      lastActiveAt: new Date(Date.now() - 10800000).toISOString(),
      totalLoginCount: 8,
      totalSessionCount: 8,
      createdAt: '2026-08-12T15:00:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-009',
      name: 'Sneha Singh',
      email: 'sneha.singh.demo@gmail.com',
      enrollmentNumber: '2601000009',
      mobileNumber: '9000000009',
      program: 'BCA',
      courseYear: '2nd Year',
      studyCenterCode: 'SC-1402',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 900000).toISOString(),
      totalLoginCount: 4,
      totalSessionCount: 4,
      createdAt: '2026-08-13T10:40:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'DEMO-STU-010',
      name: 'Aman Raj',
      email: 'aman.raj.demo@gmail.com',
      enrollmentNumber: '2601000010',
      mobileNumber: '9000000010',
      program: 'MCA',
      courseYear: 'Final Year',
      studyCenterCode: 'SC-2501',
      role: 'student',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - 600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 180000).toISOString(),
      totalLoginCount: 11,
      totalSessionCount: 11,
      createdAt: '2026-08-14T09:15:00.000Z',
      updatedAt: nowIso
    }
  ];

  const defaultStudentPassHash = hashPassword('Student@123');
  const passwords: Record<string, string> = {
    [defaultAdminId]: hashPassword(adminPassword),
    'DEMO-STU-001': defaultStudentPassHash,
    'DEMO-STU-002': defaultStudentPassHash,
    'DEMO-STU-003': defaultStudentPassHash,
    'DEMO-STU-004': defaultStudentPassHash,
    'DEMO-STU-005': defaultStudentPassHash,
    'DEMO-STU-006': defaultStudentPassHash,
    'DEMO-STU-007': defaultStudentPassHash,
    'DEMO-STU-008': defaultStudentPassHash,
    'DEMO-STU-009': defaultStudentPassHash,
    'DEMO-STU-010': defaultStudentPassHash
  };

  const initialSessions: SessionRecord[] = [
    {
      sessionId: 'sess_stu01_01',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      loginAt: oneHourAgo,
      logoutAt: new Date(Date.now() - 1800000).toISOString(),
      lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
      sessionDurationSeconds: 1800,
      status: 'LOGGED_OUT',
      deviceType: 'Desktop',
      browser: 'Chrome 124.0',
      operatingSystem: 'Windows 11',
      ipAddress: '103.212.45.18',
      country: 'India',
      createdAt: oneHourAgo
    },
    {
      sessionId: 'sess_stu02_01',
      studentId: 'DEMO-STU-002',
      studentName: 'Rohan Sharma',
      loginAt: new Date(Date.now() - 120000).toISOString(),
      lastActiveAt: new Date(Date.now() - 60000).toISOString(),
      status: 'ACTIVE',
      deviceType: 'Desktop',
      browser: 'Safari 17.4',
      operatingSystem: 'macOS',
      ipAddress: '122.161.88.92',
      country: 'India',
      createdAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      sessionId: 'sess_stu03_01',
      studentId: 'DEMO-STU-003',
      studentName: 'Aditya Verma',
      loginAt: new Date(Date.now() - 7200000).toISOString(),
      logoutAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
      sessionDurationSeconds: 3600,
      status: 'LOGGED_OUT',
      deviceType: 'Mobile',
      browser: 'Chrome Mobile 123.0',
      operatingSystem: 'Android 14',
      ipAddress: '157.34.192.40',
      country: 'India',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      sessionId: 'sess_stu09_01',
      studentId: 'DEMO-STU-009',
      studentName: 'Sneha Singh',
      loginAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 900000).toISOString(),
      status: 'ACTIVE',
      deviceType: 'Desktop',
      browser: 'Firefox 125.0',
      operatingSystem: 'Linux',
      ipAddress: '117.205.12.83',
      country: 'India',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      sessionId: 'sess_stu10_01',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      loginAt: new Date(Date.now() - 600000).toISOString(),
      lastActiveAt: new Date(Date.now() - 180000).toISOString(),
      status: 'ACTIVE',
      deviceType: 'Desktop',
      browser: 'Microsoft Edge 124.0',
      operatingSystem: 'Windows 11',
      ipAddress: '182.73.24.110',
      country: 'India',
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ];

  const initialActivityLogs: ActivityLog[] = [
    {
      activityId: 'act_seed_01',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      eventType: 'PROFILE_UPDATED',
      description: 'Candidate profile established for M.Com curriculum with Study Center SC-0713.',
      timestamp: '2026-08-05T14:30:00.000Z'
    },
    {
      activityId: 'act_seed_02',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      eventType: 'PAYMENT_VERIFIED',
      description: 'Order ord_mcom_01 confirmed via Razorpay for MCOP-001 (₹999).',
      timestamp: '2026-08-05T15:00:00.000Z',
      orderId: 'ord_mcom_01',
      projectId: 'proj_mcom_01'
    },
    {
      activityId: 'act_seed_03',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      eventType: 'DOWNLOAD_PDF',
      description: 'Official 158-page PDF Project Report successfully downloaded.',
      timestamp: '2026-08-05T15:20:00.000Z',
      projectId: 'proj_mcom_01'
    },
    {
      activityId: 'act_seed_04',
      studentId: 'DEMO-STU-002',
      studentName: 'Rohan Sharma',
      eventType: 'PAYMENT_VERIFIED',
      description: 'Order ord_mba_01 confirmed via Razorpay for MMPP-001 (₹999).',
      timestamp: '2026-08-06T10:30:00.000Z',
      orderId: 'ord_mba_01',
      projectId: 'proj_mba_01'
    },
    {
      activityId: 'act_seed_05',
      studentId: 'DEMO-STU-002',
      studentName: 'Rohan Sharma',
      eventType: 'LOGIN',
      description: 'Active session initialized from macOS Safari.',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      sessionId: 'sess_stu02_01'
    },
    {
      activityId: 'act_seed_06',
      studentId: 'DEMO-STU-003',
      studentName: 'Aditya Verma',
      eventType: 'DOWNLOAD_DOCX',
      description: 'Editable Word DOCX format downloaded for BCA BCSP-064 dissertation.',
      timestamp: '2026-08-07T10:00:00.000Z',
      projectId: 'proj_bca_01'
    },
    {
      activityId: 'act_seed_07',
      studentId: 'DEMO-STU-007',
      studentName: 'Neha Yadav',
      eventType: 'ACCOUNT_STATUS_CHANGED',
      description: 'Account status set to DISABLED by Chief Academic Administrator.',
      timestamp: '2026-08-11T12:00:00.000Z'
    },
    {
      activityId: 'act_seed_08',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      eventType: 'PROJECT_GENERATION_COMPLETED',
      description: '162-page MCA Dissertation (MCSP-060) generated with 100% chapter validation.',
      timestamp: '2026-08-14T09:45:00.000Z',
      projectId: 'proj_mca_02'
    }
  ];

  const initialAdminAuditLogs: AdminAuditLog[] = [
    {
      auditId: 'audit_01',
      adminId: defaultAdminId,
      adminName: 'Chief Academic Administrator',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'SYSTEM',
      metadata: { version: '2026.2.0', environment: 'production', totalPrograms: 7 },
      timestamp: '2026-08-01T10:00:00.000Z'
    },
    {
      auditId: 'audit_02',
      adminId: defaultAdminId,
      adminName: 'Chief Academic Administrator',
      action: 'ADD_TOPIC',
      targetType: 'SYSTEM',
      metadata: { courseCode: 'MCOP-001', program: 'M.Com', title: 'Analysis of Working Capital Management' },
      timestamp: '2026-08-02T11:00:00.000Z'
    },
    {
      auditId: 'audit_03',
      adminId: defaultAdminId,
      adminName: 'Chief Academic Administrator',
      action: 'DISABLE_STUDENT',
      studentId: 'DEMO-STU-007',
      studentName: 'Neha Yadav',
      targetType: 'STUDENT',
      targetId: 'DEMO-STU-007',
      metadata: { reason: 'Pending verification of study center records' },
      timestamp: '2026-08-11T12:00:00.000Z'
    }
  ];

  const initialProjects: ProjectRecord[] = [
    {
      projectId: 'proj_mcom_01',
      studentId: 'DEMO-STU-001',
      topicId: 'top_01',
      topicTitle: 'Analysis of Working Capital Management & Liquidity Ratios in Indian FMCG Majors (ITC & HUL)',
      topicDescription: 'Empirical examination of liquidity matrices, cash conversion cycles and working capital efficiencies across top Indian consumer goods conglomerates.',
      focusAreas: ['Ratio Analysis', 'Liquidity Management', 'Empirical Modeling'],
      subjectId: 'subj_mcop_001',
      subjectName: 'Project Work in Commerce',
      program: 'M.Com',
      courseCode: 'MCOP-001',
      studentName: 'Aarav Kumar',
      enrollmentNumber: '2601000001',
      studyCenterCode: 'SC-0713',
      guideName: 'Dr. S. K. Mukherjee, Associate Professor',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 158,
      wordCount: 38400,
      pdfUrl: '/api/projects/proj_mcom_01/download/pdf',
      docxUrl: '/api/projects/proj_mcom_01/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_mcom_01',
      createdAt: '2026-08-05T14:40:00.000Z',
      updatedAt: '2026-08-05T15:10:00.000Z'
    },
    {
      projectId: 'proj_mba_01',
      studentId: 'DEMO-STU-002',
      topicId: 'top_02',
      topicTitle: 'Impact of Sustainable Supply Chain Practices on Brand Equity & Customer Loyalty in E-Commerce',
      topicDescription: 'Investigation into circular economy practices, green reverse logistics, and customer retention metrics among Indian e-commerce platforms.',
      focusAreas: ['Green Logistics', 'Brand Equity', 'Customer Retention'],
      subjectId: 'subj_mmpp_001',
      subjectName: 'Project Work in Management',
      program: 'MBA',
      courseCode: 'MMPP-001',
      studentName: 'Rohan Sharma',
      enrollmentNumber: '2601000002',
      studyCenterCode: 'SC-0700',
      guideName: 'Prof. R. C. Agrawal, Department of Management Studies',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 164,
      wordCount: 41200,
      pdfUrl: '/api/projects/proj_mba_01/download/pdf',
      docxUrl: '/api/projects/proj_mba_01/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_mba_01',
      createdAt: '2026-08-06T10:20:00.000Z',
      updatedAt: '2026-08-06T10:45:00.000Z'
    },
    {
      projectId: 'proj_bca_01',
      studentId: 'DEMO-STU-003',
      topicId: 'top_03',
      topicTitle: 'Cloud-Native Real-Time Academic Resource Management System with Role-Based Access Control',
      topicDescription: 'Full-stack distributed application design with microservices architecture, JWT authentication, and automated academic schedule orchestration.',
      focusAreas: ['Microservices', 'RBAC Security', 'PostgreSQL Schema'],
      subjectId: 'subj_bcsp_064',
      subjectName: 'BCA Project Work',
      program: 'BCA',
      courseCode: 'BCSP-064',
      studentName: 'Aditya Verma',
      enrollmentNumber: '2601000003',
      studyCenterCode: 'SC-1001',
      guideName: 'Er. Sandeep Joshi, M.Tech (CS)',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 152,
      wordCount: 36800,
      pdfUrl: '/api/projects/proj_bca_01/download/pdf',
      docxUrl: '/api/projects/proj_bca_01/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_bca_01',
      createdAt: '2026-08-07T09:15:00.000Z',
      updatedAt: '2026-08-07T09:40:00.000Z'
    },
    {
      projectId: 'proj_mca_01',
      studentId: 'DEMO-STU-004',
      topicId: 'top_04',
      topicTitle: 'Enterprise AI-Driven Predictive Maintenance & Anomaly Detection Framework Using Deep Learning',
      topicDescription: 'Time-series sensor telemetry anomaly detection pipeline utilizing LSTM autoencoders and edge computing node synchronizers.',
      focusAreas: ['Deep Learning', 'Anomaly Detection', 'Time-Series Analysis'],
      subjectId: 'subj_mcsp_060',
      subjectName: 'MCA Project Work',
      program: 'MCA',
      courseCode: 'MCSP-060',
      studentName: 'Ananya Singh',
      enrollmentNumber: '2601000004',
      studyCenterCode: 'SC-0504',
      guideName: 'Dr. Manoj Trivedi, Senior Faculty Computer Science',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 168,
      wordCount: 42500,
      pdfUrl: '/api/projects/proj_mca_01/download/pdf',
      docxUrl: '/api/projects/proj_mca_01/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_mca_01',
      createdAt: '2026-08-08T11:30:00.000Z',
      updatedAt: '2026-08-08T11:55:00.000Z'
    },
    {
      projectId: 'proj_bag_01',
      studentId: 'DEMO-STU-006',
      topicId: 'top_06',
      topicTitle: 'Effectiveness of Microfinance Self-Help Groups (SHGs) in Women Empowerment & Rural Livelihoods',
      topicDescription: 'Field study measuring economic autonomy, household decision-making power, and credit repayment habits among rural SHG members.',
      focusAreas: ['Rural Economics', 'Micro-credit', 'Socio-economic Indicators'],
      subjectId: 'subj_bece_141',
      subjectName: 'Economics Project Work',
      program: 'BA/BAG',
      courseCode: 'BECE-141',
      studentName: 'Rahul Gupta',
      enrollmentNumber: '2601000006',
      studyCenterCode: 'SC-2801',
      guideName: 'Dr. Debashis Roy, Dept. of Economics',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 155,
      wordCount: 37200,
      pdfUrl: '/api/projects/proj_bag_01/download/pdf',
      docxUrl: '/api/projects/proj_bag_01/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_bag_01',
      createdAt: '2026-08-10T12:20:00.000Z',
      updatedAt: '2026-08-10T12:45:00.000Z'
    },
    {
      projectId: 'proj_mcom_02',
      studentId: 'DEMO-STU-008',
      topicId: 'top_01',
      topicTitle: 'Comparative Financial Statement & Profitability Assessment of Public vs Private Sector Banks',
      topicDescription: 'Longitudinal comparison of CAMEL rating metrics, non-performing assets (NPAs), and net interest margins across selected Indian commercial banks.',
      focusAreas: ['CAMEL Analysis', 'NPA Recovery', 'Banking Efficiency'],
      subjectId: 'subj_mcop_001',
      subjectName: 'Project Work in Commerce',
      program: 'M.Com',
      courseCode: 'MCOP-001',
      studentName: 'Vivek Kumar',
      enrollmentNumber: '2601000008',
      studyCenterCode: 'SC-0103',
      guideName: 'Dr. G. V. Rao, Dept. of Commerce',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 160,
      wordCount: 39500,
      pdfUrl: '/api/projects/proj_mcom_02/download/pdf',
      docxUrl: '/api/projects/proj_mcom_02/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_mcom_08',
      createdAt: '2026-08-12T15:10:00.000Z',
      updatedAt: '2026-08-12T15:35:00.000Z'
    },
    {
      projectId: 'proj_bca_02',
      studentId: 'DEMO-STU-009',
      topicId: 'top_03',
      topicTitle: 'Web-Based Hospital OPD Appointment Scheduling & Medical Records Portal',
      topicDescription: 'Interactive patient consultation booking and digitized electronic prescription portal with SMS gateway integrations.',
      focusAreas: ['Hospital Workflow', 'Queue Management', 'REST APIs'],
      subjectId: 'subj_bcsp_064',
      subjectName: 'BCA Project Work',
      program: 'BCA',
      courseCode: 'BCSP-064',
      studentName: 'Sneha Singh',
      enrollmentNumber: '2601000009',
      studyCenterCode: 'SC-1402',
      guideName: 'Er. Paul Varghese, MCA',
      status: 'GENERATING',
      paymentStatus: 'PAID',
      pageCount: 150,
      wordCount: 34000,
      pdfUrl: '/api/projects/proj_bca_02/download/pdf',
      docxUrl: '/api/projects/proj_bca_02/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_bca_09',
      createdAt: '2026-08-13T10:50:00.000Z',
      updatedAt: nowIso
    },
    {
      projectId: 'proj_mca_02',
      studentId: 'DEMO-STU-010',
      topicId: 'top_04',
      topicTitle: 'Decentralized Electronic Health Record (EHR) Auditing & Consent Management System',
      topicDescription: 'Cryptographic data integrity verification and fine-grained patient consent lifecycle management implementation.',
      focusAreas: ['Zero Knowledge Proofs', 'Smart Contracts', 'HIPAA Auditing'],
      subjectId: 'subj_mcsp_060',
      subjectName: 'MCA Project Work',
      program: 'MCA',
      courseCode: 'MCSP-060',
      studentName: 'Aman Raj',
      enrollmentNumber: '2601000010',
      studyCenterCode: 'SC-2501',
      guideName: 'Prof. K. R. Venkatraman, Dept. of Computer Applications',
      status: 'READY',
      paymentStatus: 'PAID',
      pageCount: 162,
      wordCount: 40800,
      pdfUrl: '/api/projects/proj_mca_02/download/pdf',
      docxUrl: '/api/projects/proj_mca_02/download/docx',
      hasSynopsis: true,
      price: 999,
      generationId: 'job_mca_10',
      createdAt: '2026-08-14T09:20:00.000Z',
      updatedAt: '2026-08-14T09:45:00.000Z'
    }
  ];

  const initialJobs: GenerationJob[] = [
    {
      generationId: 'job_bca_09',
      projectId: 'proj_bca_02',
      studentId: 'DEMO-STU-009',
      studentName: 'Sneha Singh',
      topicTitle: 'Web-Based Hospital OPD Appointment Scheduling & Medical Records Portal',
      courseCode: 'BCSP-064',
      currentChapter: 3,
      totalChapters: 6,
      currentPart: 'System Architecture & Database Design',
      status: 'GENERATING',
      progress: 55,
      logs: [
        { timestamp: '2026-08-13T10:50:00.000Z', step: 'INITIALIZATION', message: 'Allocated verified topic and began Chapter 1 draft.' },
        { timestamp: '2026-08-13T10:52:00.000Z', step: 'CHAPTER_1', message: 'Introduction and problem statement generated.' },
        { timestamp: '2026-08-13T10:54:00.000Z', step: 'CHAPTER_2', message: 'Literature review & comparative metrics compiled.' }
      ],
      createdAt: '2026-08-13T10:50:00.000Z',
      updatedAt: nowIso
    },
    {
      generationId: 'job_mca_10',
      projectId: 'proj_mca_02',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      topicTitle: 'Decentralized Electronic Health Record (EHR) Auditing & Consent Management System',
      courseCode: 'MCSP-060',
      currentChapter: 6,
      totalChapters: 6,
      currentPart: 'Complete 162-Page Compilation',
      status: 'READY',
      progress: 100,
      logs: [
        { timestamp: '2026-08-14T09:20:00.000Z', step: 'INITIALIZATION', message: 'Generation started.' },
        { timestamp: '2026-08-14T09:45:00.000Z', step: 'COMPLETED', message: 'PDF and DOCX packaged with academic certificates.' }
      ],
      createdAt: '2026-08-14T09:20:00.000Z',
      updatedAt: '2026-08-14T09:45:00.000Z'
    }
  ];

  const initialOrders: OrderRecord[] = [
    {
      orderId: 'ord_mcom_01',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      enrollmentNumber: '2601000001',
      email: 'aarav.kumar.demo@gmail.com',
      projectId: 'proj_mcom_01',
      topicTitle: 'Analysis of Working Capital Management & Liquidity Ratios in Indian FMCG Majors (ITC & HUL)',
      courseCode: 'MCOP-001',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_MCOM_001',
      razorpayPaymentId: 'pay_RZP_MCOM_001_TXN',
      createdAt: '2026-08-05T14:45:00.000Z',
      updatedAt: '2026-08-05T14:50:00.000Z'
    },
    {
      orderId: 'ord_mba_01',
      studentId: 'DEMO-STU-002',
      studentName: 'Rohan Sharma',
      enrollmentNumber: '2601000002',
      email: 'rohan.sharma.demo@gmail.com',
      projectId: 'proj_mba_01',
      topicTitle: 'Impact of Sustainable Supply Chain Practices on Brand Equity & Customer Loyalty in E-Commerce',
      courseCode: 'MMPP-001',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_MBA_001',
      razorpayPaymentId: 'pay_RZP_MBA_001_TXN',
      createdAt: '2026-08-06T10:25:00.000Z',
      updatedAt: '2026-08-06T10:30:00.000Z'
    },
    {
      orderId: 'ord_bca_01',
      studentId: 'DEMO-STU-003',
      studentName: 'Aditya Verma',
      enrollmentNumber: '2601000003',
      email: 'aditya.verma.demo@gmail.com',
      projectId: 'proj_bca_01',
      topicTitle: 'Cloud-Native Real-Time Academic Resource Management System with Role-Based Access Control',
      courseCode: 'BCSP-064',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_BCA_001',
      razorpayPaymentId: 'pay_RZP_BCA_001_TXN',
      createdAt: '2026-08-07T09:20:00.000Z',
      updatedAt: '2026-08-07T09:25:00.000Z'
    },
    {
      orderId: 'ord_mca_01',
      studentId: 'DEMO-STU-004',
      studentName: 'Ananya Singh',
      enrollmentNumber: '2601000004',
      email: 'ananya.singh.demo@gmail.com',
      projectId: 'proj_mca_01',
      topicTitle: 'Enterprise AI-Driven Predictive Maintenance & Anomaly Detection Framework Using Deep Learning',
      courseCode: 'MCSP-060',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_MCA_001',
      razorpayPaymentId: 'pay_RZP_MCA_001_TXN',
      createdAt: '2026-08-08T11:35:00.000Z',
      updatedAt: '2026-08-08T11:40:00.000Z'
    },
    {
      orderId: 'ord_pgdca_01',
      studentId: 'DEMO-STU-005',
      studentName: 'Priya Kumari',
      enrollmentNumber: '2601000005',
      email: 'priya.kumari.demo@gmail.com',
      projectId: 'proj_pgdca_01',
      topicTitle: 'Automated Inventory Control and Billing Information System',
      courseCode: 'MCSP-040',
      amount: 999,
      currency: 'INR',
      status: 'PENDING',
      razorpayOrderId: 'order_RZP_PGDCA_001',
      createdAt: '2026-08-09T17:00:00.000Z',
      updatedAt: '2026-08-09T17:00:00.000Z'
    },
    {
      orderId: 'ord_bag_01',
      studentId: 'DEMO-STU-006',
      studentName: 'Rahul Gupta',
      enrollmentNumber: '2601000006',
      email: 'rahul.gupta.demo@gmail.com',
      projectId: 'proj_bag_01',
      topicTitle: 'Effectiveness of Microfinance Self-Help Groups (SHGs) in Women Empowerment & Rural Livelihoods',
      courseCode: 'BECE-141',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_BAG_001',
      razorpayPaymentId: 'pay_RZP_BAG_001_TXN',
      createdAt: '2026-08-10T12:25:00.000Z',
      updatedAt: '2026-08-10T12:30:00.000Z'
    },
    {
      orderId: 'ord_mcom_08',
      studentId: 'DEMO-STU-008',
      studentName: 'Vivek Kumar',
      enrollmentNumber: '2601000008',
      email: 'vivek.kumar.demo@gmail.com',
      projectId: 'proj_mcom_02',
      topicTitle: 'Comparative Financial Statement & Profitability Assessment of Public vs Private Sector Banks',
      courseCode: 'MCOP-001',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_MCOM_008',
      razorpayPaymentId: 'pay_RZP_MCOM_008_TXN',
      createdAt: '2026-08-12T15:15:00.000Z',
      updatedAt: '2026-08-12T15:20:00.000Z'
    },
    {
      orderId: 'ord_bca_09',
      studentId: 'DEMO-STU-009',
      studentName: 'Sneha Singh',
      enrollmentNumber: '2601000009',
      email: 'sneha.singh.demo@gmail.com',
      projectId: 'proj_bca_02',
      topicTitle: 'Web-Based Hospital OPD Appointment Scheduling & Medical Records Portal',
      courseCode: 'BCSP-064',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_BCA_009',
      razorpayPaymentId: 'pay_RZP_BCA_009_TXN',
      createdAt: '2026-08-13T10:55:00.000Z',
      updatedAt: '2026-08-13T11:00:00.000Z'
    },
    {
      orderId: 'ord_mca_10',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      enrollmentNumber: '2601000010',
      email: 'aman.raj.demo@gmail.com',
      projectId: 'proj_mca_02',
      topicTitle: 'Decentralized Electronic Health Record (EHR) Auditing & Consent Management System',
      courseCode: 'MCSP-060',
      amount: 999,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: 'order_RZP_MCA_010',
      razorpayPaymentId: 'pay_RZP_MCA_010_TXN',
      createdAt: '2026-08-14T09:25:00.000Z',
      updatedAt: '2026-08-14T09:30:00.000Z'
    }
  ];

  const initialDownloads: DownloadLog[] = [
    {
      id: 'dl_01',
      projectId: 'proj_mcom_01',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      fileType: 'PDF',
      ipAddress: '103.212.45.18',
      downloadedAt: '2026-08-05T15:20:00.000Z'
    },
    {
      id: 'dl_02',
      projectId: 'proj_mcom_01',
      studentId: 'DEMO-STU-001',
      studentName: 'Aarav Kumar',
      fileType: 'DOCX',
      ipAddress: '103.212.45.18',
      downloadedAt: '2026-08-05T15:25:00.000Z'
    },
    {
      id: 'dl_03',
      projectId: 'proj_mba_01',
      studentId: 'DEMO-STU-002',
      studentName: 'Rohan Sharma',
      fileType: 'PDF',
      ipAddress: '122.161.88.92',
      downloadedAt: '2026-08-06T10:50:00.000Z'
    },
    {
      id: 'dl_04',
      projectId: 'proj_bca_01',
      studentId: 'DEMO-STU-003',
      studentName: 'Aditya Verma',
      fileType: 'PDF',
      ipAddress: '157.34.192.40',
      downloadedAt: '2026-08-07T09:50:00.000Z'
    },
    {
      id: 'dl_05',
      projectId: 'proj_bca_01',
      studentId: 'DEMO-STU-003',
      studentName: 'Aditya Verma',
      fileType: 'DOCX',
      ipAddress: '157.34.192.40',
      downloadedAt: '2026-08-07T10:00:00.000Z'
    },
    {
      id: 'dl_06',
      projectId: 'proj_bag_01',
      studentId: 'DEMO-STU-006',
      studentName: 'Rahul Gupta',
      fileType: 'PDF',
      ipAddress: '115.187.33.20',
      downloadedAt: '2026-08-10T12:50:00.000Z'
    },
    {
      id: 'dl_07',
      projectId: 'proj_mca_02',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      fileType: 'PDF',
      ipAddress: '182.73.24.110',
      downloadedAt: '2026-08-14T09:50:00.000Z'
    },
    {
      id: 'dl_08',
      projectId: 'proj_mca_02',
      studentId: 'DEMO-STU-010',
      studentName: 'Aman Raj',
      fileType: 'DOCX',
      ipAddress: '182.73.24.110',
      downloadedAt: '2026-08-14T09:55:00.000Z'
    }
  ];

  return {
    programs,
    subjects,
    topics,
    students,
    passwords,
    sessions: initialSessions,
    activityLogs: initialActivityLogs,
    adminAuditLogs: initialAdminAuditLogs,
    projects: initialProjects,
    synopses: [],
    jobs: initialJobs,
    orders: initialOrders,
    downloads: initialDownloads,
    settings: {
      minPageCount: 150,
      targetPageRange: '150-170 pages',
      duplicateThreshold: 15,
      academicIntegrityNotice:
        'All generated projects and synopses are provided as personalized academic project drafts and reference research material to assist students in understanding methodology and structuring. Students should review, verify, understand, edit and personalize the material before official university evaluation. IGNOU Project Hub is an independent platform and is not affiliated with IGNOU.',
      directUpiId: 'ignouprojects@okaxis',
      directUpiName: 'IGNOU Academic Project Services',
      paymentMode: 'DIRECT_FREE',
      retention: {
        loginHistoryDays: 90,
        sessionLogsDays: 60,
        activityLogsDays: 90,
        downloadLogsDays: 180,
        autoPurgeEnabled: true
      }
    }
  };
}

class Database {
  private data: DatabaseSchema;
  private isSaving: boolean = false;
  private saveQueue: boolean = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const seed = seedDatabase();
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Merge seed data with stored data so that all students and updated admin passwords persist
        const mergedStudents = [...(parsed.students || [])];
        seed.students.forEach((seedStudent) => {
          const exists = mergedStudents.some((s) => s.id === seedStudent.id);
          if (!exists) {
            mergedStudents.push(seedStudent);
          }
        });

        const mergedPasswords = {
          ...seed.passwords,
          ...(parsed.passwords || {})
        };
        // Always ensure admin password hash in database matches environment configuration & default credentials
        const adminPass = process.env.ADMIN_PASSWORD || '8340650759';
        mergedPasswords['admin_root'] = hashPassword(adminPass);
        mergedPasswords['admin_alt'] = hashPassword('8340650759');
        mergedPasswords['aakashyadav2024@gmail.com'] = hashPassword('8340650759');
        mergedPasswords['yadavaakash2027@gmail.com'] = hashPassword('8340650759');

        const mergedProjects = [...(parsed.projects || [])];
        seed.projects.forEach((sp) => {
          if (!mergedProjects.some((p) => p.projectId === sp.projectId)) {
            mergedProjects.push(sp);
          }
        });

        const mergedOrders = [...(parsed.orders || [])];
        seed.orders.forEach((so) => {
          if (!mergedOrders.some((o) => o.orderId === so.orderId)) {
            mergedOrders.push(so);
          }
        });

        const mergedDownloads = [...(parsed.downloads || [])];
        seed.downloads.forEach((sd) => {
          if (!mergedDownloads.some((d) => d.id === sd.id)) {
            mergedDownloads.push(sd);
          }
        });

        const mergedSessions = [...(parsed.sessions || [])];
        seed.sessions.forEach((ss) => {
          if (!mergedSessions.some((s) => s.sessionId === ss.sessionId)) {
            mergedSessions.push(ss);
          }
        });

        const mergedActivity = [...(parsed.activityLogs || [])];
        seed.activityLogs.forEach((sa) => {
          if (!mergedActivity.some((a) => a.activityId === sa.activityId)) {
            mergedActivity.push(sa);
          }
        });

        const mergedAudit = [...(parsed.adminAuditLogs || [])];
        seed.adminAuditLogs.forEach((al) => {
          if (!mergedAudit.some((a) => a.auditId === al.auditId)) {
            mergedAudit.push(al);
          }
        });

        const combined: DatabaseSchema = {
          ...seed,
          ...parsed,
          students: mergedStudents.filter((s) => s.id !== 'student_active'),
          passwords: mergedPasswords,
          projects: mergedProjects.filter((p) => p.studentId !== 'student_active'),
          synopses: parsed.synopses || [],
          orders: mergedOrders.filter((o) => o.studentId !== 'student_active'),
          downloads: mergedDownloads.filter((d) => d.studentId !== 'student_active'),
          sessions: mergedSessions.filter((s) => s.studentId !== 'student_active'),
          activityLogs: mergedActivity.filter((a) => a.studentId !== 'student_active'),
          adminAuditLogs: mergedAudit,
          topics: (parsed.topics || seed.topics).map((t: any) => {
            if (t.allocatedToStudentId === 'student_active') {
              return { ...t, status: 'AVAILABLE', allocatedToStudentId: undefined, reservedAt: undefined };
            }
            return t;
          }),
          settings: {
            ...seed.settings,
            ...(parsed.settings || {}),
            retention: {
              ...seed.settings.retention,
              ...(parsed.settings?.retention || {})
            }
          }
        };

        this.persistSync(combined);
        return combined;
      }
    } catch (err) {
      console.error('Error loading database, seeding fresh data:', err);
    }
    const fresh = seedDatabase();
    this.persistSync(fresh);
    return fresh;
  }

  private persistSync(data: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database synchronously:', err);
    }
  }

  public save() {
    if (this.isSaving) {
      this.saveQueue = true;
      return;
    }
    this.isSaving = true;
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database:', err);
    } finally {
      this.isSaving = false;
      if (this.saveQueue) {
        this.saveQueue = false;
        this.save();
      }
    }
  }

  // Programs
  getPrograms(): Program[] {
    return this.data.programs;
  }

  getProgram(idOrCode: string): Program | undefined {
    return this.data.programs.find(
      (p) => p.id === idOrCode || p.code.toLowerCase() === idOrCode.toLowerCase()
    );
  }

  saveProgram(program: Program): Program {
    const idx = this.data.programs.findIndex((p) => p.id === program.id);
    if (idx >= 0) {
      this.data.programs[idx] = program;
    } else {
      this.data.programs.push(program);
    }
    this.save();
    return program;
  }

  deleteProgram(id: string): boolean {
    const initialLen = this.data.programs.length;
    this.data.programs = this.data.programs.filter((p) => p.id !== id);
    if (this.data.programs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Subjects
  getSubjects(programCode?: string): Subject[] {
    let list = this.data.subjects;
    if (programCode) {
      list = list.filter((s) => s.program.toLowerCase() === programCode.toLowerCase());
    }
    return list.map((s) => ({
      ...s,
      topicsCount: this.data.topics.filter((t) => t.subjectId === s.id && t.status === 'AVAILABLE').length
    }));
  }

  getSubject(idOrCode: string): Subject | undefined {
    return this.data.subjects.find(
      (s) => s.id === idOrCode || s.courseCode.toLowerCase() === idOrCode.toLowerCase()
    );
  }

  saveSubject(subject: Subject): Subject {
    const idx = this.data.subjects.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      this.data.subjects[idx] = subject;
    } else {
      this.data.subjects.push(subject);
    }
    this.save();
    return subject;
  }

  deleteSubject(id: string): boolean {
    const initialLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter((s) => s.id !== id);
    if (this.data.subjects.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Topics
  getTopics(filters?: { subjectId?: string; courseCode?: string; program?: string; status?: string }): Topic[] {
    let list = this.data.topics;
    if (filters?.subjectId) {
      list = list.filter((t) => t.subjectId === filters.subjectId);
    }
    if (filters?.courseCode) {
      list = list.filter((t) => t.courseCode.toLowerCase() === filters.courseCode!.toLowerCase());
    }
    if (filters?.program) {
      list = list.filter((t) => t.program.toLowerCase() === filters.program!.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    return list;
  }

  getTopic(id: string): Topic | undefined {
    return this.data.topics.find((t) => t.id === id);
  }

  saveTopic(topic: Topic): Topic {
    const idx = this.data.topics.findIndex((t) => t.id === topic.id);
    if (idx >= 0) {
      this.data.topics[idx] = topic;
    } else {
      this.data.topics.push(topic);
    }
    this.save();
    return topic;
  }

  deleteTopic(id: string): boolean {
    const initialLen = this.data.topics.length;
    this.data.topics = this.data.topics.filter((t) => t.id !== id);
    if (this.data.topics.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Students & Auth
  getStudents(): Student[] {
    return this.data.students;
  }

  getStudentById(id: string): Student | undefined {
    if (!id) return undefined;
    const lower = id.toLowerCase();
    return this.data.students.find(
      (s) =>
        s.id === id ||
        (s as any).studentId === id ||
        s.enrollmentNumber?.toLowerCase() === lower ||
        s.email?.toLowerCase() === lower
    );
  }

  getStudentByEmail(email: string): Student | undefined {
    return this.data.students.find((s) => s.email.toLowerCase() === email.toLowerCase());
  }

  getStudentByEnrollment(enrollmentNumber: string): Student | undefined {
    return this.data.students.find(
      (s) => s.enrollmentNumber.toLowerCase() === enrollmentNumber.toLowerCase()
    );
  }

  createStudent(student: Student, passwordPlain: string): Student {
    this.data.students.push(student);
    this.data.passwords[student.id] = hashPassword(passwordPlain);
    this.save();
    storeStudentInInsForge(student).catch((err) => {
      console.warn('[InsForge Sync Warning on Create]:', err?.message);
    });
    return student;
  }

  saveStudent(student: Student): Student {
    const idx = this.data.students.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      this.data.students[idx] = { ...this.data.students[idx], ...student, updatedAt: new Date().toISOString() };
    } else {
      this.data.students.push(student);
    }
    this.save();
    storeStudentInInsForge(student).catch((err) => {
      console.warn('[InsForge Sync Warning on Save]:', err?.message);
    });
    return student;
  }

  updateStudent(studentId: string, updates: Partial<Student>): Student | undefined {
    const idx = this.data.students.findIndex((s) => s.id === studentId);
    if (idx < 0) return undefined;

    const existing = this.data.students[idx];
    const updated: Student = {
      ...existing,
      ...updates,
      id: existing.id, // Never alter ID
      email: updates.email ? updates.email.trim().toLowerCase() : existing.email,
      enrollmentNumber: updates.enrollmentNumber ? updates.enrollmentNumber.trim().toUpperCase() : existing.enrollmentNumber,
      updatedAt: new Date().toISOString()
    };

    this.data.students[idx] = updated;
    this.save();
    storeStudentInInsForge(updated).catch((err) => {
      console.warn('[InsForge Sync Warning on Update]:', err?.message);
    });
    return updated;
  }

  deleteStudent(studentId: string): boolean {
    const initialLen = this.data.students.length;
    this.data.students = this.data.students.filter((s) => s.id !== studentId && s.email !== studentId);
    if (this.data.passwords[studentId]) {
      delete this.data.passwords[studentId];
    }
    if (this.data.students.length !== initialLen) {
      if (this.data.sessions) {
        this.data.sessions = this.data.sessions.filter((s) => s.studentId !== studentId);
      }
      this.save();
      return true;
    }
    return false;
  }

  verifyPassword(studentId: string, passwordPlain: string): boolean {
    const student = this.getStudentById(studentId);
    // Allow master admin password for designated admin accounts
    if (
      student?.role === 'admin' ||
      studentId === 'admin_root' ||
      studentId === 'admin_alt' ||
      student?.email === 'aakashyadav2024@gmail.com' ||
      student?.email === 'yadavaakash2027@gmail.com' ||
      student?.email === 'admin@ignouprojecthub.in'
    ) {
      if (passwordPlain === '8340650759' || passwordPlain === 'Admin@IGNOU2026#Secure') {
        return true;
      }
    }
    const hash = this.data.passwords[studentId] || (student ? this.data.passwords[student.id] : undefined);
    if (!hash) return false;
    return hash === hashPassword(passwordPlain);
  }

  updatePassword(studentId: string, newPasswordPlain: string): boolean {
    this.data.passwords[studentId] = hashPassword(newPasswordPlain);
    this.save();
    return true;
  }

  // Sessions
  getSessions(studentId?: string): SessionRecord[] {
    let list = this.data.sessions || [];
    if (studentId) {
      list = list.filter((s) => s.studentId === studentId);
    }
    return [...list].sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
  }

  getSession(sessionId: string): SessionRecord | undefined {
    return (this.data.sessions || []).find((s) => s.sessionId === sessionId);
  }

  createSession(session: SessionRecord): SessionRecord {
    if (!this.data.sessions) this.data.sessions = [];
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  updateSession(sessionId: string, updates: Partial<SessionRecord>): SessionRecord | undefined {
    if (!this.data.sessions) return undefined;
    const idx = this.data.sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx < 0) return undefined;

    this.data.sessions[idx] = {
      ...this.data.sessions[idx],
      ...updates
    };
    this.save();
    return this.data.sessions[idx];
  }

  terminateActiveSessions(studentId: string, reason: 'LOGGED_OUT' | 'SESSION_EXPIRED' = 'LOGGED_OUT') {
    if (!this.data.sessions) return;
    const now = new Date();
    this.data.sessions.forEach((s) => {
      if (s.studentId === studentId && s.status === 'ACTIVE') {
        s.status = reason;
        s.logoutAt = now.toISOString();
        const duration = Math.max(0, Math.round((now.getTime() - new Date(s.loginAt).getTime()) / 1000));
        s.sessionDurationSeconds = duration;
      }
    });
    this.save();
  }

  // Activity Logs
  logActivity(activity: ActivityLog): ActivityLog {
    if (!this.data.activityLogs) this.data.activityLogs = [];
    this.data.activityLogs.unshift(activity);
    this.save();
    return activity;
  }

  getActivityLogs(studentId?: string, limit: number = 100): ActivityLog[] {
    let list = this.data.activityLogs || [];
    if (studentId) {
      list = list.filter((a) => a.studentId === studentId);
    }
    return list.slice(0, limit);
  }

  // Admin Audit Logs
  logAdminAudit(log: AdminAuditLog): AdminAuditLog {
    if (!this.data.adminAuditLogs) this.data.adminAuditLogs = [];
    this.data.adminAuditLogs.unshift(log);
    this.save();
    return log;
  }

  getAdminAuditLogs(limit: number = 150): AdminAuditLog[] {
    return (this.data.adminAuditLogs || []).slice(0, limit);
  }

  // Advanced Student Directory & Filtering
  getStudentsWithDetails(options: {
    search?: string;
    status?: string;
    filter?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'name' | 'lastActiveAt' | 'lastLoginAt';
  }) {
    let students = this.data.students.filter((s) => s.role === 'student');

    // Text search (Name, Email, Enrollment, Mobile, Program, ID)
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.enrollmentNumber.toLowerCase().includes(q) ||
          s.mobileNumber.toLowerCase().includes(q) ||
          s.program.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (options.status && options.status !== 'ALL') {
      students = students.filter((s) => s.accountStatus === options.status);
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 3600 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

    // Advanced category filter
    if (options.filter && options.filter !== 'ALL') {
      switch (options.filter) {
        case 'RECENTLY_REGISTERED':
          students = students.filter((s) => new Date(s.createdAt).getTime() >= sevenDaysAgo);
          break;
        case 'RECENTLY_ACTIVE':
          students = students.filter(
            (s) => s.lastActiveAt && new Date(s.lastActiveAt).getTime() >= oneDayAgo
          );
          break;
        case 'HAS_PURCHASED': {
          const paidStudentIds = new Set(
            this.data.orders.filter((o) => o.status === 'PAID').map((o) => o.studentId)
          );
          students = students.filter((s) => paidStudentIds.has(s.id));
          break;
        }
        case 'HAS_COMPLETED': {
          const completedStudentIds = new Set(
            this.data.projects.filter((p) => p.status === 'READY').map((p) => p.studentId)
          );
          students = students.filter((s) => completedStudentIds.has(s.id));
          break;
        }
        case 'PAYMENT_PENDING': {
          const pendingStudentIds = new Set(
            this.data.orders.filter((o) => o.status === 'PENDING').map((o) => o.studentId)
          );
          students = students.filter((s) => pendingStudentIds.has(s.id));
          break;
        }
        case 'GENERATION_FAILED': {
          const failedStudentIds = new Set(
            this.data.jobs.filter((j) => j.status === 'FAILED').map((j) => j.studentId)
          );
          students = students.filter((s) => failedStudentIds.has(s.id));
          break;
        }
      }
    }

    // Sorting
    const sortBy = options.sortBy || 'createdAt';
    students.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const timeA = a[sortBy] ? new Date(a[sortBy]!).getTime() : 0;
      const timeB = b[sortBy] ? new Date(b[sortBy]!).getTime() : 0;
      return timeB - timeA;
    });

    const total = students.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = students.slice(startIndex, startIndex + limit);

    // Compute online status and project counts for each student in the list
    const items = paginated.map((student) => {
      const studentProjects = this.data.projects.filter((p) => p.studentId === student.id);
      const studentOrders = this.data.orders.filter((o) => o.studentId === student.id);

      // Compute online status
      let onlineStatus: 'ONLINE' | 'RECENTLY_ACTIVE' | 'OFFLINE' = 'OFFLINE';
      if (student.lastActiveAt) {
        const diffMs = Date.now() - new Date(student.lastActiveAt).getTime();
        if (diffMs <= 5 * 60 * 1000) {
          onlineStatus = 'ONLINE';
        } else if (diffMs <= 2 * 60 * 60 * 1000) {
          onlineStatus = 'RECENTLY_ACTIVE';
        }
      }

      return {
        ...student,
        onlineStatus,
        projectCount: studentProjects.length,
        paidOrdersCount: studentOrders.filter((o) => o.status === 'PAID').length,
        totalPayments: studentOrders
          .filter((o) => o.status === 'PAID')
          .reduce((sum, o) => sum + (o.amount || 0), 0)
      };
    });

    return {
      students: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Complete Student Profile Data for Admin View
  getStudentProfile(studentId: string): StudentProfileData | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const sessions = this.getSessions(studentId);
    const projects = this.getProjects({ studentId });
    const orders = this.getOrders(studentId);
    const downloads = this.getDownloads(studentId);
    const jobs = this.getJobs({ studentId });
    const activityLogs = this.getActivityLogs(studentId, 150);

    // Calculate online status
    let onlineStatus: 'ONLINE' | 'RECENTLY_ACTIVE' | 'OFFLINE' = 'OFFLINE';
    if (student.lastActiveAt) {
      const diffMs = Date.now() - new Date(student.lastActiveAt).getTime();
      if (diffMs <= 5 * 60 * 1000) {
        onlineStatus = 'ONLINE';
      } else if (diffMs <= 2 * 60 * 60 * 1000) {
        onlineStatus = 'RECENTLY_ACTIVE';
      }
    }

    const purchasedProjects = orders.filter((o) => o.status === 'PAID').length;
    const completedProjects = projects.filter((p) => p.status === 'READY').length;
    const failedProjects = jobs.filter((j) => j.status === 'FAILED').length;
    const totalPayments = orders
      .filter((o) => o.status === 'PAID')
      .reduce((acc, o) => acc + (o.amount || 0), 0);

    return {
      student,
      sessions,
      projects,
      orders,
      downloads,
      jobs,
      activityLogs,
      stats: {
        totalProjects: projects.length,
        purchasedProjects,
        completedProjects,
        failedProjects,
        totalPayments,
        totalDownloads: downloads.length,
        totalLoginCount: student.totalLoginCount || sessions.length,
        lastLogin: student.lastLoginAt,
        lastActive: student.lastActiveAt,
        onlineStatus
      }
    };
  }

  // Retention auto-purge
  purgeExpiredLogs() {
    const retention = this.data.settings.retention;
    if (!retention || !retention.autoPurgeEnabled) return { purged: false };

    const now = Date.now();
    const sessionCutoff = now - retention.sessionLogsDays * 24 * 3600 * 1000;
    const activityCutoff = now - retention.activityLogsDays * 24 * 3600 * 1000;
    const downloadCutoff = now - retention.downloadLogsDays * 24 * 3600 * 1000;

    const beforeSessions = this.data.sessions.length;
    const beforeActivity = this.data.activityLogs.length;
    const beforeDownloads = this.data.downloads.length;

    this.data.sessions = this.data.sessions.filter(
      (s) => s.status === 'ACTIVE' || new Date(s.loginAt).getTime() >= sessionCutoff
    );
    this.data.activityLogs = this.data.activityLogs.filter(
      (a) => new Date(a.timestamp).getTime() >= activityCutoff
    );
    this.data.downloads = this.data.downloads.filter(
      (d) => new Date(d.downloadedAt).getTime() >= downloadCutoff
    );

    const purgedSessions = beforeSessions - this.data.sessions.length;
    const purgedActivity = beforeActivity - this.data.activityLogs.length;
    const purgedDownloads = beforeDownloads - this.data.downloads.length;

    if (purgedSessions > 0 || purgedActivity > 0 || purgedDownloads > 0) {
      this.save();
    }

    return {
      purged: true,
      purgedSessions,
      purgedActivity,
      purgedDownloads
    };
  }

  // Projects
  getProjects(filters?: { studentId?: string; status?: string }): ProjectRecord[] {
    let list = this.data.projects;
    if (filters?.studentId) {
      list = list.filter((p) => p.studentId === filters.studentId);
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getProject(id: string): ProjectRecord | undefined {
    if (!id) return undefined;
    let proj = this.data.projects.find((p) => p.projectId === id || (p as any).id === id || p.topicId === id);
    if (!proj) {
      const topic = this.getTopic(id);
      if (topic) {
        const now = new Date().toISOString();
        const synthesized: ProjectRecord = {
          projectId: `proj_${topic.id}`,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description,
          courseCode: topic.courseCode,
          program: topic.program,
          subjectId: topic.subjectId || `subj_${topic.courseCode.toLowerCase()}`,
          subjectName: topic.title,
          studentId: 'system_template',
          studentName: 'IGNOU Student',
          enrollmentNumber: 'IGNOU-2025',
          focusAreas: topic.focusAreas || [],
          generationId: `gen_${topic.id}`,
          status: 'READY',
          paymentStatus: 'PAID',
          pageCount: 156,
          wordCount: 42000,
          pdfUrl: `/api/projects/proj_${topic.id}/download/pdf`,
          docxUrl: `/api/projects/proj_${topic.id}/download/docx`,
          hasSynopsis: true,
          price: 1499,
          createdAt: now,
          updatedAt: now
        };
        this.data.projects.push(synthesized);
        this.save();
        return synthesized;
      }
    }
    return proj;
  }


  saveProject(project: ProjectRecord): ProjectRecord {
    const idx = this.data.projects.findIndex((p) => p.projectId === project.projectId);
    if (idx >= 0) {
      this.data.projects[idx] = project;
    } else {
      this.data.projects.push(project);
    }
    this.save();
    return project;
  }

  // Project Chapters Storage (Single Source of Truth)
  saveProjectChapters(projectId: string, chapters: ChapterContent[]): void {
    try {
      const chaptersDir = path.join(process.cwd(), 'data', 'chapters');
      if (!fs.existsSync(chaptersDir)) {
        fs.mkdirSync(chaptersDir, { recursive: true });
      }
      const filePath = path.join(chaptersDir, `${projectId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(chapters, null, 2), 'utf8');
    } catch (err) {
      console.error(`Failed to save chapters for project ${projectId}:`, err);
    }
  }

  getProjectChapters(projectId: string): ChapterContent[] | null {
    try {
      const filePath = path.join(process.cwd(), 'data', 'chapters', `${projectId}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`Failed to read chapters for project ${projectId}:`, err);
    }
    return null;
  }

  // Synopses
  getSynopses(filters?: { studentId?: string; courseCode?: string; projectId?: string }): SynopsisData[] {
    if (!this.data.synopses) this.data.synopses = [];
    let list = this.data.synopses;
    if (filters?.studentId) {
      list = list.filter((s) => s.studentId === filters.studentId);
    }
    if (filters?.courseCode) {
      list = list.filter((s) => s.courseCode.toLowerCase() === filters.courseCode!.toLowerCase());
    }
    if (filters?.projectId) {
      list = list.filter((s) => s.projectId === filters.projectId);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSynopsis(id: string): SynopsisData | undefined {
    if (!this.data.synopses) this.data.synopses = [];
    return this.data.synopses.find((s) => s.id === id || s.projectId === id || s.topicId === id);
  }

  saveSynopsis(synopsis: SynopsisData): SynopsisData {
    if (!this.data.synopses) this.data.synopses = [];
    const idx = this.data.synopses.findIndex((s) => s.id === synopsis.id);
    if (idx >= 0) {
      this.data.synopses[idx] = synopsis;
    } else {
      this.data.synopses.push(synopsis);
    }
    this.save();
    return synopsis;
  }

  deleteSynopsis(id: string): boolean {
    if (!this.data.synopses) return false;
    const initialLen = this.data.synopses.length;
    this.data.synopses = this.data.synopses.filter((s) => s.id !== id);
    if (this.data.synopses.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Generation Jobs
  getJobs(filters?: { studentId?: string; projectId?: string; status?: string }): GenerationJob[] {
    let list = this.data.jobs;
    if (filters?.studentId) {
      list = list.filter((j) => j.studentId === filters.studentId);
    }
    if (filters?.projectId) {
      list = list.filter((j) => j.projectId === filters.projectId);
    }
    if (filters?.status) {
      list = list.filter((j) => j.status === filters.status);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getJob(id: string): GenerationJob | undefined {
    return this.data.jobs.find((j) => j.generationId === id);
  }

  saveJob(job: GenerationJob): GenerationJob {
    const idx = this.data.jobs.findIndex((j) => j.generationId === job.generationId);
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.push(job);
    }
    this.save();
    return job;
  }

  // Orders
  getOrders(studentId?: string): OrderRecord[] {
    let list = this.data.orders;
    if (studentId) {
      list = list.filter((o) => o.studentId === studentId);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(id: string): OrderRecord | undefined {
    return this.data.orders.find((o) => o.orderId === id || o.razorpayOrderId === id);
  }

  saveOrder(order: OrderRecord): OrderRecord {
    const idx = this.data.orders.findIndex((o) => o.orderId === order.orderId);
    if (idx >= 0) {
      this.data.orders[idx] = order;
    } else {
      this.data.orders.push(order);
    }
    this.save();
    return order;
  }

  // Downloads
  logDownload(log: DownloadLog) {
    this.data.downloads.push(log);
    this.save();
  }

  getDownloads(studentId?: string): DownloadLog[] {
    let list = this.data.downloads;
    if (studentId) {
      list = list.filter((d) => d.studentId === studentId);
    }
    return [...list].sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
  }

  // System Stats & Analytics
  getStats(): SystemStats {
    const studentList = this.data.students.filter((s) => s.role === 'student');
    const totalStudents = studentList.length;
    const activeStudents = studentList.filter((s) => s.accountStatus === 'ACTIVE').length;
    const disabledStudents = studentList.filter((s) => s.accountStatus === 'DISABLED').length;
    const totalProjects = this.data.projects.length;
    const paidOrders = this.data.orders.filter((o) => o.status === 'PAID').length;
    const completedProjects = this.data.projects.filter((p) => p.status === 'READY').length;
    const generationJobs = this.data.jobs.length;
    const activeGenerationJobs = this.data.jobs.filter(
      (j) => j.status !== 'READY' && j.status !== 'FAILED' && j.status !== 'INCOMPLETE'
    ).length;
    const totalDownloads = (this.data.downloads || []).length;
    const availableTopics = this.data.topics.filter((t) => t.status === 'AVAILABLE').length;
    const reservedTopics = this.data.topics.filter((t) => t.status === 'RESERVED').length;
    const usedTopics = this.data.topics.filter((t) => t.status === 'USED').length;
    const failedJobs = this.data.jobs.filter((j) => j.status === 'FAILED').length;
    const totalRevenue = this.data.orders
      .filter((o) => o.status === 'PAID')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const readyProjects = this.data.projects.filter((p) => p.status === 'READY');
    const averagePagesPerProject = readyProjects.length
      ? Math.round(readyProjects.reduce((acc, p) => acc + p.pageCount, 0) / readyProjects.length)
      : 154;

    return {
      totalStudents,
      activeStudents,
      disabledStudents,
      totalProjects,
      paidOrders,
      completedProjects,
      totalDownloads,
      activeGenerationJobs,
      generationJobs,
      availableTopics,
      reservedTopics,
      usedTopics,
      failedJobs,
      totalRevenue,
      averagePagesPerProject
    };
  }

  getDetailedAnalytics() {
    const students = this.data.students.filter((s) => s.role === 'student');
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now - 7 * 24 * 3600 * 1000);
    const monthStart = new Date(now - 30 * 24 * 3600 * 1000);

    const activeSessions = (this.data.sessions || []).filter((s) => {
      if (s.status !== 'ACTIVE') return false;
      const diffMs = now - new Date(s.lastActiveAt).getTime();
      return diffMs <= 15 * 60 * 1000;
    }).length;

    const newToday = students.filter((s) => new Date(s.createdAt) >= todayStart).length;
    const newThisWeek = students.filter((s) => new Date(s.createdAt) >= weekStart).length;
    const newThisMonth = students.filter((s) => new Date(s.createdAt) >= monthStart).length;

    const totalLogins = students.reduce((acc, s) => acc + (s.totalLoginCount || 1), 0);

    // Registration trend by day (past 7 days)
    const registrationsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count = students.filter((s) => s.createdAt.startsWith(dateStr)).length;
      registrationsByDay.push({ date: dateStr, count });
    }

    // Login activity by day (past 7 days)
    const loginsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count = (this.data.sessions || []).filter((s) => s.loginAt.startsWith(dateStr)).length;
      loginsByDay.push({ date: dateStr, count });
    }

    return {
      stats: this.getStats(),
      studentAnalytics: {
        totalStudents: students.length,
        activeAccounts: students.filter((s) => s.accountStatus === 'ACTIVE').length,
        disabledAccounts: students.filter((s) => s.accountStatus === 'DISABLED' || s.accountStatus === 'SUSPENDED').length,
        currentlyActiveSessions: activeSessions,
        newToday,
        newThisWeek,
        newThisMonth,
        totalLogins,
        totalDownloads: this.data.downloads.length,
        registrationsByDay,
        loginsByDay
      }
    };
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
      retention: {
        ...this.data.settings.retention,
        ...(settings.retention || {})
      }
    };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
