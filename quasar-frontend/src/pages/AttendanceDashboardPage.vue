<template>
  <q-page class="q-pa-lg">
    <div style="max-width:1300px; width:100%; margin: 0 auto;">
      
      <!-- Summary Stats -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--total full-height">
            <div class="stat-label">ลิงก์ทั้งหมด</div>
            <div class="stat-value text-h4">{{ cardStats.total }}</div>
            <div class="stat-sub">ลิงก์</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--progress full-height">
            <div class="stat-label">Active</div>
            <div class="stat-value text-h4">{{ cardStats.active }}</div>
            <div class="stat-sub">ลิงก์</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--resolved full-height">
            <div class="stat-label">ถูกล็อก</div>
            <div class="stat-value text-h4">{{ cardStats.locked }}</div>
            <div class="stat-sub">ลิงก์</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--today full-height">
            <div class="stat-label">หมดอายุ</div>
            <div class="stat-value text-h4">{{ cardStats.expired }}</div>
            <div class="stat-sub">ลิงก์</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="q-card q-pa-lg q-mb-md shadow-xs">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-gray-700">จัดการลิงก์เช็คชื่อ</div>
          <q-btn color="primary" label="+ สร้างลิงก์เช็คชื่อใหม่" to="/create" unelevated padding="10px 20px" class="full-width-mobile" />
        </div>
      </div>

      <!-- Filters -->
      <div class="q-card q-pa-lg q-mb-lg shadow-xs">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">ชั้นเรียน</div>
            <q-select
              v-model="filters.grade"
              :options="gradeOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
            />
          </div>
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">ห้อง</div>
            <q-select
              v-model="filters.room"
              :options="roomOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
            />
          </div>
          <div class="col-12 col-sm-3">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">สถานะลิงก์</div>
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
          <div class="col-12 col-sm-3 text-right q-pt-lg">
            <q-btn flat color="primary" icon="fa-solid fa-rotate" label="ล้างตัวกรอง" @click="resetFilters" class="text-caption" />
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <q-table
          :rows="filteredTasks"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          no-data-label="ไม่พบลิงก์ที่ตรงกับตัวกรอง"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props" class="text-gray-400">
              {{ props.pageIndex + 1 }}
            </q-td>
          </template>

          <template v-slot:body-cell-task_type="props">
            <q-td :props="props">
              <span class="badge" :style="props.row.task_type === 'VISIT' ? 'background:#dcfce7;color:#15803d;' : 'background:#dbeafe;color:#1e40af;'">
                {{ props.row.task_type === 'VISIT' ? '📍 ลงพื้นที่' : '📋 เช็คชื่อ' }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-class="props">
            <q-td :props="props">
              <strong v-if="props.row.task_type === 'ATTENDANCE'">{{ props.row.target_grade }}/{{ props.row.target_room }}</strong>
              <span v-else class="text-gray-500">-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span v-if="props.row.active_link && !props.row.active_link_locked" class="badge badge-active">✅ Active</span>
              <span v-else-if="props.row.active_link && props.row.active_link_locked" class="badge" style="background:#fee2e2;color:#b91c1c;">🔒 ถูกล็อก</span>
              <span v-else class="badge" style="background:#f3f4f6;color:#6b7280;">⏳ หมดอายุ</span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div v-if="props.row.active_link" class="row q-gutter-x-sm no-wrap">
                <template v-if="!props.row.active_link_locked">
                  <q-btn flat dense color="primary" label="👁️ เปิด" :href="getPublicLink(props.row)" target="_blank" class="action-btn" />
                  <q-btn flat dense color="grey-7" label="📋 คัดลอก" @click="copyLink(getPublicLink(props.row))" class="action-btn" />
                  <q-btn flat dense color="green" label="💬 LINE" :href="getLineUrl(getPublicLink(props.row))" target="_blank" class="action-btn" />
                  <q-btn flat dense color="red" label="🔒 ปิดลิงก์" @click="lockLink(props.row.active_link_id)" class="action-btn" />
                </template>
                <span v-else class="badge badge-expired">ปิดโดยผู้ดูแล</span>
              </div>
              <span v-else class="text-gray-400">ไม่มีลิงก์</span>
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
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';

interface AttendanceTask {
  id: string;
  task_type: string;
  target_grade: string;
  target_room: string;
  link_assigned_to: string;
  active_link: string | null;
  active_link_locked: boolean;
  active_link_id: string;
  created_at: string;
}

interface SelectOption {
  label: string;
  value: string;
}

interface GradeLevel {
  id: number;
  label: string;
  category: string;
}

const $q = useQuasar();
const loading = ref(false);
const tasks = ref<AttendanceTask[]>([]);

const filters = reactive({
  grade: 'ALL',
  room: 'ALL',
  status: 'ALL',
});

const gradeOptions = ref<SelectOption[]>([{ label: 'ทุกชั้น', value: 'ALL' }]);

const fetchGradeLevels = async () => {
  try {
    const res = await api.get('/api/attendance/grade-levels');
    const levels = res.data.data.map((l: GradeLevel) => ({
      label: l.label,
      value: l.label
    }));
    gradeOptions.value = [{ label: 'ทุกชั้น', value: 'ALL' }, ...levels];
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const roomOptions = [
  { label: 'ทุกห้อง', value: 'ALL' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
];

const statusOptions = [
  { label: 'ทุกสถานะ', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'ถูกล็อก', value: 'LOCKED' },
  { label: 'หมดอายุ', value: 'EXPIRED' },
];

const columns: QTableColumn[] = [
  { name: 'index', label: '#', field: 'index', align: 'left' },
  { name: 'class', label: 'ชั้น/ห้อง', field: 'target_grade', align: 'left' },
  { name: 'assigned_to', label: 'ผู้รับผิดชอบ', field: 'link_assigned_to', align: 'left' },
  { name: 'status', label: 'สถานะลิงก์', field: 'status', align: 'center' },
  { name: 'actions', label: 'ลิงก์ & การจัดการ', field: 'id', align: 'left' },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right' },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/attendance/tasks');
    tasks.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getLinkStatus = (task: AttendanceTask) => {
  if (task.active_link && !task.active_link_locked) return 'ACTIVE';
  if (task.active_link && task.active_link_locked) return 'LOCKED';
  return 'EXPIRED';
};

const filteredTasks = computed(() => {
  return tasks.value.filter(t => {
    if (filters.grade !== 'ALL' && t.target_grade !== filters.grade) return false;
    if (filters.room !== 'ALL' && t.target_room !== filters.room) return false;
    if (filters.status !== 'ALL' && getLinkStatus(t) !== filters.status) return false;
    return true;
  });
});

const cardStats = computed(() => {
  const stats = { total: tasks.value.length, active: 0, locked: 0, expired: 0 };
  tasks.value.forEach(t => {
    const s = getLinkStatus(t);
    if (s === 'ACTIVE') stats.active++;
    else if (s === 'LOCKED') stats.locked++;
    else stats.expired++;
  });
  return stats;
});

const getPublicLink = (task: AttendanceTask) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/task/${task.active_link_id}`;
};

const getLineUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
};

const copyLink = (link: string) => {
  void navigator.clipboard.writeText(link).then(() => {
    $q.notify({ message: 'คัดลอกลิงก์สำเร็จ', color: 'positive', position: 'top', timeout: 2000 });
  });
};

const lockLink = async (linkId: string) => {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการปิดลิงก์เช็คชื่อนี้?')) return;
  try {
    await api.post(`/api/task-links/${linkId}/admin-lock`, { reason: 'Admin manually locked' });
    $q.notify({ message: 'ปิดลิงก์สำเร็จ', color: 'positive' });
    await fetchData();
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาด', color: 'negative' });
  }
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resetFilters = () => {
  filters.grade = 'ALL';
  filters.room = 'ALL';
  filters.status = 'ALL';
};

onMounted(async () => {
  await fetchGradeLevels();
  await fetchData();
});
</script>

<style lang="scss" scoped>
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
}

@media (max-width: 600px) {
  .full-width-mobile {
    width: 100%;
  }
}

.table-wrap {
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  background: white;
  overflow-x: auto;
}

:deep(.q-table) {
  thead tr th {
    background-color: #f8fafc;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 16px;
  }
}

:deep(.q-table__container) {
  min-width: 900px;
}

.action-btn {
  font-size: 0.75rem;
  font-weight: 700 !important;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  margin-right: 4px;
  
  &:hover {
    background: #f8fafc;
  }
}
</style>
