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
            text-color="indigo-9"
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
              <strong class="text-grey-9">{{ props.row.assigned_to_name || 'ไม่ระบุ' }}</strong>
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
        <q-card style="width: 500px; max-width: 90vw; border-radius: 16px;">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold text-grey-9">{{ showResult ? 'สรุปการสร้างลิงก์' : 'สร้างลิงก์เข้าสู่ระบบ' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-form v-if="!showResult" @submit="submitAddLink">
            <q-card-section class="q-gutter-md q-pt-lg">
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">ชื่อผู้ครอบครองลิงก์ (Name) *</div>
                <q-input v-model="form.assigned_to_name" outlined dense placeholder="เช่น นนท์" :rules="[val => !!val || 'กรุณากรอกชื่อ']" />
              </div>
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">อีเมลสวมสิทธิ์ (Email) *</div>
                <q-input v-model="form.assigned_to_email" outlined dense type="email" placeholder="เช่น user@gmail.com" :rules="[val => !!val || 'กรุณากรอกอีเมล', val => /.+@.+\..+/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง']" />
              </div>
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">สิทธิ์การใช้งาน (Permissions)</div>
                <q-btn-dropdown unelevated outline color="grey-7" class="full-width" label="เลือกสิทธิ์การใช้งาน" no-caps>
                  <q-list dense>
                    <q-item v-for="opt in permissionOptions" :key="opt.value" tag="label" v-ripple>
                      <q-item-section side><q-checkbox v-model="form.mock_permissions" :val="opt.value" dense /></q-item-section>
                      <q-item-section><q-item-label>{{ opt.label }}</q-item-label></q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
                <div class="q-mt-xs row q-gutter-xs">
                  <q-chip v-for="p in form.mock_permissions" :key="p" dense removable color="blue-1" text-color="primary" @remove="form.mock_permissions = form.mock_permissions.filter(x => x !== p)">{{ permissionOptions.find(o => o.value === p)?.label || p }}</q-chip>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">บทบาท (ROLE) *</div>
                <select v-model="form.selected_role" class="full-width q-pa-sm bg-grey-1 rounded-borders" style="border: 1px solid #e2e8f0; height: 40px; outline: none;">
                  <option value="TEACHER">ครูประจำชั้น</option><option value="ADMIN_SCHOOL">ผู้ดูแลระบบโรงเรียน</option><option value="ADMIN">ผู้ดูแลระบบสูงสุด (Admin)</option>
                </select>
              </div>
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">อายุลิงก์</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-8"><q-input v-model.number="form.expires_value" type="number" outlined dense min="1" /></div>
                  <div class="col-4">
                    <select v-model="form.expires_unit" class="full-width q-pa-sm bg-grey-1 rounded-borders" style="border: 1px solid #e2e8f0; height: 40px; outline: none;">
                      <option value="days">วัน</option><option value="hours">ชั่วโมง</option><option value="minutes">นาที</option>
                    </select>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right" class="q-px-md q-pb-md">
              <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
              <q-btn unelevated label="สร้างลิงก์" color="primary" type="submit" :loading="submitLoading" no-caps />
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
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();

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
}

const loginLinks = ref<LoginLink[]>([]);
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
  loading: false
});

// Filters State (Added)
const filters = reactive({
  status: 'ALL',
  search: ''
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
  { label: 'หมดอายุ', value: 'EXPIRED' }
];

const columns = [
  { name: 'index', label: 'ลำดับ', align: 'center' as const, field: 'id' },
  { name: 'name', label: 'ผู้ครอบครอง (Name)', align: 'left' as const, field: 'assigned_to_name' },
  { name: 'email', label: 'อีเมลสวมสิทธิ์', align: 'left' as const, field: 'assigned_to_email' },
  { name: 'status', label: 'สถานะ', align: 'center' as const, field: 'status' },
  { name: 'actions', label: 'จัดการ', align: 'center' as const, field: 'id' },
  { name: 'expires', label: 'วันหมดอายุ', align: 'right' as const, field: 'expires_at' },
  { name: 'created_at', label: 'วันที่สร้าง', align: 'right' as const, field: 'created_at' }
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

// Computed Filtered List (Added)
const filteredLoginLinks = computed(() => {
  const now = new Date();
  return loginLinks.value.filter(link => {
    // 1. Status Filter
    const isLocked = Boolean(link.admin_locked);
    const isExpired = new Date(link.expires_at) < now;
    let s = 'ACTIVE';
    if (isLocked) s = 'LOCKED';
    else if (isExpired) s = 'EXPIRED';

    if (filters.status !== 'ALL' && s !== filters.status) return false;

    // 2. Search Filter
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

const permissionOptions = [
  { label: 'ดูแดชบอร์ดรายงาน', value: 'VIEW_DASHBOARD' },
  { label: 'จัดการรายชื่อนักเรียน', value: 'MANAGE_STUDENTS' },
  { label: 'เช็คชื่อขาด/มา', value: 'CHECK_ATTENDANCE' },
  { label: 'สร้างลิงก์/มอบหมายงาน', value: 'MANAGE_TASKS' }
];

const form = reactive({
  assigned_to_name: '',
  assigned_to_email: '',
  mock_permissions: ['VIEW_DASHBOARD'] as string[],
  selected_role: 'TEACHER',
  expires_value: 1,
  expires_unit: 'days'
});

const openAddDialog = () => {
  form.assigned_to_name = '';
  form.assigned_to_email = '';
  form.mock_permissions = ['VIEW_DASHBOARD'];
  form.selected_role = 'TEACHER';
  form.expires_value = 1;
  form.expires_unit = 'days';
  showResult.value = false;
  resultLink.value = '';
  addDialog.value = true;
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
  } catch { return rawLink; }
};

const submitAddLink = async () => {
  submitLoading.value = true;
  try {
    const payload = {
      task_type: 'LOGIN', type: 'LOGIN',
      assigned_to_name: form.assigned_to_name,
      assigned_to_email: form.assigned_to_email,
      mock_permissions: form.mock_permissions,
      selected_role: form.selected_role,
      expires_value: form.expires_value,
      expires_unit: form.expires_unit
    };
    const res = await api.post('/api/tasks', payload);
    let link = normalizePublicLink(res.data.magic_link);
    link = link.replace('/task/', '/login/magic/');
    resultLink.value = link;
    showResult.value = true;
    void fetchLoginLinks();
  } catch (err) {
    console.error('Create link error:', err);
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

onMounted(() => { void fetchLoginLinks(); });
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
</style>
