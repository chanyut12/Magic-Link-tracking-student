import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { getEffectivePermissions } from '../constants/permissions';
import {
  getStoredAdminAccess,
  getStoredAuthUser,
} from '../composables/authSessionState';
import type { AuthUser } from '../types/auth';

function getUser(): AuthUser | null {
  return getStoredAuthUser();
}

function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;

  const roles = user.roles || [];
  const customPermissions = user.permissions || [];
  const effectivePermissions = getEffectivePermissions(roles, customPermissions);

  return effectivePermissions.includes(permission);
}

function isAuthenticated(): boolean {
  return Boolean(getStoredAdminAccess() && getStoredAuthUser());
}

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    const isAdmin = isAuthenticated();
    const user = getUser();
    
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!isAdmin) {
        return {
          path: '/admin-access',
          query: { next: to.fullPath }
        };
      }
      
      const requiredPermission = to.meta.permission as string | undefined;
      if (requiredPermission && !hasPermission(user, requiredPermission)) {
        return { path: '/forbidden' };
      }
    }
    
    return true;
  });

  return Router;
});
