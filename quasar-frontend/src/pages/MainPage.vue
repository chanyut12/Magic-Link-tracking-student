<template>
  <q-page class="main-dashboard-page q-pa-lg">
    <div class="dashboard-container">
      
      <!-- 1. Profile Header Card -->
      <div class="profile-card q-mb-lg">
        <div class="row items-center no-wrap">
          <div class="profile-avatar-placeholder q-mr-lg flex flex-center text-h4 text-weight-bold text-blue-grey-3">
            {{ userInitials }}
          </div>
          <div class="profile-info">
            <div class="row items-center q-gutter-x-sm q-mb-xs">
              <h1 class="text-h5 text-weight-bold q-my-none">{{ userDisplayName }}</h1>
              <q-chip 
                :label="userRoleLabel" 
                color="red-4" 
                text-color="white" 
                dense 
                class="role-chip"
              />
            </div>
            <p class="text-subtitle2 text-grey-7 q-mb-none">
              สังกัด: {{ currentUser?.affiliation || '-' }}
            </p>
          </div>
        </div>
      </div>

      <q-banner v-if="loadError" class="state-banner q-mb-md">
        <div class="text-weight-bold">ไม่สามารถโหลดข้อมูลภาพรวมได้</div>
        <div class="text-caption">{{ loadError }}</div>
        <template #action>
          <q-btn flat color="negative" label="ลองโหลดอีกครั้ง" @click="refreshData" />
        </template>
      </q-banner>

      <OverviewSummaryCards :overview-data="overviewData" />

      <!-- 3. Bottom Row: Help Status & Data Export -->
      <div class="row q-col-gutter-lg">
        <!-- Help Status Cards -->
        <div class="col-12 col-md-4">
          <div class="status-card q-mb-md">
            <div class="status-card-header">
              <div class="text-subtitle1 text-weight-bold">รอการช่วยเหลือ</div>
            </div>
            <div class="row items-end justify-between">
              <div class="status-value text-h3 text-weight-bold">{{ overviewData.helpStats.waiting }}</div>
              <div class="status-unit text-weight-bold">เคส</div>
            </div>
          </div>
          <div class="status-card">
            <div class="status-card-header">
              <div class="text-subtitle1 text-weight-bold">กำลังดำเนินการช่วยเหลือ</div>
            </div>
            <div class="row items-end justify-between">
              <div class="status-value text-h3 text-weight-bold">{{ overviewData.helpStats.inProgress }}</div>
              <div class="status-unit text-weight-bold">เคส</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="status-card-large full-height">
            <div class="status-card-header q-mb-lg">
              <div class="text-subtitle1 text-weight-bold text-center">ช่วยเหลือสำเร็จ (ปิดเคส)</div>
            </div>
            <div class="column items-center justify-center q-py-lg">
              <i class="fas fa-heart-circle-check heart-icon q-mb-md"></i>
              <div class="status-value-large text-h2 text-weight-bold">{{ overviewData.helpStats.resolved }}</div>
            </div>
          </div>
        </div>

        <!-- Data Export Section -->
        <div class="col-12 col-md-4">
          <div class="export-card full-height">
            <div class="text-subtitle1 text-weight-bold q-mb-md">นำออกข้อมูล (Data Export)</div>
            <q-select
              outlined
              dense
              v-model="exportType"
              :options="['ประเภทไฟล์', 'PDF', 'Excel', 'CSV']"
              class="q-mb-md"
              bg-color="white"
            />
            
            <q-list dense class="export-list q-mb-md">
              <q-item tag="label" v-ripple v-for="(item, i) in exportItems" :key="i" class="export-item">
                <q-item-section side top>
                  <q-checkbox v-model="item.selected" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-btn 
              color="primary" 
              class="full-width export-btn" 
              unelevated
              no-caps
            >
              <div class="row items-center justify-between full-width no-wrap">
                <span>ส่งออกข้อมูล</span>
                <i class="fas fa-file-export q-ml-sm"></i>
              </div>
            </q-btn>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OverviewSummaryCards from '../components/dashboard/OverviewSummaryCards.vue';
import { useOverviewDashboardData } from '../composables/useOverviewDashboardData';
import { useUserStore } from '../composables/useUserStore';

const {
  user: currentUser,
  userDisplayName,
  userRoleLabel,
  userInitials,
  loadUser,
} = useUserStore();
const { overviewData, loadError, fetchOverviewData, refreshData } = useOverviewDashboardData();

const exportType = ref('ประเภทไฟล์');
const exportItems = ref([
  { label: 'เลือกทั้งหมด', selected: false },
  { label: 'รายงานสถานการณ์นักเรียน', selected: false },
  { label: 'ข้อมูลนักเรียน', selected: false },
  { label: 'ผลการให้ความช่วยเหลือเด็ก', selected: false },
]);

onMounted(() => {
  void fetchOverviewData();
  loadUser();
});
</script>

<style lang="scss" scoped>
.main-dashboard-page {
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Prompt', 'Inter', sans-serif;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.state-banner {
  border-radius: 20px;
  background: #fff5f5;
  border: 1px solid #fecaca;
}

/* Base Card */
.profile-card, .stat-card, .status-card, .status-card-large, .export-card {
  background: white;
  border-radius: 30px; /* Reduced from 40px */
  padding: 24px; /* Reduced from 32px */
  border: 1px solid rgba(0,0,0,0.02);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

/* Profile Section */
.profile-card {
  padding: 30px;
}
.profile-avatar-placeholder {
  width: 100px; /* Reduced from 140px */
  height: 100px;
  background: #e2e8f0;
  border-radius: 50%;
}

.role-chip {
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 700;
  font-size: 1rem;
}

/* Stat Cards (Top Row) */
.stat-card {
  height: 220px; /* Reduced from 280px */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: none;
}

.stat-title {
  font-size: 1.25rem; /* Reduced from 1.5rem */
  font-weight: 700;
  color: #1e293b;
}

.stat-value {
  font-size: 3.5rem; /* Reduced from 5rem */
  line-height: 0.8;
  color: #1e293b;
}

.stat-card-green { background: #eef7f2; }
.stat-card-yellow { background: #fdf5d8; }
.stat-card-red { background: #fbe5e7; }

.stat-icon-bg {
  width: 80px; /* Reduced from 120px */
  height: 80px;
  border-radius: 20px; /* Reduced from 30px */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem; /* Reduced from 4rem */
}

.bg-green-1 { background: #cce7d9 !important; }
.bg-orange-1 { background: #f9e39f !important; }
.bg-red-1 { background: #f3c2c6 !important; }

.color-green-7 { color: #509e74; }
.color-orange-7 { color: #e19d44; }
.color-red-7 { color: #cd5a62; }

/* Help Status Cards (Bottom Row) */
.status-card {
  height: calc(50% - 12px); /* Half-height minus gutter */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 32px;
  margin-bottom: 24px;
}
.status-card:last-child { margin-bottom: 0; }

.status-unit {
  color: #1e293b;
  font-size: 1.25rem;
  padding-bottom: 12px;
}

.status-value {
  font-size: 3rem; /* Reduced from 4rem */
}

.status-card-large {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
}

.heart-icon {
  font-size: 6rem; /* Reduced from 10rem */
  color: #1e293b;
  opacity: 0.9;
}

.status-value-large {
  font-size: 3.5rem; /* Reduced from 5rem */
}

/* Export Card */
.export-card {
  display: flex;
  flex-direction: column;
  padding: 32px;
}

.export-item {
  border-radius: 16px;
  margin-bottom: 8px;
  background: #f1f5f9;
  min-height: 48px;
  font-weight: 500;
  font-size: 1rem;
}

.export-btn {
  border-radius: 16px;
  height: 56px;
  font-weight: 700;
  font-size: 1.1rem;
  background: #0f4dc2 !important;
  margin-top: auto;
}

.full-height {
  height: 100%;
}

@media (max-width: 1024px) {
  .stat-value { font-size: 4rem; }
  .stat-icon-bg { width: 100px; height: 100px; font-size: 3rem; }
}
</style>
