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
          <q-btn flat round dense color="grey-8" icon="far fa-bell" class="header-icon-btn" />
          <q-btn flat round dense color="grey-8" icon="fas fa-cog" class="header-icon-btn" />
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

            <q-item clickable v-ripple to="/create" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-link"></i>
              </q-item-section>
              <q-item-section>สร้างลิงค์</q-item-section>
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

            <q-item clickable v-ripple to="/manage-users" class="nav-item">
              <q-item-section avatar min-width="44px">
                <i class="fas fa-users-cog"></i>
              </q-item-section>
              <q-item-section>จัดการสิทธิ์ผู้ใช้งาน</q-item-section>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
}

const currentUser = ref<User | null>(null);

onMounted(() => {
  const userStr = localStorage.getItem('sts_user');
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr) as User;
    } catch (e) {
      console.error('Failed to parse sts_user', e);
    }
  }
});

const userDisplayName = computed(() => {
  if (!currentUser.value) return 'ผู้ดูแลระบบ';
  const { FirstName, LastName, username } = currentUser.value;
  if (FirstName && LastName) return `${FirstName} ${LastName}`;
  return FirstName || username || 'ผู้ใช้งาน';
});

const userRoleLabel = computed(() => {
  if (!currentUser.value) return 'ผู้ดูแลระบบ';
  
  const labels = currentUser.value.labels || [];
  if (labels.length > 0) {
    return labels.join(', ');
  }

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
  return 'A';
});

const hideNavigation = computed(() => !!route.meta.hideNav);

const isAttendanceRoute = computed(() => 
  route.path === '/attendance' || route.path === '/attendance-dashboard'
);

const pageTitle = computed(() => {
  if (route.path === '/') return 'หน้าหลัก';
  if (route.path === '/dashboard') return 'รายงานนักเรียน';
  if (route.path === '/create') return 'สร้างภารกิจใหม่';
  if (route.path === '/attendance') return 'เช็คชื่อ';
  if (route.path === '/attendance-dashboard') return 'Dashboard เช็คชื่อ';
  if (route.path === '/admin-access') return 'Admin Access';
  if (route.path === '/manage-users') return 'จัดการผู้ใช้งาน';
  return 'Student Tracking System';
});

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
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
