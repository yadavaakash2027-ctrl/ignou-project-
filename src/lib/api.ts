/**
 * IGNOU Project Hub API Client
 * Centralized, safe HTTP client with automatic auth token inclusion
 * and resilient HTML response interception to prevent 'Unexpected token <' parsing errors.
 */

import { FALLBACK_PROGRAMS, FALLBACK_SUBJECTS, FALLBACK_TOPICS } from './fallbackData';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Support custom API base url if configured in environment, defaulting to '/api'
const metaEnv = (import.meta as any).env || {};
const API_BASE_URL = (metaEnv.VITE_API_URL || metaEnv.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('ignou_auth_token');
  } catch {
    return null;
  }
}

export async function getFreshOrStoredAuthToken(): Promise<string | null> {
  return getAuthToken();
}

export function buildApiUrl(endpoint: string): string {
  // If endpoint is already a full URL, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If endpoint already starts with /api and API_BASE_URL is /api, avoid /api/api
  if (cleanPath.startsWith('/api/') && API_BASE_URL === '/api') {
    return cleanPath;
  }
  if (cleanPath.startsWith('/api') && API_BASE_URL === '/api') {
    return cleanPath;
  }

  return `${API_BASE_URL}${cleanPath}`;
}

function getStaticCatalogFallback(endpoint: string): any | null {
  const clean = endpoint.replace(/^\/api\//, '/').replace(/^\//, '');
  if (clean === 'programs' || clean.startsWith('programs')) {
    return { programs: FALLBACK_PROGRAMS };
  }
  if (clean === 'subjects' || clean.startsWith('subjects')) {
    return { subjects: FALLBACK_SUBJECTS };
  }
  if (clean === 'topics' || clean.startsWith('topics')) {
    return { topics: FALLBACK_TOPICS };
  }
  if (clean === 'projects' || clean === 'projects/') {
    return { projects: [] };
  }
  return null;
}

export async function safeFetch<T = any>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean } = {}
): Promise<{ data: T; ok: boolean; status: number; error?: string }> {
  const url = buildApiUrl(endpoint);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include student profile fallback headers if available
  try {
    const cachedProfile = localStorage.getItem('ignou_student_profile');
    if (cachedProfile) {
      const parsed = JSON.parse(cachedProfile);
      if (parsed.id && !headers['x-student-id']) headers['x-student-id'] = parsed.id;
      if (parsed.email && !headers['x-user-email']) headers['x-user-email'] = parsed.email;
    }
  } catch {}

  // Only set Content-Type to application/json if body is not FormData or already specified
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // If server refreshed the auth token, update it immediately in localStorage
    const refreshedToken = response.headers.get('x-refreshed-token');
    if (refreshedToken) {
      try {
        localStorage.setItem('ignou_auth_token', refreshedToken);
      } catch {}
    }

    const contentType = response.headers.get('content-type') || '';
    
    // If the response is JSON, parse and inspect it first
    if (contentType.includes('application/json')) {
      let parsedData: any;
      try {
        parsedData = await response.json();
      } catch {
        parsedData = null;
      }

      if (response.ok) {
        return {
          data: parsedData as T,
          ok: true,
          status: response.status
        };
      }

      // If 401 unauthorized due to expired token and not already retrying, attempt transparent refresh
      if (response.status === 401 && !options._isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-session')) {
        try {
          const cachedProfileStr = localStorage.getItem('ignou_student_profile');
          if (cachedProfileStr) {
            const cachedProfile = JSON.parse(cachedProfileStr);
            const refreshRes = await fetch(buildApiUrl('/auth/refresh-session'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                studentId: cachedProfile.id,
                email: cachedProfile.email,
                enrollmentNumber: cachedProfile.enrollmentNumber,
                token
              })
            });

            if (refreshRes.ok) {
              const refreshJson = await refreshRes.json();
              if (refreshJson.token) {
                localStorage.setItem('ignou_auth_token', refreshJson.token);
                // Retry the original request with the fresh token
                return await safeFetch<T>(endpoint, {
                  ...options,
                  _isRetry: true,
                  headers: {
                    ...headers,
                    Authorization: `Bearer ${refreshJson.token}`
                  }
                });
              }
            }
          }
        } catch {
          // If refresh attempt fails, proceed with standard error response
        }
      }

      // If not ok (e.g. 400, 401, 403, 404)
      const fallback = getStaticCatalogFallback(endpoint);
      if (fallback && response.status === 404) {
        return {
          data: fallback as T,
          ok: true,
          status: 200
        };
      }

      return {
        data: parsedData,
        ok: false,
        status: response.status,
        error: parsedData?.error || parsedData?.message || `Request failed with status ${response.status}`
      };
    }

    // If the response returned HTML (e.g. static SPA host or incorrect routing)
    if (contentType.includes('text/html')) {
      const fallback = getStaticCatalogFallback(endpoint);
      if (fallback) {
        return {
          data: fallback as T,
          ok: true,
          status: 200
        };
      }

      const htmlText = await response.text();
      const isDocType = htmlText.trim().toLowerCase().startsWith('<!doctype') || htmlText.includes('<html');
      const errorMsg = isDocType
        ? `API endpoint '${endpoint}' returned HTML (SPA router fallback).`
        : `Server returned status ${response.status}`;

      return {
        data: null as any,
        ok: false,
        status: response.status,
        error: errorMsg
      };
    }

    // Try text or generic parse
    let parsedData: any;
    try {
      parsedData = await response.json();
    } catch {
      const text = await response.text();
      parsedData = { text };
    }

    if (!response.ok) {
      const fallback = getStaticCatalogFallback(endpoint);
      if (fallback && response.status === 404) {
        return {
          data: fallback as T,
          ok: true,
          status: 200
        };
      }
      return {
        data: parsedData,
        ok: false,
        status: response.status,
        error: parsedData?.error || parsedData?.message || `Request failed with status ${response.status}`
      };
    }

    return {
      data: parsedData,
      ok: true,
      status: response.status
    };
  } catch (netErr: any) {
    const fallback = getStaticCatalogFallback(endpoint);
    if (fallback) {
      return {
        data: fallback as T,
        ok: true,
        status: 200
      };
    }
    return {
      data: null as any,
      ok: false,
      status: 0,
      error: netErr?.message || 'Network connection failed'
    };
  }
}


export const safeGet = <T = any>(endpoint: string, headers?: Record<string, string>) =>
  safeFetch<T>(endpoint, { method: 'GET', headers });

export const safePost = <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
  safeFetch<T>(endpoint, {
    method: 'POST',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers
  });

export const safePut = <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
  safeFetch<T>(endpoint, {
    method: 'PUT',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers
  });

export const safePatch = <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
  safeFetch<T>(endpoint, {
    method: 'PATCH',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers
  });

export const safeDelete = <T = any>(endpoint: string, headers?: Record<string, string>) =>
  safeFetch<T>(endpoint, { method: 'DELETE', headers });

export const api = {
  get: safeGet,
  post: safePost,
  put: safePut,
  patch: safePatch,
  delete: safeDelete
};
