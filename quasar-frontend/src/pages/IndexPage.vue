<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="dashboard-shell">
      <section class="hero-panel q-mb-sm">
        <div class="hero-main">
          <p class="hero-kicker">Student Tracking System</p>
          <h1 class="hero-title">แดชบอร์ดติดตามเคสนักเรียน</h1>
          <p class="hero-subtitle">
            ติดตามสถานะเคส, จัดการลิงก์ภารกิจ และควบคุมการทำงานของทีมในหน้าเดียว
          </p>
          <div class="hero-meta">
            <span class="hero-chip">
              <i class="fa-regular fa-clock q-mr-xs"></i>
              อัปเดตล่าสุด: {{ lastUpdated || '-' }}
            </span>
            <span class="hero-chip hero-chip--accent">
              ปิดเคสสำเร็จ {{ completionRate }}%
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
            label="สร้างภารกิจใหม่"
            to="/create"
            unelevated
          />
        </div>
      </section>
      
      <!-- Summary Stats -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--total full-height">
            <div class="stat-head">
              <i class="fa-solid fa-layer-group"></i>
              <div class="stat-label">เคสทั้งหมด</div>
            </div>
            <div class="stat-value text-h4">{{ stats.total }}</div>
            <div class="stat-sub">รายการในระบบ</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--progress full-height">
            <div class="stat-head">
              <i class="fa-solid fa-hourglass-half"></i>
              <div class="stat-label">กำลังติดตาม</div>
            </div>
            <div class="stat-value text-h4">{{ stats.inProgress }}</div>
            <div class="stat-sub">อยู่ระหว่างดำเนินการ</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--resolved full-height">
            <div class="stat-head">
              <i class="fa-solid fa-circle-check"></i>
              <div class="stat-label">ปิดเคสสำเร็จ</div>
            </div>
            <div class="stat-value text-h4">{{ stats.resolved }}</div>
            <div class="stat-sub">พร้อมสรุปผล</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card stat-card--today full-height">
            <div class="stat-head">
              <i class="fa-solid fa-calendar-day"></i>
              <div class="stat-label">เคสวันนี้</div>
            </div>
            <div class="stat-value text-h4">{{ stats.today }}</div>
            <div class="stat-sub">สร้างล่าสุดวันนี้</div>
          </div>
        </div>
      </div>

      <div class="stats-row-secondary q-mb-lg">
        <div class="stat-pill border-1">
          <span class="stat-pill-label">รอผอ.ประเมิน</span>
          <span class="stat-pill-value badge badge-pending">{{ stats.pendingReview }}</span>
        </div>
        <div class="stat-pill border-1">
          <span class="stat-pill-label">ลิงก์ที่ยังใช้งานอยู่</span>
          <span class="stat-pill-value badge badge-active">{{ stats.activeLinks }}</span>
        </div>
        <div class="stat-pill border-1">
          <span class="stat-pill-label">ส่งต่อแล้วทั้งหมด</span>
          <span class="stat-pill-value badge badge-delegated">{{ stats.delegations }}</span>
        </div>
      </div>

      <!-- Manage Toolbar -->
      <div class="q-card q-pa-lg q-mb-md shadow-xs control-bar">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-gray-700">จัดการระบบเคส</div>
          <div class="result-counter">
            แสดง <strong>{{ filteredCases.length }}</strong> จาก <strong>{{ rawCases.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="q-card q-pa-lg q-mb-lg shadow-xs filter-panel">
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

      <q-banner v-if="loadError" class="state-banner q-mb-md">
        <div class="text-weight-bold">ไม่สามารถโหลดข้อมูลเคสได้</div>
        <div class="text-caption">{{ loadError }}</div>
        <template v-slot:action>
          <q-btn flat color="negative" label="ลองโหลดอีกครั้ง" @click="refreshData" />
        </template>
      </q-banner>

      <!-- Mobile Card List (shown on mobile only) -->
      <div class="mobile-list">
        <div v-if="loading" class="mobile-empty">
          กำลังโหลดข้อมูลเคส...
        </div>
        <div v-else-if="filteredCases.length === 0" class="mobile-empty">
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
        <div v-for="(row, i) in filteredCases" :key="row.id" class="mobile-card">
          <div class="mobile-card-top">
            <div>
              <router-link v-if="row.task_id" :to="`/task-detail/${row.task_id}`" class="mobile-card-name">
                {{ i + 1 }}. {{ row.student_name }}
              </router-link>
              <span v-else class="mobile-card-name">{{ i + 1 }}. {{ row.student_name }}</span>
              <div class="mobile-card-meta">{{ row.student_school }}</div>
            </div>
            <span :class="['badge', getBadgeClass(row.status)]">{{ getStatusLabel(row.status) }}</span>
          </div>

          <div class="mobile-card-info">
            <span v-if="row.reason_flagged">เหตุผล: {{ row.reason_flagged }}</span>
            <span>สร้างเมื่อ {{ formatDate(row.created_at) }}</span>
          </div>

          <div v-if="row.active_link_locked" class="mobile-card-locked">
            ลิงก์ถูกปิดโดยผู้ดูแล
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
                :href="normalizePublicLink(row.active_link || '')"
                target="_blank"
              />
              <q-btn
                v-else-if="row.task_id"
                flat
                dense
                color="primary"
                label="ดูรายละเอียด"
                class="action-btn action-btn--detail"
                :to="`/task-detail/${row.task_id}`"
              />
              <span v-else class="status-text status-text--muted">ยังไม่มีลิงก์ที่ใช้งานได้</span>
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
                  <q-item
                    v-if="row.active_link"
                    clickable
                    class="action-menu-item action-menu-item--copy"
                    @click="copyLink(normalizePublicLink(row.active_link))"
                  >
                    <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
                    <q-item-section>คัดลอกลิงก์</q-item-section>
                  </q-item>
                  <q-item
                    v-if="isLinkReady(row)"
                    clickable
                    class="action-menu-item action-menu-item--share"
                    tag="a"
                    :href="getLineShareUrl(row.active_link || '')"
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
                  <q-separator v-if="row.task_id" />
                  <q-item
                    v-if="row.task_id"
                    clickable
                    class="action-menu-item action-menu-item--detail"
                    :to="`/task-detail/${row.task_id}`"
                  >
                    <q-item-section avatar><i class="fa-regular fa-rectangle-list"></i></q-item-section>
                    <q-item-section>ดูรายละเอียดเคส</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Table (hidden on mobile) -->
      <div class="table-wrap">
        <q-table
          :rows="filteredCases"
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

          <template v-slot:body-cell-student_name="props">
            <q-td :props="props">
              <router-link 
                v-if="props.row.task_id" 
                :to="`/task-detail/${props.row.task_id}`"
                class="link-name"
              >
                {{ props.value }}
              </router-link>
              <span v-else class="text-weight-bold">{{ props.value }}</span>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span :class="['badge', getBadgeClass(props.value)]">
                {{ getStatusLabel(props.value) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-link="props">
            <q-td :props="props">
              <div class="row-action-group">
                <q-btn
                  v-if="isLinkReady(props.row)"
                  flat
                  dense
                  color="primary"
                  label="เปิดลิงก์"
                  :href="normalizePublicLink(props.row.active_link || '')"
                  target="_blank"
                  class="action-btn action-btn--open"
                />
                <q-btn
                  v-else-if="props.row.task_id"
                  flat
                  dense
                  color="primary"
                  label="ดูรายละเอียด"
                  class="action-btn action-btn--detail"
                  :to="`/task-detail/${props.row.task_id}`"
                />
                <span v-else class="status-text status-text--muted">ยังไม่มีลิงก์ที่ใช้งานได้</span>

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
                      <q-item
                        v-if="props.row.active_link"
                        clickable
                        class="action-menu-item action-menu-item--copy"
                        @click="copyLink(normalizePublicLink(props.row.active_link))"
                      >
                        <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
                        <q-item-section>คัดลอกลิงก์</q-item-section>
                      </q-item>
                      <q-item
                        v-if="isLinkReady(props.row)"
                        clickable
                        class="action-menu-item action-menu-item--share"
                        tag="a"
                        :href="getLineShareUrl(props.row.active_link || '')"
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
                      <q-separator v-if="props.row.task_id" />
                      <q-item
                        v-if="props.row.task_id"
                        clickable
                        class="action-menu-item action-menu-item--detail"
                        :to="`/task-detail/${props.row.task_id}`"
                      >
                        <q-item-section avatar><i class="fa-regular fa-rectangle-list"></i></q-item-section>
                        <q-item-section>ดูรายละเอียดเคส</q-item-section>
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

    <!-- Admin Action Dialog -->
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';

const $q = useQuasar();

interface Case {
  id: string;
  task_id?: string;
  student_name: string;
  student_school: string;
  reason_flagged: string;
  status: string;
  created_at: string;
  active_link_id?: string;
  active_link?: string;
  active_link_locked?: boolean;
  active_link_lock_reason?: string;
  active_link_assigned_to?: string;
  active_link_depth?: number;
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

const schoolOptions = computed(() => {
  const schools = [...new Set(rawCases.value.map(c => c.student_school).filter(Boolean))].sort();
  return [
    { label: 'ทุกโรงเรียน', value: 'ALL' },
    ...schools.map(s => ({ label: s, value: s })),
  ];
});

const columns: QTableColumn<Case>[] = [
  { name: 'index', label: '#', field: (row: Case) => row.id, align: 'left' },
  { name: 'student_name', label: 'ชื่อนักเรียน', field: 'student_name', align: 'left', sortable: true },
  { name: 'school', label: 'โรงเรียน', field: 'student_school', align: 'left', sortable: true },
  { name: 'reason', label: 'สาเหตุ', field: 'reason_flagged', align: 'left' },
  { name: 'status', label: 'สถานะ', field: 'status', align: 'center', sortable: true },
  { name: 'link', label: 'การจัดการ', field: 'active_link', align: 'left' },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right', sortable: true },
];

const fetchData = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await api.get('/api/cases');
    rawCases.value = res.data;
    
    const statsRes = await api.get('/api/stats');
    Object.assign(stats, statsRes.data);
    loadError.value = '';
    if (!silent) {
      lastUpdated.value = new Date().toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (err) {
    console.error(err);
    loadError.value = 'ตรวจสอบการเชื่อมต่อหรือสิทธิ์การเข้าถึง แล้วกดรีเฟรชอีกครั้ง';
  } finally {
    if (!silent) loading.value = false;
  }
};

const refreshData = async () => {
  await fetchData();
};

const filteredCases = computed<Case[]>(() => {
  return rawCases.value.filter(c => {
    if (filters.status !== 'ALL' && c.status !== filters.status) return false;
    if (filters.school !== 'ALL' && c.student_school !== filters.school) return false;
    return true;
  });
});

const hasActiveFilter = computed(() => {
  return filters.status !== 'ALL' || filters.dateRange !== 'ALL' || filters.school !== 'ALL';
});

const tableEmptyLabel = computed(() => {
  if (loading.value) return 'กำลังโหลดข้อมูล...';
  if (loadError.value) return 'โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรช';
  if (hasActiveFilter.value) return 'ไม่พบเคสที่ตรงกับตัวกรอง';
  return "ยังไม่มีเคส — กด 'สร้างภารกิจใหม่' เพื่อเริ่มต้น";
});

const mobileEmptyMessage = computed(() => {
  if (loadError.value) return 'ระบบโหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรช';
  if (hasActiveFilter.value) return 'ไม่พบเคสที่ตรงกับตัวกรองปัจจุบัน';
  return "ยังไม่มีเคส — กด 'สร้างภารกิจใหม่' เพื่อเริ่มต้น";
});

const completionRate = computed(() => {
  if (!stats.total) return 0;
  return Math.round((stats.resolved / stats.total) * 100);
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

const copyLink = async (link: string) => {
  try {
    await navigator.clipboard.writeText(link);
    $q.notify({ message: 'คัดลอกลิงก์แล้ว', color: 'positive', timeout: 1500 });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกได้', color: 'negative' });
  }
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

const getLineShareUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(normalizePublicLink(link))}`;
};

const isLinkReady = (row: Case) => Boolean(row.active_link && !row.active_link_locked);

const hasRowMenu = (row: Case) => Boolean(row.active_link || row.active_link_id || row.task_id);

const openAdminActionDialog = (linkId: string, action: AdminAction) => {
  adminActionDialog.linkId = linkId;
  adminActionDialog.action = action;
  adminActionDialog.reason = action === 'lock'
    ? 'ปิดลิงก์โดยผู้ดูแลระบบ'
    : 'เปิดลิงก์อีกครั้งโดยผู้ดูแลระบบ';
  adminActionDialog.show = true;
};

const adminDialogTitle = computed(() =>
  adminActionDialog.action === 'lock' ? 'ยืนยันปิดลิงก์' : 'ยืนยันเปิดลิงก์อีกครั้ง'
);

const adminDialogHint = computed(() =>
  adminActionDialog.action === 'lock'
    ? 'ระบบจะปิดการเข้าถึงลิงก์นี้ทันที และบันทึกเหตุผลในประวัติ'
    : 'ระบบจะเปิดให้ใช้งานลิงก์นี้อีกครั้ง และบันทึกเหตุผลในประวัติ'
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
      message: adminActionDialog.action === 'lock' ? 'ปิดลิงก์เรียบร้อยแล้ว' : 'เปิดลิงก์เรียบร้อยแล้ว',
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

const resetFilters = () => {
  filters.status = 'ALL';
  filters.dateRange = 'ALL';
  filters.school = 'ALL';
};

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void fetchData();
  // Poll every 10 seconds for real-time feel silently
  refreshInterval = setInterval(() => { void fetchData(true); }, 10000);
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
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #0ea5e9 100%);
}

.hero-chip--accent {
  background: rgba(134, 239, 172, 0.2);
  border-color: rgba(134, 239, 172, 0.45);
}

:deep(.q-table__container) {
  min-width: 1000px;
}

@media (max-width: 767px) {
  .mobile-card-name:hover {
    color: #3b82f6;
  }
}
</style>
