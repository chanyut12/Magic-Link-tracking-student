<template>
  <q-page class="manage-users-page q-pa-lg">
    <div class="page-container">
      <div class="sticky-header">
        <div class="tabs-container q-mb-lg">
          <div class="page-tab-item active">
            ผู้ใช้งานทั้งหมด
          </div>
        </div>

        <div class="header-toolbar">
          <div class="search-and-count">
            <div class="search-container header-search">
              <i class="fas fa-search"></i>
              <input
                v-model="searchText"
                type="text"
                class="search-input"
                placeholder="ค้นหาชื่อผู้ใช้งาน ชื่อ-นามสกุล หรือเลขบัตร..."
              >
            </div>

            <div class="student-count-chip user-count-chip">
              <i class="fas fa-users"></i>
              <span>{{ filteredUsers.length }} คน</span>
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            no-caps
            class="action-btn-top add-user-btn"
            @click="openAddDialog"
          >
            <i class="fas fa-user-plus q-mr-sm"></i>
            เพิ่มผู้ใช้งาน
          </q-btn>
        </div>
      </div>

      <div class="user-list">
        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="3em" />
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state-box">
          <div class="empty-icon-wrapper">
            <i class="fas fa-user-shield"></i>
          </div>
          <h2>ไม่พบข้อมูลผู้ใช้งาน</h2>
          <p>ลองค้นหาด้วยชื่อ ชื่อผู้ใช้ หรือเลขบัตรประชาชนอีกครั้ง</p>
        </div>

        <template v-else>
          <div class="table-wrap">
            <q-table
              class="student-table user-table"
              :rows="filteredUsers"
              :columns="columns"
              row-key="id"
              flat
              v-model:pagination="pagination"
              :rows-per-page-options="rowsPerPageOptions"
            >
              <template v-slot:body-cell-index="props">
                <q-td :props="props" class="text-grey-5">
                  {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
                </q-td>
              </template>

              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div class="student-info">
                    <div class="student-avatar" :style="getAvatarGradient(getUserDisplayName(props.row))">
                      {{ getUserInitial(props.row) }}
                    </div>
                    <div class="student-details">
                      <h3>{{ getUserDisplayName(props.row) }}</h3>
                      <div class="student-id">บัญชี: {{ props.row.username || '-' }}</div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-person_id="props">
                <q-td :props="props" class="table-value-muted">
                  {{ props.row.PersonID_Onec || '-' }}
                </q-td>
              </template>

              <template v-slot:body-cell-role="props">
                <q-td :props="props">
                  <span class="role-pill">{{ getRoleText(props.row) }}</span>
                </q-td>
              </template>

              <template v-slot:body-cell-affiliation="props">
                <q-td :props="props" class="table-value-muted">
                  {{ props.row.affiliation || '-' }}
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" auto-width>
                  <div class="table-action-group">
                    <q-btn
                      unelevated
                      color="primary"
                      icon="fas fa-pencil"
                      size="sm"
                      class="primary-action-btn"
                      label="แก้ไข"
                      no-caps
                      @click.stop="editUser(props.row)"
                    />
                    <q-btn
                      unelevated
                      color="red"
                      icon="fas fa-trash"
                      size="sm"
                      class="delete-action-btn"
                      label="ลบ"
                      no-caps
                      @click.stop="confirmDelete(props.row)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>
          </div>

          <div class="mobile-user-list">
            <div
              v-for="(user, index) in paginatedUsers"
              :key="user.id ?? index"
              class="user-mobile-card"
              :style="{ animationDelay: `${(index % pagination.rowsPerPage) * 30}ms` }"
            >
              <div class="mobile-card-header">
                <div class="student-info">
                  <div class="student-avatar" :style="getAvatarGradient(getUserDisplayName(user))">
                    {{ getUserInitial(user) }}
                  </div>
                  <div class="student-details">
                    <h3>{{ getUserDisplayName(user) }}</h3>
                    <div class="student-id">บัญชี: {{ user.username || '-' }}</div>
                  </div>
                </div>

                <div class="user-mobile-index">
                  {{ paginationStart + index }}
                </div>
              </div>

              <div class="mobile-user-meta">
                <div class="meta-item">
                  <span class="meta-label">เลขบัตรประชาชน</span>
                  <span class="meta-value">{{ user.PersonID_Onec || '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">ตำแหน่ง</span>
                  <span class="meta-value">{{ getRoleText(user) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">สังกัด</span>
                  <span class="meta-value">{{ user.affiliation || '-' }}</span>
                </div>
              </div>

              <div class="mobile-user-actions">
                <q-btn
                  unelevated
                  color="primary"
                  icon="fas fa-pencil"
                  size="sm"
                  class="full-width primary-action-btn"
                  label="แก้ไข"
                  no-caps
                  @click="editUser(user)"
                />
                <q-btn
                  unelevated
                  color="red"
                  icon="fas fa-trash"
                  size="sm"
                  class="full-width delete-action-btn"
                  label="ลบ"
                  no-caps
                  @click="confirmDelete(user)"
                />
              </div>
            </div>

            <div class="pagination-panel">
              <div class="pagination-summary">
                แสดง {{ paginationStart }}-{{ paginationEnd }} จาก {{ filteredUsers.length }} คน
              </div>

              <div class="pagination-controls">
                <label class="rows-per-page-control">
                  <span>ต่อหน้า</span>
                  <select v-model.number="pagination.rowsPerPage" class="filter-select rows-per-page-select">
                    <option v-for="size in rowsPerPageOptions" :key="size" :value="size">{{ size }}</option>
                  </select>
                </label>

                <q-pagination
                  v-model="pagination.page"
                  :max="totalPages"
                  :max-pages="6"
                  direction-links
                  boundary-links
                  color="primary"
                  active-design="unelevated"
                  active-color="primary"
                />
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Advanced Add/Edit User Dialog -->
      <q-dialog v-model="showAddDialog" persistent full-width class="advanced-dialog">
        <q-card class="user-dialog-card" style="height: 90vh; display: flex; flex-direction: column;">
          <!-- Header (Fixed) -->
          <q-card-section class="row items-center q-pa-lg">
            <div class="text-h5 text-weight-bold full-width text-center relative-position">
              {{ isEdit ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่' }}
              <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
            </div>
          </q-card-section>

          <q-form @submit="saveUser" ref="userFormRef" class="col column no-wrap overflow-hidden">
            <!-- Scrollable Body -->
            <q-card-section class="col scroll q-pa-lg">
              <div class="row q-col-gutter-xl">
                <!-- Left Sidebar: Photo -->
                <div class="col-12 col-md-5">
                  <div class="photo-upload-section column items-center justify-center">
                    <div class="photo-placeholder column items-center justify-center">
                      <q-icon name="fas fa-camera" size="80px" color="blue-grey-3" />
                      <div class="text-h6 text-weight-bold text-blue-grey-3 q-mt-md">เพิ่มรูปภาพ</div>
                      <div class="text-caption text-blue-grey-2">ขนาดที่แนะนำ 4:5</div>
                    </div>
                  </div>
                </div>

              <!-- Right: Form Fields - 7/12 for better balance -->
              <div class="col-12 col-md-7">
                <div class="text-h6 text-weight-bold q-mb-lg underline-title">ข้อมูลทั่วไปของผู้ใช้งาน</div>
                
                <div class="row q-col-gutter-md">
                  <!-- Row 1 -->
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">ชื่อ</div>
                    <q-input 
                      v-model="userForm.FirstName" 
                      outlined 
                      dense 
                      placeholder="กรอกชื่อ" 
                      bg-color="white" 
                      class="custom-input"
                      :rules="[val => !!val || 'กรุณากรอกชื่อ']"
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">นามสกุล</div>
                    <q-input 
                      v-model="userForm.LastName" 
                      outlined 
                      dense 
                      placeholder="กรอกนามสกุล" 
                      bg-color="white" 
                      class="custom-input"
                      :rules="[val => !!val || 'กรุณากรอกนามสกุล']"
                      hide-bottom-space
                    />
                  </div>
                  
                  <div class="col-12">
                    <div class="text-weight-bold q-mb-xs">บัญชีผู้ใช้งาน</div>
                    <q-input 
                      v-model="userForm.username" 
                      outlined 
                      dense 
                      placeholder="กรอกชื่อผู้ใช้งาน" 
                      :readonly="isEdit" 
                      bg-color="white" 
                      class="custom-input"
                      maxlength="20"
                      @update:model-value="val => userForm.username = String(val || '').replace(/[\u0E00-\u0E7F\s]/g, '')"
                      :rules="[
                        val => !!val || 'กรุณากรอกชื่อผู้ใช้งาน',
                        val => (val && val.length >= 4) || 'ชื่อผู้ใช้งานต้องมีอย่างน้อย 4 ตัวอักษร',
                        val => /^[a-zA-Z0-9._-]+$/.test(val) || 'ชื่อผู้ใช้งานต้องเป็นภาษาอังกฤษและตัวเลขเท่านั้น'
                      ]"
                      hide-bottom-space
                    />
                  </div>

                  <!-- Row 2 -->
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">บัตรประชาชน</div>
                    <q-input 
                      v-model="userForm.PersonID_Onec" 
                      outlined 
                      dense 
                      placeholder="กรอกเลขบัตรประชาชน" 
                      bg-color="white" 
                      class="custom-input"
                      mask="#############"
                      :rules="[val => !val || /^[0-9]{13}$/.test(val) || 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก']"
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">เบอร์โทรศัพท์</div>
                    <q-input 
                      v-model="userForm.phone" 
                      outlined 
                      dense 
                      placeholder="กรอกเบอร์โทรศัพท์" 
                      bg-color="white" 
                      class="custom-input"
                      mask="##########"
                      :rules="[
                        val => !val || /^[0-9]{10}$/.test(val) || 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'
                      ]"
                      hide-bottom-space
                    />
                  </div>

                  <!-- Row 3 -->
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">อีเมล</div>
                    <q-input 
                      v-model="userForm.email" 
                      outlined 
                      dense 
                      placeholder="กรอกอีเมล" 
                      bg-color="white" 
                      class="custom-input"
                      :rules="[val => !val || /.+@.+\..+/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง']"
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">รหัสผ่าน</div>
                    <q-input 
                      v-model="userForm.password" 
                      outlined 
                      dense 
                      type="password" 
                      placeholder="กรอกรหัสผ่าน" 
                      bg-color="white" 
                      class="custom-input"
                      maxlength="32"
                      @update:model-value="val => userForm.password = String(val || '').replace(/[\u0E00-\u0E7F\s]/g, '')"
                      :rules="[
                        val => isEdit || !!val || 'กรุณากรอกรหัสผ่าน',
                        val => isEdit || !val || (val && val.length >= 6) || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                      ]"
                      hide-bottom-space
                    />
                  </div>

                  <!-- Row 4 -->
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">สถานะ/ตำแหน่ง</div>
                    <q-select 
                      v-model="selectedRoles" 
                      :options="roleOptions" 
                      outlined 
                      dense 
                      bg-color="white"
                      class="custom-input multi-role-select"
                      emit-value
                      map-options
                      multiple
                      use-chips
                      stack-label
                      placeholder="เลือกตำแหน่ง"
                      popup-content-class="custom-select-popup"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">สังกัด</div>
                    <q-input v-model="userForm.affiliation" outlined dense placeholder="กรอกสังกัด" bg-color="white" class="custom-input" />
                  </div>
                </div> <!-- End row q-col-gutter-md -->
              </div> <!-- End col-md-7 -->
            </div> <!-- End row q-col-gutter-xl (Fixes missing end tag) -->

            <!-- Permission Tabs -->
            <div class="q-mt-xl">
              <q-tabs
                v-model="activeTab"
                dense
                class="permission-tabs text-grey"
                active-color="primary"
                indicator-color="transparent"
                align="left"
                narrow-indicator
                no-caps
              >
                <q-tab name="menu" label="สิทธิ์การเข้าถึงเมนู" class="tab-item" />
                <q-tab name="school" label="สิทธิ์การเข้าถึงข้อมูลระดับสถานศึกษา" class="tab-item" />
                <q-tab name="province" label="สิทธิ์การเข้าถึงข้อมูลระดับจังหวัด" class="tab-item" />
              </q-tabs>

              <q-tab-panels v-model="activeTab" animated class="permission-panels q-mt-md">
                <q-tab-panel name="menu" class="q-pa-none">
                    <div class="permission-list q-gutter-y-sm">
                      <div v-for="menu in menuList" :key="menu.id" class="menu-permission-item">
                        <div class="row items-center q-pa-sm bg-grey-2 rounded-card cursor-pointer" @click="togglePermission(menu.id)">
                          <q-checkbox 
                            :model-value="userForm.permissions.includes(menu.id)" 
                            dense 
                            class="q-mr-md" 
                            style="pointer-events: none"
                          />
                          <span class="text-weight-medium">{{ menu.label }}</span>
                          <q-space />
                          <q-icon 
                            v-if="menu.children" 
                            :name="menu.expanded ? 'expand_less' : 'expand_more'" 
                            class="cursor-pointer" 
                            @click.stop="menu.expanded = !menu.expanded" 
                          />
                        </div>
                        <div v-if="menu.children && menu.expanded" class="q-pl-xl q-mt-sm q-gutter-y-sm">
                          <div 
                            v-for="child in menu.children" 
                            :key="child.id" 
                            class="row items-center q-pa-sm bg-grey-2 rounded-card cursor-pointer"
                            @click="togglePermission(child.id)"
                          >
                            <q-checkbox 
                              :model-value="userForm.permissions.includes(child.id)" 
                              dense 
                              class="q-mr-md" 
                              style="pointer-events: none"
                            />
                            <span>{{ child.label }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                </q-tab-panel>
                
                <q-tab-panel name="school">
                  <div class="text-grey-6 text-center q-pa-lg">ข้อมูลระดับสถานศึกษา</div>
                </q-tab-panel>
                
                <q-tab-panel name="province">
                  <div class="text-grey-6 text-center q-pa-lg">ข้อมูลระดับจังหวัด</div>
                </q-tab-panel>
                  </q-tab-panels>
                </div>
            </q-card-section>

          <!-- Footer (Always Visible) -->
          <q-card-actions align="center" class="q-pb-xl bg-white" style="z-index: 10; border-top: 1px solid #f1f5f9;">
            <q-btn 
              color="primary" 
              class="save-all-btn"
              no-caps
              size="lg"
              type="submit"
            >
              <div class="row items-center">
                <span class="q-mr-md">บันทึกข้อมูล</span>
                <q-icon name="fas fa-save" size="xs" />
              </div>
            </q-btn>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card class="q-pa-md" style="border-radius: 20px; min-width: 350px;">
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-trash" color="red" text-color="white" />
          <span class="q-ml-sm text-h6 text-weight-bold">ยืนยันการลบ</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>คุณต้องการลบผู้ใช้งาน <span class="text-weight-bold text-red">"{{ deleteTargetName }}"</span> ใช่หรือไม่?</p>
          <p class="text-caption text-grey-7">* ข้อมูลจะถูกลบออกจากระบบถาวรและไม่สามารถเรียกคืนได้</p>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
          <q-btn unelevated label="ยืนยันการลบ" color="red" @click="performDelete" no-caps class="rounded-10" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from 'boot/axios';
import { useQuasar, QForm, type QTableColumn } from 'quasar';
import { AxiosError } from 'axios';

interface User {
  id: number | null;
  username: string;
  FirstName: string | null;
  LastName: string | null;
  fullname?: string | null;
  PersonID_Onec: string | null;
  phone: string | null;
  email: string | null;
  affiliation: string | null;
  roles: string[];
  labels?: string[];
  permissions: string[];
  status: string;
  password?: string;
}

interface Role {
  id: number;
  name: string;
  label: string;
}

const $q = useQuasar();
const searchText = ref('');
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(false);
const rowsPerPageOptions = [10, 20, 50];
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
});

const showAddDialog = ref(false);
const showDeleteConfirm = ref(false);
const deleteTargetUser = ref<User | null>(null);
const isEdit = ref(false);
const activeTab = ref('menu');
const selectedRoles = ref<string[]>([]);
const userFormRef = ref<QForm | null>(null);
const userForm = ref<User>({
  id: null,
  username: '',
  password: '',
  FirstName: '',
  LastName: '',
  PersonID_Onec: '',
  phone: '',
  email: '',
  affiliation: '',
  roles: [],
  labels: [],
  permissions: [],
  status: 'ACTIVE'
});

const menuList = ref([
  { id: 'home', label: 'หน้าหลัก' },
  { 
    id: 'report', 
    label: 'รายงานนักเรียน', 
    expanded: false,
    children: [
      { id: 'rate', label: 'อัตราการหลุดและกลับสู่ระบบ' },
      { id: 'predict', label: 'คาดการณ์หลุดจากระบบ' },
      { id: 'at_risk', label: 'นักเรียนที่มีความเสี่ยง' },
      { id: 'school_status', label: 'สถานการณ์นักเรียน (จังหวัด/เขต)' },
      { id: 'attendance_rate', label: 'อัตราการเข้าเรียน' },
      { id: 'followup_summary', label: 'สรุปผลข้อมูลติดตาม' }
    ]
  },
  { id: 'track', label: 'ติดตามนักเรียน' },
  { id: 'basic_data', label: 'จัดการข้อมูลพื้นฐาน' },
  { id: 'import', label: 'นำเข้าข้อมูลผู้เรียน' },
  { id: 'manage_users', label: 'จัดการสิทธิ์ผู้ใช้งาน' },
  { id: 'history', label: 'ประวัติการใช้งาน' },
  { id: 'visit', label: 'เยี่ยมบ้าน' },
  { 
    id: 'attendance_system', 
    label: 'ระบบเช็คชื่อ', 
    expanded: false,
    children: [
      { id: 'attendance_dashboard', label: 'Dashboard เช็คชื่อ' },
      { id: 'attendance', label: 'เช็คชื่อ' }
    ]
  },
  { id: 'profile', label: 'ข้อมูลส่วนตัว' },
  { id: 'edu_history', label: 'ประวัติการศึกษา' },
  { id: 'health', label: 'ข้อมูลสุขภาพ' },
  { id: 'schedule', label: 'ตารางเรียน/สอบ' }
]);

const roleOptions = computed(() => {
  return roles.value.map(r => ({ label: r.label, value: r.name }));
});

const getUserDisplayName = (user: User) => {
  const firstName = user.FirstName?.trim() || '';
  const lastName = user.LastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user.fullname?.trim() || user.username || '-';
};

const getUserInitial = (user: User) => {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase() || '?';
};

const getRoleText = (user: User) => {
  return user.labels && user.labels.length > 0 ? user.labels.join(', ') : 'ไม่มีตำแหน่ง';
};

const deleteTargetName = computed(() => {
  const u = deleteTargetUser.value;
  if (!u) return '';
  return getUserDisplayName(u);
});

const avatarColors = [
  ['#6366f1', '#8b5cf6'],
  ['#ec4899', '#f43f5e'],
  ['#14b8a6', '#06b6d4'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#22c55e'],
  ['#3b82f6', '#0ea5e9'],
  ['#8b5cf6', '#a855f7'],
  ['#ef4444', '#f97316'],
] as const;

const getAvatarGradient = (name: string) => {
  if (!name) return { background: '#ccc', color: '#fff' };

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % avatarColors.length;
  const [c1, c2] = avatarColors[index] ?? ['#6366f1', '#8b5cf6'];

  return {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  };
};

watch(selectedRoles, (val) => {
  userForm.value.roles = val || [];
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get<User[]>('/api/users');
    users.value = res.data.map(u => ({
      ...u,
      labels: u.labels || []
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    loading.value = false;
  }
};


const fetchRoles = async () => {
  try {
    const res = await api.get('/api/users/roles');
    roles.value = res.data;
  } catch (err) {
    console.error('Error fetching roles:', err);
  }
};

const filteredUsers = computed(() => {
  const sortedUsers = [...users.value].sort((a, b) =>
    getUserDisplayName(a).localeCompare(getUserDisplayName(b), 'th')
  );

  if (!searchText.value) return sortedUsers;

  const lowerSearch = searchText.value.toLowerCase();
  return sortedUsers.filter(u =>
    [
      getUserDisplayName(u),
      u.username,
      u.PersonID_Onec,
      getRoleText(u),
      u.affiliation,
    ].some(value => String(value || '').toLowerCase().includes(lowerSearch))
  );
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredUsers.value.length / pagination.value.rowsPerPage));
});

const paginatedUsers = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return filteredUsers.value.slice(start, end);
});

const paginationStart = computed(() => {
  if (filteredUsers.value.length === 0) return 0;
  return (pagination.value.page - 1) * pagination.value.rowsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (filteredUsers.value.length === 0) return 0;
  return Math.min(pagination.value.page * pagination.value.rowsPerPage, filteredUsers.value.length);
});

const columns: QTableColumn<User>[] = [
  { name: 'index', label: '#', field: 'id', align: 'left' },
  { name: 'name', label: 'ผู้ใช้งาน', field: row => getUserDisplayName(row), align: 'left' },
  { name: 'person_id', label: 'เลขบัตรประชาชน', field: row => row.PersonID_Onec || '-', align: 'left' },
  { name: 'role', label: 'ตำแหน่ง', field: row => getRoleText(row), align: 'left' },
  { name: 'affiliation', label: 'สังกัด', field: row => row.affiliation || '-', align: 'left' },
  { name: 'actions', label: 'จัดการ', field: 'id', align: 'right' },
];

watch(searchText, () => {
  pagination.value.page = 1;
});

watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1;
});

watch(() => filteredUsers.value.length, () => {
  if (pagination.value.page > totalPages.value) {
    pagination.value.page = totalPages.value;
  }
});

const openAddDialog = () => {
  resetForm();
  showAddDialog.value = true;
};

const editUser = (user: User) => {
  isEdit.value = true;
  userForm.value = {
    id: user.id,
    username: user.username,
    FirstName: user.FirstName,
    LastName: user.LastName,
    PersonID_Onec: user.PersonID_Onec,
    phone: user.phone,
    email: user.email,
    affiliation: user.affiliation,
    roles: [...(user.roles || [])],
    labels: [...(user.labels || [])],
    permissions: [...(user.permissions || [])],
    status: user.status,
    password: user.password || ''
  };
  selectedRoles.value = [...(user.roles || [])];
  showAddDialog.value = true;
};

const saveUser = async () => {
  // Detailed Validation
  const f = userForm.value;
  const missingFields = [];
  
  if (!f.FirstName) missingFields.push('ชื่อ');
  if (!f.LastName) missingFields.push('นามสกุล');
  if (!f.username) missingFields.push('บัญชีผู้ใช้งาน');
  if (!isEdit.value && !f.password) missingFields.push('รหัสผ่าน');
  if (!f.PersonID_Onec || f.PersonID_Onec.length !== 13) missingFields.push('เลขบัตรประชาชน (13 หลัก)');
  if (!f.phone || f.phone.length !== 10) missingFields.push('เบอร์โทรศัพท์ (10 หลัก)');
  if (!f.email || !/.+@.+\..+/.test(f.email)) missingFields.push('อีเมล (รูปแบบถูกต้อง)');
  if (!selectedRoles.value || selectedRoles.value.length === 0) missingFields.push('ตำแหน่ง');
  if (!f.affiliation) missingFields.push('สังกัด');

  if (missingFields.length > 0) {
    $q.notify({
      color: 'negative',
      icon: 'warning',
      message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`,
      position: 'top',
      timeout: 3000
    });
    return;
  }

  const success = await userFormRef.value?.validate();
  if (!success) return;

  try {
    if (isEdit.value) {
      await api.put(`/api/users/${userForm.value.id}`, userForm.value);
      $q.notify({ color: 'positive', message: 'แก้ไขข้อมูลสำเร็จ', position: 'top' });
    } else {
      await api.post('/api/users', userForm.value);
      $q.notify({ color: 'positive', message: 'เพิ่มผู้ใช้งานสำเร็จ', position: 'top' });
    }
    showAddDialog.value = false;
    await fetchUsers();
    resetForm();
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    $q.notify({ color: 'negative', message: error.response?.data?.message || 'เกิดข้อผิดพลาด', position: 'top' });
  }
};

const confirmDelete = (user: User) => {
  deleteTargetUser.value = user;
  showDeleteConfirm.value = true;
};

const performDelete = async () => {
  if (!deleteTargetUser.value?.id) return;
  
  const userId = deleteTargetUser.value.id;
  // loading.value = true; // Remove this to prevent full page flicker
  showDeleteConfirm.value = false;
  
  try {
    await api.delete(`/api/users/${userId}`);
    
    // Remove from local array immediately for smooth UX
    users.value = users.value.filter(u => u.id !== userId);
    
    $q.notify({ 
      color: 'positive', 
      message: 'ลบข้อมูลสำเร็จ', 
      position: 'top',
      icon: 'check',
      timeout: 2000
    });
    // await fetchUsers(); // Optional: background refresh
  } catch (err: unknown) {
    console.error('Error deleting user:', err);
    let errorMsg = 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
    if (err instanceof AxiosError) {
      errorMsg = err.response?.data?.message || err.message;
    }
    $q.notify({ 
      color: 'negative', 
      message: `เกิดข้อผิดพลาด: ${errorMsg}`,
      icon: 'error',
      position: 'top' 
    });
  } finally {
    // loading.value = false;
    deleteTargetUser.value = null;
  }
};

const resetForm = () => {
  isEdit.value = false;
  selectedRoles.value = [];
  userForm.value = {
    id: null,
    username: '',
    password: '',
    FirstName: '',
    LastName: '',
    PersonID_Onec: '',
    phone: '',
    email: '',
    affiliation: '',
    roles: [],
    labels: [],
    permissions: [],
    status: 'ACTIVE'
  };
};

const togglePermission = (id: string) => {
  const index = userForm.value.permissions.indexOf(id);
  if (index === -1) {
    userForm.value.permissions.push(id);
  } else {
    userForm.value.permissions.splice(index, 1);
  }
};

onMounted(() => {
  fetchUsers().catch(err => console.error(err));
  fetchRoles().catch(err => console.error(err));
});
</script>

<style lang="scss" scoped>
.manage-users-page {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  min-height: 100vh;
  overflow-y: auto;
  font-family: 'Prompt', 'Inter', sans-serif;
}

.page-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.full-width {
  width: 100%;
}

.tabs-container {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;

  &::-webkit-scrollbar {
    display: none;
  }
}

.page-tab-item {
  padding: 0.75rem 0;
  font-weight: 700;
  color: #64748b;
  position: relative;
  transition: color 0.2s ease;

  &.active {
    color: #2563eb;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 3px 3px 0 0;
    }
  }
}

.search-container {
  position: relative;
  width: 100%;

  i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    transition: color 0.2s;
  }

  &:focus-within i {
    color: #3b82f6;
  }
}

.header-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.search-and-count {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 auto;
}

.header-search {
  flex: 0 1 460px;
  max-width: 460px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 99px;
  border: 1px solid #e2e8f0;
  background: white;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
}

.filter-select {
  padding: 0 36px 0 16px;
  height: 40px;
  border-radius: 99px;
  border: 1.5px solid #dbeafe;
  background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='%231e40af' d='M207.02 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.353-9.353 24.522-9.378 33.901-.057L224 284.505l154.745-154.021c9.379-9.321 24.548-9.295 33.901.057l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.951 0z'/%3E%3C/svg%3E") no-repeat calc(100% - 14px) center;
  background-size: 11px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e40af;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.05);

  &:hover {
    border-color: #3b82f6;
    background-color: #f8fbff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
}

.sticky-header {
  position: sticky;
  top: 1rem;
  z-index: 100;
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
  margin-bottom: 2rem;
}

.student-count-chip {
  padding: 0 18px;
  height: 40px;
  border-radius: 99px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1.5px solid #93c5fd;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e40af;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

  i {
    color: #3b82f6;
    font-size: 0.95rem;
  }
}

.user-count-chip {
  justify-content: center;
  flex-shrink: 0;
  white-space: nowrap;
}

.action-btn-top {
  border-radius: 99px;
  min-height: 40px;
  padding: 0 20px;
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
}

.add-user-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 100px;
}

.table-wrap {
  display: block;
  background: white;
  border-radius: 24px;
  border: 1px solid #dbeafe;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
  overflow: hidden;
}

:deep(.student-table .q-table__middle) {
  overflow: auto;
}

:deep(.student-table table) {
  min-width: 980px;
}

:deep(.student-table thead tr) {
  background: #f8fbff;
}

:deep(.student-table thead th) {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:deep(.student-table tbody td) {
  padding-top: 1rem;
  padding-bottom: 1rem;
  vertical-align: middle;
}

:deep(.student-table .q-table__bottom) {
  border-top: 1px solid #dbeafe;
  background: white;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.student-details {
  h3 {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
    letter-spacing: -0.01em;
  }

  .student-id {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    margin-top: 2px;
  }
}

.table-value-muted {
  color: #64748b;
  font-weight: 600;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.4;
}

.table-action-group {
  display: flex;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.primary-action-btn,
.delete-action-btn {
  border-radius: 12px;
  font-weight: 700;
  min-height: 36px;

  :deep(.q-btn__content) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    line-height: 1;
  }

  :deep(.q-btn__icon),
  :deep(.q-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    margin: 0;
  }

  :deep(.block) {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }
}

.mobile-user-list {
  display: none;
}

.user-mobile-card {
  background: white;
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  opacity: 0;
  animation: fade-in-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.mobile-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-mobile-index {
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 800;
}

.mobile-user-meta {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #e0ecff;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.meta-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.meta-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.mobile-user-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.pagination-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(147, 197, 253, 0.35);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(10px);
}

.pagination-summary {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a8a;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.rows-per-page-control {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
}

.rows-per-page-select {
  min-width: 92px;
  padding-right: 2.4rem;
}

:deep(.q-pagination) {
  gap: 0.25rem;
}

:deep(.q-pagination .q-btn) {
  border-radius: 12px;
  min-width: 38px;
  min-height: 38px;
  font-weight: 700;
}

.empty-icon-wrapper {
  margin-bottom: 1rem;
}

.empty-state-box {
  text-align: center;
  padding: 5rem 2rem;
  color: #64748b;
  background: white;
  border-radius: 24px;
  border: 2.5px dashed #cbd5e1;
  margin-top: 1rem;

  i {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: float 3s ease-in-out infinite;
  }

  h2 {
    color: #1e3a8a;
    margin-bottom: 0.75rem;
    font-weight: 900;
    font-size: 2rem;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 1.05rem;
    color: #64748b;
    max-width: 360px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-12px) rotate(2deg);
  }
}

.user-dialog-card {
  border-radius: 60px !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.photo-upload-section {
  background: #f1f5f9;
  border-radius: 40px;
  height: 450px;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}

.photo-placeholder {
  border: 4px dashed #cbd5e1;
  border-radius: 40px;
  width: 100%;
  height: 100%;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: var(--q-primary);
    background: #eef2ff;

    .q-icon {
      color: var(--q-primary);
    }

    .text-blue-grey-3 {
      color: var(--q-primary);
    }
  }
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 20px !important;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0 16px;
    height: 48px;
    transition: all 0.2s ease;
    
    &:before,
    &:after {
      display: none;
    }

    &.q-field__control--focused {
      border-color: var(--q-primary);
      background: white;
      box-shadow: 0 0 0 3px rgba(15, 77, 194, 0.1);
    }
  }
}

.underline-title {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
}

.permission-tabs {
  background: #f1f5f9;
  border-radius: 25px;
  padding: 6px;
  margin-bottom: 24px;

  .tab-item {
    border-radius: 20px;
    margin-right: 8px;
    min-height: 44px;
    transition: all 0.3s ease;

    &.q-tab--active {
      background: white;
      color: #0f4dc2;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    &:not(.q-tab--active) {
      background: transparent;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
    }
  }
}

.menu-permission-item {
  margin-bottom: 12px;
}

.rounded-card {
  border-radius: 25px;
  background: #f1f5f9 !important;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: #eef2ff !important;
    border-color: rgba(15, 77, 194, 0.2);
  }
}

.save-all-btn {
  width: 320px;
  height: 64px;
  border-radius: 32px;
  background: #0f4dc2 !important;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 15px 35px rgba(15, 77, 194, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 45px rgba(15, 77, 194, 0.5);
  }

  &:active {
    transform: translateY(-1px);
  }
}

@media (max-width: 768px) {
  .header-toolbar {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .search-and-count {
    flex: 1 1 100%;
    flex-wrap: wrap;
  }

  .header-search {
    flex: 1 1 100%;
    max-width: none;
  }

  .add-user-btn {
    margin-left: 0;
    width: 100%;
  }

  .table-wrap {
    display: none;
  }

  .mobile-user-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pagination-panel {
    padding: 1rem;
  }

  .pagination-controls {
    width: 100%;
    justify-content: space-between;
  }

  .rows-per-page-control {
    width: 100%;
    justify-content: space-between;
  }

  .mobile-card-header {
    flex-direction: column;
  }

  .user-mobile-index {
    align-self: flex-end;
  }

  .empty-state-box {
    padding: 3rem 1.5rem;

    i {
      font-size: 4rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    p {
      font-size: 0.95rem;
    }
  }
}

@media (max-width: 599px) {
  .user-dialog-card {
    border-radius: 24px !important;
  }

  .save-all-btn {
    width: 100%;
  }
}
</style>
