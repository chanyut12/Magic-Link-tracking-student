<template>
  <q-page class="manage-users-page q-pa-lg">
    <div class="page-container">
      
      <!-- Top Action Bar (Fixed at top of page) -->
      <div class="top-bar-sticky">
        <div class="row items-center justify-between q-mb-md sticky-content">
          <div class="search-bar">
            <q-input 
              outlined 
              dense 
              v-model="searchText" 
              placeholder="ค้นหาผู้ใช้งาน"
              class="search-input"
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="fas fa-search" size="xs" color="grey-6" />
              </template>
            </q-input>
          </div>
          
          <q-btn 
            color="blue-2" 
            text-color="primary" 
            unelevated
            no-caps
            class="add-user-btn"
            @click="openAddDialog"
          >
            <div class="row items-center">
              <q-icon name="fas fa-user-plus" size="xs" class="q-mr-sm" />
              <span class="text-weight-bold">เพิ่มผู้ใช้งาน</span>
            </div>
          </q-btn>
        </div>

        <div class="user-table-header row items-center q-px-lg q-mb-sm sticky-content">
          <div class="col-1 text-center text-weight-bold">ลำดับ</div>
          <div class="col-1 text-weight-bold">บัญชีผู้ใช้งาน</div>
          <div class="col-2 text-weight-bold">เลขบัตรประชาชน</div>
          <div class="col-2 text-weight-bold">ชื่อ-นามสกุล</div>
          <div class="col-2 text-weight-bold">ตำแหน่ง</div>
          <div class="col-1 text-weight-bold">สังกัด</div>
          <div class="col-3 text-right"></div>
        </div>
      </div>

      <!-- User List -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else class="user-list">
        <div 
          v-for="(user, index) in filteredUsers" 
          :key="user.id ?? index"
          class="user-card row items-center q-px-lg q-mb-md"
        >
          <div class="col-1 text-center user-index">{{ index + 1 }}</div>
          <div class="col-1 text-weight-medium text-grey-8">{{ user.username }}</div>
          <div class="col-2 text-grey-8 px-2">{{ user.PersonID_Onec || '-' }}</div>
          <div class="col-2 text-weight-bold text-grey-9 text-truncate">
            {{ (user.FirstName || '') + ' ' + (user.LastName || '') || user.fullname || '-' }}
          </div>
          <div class="col-2 text-grey-8">{{ user.labels && user.labels.length > 0 ? user.labels.join(', ') : 'ไม่มีตำแหน่ง' }}</div>
          <div class="col-1 text-grey-8">{{ user.affiliation || '-' }}</div>
          <div class="col-3 text-right action-btns">
            <q-btn unelevated color="primary" icon="fas fa-pencil" size="sm" class="q-mr-sm primary-action-btn" label="แก้ไข" no-caps @click="editUser(user)" />
            <q-btn unelevated color="red" icon="fas fa-trash" size="sm" class="delete-action-btn" label="ลบ" no-caps @click="confirmDelete(user)" />
          </div>
        </div>

        <div v-if="filteredUsers.length === 0" class="text-center q-pa-xl text-grey-6">
          ไม่พบข้อมูลผู้ใช้งาน
        </div>
      </div>

      <!-- Pagination -->
      <div class="row justify-center q-mt-xl">
        <q-pagination
          v-model="currentPage"
          :max="1"
          direction-links
          flat
          color="grey"
          active-color="primary"
          class="custom-pagination"
        />
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
import { useQuasar, QForm } from 'quasar';
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
const currentPage = ref(1);
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(false);

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
  { id: 'attendance', label: 'เช็คชื่อ' },
  { id: 'profile', label: 'ข้อมูลส่วนตัว' },
  { id: 'edu_history', label: 'ประวัติการศึกษา' },
  { id: 'health', label: 'ข้อมูลสุขภาพ' },
  { id: 'schedule', label: 'ตารางเรียน/สอบ' }
]);

const roleOptions = computed(() => {
  return roles.value.map(r => ({ label: r.label, value: r.name }));
});

const deleteTargetName = computed(() => {
  const u = deleteTargetUser.value;
  if (!u) return '';
  return (u.FirstName || '') + ' ' + (u.LastName || '') || u.fullname || u.username;
});

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
  if (!searchText.value) return users.value;
  const lowerSearch = searchText.value.toLowerCase();
  return users.value.filter(u => 
    u.username.toLowerCase().includes(lowerSearch) || 
    (u.fullname || '').toLowerCase().includes(lowerSearch)
  );
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
  console.log('Opening delete confirm for:', user);
  deleteTargetUser.value = user;
  showDeleteConfirm.value = true;
};

const performDelete = async () => {
  if (!deleteTargetUser.value?.id) return;
  
  const userId = deleteTargetUser.value.id;
  // loading.value = true; // Remove this to prevent full page flicker
  showDeleteConfirm.value = false;
  
  try {
    console.log(`Executing delete for ID: ${userId}`);
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
  background: #f1f5f9;
  min-height: 100vh;
  font-family: 'Prompt', 'Inter', sans-serif;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.search-input {
  width: 400px;
  :deep(.q-field__control) {
    border-radius: 15px;
    background: white;
  }
}

.add-user-btn {
  border-radius: 15px;
  height: 48px;
  padding: 0 24px;
  background: white !important;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.user-table-header {
  color: #64748b;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.user-list {
  padding-bottom: 100px;
}

.top-bar-sticky {
  position: sticky;
  top: -24px;
  background: transparent;
  z-index: 20;
  padding-top: 10px;
  margin-top: -10px;
  pointer-events: none; /* Let clicks pass through empty areas */
  
  .sticky-content {
    background: #f1f5f9;
    pointer-events: auto; /* Buttons and inputs still work */
  }
}

.user-card {
  background: white;
  height: 80px;
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  margin-bottom: 12px;
  border: 1px solid rgba(0,0,0,0.01);
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  }
}

.user-index {
  color: #94a3b8;
  font-weight: 500;
}

/* Advanced Dialog Styling */
.user-dialog-card {
  border-radius: 60px !important;
  box-shadow: 0 30px 60px rgba(0,0,0,0.12);
  background: #fff;
}

.photo-upload-section {
  background: #f1f5f9;
  border-radius: 40px;
  height: 450px; /* Even taller for a prominent profile look */
  width: 100%;
  max-width: 380px; /* Wider to match the balance of the form fields */
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
    .q-icon { color: var(--q-primary); }
    .text-blue-grey-3 { color: var(--q-primary); }
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
    
    &:before, &:after { display: none; }
    
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
      &:hover { background: rgba(0,0,0,0.02); }
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

.primary-action-btn { border-radius: 10px; }
.delete-action-btn { border-radius: 10px; }

.custom-pagination {
  :deep(.q-btn) {
    border-radius: 12px;
    background: white;
  }
}
</style>
