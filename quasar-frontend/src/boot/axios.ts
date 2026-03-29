import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { getStoredAuthUser } from '../composables/authSessionState';
import type { AuthUser } from '../types/auth';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

function isPrivateDevHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function formatHostForUrl(hostname: string): string {
  return hostname.includes(':') ? `[${hostname}]` : hostname;
}

function resolveApiBaseURL(): string {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  if (typeof window === 'undefined') {
    return '/';
  }

  const { protocol, hostname, port } = window.location;
  if (port !== '3000' && isPrivateDevHost(hostname)) {
    return `${protocol}//${formatHostForUrl(hostname)}:3000`;
  }

  return '/';
}

// Be careful when using SSR for global axios instances
const api = axios.create({ baseURL: resolveApiBaseURL() });

function getCurrentStoredUser(): AuthUser | null {
  return getStoredAuthUser();
}

function encodeScopeHeader(scope: unknown): string | null {
  try {
    return `uri:${encodeURIComponent(JSON.stringify(scope))}`;
  } catch (e) {
    console.warn('Failed to encode scope header', e);
    return null;
  }
}

api.interceptors.request.use((config) => {
  const currentUser = getCurrentStoredUser();
  if (currentUser?.virtual_login && currentUser.magic_link_token) {
    config.headers['x-magic-link-token'] = currentUser.magic_link_token;
    if (currentUser.magic_session_token) {
      config.headers['x-magic-session'] = currentUser.magic_session_token;
    }
  } else if (currentUser?.virtual_login && currentUser.virtual_auth_token) {
    config.headers['x-virtual-auth'] = currentUser.virtual_auth_token;
  } else if (currentUser?.id) {
    config.headers['x-user-id'] = String(currentUser.id);
  }
  if (currentUser?.data_scope) {
    const encodedScope = encodeScopeHeader(currentUser.data_scope);
    if (encodedScope) {
      config.headers['x-user-scope'] = encodedScope;
    }
  }
  return config;
});

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
