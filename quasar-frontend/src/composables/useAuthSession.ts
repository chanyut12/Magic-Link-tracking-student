import { storeToRefs } from 'pinia';
import { readonly, type ComputedRef, type Ref } from 'vue';
import { getAppPinia } from 'boot/pinia';
import type {
  AuthSessionSnapshot,
  AuthStorageTarget,
  AuthUser,
  ResolvedAuthStorageTarget,
} from '../types/auth';
import { useAuthSessionStore } from '../stores/auth-session-store';

interface AuthSessionStore {
  user: Ref<AuthUser | null>;
  hasAdminAccess: ComputedRef<boolean>;
  isLoggedIn: ComputedRef<boolean>;
  activeStorageTarget: ComputedRef<ResolvedAuthStorageTarget | null>;
  loadSession: () => AuthSessionSnapshot;
  saveSession: (
    userData: AuthUser,
    options?: {
      target?: AuthStorageTarget;
      hasAdminAccess?: boolean;
    },
  ) => ResolvedAuthStorageTarget;
  persistUser: (
    userData: AuthUser,
    target?: AuthStorageTarget,
  ) => ResolvedAuthStorageTarget;
  persistAdminAccess: (target: ResolvedAuthStorageTarget) => void;
  clearSession: () => void;
  refreshUserProfile: () => Promise<boolean>;
  readMagicSessionToken: (
    token: string,
    target?: AuthStorageTarget,
  ) => string;
  writeMagicSessionToken: (
    token: string,
    sessionToken: string,
    target?: ResolvedAuthStorageTarget,
  ) => void;
}

export function useAuthSession(): AuthSessionStore {
  const authSessionStore = useAuthSessionStore(getAppPinia());
  const {
    user,
    hasAdminAccess,
    isLoggedIn,
    storageTarget: activeStorageTarget,
  } = storeToRefs(authSessionStore);

  return {
    user: readonly(user) as Ref<AuthUser | null>,
    hasAdminAccess: readonly(hasAdminAccess) as ComputedRef<boolean>,
    isLoggedIn: readonly(isLoggedIn) as ComputedRef<boolean>,
    activeStorageTarget: readonly(activeStorageTarget) as ComputedRef<
      ResolvedAuthStorageTarget | null
    >,
    loadSession: () => authSessionStore.loadSession(),
    saveSession: (userData, options) => authSessionStore.saveSession(userData, options),
    persistUser: (userData, target) => authSessionStore.persistUser(userData, target),
    persistAdminAccess: (target) => authSessionStore.persistAdminAccessFlag(target),
    clearSession: () => authSessionStore.clearSession(),
    refreshUserProfile: () => authSessionStore.refreshUserProfile(),
    readMagicSessionToken: (token, target) => authSessionStore.readMagicToken(token, target),
    writeMagicSessionToken: (token, sessionToken, target) =>
      authSessionStore.writeMagicToken(token, sessionToken, target),
  };
}
