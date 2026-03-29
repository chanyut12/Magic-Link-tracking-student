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
                <q-item-label
                  v-if="displayedUnreadNotifications.length > 0"
                  header
                  class="notification-section-label"
                >
                  ยังไม่อ่าน
                </q-item-label>
                <q-item
                  v-for="notif in displayedUnreadNotifications"
                  :key="notif.id"
                  clickable
                  v-close-popup
                  @click="goToNotification(notif)"
                  class="q-py-md notification-item notification-item--unread"
                >
                  <q-item-section avatar>
                    <q-avatar color="red-1" text-color="negative" icon="warning" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium row items-center">
                      <span>แจ้งเตือนขาดเรียน</span>
                      <q-badge color="red" label="ใหม่" class="q-ml-xs" size="xs" />
                    </q-item-label>
                    <q-item-label caption lines="2">{{ notif.reason || notif.reason_flagged || 'เด็กนักเรียนขาดเรียนติดต่อกัน' }} - {{ notif.student_name }}</q-item-label>
                    <q-item-label caption class="text-primary q-mt-xs">{{ formatDate(notif.created_at) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side top>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      color="grey-6"
                      icon="close"
                      class="notification-dismiss-btn"
                      aria-label="ลบการแจ้งเตือน"
                      @click.stop="dismissNotification(notif.id)"
                    />
                  </q-item-section>
                </q-item>

                <q-separator v-if="displayedUnreadNotifications.length > 0 && displayedReadNotifications.length > 0" spaced />

                <q-item-label
                  v-if="displayedReadNotifications.length > 0"
                  header
                  class="notification-section-label"
                >
                  อ่านแล้วล่าสุด
                </q-item-label>
                <q-item
                  v-for="notif in displayedReadNotifications"
                  :key="`read-${notif.id}`"
                  clickable
                  v-close-popup
                  @click="goToNotification(notif)"
                  class="q-py-md notification-item notification-item--read"
                >
                  <q-item-section avatar>
                    <q-avatar color="grey-3" text-color="grey-7" icon="done" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium row items-center">
                      <span>แจ้งเตือนขาดเรียน</span>
                    </q-item-label>
                    <q-item-label caption lines="2">{{ notif.reason || notif.reason_flagged || 'เด็กนักเรียนขาดเรียนติดต่อกัน' }} - {{ notif.student_name }}</q-item-label>
                    <q-item-label caption class="q-mt-xs text-grey-6">{{ formatDate(notif.created_at) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side top>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      color="grey-6"
                      icon="close"
                      class="notification-dismiss-btn"
                      aria-label="ลบการแจ้งเตือน"
                      @click.stop="dismissNotification(notif.id)"
                    />
                  </q-item-section>
                </q-item>

                <q-item
                  v-if="hiddenNotificationsCount > 0 || dismissedNotificationsCount > 0 || canOpenNotificationReport"
                  dense
                  class="notification-meta-item"
                >
                  <q-item-section class="text-center">
                    <div v-if="hiddenNotificationsCount > 0" class="text-grey-6">
                      แสดงเฉพาะล่าสุด และซ่อนอีก {{ hiddenNotificationsCount }} รายการ
                    </div>
                    <div v-if="dismissedNotificationsCount > 0" class="text-grey-6 q-mt-xs">
                      ซ่อนการแจ้งเตือนไว้ {{ dismissedNotificationsCount }} รายการ
                    </div>
                    <q-btn
                      v-if="dismissedNotificationsCount > 0"
                      flat
                      dense
                      color="grey-7"
                      class="notification-report-btn q-mt-xs"
                      label="กู้คืนที่ลบ"
                      @click="restoreDismissedNotifications"
                    />
                    <q-btn
                      v-if="canOpenNotificationReport"
                      flat
                      dense
                      color="primary"
                      class="notification-report-btn q-mt-xs"
                      label="ดูรายงานนักเรียน"
                      v-close-popup
                      @click="openNotificationReport"
                    />
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
import { useQuasar } from 'quasar';
import { 
  MENU_ITEMS, 
  filterMenuItems, 
  type MenuItem 
} from '../constants/permissions';
import { 
  useUserStore, 
  startProfileSync, 
  stopProfileSync 
} from '../composables/useUserStore';
import { useCaseNotifications } from '../composables/useCaseNotifications';
import { formatCaseDateTime } from '../utils/casePresentation';
import type { CaseRecord } from '../types/case';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const leftDrawerOpen = ref(false);

const {
  user, 
  loadUser, 
  userPermissions,
  userRoleLabel, 
  userDisplayName, 
  userInitials, 
  clearUser 
} = useUserStore();
const {
  notifications,
  displayedUnreadNotifications,
  displayedReadNotifications,
  hiddenNotificationsCount,
  dismissedNotificationsCount,
  unreadCount,
  markAsRead,
  markNotificationAsRead,
  dismissNotification: dismissCaseNotification,
  restoreDismissedNotifications: restoreCaseNotifications,
  fetchNotifications,
} = useCaseNotifications();
let notifInterval: number | null = null;

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

const canOpenNotificationReport = computed(() => {
  return userPermissions.value.includes('dashboard');
});

function formatDate(dateStr: string) {
  return formatCaseDateTime(dateStr);
}

function goToNotification(notification: CaseRecord) {
  markNotificationAsRead(notification.id);

  if (notification.student_id) {
    void router.push(`/students/${notification.student_id}`);
    return;
  }

  if (notification.task_id) {
    void router.push(`/task-detail/${notification.task_id}`);
  }
}

function openNotificationReport() {
  void router.push('/dashboard');
}

function dismissNotification(notificationId: number) {
  dismissCaseNotification(notificationId);
}

function restoreDismissedNotifications() {
  restoreCaseNotifications();
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
    '/manage-role-groups': 'จัดการกลุ่มผู้ใช้งาน',
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

.notification-section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748b;
  text-transform: uppercase;
  padding-top: 8px;
  padding-bottom: 4px;
}

.notification-item {
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.notification-item--unread {
  background: #eff6ff;
}

.notification-item--read {
  background: #f8fafc;
  opacity: 0.82;
}

.notification-item--read:hover,
.notification-item--unread:hover {
  opacity: 1;
}

.notification-meta-item {
  min-height: 36px;
  font-size: 0.75rem;
}

.notification-report-btn {
  align-self: center;
}

.notification-dismiss-btn {
  opacity: 0.68;
}

.notification-dismiss-btn:hover {
  opacity: 1;
}
</style>
