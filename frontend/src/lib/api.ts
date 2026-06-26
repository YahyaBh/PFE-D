/**
 * API client helper for Marjane Wallet frontend.
 * Handles automatic token injection, silent refresh on 401, and idempotency key generation.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export { BASE_URL };

// Generate a random UUID v4 for idempotency keys
export function generateUUID(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch (e) {}
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface FetchOptions extends RequestInit {
  idempotencyKey?: string;
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function handleTokenRefresh(isAdmin = false): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const key = isAdmin ? 'admin_refresh' : 'refreshToken';
  const tokenKey = isAdmin ? 'admin_token' : 'token';
  const redirectUrl = isAdmin ? '/admin/login' : '/login?error=Session expired. Please sign in again.';

  const refreshToken = localStorage.getItem(key);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      localStorage.setItem(tokenKey, data.accessToken);
      localStorage.setItem(key, data.refreshToken);
      return data.accessToken;
    }
  } catch (err) {
    console.error('Failed to silently refresh session token:', err);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(key);
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }
  return null;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  // Setup headers
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Access Token
  if (!options.skipAuth && typeof window !== 'undefined') {
    const isAdminRoute = endpoint.startsWith('/admin/');
    const tokenKey = isAdminRoute ? 'admin_token' : 'token';
    const token = localStorage.getItem(tokenKey);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Inject Idempotency-Key for non-GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const key = options.idempotencyKey || generateUUID();
    headers.set('Idempotency-Key', key);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, attempt to rotate / refresh token silently
    if (response.status === 401 && !options.skipAuth && typeof window !== 'undefined') {
      const isAdminRoute = endpoint.startsWith('/admin/');
      const tokenKey = isAdminRoute ? 'admin_token' : 'token';
      const refreshKey = isAdminRoute ? 'admin_refresh' : 'refreshToken';
      const redirectUrl = isAdminRoute ? '/admin/login' : '/login?error=Session expired. Please sign in again.';

      if (!isRefreshing) {
        isRefreshing = true;
        const newAccessToken = await handleTokenRefresh(isAdminRoute);
        isRefreshing = false;
        
        if (newAccessToken) {
          onRefreshed(newAccessToken);
        }
      }

      // Wait for refresh token processing if concurrent requests are running
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            resolve(fetch(url, fetchOptions));
          });
        });
      }

      // Retry request with the new access token
      const retryToken = localStorage.getItem(tokenKey);
      if (retryToken) {
        headers.set('Authorization', `Bearer ${retryToken}`);
        response = await fetch(url, fetchOptions);
      }
    }

    // Handle instant redirection if user is suspended (403 Forbidden with custom message)
    if (response.status === 403 && typeof window !== 'undefined') {
      const responseData = await response.clone().json().catch(() => ({}));
      if (responseData.error && responseData.error.toLowerCase().includes('suspend')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login?error=This account is suspended. Contact support.';
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export const api = {
  get: (endpoint: string, options?: FetchOptions) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: FetchOptions) => 
    apiFetch(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  put: (endpoint: string, body?: any, options?: FetchOptions) => 
    apiFetch(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  patch: (endpoint: string, body?: any, options?: FetchOptions) => 
    apiFetch(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
  delete: (endpoint: string, options?: FetchOptions) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
