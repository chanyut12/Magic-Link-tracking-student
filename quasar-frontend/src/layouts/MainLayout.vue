<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="!hideNavigation" class="bg-white text-gray-800" style="border-bottom: 1px solid #e2e8f0;">
      <q-toolbar class="q-toolbar">
        <q-btn
          flat
          dense
          round
          icon="fa-solid fa-bars"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          class="q-mr-sm"
          color="primary"
        />

        <q-toolbar-title class="text-weight-bold" style="font-size: 1.125rem;">
          {{ pageTitle }}
        </q-toolbar-title>

        <div class="header-actions">
          <q-btn flat round dense color="grey-8" icon="far fa-bell" class="header-icon-btn">
            <q-badge color="negative" floating v-if="unreadCount > 0">{{ unreadCount }}</q-badge>
            <q-menu>
              <q-list style="min-width: 300px; max-width: 350px;">
                <q-item-label header class="text-weight-bold text-dark row items-center justify-between">
                  <span>รายการแจ้งเตือน (เคสใหม่)</span>
                  <q-btn flat dense color="primary" label="อ่านทั้งหมด" size="sm" @click="markAsRead" v-if="unreadCount > 0" />
                </q-item-label>
                <q-item
                  v-for="notif in notifications"
                  :key="notif.id"
                  clickable
                  v-close-popup
                  @click="goToCase(notif.id)"
                  :class="['q-py-md', { 'bg-blue-1': !readCaseIds.includes(notif.id) }]"
                >
                  <q-item-section avatar>
                    <q-avatar color="red-1" text-color="negative" icon="warning" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium row items-center">
                      <span>แจ้งเตือนขาดเรียน</span>
                      <q-badge color="red" v-if="!readCaseIds.includes(notif.id)" label="ใหม่" class="q-ml-xs" size="xs" />
                    </q-item-label>
                    <q-item-label caption lines="2">{{ notif.reason || 'เด็กนักเรียนขาดเรียนติดต่อกัน' }} - {{ notif.student_name }}</q-item-label>
                    <q-item-label caption class="text-primary q-mt-xs">{{ formatDate(notif.created_at) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="notifications.length === 0">
                  <q-item-section class="text-grey text-center q-py-md">
                    ไม่มีการแจ้งเตือนเคสใหม่
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn flat round dense color="grey-8" icon="fas fa-cog" class="header-icon-btn" to="/settings" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="!hideNavigation"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
      class="q-drawer"
    >
      <div class="column no-wrap" style="height: 100vh;">
        <!-- Pinned Logo Section -->
        <div class="logo-section">
          <i class="fas fa-graduation-cap"></i>
          <span>ระบบติดตามนักเรียน</span>
        </div>

        <!-- Scrollable Menu Area -->
        <div class="col" style="overflow-y: auto;">
          <div class="menu-label">เมนู</div>
          <q-list padding class="q-px-none">
            <q-item clickable v-ripple to="/" exact class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-home"></i>
              </q-item-section>
              <q-item-section>หน้าหลัก</q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/dashboard" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-chart-line"></i>
              </q-item-section>
              <q-item-section>รายงานนักเรียน</q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/students" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-user-graduate"></i>
              </q-item-section>
              <q-item-section>รายชื่อนักเรียน</q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              :to="`/students/${currentUser?.PersonID_Onec || 'unknown'}`"
              class="nav-item"
            >
              <q-item-section avatar min-width="44px">
                <i class="fas fa-user-circle"></i>
              </q-item-section>
              <q-item-section>ข้อมูลตัวเอง(สำหรับนักเรียน)</q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/create" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-link"></i>
              </q-item-section>
              <q-item-section>สร้างลิงค์</q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/import-data" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-file-import"></i>
              </q-item-section>
              <q-item-section>นำเข้าข้อมูล</q-item-section>
            </q-item>

            <q-expansion-item
              clickable
              class="nav-item"
              :default-opened="isAttendanceRoute"
            >
              <template #header>
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-clipboard-check"></i>
                </q-item-section>
                <q-item-section>ระบบเช็คชื่อ</q-item-section>
              </template>

              <q-item clickable v-ripple to="/attendance-dashboard" class="nav-sub-item">
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-chart-bar"></i>
                </q-item-section>
                <q-item-section>Dashboard เช็คชื่อ</q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/attendance" class="nav-sub-item">
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-edit"></i>
                </q-item-section>
                <q-item-section>เช็คชื่อ</q-item-section>
              </q-item>
            </q-expansion-item>

            <q-expansion-item
              clickable
              class="nav-item"
              :default-opened="isManageUsersRoute"
            >
              <template #header>
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-users-cog"></i>
                </q-item-section>
                <q-item-section>จัดการสิทธิ์ผู้ใช้งาน</q-item-section>
              </template>

              <q-item clickable v-ripple to="/manage-users" class="nav-sub-item">
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-users"></i>
                </q-item-section>
                <q-item-section>จัดการรายชื่อผู้ใช้งาน</q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/login-links" class="nav-sub-item">
                <q-item-section avatar min-width="44px">
                  <i class="fas fa-link"></i>
                </q-item-section>
                <q-item-section>ลิงก์เข้าสู่ระบบ</q-item-section>
              </q-item>
            </q-expansion-item>

            <q-item clickable v-ripple to="/settings" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-cogs"></i>
              </q-item-section>
              <q-item-section>ตั้งค่าระบบ (Master Data)</q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Pinned Logout Section -->
        <div class="user-profile">
          <div class="avatar">{{ userInitials }}</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">{{ userDisplayName }}</div>
            <div style="font-size:0.75rem;color:#94a3b8">{{ userRoleLabel }}</div>
          </div>
          <q-btn flat round color="primary" icon="fa-solid fa-right-from-bracket" size="md" @click="logout" class="q-ml-auto" />
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const leftDrawerOpen = ref(false);

interface User {
  id: number;
  username: string;
  FirstName: string | null;
  LastName: string | null;
  roles: string[];
  labels?: string[];
  assigned_to_name?: string;
  name?: string;
  selected_role?: string;
  role?: string;
  PersonID_Onec?: string;
}

interface CaseNotification {
  id: number;
  case_id?: number;
  title?: string;
  message?: string;
  student_name?: string;
  reason?: string;
  created_at: string;
  status: string;
}

const currentUser = ref<User | null>(null);

// Watch for route changes to refresh user data instantly on router navigation
watch(() => route.path, () => {
  const userStr = sessionStorage.getItem('sts_user') || localStorage.getItem('sts_user');
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr) as User;
    } catch (e) {
      console.error('Failed to parse sts_user', e);
    }
  } else {
    currentUser.value = null;
  }
}, { immediate: true });
const notifications = ref<CaseNotification[]>([]);
let notifInterval: number | null = null;

onMounted(() => {
  const userStr = sessionStorage.getItem('sts_user') || localStorage.getItem('sts_user');
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr) as User;
    } catch (e) {
      console.error('Failed to parse sts_user', e);
    }
  }

  // Load initial notifications for OPEN cases
  void fetchNotifications();
  // Poll every 10s
  notifInterval = window.setInterval(() => {
    void fetchNotifications();
  }, 10000);
});

onUnmounted(() => {
  if (notifInterval) {
    clearInterval(notifInterval);
  }
});

async function fetchNotifications() {
  try {
    const res = await api.get('/api/cases');
    // Filter only OPEN cases that need attention
    notifications.value = res.data.filter((c: CaseNotification) => c.status === 'OPEN');
  } catch (err) {
    console.warn('Failed to fetch notifications', err);
  }
}

const readCaseIds = ref<number[]>(JSON.parse(localStorage.getItem('read_case_ids') || '[]'));

const unreadCount = computed(() => {
  return notifications.value.filter(n => !readCaseIds.value.includes(n.id)).length;
});

function markAsRead() {
  if (notifications.value.length > 0) {
    const ids = notifications.value.map(n => n.id);
    const uniqueIds = Array.from(new Set([...readCaseIds.value, ...ids]));
    readCaseIds.value = uniqueIds;
    localStorage.setItem('read_case_ids', JSON.stringify(uniqueIds));
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function goToCase(caseId: number) {
  // Mark as read individually on click
  if (!readCaseIds.value.includes(caseId)) {
    readCaseIds.value.push(caseId);
    localStorage.setItem('read_case_ids', JSON.stringify(readCaseIds.value));
  }
  void router.push(`/task-detail/${caseId}`);
}

const userDisplayName = computed(() => {
  if (!currentUser.value) return 'ผู้ดูแลระบบ';
  const { FirstName, LastName, username } = currentUser.value;
  if (FirstName && LastName) return `${FirstName} ${LastName}`;

  // Magic link support
  const nameFromMagic = currentUser.value.assigned_to_name || currentUser.value.name;
  if (nameFromMagic) return nameFromMagic;

  return FirstName || username || 'ผู้ใช้งาน';
});

const userRoleLabel = computed(() => {
  if (!currentUser.value) return 'ผู้ดูแลระบบ';

  const labels = currentUser.value.labels || [];
  if (labels.length > 0) {
    return labels.join(', ');
  }

  // Magic link support
  const singleRole = currentUser.value.selected_role || currentUser.value.role;
  if (singleRole === 'ADMIN') return 'ผู้ดูแลระบบ';
  if (singleRole === 'TEACHER') return 'คุณครู';
  if (singleRole === 'ADMIN_SCHOOL') return 'ผู้ดูแลระบบโรงเรียน';
  if (singleRole === 'DIRECTOR') return 'ผู้อำนวยการ';

  const roles = currentUser.value.roles || [];
  if (roles.includes('ADMIN')) return 'ผู้ดูแลระบบ';
  if (roles.includes('DIRECTOR')) return 'ผู้อำนวยการ';
  if (roles.includes('TEACHER')) return 'คุณครู';
  if (roles.includes('EXECUTIVE')) return 'ผู้บริหาร';
  if (roles.includes('STAFF')) return 'เจ้าหน้าที่';

  return roles[0] || 'ผู้ใช้งาน';
});

const userInitials = computed(() => {
  if (currentUser.value?.FirstName) return currentUser.value.FirstName.charAt(0).toUpperCase();
  if (currentUser.value?.username) return currentUser.value.username.charAt(0).toUpperCase();

  const nameFromMagic = currentUser.value?.assigned_to_name || currentUser.value?.name;
  if (nameFromMagic) return nameFromMagic.charAt(0).toUpperCase();

  return 'A';
});

const hideNavigation = computed(() => !!route.meta.hideNav);

const isAttendanceRoute = computed(() =>
  route.path === '/attendance' || route.path === '/attendance-dashboard'
);

const isManageUsersRoute = computed(() =>
  route.path === '/manage-users' || route.path === '/login-links'
);

const pageTitle = computed(() => {
  if (route.path === '/') return 'หน้าหลัก';
  if (route.path === '/dashboard') return 'รายงานนักเรียน';
  if (route.path === '/students') return 'รายชื่อนักเรียน';
  if (route.path === '/create') return 'สร้างภารกิจใหม่';
  if (route.path === '/import-data') return 'นำเข้าข้อมูล';
  if (route.path === '/attendance') return 'เช็คชื่อ';
  if (route.path === '/attendance-dashboard') return 'Dashboard เช็คชื่อ';
  if (route.path === '/admin-access') return 'Admin Access';
  if (route.path === '/manage-users') return 'จัดการผู้ใช้งาน';
  if (route.path === '/settings') return 'ตั้งค่าระบบและข้อมูลพื้นฐาน';
  if (route.path.startsWith('/task-detail/')) return 'รายละเอียดเคส';
  return 'Student Tracking System';
});

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  sessionStorage.removeItem('admin_access');
  sessionStorage.removeItem('sts_user');
  localStorage.removeItem('admin_access');
  localStorage.removeItem('sts_user');
  $q.notify({
    message: 'ออกจากระบบสำเร็จ',
    color: 'positive',
    position: 'top'
  });

  // Use direct window navigation for reliable redirection
  window.location.href = '#/admin-access';

  // router push as fallback
  await router.push('/admin-access');
}
</script>

<style lang="scss">
// Global styles are now in app.scss
.nav-item {
  .q-item__section--avatar {
    min-width: 32px !important;
    padding-right: 0 !important;
  }
}

.nav-sub-item {
  padding-left: 24px !important;
  background: #f8fafc;

  .q-item__section--avatar {
    min-width: 32px !important;
    padding-right: 0 !important;
  }

  &.q-router-link--active {
    background: #eff6ff;
    border-left: 3px solid var(--q-primary);
  }
}

.header-icon-btn {
  transition: all 0.2s;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  width: 42px;
  height: 42px;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--q-primary) !important;
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 8px;
}
</style>
