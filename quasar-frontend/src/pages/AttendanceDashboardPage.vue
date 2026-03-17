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

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--total full-height">
            <div class="stat-head">
              <i class="fa-solid fa-link"></i>
              <div class="stat-label">ลิงก์ทั้งหมด</div>
            </div>
            <div class="stat-value text-h4">{{ cardStats.total }}</div>
            <div class="stat-sub">ลิงก์ในระบบ</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--progress full-height">
            <div class="stat-head">
              <i class="fa-solid fa-bolt"></i>
              <div class="stat-label">ใช้งานอยู่</div>
            </div>
            <div class="stat-value text-h4">{{ cardStats.active }}</div>
            <div class="stat-sub">พร้อมใช้งาน</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--resolved full-height">
            <div class="stat-head">
              <i class="fa-solid fa-lock"></i>
              <div class="stat-label">ถูกล็อก</div>
            </div>
            <div class="stat-value text-h4">{{ cardStats.locked }}</div>
            <div class="stat-sub">ถูกปิดโดยผู้ดูแล</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--today full-height">
            <div class="stat-head">
              <i class="fa-solid fa-hourglass-end"></i>
              <div class="stat-label">หมดอายุ</div>
            </div>
            <div class="stat-value text-h4">{{ cardStats.expired }}</div>
            <div class="stat-sub">ต้องสร้างลิงก์ใหม่</div>
          </div>
        </div>
      </div>

      <div class="q-card q-pa-lg q-mb-md shadow-xs control-bar">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-gray-700">จัดการลิงก์เช็คชื่อ</div>
          <div class="result-counter">
            แสดง <strong>{{ filteredTasks.length }}</strong> จาก <strong>{{ tasks.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <div class="q-card q-pa-lg q-mb-lg shadow-xs filter-panel">
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
        <div v-for="(row, i) in filteredTasks" :key="row.id" class="mobile-card">
          <div class="mobile-card-top">
            <div>
              <div class="mobile-card-name">{{ i + 1 }}. {{ row.target_grade }}/{{ row.target_room }}</div>
              <div class="mobile-card-meta">ผู้รับผิดชอบ: {{ row.link_assigned_to || '-' }}</div>
            </div>
            <span v-if="row.active_link && !row.active_link_locked" class="badge badge-active">สถานะ: ใช้งานอยู่</span>
            <span v-else-if="row.active_link && row.active_link_locked" class="badge badge-expired">สถานะ: ถูกปิดโดยผู้ดูแล</span>
            <span v-else class="badge badge-neutral">สถานะ: หมดอายุ</span>
          </div>

          <div class="mobile-card-info">
            <span>สร้างเมื่อ {{ formatDate(row.created_at) }}</span>
          </div>

          <div class="mobile-card-actions">
            <div class="row-action-group">
              <q-btn
                v-if="isLinkReady(row)"
                flat
                dense
                color="primary"
                label="เปิดลิงก์"
                class="action-btn action-btn--open"
                :href="getPublicLink(row)"
                target="_blank"
              />
              <span v-else class="status-text status-text--muted">ไม่มีลิงก์ที่ใช้งานได้</span>
            </div>

            <q-btn
              v-if="hasRowMenu(row)"
              flat
              round
              dense
              color="grey-7"
              icon="fa-solid fa-ellipsis-vertical"
              class="action-menu-btn"
            >
              <q-menu auto-close>
                <q-list dense style="min-width: 190px">
                  <q-item clickable class="action-menu-item action-menu-item--copy" @click="copyLink(getPublicLink(row))">
                    <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
                    <q-item-section>คัดลอกลิงก์</q-item-section>
                  </q-item>
                  <q-item
                    v-if="isLinkReady(row)"
                    clickable
                    class="action-menu-item action-menu-item--share"
                    tag="a"
                    :href="getLineUrl(getPublicLink(row))"
                    target="_blank"
                  >
                    <q-item-section avatar><i class="fa-brands fa-line"></i></q-item-section>
                    <q-item-section>แชร์ผ่าน LINE</q-item-section>
                  </q-item>
                  <q-separator v-if="row.active_link_id" />
                  <q-item
                    v-if="row.active_link_id && row.active_link_locked"
                    clickable
                    class="action-menu-item action-menu-item--unlock"
                    @click="openAdminActionDialog(row.active_link_id, 'unlock')"
                  >
                    <q-item-section avatar><i class="fa-solid fa-lock-open"></i></q-item-section>
                    <q-item-section>เปิดลิงก์อีกครั้ง</q-item-section>
                  </q-item>
                  <q-item
                    v-if="row.active_link_id && !row.active_link_locked"
                    clickable
                    class="action-menu-item action-menu-item--lock"
                    @click="openAdminActionDialog(row.active_link_id, 'lock')"
                  >
                    <q-item-section avatar><i class="fa-solid fa-lock"></i></q-item-section>
                    <q-item-section>ปิดลิงก์</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <q-table
          :rows="filteredTasks"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          :no-data-label="tableEmptyLabel"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props" class="text-gray-400">
              {{ props.pageIndex + 1 }}
            </q-td>
          </template>

          <template v-slot:body-cell-class="props">
            <q-td :props="props">
              <strong>{{ props.row.target_grade }}/{{ props.row.target_room }}</strong>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span v-if="props.row.active_link && !props.row.active_link_locked" class="badge badge-active">สถานะ: ใช้งานอยู่</span>
              <span v-else-if="props.row.active_link && props.row.active_link_locked" class="badge badge-expired">สถานะ: ถูกปิดโดยผู้ดูแล</span>
              <span v-else class="badge badge-neutral">สถานะ: หมดอายุ</span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row-action-group">
                <q-btn
                  v-if="isLinkReady(props.row)"
                  flat
                  dense
                  color="primary"
                  label="เปิดลิงก์"
                  :href="getPublicLink(props.row)"
                  target="_blank"
                  class="action-btn action-btn--open"
                />
                <span v-else class="status-text status-text--muted">ไม่มีลิงก์ที่ใช้งานได้</span>

                <q-btn
                  v-if="hasRowMenu(props.row)"
                  flat
                  round
                  dense
                  color="grey-7"
                  icon="fa-solid fa-ellipsis-vertical"
                  class="action-menu-btn"
                >
                  <q-menu auto-close>
                    <q-list dense style="min-width: 190px">
                      <q-item clickable class="action-menu-item action-menu-item--copy" @click="copyLink(getPublicLink(props.row))">
                        <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
                        <q-item-section>คัดลอกลิงก์</q-item-section>
                      </q-item>
                      <q-item
                        v-if="isLinkReady(props.row)"
                        clickable
                        class="action-menu-item action-menu-item--share"
                        tag="a"
                        :href="getLineUrl(getPublicLink(props.row))"
                        target="_blank"
                      >
                        <q-item-section avatar><i class="fa-brands fa-line"></i></q-item-section>
                        <q-item-section>แชร์ผ่าน LINE</q-item-section>
                      </q-item>
                      <q-separator v-if="props.row.active_link_id" />
                      <q-item
                        v-if="props.row.active_link_id && props.row.active_link_locked"
                        clickable
                        class="action-menu-item action-menu-item--unlock"
                        @click="openAdminActionDialog(props.row.active_link_id, 'unlock')"
                      >
                        <q-item-section avatar><i class="fa-solid fa-lock-open"></i></q-item-section>
                        <q-item-section>เปิดลิงก์อีกครั้ง</q-item-section>
                      </q-item>
                      <q-item
                        v-if="props.row.active_link_id && !props.row.active_link_locked"
                        clickable
                        class="action-menu-item action-menu-item--lock"
                        @click="openAdminActionDialog(props.row.active_link_id, 'lock')"
                      >
                        <q-item-section avatar><i class="fa-solid fa-lock"></i></q-item-section>
                        <q-item-section>ปิดลิงก์</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
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

    <q-dialog v-model="adminActionDialog.show">
      <q-card style="min-width: 360px; max-width: 92vw;">
        <q-card-section>
          <div class="text-h6">{{ adminDialogTitle }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">{{ adminDialogHint }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="adminActionDialog.reason"
            :label="adminReasonLabel"
            outlined
            dense
            autogrow
            type="textarea"
            :rules="[val => !!val || 'กรุณาระบุเหตุผล']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn
            :color="adminActionDialog.action === 'lock' ? 'negative' : 'primary'"
            :label="adminConfirmLabel"
            @click="confirmAdminAction"
            :loading="adminActionDialog.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const lastUpdated = ref('');
const loadError = ref('');

type AdminAction = 'lock' | 'unlock';

const adminActionDialog = reactive<{
  show: boolean;
  action: AdminAction;
  linkId: string;
  reason: string;
  loading: boolean;
}>({
  show: false,
  action: 'lock',
  linkId: '',
  reason: '',
  loading: false
});

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
  { label: 'ใช้งานอยู่', value: 'ACTIVE' },
  { label: 'ถูกล็อก', value: 'LOCKED' },
  { label: 'หมดอายุ', value: 'EXPIRED' },
];

const columns: QTableColumn<AttendanceTask>[] = [
  { name: 'index', label: '#', field: (row: AttendanceTask) => row.id, align: 'left' },
  { name: 'class', label: 'ชั้น/ห้อง', field: (row: AttendanceTask) => `${row.target_grade}/${row.target_room}`, align: 'left' },
  { name: 'assigned_to', label: 'ผู้รับผิดชอบ', field: 'link_assigned_to', align: 'left' },
  { name: 'status', label: 'สถานะลิงก์', field: (row: AttendanceTask) => getLinkStatus(row), align: 'center' },
  { name: 'actions', label: 'การจัดการ', field: 'id', align: 'left' },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right' },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/attendance/tasks');
    tasks.value = res.data;
    loadError.value = '';
    lastUpdated.value = new Date().toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    console.error(err);
    loadError.value = 'ตรวจสอบการเชื่อมต่อหรือสิทธิ์การเข้าถึง แล้วกดรีเฟรชอีกครั้ง';
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await fetchData();
};

const getLinkStatus = (task: AttendanceTask) => {
  if (task.active_link && !task.active_link_locked) return 'ACTIVE';
  if (task.active_link && task.active_link_locked) return 'LOCKED';
  return 'EXPIRED';
};

const filteredTasks = computed<AttendanceTask[]>(() => {
  return tasks.value.filter(t => {
    if (filters.grade !== 'ALL' && t.target_grade !== filters.grade) return false;
    if (filters.room !== 'ALL' && t.target_room !== filters.room) return false;
    if (filters.status !== 'ALL' && getLinkStatus(t) !== filters.status) return false;
    return true;
  });
});

const hasActiveFilter = computed(() => {
  return filters.grade !== 'ALL' || filters.room !== 'ALL' || filters.status !== 'ALL';
});

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

const activeRate = computed(() => {
  if (!cardStats.value.total) return 0;
  return Math.round((cardStats.value.active / cardStats.value.total) * 100);
});

const isLinkReady = (row: AttendanceTask) => Boolean(row.active_link && !row.active_link_locked);

const hasRowMenu = (row: AttendanceTask) => Boolean(row.active_link_id || row.active_link);

const getPublicLink = (task: AttendanceTask) => {
  if (task.active_link) {
    return normalizePublicLink(task.active_link);
  }
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/task/${task.active_link_id}`;
};

const normalizePublicLink = (rawLink: string) => {
  if (!rawLink) return rawLink;
  try {
    const url = new URL(rawLink, window.location.origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
    }
    return url.toString();
  } catch {
    return rawLink;
  }
};

const getLineUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
};

const copyLink = async (link: string) => {
  try {
    await navigator.clipboard.writeText(link);
    $q.notify({ message: 'คัดลอกลิงก์สำเร็จ', color: 'positive', position: 'top', timeout: 2000 });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกลิงก์ได้', color: 'negative', position: 'top' });
  }
};

const openAdminActionDialog = (linkId: string, action: AdminAction) => {
  adminActionDialog.linkId = linkId;
  adminActionDialog.action = action;
  adminActionDialog.reason = action === 'lock'
    ? 'ปิดลิงก์โดยผู้ดูแลระบบ'
    : 'เปิดลิงก์อีกครั้งโดยผู้ดูแลระบบ';
  adminActionDialog.show = true;
};

const adminDialogTitle = computed(() =>
  adminActionDialog.action === 'lock' ? 'ยืนยันปิดลิงก์เช็คชื่อ' : 'ยืนยันเปิดลิงก์เช็คชื่อ'
);

const adminDialogHint = computed(() =>
  adminActionDialog.action === 'lock'
    ? 'ระบบจะปิดการใช้งานลิงก์นี้ทันที และบันทึกเหตุผลไว้'
    : 'ระบบจะเปิดใช้งานลิงก์นี้อีกครั้ง และบันทึกเหตุผลไว้'
);

const adminReasonLabel = computed(() =>
  adminActionDialog.action === 'lock' ? 'เหตุผลที่ปิดลิงก์' : 'เหตุผลที่เปิดลิงก์'
);

const adminConfirmLabel = computed(() =>
  adminActionDialog.action === 'lock' ? 'ยืนยันปิดลิงก์' : 'ยืนยันเปิดลิงก์'
);

const confirmAdminAction = async () => {
  if (!adminActionDialog.reason.trim()) {
    $q.notify({ message: 'กรุณาระบุเหตุผล', color: 'warning' });
    return;
  }

  adminActionDialog.loading = true;
  try {
    await api.post(`/api/task-links/${adminActionDialog.linkId}/admin-lock`, {
      action: adminActionDialog.action,
      reason: adminActionDialog.reason.trim()
    });
    $q.notify({
      message: adminActionDialog.action === 'lock' ? 'ปิดลิงก์สำเร็จ' : 'เปิดลิงก์สำเร็จ',
      color: 'positive'
    });
    adminActionDialog.show = false;
    await fetchData();
  } catch {
    $q.notify({ message: 'ไม่สามารถอัปเดตสถานะลิงก์ได้', color: 'negative' });
  } finally {
    adminActionDialog.loading = false;
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
  min-width: 980px;
}
</style>
