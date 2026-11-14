import axios from 'axios';

const api = axios.create({
  baseURL: '/api/V1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 → try to refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/signup') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .put('/auth/refresh')
          .then((res) => {
            const newToken = res.data.accessToken;
            setAccessToken(newToken);
            return newToken;
          })
          .catch((err) => {
            clearAccessToken();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            throw err;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }

    return Promise.reject(error);
  }
);

export default api;
