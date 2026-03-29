import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/MainPage.vue'), 
        meta: { requiresAuth: true, permission: 'home' } 
      },
      { 
        path: 'dashboard', 
        component: () => import('pages/IndexPage.vue'), 
        meta: { requiresAuth: true, permission: 'dashboard' } 
      },
      { 
        path: 'students', 
        component: () => import('pages/StudentsPage.vue'), 
        meta: { requiresAuth: true, permission: 'students' } 
      },
      { 
        path: 'create', 
        component: () => import('pages/CreateTaskPage.vue'), 
        meta: { requiresAuth: true, permission: 'create' } 
      },
      { 
        path: 'attendance', 
        component: () => import('pages/AttendancePage.vue'), 
        meta: { requiresAuth: true, permission: 'attendance' } 
      },
      { 
        path: 'attendance-dashboard', 
        component: () => import('pages/AttendanceDashboardPage.vue'), 
        meta: { requiresAuth: true, permission: 'attendance-dashboard' } 
      },
      { 
        path: 'import-data', 
        component: () => import('pages/ImportDataPage.vue'), 
        meta: { requiresAuth: true, permission: 'import-data' } 
      },
      { 
        path: 'manage-users', 
        component: () => import('pages/ManageUserPage.vue'), 
        meta: { requiresAuth: true, permission: 'manage-users-list' } 
      },
      {
        path: 'manage-role-groups',
        component: () => import('pages/RoleGroupsPage.vue'),
        meta: { requiresAuth: true, permission: 'manage-role-groups' }
      },
      { 
        path: 'login-links', 
        component: () => import('pages/LoginLinksPage.vue'), 
        meta: { requiresAuth: true, permission: 'login-links' } 
      },
      { 
        path: 'settings', 
        component: () => import('pages/SystemSettingsPage.vue'), 
        meta: { requiresAuth: true, permission: 'settings' } 
      },
      { 
        path: 'students/:id', 
        component: () => import('pages/StudentInformationPage.vue'), 
        meta: { requiresAuth: true, permission: 'students' } 
      },
      { 
        path: 'my-attendance', 
        component: () => import('pages/StudentInformationPage.vue'), 
        meta: { requiresAuth: true, permission: 'student-self' } 
      },
      { 
        path: 'task-detail/:taskId', 
        component: () => import('pages/TaskDetailPage.vue'), 
        meta: { requiresAuth: true, permission: 'home' } 
      },
      { 
        path: 'task/:token', 
        component: () => import('pages/TaskGuestPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'task/:token/delegate', 
        component: () => import('pages/DelegatePage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'task/:token/report', 
        component: () => import('pages/ReportPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'task/:token/success', 
        component: () => import('pages/SuccessPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'task/:token/expired', 
        component: () => import('pages/ExpiredPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'task/:token/locked', 
        component: () => import('pages/LockedPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'login/magic/:token', 
        component: () => import('pages/MagicLoginPage.vue'), 
        meta: { hideNav: true } 
      },
      { 
        path: 'admin-access', 
        component: () => import('pages/AdminAccessPage.vue'), 
        meta: { hideNav: true } 
      },
      {
        path: 'forbidden',
        component: () => import('pages/ForbiddenPage.vue'),
        meta: { hideNav: true }
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
