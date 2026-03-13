<template>
  <q-page class="q-pa-lg">
    <div style="max-width:1300px; width:100%; margin: 0 auto;">
      
      <!-- Summary Stats -->
      <div class="stats-grid q-mb-md">
        <div class="stat-card stat-card--total">
          <div class="stat-label">เคสทั้งหมด</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-sub">รายการ</div>
        </div>
        <div class="stat-card stat-card--progress">
          <div class="stat-label">กำลังติดตาม</div>
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-sub">รายการ</div>
        </div>
        <div class="stat-card stat-card--resolved">
          <div class="stat-label">ปิดเคสสำเร็จ</div>
          <div class="stat-value">{{ stats.resolved }}</div>
          <div class="stat-sub">รายการ</div>
        </div>
        <div class="stat-card stat-card--today">
          <div class="stat-label">เคสวันนี้</div>
          <div class="stat-value">{{ stats.today }}</div>
          <div class="stat-sub">รายการ</div>
        </div>
      </div>

      <div class="stats-row-secondary q-mb-lg">
        <div class="stat-pill border-1">
          <span class="stat-pill-label">รอผอ.ประเมิน</span>
          <span class="stat-pill-value badge badge-pending">{{ stats.pendingReview }}</span>
        </div>
        <div class="stat-pill border-1">
          <span class="stat-pill-label">ลิงก์ที่ยัง Active</span>
          <span class="stat-pill-value badge badge-active">{{ stats.activeLinks }}</span>
        </div>
        <div class="stat-pill border-1">
          <span class="stat-pill-label">ส่งต่อแล้วทั้งหมด</span>
          <span class="stat-pill-value badge badge-delegated">{{ stats.delegations }}</span>
        </div>
      </div>

      <!-- Manage Toolbar -->
      <div class="q-card q-pa-lg q-mb-md row items-center justify-between shadow-xs">
        <div class="text-h6 text-weight-bold text-gray-700">จัดการระบบ</div>
        <q-btn color="primary" label="+ สร้างภารกิจใหม่" to="/create" unelevated padding="10px 20px" />
      </div>

      <!-- Filters -->
      <div class="q-card q-pa-lg q-mb-lg shadow-xs">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">สถานะ</div>
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
            />
          </div>
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">ช่วงเวลาที่สร้าง</div>
            <q-select
              v-model="filters.dateRange"
              :options="dateOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
            />
          </div>
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">โรงเรียน</div>
            <q-select
              v-model="filters.school"
              :options="schoolOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
            />
          </div>
          <div class="col-12 col-sm-3 text-right q-pt-lg">
            <q-btn flat color="primary" icon="fa-solid fa-rotate" label="ล้างตัวกรอง" @click="resetFilters" class="text-caption" />
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <q-table
          :rows="filteredCases"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          no-data-label="ยังไม่มีเคส — กด 'สร้างภารกิจใหม่' เพื่อเริ่มต้น"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props" class="text-gray-400">
              {{ props.pageIndex + 1 }}
            </q-td>
          </template>

          <template v-slot:body-cell-student_name="props">
            <q-td :props="props" class="text-weight-bold">
              {{ props.value }}
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span :class="['badge', getBadgeClass(props.value)]">
                {{ getStatusLabel(props.value) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row q-gutter-x-sm justify-center no-wrap">
                <q-btn flat round color="primary" icon="fa-solid fa-eye" size="sm">
                  <q-tooltip>ดูรายละเอียด</q-tooltip>
                </q-btn>
                <q-btn flat round color="grey-5" icon="fa-solid fa-ellipsis-vertical" size="sm" />
              </div>
            </q-td>
          </template>
          
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props" class="text-nowrap text-gray-500">
              {{ formatDate(props.value) }}
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import type { QTableColumn } from 'quasar';

interface Case {
  id: string;
  student_name: string;
  student_school: string;
  reason_flagged: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

interface Stats {
  total: number;
  inProgress: number;
  resolved: number;
  today: number;
  pendingReview: number;
  activeLinks: number;
  delegations: number;
}

const loading = ref(false);
const rawCases = ref<Case[]>([]);

const stats = reactive<Stats>({
  total: 0,
  inProgress: 0,
  resolved: 0,
  today: 0,
  pendingReview: 0,
  activeLinks: 0,
  delegations: 0,
});

const filters = reactive({
  status: 'ALL',
  dateRange: 'ALL',
  school: 'ALL',
});

const statusOptions = [
  { label: 'ทุกสถานะ', value: 'ALL' },
  { label: 'รอผอ.ประเมิน', value: 'PENDING_REVIEW' },
  { label: 'กำลังดำเนินการ', value: 'IN_PROGRESS' },
  { label: 'ปิดเคสแล้ว', value: 'RESOLVED' },
];

const dateOptions = [
  { label: 'ทุกช่วงเวลา', value: 'ALL' },
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7' },
  { label: '30 วันที่ผ่านมา', value: 'LAST_30' },
];

const schoolOptions = [
  { label: 'ทุกโรงเรียน', value: 'ALL' },
];

const columns: QTableColumn[] = [
  { name: 'index', label: '#', field: 'index', align: 'left' },
  { name: 'student_name', label: 'ชื่อนักเรียน', field: 'student_name', align: 'left', sortable: true },
  { name: 'school', label: 'โรงเรียน', field: 'student_school', align: 'left', sortable: true },
  { name: 'reason', label: 'สาเหตุ', field: 'reason_flagged', align: 'left' },
  { name: 'status', label: 'สถานะ', field: 'status', align: 'center', sortable: true },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'center' },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/cases');
    rawCases.value = res.data;
    
    // Fetch stats
    const statsRes = await api.get('/api/stats');
    Object.assign(stats, statsRes.data);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const filteredCases = computed(() => {
  return rawCases.value.filter(c => {
    if (filters.status !== 'ALL' && c.status !== filters.status) return false;
    return true;
  });
});

const getBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW': return 'badge-pending';
    case 'IN_PROGRESS': return 'badge-progress';
    case 'RESOLVED': return 'badge-completed';
    default: return 'badge-active';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW': return 'รอผอ.ประเมิน';
    case 'IN_PROGRESS': return 'กำลังดำเนินการ';
    case 'RESOLVED': return 'ปิดเคสสำเร็จ';
    default: return status;
  }
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
};

const resetFilters = () => {
  filters.status = 'ALL';
  filters.dateRange = 'ALL';
  filters.school = 'ALL';
};

onMounted(fetchData);
</script>

<style lang="scss" scoped>
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
}
.border-1 {
  border: 1px solid #e5e7eb;
}
</style>
