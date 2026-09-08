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
import { SynopsisEngine } from './synopsisEngine';
import { SynopsisPDFGenerator } from './synopsisPdfGenerator';
import { SynopsisDocxGenerator } from './synopsisDocxGenerator';
import { getInsForgeDatabaseStatus, syncAllStudentsToInsForge, storeStudentInInsForge } from './insforge';
import { ProjectRecord, OrderRecord, SessionRecord, ActivityLog, AccountStatus, ProjectContext, Student, SynopsisData } from '../src/types';

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

    const cleanEmail = email.trim().toLowerCase();
    const cleanEnroll = enrollmentNumber.trim().toUpperCase();

    const existingByEmail = db.getStudentByEmail(cleanEmail);
    const existingByEnroll = db.getStudentByEnrollment(cleanEnroll);
    const existingStudent = existingByEmail || existingByEnroll;

    if (existingStudent) {
      // Check if password matches or student provides matching enrollment and email
      const matchesBoth =
        existingStudent.email.toLowerCase() === cleanEmail &&
        existingStudent.enrollmentNumber.toUpperCase() === cleanEnroll;

      const passwordCorrect = db.verifyPassword(existingStudent.id, password);

      if (passwordCorrect || matchesBoth) {
        // Direct login for this student!
        if (!passwordCorrect && matchesBoth) {
          // Update password to the new one provided by the student
          db.updatePassword(existingStudent.id, password);
        }

        db.updateStudent(existingStudent.id, {
          name: name?.trim() || existingStudent.name,
          mobileNumber: mobileNumber?.trim() || existingStudent.mobileNumber,
          program: program?.trim() || existingStudent.program,
          lastLoginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        });

        const refreshedStudent = db.getStudentById(existingStudent.id) || existingStudent;
        const nowIso = new Date().toISOString();
        const uaInfo = parseUserAgent(req.headers['user-agent']);
        const sessionId = `sess_${crypto.randomUUID().slice(0, 10)}`;
        const session: SessionRecord = {
          sessionId,
          studentId: refreshedStudent.id,
          studentName: refreshedStudent.name,
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

        db.logActivity({
          activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
          studentId: refreshedStudent.id,
          studentName: refreshedStudent.name,
          eventType: 'LOGIN',
          description: `Direct login via registration form on ${uaInfo.browser} (${uaInfo.operatingSystem}).`,
          timestamp: nowIso,
          sessionId
        });

        const token = AuthService.createToken(refreshedStudent.id, refreshedStudent.role, sessionId, refreshedStudent.email);
        return res.status(200).json({
          message: 'Direct login successful! Welcome back.',
          token,
          sessionId,
          user: refreshedStudent
        });
      } else {
        if (existingByEmail && existingByEnroll && existingByEmail.id !== existingByEnroll.id) {
          return res.status(400).json({
            error: 'This email and enrollment number belong to different accounts. Please verify your details.'
          });
        }
        return res.status(400).json({
          error: 'An account with this email or enrollment number already exists. Please verify your password to login directly.'
        });
      }
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

    const token = AuthService.createToken(newStudent.id, newStudent.role, sessionId, newStudent.email);
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

    const token = AuthService.createToken(student.id, student.role, sessionId, student.email);
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
          (query.toLowerCase() === 'aakashyadav2024@gmail.com' && s.email.toLowerCase() === 'aakashyadav2024@gmail.com') ||
          (query.toLowerCase() === 'admin' && s.id === 'admin_root') ||
          s.enrollmentNumber.toLowerCase() === query.toLowerCase())
    );

    // Fallback: if query is aakashyadav2024@gmail.com or admin but admin record is not found, use admin_root
    if (!admin && (query.toLowerCase() === 'aakashyadav2024@gmail.com' || query.toLowerCase() === 'admin' || query.toLowerCase() === 'yadavaakash2027@gmail.com')) {
      admin = db.getStudents().find((s) => s.id === 'admin_root' || s.role === 'admin');
    }

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

    const token = AuthService.createToken(admin.id, admin.role, sessionId, admin.email);
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

apiRouter.post('/auth/refresh-session', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    const { studentId, email, enrollmentNumber } = req.body || {};

    let student: Student | undefined;

    // 1. Try resolving token if provided
    if (token) {
      const session = await AuthService.verifyTokenAsync(token);
      if (session?.studentId) {
        student = db.getStudentById(session.studentId);
      }
      if (!student && session?.email) {
        student = db.getStudentByEmail(session.email);
      }
    }

    // 2. Try student ID
    if (!student && studentId) {
      student = db.getStudentById(studentId);
    }

    // 3. Try email
    if (!student && email) {
      student = db.getStudentByEmail(email);
    }

    // 4. Try enrollment number
    if (!student && enrollmentNumber) {
      student = db.getStudentByEnrollment(enrollmentNumber);
    }

    // 5. Check if user is known admin email
    const reqEmail = (email || '').toLowerCase();
    if (!student && (reqEmail === 'yadavaakash2027@gmail.com' || reqEmail === 'aakashyadav2024@gmail.com')) {
      student = db.getStudents().find((s) => s.role === 'admin' || s.id === 'admin_root');
    }

    if (!student) {
      return res.status(401).json({
        error: 'No active profile could be resolved. Please log in.',
        code: 'auth/refresh-failed'
      });
    }

    if (student.accountStatus === 'DISABLED' || student.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        error: `Account is ${student.accountStatus.toLowerCase()}.`,
        code: 'ACCOUNT_DISABLED'
      });
    }

    const sessionId = `sess_${crypto.randomUUID().slice(0, 10)}`;
    const newToken = AuthService.createToken(student.id, student.role, sessionId, student.email);

    res.json({
      success: true,
      token: newToken,
      sessionId,
      user: student
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to refresh session' });
  }
});

apiRouter.post('/auth/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = req.user!;
    const incoming = req.body.student || req.body;

    if (incoming && (incoming.id === student.id || student.role === 'admin')) {
      const targetId = incoming.id || student.id;
      const updated = db.updateStudent(targetId, {
        name: incoming.name || incoming.fullName || student.name,
        email: incoming.email || student.email,
        enrollmentNumber: incoming.enrollmentNumber || student.enrollmentNumber,
        mobileNumber: incoming.mobileNumber || student.mobileNumber,
        program: incoming.program || student.program,
        studyCenterCode: incoming.studyCenterCode || student.studyCenterCode,
        courseYear: incoming.courseYear || student.courseYear
      }) || student;

      return res.json({ success: true, user: updated });
    }

    res.json({ success: true, user: student });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync profile' });
  }
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

  // Auto-replenish if a specific subject or courseCode was requested
  if ((courseCode || subjectId) && (!status || status === 'AVAILABLE')) {
    try {
      TopicEngine.ensureTopicPool((courseCode || subjectId) as string, (program as string) || 'MBA');
    } catch {}
  }

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

// --- 5. DIRECT RESERVATION & UPI PAYMENT (NO PAYMENT GATEWAY) ---

// 5a. Gateway-Free Direct Reservation & Generation
apiRouter.post('/payment/direct-reserve', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseCode, topicId } = req.body;
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
      topic.status = 'RESERVED';
      topic.allocatedToStudentId = student.id;
      topic.reservedAt = new Date().toISOString();
      db.saveTopic(topic);
    }

    const subject = db.getSubject(topic.subjectId) || db.getSubject(topic.courseCode);
    const orderId = `ord_${crypto.randomUUID().slice(0, 10)}`;
    const projectId = `proj_${crypto.randomUUID().slice(0, 10)}`;

    // Create Order Record marked as PAID / DIRECT RESERVATION
    const order: OrderRecord = {
      orderId,
      studentId: student.id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      email: student.email,
      projectId,
      topicTitle: topic.title,
      courseCode: topic.courseCode,
      amount: 0,
      currency: 'INR',
      status: 'PAID',
      paymentMethod: 'DIRECT_RESERVATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveOrder(order);

    // Create Project Record with PAID status
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
      price: 0,
      orderId: order.orderId,
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveProject(project);

    // Trigger immediate background compilation pipeline
    const job = await GenerationCoordinator.startProjectGeneration(project.projectId);
    project.generationId = job.generationId;
    db.saveProject(project);

    // Log Activity
    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 8)}`,
      studentId: student.id,
      studentName: student.name,
      eventType: 'TOPIC_RESERVED',
      description: `Direct reservation confirmed for ${topic.courseCode} - "${topic.title}" (Gateway-Free).`,
      timestamp: new Date().toISOString(),
      projectId: project.projectId,
      orderId: order.orderId
    });

    res.json({
      message: 'Direct reservation confirmed and compilation started',
      orderId: order.orderId,
      projectId: project.projectId,
      order,
      project
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Direct reservation failed' });
  }
});

// 5b. Direct UPI Payment Submission (Scan QR & Enter UTR, no gateway)
apiRouter.post('/payment/submit-upi', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseCode, topicId, amount, utrNumber, screenshotUrl } = req.body;
    const student = req.user!;

    if (!utrNumber || utrNumber.trim().length < 6) {
      return res.status(400).json({ error: 'A valid 12-digit UPI Transaction Reference Number (UTR) is required.' });
    }

    let topic = topicId ? db.getTopic(topicId) : undefined;
    if (!topic || topic.status !== 'AVAILABLE') {
      const allocation = await TopicEngine.allocateTopic(student.id, courseCode, student.program);
      if (!allocation.success || !allocation.topic) {
        return res.status(400).json({
          error: allocation.message || 'No new project topic is currently available. Please contact the administrator.'
        });
      }
      topic = allocation.topic;
    } else {
      topic.status = 'RESERVED';
      topic.allocatedToStudentId = student.id;
      topic.reservedAt = new Date().toISOString();
      db.saveTopic(topic);
    }

    const subject = db.getSubject(topic.subjectId) || db.getSubject(topic.courseCode);
    const orderId = `ord_${crypto.randomUUID().slice(0, 10)}`;
    const projectId = `proj_${crypto.randomUUID().slice(0, 10)}`;
    const orderPrice = Number(amount) || 1499;

    const order: OrderRecord = {
      orderId,
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
      paymentMethod: 'UPI_DIRECT',
      utrNumber: utrNumber.trim(),
      screenshotUrl: screenshotUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveOrder(order);

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

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 8)}`,
      studentId: student.id,
      studentName: student.name,
      eventType: 'PAYMENT_SUBMITTED',
      description: `Submitted UPI Payment with UTR ${utrNumber.trim()} for ${topic.courseCode}.`,
      timestamp: new Date().toISOString(),
      projectId: project.projectId,
      orderId: order.orderId
    });

    res.json({
      message: 'UPI Payment details submitted successfully. Verification in progress.',
      orderId: order.orderId,
      projectId: project.projectId,
      order,
      project
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit UPI payment' });
  }
});

// 5c. Legacy/Fallback Direct Order creation (no gateway needed)
apiRouter.post('/payment/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseCode, topicId, amount } = req.body;
    const student = req.user!;

    let topic = topicId ? db.getTopic(topicId) : undefined;
    if (!topic || topic.status !== 'AVAILABLE') {
      const allocation = await TopicEngine.allocateTopic(student.id, courseCode, student.program);
      if (!allocation.success || !allocation.topic) {
        return res.status(400).json({
          error: allocation.message || 'No new project topic is currently available. Please contact the administrator.'
        });
      }
      topic = allocation.topic;
    } else {
      topic.status = 'RESERVED';
      topic.allocatedToStudentId = student.id;
      topic.reservedAt = new Date().toISOString();
      db.saveTopic(topic);
    }

    const subject = db.getSubject(topic.subjectId) || db.getSubject(topic.courseCode);
    const orderId = `ord_${crypto.randomUUID().slice(0, 10)}`;
    const projectId = `proj_${crypto.randomUUID().slice(0, 10)}`;
    const orderPrice = Number(amount) || 1499;

    const order: OrderRecord = {
      orderId,
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
      paymentMethod: 'DIRECT_RESERVATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveOrder(order);

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
      amount: order.amount,
      currency: order.currency,
      projectId: project.projectId,
      topic: topic
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment initiation failed' });
  }
});

// 5d. Direct Verification / Instant Unlock
apiRouter.post('/payment/verify', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    const student = req.user!;

    const order = db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    if (order.studentId !== student.id && student.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to order.' });
    }

    order.status = 'PAID';
    order.updatedAt = new Date().toISOString();
    db.saveOrder(order);

    const project = db.getProject(order.projectId);
    if (project) {
      project.paymentStatus = 'PAID';
      project.updatedAt = new Date().toISOString();

      const job = await GenerationCoordinator.startProjectGeneration(project.projectId);
      project.generationId = job.generationId;
      db.saveProject(project);
    }

    res.json({
      message: 'Reservation verified and project compilation started',
      order,
      project
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// 5e. Admin Order Approval & Rejection
apiRouter.post('/admin/orders/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.status = 'PAID';
    order.updatedAt = new Date().toISOString();
    db.saveOrder(order);

    let project = db.getProject(order.projectId);
    if (!project) {
      const topic = db.getTopic(order.projectId) || db.getTopics({ courseCode: order.courseCode })[0];
      project = {
        projectId: order.projectId,
        studentId: order.studentId,
        studentName: order.studentName,
        enrollmentNumber: order.enrollmentNumber,
        program: topic?.program || 'MBA',
        courseCode: order.courseCode,
        subjectId: topic?.subjectId || 'subj_01',
        subjectName: topic?.title || order.courseCode,
        topicId: topic?.id || 'top_custom',
        topicTitle: order.topicTitle,
        topicDescription: topic?.description || order.topicTitle,
        focusAreas: topic?.focusAreas || ['Analysis', 'Strategy'],
        generationId: '',
        status: 'QUEUED',
        pageCount: 0,
        wordCount: 0,
        pdfUrl: '',
        docxUrl: '',
        hasSynopsis: true,
        price: order.amount,
        orderId: order.orderId,
        paymentStatus: 'PAID',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.saveProject(project);
    } else {
      project.paymentStatus = 'PAID';
      project.updatedAt = new Date().toISOString();
      db.saveProject(project);
    }

    // Start generation if not already ready
    if (project.status !== 'READY') {
      const job = await GenerationCoordinator.startProjectGeneration(project.projectId);
      project.generationId = job.generationId;
      db.saveProject(project);
    }

    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'APPROVE_PAYMENT_ORDER',
      targetType: 'PAYMENT',
      targetId: order.orderId,
      metadata: {
        orderId: order.orderId,
        studentId: order.studentId,
        utrNumber: order.utrNumber,
        amount: order.amount
      },
      timestamp: new Date().toISOString()
    });

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 8)}`,
      studentId: order.studentId,
      studentName: order.studentName,
      eventType: 'PAYMENT_VERIFIED',
      description: `Payment order ${order.orderId} approved by Admin. Project generation unlocked.`,
      timestamp: new Date().toISOString(),
      projectId: project.projectId,
      orderId: order.orderId
    });

    res.json({ message: 'Order approved successfully', order, project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to approve order' });
  }
});

apiRouter.post('/admin/orders/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;
    const order = db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.status = 'REJECTED';
    order.rejectionReason = reason || 'Payment verification failed. Invalid UTR or unverified transaction.';
    order.updatedAt = new Date().toISOString();
    db.saveOrder(order);

    const project = db.getProject(order.projectId);
    if (project) {
      project.paymentStatus = 'FAILED';
      project.updatedAt = new Date().toISOString();
      db.saveProject(project);
    }

    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'REJECT_PAYMENT_ORDER',
      targetType: 'PAYMENT',
      targetId: order.orderId,
      metadata: {
        orderId: order.orderId,
        studentId: order.studentId,
        reason: order.rejectionReason
      },
      timestamp: new Date().toISOString()
    });

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 8)}`,
      studentId: order.studentId,
      studentName: order.studentName,
      eventType: 'PAYMENT_REJECTED',
      description: `Payment order ${order.orderId} rejected: ${order.rejectionReason}`,
      timestamp: new Date().toISOString(),
      projectId: order.projectId,
      orderId: order.orderId
    });

    res.json({ message: 'Order rejected', order });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject order' });
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
    let project = db.getProject(req.params.id);
    const student = req.user!;

    if (!project) {
      // Check if topic exists to generate dynamic project
      const topic = db.getTopic(req.params.id);
      if (topic) {
        project = {
          projectId: `proj_${topic.id}`,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description,
          courseCode: topic.courseCode,
          program: topic.program,
          subjectId: topic.subjectId || `subj_${topic.courseCode.toLowerCase()}`,
          subjectName: topic.title,
          studentId: student.id,
          studentName: student.name,
          enrollmentNumber: student.enrollmentNumber,
          studyCenterCode: student.studyCenterCode || 'SC-0700',
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.saveProject(project);
      } else {
        return res.status(404).json({ error: 'Project or topic not found.' });
      }
    }

    const effectiveStudentName = project.studentName || student.name || 'IGNOU Student';
    const effectiveEnrollment = project.enrollmentNumber || student.enrollmentNumber || 'IGNOU-2025';
    const filename = `IGNOU_Project_${project.courseCode}_${effectiveEnrollment}_${project.projectId.slice(0, 8)}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // Generate on demand if file is not on disk (e.g. serverless instance)
      const projectContext: ProjectContext = {
        projectId: project.projectId,
        studentName: effectiveStudentName,
        enrollmentNumber: effectiveEnrollment,
        program: project.program,
        courseCode: project.courseCode,
        subjectName: project.subjectName,
        topicTitle: project.topicTitle,
        topicDescription: project.topicDescription,
        studyCenterCode: project.studyCenterCode || student.studyCenterCode || 'SC-0700',
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
    let project = db.getProject(req.params.id);
    const student = req.user!;

    if (!project) {
      // Check if topic exists to generate dynamic project
      const topic = db.getTopic(req.params.id);
      if (topic) {
        project = {
          projectId: `proj_${topic.id}`,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description,
          courseCode: topic.courseCode,
          program: topic.program,
          subjectId: topic.subjectId || `subj_${topic.courseCode.toLowerCase()}`,
          subjectName: topic.title,
          studentId: student.id,
          studentName: student.name,
          enrollmentNumber: student.enrollmentNumber,
          studyCenterCode: student.studyCenterCode || 'SC-0700',
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.saveProject(project);
      } else {
        return res.status(404).json({ error: 'Project or topic not found.' });
      }
    }



    const effectiveStudentName = project.studentName || student.name || 'IGNOU Student';
    const effectiveEnrollment = project.enrollmentNumber || student.enrollmentNumber || 'IGNOU-2025';
    const filename = `IGNOU_Project_${project.courseCode}_${effectiveEnrollment}_${project.projectId.slice(0, 8)}.docx`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // Generate on demand if file is not on disk (e.g. serverless instance)
      const projectContext: ProjectContext = {
        projectId: project.projectId,
        studentName: effectiveStudentName,
        enrollmentNumber: effectiveEnrollment,
        program: project.program,
        courseCode: project.courseCode,
        subjectName: project.subjectName,
        topicTitle: project.topicTitle,
        topicDescription: project.topicDescription,
        studyCenterCode: project.studyCenterCode || student.studyCenterCode || 'SC-0700',
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

// --- 7B. SYNOPSIS GENERATION & MANAGEMENT API ---

// Generate Complete 16-Section IGNOU Synopsis
apiRouter.post('/synopsis/generate', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let student: Student | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenData = await AuthService.verifyTokenAsync(token);
      if (tokenData?.studentId) {
        student = db.getStudentById(tokenData.studentId) || null;
      }
    }

    const {
      program,
      courseCode,
      subjectName,
      projectTitle,
      researchTopic,
      topicId,
      projectId,
      studentName,
      enrollmentNumber,
      studyCenterCode,
      studyCenterName,
      regionalCenterCode,
      regionalCenterName,
      sessionYear,
      guideBioData,
      guideName,
      email,
      mobileNumber,
      projectType,
      projectDescription,
      preferredTechnologies,
      additionalRequirements
    } = req.body;

    if (!program || !courseCode || !projectTitle) {
      return res.status(400).json({ error: 'Program, Course Code, and Project Title are required to generate a synopsis.' });
    }

    const effectiveStudentName = studentName || student?.name || 'IGNOU Student';
    const effectiveEnrollment = enrollmentNumber || student?.enrollmentNumber || 'IGNOU-2025-XXXX';
    const effectiveStudyCenterCode = studyCenterCode || student?.studyCenterCode || 'SC-0700';
    const effectiveStudentId = student?.id || 'student_guest';

    // Generate complete 11-section official IGNOU synopsis
    const synopsis = await SynopsisEngine.generateSynopsis({
      projectId,
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      enrollmentNumber: effectiveEnrollment,
      program,
      courseCode,
      subjectName,
      projectTitle,
      researchTopic: researchTopic || projectTitle,
      topicId,
      studyCenterCode: effectiveStudyCenterCode,
      studyCenterName: studyCenterName || 'Regional Study Centre, IGNOU',
      regionalCenterCode: regionalCenterCode || 'RC-07',
      regionalCenterName: regionalCenterName || 'Delhi Regional Centre',
      sessionYear: sessionYear || '2025–2026',
      guideBioData,
      guideName,
      email: email || student?.email,
      mobileNumber: mobileNumber || student?.mobileNumber,
      projectType,
      projectDescription,
      preferredTechnologies,
      additionalRequirements
    });

    // Save in DB
    db.saveSynopsis(synopsis);

    // Pre-generate PDF & DOCX in background
    Promise.all([
      SynopsisPDFGenerator.generateSynopsisPDF(synopsis).catch((e) => console.warn('PDF pre-gen warning:', e.message)),
      SynopsisDocxGenerator.generateSynopsisDocx(synopsis).catch((e) => console.warn('DOCX pre-gen warning:', e.message))
    ]).catch(() => {});

    if (student) {
      db.logActivity({
        activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
        studentId: student.id,
        studentName: student.name,
        eventType: 'SYNOPSIS_GENERATED',
        description: `Generated IGNOU ${program} Project Proposal Synopsis for "${projectTitle.slice(0, 50)}..."`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({ synopsis });
  } catch (err: any) {
    console.error('Synopsis generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate synopsis proposal.' });
  }
});

// Get Student's Synopses
apiRouter.get('/synopsis/my-synopses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const student = req.user!;
  const filters: any = {};
  if (student.role !== 'admin') {
    filters.studentId = student.id;
  }
  if (req.query.courseCode) {
    filters.courseCode = req.query.courseCode as string;
  }
  const synopses = db.getSynopses(filters);
  res.json({ synopses });
});

// Get Single Synopsis by ID (or synthesize from Project / Topic ID)
apiRouter.get('/synopsis/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let synopsis = db.getSynopsis(id);

    if (!synopsis) {
      // Check if project exists
      const project = db.getProject(id);
      if (project) {
        synopsis = await SynopsisEngine.generateSynopsis({
          id: `syn_${project.projectId}`,
          projectId: project.projectId,
          studentId: project.studentId,
          studentName: project.studentName,
          enrollmentNumber: project.enrollmentNumber,
          program: project.program,
          courseCode: project.courseCode,
          subjectName: project.subjectName,
          projectTitle: project.topicTitle,
          researchTopic: project.topicDescription || project.topicTitle,
          topicId: project.topicId,
          studyCenterCode: project.studyCenterCode || 'SC-0700'
        });
        db.saveSynopsis(synopsis);
      } else {
        const topic = db.getTopic(id);
        if (topic) {
          synopsis = await SynopsisEngine.generateSynopsis({
            id: `syn_${topic.id}`,
            studentId: 'student_guest',
            studentName: 'IGNOU Student',
            enrollmentNumber: 'IGNOU-2025',
            program: topic.program,
            courseCode: topic.courseCode,
            subjectName: topic.title,
            projectTitle: topic.title,
            researchTopic: topic.description,
            topicId: topic.id,
            studyCenterCode: 'SC-0700'
          });
          db.saveSynopsis(synopsis);
        }
      }
    }

    if (!synopsis) {
      return res.status(404).json({ error: 'Synopsis not found.' });
    }

    res.json({ synopsis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve synopsis' });
  }
});

// Update / Edit Synopsis (e.g. edit Guide Bio-Data, Objectives, Scope, etc.)
apiRouter.put('/synopsis/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existing = db.getSynopsis(id);
    if (!existing) {
      return res.status(404).json({ error: 'Synopsis record not found.' });
    }

    const updates = req.body;
    const updatedSynopsis: SynopsisData = {
      ...existing,
      ...updates,
      id: existing.id,
      coverPage: {
        ...existing.coverPage,
        ...(updates.coverPage || {})
      },
      guideBioData: {
        ...existing.guideBioData,
        ...(updates.guideBioData || {})
      },
      updatedAt: new Date().toISOString()
    };

    db.saveSynopsis(updatedSynopsis);

    // Rebuild PDF & DOCX in background
    Promise.all([
      SynopsisPDFGenerator.generateSynopsisPDF(updatedSynopsis).catch((e) => console.warn('PDF update err:', e.message)),
      SynopsisDocxGenerator.generateSynopsisDocx(updatedSynopsis).catch((e) => console.warn('DOCX update err:', e.message))
    ]).catch(() => {});

    res.json({ synopsis: updatedSynopsis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update synopsis' });
  }
});

// Regenerate Individual Section
apiRouter.post('/synopsis/:id/regenerate-section', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { sectionKey, instructions } = req.body;

    const existing = db.getSynopsis(id);
    if (!existing) {
      return res.status(404).json({ error: 'Synopsis not found.' });
    }

    if (!sectionKey) {
      return res.status(400).json({ error: 'Section key is required to regenerate.' });
    }

    const regenerated = await SynopsisEngine.regenerateSection(existing, sectionKey, instructions);
    db.saveSynopsis(regenerated);

    // Rebuild PDF & DOCX
    Promise.all([
      SynopsisPDFGenerator.generateSynopsisPDF(regenerated).catch((e) => console.warn('PDF regen err:', e.message)),
      SynopsisDocxGenerator.generateSynopsisDocx(regenerated).catch((e) => console.warn('DOCX regen err:', e.message))
    ]).catch(() => {});

    res.json({ synopsis: regenerated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to regenerate section' });
  }
});

// Download Synopsis PDF
apiRouter.get('/synopsis/:id/download/pdf', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let synopsis = db.getSynopsis(id);

    if (!synopsis) {
      // Try resolving by project or topic
      const project = db.getProject(id);
      if (project) {
        synopsis = await SynopsisEngine.generateSynopsis({
          id: `syn_${project.projectId}`,
          projectId: project.projectId,
          studentName: project.studentName,
          enrollmentNumber: project.enrollmentNumber,
          program: project.program,
          courseCode: project.courseCode,
          subjectName: project.subjectName,
          projectTitle: project.topicTitle,
          researchTopic: project.topicDescription || project.topicTitle
        });
        db.saveSynopsis(synopsis);
      } else {
        return res.status(404).json({ error: 'Synopsis proposal not found.' });
      }
    }

    const filename = `IGNOU_Synopsis_${synopsis.courseCode}_${synopsis.enrollmentNumber}_${synopsis.id.slice(0, 8)}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      await SynopsisPDFGenerator.generateSynopsisPDF(synopsis);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('Synopsis PDF download error:', err);
    res.status(500).json({ error: err.message || 'Failed to download synopsis PDF' });
  }
});

// Download Synopsis DOCX
apiRouter.get('/synopsis/:id/download/docx', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let synopsis = db.getSynopsis(id);

    if (!synopsis) {
      const project = db.getProject(id);
      if (project) {
        synopsis = await SynopsisEngine.generateSynopsis({
          id: `syn_${project.projectId}`,
          projectId: project.projectId,
          studentName: project.studentName,
          enrollmentNumber: project.enrollmentNumber,
          program: project.program,
          courseCode: project.courseCode,
          subjectName: project.subjectName,
          projectTitle: project.topicTitle,
          researchTopic: project.topicDescription || project.topicTitle
        });
        db.saveSynopsis(synopsis);
      } else {
        return res.status(404).json({ error: 'Synopsis proposal not found.' });
      }
    }

    const filename = `IGNOU_Synopsis_${synopsis.courseCode}_${synopsis.enrollmentNumber}_${synopsis.id.slice(0, 8)}.docx`;
    const filePath = path.join(STORAGE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      await SynopsisDocxGenerator.generateSynopsisDocx(synopsis);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('Synopsis DOCX download error:', err);
    res.status(500).json({ error: err.message || 'Failed to download synopsis DOCX' });
  }
});
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

// Add / Store New Student Record in Admin Portal
apiRouter.post('/admin/students', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id,
      studentId,
      enrollmentNumber,
      email,
      mobileNumber,
      phoneNumber,
      name,
      fullName,
      program,
      courseYear,
      studyCenterCode,
      accountStatus,
      password
    } = req.body;

    const effectiveName = (name || fullName || '').trim();
    const effectiveEmail = (email || '').trim().toLowerCase();
    const effectiveEnrollment = (enrollmentNumber || '').trim().toUpperCase();
    const effectivePhone = (mobileNumber || phoneNumber || '').trim();
    const effectiveId = (studentId || id || `STU-${Date.now().toString().slice(-6)}`).trim();

    if (!effectiveName) {
      return res.status(400).json({ error: 'Student full name is required.' });
    }
    if (!effectiveEnrollment) {
      return res.status(400).json({ error: 'IGNOU Enrollment Number is required.' });
    }
    if (!effectiveEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!effectivePhone) {
      return res.status(400).json({ error: 'Phone number / mobile number is required.' });
    }

    // Check if enrollment or email already exists
    const existingEnroll = db.getStudentByEnrollment(effectiveEnrollment);
    if (existingEnroll) {
      return res.status(409).json({ error: `A student with Enrollment Number ${effectiveEnrollment} already exists.` });
    }

    const existingEmail = db.getStudentByEmail(effectiveEmail);
    if (existingEmail) {
      return res.status(409).json({ error: `A student with Email ${effectiveEmail} already exists.` });
    }

    const nowIso = new Date().toISOString();
    const newStudent: Student = {
      id: effectiveId,
      name: effectiveName,
      email: effectiveEmail,
      enrollmentNumber: effectiveEnrollment,
      mobileNumber: effectivePhone,
      program: program?.trim() || 'BCA',
      courseYear: courseYear?.trim() || '1st Year',
      studyCenterCode: studyCenterCode?.trim() || 'SC-0700',
      role: 'student',
      accountStatus: (accountStatus as AccountStatus) || 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      totalLoginCount: 0,
      totalSessionCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const initialPassword = password?.trim() || 'Student@123';
    db.createStudent(newStudent, initialPassword);

    // Audit log
    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'CREATE_STUDENT_RECORD',
      studentId: newStudent.id,
      studentName: newStudent.name,
      targetType: 'STUDENT',
      targetId: newStudent.id,
      metadata: {
        studentId: newStudent.id,
        enrollmentNumber: newStudent.enrollmentNumber,
        email: newStudent.email,
        mobileNumber: newStudent.mobileNumber,
        program: newStudent.program
      },
      timestamp: nowIso
    });

    db.logActivity({
      activityId: `act_${crypto.randomUUID().slice(0, 10)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      eventType: 'ACCOUNT_CREATED',
      description: `Student account manually provisioned by Administrator (${req.user!.name}).`,
      timestamp: nowIso
    });

    res.status(201).json({
      message: 'Student record created and saved successfully in portal repository.',
      student: newStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student record.' });
  }
});

// Update Student Profile
apiRouter.put('/admin/students/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, enrollmentNumber, mobileNumber, phoneNumber, program, courseYear, studyCenterCode, accountStatus } = req.body;
  const existing = db.getStudentById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const updated = db.updateStudent(req.params.id, {
    name: name?.trim() || existing.name,
    email: email?.trim() || existing.email,
    enrollmentNumber: enrollmentNumber?.trim() || existing.enrollmentNumber,
    mobileNumber: (mobileNumber || phoneNumber)?.trim() || existing.mobileNumber,
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

// Delete Student Record
apiRouter.delete('/admin/students/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const deleted = db.deleteStudent(student.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete student record from storage.' });
    }

    db.logAdminAudit({
      auditId: `audit_${crypto.randomUUID().slice(0, 8)}`,
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'DELETE_STUDENT_RECORD',
      studentId: student.id,
      studentName: student.name,
      targetType: 'STUDENT',
      targetId: student.id,
      metadata: { enrollmentNumber: student.enrollmentNumber, email: student.email },
      timestamp: new Date().toISOString()
    });

    res.json({ message: `Student ${student.name} (${student.enrollmentNumber}) removed from portal repository.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete student record.' });
  }
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

// InsForge Database status & student records endpoint
apiRouter.get('/insforge/status', async (req: Request, res: Response) => {
  const status = await getInsForgeDatabaseStatus();
  res.json(status);
});

apiRouter.post('/insforge/sync', async (req: Request, res: Response) => {
  const allStudents = db.getStudents();
  const syncResult = await syncAllStudentsToInsForge(allStudents);
  res.json({
    message: `Successfully synchronized ${syncResult.synced} of ${syncResult.total} students to InsForge PostgreSQL database`,
    ...syncResult
  });
});
