import { db } from './db';
import { AcademicEngine } from './academicEngine';
import { ProjectRecord, ChapterContent, ProjectContext } from '../src/types';

export class ProjectChaptersService {
  /**
   * Retrieves the generated chapters for a project as the SINGLE SOURCE OF TRUTH.
   * 1. If the chapters exist on disk in data/chapters/${projectId}.json, returns them directly.
   * 2. If not yet cached, generates the standard academic chapters, saves them to disk,
   *    and returns them.
   */
  static async getOrGenerateChapters(project: ProjectRecord): Promise<ChapterContent[]> {
    if (!project || !project.projectId) {
      throw new Error('Valid ProjectRecord with projectId is required to retrieve chapters');
    }

    const existing = db.getProjectChapters(project.projectId);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }

    // Build academic project context from the project record
    const context: ProjectContext = {
      projectId: project.projectId,
      studentId: project.studentId,
      studentName: project.studentName,
      enrollmentNumber: project.enrollmentNumber,
      program: project.program,
      courseCode: project.courseCode,
      subjectName: project.subjectName,
      topicTitle: project.topicTitle,
      topicDescription: project.topicDescription,
      studyCenterCode: project.studyCenterCode || 'SC-0700',
      guideName: project.guideName || 'Dr. S. K. Mukherjee, Associate Professor',
      year: '2025-2026',
      focusAreas: project.focusAreas || []
    };

    const chapters = await AcademicEngine.generateStandardChapters(context);
    db.saveProjectChapters(project.projectId, chapters);
    return chapters;
  }

  /**
   * Retrieves cached chapters if present without triggering generation
   */
  static getChaptersForProject(projectId: string): ChapterContent[] | null {
    return db.getProjectChapters(projectId);
  }

  /**
   * Resolves the authoritative ProjectRecord from various query params
   */
  static findProject(query: {
    projectId?: string;
    topicId?: string;
    studentId?: string;
    courseCode?: string;
    program?: string;
  }): ProjectRecord | undefined {
    const projects = db.getProjects();

    // 1. By explicit projectId
    if (query.projectId) {
      const byId = projects.find((p) => p.projectId === query.projectId);
      if (byId) return byId;
    }

    // 2. By topicId + studentId (exact student reservation)
    if (query.topicId && query.studentId) {
      const byTopicStudent = projects.find((p) => p.topicId === query.topicId && p.studentId === query.studentId);
      if (byTopicStudent) return byTopicStudent;
    }

    // 3. By topicId
    if (query.topicId) {
      const byTopic = projects.find((p) => p.topicId === query.topicId);
      if (byTopic) return byTopic;
    }

    // 4. By studentId + courseCode
    if (query.studentId && query.courseCode) {
      const byStudentCourse = projects.find(
        (p) => p.studentId === query.studentId && p.courseCode.toLowerCase() === query.courseCode!.toLowerCase()
      );
      if (byStudentCourse) return byStudentCourse;
    }

    // 5. By studentId alone (latest ready project)
    if (query.studentId) {
      const studentProjects = projects.filter((p) => p.studentId === query.studentId);
      if (studentProjects.length > 0) {
        return studentProjects[0];
      }
    }

    return undefined;
  }
}
