<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="dashboard-shell">
      <section class="hero-panel q-mb-sm">
        <div class="hero-main">
          <p class="hero-kicker">Attendance Command Center</p>
          <h1 class="hero-title">แดชบอร์ดจัดการลิงก์เช็คชื่อ</h1>
          <p class="hero-subtitle">
            ควบคุมลิงก์เช็คชื่อในแต่ละชั้นเรียน ตรวจสอบสถานะลิงก์ และจัดการได้ทันทีในหน้าเดียว
          </p>
          <div class="hero-meta">
            <span class="hero-chip">
              <i class="fa-regular fa-clock q-mr-xs"></i>
              อัปเดตล่าสุด: {{ lastUpdated || '-' }}
            </span>
            <span class="hero-chip hero-chip--accent">
              ลิงก์ Active {{ activeRate }}%
            </span>
          </div>
        </div>
        <div class="hero-actions">
          <q-btn
            outline
            color="white"
            icon="fa-solid fa-rotate"
            label="รีเฟรช"
            :loading="loading"
            @click="refreshData"
          />
          <q-btn
            color="white"
            text-color="primary"
            icon="fa-solid fa-plus"
            label="สร้างลิงก์เช็คชื่อใหม่"
            to="/create"
            unelevated
          />
        </div>
      </section>

      <AttendanceDashboardSummaryCards :stats="cardStats" />

      <div class="q-card q-mb-sm control-bar">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-gray-700">จัดการลิงก์เช็คชื่อ</div>
          <div class="result-counter">
            แสดง <strong>{{ filteredTasks.length }}</strong> จาก <strong>{{ tasks.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <div class="q-card q-mb-md filter-panel">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-4">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">โรงเรียน</div>
            <q-select
              v-model="filters.schoolId"
              :options="schoolOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              :disable="isSchoolLocked"
            />
          </div>
          <div class="col-6 col-md-2">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">ชั้นเรียน</div>
            <q-select
              v-model="filters.grade"
              :options="gradeOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              :disable="isGradeLocked"
            />
          </div>
          <div class="col-6 col-md-2">
            <div class="text-caption text-gray-500 q-mb-xs font-weight-bold">ห้อง</div>
            <q-select
              v-model="filters.room"
              :options="roomOptions"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              :disable="isRoomLocked || roomOptions.length <= 1"
            />
          </div>
          <div class="col-6 col-md-2">
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
          <div class="col-6 col-md-2 text-right q-pt-lg">
            <q-btn flat color="primary" icon="fa-solid fa-rotate" label="ล้างตัวกรอง" @click="resetFilters" class="text-caption" />
          </div>
        </div>
      </div>

      <q-banner v-if="loadError" class="state-banner q-mb-md">
        <div class="text-weight-bold">ไม่สามารถโหลดข้อมูลลิงก์เช็คชื่อได้</div>
        <div class="text-caption">{{ loadError }}</div>
        <template v-slot:action>
          <q-btn flat color="negative" label="ลองโหลดอีกครั้ง" @click="refreshData" />
        </template>
      </q-banner>

      <div class="mobile-list">
        <div v-if="loading" class="mobile-empty">
          กำลังโหลดข้อมูลลิงก์...
        </div>
        <div v-else-if="filteredTasks.length === 0" class="mobile-empty">
          <p class="q-mb-sm">{{ mobileEmptyMessage }}</p>
          <q-btn
            v-if="hasActiveFilter"
            flat
            color="primary"
            icon="fa-solid fa-rotate"
            label="ล้างตัวกรอง"
            @click="resetFilters"
          />
        </div>
        <div v-for="(row, i) in filteredTasks" :key="row.task_id" class="mobile-card">
          <div class="mobile-card-top">
            <div>
              <div class="mobile-card-name">{{ i + 1 }}. {{ row.target_grade || '-' }}/{{ row.target_room || '-' }}</div>
              <div class="mobile-card-meta">โรงเรียน: {{ row.target_school_name || '-' }}</div>
              <div class="mobile-card-meta">ผู้รับผิดชอบ: {{ row.link_assigned_to || '-' }}</div>
            </div>
            <AttendanceTaskStatusBadge :task="row" prefix="สถานะ" />
          </div>

          <div class="mobile-card-info">
            <span>สร้างเมื่อ {{ formatDate(row.created_at) }}</span>
          </div>

          <div class="mobile-card-actions">
            <AttendanceTaskRowActions
              :task="row"
              @admin-action="openAdminActionDialog"
            />
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <q-table
          :rows="filteredTasks"
          :columns="columns"
          row-key="task_id"
          flat
          dense
          :loading="loading"
          :no-data-label="tableEmptyLabel"
          v-model:pagination="pagination"
          :rows-per-page-options="[15, 20, 30, 50, 100]"
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props" class="text-gray-400">
              {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
            </q-td>
          </template>

          <template v-slot:body-cell-class="props">
            <q-td :props="props">
              <strong>{{ props.row.target_grade || '-' }}/{{ props.row.target_room || '-' }}</strong>
            </q-td>
          </template>

          <template v-slot:body-cell-school="props">
            <q-td :props="props">
              {{ props.row.target_school_name || '-' }}
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <AttendanceTaskStatusBadge :task="props.row" prefix="สถานะ" />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <AttendanceTaskRowActions
                :task="props.row"
                @admin-action="openAdminActionDialog"
              />
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

    <TaskLinkAdminDialog
      v-model="adminActionDialog.show"
      :reason="adminActionDialog.reason"
      :title="adminDialogTitle"
      :hint="adminDialogHint"
      :reason-label="adminReasonLabel"
      :confirm-label="adminConfirmLabel"
      :action="adminActionDialog.action"
      :loading="adminActionDialog.loading"
      @update:reason="adminActionDialog.reason = $event"
      @confirm="confirmAdminAction"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import AttendanceDashboardSummaryCards from '../components/attendance/AttendanceDashboardSummaryCards.vue';
import AttendanceTaskRowActions from '../components/attendance/AttendanceTaskRowActions.vue';
import AttendanceTaskStatusBadge from '../components/attendance/AttendanceTaskStatusBadge.vue';
import TaskLinkAdminDialog from '../components/task/TaskLinkAdminDialog.vue';
import type { QTableColumn } from 'quasar';
import { useAttendanceDashboardData } from '../composables/useAttendanceDashboardData';
import { useAttendanceFilters } from '../composables/useAttendanceFilters';
import { useUserStore } from '../composables/useUserStore';
import { useDataScopeLock } from '../composables/useDataScopeLock';
import { useTaskLinkAdminDialog } from '../composables/useTaskLinkAdminDialog';
import {
  mapAttendanceGradesToOptions,
  mapAttendanceSchoolsToOptions,
} from '../utils/attendanceLookupOptions';
import type {
  AttendanceTask,
  AttendanceTaskStatus,
} from '../types/attendance';
import {
  buildAttendanceTaskCardStats,
  formatAttendanceDate,
  getAttendanceTaskStatus,
  sortAttendanceRoomValues,
} from '../utils/attendancePresentation';

interface SelectOption {
  label: string;
  value: string;
}

interface AttendanceTaskFilters {
  schoolId: string;
  grade: string;
  room: string;
  status: string;
}

const pagination = ref({ page: 1, rowsPerPage: 30 });
const { user, loadUser } = useUserStore();
const userScope = computed(() => user.value?.data_scope);
const {
  isSchoolLocked,
  isGradeLocked,
  isRoomLocked,
  lockedSchoolValue,
  lockedGradeValue,
  lockedRoomValue,
} = useDataScopeLock(userScope);
const {
  gradeLevels,
  schools,
  rooms,
  loadAllSchools,
  loadGradeLevels,
  loadRooms,
} = useAttendanceFilters();
const {
  loading,
  tasks,
  lastUpdated,
  loadError,
  fetchTasks,
  refreshData,
} = useAttendanceDashboardData();
const {
  adminActionDialog,
  adminDialogTitle,
  adminDialogHint,
  adminReasonLabel,
  adminConfirmLabel,
  openAdminActionDialog,
  confirmAdminAction,
} = useTaskLinkAdminDialog({
  lockTitle: 'ยืนยันปิดลิงก์เช็คชื่อ',
  unlockTitle: 'ยืนยันเปิดลิงก์เช็คชื่อ',
  lockHint: 'ระบบจะปิดการใช้งานลิงก์นี้ทันที และบันทึกเหตุผลไว้',
  unlockHint: 'ระบบจะเปิดใช้งานลิงก์นี้อีกครั้ง และบันทึกเหตุผลไว้',
  lockSuccessMessage: 'ปิดลิงก์สำเร็จ',
  unlockSuccessMessage: 'เปิดลิงก์สำเร็จ',
  errorMessage: 'ไม่สามารถอัปเดตสถานะลิงก์ได้',
  onSuccess: async () => {
    await refreshData();
  },
});

const filters = reactive<AttendanceTaskFilters>({
  schoolId: 'ALL',
  grade: 'ALL',
  room: 'ALL',
  status: 'ALL',
});

const statusOptions: SelectOption[] = [
  { label: 'ทุกสถานะ', value: 'ALL' },
  { label: 'ใช้งานอยู่', value: 'ACTIVE' },
  { label: 'ถูกล็อก', value: 'LOCKED' },
  { label: 'หมดอายุ', value: 'EXPIRED' },
];

const normalizeScopeValueList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
};

const currentUserScope = computed(() => ({
  provinces: normalizeScopeValueList(user.value?.data_scope?.provinces),
  districts: normalizeScopeValueList(user.value?.data_scope?.districts),
  sub_districts: normalizeScopeValueList(user.value?.data_scope?.sub_districts),
  school_ids: normalizeScopeValueList(user.value?.data_scope?.school_ids),
  grade_levels: normalizeScopeValueList(user.value?.data_scope?.grade_levels),
  room_ids: normalizeScopeValueList(user.value?.data_scope?.room_ids),
}));

const schoolOptions = computed<SelectOption[]>(() => {
  let list = mapAttendanceSchoolsToOptions(schools.value);

  if (currentUserScope.value.provinces.length > 0) {
    list = list.filter((school) => currentUserScope.value.provinces.includes(String(school.province || '')));
  }
  if (currentUserScope.value.districts.length > 0) {
    list = list.filter((school) => currentUserScope.value.districts.includes(String(school.district || '')));
  }
  if (currentUserScope.value.sub_districts.length > 0) {
    list = list.filter((school) => currentUserScope.value.sub_districts.includes(String(school.sub_district || '')));
  }
  if (currentUserScope.value.school_ids.length > 0) {
    list = list.filter((school) => currentUserScope.value.school_ids.includes(String(school.value)));
  }

  return [
    { label: 'ทุกโรงเรียน', value: 'ALL' },
    ...list.map((school) => ({
      label: school.label,
      value: String(school.value),
    })),
  ];
});

const gradeOptions = computed<SelectOption[]>(() => {
  let list = mapAttendanceGradesToOptions(gradeLevels.value);

  if (currentUserScope.value.grade_levels.length > 0) {
    list = list.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.value)));
  }

  return [
    { label: 'ทุกชั้น', value: 'ALL' },
    ...list.map((grade) => ({
      label: grade.label,
      value: grade.label,
    })),
  ];
});

const taskDerivedRoomValues = computed(() => {
  let list = tasks.value;

  if (filters.schoolId !== 'ALL') {
    list = list.filter((task) => String(task.target_school_id ?? '') === filters.schoolId);
  }

  if (filters.grade !== 'ALL') {
    list = list.filter((task) => task.target_grade === filters.grade);
  }

  let values = Array.from(new Set(
    list
      .map((task) => String(task.target_room || '').trim())
      .filter(Boolean),
  ));

  if (currentUserScope.value.room_ids.length > 0) {
    values = values.filter((room) => currentUserScope.value.room_ids.includes(room));
  }

  return values.sort(sortAttendanceRoomValues);
});

const availableRoomValues = computed(() => {
  let values = (
    filters.schoolId !== 'ALL' && filters.grade !== 'ALL' && rooms.value.length > 0
      ? rooms.value.map(String)
      : taskDerivedRoomValues.value
  );

  values = Array.from(new Set(values.map((room) => String(room).trim()).filter(Boolean)));

  if (currentUserScope.value.room_ids.length > 0) {
    values = values.filter((room) => currentUserScope.value.room_ids.includes(room));
  }

  return values.sort(sortAttendanceRoomValues);
});

const roomOptions = computed<SelectOption[]>(() => [
  { label: 'ทุกห้อง', value: 'ALL' },
  ...availableRoomValues.value.map((room) => ({
    label: `ห้อง ${room}`,
    value: room,
  })),
]);

const columns: QTableColumn<AttendanceTask>[] = [
  { name: 'index', label: '#', field: (row: AttendanceTask) => row.task_id, align: 'left' },
  { name: 'class', label: 'ชั้น/ห้อง', field: (row: AttendanceTask) => `${row.target_grade}/${row.target_room}`, align: 'left' },
  { name: 'school', label: 'โรงเรียน', field: (row: AttendanceTask) => row.target_school_name || '-', align: 'left' },
  { name: 'assigned_to', label: 'ผู้รับผิดชอบ', field: 'link_assigned_to', align: 'left' },
  { name: 'status', label: 'สถานะ', field: (row: AttendanceTask) => getLinkStatus(row), align: 'center' },
  { name: 'actions', label: 'การจัดการ', field: (row: AttendanceTask) => row.task_id, align: 'left' },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right' },
];

const getLockedGradeLabel = () => {
  if (!isGradeLocked.value || lockedGradeValue.value === null) {
    return 'ALL';
  }

  const lockedGrade = gradeLevels.value.find((grade) => grade.id === lockedGradeValue.value);
  return lockedGrade?.label || 'ALL';
};

const applyActiveScope = () => {
  if (isSchoolLocked.value && lockedSchoolValue.value !== null) {
    const nextSchoolId = String(lockedSchoolValue.value);
    if (filters.schoolId !== nextSchoolId) {
      filters.schoolId = nextSchoolId;
    }
  }

  const nextGrade = getLockedGradeLabel();
  if (isGradeLocked.value && nextGrade !== 'ALL' && filters.grade !== nextGrade) {
    filters.grade = nextGrade;
  }

  if (isRoomLocked.value && lockedRoomValue.value !== null) {
    const nextRoom = String(lockedRoomValue.value);
    if (filters.room !== nextRoom) {
      filters.room = nextRoom;
    }
  }
};

const ensureRoomFilterValid = () => {
  if (isRoomLocked.value && lockedRoomValue.value !== null) {
    filters.room = String(lockedRoomValue.value);
    return;
  }

  if (filters.room !== 'ALL' && !availableRoomValues.value.includes(filters.room)) {
    filters.room = 'ALL';
  }
};

const fetchSchools = async () => {
  try {
    await loadAllSchools({ syncTempSchools: false });
  } catch (err) {
    console.error('Fetch schools error:', err);
  }
};

const fetchGradeFilters = async () => {
  try {
    await loadGradeLevels();
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const syncRoomOptions = async () => {
  if (filters.schoolId === 'ALL' || filters.grade === 'ALL') {
    rooms.value = [];
    ensureRoomFilterValid();
    return;
  }

  try {
    await loadRooms(filters.grade, filters.schoolId);
  } catch (err) {
    console.error('Fetch rooms error:', err);
    rooms.value = [];
  }

  ensureRoomFilterValid();
};

const getLinkStatus = (task: AttendanceTask): AttendanceTaskStatus => getAttendanceTaskStatus(task);

const filteredTasks = computed<AttendanceTask[]>(() => tasks.value.filter((task) => {
  if (filters.schoolId !== 'ALL' && String(task.target_school_id ?? '') !== filters.schoolId) return false;
  if (filters.grade !== 'ALL' && task.target_grade !== filters.grade) return false;
  if (filters.room !== 'ALL' && task.target_room !== filters.room) return false;
  if (filters.status !== 'ALL' && getLinkStatus(task) !== filters.status) return false;
  return true;
}));

const hasActiveFilter = computed(() => (
  filters.schoolId !== 'ALL'
  || filters.grade !== 'ALL'
  || filters.room !== 'ALL'
  || filters.status !== 'ALL'
));

const tableEmptyLabel = computed(() => {
  if (loading.value) return 'กำลังโหลดข้อมูล...';
  if (loadError.value) return 'โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรช';
  if (hasActiveFilter.value) return 'ไม่พบลิงก์ที่ตรงกับตัวกรอง';
  return 'ยังไม่มีลิงก์เช็คชื่อในระบบ';
});

const mobileEmptyMessage = computed(() => {
  if (loadError.value) return 'ระบบโหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรช';
  if (hasActiveFilter.value) return 'ไม่พบลิงก์ที่ตรงกับตัวกรองปัจจุบัน';
  return 'ยังไม่มีลิงก์เช็คชื่อในระบบ';
});

const cardStats = computed(() => buildAttendanceTaskCardStats(tasks.value));

const activeRate = computed(() => {
  if (!cardStats.value.total) return 0;
  return Math.round((cardStats.value.active / cardStats.value.total) * 100);
});

const formatDate = formatAttendanceDate;

const resetFilters = () => {
  filters.schoolId = isSchoolLocked.value && lockedSchoolValue.value !== null
    ? String(lockedSchoolValue.value)
    : 'ALL';
  filters.grade = getLockedGradeLabel();
  filters.room = isRoomLocked.value && lockedRoomValue.value !== null
    ? String(lockedRoomValue.value)
    : 'ALL';
  filters.status = 'ALL';
  void syncRoomOptions();
};

watch(
  [() => filters.schoolId, () => filters.grade],
  async () => {
    pagination.value.page = 1;
    await syncRoomOptions();
  },
);

watch(
  [() => filters.room, () => filters.status],
  () => {
    pagination.value.page = 1;
  },
);

watch(tasks, () => {
  ensureRoomFilterValid();
});

watch(
  [() => user.value?.data_scope, () => gradeLevels.value.length],
  () => {
    applyActiveScope();
  },
  { immediate: true, deep: true },
);

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  loadUser();
  await Promise.all([
    fetchSchools(),
    fetchGradeFilters(),
  ]);
  applyActiveScope();
  await syncRoomOptions();
  await fetchTasks();
  ensureRoomFilterValid();
  refreshInterval = setInterval(() => {
    void fetchTasks(true).then(() => {
      ensureRoomFilterValid();
    });
  }, 10000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style lang="scss" scoped>
.dashboard-page {
  background:
    radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.08), transparent 35%),
    radial-gradient(circle at 90% 0%, rgba(22, 163, 74, 0.08), transparent 30%),
    #f8fafc;
}

.hero-panel {
  background: linear-gradient(135deg, #0f172a 0%, #065f46 45%, #10b981 100%);
}

.hero-chip--accent {
  background: rgba(187, 247, 208, 0.2);
  border-color: rgba(187, 247, 208, 0.45);
}

:deep(.q-table__container) {
  min-width: 860px;
}
</style>
