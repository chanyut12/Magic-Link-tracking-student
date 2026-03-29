import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authService } from '../services/authService';
import type {
  AuthSessionSnapshot,
  AuthStorageTarget,
  AuthUser,
  ResolvedAuthStorageTarget,
} from '../types/auth';
import {
  clearStoredAuthSession,
  persistAdminAccess,
  persistAuthUser,
  readMagicSessionToken,
  saveAuthSession,
  syncAuthSessionState,
  writeMagicSessionToken,
} from '../composables/authSessionState';

export const useAuthSessionStore = defineStore('auth-session', () => {
  const user = ref<AuthUser | null>(null);
  const hasAdminAccess = ref(false);
  const storageTarget = ref<ResolvedAuthStorageTarget | null>(null);
  const isLoggedIn = computed(() => !!user.value);

  function applySnapshot(snapshot: AuthSessionSnapshot): AuthSessionSnapshot {
    user.value = snapshot.user;
    hasAdminAccess.value = snapshot.hasAdminAccess;
    storageTarget.value = snapshot.storageTarget;
    return snapshot;
  }

  function loadSession(): AuthSessionSnapshot {
    return applySnapshot(syncAuthSessionState());
  }

  function saveSession(
    userData: AuthUser,
    options: {
      target?: AuthStorageTarget;
      hasAdminAccess?: boolean;
    } = {},
  ): ResolvedAuthStorageTarget {
    const resolvedTarget = saveAuthSession(userData, options);
    loadSession();
    return resolvedTarget;
  }

  function persistUser(
    userData: AuthUser,
    target: AuthStorageTarget = 'auto',
  ): ResolvedAuthStorageTarget {
    const resolvedTarget = persistAuthUser(userData, target);
    loadSession();
    return resolvedTarget;
  }

  function persistAdminAccessFlag(target: ResolvedAuthStorageTarget): void {
    persistAdminAccess(target);
    loadSession();
  }

  function clearSession(): void {
    clearStoredAuthSession();
    loadSession();
  }

  async function refreshUserProfile(): Promise<boolean> {
    const session = loadSession();
    const currentUser = session.user;
    const target = session.storageTarget;

    if (!currentUser?.id || currentUser.virtual_login || !target) {
      return false;
    }

    try {
      const refreshedUser = await authService.getUserProfile(currentUser.id);
      saveSession(refreshedUser, {
        target,
        hasAdminAccess: session.hasAdminAccess,
      });
      return true;
    } catch (error) {
      console.warn('Failed to refresh user profile', error);
      return false;
    }
  }

  function readMagicToken(
    token: string,
    target: AuthStorageTarget = 'auto',
  ): string {
    return readMagicSessionToken(token, target);
  }

  function writeMagicToken(
    token: string,
    sessionToken: string,
    target: ResolvedAuthStorageTarget = 'session',
  ): void {
    writeMagicSessionToken(token, sessionToken, target);
  }

  loadSession();

  return {
    user,
    hasAdminAccess,
    storageTarget,
    isLoggedIn,
    loadSession,
    saveSession,
    persistUser,
    persistAdminAccessFlag,
    clearSession,
    refreshUserProfile,
    readMagicToken,
    writeMagicToken,
  };
});
