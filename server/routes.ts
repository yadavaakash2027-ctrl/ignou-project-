import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, STORAGE_DIR } from './db';
import {
  AuthService,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
  parseUserAgent,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts
} from './auth';
import { TopicEngine } from './topicEngine';
import { GenerationCoordinator } from './generator';
import { PDFGenerator } from './pdfGenerator';
import { DocxGenerator } from './docxGenerator';
import { AcademicEngine } from './academicEngine';
import { ProjectRecord, OrderRecord, SessionRecord, ActivityLog, AccountStatus, ProjectContext } from '../src/types';

export const apiRouter = express.Router();

// Helper to get client IP cleanly
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// --- 1. HEALTH CHECK ---
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    name: 'IGNOU Project Hub API',
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  });
});

// --- 2. AUTHENTICATION ROUTES ---
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, enrollmentNumber, mobileNumber, program, courseYear, studyCenterCode, password } = req.body;

    if (!name || !email || !enrollmentNumber || !mobileNumber || !program || !password) {
      return res.status(400).json({ error: 'All fields including Enrollment Number and Program are required.' });
    }

    if (db.getStudentByEmail(email)) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    if (db.getStudentByEnrollment(enrollmentNumber)) {
      return res.status(400).json({ error: 'An account with this Enrollment Number already exists.' });
    }

    const nowIso = new Date().toISOString();
    const studentId = `stu_${crypto.randomUUID().slice(0, 10)}`;
    const newStudent = db.createStudent(
      {
        id: studentId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
        mobileNumber: mobileNumber.trim(),
        program: program.trim(),
        courseYear: courseYear?.trim() || '1st Year',
        studyCenterCode: studyCenterCode?.trim() || 'SC-0700',
        role: 'student',
        accountStatus: 'ACTIVE',
        emailVerified: false,
        phoneVerified: false,
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
        totalLoginCount: 1,
        totalSessionCount: 1,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      password
    );

    // Create initial session
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const sessionId = `sess_${crypto.randomUUID().slice(0, 10)}`;
    const session: SessionRecord = {
      sessionId,
      studentId: newStudent.id,
      studentName: newStudent.name,
      loginAt: nowIso,
      lastActiveAt: nowIso,
      status: 'ACTIVE',
      deviceType: uaInfo.deviceType,
      browser: uaInfo.browser,
      operatingSystem: uaInfo.operatingSystem,
      ipAddress: getClientIp(req),
      country: 'India',
      createdAt: nowIso
    };
    db.createSession(session);

    // Log activities
    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      eventType: 'PROFILE_UPDATED',
      description: `Account created for ${newStudent.program} curriculum.`,
      timestamp: nowIso
    });

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      eventType: 'LOGIN',
      description: `Initial registration login via ${uaInfo.browser} on ${uaInfo.operatingSystem}.`,
      timestamp: nowIso,
      sessionId
    });

    const token = AuthService.createToken(newStudent.id, newStudent.role, sessionId);
    res.status(201).json({
      message: 'Registration successful',
      token,
      sessionId,
      user: newStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // email or enrollment number
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide email/enrollment number and password.' });
    }

    const student =
      db.getStudentByEmail(identifier) ||
      db.getStudentByEnrollment(identifier);

    if (!student || !db.verifyPassword(student.id, password)) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your email/enrollment and password.' });
    }

    // Check account status
    if (student.accountStatus === 'DISABLED' || student.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        error: `Your account has been ${student.accountStatus.toLowerCase()} by an administrator. Please contact support.`,
        accountStatus: student.accountStatus
      });
    }

    const nowIso = new Date().toISOString();
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const sessionId = `sess_${crypto.randomUUID().slice(0, 10)}`;

    // Update student stats
    const updatedStudent = db.updateStudent(student.id, {
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      totalLoginCount: (student.totalLoginCount || 0) + 1,
      totalSessionCount: (student.totalSessionCount || 0) + 1
    }) || student;

    // Create session record
    const session: SessionRecord = {
      sessionId,
      studentId: student.id,
      studentName: student.name,
      loginAt: nowIso,
      lastActiveAt: nowIso,
      status: 'ACTIVE',
      deviceType: uaInfo.deviceType,
      browser: uaInfo.browser,
      operatingSystem: uaInfo.operatingSystem,
      ipAddress: getClientIp(req),
      country: 'India',
      createdAt: nowIso
    };
    db.createSession(session);

    // Log Activity
    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
      studentId: student.id,
      studentName: student.name,
      eventType: 'LOGIN',
      description: `Logged in from ${uaInfo.deviceType} (${uaInfo.browser}, ${uaInfo.operatingSystem}).`,
      timestamp: nowIso,
      sessionId
    });

    const token = AuthService.createToken(student.id, student.role, sessionId);
    res.json({
      message: 'Login successful',
      token,
      sessionId,
      user: updatedStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.post('/auth/admin-login', (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkLoginRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many failed login attempts. Please wait ${rateLimit.waitSeconds} seconds before trying again.`,
        waitSeconds: rateLimit.waitSeconds
      });
    }

    const { userId, username, email, identifier, password } = req.body;
    const query = (userId || username || email || identifier || '').trim();

    if (!query || !password) {
      recordFailedLoginAttempt(clientIp);
      return res.status(400).json({ error: 'Please provide administrator User ID and Password.' });
    }

    const configuredAdminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

    // Match admin by ID ('admin_root'), configured username, email, or enrollment
    let admin = db.getStudents().find(
      (s) =>
        s.role === 'admin' &&
        (s.id === query ||
          (query.toLowerCase() === configuredAdminUsername && s.id === 'admin_root') ||
          s.email.toLowerCase() === query.toLowerCase() ||
          s.enrollmentNumber.toLowerCase() === query.toLowerCase())
    );

    if (!admin || !db.verifyPassword(admin.id, password)) {
      recordFailedLoginAttempt(clientIp);
      return res.status(401).json({ error: 'Invalid administrator credentials. Access denied.' });
    }

    if (admin.accountStatus === 'DISABLED' || admin.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Administrator account is currently deactivated.',
        accountStatus: admin.accountStatus
      });
    }

    // Clear failed attempts upon successful authentication
    clearFailedLoginAttempts(clientIp);

    const nowIso = new Date().toISOString();
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const sessionId = `sess_adm_${crypto.randomUUID().slice(0, 8)}`;

    const updated = db.updateStudent(admin.id, {
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      totalLoginCount: (admin.totalLoginCount || 0) + 1,
      totalSessionCount: (admin.totalSessionCount || 0) + 1
    }) || admin;

    db.createSession({
      sessionId,
      studentId: admin.id,
      studentName: admin.name,
      loginAt: nowIso,
      lastActiveAt: nowIso,
      status: 'ACTIVE',
      deviceType: uaInfo.deviceType,
      browser: uaInfo.browser,
      operatingSystem: uaInfo.operatingSystem,
      ipAddress: clientIp,
      country: 'India',
      createdAt: nowIso
    });

    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: admin.id,
      adminName: admin.name,
      action: 'ADMIN_LOGIN',
      targetType: 'SYSTEM',
      metadata: { ip: clientIp, browser: uaInfo.browser, os: uaInfo.operatingSystem },
      timestamp: nowIso
    });

    const token = AuthService.createToken(admin.id, admin.role, sessionId);
    res.json({
      message: 'Admin authentication verified successfully',
      token,
      sessionId,
      user: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Admin authentication failed' });
  }
});

apiRouter.post('/auth/admin-forgot-password', (req: Request, res: Response) => {
  try {
    const { userId, email, identifier } = req.body;
    const query = (userId || email || identifier || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Please specify the administrator User ID or Email.' });
    }

    const clientIp = getClientIp(req);

    // Audit log the password reset request
    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: 'admin_root',
      adminName: 'System Security Subsystem',
      action: 'ADMIN_PASSWORD_RESET_REQUESTED',
      targetType: 'SYSTEM',
      metadata: { requestedIdentifier: query, ip: clientIp },
      timestamp: new Date().toISOString()
    });

    // Generic secure response (does not reveal if account exists)
    res.json({
      message:
        'If this administrator account exists, cryptographic recovery verification instructions and an administrative reset token have been dispatched to the designated root security channel.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process administrator reset request' });
  }
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    const user = req.user!;
    const sessionId = req.sessionId;
    const now = new Date();
    const nowIso = now.toISOString();

    if (sessionId) {
      const existingSession = db.getSession(sessionId);
      let durationSec = 0;
      if (existingSession) {
        durationSec = Math.max(0, Math.round((now.getTime() - new Date(existingSession.loginAt).getTime()) / 1000));
      }
      db.updateSession(sessionId, {
        status: 'LOGGED_OUT',
        logoutAt: nowIso,
        sessionDurationSeconds: durationSec
      });
    }

    db.updateStudent(user.id, {
      lastLogoutAt: nowIso
    });

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
      studentId: user.id,
      studentName: user.name,
      eventType: 'LOGOUT',
      description: 'Logged out successfully from application session.',
      timestamp: nowIso,
      sessionId
    });

    if (token) {
      AuthService.revokeToken(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Logout failed' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// --- 3. PROGRAMS & SUBJECTS ROUTES ---
apiRouter.get('/programs', (req: Request, res: Response) => {
  res.json({ programs: db.getPrograms() });
});

apiRouter.post('/programs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { code, name, level, durationYears, projectCourseCodes, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Program code and name are required.' });
  }

  const prog = db.saveProgram({
    id: `prog_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    name,
    level: level || 'Bachelor',
    durationYears: Number(durationYears) || 3,
    projectCourseCodes: projectCourseCodes || [],
    description: description || '',
    isActive: true,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ program: prog });
});

apiRouter.get('/subjects', (req: Request, res: Response) => {
  const program = req.query.program as string | undefined;
  res.json({ subjects: db.getSubjects(program) });
});

apiRouter.post('/subjects', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { program, courseCode, subjectName, description, creditCount } = req.body;
  if (!program || !courseCode || !subjectName) {
    return res.status(400).json({ error: 'Program, course code, and subject name are required.' });
  }

  const subj = db.saveSubject({
    id: `subj_${courseCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    program,
    courseCode,
    subjectName,
    description: description || '',
    creditCount: Number(creditCount) || 6,
    hasProjectComponent: true,
    activeStatus: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.status(201).json({ subject: subj });
});

// --- 4. TOPIC MANAGEMENT & ALLOCATION ---
apiRouter.get('/topics', (req: Request, res: Response) => {
  const { subjectId, courseCode, program, status } = req.query;
  const topics = db.getTopics({
    subjectId: subjectId as string,
    courseCode: courseCode as string,
    program: program as string,
    status: status as string
  });
  res.json({ topics });
});

apiRouter.post('/topics', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, courseCode, program, title, description, focusAreas } = req.body;
  if (!courseCode || !title) {
    return res.status(400).json({ error: 'Course code and topic title are required.' });
  }

  const topic = db.saveTopic({
    id: `top_${crypto.randomUUID().slice(0, 10)}`,
    subjectId: subjectId || 'subj_custom',
    courseCode,
    program: program || 'MBA',
    title: title.trim(),
    description: description || '',
    focusAreas: Array.isArray(focusAreas) ? focusAreas : ['Empirical Analysis', 'Strategy', 'Optimization'],
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.status(201).json({ topic });
});

// Atomic allocation endpoint
apiRouter.post('/topics/allocate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseCode, program } = req.body;
    const student = req.user!;

    if (!courseCode) {
      return res.status(400).json({ error: 'Course code is required for topic allocation.' });
    }

    const allocation = await TopicEngine.allocateTopic(student.id, courseCode, program || student.program);
    if (!allocation.success || !allocation.topic) {
      return res.status(404).json({
        error: allocation.message || 'No new project topic is currently available. Please contact the administrator.'
      });
    }

    res.json({
      message: 'Topic allocated successfully',
      topic: allocation.topic
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to allocate topic' });
  }
});

// --- 5. PAYMENT & RAZORPAY INTEGRATION ---
apiRouter.post('/payment/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseCode, topicId, amount } = req.body;
    const student = req.user!;

    let topic = topicId ? db.getTopic(topicId) : undefined;

    // If no topic selected, atomically allocate one
    if (!topic || topic.status !== 'AVAILABLE') {
      const allocation = await TopicEngine.allocateTopic(student.id, courseCode, student.program);
      if (!allocation.success || !allocation.topic) {
        return res.status(400).json({
          error: allocation.message || 'No new project topic is currently available. Please contact the administrator.'
        });
      }
      topic = allocation.topic;
    } else {
      // Mark as reserved
      topic.status = 'RESERVED';
      topic.allocatedToStudentId = student.id;
      topic.reservedAt = new Date().toISOString();
      db.saveTopic(topic);
    }

    const subject = db.getSubject(topic.subjectId) || db.getSubject(topic.courseCode);
    const orderId = `ord_${crypto.randomUUID().slice(0, 10)}`;
    const projectId = `proj_${crypto.randomUUID().slice(0, 10)}`;

    const orderPrice = Number(amount) || 1499;

    // Create Order Record
    const order: OrderRecord = {
      orderId,
      razorpayOrderId: `rzp_order_${crypto.randomUUID().slice(0, 8)}`,
      studentId: student.id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      email: student.email,
      projectId,
      topicTitle: topic.title,
      courseCode: topic.courseCode,
      amount: orderPrice,
      currency: 'INR',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveOrder(order);

    // Create Project Record (PENDING payment)
    const project: ProjectRecord = {
      projectId,
      studentId: student.id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      program: topic.program || student.program,
      courseCode: topic.courseCode,
      subjectId: topic.subjectId,
      subjectName: subject?.subjectName || topic.courseCode,
      topicId: topic.id,
      topicTitle: topic.title,
      topicDescription: topic.description,
      focusAreas: topic.focusAreas,
      generationId: '',
      status: 'QUEUED',
      pageCount: 0,
      wordCount: 0,
      pdfUrl: '',
      docxUrl: '',
      hasSynopsis: true,
      price: orderPrice,
      orderId: order.orderId,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveProject(project);

    res.json({
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      projectId: project.projectId,
      topic: topic,
      keyId: db.getSettings().razorpayKeyId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment initiation failed' });
  }
});

apiRouter.post('/payment/verify', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
    const student = req.user!;

    const order = db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    if (order.studentId !== student.id && student.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to order.' });
    }

    // Mark order as PAID
    order.status = 'PAID';
    order.razorpayPaymentId = razorpayPaymentId || `pay_${crypto.randomUUID().slice(0, 10)}`;
    order.updatedAt = new Date().toISOString();
    db.saveOrder(order);

    // Update project payment status
    const project = db.getProject(order.projectId);
    if (project) {
      project.paymentStatus = 'PAID';
      project.updatedAt = new Date().toISOString();
      db.saveProject(project);

      // Trigger automatic background generation pipeline!
      const job = await GenerationCoordinator.startProjectGeneration(project.projectId);
      project.generationId = job.generationId;
      db.saveProject(project);
    }

    res.json({
      message: 'Payment verified and project generation started',
      order,
      project
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// --- 6. PROJECTS & GENERATION STATUS ---
apiRouter.get('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const student = req.user!;
  if (student.role === 'admin') {
    res.json({ projects: db.getProjects() });
  } else {
    res.json({ projects: db.getProjects({ studentId: student.id }) });
  }
});

apiRouter.get('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const student = req.user!;
  if (project.studentId !== student.id && student.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized access to this project.' });
  }

  const job = project.generationId ? db.getJob(project.generationId) : undefined;
  res.json({ project, job });
});

apiRouter.post('/projects/:id/retry', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const student = req.user!;
  if (project.studentId !== student.id && student.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized access to this project.' });
  }

  const job = await GenerationCoordinator.startProjectGeneration(project.projectId);
  res.json({ message: 'Generation restarted', job });
});

apiRouter.get('/jobs/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const job = db.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Generation job not found.' });
  }
  res.json({ job });
});

// --- 7. SECURE AUTHENTICATED DOWNLOADS ---
apiRouter.get('/projects/:id/download/pdf', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const student = req.user!;
    // Check authorization
    if (project.studentId !== student.id && student.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    // Check payment status
    if (project.paymentStatus !== 'PAID' && student.role !== 'admin') {
      return res.status(403).json({ error: 'Payment required to download project files.' });
    }

    // Check completion
    if (project.status !== 'READY') {
      return res.status(400).json({ error: 'Project is still being generated or is incomplete.' });
    }

    const filename = `IGNOU_Project_${project.courseCode}_${project.enrollmentNumber}_${project.projectId.slice(0, 8)}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // Generate on demand if file is not on disk (e.g. serverless instance)
      const projectContext: ProjectContext = {
        projectId: project.projectId,
        studentName: project.studentName,
        enrollmentNumber: project.enrollmentNumber,
        program: project.program,
        courseCode: project.courseCode,
        subjectName: project.subjectName,
        topicTitle: project.topicTitle,
        topicDescription: project.topicDescription,
        studyCenterCode: project.studyCenterCode || 'SC-0700',
        guideName: project.guideName || 'Dr. S. K. Mukherjee, Associate Professor',
        year: '2025-2026'
      };
      const chapters = await AcademicEngine.generateStandardChapters(projectContext);
      await PDFGenerator.generateProjectPDF(projectContext, chapters);
    }

    // Log download
    db.logDownload({
      id: `dl_${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.projectId,
      studentId: student.id,
      studentName: student.name,
      fileType: 'PDF',
      ipAddress: getClientIp(req),
      downloadedAt: new Date().toISOString()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('PDF download error:', err);
    res.status(500).json({ error: err.message || 'Failed to download PDF' });
  }
});

apiRouter.get('/projects/:id/download/docx', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const student = req.user!;
    if (project.studentId !== student.id && student.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    if (project.paymentStatus !== 'PAID' && student.role !== 'admin') {
      return res.status(403).json({ error: 'Payment required to download project files.' });
    }

    if (project.status !== 'READY') {
      return res.status(400).json({ error: 'Project is still being generated or is incomplete.' });
    }

    const filename = `IGNOU_Project_${project.courseCode}_${project.enrollmentNumber}_${project.projectId.slice(0, 8)}.docx`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // Generate on demand if file is not on disk (e.g. serverless instance)
      const projectContext: ProjectContext = {
        projectId: project.projectId,
        studentName: project.studentName,
        enrollmentNumber: project.enrollmentNumber,
        program: project.program,
        courseCode: project.courseCode,
        subjectName: project.subjectName,
        topicTitle: project.topicTitle,
        topicDescription: project.topicDescription,
        studyCenterCode: project.studyCenterCode || 'SC-0700',
        guideName: project.guideName || 'Dr. S. K. Mukherjee, Associate Professor',
        year: '2025-2026'
      };
      const chapters = await AcademicEngine.generateStandardChapters(projectContext);
      await DocxGenerator.generateProjectDocx(projectContext, chapters);
    }

    // Log download
    db.logDownload({
      id: `dl_${crypto.randomUUID().slice(0, 8)}`,
      projectId: project.projectId,
      studentId: student.id,
      studentName: student.name,
      fileType: 'DOCX',
      ipAddress: getClientIp(req),
      downloadedAt: new Date().toISOString()
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('DOCX download error:', err);
    res.status(500).json({ error: err.message || 'Failed to download DOCX' });
  }
});

// --- 8. ADMIN DASHBOARD & ADVANCED STUDENT MANAGEMENT API ---
apiRouter.get('/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ stats: db.getStats() });
});

apiRouter.get('/admin/analytics/detailed', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDetailedAnalytics());
});

// Advanced Student List with Search, Filter & Pagination
apiRouter.get('/admin/students', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { search, status, filter, page, limit, sortBy } = req.query;
  const result = db.getStudentsWithDetails({
    search: search as string,
    status: status as string,
    filter: filter as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 15,
    sortBy: sortBy as any
  });
  res.json(result);
});

// Full Student Profile by ID
apiRouter.get('/admin/students/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const profile = db.getStudentProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Audit log of admin viewing student profile
  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'VIEW_STUDENT_PROFILE',
    studentId: profile.student.id,
    studentName: profile.student.name,
    targetType: 'STUDENT',
    targetId: profile.student.id,
    timestamp: new Date().toISOString()
  });

  res.json(profile);
});

// Update Student Profile
apiRouter.put('/admin/students/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, enrollmentNumber, mobileNumber, program, courseYear, studyCenterCode, accountStatus } = req.body;
  const existing = db.getStudentById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const updated = db.updateStudent(req.params.id, {
    name: name?.trim() || existing.name,
    email: email?.trim() || existing.email,
    enrollmentNumber: enrollmentNumber?.trim() || existing.enrollmentNumber,
    mobileNumber: mobileNumber?.trim() || existing.mobileNumber,
    program: program?.trim() || existing.program,
    courseYear: courseYear?.trim() || existing.courseYear,
    studyCenterCode: studyCenterCode?.trim() || existing.studyCenterCode,
    accountStatus: (accountStatus as AccountStatus) || existing.accountStatus
  });

  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'UPDATE_STUDENT_PROFILE',
    studentId: existing.id,
    studentName: existing.name,
    targetType: 'STUDENT',
    targetId: existing.id,
    metadata: { previous: { name: existing.name, status: existing.accountStatus }, updated: req.body },
    timestamp: new Date().toISOString()
  });

  db.logActivity({
    activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
    studentId: existing.id,
    studentName: existing.name,
    eventType: 'ADMIN_EDIT_STUDENT',
    description: `Profile modified by administrator (${req.user!.name}).`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Student profile updated successfully', student: updated });
});

// Change Student Account Status (Enable / Disable / Suspend)
apiRouter.patch('/admin/students/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, reason } = req.body;
  if (!status || !['ACTIVE', 'DISABLED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be ACTIVE, DISABLED, or SUSPENDED.' });
  }

  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const updated = db.updateStudent(student.id, {
    accountStatus: status as AccountStatus
  });

  // If disabling/suspending, terminate active sessions immediately
  if (status !== 'ACTIVE') {
    db.terminateActiveSessions(student.id, 'SESSION_EXPIRED');
  }

  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'CHANGE_ACCOUNT_STATUS',
    studentId: student.id,
    studentName: student.name,
    targetType: 'STUDENT',
    targetId: student.id,
    metadata: { oldStatus: student.accountStatus, newStatus: status, reason: reason || 'Admin action' },
    timestamp: new Date().toISOString()
  });

  db.logActivity({
    activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
    studentId: student.id,
    studentName: student.name,
    eventType: 'ACCOUNT_STATUS_CHANGED',
    description: `Account status updated to ${status} by admin (${req.user!.name}). Reason: ${reason || 'Administrative policy'}`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: `Account status changed to ${status}`, student: updated });
});

// Force Terminate Student Sessions
apiRouter.post('/admin/students/:id/terminate-sessions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  db.terminateActiveSessions(student.id, 'SESSION_EXPIRED');

  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'TERMINATE_SESSIONS',
    studentId: student.id,
    studentName: student.name,
    targetType: 'STUDENT',
    targetId: student.id,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'All active sessions for student terminated.' });
});

// Admin Reset Password
apiRouter.post('/admin/students/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  db.updatePassword(student.id, newPassword);
  db.terminateActiveSessions(student.id, 'SESSION_EXPIRED');

  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'RESET_STUDENT_PASSWORD',
    studentId: student.id,
    studentName: student.name,
    targetType: 'STUDENT',
    targetId: student.id,
    timestamp: new Date().toISOString()
  });

  db.logActivity({
    activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
    studentId: student.id,
    studentName: student.name,
    eventType: 'PASSWORD_RESET_REQUESTED',
    description: 'Password reset performed by administrator.',
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Password reset successfully. Active sessions revoked.' });
});

// Student Sessions list
apiRouter.get('/admin/students/:id/sessions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ sessions: db.getSessions(req.params.id) });
});

// Student Activity logs
apiRouter.get('/admin/students/:id/activity', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ activityLogs: db.getActivityLogs(req.params.id, 200) });
});

// Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ auditLogs: db.getAdminAuditLogs(150) });
});

// Orders, Downloads, Jobs
apiRouter.get('/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ orders: db.getOrders() });
});

apiRouter.get('/admin/downloads', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ downloads: db.getDownloads() });
});

apiRouter.get('/admin/jobs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ jobs: db.getJobs() });
});

apiRouter.get('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ settings: db.getSettings() });
});

apiRouter.put('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'UPDATE_SYSTEM_SETTINGS',
    targetType: 'SETTINGS',
    metadata: req.body,
    timestamp: new Date().toISOString()
  });
  res.json({ settings: updated });
});

apiRouter.post('/admin/retention/purge', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = db.purgeExpiredLogs();
  db.logAdminAudit({
    auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'PURGE_RETENTION_LOGS',
    targetType: 'SYSTEM',
    metadata: result,
    timestamp: new Date().toISOString()
  });
  res.json({ message: 'Retention purge executed successfully', result });
});
