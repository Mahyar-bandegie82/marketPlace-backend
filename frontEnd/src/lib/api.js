import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/V1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
let refreshPromise = null;
let lastRefreshSuccessAt = 0;

export function setAccessToken(token) {
  accessToken = token || null;
  if (token) {
    lastRefreshSuccessAt = Date.now();
  }
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  lastRefreshSuccessAt = 0;
}

/**
 * Deduplicated silent refresh that prevents React StrictMode double-invocations
 * or concurrent 401 interceptors from rotating the single-use refresh cookie twice.
 */
export function refreshAccessToken() {
  if (accessToken && Date.now() - lastRefreshSuccessAt < 4000) {
    return Promise.resolve(accessToken);
  }

  if (!refreshPromise) {
    refreshPromise = api
      .put('/auth/refresh')
      .then((res) => {
        const newToken = res.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
        }
        return newToken;
      })
      .catch((err) => {
        clearAccessToken();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Attach access token to every request if present
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 -> try to refresh once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/signup') &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/logout')
    ) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (refreshErr) {
        clearAccessToken();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
