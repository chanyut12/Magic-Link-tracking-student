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

      <!-- Stat Cards -->
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
            <div class="stat-sub">ต้องสร้างใหม่</div>
          </div>
        </div>
      </div>

      <!-- Control Bar -->
      <div class="q-card q-pa-lg q-mb-md shadow-xs control-bar bg-white">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="text-h6 text-weight-bold text-grey-8">จัดการลิงก์เข้าสู่ระบบ</div>
          <div class="result-counter text-grey-6">
            แสดง <strong>{{ filteredLoginLinks.length }}</strong> จาก <strong>{{ loginLinks.length }}</strong> รายการ
          </div>
        </div>
      </div>

      <!-- Filters Panel (Added) -->
      <div class="q-card q-pa-lg q-mb-md shadow-xs filter-panel bg-white">
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
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20, 50]"
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
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useUserStore } from '../composables/useUserStore';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  PERMISSION_DELTA_LEGEND,
  PERMISSION_DELTA_META,
  getEffectivePermissions,
  getRoleScopePreset,
  getPermissionDeltaState,
  getLeafMenuItems,
  type DataScope,
  type RoleDefinition,
  type ScopeFormField,
} from '../constants/permissions';

const $q = useQuasar();
const router = useRouter();
const { user } = useUserStore();

interface LoginLink {
  id: string;
  task_id: string;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  expires_at: string;
  status: string;
  magic_link: string;
  created_at: string;
  admin_locked?: boolean | number;
  login_role?: string | null;
  login_role_label?: string | null;
  login_permissions?: string[];
  login_data_scope?: DataScope;
}

interface LocationDistrict {
  province: string;
  district: string;
}

interface LocationSubDistrict {
  province: string;
  district: string;
  sub_district: string;
}

const loginLinks = ref<LoginLink[]>([]);
const rolesCatalog = ref<RoleDefinition[]>([]);
const loading = ref(false);
const lastUpdated = ref('--:--');
const pagination = ref({ page: 1, rowsPerPage: 20 });

const addDialog = ref(false);
const showResult = ref(false);
const submitLoading = ref(false);
const resultLink = ref('');

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
  loading: false,
});

const filters = reactive({
  status: 'ALL',
  search: '',
});

const qrCodeUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resultLink.value)}`;
});

const getLineUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
};

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
  const now = new Date();
  loginLinks.value.forEach(link => {
    const isLocked = Boolean(link.admin_locked);
    const isExpired = new Date(link.expires_at) < now;
    if (isLocked) stats.locked++;
    else if (isExpired) stats.expired++;
    else stats.active++;
  });
  return stats;
});

const activeRate = computed(() => {
  if (!cardStats.value.total) return 0;
  return Math.round((cardStats.value.active / cardStats.value.total) * 100);
});

const filteredLoginLinks = computed(() => {
  const now = new Date();
  return loginLinks.value.filter(link => {
    const isLocked = Boolean(link.admin_locked);
    const isExpired = new Date(link.expires_at) < now;
    let s = 'ACTIVE';
    if (isLocked) s = 'LOCKED';
    else if (isExpired) s = 'EXPIRED';

    if (filters.status !== 'ALL' && s !== filters.status) return false;

    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const nameMatch = (link.assigned_to_name || '').toLowerCase().includes(needle);
      const emailMatch = (link.assigned_to_email || '').toLowerCase().includes(needle);
      if (!nameMatch && !emailMatch) return false;
    }

    return true;
  });
});

const resetFilters = () => {
  filters.status = 'ALL';
  filters.search = '';
};

watch(filters, () => { pagination.value.page = 1; });

const isValidLink = (link: LoginLink) => {
  return !link.admin_locked && new Date(link.expires_at) > new Date();
};

const getLinkUrl = (link: LoginLink) => {
  return link.magic_link.replace('/task/', '/login/magic/');
};

const permissionOptions = getLeafMenuItems().map((item) => ({
  label: item.label,
  value: item.id,
}));

const permissionLabelMap = computed<Record<string, string>>(() => (
  Object.fromEntries(permissionOptions.map((item) => [item.value, item.label]))
));

const roleLabelMap = computed<Record<string, string>>(() => (
  Object.fromEntries(rolesCatalog.value.map((role) => [role.name, role.label]))
));
const permissionLegendItems = PERMISSION_DELTA_LEGEND;

const form = reactive({
  assigned_to_name: '',
  assigned_to_email: '',
  permissions: [] as string[],
  role: 'TEACHER',
  expires_value: 1,
  expires_unit: 'days',
});
const suppressRolePermissionSync = ref(false);

const currentUserPermissions = computed(() => (
  getEffectivePermissions(user.value?.roles || [], user.value?.permissions || [])
));

const canCreateLoginLinks = computed(() => {
  return (
    currentUserPermissions.value.includes('*') ||
    currentUserPermissions.value.includes('ALL') ||
    (
      currentUserPermissions.value.includes('login-links') &&
      currentUserPermissions.value.includes('create')
    )
  );
});

const normalizeScopeValueList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
};

const currentUserRole = computed(() => user.value?.roles?.[0] || null);
const currentUserRoleMeta = computed(() => (
  rolesCatalog.value.find((role) => role.name === (user.value?.roles?.[0] || null)) || null
));
const currentUserGrantablePermissionSet = computed(() => new Set([
  ...(user.value?.permissions || []),
  ...(currentUserRoleMeta.value?.default_permissions || []),
]));
const currentUserScope = computed(() => ({
  provinces: normalizeScopeValueList(user.value?.data_scope?.provinces),
  districts: normalizeScopeValueList(user.value?.data_scope?.districts),
  sub_districts: normalizeScopeValueList(user.value?.data_scope?.sub_districts),
  school_ids: normalizeScopeValueList(user.value?.data_scope?.school_ids),
  grade_levels: normalizeScopeValueList(user.value?.data_scope?.grade_levels),
  room_ids: normalizeScopeValueList(user.value?.data_scope?.room_ids),
}));
const selectedRoleMeta = computed(() => (
  rolesCatalog.value.find((role) => role.name === form.role) || null
));
const roleDefaultPermissions = computed(() => selectedRoleMeta.value?.default_permissions || []);

const canUseNationwideScope = computed(() => (
  currentUserScope.value.provinces.length === 0 &&
  currentUserScope.value.districts.length === 0 &&
  currentUserScope.value.sub_districts.length === 0 &&
  currentUserScope.value.school_ids.length === 0
));
const roleScopePreset = computed(() => (
  getRoleScopePreset(form.role, selectedRoleMeta.value?.scope_mode)
));
const isNationwideToggleDisabled = computed(() => (
  roleScopePreset.value.mode !== 'flexible' || !canUseNationwideScope.value
));

const roleOptions = computed(() => {
  const actorRole = currentUserRole.value;
  const actorRank = rolesCatalog.value.find((role) => role.name === actorRole)?.rank || 0;

  return rolesCatalog.value
    .filter((role) => {
      const targetRank = role.rank || 0;
      if (targetRank > actorRank) {
        return false;
      }

      if (targetRank === actorRank && actorRole !== 'ADMIN') {
        return false;
      }

      return true;
    })
    .sort((a, b) => (b.rank || 0) - (a.rank || 0))
    .map((role) => ({ value: role.name, label: role.label }));
});

const expiresUnitOptions = [
  { label: 'ชั่วโมง', value: 'hours' },
  { label: 'วัน', value: 'days' },
  { label: 'นาที', value: 'minutes' },
];

const scopeForm = reactive({
  allProvinces: true,
  province: null as string | null,
  district: null as string | null,
  sub_district: null as string | null,
  school_id: null as number | null,
  grade_level: null as number | null,
  room: null as string | null,
});

const provinceOptions = ref<string[]>([]);
const locationData = reactive({
  districts: [] as LocationDistrict[],
  subDistricts: [] as LocationSubDistrict[],
});
const schoolOptions = ref<{ label: string; value: number; province?: string; district?: string; sub_district?: string }[]>([]);
const gradeOptions = ref<{ label: string; value: number }[]>([]);
const roomOptions = ref<string[]>([]);

const availableProvinceOptions = computed(() => (
  currentUserScope.value.provinces.length > 0
    ? provinceOptions.value.filter((province) => currentUserScope.value.provinces.includes(province))
    : provinceOptions.value
));

const districtOptions = computed(() => {
  if (!scopeForm.province) return [];
  let options = Array.from(new Set(
    locationData.districts
      .filter((item) => item.province === scopeForm.province)
      .map((item) => item.district),
  ));

  if (currentUserScope.value.districts.length > 0) {
    options = options.filter((district) => currentUserScope.value.districts.includes(district));
  }

  return options;
});

const availableDistrictOptions = computed(() => districtOptions.value);

const subDistrictOptions = computed(() => {
  if (!scopeForm.district || !scopeForm.province) return [];
  let options = Array.from(new Set(
    locationData.subDistricts
      .filter((item) => item.province === scopeForm.province && item.district === scopeForm.district)
      .map((item) => item.sub_district),
  ));

  if (currentUserScope.value.sub_districts.length > 0) {
    options = options.filter((subDistrict) => currentUserScope.value.sub_districts.includes(subDistrict));
  }

  return options;
});

const availableSubDistrictOptions = computed(() => subDistrictOptions.value);

const filteredSchools = computed(() => {
  let list = schoolOptions.value;
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
  if (scopeForm.allProvinces) {
    return list;
  }
  if (scopeForm.province) list = list.filter((school) => school.province === scopeForm.province);
  if (scopeForm.district) list = list.filter((school) => school.district === scopeForm.district);
  if (scopeForm.sub_district) list = list.filter((school) => school.sub_district === scopeForm.sub_district);
  return list;
});

const availableGradeOptions = computed(() => (
  currentUserScope.value.grade_levels.length > 0
    ? gradeOptions.value.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.value)))
    : gradeOptions.value
));

const availableRoomOptions = computed(() => (
  currentUserScope.value.room_ids.length > 0
    ? roomOptions.value.filter((room) => currentUserScope.value.room_ids.includes(String(room)))
    : roomOptions.value
));

const normalizePublicLink = (rawLink: string) => {
  if (!rawLink) return rawLink;
  try {
    const url = new URL(rawLink, window.location.origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
    }
    return url.toString();
  } catch { return rawLink; }
};

const fetchLocations = async () => {
  try {
    const res = await api.get('/api/attendance/locations');
    provinceOptions.value = res.data?.data?.provinces || [];
    locationData.districts = res.data?.data?.districts || [];
    locationData.subDistricts = res.data?.data?.subDistricts || [];
  } catch (err) {
    console.error('Fetch locations error:', err);
  }
};

const fetchSchools = async () => {
  try {
    const res = await api.get('/api/attendance/schools');
    schoolOptions.value = (res.data?.data || []).map((school: {
      id: number;
      name: string;
      province?: string;
      district?: string;
      sub_district?: string;
      subDistrict?: string;
    }) => ({
      label: school.name,
      value: school.id,
      province: school.province,
      district: school.district,
      sub_district: school.sub_district || school.subDistrict,
    }));
  } catch (err) {
    console.error('Fetch schools error:', err);
  }
};

const fetchGrades = async () => {
  try {
    const res = await api.get('/api/attendance/grade-levels');
    gradeOptions.value = (res.data?.data || []).map((grade: { id: number; label: string }) => ({
      label: grade.label,
      value: grade.id,
    }));
  } catch (err) {
    console.error('Fetch grades error:', err);
  }
};

const fetchRolesCatalog = async () => {
  try {
    const res = await api.get<RoleDefinition[]>('/api/users/roles');
    rolesCatalog.value = res.data;
  } catch (err) {
    console.error('Fetch roles error:', err);
  }
};

const fetchRooms = async () => {
  if (!scopeForm.grade_level || !scopeForm.school_id) {
    roomOptions.value = [];
    scopeForm.room = null;
    return;
  }

  try {
    const selectedGrade = gradeOptions.value.find((grade) => grade.value === scopeForm.grade_level);
    if (!selectedGrade) {
      roomOptions.value = [];
      scopeForm.room = null;
      return;
    }

    const res = await api.get('/api/attendance/rooms', {
      params: {
        grade: selectedGrade.label,
        schoolId: scopeForm.school_id,
      },
    });
    roomOptions.value = (res.data?.data || []).map(String);
    if (scopeForm.room && !roomOptions.value.includes(String(scopeForm.room))) {
      scopeForm.room = null;
    }
  } catch (err) {
    console.error('Fetch rooms error:', err);
  }
};

const ensureScopeOptionsLoaded = async () => {
  const tasks: Promise<void>[] = [];
  if (provinceOptions.value.length === 0) tasks.push(fetchLocations());
  if (schoolOptions.value.length === 0) tasks.push(fetchSchools());
  if (gradeOptions.value.length === 0) tasks.push(fetchGrades());
  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
};

watch(
  () => [scopeForm.grade_level, scopeForm.school_id],
  () => {
    if (scopeForm.grade_level && scopeForm.school_id) {
      void fetchRooms();
    } else {
      roomOptions.value = [];
      scopeForm.room = null;
    }
  },
);

const onScopeProvinceChange = () => {
  scopeForm.allProvinces = false;
  scopeForm.district = null;
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onScopeDistrictChange = () => {
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onScopeSubDistrictChange = () => {
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onScopeSchoolChange = () => {
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const scopeFieldLabels: Record<ScopeFormField, string> = {
  province: 'จังหวัด',
  district: 'อำเภอ',
  sub_district: 'ตำบล',
  school_id: 'โรงเรียน',
  grade_level: 'ระดับชั้น',
  room: 'ห้องเรียน',
};

const isScopeFieldLocked = (field: ScopeFormField) => (
  !roleScopePreset.value.allowedFields.includes(field)
);

const applyRoleScopePreset = () => {
  const preset = roleScopePreset.value;

  if (preset.mode === 'flexible') {
    return;
  }

  if (preset.mode === 'global') {
    scopeForm.allProvinces = true;
    scopeForm.province = null;
    scopeForm.district = null;
    scopeForm.sub_district = null;
    scopeForm.school_id = null;
    scopeForm.grade_level = null;
    scopeForm.room = null;
    roomOptions.value = [];
    return;
  }

  scopeForm.allProvinces = false;

  if (!preset.allowedFields.includes('province')) scopeForm.province = null;
  if (!preset.allowedFields.includes('district')) scopeForm.district = null;
  if (!preset.allowedFields.includes('sub_district')) scopeForm.sub_district = null;
  if (!preset.allowedFields.includes('school_id')) scopeForm.school_id = null;
  if (!preset.allowedFields.includes('grade_level')) scopeForm.grade_level = null;
  if (!preset.allowedFields.includes('room')) scopeForm.room = null;

  if (preset.requiredFields.includes('province') && !scopeForm.province && availableProvinceOptions.value.length === 1) {
    scopeForm.province = availableProvinceOptions.value[0] || null;
  }

  if (preset.requiredFields.includes('district') && !scopeForm.district && availableDistrictOptions.value.length === 1) {
    scopeForm.district = availableDistrictOptions.value[0] || null;
  }

  if (preset.requiredFields.includes('sub_district') && !scopeForm.sub_district && availableSubDistrictOptions.value.length === 1) {
    scopeForm.sub_district = availableSubDistrictOptions.value[0] || null;
  }

  if (preset.requiredFields.includes('school_id') && !scopeForm.school_id && filteredSchools.value.length === 1) {
    scopeForm.school_id = filteredSchools.value[0]?.value || null;
  }

  if (isScopeFieldLocked('room')) {
    roomOptions.value = [];
  }
};

const onAllProvincesToggle = (enabled: boolean | null) => {
  if (!canUseNationwideScope.value) {
    scopeForm.allProvinces = false;
    return;
  }

  if (!enabled) {
    return;
  }

  scopeForm.province = null;
  scopeForm.district = null;
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const canGrantPermission = (permissionId: string) => (
  GRANT_EXEMPT_PERMISSION_IDS.includes(permissionId) ||
  currentUserGrantablePermissionSet.value.has('*') ||
  currentUserGrantablePermissionSet.value.has('ALL') ||
  currentUserGrantablePermissionSet.value.has(permissionId)
);

const isPermissionLocked = (permissionId: string) => (
  !form.permissions.includes(permissionId) && !canGrantPermission(permissionId)
);

const getPermissionVisualState = (permissionId: string) => (
  getPermissionDeltaState(
    permissionId,
    form.permissions,
    roleDefaultPermissions.value,
    isPermissionLocked(permissionId),
  )
);

const getPermissionVisualMeta = (permissionId: string) => (
  PERMISSION_DELTA_META[getPermissionVisualState(permissionId)]
);

const togglePermission = (permissionId: string, checked: boolean) => {
  if (checked) {
    if (!form.permissions.includes(permissionId) && canGrantPermission(permissionId)) {
      form.permissions = [...form.permissions, permissionId];
    }
    return;
  }

  form.permissions = form.permissions.filter((item) => item !== permissionId);
};

const removePermission = (permissionId: string) => {
  form.permissions = form.permissions.filter((item) => item !== permissionId);
};

const buildDataScope = (): DataScope => {
  const dataScope: DataScope = {};
  if (!scopeForm.allProvinces && scopeForm.province) dataScope.provinces = [scopeForm.province];
  if (!scopeForm.allProvinces && scopeForm.district) dataScope.districts = [scopeForm.district];
  if (!scopeForm.allProvinces && scopeForm.sub_district) dataScope.sub_districts = [scopeForm.sub_district];
  if (!scopeForm.allProvinces && scopeForm.school_id) dataScope.school_ids = [scopeForm.school_id];
  if (scopeForm.grade_level) dataScope.grade_levels = [scopeForm.grade_level];
  if (scopeForm.room) dataScope.room_ids = [scopeForm.room];
  return dataScope;
};

const resetScopeForm = () => {
  scopeForm.allProvinces = canUseNationwideScope.value;
  scopeForm.province = null;
  scopeForm.district = null;
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const openAddDialog = async () => {
  if (!canCreateLoginLinks.value) {
    void router.push('/forbidden');
    return;
  }

  await ensureScopeOptionsLoaded();
  if (rolesCatalog.value.length === 0) {
    await fetchRolesCatalog();
  }
  form.assigned_to_name = '';
  form.assigned_to_email = '';
  suppressRolePermissionSync.value = true;
  form.permissions = [];
  form.role = roleOptions.value.find((item) => item.value === 'TEACHER')?.value || roleOptions.value[0]?.value || 'TEACHER';
  form.expires_value = 1;
  form.expires_unit = 'days';
  resetScopeForm();
  await nextTick();
  suppressRolePermissionSync.value = false;
  applyRoleScopePreset();
  showResult.value = false;
  resultLink.value = '';
  addDialog.value = true;
};

watch(() => form.role, () => {
  if (!suppressRolePermissionSync.value) {
    form.permissions = Array.from(
      new Set(
        (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
      ),
    );
  }
  applyRoleScopePreset();
});

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

  submitLoading.value = true;
  try {
    const payload = {
      task_type: 'LOGIN',
      type: 'LOGIN',
      assigned_to_name: form.assigned_to_name.trim(),
      assigned_to_email: form.assigned_to_email.trim(),
      permissions: [...form.permissions],
      role: form.role,
      data_scope: buildDataScope(),
      expires_value: form.expires_value,
      expires_unit: form.expires_unit,
    };
    const res = await api.post('/api/tasks', payload);
    let link = normalizePublicLink(res.data.magic_link);
    link = link.replace('/task/', '/login/magic/');
    resultLink.value = link;
    showResult.value = true;
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
  } finally { submitLoading.value = false; }
};

const copyDirectLink = () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    void navigator.clipboard.writeText(resultLink.value);
    $q.notify({ color: 'positive', message: 'คัดลอกลิงก์เรียบร้อย', icon: 'check', position: 'top' });
  }
};

const fetchLoginLinks = async () => {
  loading.value = true; loginLinks.value = [];
  try {
    const res = await api.get('/api/tasks/login-links');
    loginLinks.value = res.data;
    lastUpdated.value = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.error('Error fetching login links:', err);
  } finally { loading.value = false; }
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
  adminActionDialog.action === 'lock' ? 'ยืนยันปิดลิงก์เข้าสู่ระบบ' : 'ยืนยันเปิดลิงก์เข้าสู่ระบบ'
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
    await fetchLoginLinks();
  } catch {
    $q.notify({ message: 'ไม่สามารถอัปเดตสถานะลิงก์ได้', color: 'negative' });
  } finally {
    adminActionDialog.loading = false;
  }
};

const copyLink = (link: LoginLink) => {
  const url = link.magic_link.replace('/task/', '/login/magic/');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    void navigator.clipboard.writeText(url);
    $q.notify({ color: 'positive', message: 'คัดลอกลิงก์เรียบร้อย', icon: 'check', position: 'top' });
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

onMounted(() => {
  void fetchRolesCatalog();
  void fetchLoginLinks();
  void ensureScopeOptionsLoaded();
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
