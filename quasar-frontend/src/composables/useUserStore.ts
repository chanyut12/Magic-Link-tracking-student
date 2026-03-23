import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue';
import { api } from 'boot/axios';
import type { DataScope } from '../constants/permissions';
import { getEffectivePermissions, ROLE_LABELS } from '../constants/permissions';

export interface User {
  id: number;
  username: string;
  FirstName: string | null;
  LastName: string | null;
  roles: string[];
  labels?: string[];
  permissions: string[];
  data_scope?: DataScope;
  PersonID_Onec?: string;
  affiliation?: string;
  virtual_login?: boolean;
  magic_link_token?: string;
  magic_session_token?: string;
}

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

const user = ref<User | null>(null);
let syncInterval: number | null = null;

type StorageTarget = 'auto' | 'local' | 'session';

function getStorageByTarget(target: StorageTarget = 'auto'): Storage {
  if (target === 'session') return sessionStorage;
  if (target === 'local') return localStorage;

  if (sessionStorage.getItem('sts_user') || sessionStorage.getItem('admin_access') === 'true') {
    return sessionStorage;
  }

  if (localStorage.getItem('sts_user') || localStorage.getItem('admin_access') === 'true') {
    return localStorage;
  }

  return localStorage;
}

function getInactiveStorage(activeStorage: Storage): Storage {
  return activeStorage === sessionStorage ? localStorage : sessionStorage;
}

export function getStoredUser(): User | null {
  const userStr = sessionStorage.getItem('sts_user') || localStorage.getItem('sts_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch (e) {
    console.error('Failed to parse sts_user', e);
    return null;
  }
}

export function persistUser(userData: User, target: StorageTarget = 'auto') {
  const storage = getStorageByTarget(target);
  const inactiveStorage = getInactiveStorage(storage);

  storage.setItem('sts_user', JSON.stringify(userData));
  inactiveStorage.removeItem('sts_user');
}

export function persistAuthFlag(target: Exclude<StorageTarget, 'auto'>) {
  const storage = getStorageByTarget(target);
  const inactiveStorage = getInactiveStorage(storage);

  storage.setItem('admin_access', 'true');
  inactiveStorage.removeItem('admin_access');
}

export function useUserStore(): UserStore {
  const isLoggedIn = computed(() => !!user.value);
  
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
      return roles.map(r => ROLE_LABELS[r] || r).join(', ');
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
    user.value = getStoredUser();
  }

  function saveUser(userData: User) {
    user.value = userData;
    persistUser(userData);
  }

  function clearUser() {
    user.value = null;
    sessionStorage.removeItem('sts_user');
    sessionStorage.removeItem('admin_access');
    localStorage.removeItem('sts_user');
    localStorage.removeItem('admin_access');
    stopProfileSync();
  }

  async function refreshUserProfile(): Promise<boolean> {
    if (!user.value?.id || user.value.virtual_login) return false;
    
    try {
      const res = await api.get<User>(`/api/users/${user.value.id}`);
      if (res.data) {
        saveUser(res.data);
        return true;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile', err);
    }
    return false;
  }

  return {
    user: readonly(user) as Ref<User | null>,
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
