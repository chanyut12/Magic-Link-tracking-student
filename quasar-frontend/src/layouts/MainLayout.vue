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
          <q-btn
            v-if="userPermissions.includes('settings')"
            flat
            round
            dense
            color="grey-8"
            icon="fas fa-cog"
            class="header-icon-btn"
            to="/settings"
          />
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
        <div class="logo-section">
          <i class="fas fa-graduation-cap"></i>
          <span>ระบบติดตามนักเรียน</span>
        </div>

        <div class="col" style="overflow-y: auto;">
          <div class="menu-label">เมนู</div>
          <q-list padding class="q-px-none">
            <template v-for="item in visibleMenuItems" :key="item.id">
              <q-item 
                v-if="!item.children" 
                clickable 
                v-ripple 
                :to="item.route" 
                :exact="item.id === 'home'"
                class="nav-item"
              >
                <q-item-section avatar min-width="44px">
                  <i :class="item.icon"></i>
                </q-item-section>
                <q-item-section>{{ item.label }}</q-item-section>
              </q-item>

              <q-expansion-item
                v-else
                clickable
                class="nav-item"
                :default-opened="isExpansionOpened(item)"
              >
                <template #header>
                  <q-item-section avatar min-width="44px">
                    <i :class="item.icon"></i>
                  </q-item-section>
                  <q-item-section>{{ item.label }}</q-item-section>
                </template>

                <q-item 
                  v-for="child in item.children" 
                  :key="child.id" 
                  clickable 
                  v-ripple 
                  :to="child.route" 
                  class="nav-sub-item"
                >
                  <q-item-section avatar min-width="44px">
                    <i :class="child.icon"></i>
                  </q-item-section>
                  <q-item-section>{{ child.label }}</q-item-section>
                </q-item>
              </q-expansion-item>
            </template>
          </q-list>
        </div>

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
import { 
  MENU_ITEMS, 
  filterMenuItems, 
  getEffectivePermissions,
  type MenuItem 
} from '../constants/permissions';
import { 
  useUserStore, 
  startProfileSync, 
  stopProfileSync 
} from '../composables/useUserStore';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const leftDrawerOpen = ref(false);

const { 
  user, 
  loadUser, 
  userRoleLabel, 
  userDisplayName, 
  userInitials, 
  clearUser 
} = useUserStore();

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

const notifications = ref<CaseNotification[]>([]);
let notifInterval: number | null = null;

const userPermissions = computed(() => {
  if (!user.value) return [];
  const roles = user.value.roles || [];
  const customPermissions = user.value.permissions || [];
  return getEffectivePermissions(roles, customPermissions);
});

const visibleMenuItems = computed(() => {
  return filterMenuItems(MENU_ITEMS, userPermissions.value);
});

watch(
  [() => route.fullPath, () => user.value?.id, () => userPermissions.value.join('|')],
  () => {
    if (!route.meta.requiresAuth || !user.value) {
      return;
    }

    const requiredPermission = route.meta.permission as string | undefined;
    if (requiredPermission && !userPermissions.value.includes(requiredPermission) && route.path !== '/forbidden') {
      void router.replace('/forbidden');
    }
  },
  { immediate: true }
);

watch(() => route.path, () => {
  loadUser();
}, { immediate: true });

onMounted(() => {
  loadUser();
  void fetchNotifications();
  notifInterval = window.setInterval(() => {
    void fetchNotifications();
  }, 5000);
  startProfileSync(5000);
});

onUnmounted(() => {
  if (notifInterval) {
    clearInterval(notifInterval);
  }
  stopProfileSync();
});

async function fetchNotifications() {
  try {
    const res = await api.get('/api/cases');
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
  if (!readCaseIds.value.includes(caseId)) {
    readCaseIds.value.push(caseId);
    localStorage.setItem('read_case_ids', JSON.stringify(readCaseIds.value));
  }
  void router.push(`/task-detail/${caseId}`);
}

function isExpansionOpened(item: MenuItem): boolean {
  if (!item.children) return false;
  const childRoutes = item.children.map(c => c.route).filter(Boolean);
  return childRoutes.includes(route.path);
}

const hideNavigation = computed(() => !!route.meta.hideNav);

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'หน้าหลัก',
    '/dashboard': 'รายงานนักเรียน',
    '/students': 'รายชื่อนักเรียน',
    '/create': 'สร้างภารกิจใหม่',
    '/import-data': 'นำเข้าข้อมูล',
    '/attendance': 'เช็คชื่อ',
    '/attendance-dashboard': 'Dashboard เช็คชื่อ',
    '/admin-access': 'Admin Access',
    '/manage-users': 'จัดการผู้ใช้งาน',
    '/settings': 'ตั้งค่าระบบและข้อมูลพื้นฐาน',
    '/my-attendance': 'ข้อมูลการเข้าเรียนของฉัน',
    '/forbidden': 'ไม่มีสิทธิ์เข้าถึง',
  };
  
  if (route.path.startsWith('/task-detail/')) return 'รายละเอียดเคส';
  if (route.path.startsWith('/students/')) return 'ข้อมูลนักเรียน';
  
  return titles[route.path] || 'Student Tracking System';
});

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  clearUser();
  $q.notify({
    message: 'ออกจากระบบสำเร็จ',
    color: 'positive',
    position: 'top'
  });

  window.location.href = '#/admin-access';
  await router.push('/admin-access');
}
</script>

<style lang="scss">
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
