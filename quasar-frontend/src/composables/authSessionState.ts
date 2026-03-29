import type {
  AuthSessionSnapshot,
  AuthStorageTarget,
  AuthUser,
  ResolvedAuthStorageTarget,
} from '../types/auth';

const AUTH_USER_STORAGE_KEY = 'sts_user';
const ADMIN_ACCESS_STORAGE_KEY = 'admin_access';
const MAGIC_SESSION_STORAGE_PREFIX = 'magic_session_';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStorage(target: ResolvedAuthStorageTarget): Storage | null {
  if (!isBrowser()) {
    return null;
  }

  return target === 'session' ? window.sessionStorage : window.localStorage;
}

function getInactiveStorage(target: ResolvedAuthStorageTarget): Storage | null {
  return getStorage(target === 'session' ? 'local' : 'session');
}

function hasStoredAuthData(storage: Storage | null): boolean {
  if (!storage) {
    return false;
  }

  return Boolean(
    storage.getItem(AUTH_USER_STORAGE_KEY)
      || storage.getItem(ADMIN_ACCESS_STORAGE_KEY) === 'true',
  );
}

function parseStoredUser(userStr: string | null): AuthUser | null {
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch (error) {
    console.warn('Failed to parse stored auth user', error);
    return null;
  }
}

function readStoredUser(storage: Storage | null): AuthUser | null {
  return parseStoredUser(storage?.getItem(AUTH_USER_STORAGE_KEY) ?? null);
}

function resolvePersistTarget(
  target: AuthStorageTarget = 'auto',
): ResolvedAuthStorageTarget {
  return target === 'auto' ? resolveStoredAuthTarget() ?? 'local' : target;
}

export function resolveStoredAuthTarget(): ResolvedAuthStorageTarget | null {
  const sessionStorageRef = getStorage('session');
  if (hasStoredAuthData(sessionStorageRef)) {
    return 'session';
  }

  const localStorageRef = getStorage('local');
  if (hasStoredAuthData(localStorageRef)) {
    return 'local';
  }

  return null;
}

export function getStoredAuthUser(): AuthUser | null {
  const target = resolveStoredAuthTarget();
  return target ? readStoredUser(getStorage(target)) : null;
}

export function getStoredAdminAccess(): boolean {
  const target = resolveStoredAuthTarget();
  if (!target) {
    return false;
  }

  return getStorage(target)?.getItem(ADMIN_ACCESS_STORAGE_KEY) === 'true';
}

export function syncAuthSessionState(): AuthSessionSnapshot {
  const target = resolveStoredAuthTarget();

  return {
    user: target ? readStoredUser(getStorage(target)) : null,
    hasAdminAccess: target
      ? getStorage(target)?.getItem(ADMIN_ACCESS_STORAGE_KEY) === 'true'
      : false,
    storageTarget: target,
  };
}

export function persistAuthUser(
  userData: AuthUser,
  target: AuthStorageTarget = 'auto',
): ResolvedAuthStorageTarget {
  const resolvedTarget = resolvePersistTarget(target);
  const storage = getStorage(resolvedTarget);
  const inactiveStorage = getInactiveStorage(resolvedTarget);

  storage?.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));
  inactiveStorage?.removeItem(AUTH_USER_STORAGE_KEY);

  return resolvedTarget;
}

export function persistAdminAccess(target: ResolvedAuthStorageTarget): void {
  const storage = getStorage(target);
  const inactiveStorage = getInactiveStorage(target);

  storage?.setItem(ADMIN_ACCESS_STORAGE_KEY, 'true');
  inactiveStorage?.removeItem(ADMIN_ACCESS_STORAGE_KEY);
}

export function saveAuthSession(
  userData: AuthUser,
  options: {
    target?: AuthStorageTarget;
    hasAdminAccess?: boolean;
  } = {},
): ResolvedAuthStorageTarget {
  const resolvedTarget = resolvePersistTarget(options.target ?? 'auto');
  const storage = getStorage(resolvedTarget);
  const inactiveStorage = getInactiveStorage(resolvedTarget);

  storage?.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));
  inactiveStorage?.removeItem(AUTH_USER_STORAGE_KEY);

  if (options.hasAdminAccess ?? true) {
    storage?.setItem(ADMIN_ACCESS_STORAGE_KEY, 'true');
    inactiveStorage?.removeItem(ADMIN_ACCESS_STORAGE_KEY);
  } else {
    storage?.removeItem(ADMIN_ACCESS_STORAGE_KEY);
  }

  return resolvedTarget;
}

export function clearStoredAuthSession(): void {
  getStorage('session')?.removeItem(AUTH_USER_STORAGE_KEY);
  getStorage('session')?.removeItem(ADMIN_ACCESS_STORAGE_KEY);
  getStorage('local')?.removeItem(AUTH_USER_STORAGE_KEY);
  getStorage('local')?.removeItem(ADMIN_ACCESS_STORAGE_KEY);
}

function getMagicSessionKey(token: string): string {
  return `${MAGIC_SESSION_STORAGE_PREFIX}${token}`;
}

export function readMagicSessionToken(
  token: string,
  target: AuthStorageTarget = 'auto',
): string {
  const key = getMagicSessionKey(token);

  if (!isBrowser()) {
    return '';
  }

  if (target === 'auto') {
    return window.sessionStorage.getItem(key) || window.localStorage.getItem(key) || '';
  }

  return getStorage(target)?.getItem(key) || '';
}

export function writeMagicSessionToken(
  token: string,
  sessionToken: string,
  target: ResolvedAuthStorageTarget = 'session',
): void {
  getStorage(target)?.setItem(getMagicSessionKey(token), sessionToken);
}

export function clearMagicSessionToken(token: string): void {
  const key = getMagicSessionKey(token);
  getStorage('session')?.removeItem(key);
  getStorage('local')?.removeItem(key);
}
