import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { getEffectivePermissions } from '../constants/permissions';

interface User {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
}

function getUser(): User | null {
  const userStr = sessionStorage.getItem('sts_user') || localStorage.getItem('sts_user');
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
  return null;
}

function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  const roles = user.roles || [];
  const customPermissions = user.permissions || [];
  const effectivePermissions = getEffectivePermissions(roles, customPermissions);

  return effectivePermissions.includes(permission);
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
    const isAdmin = (sessionStorage.getItem('admin_access') === 'true') || (localStorage.getItem('admin_access') === 'true');
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
