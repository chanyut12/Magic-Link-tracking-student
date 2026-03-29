import { computed, type ComputedRef, type Ref } from 'vue';
import { getEffectivePermissions, ROLE_LABELS } from '../constants/permissions';
import type {
  AuthStorageTarget,
  AuthUser,
  ResolvedAuthStorageTarget,
} from '../types/auth';
import {
  getStoredAuthUser,
  persistAdminAccess,
  persistAuthUser,
} from './authSessionState';
import { useAuthSession } from './useAuthSession';

export type User = AuthUser;

interface UserStore {
  user: Ref<User | null>;
  isLoggedIn: ComputedRef<boolean>;
  userPermissions: ComputedRef<string[]>;
  userRoleLabel: ComputedRef<string>;
  userDisplayName: ComputedRef<string>;
  userInitials: ComputedRef<string>;
  loadUser: () => void;
  saveUser: (userData: User) => void;
  clearUser: () => void;
  refreshUserProfile: () => Promise<boolean>;
}

let syncInterval: number | null = null;

export function getStoredUser(): User | null {
  return getStoredAuthUser();
}

export function persistUser(userData: User, target: AuthStorageTarget = 'auto') {
  persistAuthUser(userData, target);
}

export function persistAuthFlag(target: ResolvedAuthStorageTarget) {
  persistAdminAccess(target);
}

export function useUserStore(): UserStore {
  const {
    user,
    isLoggedIn,
    loadSession,
    persistUser: persistSessionUser,
    clearSession,
    refreshUserProfile,
  } = useAuthSession();

  const userPermissions = computed(() => {
    if (!user.value) return [];
    const roles = user.value.roles || [];
    const customPermissions = user.value.permissions || [];
    return getEffectivePermissions(roles, customPermissions);
  });

  const userRoleLabel = computed(() => {
    if (!user.value) return 'ผู้ใช้งาน';

    const labels = user.value.labels || [];
    if (labels.length > 0) return labels.join(', ');

    const roles = user.value.roles || [];
    if (roles.length > 0) {
      return roles.map((role) => ROLE_LABELS[role] || role).join(', ');
    }

    return 'ผู้ใช้งาน';
  });

  const userDisplayName = computed(() => {
    if (!user.value) return 'ผู้ใช้งาน';
    const { FirstName, LastName, username } = user.value;
    if (FirstName && LastName) return `${FirstName} ${LastName}`;
    if (FirstName) return FirstName;
    return username || 'ผู้ใช้งาน';
  });

  const userInitials = computed(() => {
    if (!user.value) return 'U';
    if (user.value.FirstName) return user.value.FirstName.charAt(0).toUpperCase();
    if (user.value.username) return user.value.username.charAt(0).toUpperCase();
    return 'U';
  });

  function loadUser() {
    loadSession();
  }

  function saveUser(userData: User) {
    persistSessionUser(userData);
  }

  function clearUser() {
    clearSession();
    stopProfileSync();
  }

  return {
    user,
    isLoggedIn,
    userPermissions,
    userRoleLabel,
    userDisplayName,
    userInitials,
    loadUser,
    saveUser,
    clearUser,
    refreshUserProfile,
  };
}

export function startProfileSync(intervalMs: number = 5000): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  const { refreshUserProfile } = useUserStore();

  syncInterval = window.setInterval(() => {
    void refreshUserProfile();
  }, intervalMs);
}

export function stopProfileSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
