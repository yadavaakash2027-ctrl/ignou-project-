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
  if (clean === 'programs') {
    return { programs: FALLBACK_PROGRAMS };
  }
  if (clean === 'subjects') {
    return { subjects: FALLBACK_SUBJECTS };
  }
  if (clean === 'topics') {
    return { topics: FALLBACK_TOPICS };
  }
  return null;
}

export async function safeFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; ok: boolean; status: number; error?: string }> {
  const url = buildApiUrl(endpoint);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to application/json if body is not FormData or already specified
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Check if the response returned an HTML document (e.g. Netlify fallback, GitHub Pages 404)
    if (contentType.includes('text/html') || response.status === 404) {
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
        ? `API endpoint '${endpoint}' returned HTML (likely static SPA host or incorrect routing).`
        : `Server returned status ${response.status}`;

      return {
        data: null as any,
        ok: false,
        status: response.status,
        error: errorMsg
      };
    }

    let parsedData: any;
    try {
      parsedData = await response.json();
    } catch (parseErr) {
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
        status: response.status,
        error: `Invalid JSON returned from server at ${endpoint}`
      };
    }

    if (!response.ok) {
      const fallback = getStaticCatalogFallback(endpoint);
      if (fallback) {
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

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    safeFetch<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    safeFetch<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers
    }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    safeFetch<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers
    }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    safeFetch<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers
    }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    safeFetch<T>(endpoint, { method: 'DELETE', headers })
};
