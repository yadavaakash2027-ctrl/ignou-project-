export interface InsForgeStudentData {
  id: string;
  name: string;
  email: string;
  enrollmentNumber?: string;
  mobileNumber?: string;
  program?: string;
  courseYear?: string;
  studyCenterCode?: string;
  role?: string;
  accountStatus?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const INSFORGE_PROJECT_URL =
  process.env.INSFORGE_PROJECT_URL || 'https://8u4grv85.us-east.insforge.app';
const INSFORGE_API_KEY =
  process.env.INSFORGE_API_KEY || 'ik_ab342d052f85b71cccb25e52cd8f81a1';

function sanitizeSqlString(val: string | null | undefined): string {
  if (val === null || val === undefined) return "''";
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Execute raw SQL query against the InsForge PostgreSQL database
 */
export async function executeInsForgeSql(query: string): Promise<{ rows: any[]; rowCount?: number; error?: string }> {
  try {
    const endpoint = `${INSFORGE_PROJECT_URL.replace(/\/$/, '')}/api/database/advance/rawsql`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INSFORGE_API_KEY}`,
        apikey: INSFORGE_API_KEY
      },
      body: JSON.stringify({ query })
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('[InsForge SQL Error]:', response.status, rawText);
      return { rows: [], error: rawText || `HTTP ${response.status}` };
    }

    if (!rawText || !rawText.trim()) {
      return { rows: [], rowCount: 0 };
    }

    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      console.warn('[InsForge Parse Warning]:', parseErr.message, 'Raw text:', rawText);
      return { rows: [], rowCount: 0, error: parseErr.message };
    }

    return { rows: data.rows || [], rowCount: data.rowCount };
  } catch (err: any) {
    console.error('[InsForge Request Failed]:', err?.message || err);
    return { rows: [], error: err?.message || 'Network error' };
  }
}

/**
 * Ensures the 'students' table exists on the InsForge project with all required columns
 * for storing mobile number, email ID, enrollment number, name, and program.
 */
export async function initInsForgeDatabase(): Promise<boolean> {
  const schemaQuery = `
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      enrollment_number VARCHAR(100),
      "enrollmentNumber" VARCHAR(100),
      mobile_number VARCHAR(50),
      "mobileNumber" VARCHAR(50),
      program VARCHAR(100) DEFAULT 'IGNOU',
      course_year VARCHAR(50) DEFAULT '1st Year',
      study_center_code VARCHAR(50) DEFAULT 'SC-0700',
      role VARCHAR(50) DEFAULT 'student',
      account_status VARCHAR(50) DEFAULT 'ACTIVE',
      last_login_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email ON students (LOWER(email));
    CREATE UNIQUE INDEX IF NOT EXISTS idx_students_enrollment ON students (UPPER(enrollment_number));
    GRANT ALL ON students TO anon, authenticated, postgres;
  `;

  const res = await executeInsForgeSql(schemaQuery);
  if (!res.error) {
    console.log('[InsForge] Database table "students" initialized successfully on project', INSFORGE_PROJECT_URL);
    return true;
  } else {
    console.warn('[InsForge] Table initialization note:', res.error);
    return false;
  }
}

/**
 * Stores a student record into the InsForge PostgreSQL database
 * Specifically saves:
 * - मोबाइल नंबर (mobile number)
 * - ईमेल आईडी (email ID)
 * - एनरोलमेंट नंबर (enrollment number)
 * - नाम (name)
 * along with program and audit timestamps.
 */
export async function storeStudentInInsForge(student: InsForgeStudentData): Promise<boolean> {
  try {
    const cleanId = student.id;
    const cleanName = student.name.trim();
    const cleanEmail = student.email.trim().toLowerCase();
    const cleanEnrollment = (student.enrollmentNumber || '').trim().toUpperCase();
    const cleanMobile = (student.mobileNumber || '').trim();
    const cleanProgram = (student.program || 'IGNOU').trim();
    const cleanCourseYear = (student.courseYear || '1st Year').trim();
    const cleanStudyCenter = (student.studyCenterCode || 'SC-0700').trim();
    const cleanRole = (student.role || 'student').trim();
    const cleanStatus = (student.accountStatus || 'ACTIVE').trim();
    const nowIso = new Date().toISOString();

    const upsertSql = `
      INSERT INTO students (
        id,
        name,
        email,
        enrollment_number,
        "enrollmentNumber",
        mobile_number,
        "mobileNumber",
        program,
        course_year,
        study_center_code,
        role,
        account_status,
        last_login_at,
        created_at,
        updated_at
      ) VALUES (
        ${sanitizeSqlString(cleanId)},
        ${sanitizeSqlString(cleanName)},
        ${sanitizeSqlString(cleanEmail)},
        ${sanitizeSqlString(cleanEnrollment)},
        ${sanitizeSqlString(cleanEnrollment)},
        ${sanitizeSqlString(cleanMobile)},
        ${sanitizeSqlString(cleanMobile)},
        ${sanitizeSqlString(cleanProgram)},
        ${sanitizeSqlString(cleanCourseYear)},
        ${sanitizeSqlString(cleanStudyCenter)},
        ${sanitizeSqlString(cleanRole)},
        ${sanitizeSqlString(cleanStatus)},
        ${sanitizeSqlString(student.lastLoginAt || nowIso)},
        ${sanitizeSqlString(student.createdAt || nowIso)},
        ${sanitizeSqlString(nowIso)}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        enrollment_number = EXCLUDED.enrollment_number,
        "enrollmentNumber" = EXCLUDED."enrollmentNumber",
        mobile_number = EXCLUDED.mobile_number,
        "mobileNumber" = EXCLUDED."mobileNumber",
        program = EXCLUDED.program,
        course_year = EXCLUDED.course_year,
        study_center_code = EXCLUDED.study_center_code,
        role = EXCLUDED.role,
        account_status = EXCLUDED.account_status,
        last_login_at = EXCLUDED.last_login_at,
        updated_at = NOW();
    `;

    const res = await executeInsForgeSql(upsertSql);
    if (!res.error) {
      console.log(`[InsForge] Successfully stored student in database: ${cleanName} (${cleanEnrollment} / ${cleanEmail})`);
      return true;
    } else {
      // If conflict on email or enrollment with a different ID, update the existing row
      if (res.error.includes('duplicate key') || res.error.includes('DATABASE_DUPLICATE')) {
        const updateSql = `
          UPDATE students SET
            name = ${sanitizeSqlString(cleanName)},
            mobile_number = ${sanitizeSqlString(cleanMobile)},
            "mobileNumber" = ${sanitizeSqlString(cleanMobile)},
            program = ${sanitizeSqlString(cleanProgram)},
            course_year = ${sanitizeSqlString(cleanCourseYear)},
            study_center_code = ${sanitizeSqlString(cleanStudyCenter)},
            role = ${sanitizeSqlString(cleanRole)},
            account_status = ${sanitizeSqlString(cleanStatus)},
            last_login_at = ${sanitizeSqlString(student.lastLoginAt || nowIso)},
            updated_at = NOW()
          WHERE LOWER(email) = ${sanitizeSqlString(cleanEmail)} OR (enrollment_number != '' AND UPPER(enrollment_number) = ${sanitizeSqlString(cleanEnrollment)});
        `;
        const updateRes = await executeInsForgeSql(updateSql);
        if (!updateRes.error) {
          console.log(`[InsForge] Updated existing student by email/enrollment: ${cleanName} (${cleanEnrollment} / ${cleanEmail})`);
          return true;
        }
      }
      console.error(`[InsForge] Failed to store student ${cleanId}:`, res.error);
      return false;
    }
  } catch (err: any) {
    console.error(`[InsForge Store Error]:`, err?.message || err);
    return false;
  }
}

/**
 * Sync all students from local state to InsForge
 */
export async function syncAllStudentsToInsForge(students: InsForgeStudentData[]): Promise<{ total: number; synced: number }> {
  let synced = 0;
  for (const stu of students) {
    const ok = await storeStudentInInsForge(stu);
    if (ok) synced++;
  }
  return { total: students.length, synced };
}

/**
 * Fetch total count and latest students directly from InsForge database
 */
export async function getInsForgeDatabaseStatus(): Promise<{
  connected: boolean;
  projectUrl: string;
  totalStudents: number;
  recentStudents: any[];
  error?: string;
}> {
  try {
    const countRes = await executeInsForgeSql('SELECT COUNT(*) as count FROM students;');
    if (countRes.error) {
      return {
        connected: false,
        projectUrl: INSFORGE_PROJECT_URL,
        totalStudents: 0,
        recentStudents: [],
        error: countRes.error
      };
    }

    const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);
    const recentRes = await executeInsForgeSql('SELECT id, name, email, enrollment_number, mobile_number, program, created_at FROM students ORDER BY created_at DESC LIMIT 20;');

    return {
      connected: true,
      projectUrl: INSFORGE_PROJECT_URL,
      totalStudents: totalCount,
      recentStudents: recentRes.rows || []
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: INSFORGE_PROJECT_URL,
      totalStudents: 0,
      recentStudents: [],
      error: err?.message || 'Connection failed'
    };
  }
}
