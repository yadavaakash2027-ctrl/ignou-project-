import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { Student } from '../src/types';

// In-memory token store (token -> { studentId, role, sessionId, expiresAt })
const tokenStore: Map<
  string,
  { studentId: string; role: 'student' | 'admin'; sessionId?: string; expiresAt: number }
> = new Map();

// Parse user agent to extract clean platform info
export function parseUserAgent(userAgent: string = '') {
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' = 'Desktop';
  let browser = 'Browser';
  let operatingSystem = 'Unknown OS';

  const ua = userAgent.toLowerCase();

  // Device
  if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
    deviceType = 'Tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // OS
  if (userAgent.includes('Windows NT 10.0') || userAgent.includes('Windows 11')) {
    operatingSystem = 'Windows 11/10';
  } else if (userAgent.includes('Windows')) {
    operatingSystem = 'Windows';
  } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    operatingSystem = 'macOS';
  } else if (userAgent.includes('Android')) {
    operatingSystem = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    operatingSystem = 'iOS';
  } else if (userAgent.includes('Linux')) {
    operatingSystem = 'Linux';
  }

  // Browser
  if (userAgent.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (userAgent.includes('Chrome/')) {
    browser = 'Google Chrome';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Apple Safari';
  }

  return { deviceType, browser, operatingSystem };
}

export class AuthService {
  static createToken(studentId: string, role: 'student' | 'admin', sessionId?: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    tokenStore.set(token, { studentId, role, sessionId, expiresAt });
    return token;
  }

  static verifyToken(token: string): { studentId: string; role: 'student' | 'admin'; sessionId?: string } | null {
    const session = tokenStore.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      tokenStore.delete(token);
      return null;
    }
    return session;
  }

  static revokeToken(token: string) {
    const session = tokenStore.get(token);
    if (session?.sessionId) {
      db.updateSession(session.sessionId, {
        status: 'LOGGED_OUT',
        logoutAt: new Date().toISOString()
      });
    }
    tokenStore.delete(token);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Student;
  sessionId?: string;
}

// Throttle last active updates in memory (userId -> timestamp ms)
const lastActiveThrottle: Map<string, number> = new Map();

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const session = AuthService.verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  const user = db.getStudentById(session.studentId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.accountStatus === 'DISABLED' || user.accountStatus === 'SUSPENDED') {
    return res.status(403).json({
      error: `Your account is currently ${user.accountStatus.toLowerCase()}. Please contact the administrator.`,
      accountStatus: user.accountStatus
    });
  }

  req.user = user;
  req.sessionId = session.sessionId;

  // Throttled activity tracking (every 60 seconds max)
  const now = Date.now();
  const lastTime = lastActiveThrottle.get(user.id) || 0;
  if (now - lastTime > 60000) {
    lastActiveThrottle.set(user.id, now);
    const nowIso = new Date(now).toISOString();
    db.updateStudent(user.id, { lastActiveAt: nowIso });
    if (session.sessionId) {
      db.updateSession(session.sessionId, { lastActiveAt: nowIso });
    }
  }

  next();
}

// Brute force protection: track failed login attempts by IP (IP -> { count, lockedUntil })
const loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (record.lockedUntil <= now && record.lockedUntil > 0) {
    loginAttempts.delete(ip);
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    // 5 minutes lockout after 5 consecutive failures
    record.lockedUntil = now + 5 * 60 * 1000;
  }

  loginAttempts.set(ip, record);
}

export function clearFailedLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({
        error: '403 — Admin Access Required. Administrator privileges required.',
        code: 'FORBIDDEN_ADMIN_REQUIRED'
      });
    }
    next();
  });
}

