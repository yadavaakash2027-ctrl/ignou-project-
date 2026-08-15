import { db } from './db';
import { Topic, ProjectContext } from '../src/types';

// Mutex lock for atomic allocation
let isAllocating = false;

export class TopicEngine {
  /**
   * Atomically reserves an available topic for a student & subject
   */
  static async allocateTopic(
    studentId: string,
    courseCodeOrSubjectId: string,
    program: string
  ): Promise<{ success: boolean; topic?: Topic; message?: string }> {
    // Wait if another allocation is in flight
    while (isAllocating) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    isAllocating = true;
    try {
      // Find candidate subject
      const subject =
        db.getSubject(courseCodeOrSubjectId) ||
        db.getSubjects(program).find((s) => s.courseCode.toLowerCase() === courseCodeOrSubjectId.toLowerCase());

      if (!subject) {
        return {
          success: false,
          message: `Subject '${courseCodeOrSubjectId}' not found for program '${program}'.`
        };
      }

      // Query available topics for this subject
      const availableTopics = db.getTopics({
        subjectId: subject.id,
        status: 'AVAILABLE'
      });

      if (availableTopics.length === 0) {
        return {
          success: false,
          message: 'No new project topic is currently available. Please contact the administrator.'
        };
      }

      // Select first available topic
      const selectedTopic = availableTopics[0];

      // Mark as RESERVED atomically
      selectedTopic.status = 'RESERVED';
      selectedTopic.allocatedToStudentId = studentId;
      selectedTopic.reservedAt = new Date().toISOString();
      selectedTopic.updatedAt = new Date().toISOString();

      db.saveTopic(selectedTopic);

      return {
        success: true,
        topic: selectedTopic
      };
    } finally {
      isAllocating = false;
    }
  }

  /**
   * Finalizes a topic to USED after successful generation & 150+ page validation
   */
  static markTopicUsed(topicId: string, projectId: string) {
    const topic = db.getTopic(topicId);
    if (topic) {
      topic.status = 'USED';
      topic.allocatedToProjectId = projectId;
      topic.usedAt = new Date().toISOString();
      topic.updatedAt = new Date().toISOString();
      db.saveTopic(topic);
    }
  }

  /**
   * Releases a RESERVED topic back to AVAILABLE if generation failed or aborted
   */
  static releaseTopic(topicId: string) {
    const topic = db.getTopic(topicId);
    if (topic && topic.status === 'RESERVED') {
      topic.status = 'AVAILABLE';
      topic.allocatedToStudentId = undefined;
      topic.reservedAt = undefined;
      topic.updatedAt = new Date().toISOString();
      db.saveTopic(topic);
    }
  }
}
