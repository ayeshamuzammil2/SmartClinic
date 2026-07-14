import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshResponse } from '../types';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const ACCESS_KEY = 'smartclinic.accessToken';
const REFRESH_KEY = 'smartclinic.refreshToken';

type TokenListener = (accessToken: string | null) => void;
const tokenListeners = new Set<TokenListener>();

export function onAccessTokenChange(fn: TokenListener): () => void {
  tokenListeners.add(fn);
  return () => {
    tokenListeners.delete(fn);
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  tokenListeners.forEach((fn) => fn(accessToken));
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  tokenListeners.forEach((fn) => fn(null));
}

/** Registered by AuthContext so the interceptor can force a logout. */
let logoutHandler: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void): void {
  logoutHandler = fn;
}

const client = axios.create({ baseURL: API_URL });

// Attach the access token to every request.
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: try one refresh, retry the original request, else log out.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.reject(new Error('No refresh token'));
    refreshPromise = axios
      .post<RefreshResponse>(`${API_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        setTokens(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch {
        clearTokens();
        logoutHandler?.();
      }
    }
    return Promise.reject(error);
  },
);

export default client;
