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
      
      <CaseDashboardSummaryCards :stats="stats" />

      <!-- Manage Toolbar -->
      <div class="q-card q-mb-sm control-bar">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-gray-700">จัดการระบบเคส</div>
          <div class="result-counter">
            แสดง <strong>{{ filteredCases.length }}</strong> จาก <strong>{{ rawCases.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="q-card q-mb-md filter-panel">
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
            <div class="mobile-card-statuses">
              <span :class="['badge', getBadgeClass(row.status)]">{{ getStatusLabel(row.status) }}</span>
              <span :class="['badge', getLinkBadgeClass(row)]">ลิงก์: {{ getLinkStatusLabel(row) }}</span>
            </div>
          </div>

          <div class="mobile-card-info">
            <span v-if="row.reason_flagged">เหตุผล: {{ row.reason_flagged }}</span>
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
              <q-btn
                v-else-if="row.status === 'OPEN'"
                flat
                dense
                color="teal"
                label="สร้างลิงค์"
                icon="fa-solid fa-link"
                class="action-btn action-btn--create"
                :to="{ path: '/create', query: { case_id: row.id, student_id: row.student_id, student_name: row.student_name, student_school: row.student_school, student_address: row.student_address, reason: row.reason_flagged } }"
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

          <template v-slot:body-cell-link_status="props">
            <q-td :props="props">
              <span :class="['badge', getLinkBadgeClass(props.row)]">
                {{ getLinkStatusLabel(props.row) }}
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
                <q-btn
                  v-else-if="props.row.status === 'OPEN'"
                  flat
                  dense
                  color="teal"
                  label="สร้างลิงค์"
                  icon="fa-solid fa-link"
                  class="action-btn action-btn--create"
                  :to="{ path: '/create', query: { case_id: props.row.id, student_id: props.row.student_id, student_name: props.row.student_name, student_school: props.row.student_school, student_address: props.row.student_address, reason: props.row.reason_flagged } }"
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
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import CaseDashboardSummaryCards from '../components/dashboard/CaseDashboardSummaryCards.vue';
import TaskLinkAdminDialog from '../components/task/TaskLinkAdminDialog.vue';
import { useCaseDashboardData } from '../composables/useCaseDashboardData';
import { useTaskLinkAdminDialog } from '../composables/useTaskLinkAdminDialog';
import { copyText } from '../utils/clipboard';
import type { CaseRecord } from '../types/case';
import {
  formatCaseDate,
  getCaseCompletionRate,
  getCaseLinkStatusBadgeClass,
  getCaseLinkStatusLabel,
  getCasePublicLink,
  getCaseShareUrl,
  getCaseStatusBadgeClass,
  getCaseStatusLabel,
  isCaseInDateRange,
  isCaseLinkReady,
  type CaseDateRangeFilter,
} from '../utils/casePresentation';

const $q = useQuasar();
const pagination = ref({ page: 1, rowsPerPage: 30 });
const {
  loading,
  rawCases,
  stats,
  lastUpdated,
  loadError,
  fetchData,
  refreshData,
} = useCaseDashboardData();
const {
  adminActionDialog,
  adminDialogTitle,
  adminDialogHint,
  adminReasonLabel,
  adminConfirmLabel,
  openAdminActionDialog,
  confirmAdminAction,
} = useTaskLinkAdminDialog({
  lockSuccessMessage: 'ปิดลิงก์เรียบร้อยแล้ว',
  unlockSuccessMessage: 'เปิดลิงก์เรียบร้อยแล้ว',
  errorMessage: 'ไม่สามารถอัปเดตสถานะลิงก์ได้',
  onSuccess: async () => {
    await refreshData();
  },
});

const filters = reactive({
  status: 'ALL',
  dateRange: 'ALL' as CaseDateRangeFilter,
  school: 'ALL',
});

const statusOptions = [
  { label: 'ทุกสถานะ', value: 'ALL' },
  { label: 'รอสร้างลิงค์', value: 'OPEN' },
  { label: 'รอผอ.ประเมิน', value: 'PENDING_REVIEW' },
  { label: 'กำลังติดตาม', value: 'IN_PROGRESS' },
  { label: 'ปิดเคสแล้ว', value: 'RESOLVED' },
];

const dateOptions = [
  { label: 'ทุกช่วงเวลา', value: 'ALL' },
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7' },
  { label: '30 วันที่ผ่านมา', value: 'LAST_30' },
];

const schoolOptions = computed(() => {
  const schools = [...new Set(rawCases.value.map((c) => c.student_school).filter(Boolean))].sort();
  return [
    { label: 'ทุกโรงเรียน', value: 'ALL' },
    ...schools.map((school) => ({ label: school, value: school })),
  ];
});

const columns: QTableColumn<CaseRecord>[] = [
  { name: 'index', label: '#', field: (row: CaseRecord) => row.id, align: 'left' },
  { name: 'student_name', label: 'ชื่อนักเรียน', field: 'student_name', align: 'left', sortable: true },
  { name: 'school', label: 'โรงเรียน', field: 'student_school', align: 'left', sortable: true },
  { name: 'reason', label: 'สาเหตุ', field: 'reason_flagged', align: 'left' },
  { name: 'status', label: 'สถานะ', field: 'status', align: 'center', sortable: true },
  { name: 'link_status', label: 'สถานะลิงก์', field: 'link_state', align: 'center' },
  { name: 'link', label: 'การจัดการ', field: 'active_link', align: 'left' },
  { name: 'created_at', label: 'วันที่สร้าง', field: 'created_at', align: 'right', sortable: true },
];

const filteredCases = computed<CaseRecord[]>(() => {
  return rawCases.value.filter((caseRecord) => {
    if (filters.status !== 'ALL' && caseRecord.status !== filters.status) return false;
    if (!isCaseInDateRange(caseRecord.created_at, filters.dateRange)) return false;
    if (filters.school !== 'ALL' && caseRecord.student_school !== filters.school) return false;
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

const completionRate = computed(() => getCaseCompletionRate(stats.value));
const getBadgeClass = getCaseStatusBadgeClass;
const getStatusLabel = getCaseStatusLabel;
const getLinkBadgeClass = getCaseLinkStatusBadgeClass;
const getLinkStatusLabel = getCaseLinkStatusLabel;
const formatDate = formatCaseDate;

const copyLink = async (link: string) => {
  try {
    const method = await copyText(link);
    $q.notify({
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอกลิงก์แล้ว',
      color: method === 'manual' ? 'warning' : 'positive',
      timeout: 2000,
    });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกได้', color: 'negative' });
  }
};

const normalizePublicLink = getCasePublicLink;
const getLineShareUrl = getCaseShareUrl;
const isLinkReady = isCaseLinkReady;
const hasRowMenu = (row: CaseRecord) => Boolean(row.active_link || row.active_link_id || row.task_id);


const resetFilters = () => {
  filters.status = 'ALL';
  filters.dateRange = 'ALL';
  filters.school = 'ALL';
};

watch(filters, () => { pagination.value.page = 1; });

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
  min-width: 880px;
}

@media (max-width: 767px) {
  .mobile-card-name:hover {
    color: #3b82f6;
  }
}
</style>
