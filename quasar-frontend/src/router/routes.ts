import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/MainPage.vue'), meta: { requiresAuth: true } },
      { path: 'dashboard', component: () => import('pages/IndexPage.vue'), meta: { requiresAuth: true } },
      { path: 'create', component: () => import('pages/CreateTaskPage.vue'), meta: { requiresAuth: true } },
      { path: 'attendance', component: () => import('pages/AttendancePage.vue'), meta: { requiresAuth: true } },
      { path: 'attendance-dashboard', component: () => import('pages/AttendanceDashboardPage.vue'), meta: { requiresAuth: true } },
      { path: 'manage-users', component: () => import('pages/ManageUserPage.vue'), meta: { requiresAuth: true } },
      { path: 'task/:token', component: () => import('pages/TaskGuestPage.vue'), meta: { hideNav: true } },
      { path: 'admin-access', component: () => import('pages/AdminAccessPage.vue'), meta: { hideNav: true } },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
