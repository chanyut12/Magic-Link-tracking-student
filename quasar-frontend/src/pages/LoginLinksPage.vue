<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="dashboard-shell">
      <!-- Hero Panel -->
      <section class="hero-panel q-mb-sm hero-panel--indigo">
        <div class="hero-main">
          <p class="hero-kicker">LOGIN LINKS COMMAND CENTER</p>
          <h1 class="hero-title">แดชบอร์ดจัดการลิงก์เข้าสู่ระบบ</h1>
          <p class="hero-subtitle">
            ควบคุมลิงก์สวมสิทธิ์ ตรวจสอบสถานะการเข้าใช้งาน และจัดการได้ทันทีในหน้าเดียว
          </p>
          <div class="hero-meta">
            <span class="hero-chip">
              <i class="fa-regular fa-clock q-mr-xs"></i>
              อัปเดตล่าสุด: {{ lastUpdated }}
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
            @click="fetchLoginLinks"
          />
          <q-btn
            color="white"
            text-color="primary"
            icon="fa-solid fa-plus"
            label="สร้างลิงก์เข้าสู่ระบบใหม่"
            @click="openAddDialog"
            unelevated
          />
        </div>
      </section>

      <LinkLifecycleSummaryCards
        :stats="cardStats"
        expired-subtitle="ต้องสร้างใหม่"
      />

      <!-- Control Bar -->
      <div class="q-card q-mb-sm control-bar bg-white">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-grey-8">จัดการลิงก์เข้าสู่ระบบ</div>
          <div class="result-counter text-grey-6">
            แสดง <strong>{{ filteredLoginLinks.length }}</strong> จาก <strong>{{ loginLinks.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="q-card q-mb-md filter-panel bg-white">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-5">
            <div class="text-caption text-grey-6 q-mb-xs font-weight-bold">ค้นหารายชื่อ / อีเมล</div>
            <q-input
              v-model="filters.search"
              outlined
              dense
              placeholder="ค้นหาชื่อผู้ครอบครอง หรือ อีเมล..."
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-6 q-mb-xs font-weight-bold">สถานะลิงก์</div>
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

      <!-- Desktop QTable -->
      <div class="table-wrap q-mb-md">
        <q-table
          :rows="filteredLoginLinks"
          :columns="columns"
          row-key="id"
          flat
          dense
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[15, 20, 30, 50, 100]"
        >
          <template v-slot:body-cell-index="props">
            <q-td :props="props" class="text-grey-5">{{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}</q-td>
          </template>

          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div>
                <strong class="text-grey-9">{{ props.row.assigned_to_name || 'ไม่ระบุ' }}</strong>
                <div class="text-caption text-grey-6">{{ props.row.login_role_label || roleLabelMap[props.row.login_role || 'TEACHER'] || (props.row.login_role || 'TEACHER') }}</div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <span v-if="isValidLink(props.row)" class="badge badge-active">ใช้งานอยู่</span>
              <span v-else-if="props.row.admin_locked" class="badge badge-expired">ถูกล็อก</span>
              <span v-else class="badge-neutral q-pa-xs rounded-borders text-caption text-grey-7">หมดอายุ</span>
            </q-td>
          </template>

          <template v-slot:body-cell-expires="props">
            <q-td :props="props">
              <div class="text-caption text-grey-7">{{ formatDate(props.row.expires_at) }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              <div class="text-caption text-grey-7">{{ formatDate(props.row.created_at) }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row-action-group">
                <q-btn 
                  v-if="isValidLink(props.row)"
                  flat 
                  dense 
                  color="primary" 
                  label="เปิดลิงก์" 
                  class="action-btn action-btn--open" 
                  :href="getLinkUrl(props.row)" 
                  target="_blank" 
                />
                <span v-else class="status-text status-text--muted">ไม่มีลิงก์ที่ใช้งานได้</span>

                <q-btn flat round dense color="grey-7" icon="fa-solid fa-ellipsis-vertical" class="action-menu-btn">
                  <q-menu auto-close>
                    <q-list dense style="min-width: 160px">
                      <q-item clickable class="action-menu-item action-menu-item--copy" @click="copyLink(props.row)">
                        <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
                        <q-item-section>คัดลอกลิงก์</q-item-section>
                      </q-item>
                      <q-item
                        v-if="isValidLink(props.row)"
                        clickable
                        class="action-menu-item action-menu-item--share"
                        tag="a"
                        :href="getLineUrl(getLinkUrl(props.row))"
                        target="_blank"
                      >
                        <q-item-section avatar><i class="fa-brands fa-line" style="color: #06C755;"></i></q-item-section>
                        <q-item-section>แชร์ผ่าน LINE</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item
                        v-if="props.row.admin_locked"
                        clickable
                        class="action-menu-item action-menu-item--unlock"
                        @click="openAdminActionDialog(props.row.id, 'unlock')"
                      >
                        <q-item-section avatar><i class="fa-solid fa-lock-open"></i></q-item-section>
                        <q-item-section>เปิดลิงก์อีกครั้ง</q-item-section>
                      </q-item>
                      <q-item
                        v-if="!props.row.admin_locked"
                        clickable
                        class="action-menu-item action-menu-item--lock"
                        @click="openAdminActionDialog(props.row.id, 'lock')"
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
        </q-table>
      </div>

      <!-- Add Link Dialog -->
      <q-dialog v-model="addDialog" persistent>
        <q-card style="width: 760px; max-width: 94vw; border-radius: 16px;">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold text-grey-9">{{ showResult ? 'สรุปการสร้างลิงก์' : 'สร้างลิงก์เข้าสู่ระบบ' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-form v-if="!showResult" @submit="submitAddLink">
            <q-card-section class="q-gutter-lg q-pt-lg" style="max-height: 72vh; overflow: auto;">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">ชื่อผู้ครอบครองลิงก์ *</div>
                  <q-input v-model="form.assigned_to_name" outlined dense placeholder="เช่น นนท์" :rules="[val => !!val || 'กรุณากรอกชื่อ']" />
                </div>
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">อีเมลสำหรับ OTP / Login *</div>
                  <q-input v-model="form.assigned_to_email" outlined dense type="email" placeholder="เช่น user@gmail.com" :rules="[val => !!val || 'กรุณากรอกอีเมล', val => /.+@.+\..+/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง']" />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">บทบาท *</div>
                  <q-select
                    v-model="form.role"
                    :options="roleOptions"
                    emit-value
                    map-options
                    outlined
                    dense
                    option-label="label"
                    option-value="value"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">อายุลิงก์</div>
                  <div class="row q-col-gutter-sm">
                    <div class="col-8">
                      <q-input v-model.number="form.expires_value" type="number" outlined dense min="1" />
                    </div>
                    <div class="col-4">
                      <q-select
                        v-model="form.expires_unit"
                        :options="expiresUnitOptions"
                        emit-value
                        map-options
                        outlined
                        dense
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div class="row items-start justify-between q-col-gutter-md q-mb-sm">
                  <div class="col-12 col-md">
                    <div class="text-caption text-grey-7">สิทธิ์การใช้งาน</div>
                    <div class="text-caption text-blue-grey-6">
                      ค่าเริ่มต้นของ {{ selectedRoleMeta?.label || form.role }} จะขึ้นเป็นสีน้ำเงิน ส่วนสิทธิ์ที่เพิ่มหรือปิดจาก default จะมีสีแยกให้เห็นทันที
                    </div>
                  </div>
                </div>
                <div class="permission-legend q-mb-sm">
                  <div
                    v-for="item in permissionLegendItems"
                    :key="item.state"
                    class="permission-legend-item"
                    :class="`permission-legend-item--${item.state}`"
                  >
                    <span class="permission-legend-swatch"></span>
                    <div>
                      <div class="text-caption text-weight-bold">{{ item.shortLabel }}</div>
                      <div class="text-caption text-blue-grey-7">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
                <div class="permission-grid">
                  <label
                    v-for="opt in permissionOptions"
                    :key="opt.value"
                    class="permission-item"
                    :class="[
                      `permission-item--${getPermissionVisualState(opt.value)}`,
                      { 'permission-item--disabled': isPermissionLocked(opt.value) },
                    ]"
                  >
                    <q-checkbox
                      :model-value="form.permissions.includes(opt.value)"
                      :disable="isPermissionLocked(opt.value)"
                      dense
                      @update:model-value="togglePermission(opt.value, $event)"
                    />
                    <span class="permission-item__label">{{ opt.label }}</span>
                    <span
                      v-if="getPermissionVisualState(opt.value) !== 'neutral'"
                      class="permission-state-badge"
                      :class="`permission-state-badge--${getPermissionVisualState(opt.value)}`"
                    >
                      {{ getPermissionVisualMeta(opt.value).shortLabel }}
                    </span>
                  </label>
                </div>
                <div class="q-mt-xs row q-gutter-xs">
                  <q-chip
                    v-for="permissionId in form.permissions"
                    :key="permissionId"
                    dense
                    removable
                    color="blue-1"
                    text-color="primary"
                    class="selected-permission-chip"
                    :class="`selected-permission-chip--${getPermissionVisualState(permissionId)}`"
                    @remove="removePermission(permissionId)"
                  >
                    {{ permissionLabelMap[permissionId] || permissionId }}
                  </q-chip>
                </div>
              </div>

              <div>
                <div class="row items-center justify-between q-mb-sm">
                  <div>
                    <div class="text-caption text-grey-7">Data Scope</div>
                    <div class="text-caption text-blue-grey-6">{{ roleScopePreset.hint }}</div>
                  </div>
                  <q-toggle
                    v-model="scopeForm.allProvinces"
                    :disable="isNationwideToggleDisabled"
                    label="ดูข้อมูลทุกจังหวัด"
                    @update:model-value="onAllProvincesToggle"
                  />
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.province"
                      :options="availableProvinceOptions"
                      label="จังหวัด"
                      outlined
                      dense
                      clearable
                      :disable="scopeForm.allProvinces || isScopeFieldLocked('province')"
                      @update:model-value="onScopeProvinceChange"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.district"
                      :options="availableDistrictOptions"
                      label="อำเภอ"
                      outlined
                      dense
                      clearable
                      :disable="scopeForm.allProvinces || !scopeForm.province || isScopeFieldLocked('district')"
                      @update:model-value="onScopeDistrictChange"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.sub_district"
                      :options="availableSubDistrictOptions"
                      label="ตำบล"
                      outlined
                      dense
                      clearable
                      :disable="scopeForm.allProvinces || !scopeForm.district || isScopeFieldLocked('sub_district')"
                      @update:model-value="onScopeSubDistrictChange"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.school_id"
                      :options="filteredSchools"
                      label="โรงเรียน"
                      outlined
                      dense
                      clearable
                      emit-value
                      map-options
                      option-label="label"
                      option-value="value"
                      :disable="scopeForm.allProvinces || isScopeFieldLocked('school_id')"
                      @update:model-value="onScopeSchoolChange"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.grade_level"
                      :options="availableGradeOptions"
                      label="ระดับชั้น"
                      outlined
                      dense
                      clearable
                      emit-value
                      map-options
                      option-label="label"
                      option-value="value"
                      :disable="isScopeFieldLocked('grade_level')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="scopeForm.room"
                      :options="availableRoomOptions"
                      label="ห้อง"
                      outlined
                      dense
                      clearable
                      :disable="isScopeFieldLocked('room') || !scopeForm.grade_level || !scopeForm.school_id"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right" class="q-px-md q-pb-md">
              <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
              <q-btn
                unelevated
                label="สร้างลิงก์"
                color="primary"
                type="submit"
                :loading="submitLoading"
                no-caps
              />
            </q-card-actions>
          </q-form>

          <!-- Result View (Cloned from CreateTaskPage) -->
          <q-card-section v-else class="q-pa-lg">
            <div class="alert alert-success q-mb-md text-center">สร้างลิงก์สำเร็จ!</div>

            <div class="q-mb-md">
              <div class="text-subtitle2 text-weight-bold text-grey-7 q-mb-xs">Magic Link สำหรับเข้าสู่ระบบ</div>
              <div class="magic-link-box q-pa-md bg-grey-1 rounded-borders text-grey-9 text-left break-all">
                {{ resultLink }}
              </div>
            </div>

            <div class="q-gutter-y-sm q-mb-md">
              <q-btn 
                outline 
                color="primary" 
                label="📋 คัดลอกลิงก์" 
                class="full-width q-py-sm" 
                @click="copyDirectLink" 
                no-caps
              />
              <q-btn 
                unelevated 
                style="background: #06C755; color: white;" 
                label="💬 ส่งลิงก์ผ่าน LINE" 
                class="full-width q-py-sm" 
                :href="getLineUrl(resultLink)"
                target="_blank"
                no-caps
              />
            </div>

            <div class="q-pa-md bg-grey-1 rounded-borders text-center" style="border: 1px solid #e2e8f0;">
              <div class="text-subtitle2 text-weight-bold text-grey-7 q-mb-sm">QR Code</div>
              <img :src="qrCodeUrl" alt="QR Code" style="max-width: 160px; margin: 0 auto; display: block;" />
              <p class="text-caption text-grey-5 q-mt-sm q-mb-none">สแกนเพื่อเข้าใช้งานระบบ</p>
            </div>

            <q-btn 
              flat 
              color="grey-7" 
              label="เสร็จสิ้น" 
              class="full-width q-mt-md" 
              v-close-popup 
              no-caps
            />
          </q-card-section>
        </q-card>
      </q-dialog>

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

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import LinkLifecycleSummaryCards from '../components/dashboard/LinkLifecycleSummaryCards.vue';
import { useLoginLinkDialogs } from '../composables/useLoginLinkDialogs';
import { useLoginTaskForm } from '../composables/useLoginTaskForm';
import { useTaskFormFlow } from '../composables/useTaskFormFlow';
import { useUserStore } from '../composables/useUserStore';
import { taskService } from '../services/taskService';
import { copyText } from '../utils/clipboard';
import {
  getEffectivePermissions,
} from '../constants/permissions';
import type { LoginLink } from '../types/task';
import {
  buildLoginLinkTaskPayload,
  createLoginTaskFormModel,
  createTaskScopeFormModel,
} from '../utils/taskForm';
import {
  buildTaskLineShareUrl,
  formatTaskDate,
  formatTaskRefreshTimestamp,
  getTaskLinkStatus,
  isTaskLinkActive,
  toMagicLoginLink,
} from '../utils/taskPresentation';

const $q = useQuasar();
const router = useRouter();
const { user } = useUserStore();

const loginLinks = ref<LoginLink[]>([]);
const loading = ref(false);
const lastUpdated = ref('--:--');
const pagination = ref({ page: 1, rowsPerPage: 30 });
const {
  submitting: submitLoading,
  showResult,
  resultLink,
  qrCodeUrl,
  resetResultState,
  submitTask,
} = useTaskFormFlow();
const {
  addDialog,
  adminActionDialog,
  adminDialogTitle,
  adminDialogHint,
  adminReasonLabel,
  adminConfirmLabel,
  openAddDialog: showAddDialog,
  openAdminActionDialog,
} = useLoginLinkDialogs();

const filters = reactive({
  status: 'ALL',
  search: '',
});

const statusOptions = [
  { label: 'ทุกสถานะ', value: 'ALL' },
  { label: 'ใช้งานอยู่', value: 'ACTIVE' },
  { label: 'ถูกล็อก', value: 'LOCKED' },
  { label: 'หมดอายุ', value: 'EXPIRED' },
];

const columns = [
  { name: 'index', label: 'ลำดับ', align: 'center' as const, field: 'id' },
  { name: 'name', label: 'ผู้ครอบครอง (Name)', align: 'left' as const, field: 'assigned_to_name' },
  { name: 'email', label: 'อีเมลสวมสิทธิ์', align: 'left' as const, field: 'assigned_to_email' },
  { name: 'status', label: 'สถานะ', align: 'center' as const, field: 'status' },
  { name: 'actions', label: 'จัดการ', align: 'center' as const, field: 'id' },
  { name: 'expires', label: 'วันหมดอายุ', align: 'right' as const, field: 'expires_at' },
  { name: 'created_at', label: 'วันที่สร้าง', align: 'right' as const, field: 'created_at' },
];

const cardStats = computed(() => {
  const stats = { total: loginLinks.value.length, active: 0, locked: 0, expired: 0 };

  loginLinks.value.forEach((link) => {
    const status = getTaskLinkStatus(link);
    if (status === 'LOCKED') stats.locked += 1;
    else if (status === 'EXPIRED') stats.expired += 1;
    else stats.active += 1;
  });

  return stats;
});

const activeRate = computed(() => {
  if (!cardStats.value.total) return 0;
  return Math.round((cardStats.value.active / cardStats.value.total) * 100);
});

const filteredLoginLinks = computed(() => (
  loginLinks.value.filter((link) => {
    const status = getTaskLinkStatus(link);

    if (filters.status !== 'ALL' && status !== filters.status) {
      return false;
    }

    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const nameMatch = (link.assigned_to_name || '').toLowerCase().includes(needle);
      const emailMatch = (link.assigned_to_email || '').toLowerCase().includes(needle);
      if (!nameMatch && !emailMatch) {
        return false;
      }
    }

    return true;
  })
));

const resetFilters = () => {
  filters.status = 'ALL';
  filters.search = '';
};

watch(filters, () => { pagination.value.page = 1; });

const isValidLink = (link: LoginLink) => isTaskLinkActive(link);
const getLinkUrl = (link: LoginLink) => toMagicLoginLink(link.magic_link);
const getLineUrl = (link: string) => buildTaskLineShareUrl(link);

const form = reactive(createLoginTaskFormModel());
const scopeForm = reactive(createTaskScopeFormModel());

const currentUserPermissions = computed(() => (
  getEffectivePermissions(user.value?.roles || [], user.value?.permissions || [])
));

const canCreateLoginLinks = computed(() => (
  currentUserPermissions.value.includes('*') ||
  currentUserPermissions.value.includes('ALL') ||
  (
    currentUserPermissions.value.includes('login-links') &&
    currentUserPermissions.value.includes('create')
  )
));

const expiresUnitOptions = [
  { label: 'ชั่วโมง', value: 'hours' },
  { label: 'วัน', value: 'days' },
  { label: 'นาที', value: 'minutes' },
];

const {
  permissionOptions,
  permissionLegendItems,
  permissionLabelMap,
  roleLabelMap,
  selectedRoleMeta,
  roleScopePreset,
  roleOptions,
  scopeFieldLabels,
  availableProvinceOptions,
  availableDistrictOptions,
  availableSubDistrictOptions,
  filteredSchools,
  availableGradeOptions,
  availableRoomOptions,
  isNationwideToggleDisabled,
  ensureOptionsLoaded,
  initializeForm,
  handleAllProvincesToggle: onAllProvincesToggle,
  handleProvinceChange: onScopeProvinceChange,
  handleDistrictChange: onScopeDistrictChange,
  handleSubDistrictChange: onScopeSubDistrictChange,
  handleSchoolChange: onScopeSchoolChange,
  isPermissionLocked,
  isScopeFieldLocked,
  getPermissionVisualState,
  getPermissionVisualMeta,
  togglePermission,
  removePermission,
} = useLoginTaskForm({
  form,
  scopeForm,
});

const openAddDialog = async () => {
  if (!canCreateLoginLinks.value) {
    void router.push('/forbidden');
    return;
  }

  await initializeForm();
  form.assigned_to_name = '';
  form.assigned_to_email = '';
  form.expires_value = 1;
  form.expires_unit = 'days';
  resetResultState();
  showAddDialog();
};

const submitAddLink = async () => {
  if (!canCreateLoginLinks.value) {
    addDialog.value = false;
    void router.push('/forbidden');
    return;
  }

  if (!form.assigned_to_name.trim() || !form.assigned_to_email.trim()) {
    $q.notify({ message: 'กรุณากรอกชื่อและอีเมลให้ครบถ้วน', color: 'negative' });
    return;
  }

  if (form.permissions.length === 0) {
    $q.notify({ message: 'กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ', color: 'negative' });
    return;
  }

  const missingScopeFields = roleScopePreset.value.requiredFields
    .filter((field) => !scopeForm[field])
    .map((field) => scopeFieldLabels[field]);

  if (missingScopeFields.length > 0) {
    $q.notify({
      message: `กรุณาเลือก ${missingScopeFields.join(', ')} ให้ครบ`,
      color: 'negative',
    });
    return;
  }

  try {
    await submitTask(buildLoginLinkTaskPayload(form, scopeForm), {
      loginLink: true,
    });
    void fetchLoginLinks();
  } catch (err) {
    console.error('Create link error:', err);
    const message =
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof err.response === 'object' &&
      err.response !== null &&
      'data' in err.response &&
      typeof err.response.data === 'object' &&
      err.response.data !== null &&
      'message' in err.response.data
        ? String(err.response.data.message)
        : 'ไม่สามารถสร้างลิงก์ได้';
    $q.notify({ color: 'negative', message });
  }
};

const copyDirectLink = async () => {
  try {
    const method = await copyText(resultLink.value);
    $q.notify({
      color: method === 'manual' ? 'warning' : 'positive',
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอกลิงก์เรียบร้อย',
      icon: method === 'manual' ? 'warning' : 'check',
      position: 'top'
    });
  } catch {
    $q.notify({ color: 'negative', message: 'ไม่สามารถคัดลอกลิงก์ได้', position: 'top' });
  }
};

const fetchLoginLinks = async () => {
  loading.value = true; loginLinks.value = [];
  try {
    loginLinks.value = await taskService.getLoginLinks();
    lastUpdated.value = formatTaskRefreshTimestamp();
  } catch (err) {
    console.error('Error fetching login links:', err);
  } finally { loading.value = false; }
};

const confirmAdminAction = async () => {
  if (!adminActionDialog.reason.trim()) {
    $q.notify({ message: 'กรุณาระบุเหตุผล', color: 'warning' });
    return;
  }

  adminActionDialog.loading = true;
  try {
    await taskService.updateTaskLinkAdminStatus(adminActionDialog.linkId, {
      action: adminActionDialog.action,
      reason: adminActionDialog.reason.trim(),
    });
    $q.notify({
      message: adminActionDialog.action === 'lock' ? 'ปิดลิงก์สำเร็จ' : 'เปิดลิงก์สำเร็จ',
      color: 'positive'
    });
    adminActionDialog.show = false;
    await fetchLoginLinks();
  } catch {
    $q.notify({ message: 'ไม่สามารถอัปเดตสถานะลิงก์ได้', color: 'negative' });
  } finally {
    adminActionDialog.loading = false;
  }
};

const copyLink = async (link: LoginLink) => {
  const url = link.magic_link.replace('/task/', '/login/magic/');
  try {
    const method = await copyText(url);
    $q.notify({
      color: method === 'manual' ? 'warning' : 'positive',
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอกลิงก์เรียบร้อย',
      icon: method === 'manual' ? 'warning' : 'check',
      position: 'top'
    });
  } catch {
    $q.notify({ color: 'negative', message: 'ไม่สามารถคัดลอกลิงก์ได้', position: 'top' });
  }
};

const formatDate = formatTaskDate;

onMounted(() => {
  void fetchLoginLinks();
  void ensureOptionsLoaded();
});
</script>

<style scoped lang="scss">
.dashboard-page {
  background:
    radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.08), transparent 35%),
    radial-gradient(circle at 90% 0%, rgba(139, 92, 246, 0.08), transparent 30%),
    #f8fafc;
}

.hero-panel--indigo {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%) !important;
}

.hero-chip--accent {
  background: rgba(199, 210, 254, 0.2);
  border-color: rgba(199, 210, 254, 0.45);
}

.badge-neutral {
  background: #f1f5f9;
  color: #64748b;
  font-weight: 600;
}

.alert {
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 700;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
}

.magic-link-box {
  background: #f1f5f9;
  padding: 16px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  word-break: break-all;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.permission-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.permission-legend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.permission-legend-swatch {
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border-radius: 999px;
  flex-shrink: 0;
  background: #94a3b8;
}

.permission-legend-item--default {
  border-color: #93c5fd;
  background: #eff6ff;

  .permission-legend-swatch {
    background: #2563eb;
  }
}

.permission-legend-item--added {
  border-color: #86efac;
  background: #f0fdf4;

  .permission-legend-swatch {
    background: #16a34a;
  }
}

.permission-legend-item--removed {
  border-color: #fdba74;
  background: #fff7ed;

  .permission-legend-swatch {
    background: #ea580c;
  }
}

.permission-legend-item--locked {
  border-color: #cbd5e1;
  background: #f8fafc;

  .permission-legend-swatch {
    background: #64748b;
  }
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  transition: all 0.18s ease;
}

.permission-item__label {
  flex: 1;
  min-width: 0;
}

.permission-item--default {
  background: #eff6ff;
  border-color: #93c5fd;
}

.permission-item--added {
  background: #f0fdf4;
  border-color: #86efac;
}

.permission-item--removed {
  background: #fff7ed;
  border-color: #fdba74;
  border-style: dashed;
}

.permission-item--locked {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.permission-item--disabled {
  opacity: 0.55;
}

.permission-state-badge {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
  border: 1px solid transparent;
}

.permission-state-badge--default,
.selected-permission-chip--default {
  background: #dbeafe !important;
  border-color: #93c5fd !important;
  color: #1d4ed8 !important;
}

.permission-state-badge--added,
.selected-permission-chip--added {
  background: #dcfce7 !important;
  border-color: #86efac !important;
  color: #15803d !important;
}

.permission-state-badge--removed,
.selected-permission-chip--removed {
  background: #ffedd5 !important;
  border-color: #fdba74 !important;
  color: #c2410c !important;
}

.permission-state-badge--locked,
.selected-permission-chip--locked {
  background: #e2e8f0 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.selected-permission-chip {
  border: 1px solid transparent;
  font-weight: 600;
}

@media (max-width: 768px) {
  .permission-legend,
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
