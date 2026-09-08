export type ProgramCode = 'BCA' | 'MCA' | 'B.Com' | 'M.Com' | 'MBA' | 'PGDCA' | 'BA/BAG' | string;

export interface Program {
  id: string;
  code: string;
  name: string;
  level: 'Bachelor' | 'Master' | 'Diploma' | 'Doctoral' | 'Certificate';
  durationYears: number;
  projectCourseCodes: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  program: string;
  courseCode: string;
  subjectName: string;
  description: string;
  creditCount: number;
  hasProjectComponent: boolean;
  topicsCount?: number;
  activeStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TopicStatus = 'AVAILABLE' | 'RESERVED' | 'USED' | 'DISABLED';

export interface Topic {
  id: string;
  subjectId: string;
  courseCode: string;
  program: string;
  title: string;
  description: string;
  focusAreas: string[];
  status: TopicStatus;
  allocatedToStudentId?: string;
  allocatedToProjectId?: string;
  reservedAt?: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'SUSPENDED';

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  mobileNumber: string;
  program: string;
  courseYear?: string;
  profilePhoto?: string;
  studyCenterCode?: string;
  role: 'student' | 'admin';
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  lastActiveAt?: string;
  totalLoginCount: number;
  totalSessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = 'ACTIVE' | 'LOGGED_OUT' | 'SESSION_EXPIRED';

export interface SessionRecord {
  sessionId: string;
  studentId: string;
  studentName: string;
  loginAt: string;
  logoutAt?: string;
  lastActiveAt: string;
  sessionDurationSeconds?: number;
  status: SessionStatus;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  browser: string;
  operatingSystem: string;
  ipAddress?: string;
  country?: string;
  createdAt: string;
}

export type ActivityEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'PROFILE_UPDATED'
  | 'PROJECT_VIEWED'
  | 'PROJECT_CREATED'
  | 'TOPIC_RESERVED'
  | 'PAYMENT_STARTED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'PROJECT_GENERATION_STARTED'
  | 'PROJECT_GENERATION_COMPLETED'
  | 'PROJECT_GENERATION_FAILED'
  | 'PDF_GENERATED'
  | 'DOCX_GENERATED'
  | 'DOWNLOAD_PDF'
  | 'DOWNLOAD_DOCX'
  | 'PROJECT_DOWNLOAD'
  | 'SYNOPSIS_GENERATED'
  | 'SYNOPSIS_DOWNLOADED'
  | 'ACCOUNT_STATUS_CHANGED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'ADMIN_EDIT_STUDENT'
  | 'ADMIN_VIEW_STUDENT';

export interface ActivityLog {
  activityId: string;
  studentId: string;
  studentName?: string;
  eventType: ActivityEventType;
  description: string;
  timestamp: string;
  projectId?: string;
  orderId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AdminAuditLog {
  auditId: string;
  adminId: string;
  adminName: string;
  action: string;
  studentId?: string;
  studentName?: string;
  targetType: 'STUDENT' | 'PAYMENT' | 'PROJECT' | 'DOWNLOAD' | 'SETTINGS' | 'SYSTEM';
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface DataRetentionSettings {
  loginHistoryDays: number;
  sessionLogsDays: number;
  activityLogsDays: number;
  downloadLogsDays: number;
  autoPurgeEnabled: boolean;
}

export interface StudentProfileData {
  student: Student;
  sessions: SessionRecord[];
  projects: ProjectRecord[];
  orders: OrderRecord[];
  downloads: DownloadLog[];
  jobs: GenerationJob[];
  activityLogs: ActivityLog[];
  stats: {
    totalProjects: number;
    purchasedProjects: number;
    completedProjects: number;
    failedProjects: number;
    totalPayments: number;
    totalDownloads: number;
    totalLoginCount: number;
    lastLogin?: string;
    lastActive?: string;
    onlineStatus: 'ONLINE' | 'RECENTLY_ACTIVE' | 'OFFLINE';
  };
}

export type GenerationStatus =
  | 'QUEUED'
  | 'GENERATING'
  | 'SAVING'
  | 'VALIDATING'
  | 'COMBINING'
  | 'PDF_GENERATING'
  | 'DOCX_GENERATING'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'INCOMPLETE'
  | 'FAILED';

export interface ChapterSection {
  id?: string;
  heading: string;
  title?: string;
  content: string;
  tables?: {
    title: string;
    headers: string[];
    rows: string[][];
  }[];
  caseStudy?: {
    title: string;
    context: string;
    findings: string;
  };
}

export interface ChapterContent {
  chapterNumber: number;
  title: string;
  subsections: ChapterSection[];
  wordCount: number;
  pageEstimate: number;
}

export interface ProjectContext {
  projectId: string;
  studentId?: string;
  studentName: string;
  enrollmentNumber: string;
  mobileNumber?: string;
  email?: string;
  studyCenterCode?: string;
  studyCenter?: string;
  regionalCenter?: string;
  guideName?: string;
  year?: string;
  academicSession?: string;
  program: string;
  courseCode: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicTitle: string;
  topicDescription?: string;
  focusAreas?: string[];
  generationId?: string;
}

export interface ProjectRecord {
  projectId: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  studyCenterCode?: string;
  guideName?: string;
  program: string;
  courseCode: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  focusAreas: string[];
  generationId: string;
  status: GenerationStatus;
  pageCount: number;
  wordCount: number;
  pdfUrl: string;
  docxUrl: string;
  hasSynopsis: boolean;
  price: number;
  orderId?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  qualityReport?: {
    pagesValid: boolean;
    pageCount: number;
    wordCount: number;
    duplicateCheckPassed: boolean;
    duplicateScore: number;
    formattingPassed: boolean;
    tablesCount: number;
    referencesCount: number;
    verifiedAt: string;
  };
  chaptersSummary?: {
    number: number;
    title: string;
    pages: number;
    wordCount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
  generationId: string;
  projectId: string;
  studentId: string;
  studentName: string;
  topicTitle: string;
  courseCode: string;
  currentChapter: number;
  totalChapters: number;
  currentPart: string;
  status: GenerationStatus;
  progress: number;
  error?: string;
  logs: {
    timestamp: string;
    step: string;
    message: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderRecord {
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  email: string;
  projectId: string;
  topicTitle: string;
  courseCode: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'APPROVED' | 'REJECTED';
  paymentMethod?: string;
  utrNumber?: string;
  screenshotUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadLog {
  id: string;
  projectId: string;
  studentId: string;
  studentName: string;
  fileType: 'PDF' | 'DOCX';
  ipAddress?: string;
  downloadedAt: string;
}

export interface GuideBioData {
  guideName: string;
  qualification: string;
  specialization: string;
  designation: string;
  organization: string;
  officialAddress: string;
  email: string;
  mobileNumber: string;
  teachingExperience: string;
  researchExperience: string;
  supervisionExperience: string;
  declarationAccepted: boolean;
  declarationDate?: string;
}

export interface LiteratureStudy {
  authorYear: string;
  title: string;
  findings: string;
  verificationStatus: string;
}

export interface ChapterPlanItem {
  chapterNumber: number;
  chapterTitle: string;
  description: string;
}

export interface TimeScheduleItem {
  stage: string;
  timePeriod: string;
  description: string;
}

export interface ReferenceItem {
  citation: string;
  sourceType: 'Journal' | 'Book' | 'Institutional Report' | 'Government / Academic Repository';
  verificationTag: string;
}

export interface QuestionnaireItem {
  questionNumber: number;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'LIKERT_SCALE' | 'OPEN_ENDED';
  options?: string[];
  scaleLabels?: string[];
}

export interface QuestionnaireSection {
  sectionTitle: string;
  sectionSubtitle?: string;
  instructions?: string;
  items: QuestionnaireItem[];
}

export interface Synopsis11Sections {
  section1_projectTitle: string;
  section2_introduction: string;
  section3_problemStatement: string;
  section4_objectives: string[];
  section5_scope: {
    coverage: string;
    features: string[];
    targetUsers: string;
    accomplishments: string;
    limitations: string;
    fullText: string;
  };
  section6_literatureReview: string;
  section7_methodology: {
    type: string;
    steps: { title: string; description: string }[];
    fullText: string;
  };
  section8_toolsAndTechnologies: {
    category: string;
    items: string[];
    justification: string;
  }[];
  section9_expectedOutcome: string;
  section10_workPlan: {
    phase: string;
    duration: string;
    activities: string;
    deliverables: string;
  }[];
  section11_references: string[];
}

export interface SynopsisData {
  id: string;
  projectId?: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  program: string;
  courseCode: string;
  subjectName: string;
  organizationName?: string;
  companyName?: string;
  studyCenterCode: string;
  studyCenterName: string;
  regionalCenterCode: string;
  regionalCenterName: string;
  sessionYear: string;
  projectTitle: string;
  researchTopic: string;
  topicId?: string;

  // Additional IGNOU Candidate & Project Profile Inputs
  email?: string;
  mobileNumber?: string;
  guideName?: string;
  projectType?: string;
  projectDescription?: string;
  preferredTechnologies?: string;
  additionalRequirements?: string;

  // Official 11-Section IGNOU Standard
  sections11?: Synopsis11Sections;

  // Complete 26 Academic Sections
  coverPage: {
    projectTitle: string;
    studentName: string;
    enrollmentNumber: string;
    program: string;
    courseCode: string;
    studyCenter: string;
    regionalCenter: string;
    sessionYear: string;
    organizationName?: string;
  };
  declaration: {
    studentName: string;
    enrollmentNumber: string;
    program: string;
    projectTitle: string;
    statement: string;
    fullText: string;
  };
  titleOfTheStudy: string;
  introduction: {
    meaningOfTopic: string;
    importance: string;
    currentBusinessRelevance: string;
    roleInOrganization: string;
    whyTopicSelected: string;
    connectionWithHRMorDomain: string;
    background: string;
    context: string;
    currentSituation: string;
    relevance: string;
    fullText: string;
  };
  backgroundOfStudy: {
    industryContext: string;
    organizationalContext: string;
    problemBackground: string;
    fullText: string;
  };
  roleOfProfessionals: {
    title: string;
    roleDescription: string;
    keyFunctions: string[];
    fullText: string;
  };
  needAndSignificance: {
    whyNeeded: string;
    academicImportance: string;
    practicalImportance: string;
    beneficiaries: string;
    expectedContribution: string;
    fullText: string;
    needForStudy?: string;
    significanceOfStudy?: string;
  };
  needForStudyDetailed: {
    employeeDevelopment: string;
    performanceImprovement: string;
    skillDevelopment: string;
    productivityEnhancement: string;
    qualityImprovement: string;
    technologyAdaptation: string;
    organizationalGrowth: string;
    fullText: string;
  };
  visionMissionObjectives: {
    vision: string;
    mission: string;
    strategicObjectives: string[];
    fullText: string;
  };
  scopeOfTheStudy: {
    researchArea: string;
    targetPopulation: string;
    organizationCoverage: string;
    employeeCoverage: string;
    timePeriod: string;
    subjectCoverage: string;
    areasIncluded: string[];
    areasExcluded: string[];
    scopeLimitations: string;
    fullText: string;
  };
  objectivesOfTheStudy: string[];
  researchQuestions: string[];
  hypothesis: {
    hasHypothesis: boolean;
    studyType: 'EMPIRICAL_QUANTITATIVE' | 'QUALITATIVE_DESCRIPTIVE' | 'SYSTEM_DEVELOPMENT';
    rationale: string;
    nullHypotheses: string[];
    alternateHypotheses: string[];
    fullText: string;
  };
  researchMethodology: {
    researchType: string;
    researchDesign: string;
    natureOfStudy: string;
    descriptiveResearchRationale: string;
    primaryData: string;
    secondaryData: string;
    population: string;
    samplingUnit: string;
    sampleSize: string;
    samplingMethod: string;
    samplingTechnique: string;
    dataCollectionTools: string;
    researchInstrument: string;
    dataAnalysisMethod: string;
    fullText: string;
  };
  researchInstruments: {
    questionnaireDesign: string;
    interviewDiscussion: string;
    observation: string;
    fullText: string;
  };
  sourcesOfData: {
    primaryDataSources: string[];
    primaryDataExplanation: string;
    secondaryDataSources: string[];
    secondaryDataExplanation: string;
    fullText: string;
  };
  samplingDesign: {
    population: string;
    samplingUnit: string;
    sampleSize: string;
    samplingTechnique: string;
    rationale: string;
    fullText: string;
  };
  toolsAndTechniques: {
    frequencyAnalysis: string;
    percentageAnalysis: string;
    tabularRepresentation: string;
    graphicalTools: string;
    meanScoreAnalysis: string;
    comparativeAnalysis: string;
    interpretationFramework: string;
    fullText: string;
  };
  reviewOfLiterature: {
    overview: string;
    studies: LiteratureStudy[];
    thematicReview: string;
    researchGap: string;
    fullText: string;
  };
  expectedOutcome: {
    deliverables: string;
    practicalImpact: string;
    academicValue: string;
    expectedOrganizationalBenefits: string;
    fullText: string;
  };
  limitationsOfTheStudy: string[];
  proposedChapterization: ChapterPlanItem[];
  questionnaire: {
    title: string;
    introductionNote: string;
    sectionA: QuestionnaireSection; // Respondent Profile
    sectionB: QuestionnaireSection; // Topic-specific questions
    sectionC: QuestionnaireSection; // Likert scale questions
    fullText: string;
  };
  significanceOfTheStudy: {
    forOrganization: string;
    forEmployees: string;
    forHRDepartment: string;
    forManagement: string;
    forResearchers: string;
    fullText: string;
  };
  timeSchedule: TimeScheduleItem[];
  references: ReferenceItem[];
  statementOfTheProblem: string;
  guideBioData: GuideBioData;

  // Metadata & Document Statistics
  wordCount: number;
  pageEstimate: number;
  pdfUrl?: string;
  docxUrl?: string;
  status: 'DRAFT' | 'GENERATING' | 'READY';
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  totalStudents: number;
  activeStudents: number;
  disabledStudents: number;
  totalProjects: number;
  completedProjects: number;
  paidOrders: number;
  totalDownloads: number;
  availableTopics: number;
  reservedTopics: number;
  usedTopics: number;
  activeGenerationJobs: number;
  generationJobs: number;
  failedJobs: number;
  totalRevenue: number;
  averagePagesPerProject: number;
}

