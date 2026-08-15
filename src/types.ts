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
  | 'PAYMENT_VERIFIED'
  | 'PROJECT_GENERATION_STARTED'
  | 'PROJECT_GENERATION_COMPLETED'
  | 'PROJECT_GENERATION_FAILED'
  | 'PDF_GENERATED'
  | 'DOCX_GENERATED'
  | 'DOWNLOAD_PDF'
  | 'DOWNLOAD_DOCX'
  | 'ACCOUNT_STATUS_CHANGED'
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

export interface ChapterContent {
  chapterNumber: number;
  title: string;
  subsections: {
    heading: string;
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
  }[];
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
  guideName?: string;
  year?: string;
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
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
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
