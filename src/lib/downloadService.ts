import { getAuthToken, buildApiUrl } from './api';

export interface DownloadOptions {
  projectId: string;
  fileType: 'pdf' | 'docx';
  courseCode?: string;
  topicTitle?: string;
  enrollmentNumber?: string;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Executes a secure project file download with stored token and error handling
 */
export async function downloadProjectFile(options: DownloadOptions): Promise<void> {
  const { projectId, fileType, courseCode = 'PROJECT', enrollmentNumber, onStart, onSuccess, onError } = options;

  onStart?.();

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please log in to download project files.');
    }

    const url = buildApiUrl(`/projects/${projectId}/download/${fileType}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMsg = `Download failed (HTTP ${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } catch {
        // Not JSON
      }
      throw new Error(errorMsg);
    }

    // Success - trigger file save
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const safeEnrollment = enrollmentNumber || 'STUDENT';
    const filename = `IGNOU_${courseCode}_${safeEnrollment}.${fileType}`;

    downloadAnchor.href = blobUrl;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    window.URL.revokeObjectURL(blobUrl);

    onSuccess?.();
  } catch (err: any) {
    console.error('Download error:', err);
    onError?.(err instanceof Error ? err : new Error(err.message || 'Download failed'));
    throw err;
  }
}
