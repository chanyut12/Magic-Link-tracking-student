<template>
  <q-dialog v-model="dialogModel" persistent full-width class="advanced-dialog">
    <q-card class="user-dialog-card">
      <q-card-section class="row items-center q-pa-lg">
        <div class="text-h5 text-weight-bold full-width text-center relative-position">
          {{ isEdit ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่' }}
          <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
        </div>
      </q-card-section>

      <q-form ref="userFormRef" class="col column no-wrap overflow-hidden" @submit.prevent="saveUser">
        <q-card-section class="col scroll q-pa-lg">
          <div class="row q-col-gutter-xl">
            <div class="col-12 col-md-5">
              <div class="photo-upload-section column items-center justify-center">
                <div class="photo-placeholder column items-center justify-center">
                  <q-icon name="fas fa-camera" size="80px" color="blue-grey-3" />
                  <div class="text-h6 text-weight-bold text-blue-grey-3 q-mt-md">เพิ่มรูปภาพ</div>
                  <div class="text-caption text-blue-grey-2">ขนาดที่แนะนำ 4:5</div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-7">
              <div class="text-h6 text-weight-bold q-mb-lg underline-title">ข้อมูลทั่วไปของผู้ใช้งาน</div>

              <div class="row q-col-gutter-md">
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
                    :rules="[val => !val || /^[0-9]{10}$/.test(val) || 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก']"
                    hide-bottom-space
                  />
                </div>

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

                <div class="col-12 col-md-6">
                  <div class="text-weight-bold q-mb-xs">สถานะ/ตำแหน่ง</div>
                  <q-select
                    v-model="selectedRole"
                    :options="roleOptions"
                    outlined
                    dense
                    bg-color="white"
                    emit-value
                    map-options
                    placeholder="เลือกตำแหน่ง"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <div class="text-weight-bold q-mb-xs">สังกัด</div>
                  <q-input
                    v-model="userForm.affiliation"
                    outlined
                    dense
                    placeholder="กรอกสังกัด"
                    bg-color="white"
                    class="custom-input"
                  />
                </div>
              </div>
            </div>
          </div>

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
              <q-tab name="scope" label="ขอบเขตข้อมูล (Data Scope)" class="tab-item" />
            </q-tabs>

            <q-tab-panels v-model="activeTab" animated class="permission-panels q-mt-md">
              <q-tab-panel name="menu" class="q-pa-none">
                <div class="permission-insight-panel q-mb-md">
                  <div class="permission-insight-copy">
                    <div class="text-weight-bold text-grey-9">
                      ค่าเริ่มต้นของบทบาท: {{ selectedRoleMeta?.label || 'ยังไม่ได้เลือกบทบาท' }}
                    </div>
                    <div class="text-caption text-blue-grey-7">
                      สีของขอบจะช่วยบอกว่าเมนูนี้เป็น default ของ role, ถูกเพิ่มเกินค่าเริ่มต้น, หรือถูกปิดจากค่าเริ่มต้น
                    </div>
                  </div>
                  <div class="permission-legend">
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
                </div>

                <div class="permission-list q-gutter-y-sm">
                  <div v-for="menu in menuList" :key="menu.id" class="menu-permission-item">
                    <div
                      class="row items-center q-pa-sm bg-grey-2 rounded-card cursor-pointer permission-menu-row"
                      :class="[
                        { 'permission-locked': isMenuLocked(menu) },
                        !menu.children ? `permission-state-card--${getPermissionVisualState(menu.id)}` : '',
                      ]"
                      @click="toggleMenuPermission(menu)"
                    >
                      <q-checkbox
                        :model-value="getMenuSelectionState(menu)"
                        dense
                        class="q-mr-md"
                        style="pointer-events: none"
                      />
                      <span class="text-weight-medium">{{ menu.label }}</span>
                      <q-space />
                      <div v-if="menu.children" class="permission-menu-summary q-mr-sm">
                        <span
                          v-if="getMenuPermissionSummary(menu).defaultCount"
                          class="permission-mini-pill permission-mini-pill--default"
                        >
                          ค่าเริ่มต้น {{ getMenuPermissionSummary(menu).defaultCount }}
                        </span>
                        <span
                          v-if="getMenuPermissionSummary(menu).addedCount"
                          class="permission-mini-pill permission-mini-pill--added"
                        >
                          เพิ่ม {{ getMenuPermissionSummary(menu).addedCount }}
                        </span>
                        <span
                          v-if="getMenuPermissionSummary(menu).removedCount"
                          class="permission-mini-pill permission-mini-pill--removed"
                        >
                          ปิด {{ getMenuPermissionSummary(menu).removedCount }}
                        </span>
                        <span
                          v-if="getMenuPermissionSummary(menu).lockedCount"
                          class="permission-mini-pill permission-mini-pill--locked"
                        >
                          ล็อก {{ getMenuPermissionSummary(menu).lockedCount }}
                        </span>
                      </div>
                      <span
                        v-else-if="getPermissionVisualState(menu.id) !== 'neutral'"
                        class="permission-state-badge q-mr-sm"
                        :class="`permission-state-badge--${getPermissionVisualState(menu.id)}`"
                      >
                        {{ getPermissionVisualMeta(menu.id).shortLabel }}
                      </span>
                      <q-icon
                        v-if="isPermissionLocked(menu.id)"
                        name="lock"
                        size="16px"
                        color="blue-grey-5"
                        class="q-mr-sm"
                      />
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
                        class="row items-center q-pa-sm bg-grey-2 rounded-card cursor-pointer permission-state-card"
                        :class="[
                          `permission-state-card--${getPermissionVisualState(child.id)}`,
                          { 'permission-locked': isPermissionLocked(child.id) },
                        ]"
                        @click="togglePermission(child.id)"
                      >
                        <q-checkbox
                          :model-value="effectivePermissions.includes(child.id)"
                          dense
                          class="q-mr-md"
                          style="pointer-events: none"
                        />
                        <span>{{ child.label }}</span>
                        <q-space />
                        <span
                          v-if="getPermissionVisualState(child.id) !== 'neutral'"
                          class="permission-state-badge q-mr-sm"
                          :class="`permission-state-badge--${getPermissionVisualState(child.id)}`"
                        >
                          {{ getPermissionVisualMeta(child.id).shortLabel }}
                        </span>
                        <q-icon
                          v-if="isPermissionLocked(child.id)"
                          name="lock"
                          size="16px"
                          color="blue-grey-5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="scope" class="q-pa-md">
                <div class="scope-mode-banner q-mb-md">
                  <div class="row items-center justify-between q-col-gutter-md">
                    <div class="col">
                      <div class="text-weight-bold">
                        {{ roleScopePreset.mode === 'flexible' ? 'ดูข้อมูลทุกจังหวัด' : 'ขอบเขตข้อมูลตามบทบาท' }}
                      </div>
                      <div class="text-caption text-blue-grey-7">
                        {{ roleScopePreset.hint }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-toggle
                        v-model="scopeForm.allProvinces"
                        color="primary"
                        checked-icon="public"
                        unchecked-icon="place"
                        :disable="isNationwideToggleDisabled"
                        @update:model-value="onAllProvincesToggle"
                      />
                    </div>
                  </div>
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <div class="text-weight-bold q-mb-xs">จังหวัด</div>
                    <q-select
                      v-model="scopeForm.province"
                      :options="availableProvinceOptions"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="เลือกจังหวัด"
                      :disable="scopeForm.allProvinces || isScopeFieldLocked('province')"
                      @update:model-value="onScopeProvinceChange"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <div class="text-weight-bold q-mb-xs">อำเภอ</div>
                    <q-select
                      v-model="scopeForm.district"
                      :options="availableDistrictOptions"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="เลือกอำเภอ"
                      :disable="scopeForm.allProvinces || !scopeForm.province || isScopeFieldLocked('district')"
                      @update:model-value="onScopeDistrictChange"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <div class="text-weight-bold q-mb-xs">ตำบล</div>
                    <q-select
                      v-model="scopeForm.sub_district"
                      :options="availableSubDistrictOptions"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="เลือกตำบล"
                      :disable="scopeForm.allProvinces || !scopeForm.district || isScopeFieldLocked('sub_district')"
                    />
                  </div>

                  <div class="col-12">
                    <div class="text-weight-bold q-mb-xs">สถานศึกษา/โรงเรียน</div>
                    <q-select
                      v-model="scopeForm.school_id"
                      :options="filteredSchools"
                      outlined
                      dense
                      bg-color="white"
                      emit-value
                      map-options
                      use-input
                      input-debounce="300"
                      label="เลือกโรงเรียน"
                      :disable="scopeForm.allProvinces || isScopeFieldLocked('school_id')"
                      @update:model-value="onScopeSchoolChange"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">ระดับสายชั้น</div>
                    <q-select
                      v-model="scopeForm.grade_level"
                      :options="availableGradeOptions"
                      outlined
                      dense
                      bg-color="white"
                      emit-value
                      map-options
                      placeholder="เลือกระดับชั้น"
                      :disable="isScopeFieldLocked('grade_level')"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-bold q-mb-xs">ห้องเรียน</div>
                    <q-select
                      v-model="scopeForm.room"
                      :options="availableRoomOptions"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="เลือกห้อง"
                      :disable="isScopeFieldLocked('room') || !scopeForm.grade_level || !scopeForm.school_id"
                    />
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-xl bg-white dialog-footer">
          <q-btn
            color="primary"
            class="save-all-btn"
            no-caps
            size="lg"
            type="submit"
            :loading="saving"
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
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { getEffectivePermissions } from '../../constants/permissions';
import { useUserScopeForm } from '../../composables/useUserScopeForm';
import { useUserStore, getStoredUser } from '../../composables/useUserStore';
import { userService } from '../../services/userService';
import type { AxiosError } from 'axios';
import type { ManagedUser, UserFormModel, UserSavePayload } from '../../types/user';
import type { RoleDefinition } from '../../types/role';
import { createTaskScopeFormModel } from '../../utils/taskForm';
import type { QForm } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  user: ManagedUser | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { user: currentUser, refreshUserProfile } = useUserStore();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const roles = ref<RoleDefinition[]>([]);
const saving = ref(false);
const activeTab = ref('menu');
const selectedRole = ref<string | null>(null);
const customPermissions = ref<string[]>([]);
const userFormRef = ref<QForm | null>(null);
const scopeForm = ref(createTaskScopeFormModel());
const userForm = ref<UserFormModel>({
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
  status: 'ACTIVE',
  role: null,
  data_scope: {},
});

const isEdit = computed(() => Boolean(props.user?.id));
const editingUserId = computed(() => userForm.value.id);

const {
  permissionLegendItems,
  menuList,
  roleOptions,
  selectedRoleMeta,
  roleScopePreset,
  scopeFieldLabels,
  availableProvinceOptions,
  availableDistrictOptions,
  availableSubDistrictOptions,
  filteredSchools,
  availableGradeOptions,
  availableRoomOptions,
  isNationwideToggleDisabled,
  ensureScopeOptionsLoaded,
  resetScopeForm,
  onAllProvincesToggle,
  onScopeProvinceChange,
  onScopeDistrictChange,
  onScopeSchoolChange,
  isScopeFieldLocked,
  effectivePermissions,
  isPermissionLocked,
  getPermissionVisualState,
  getPermissionVisualMeta,
  getMenuSelectionState,
  isMenuLocked,
  getMenuPermissionSummary,
  togglePermission,
  toggleMenuPermission,
  initializeForEdit,
  buildDataScope,
  resetPermissionMenuState,
} = useUserScopeForm({
  roles,
  selectedRole,
  customPermissions,
  scopeForm,
  isEdit,
  editingUserId,
});

function createEmptyUserForm(): UserFormModel {
  return {
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
    status: 'ACTIVE',
    role: null,
    data_scope: {},
  };
}

async function ensureDialogOptionsLoaded(): Promise<void> {
  await ensureScopeOptionsLoaded();
  if (roles.value.length === 0) {
    roles.value = await userService.getRolesCatalog();
  }
}

function resetForm(): void {
  selectedRole.value = null;
  customPermissions.value = [];
  resetPermissionMenuState();
  userForm.value = createEmptyUserForm();
  resetScopeForm();
  activeTab.value = 'menu';
}

async function initializeDialog(): Promise<void> {
  resetForm();
  await ensureDialogOptionsLoaded();

  if (!props.user) {
    return;
  }

  userForm.value = {
    id: props.user.id,
    username: props.user.username,
    FirstName: props.user.FirstName || '',
    LastName: props.user.LastName || '',
    PersonID_Onec: props.user.PersonID_Onec || '',
    phone: props.user.phone || '',
    email: props.user.email || '',
    affiliation: props.user.affiliation || '',
    role: props.user.role || props.user.roles?.[0] || null,
    roles: props.user.role || props.user.roles?.[0] ? [props.user.role || props.user.roles?.[0] || ''] : [],
    labels: [...(props.user.labels || [])],
    permissions: [...(props.user.permissions || [])],
    status: props.user.status || 'ACTIVE',
    password: '',
    data_scope: props.user.data_scope || {},
  };

  selectedRole.value = props.user.role || props.user.roles?.[0] || null;
  await nextTick();
  await initializeForEdit(props.user.data_scope, [...(props.user.permissions || [])]);
}

function closeDialog(): void {
  dialogModel.value = false;
}

watch(() => props.modelValue, (open) => {
  if (open) {
    void initializeDialog();
  }
});

watch(() => props.user, (nextUser) => {
  if (props.modelValue && nextUser) {
    void initializeDialog();
  }
});

async function saveUser(): Promise<void> {
  const missingFields: string[] = [];

  if (!userForm.value.FirstName) missingFields.push('ชื่อ');
  if (!userForm.value.LastName) missingFields.push('นามสกุล');
  if (!userForm.value.username) missingFields.push('บัญชีผู้ใช้งาน');
  if (!isEdit.value && !userForm.value.password) missingFields.push('รหัสผ่าน');
  if (!userForm.value.PersonID_Onec || userForm.value.PersonID_Onec.length !== 13) missingFields.push('เลขบัตรประชาชน (13 หลัก)');
  if (!userForm.value.phone || userForm.value.phone.length !== 10) missingFields.push('เบอร์โทรศัพท์ (10 หลัก)');
  if (!userForm.value.email || !/.+@.+\..+/.test(userForm.value.email)) missingFields.push('อีเมล (รูปแบบถูกต้อง)');
  if (!selectedRole.value) missingFields.push('ตำแหน่ง');
  if (effectivePermissions.value.length === 0) missingFields.push('สิทธิ์เมนูอย่างน้อย 1 รายการ');
  if (!userForm.value.affiliation) missingFields.push('สังกัด');

  roleScopePreset.value.requiredFields.forEach((field) => {
    if (!scopeForm.value[field]) {
      missingFields.push(scopeFieldLabels[field]);
    }
  });

  if (missingFields.length > 0) {
    $q.notify({
      color: 'negative',
      icon: 'warning',
      message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`,
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  const isValid = await userFormRef.value?.validate();
  if (!isValid) {
    return;
  }

  const payload: UserSavePayload = {
    ...userForm.value,
    role: selectedRole.value,
    roles: selectedRole.value ? [selectedRole.value] : [],
    permissions: [...effectivePermissions.value],
    data_scope: buildDataScope(),
  };

  const editedUserId = payload.id;
  const isEditingCurrentUser = Boolean(isEdit.value && editedUserId && currentUser.value?.id === editedUserId);

  saving.value = true;
  try {
    if (isEdit.value && payload.id) {
      await userService.updateUser(payload.id, payload);
      $q.notify({ color: 'positive', message: 'แก้ไขข้อมูลสำเร็จ', position: 'top' });
    } else {
      await userService.createUser(payload);
      $q.notify({ color: 'positive', message: 'เพิ่มผู้ใช้งานสำเร็จ', position: 'top' });
    }

    if (isEditingCurrentUser) {
      await refreshUserProfile();
    }

    closeDialog();
    emit('saved');

    if (isEditingCurrentUser) {
      const refreshedUser = getStoredUser();
      const requiredPermission = route.meta.permission as string | undefined;
      const refreshedPermissions = getEffectivePermissions(
        refreshedUser?.roles || [],
        refreshedUser?.permissions || [],
      );

      if (route.meta.requiresAuth && requiredPermission && !refreshedPermissions.includes(requiredPermission)) {
        await router.replace('/forbidden');
      }
    }
  } catch (error: unknown) {
    const nextError = error as AxiosError<{ message?: string }>;
    $q.notify({
      color: 'negative',
      message: nextError.response?.data?.message || 'เกิดข้อผิดพลาด',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.user-dialog-card {
  height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
}

.dialog-footer {
  z-index: 10;
  border-top: 1px solid #f1f5f9;
}

.photo-upload-section {
  min-height: 100%;
}

.photo-placeholder {
  min-height: 320px;
  border: 2px dashed #cbd5e1;
  border-radius: 24px;
  background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
}

.underline-title {
  position: relative;
  padding-bottom: 0.5rem;
}

.underline-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 72px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.custom-input :deep(.q-field__control) {
  border-radius: 14px;
}

.permission-tabs {
  border-bottom: 1px solid #e2e8f0;
}

.tab-item {
  font-weight: 700;
}

.permission-insight-panel,
.scope-mode-banner {
  padding: 1rem 1.1rem;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
}

.permission-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 1rem;
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
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 4px;
  background: #64748b;
}

.permission-legend-item--default .permission-legend-swatch,
.permission-state-badge--default,
.permission-mini-pill--default,
.permission-state-card--default {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.permission-legend-item--added .permission-legend-swatch,
.permission-state-badge--added,
.permission-mini-pill--added,
.permission-state-card--added {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.permission-legend-item--removed .permission-legend-swatch,
.permission-state-badge--removed,
.permission-mini-pill--removed,
.permission-state-card--removed {
  background: #ffedd5;
  border-color: #fdba74;
  color: #c2410c;
}

.permission-legend-item--locked .permission-legend-swatch,
.permission-state-badge--locked,
.permission-mini-pill--locked,
.permission-state-card--locked {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #475569;
}

.permission-list {
  display: flex;
  flex-direction: column;
}

.rounded-card,
.permission-state-card,
.permission-menu-row {
  border-radius: 14px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.permission-state-card,
.permission-menu-row {
  background: #f8fafc;
}

.permission-locked {
  opacity: 0.72;
}

.permission-state-badge,
.permission-mini-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
}

.permission-menu-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.save-all-btn {
  min-width: 220px;
  border-radius: 18px;
}

@media (max-width: 768px) {
  .permission-legend {
    grid-template-columns: 1fr;
  }
}
</style>
