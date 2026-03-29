<template>
  <q-page class="q-pa-lg">
    <div style="max-width: 800px; margin: 0 auto;">
      
      <!-- Back Button & Title -->
      <div class="row items-center justify-between q-mb-xl">
        <div>
          <h1 class="text-h4 text-weight-bolder text-gray-900 q-mb-xs">{{ pageTitle }}</h1>
          <div class="text-gray-500 font-weight-bold">เลือกประเภทและกรอกข้อมูลให้ครบถ้วน</div>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator q-mb-xl" v-if="!showResult">
        <div 
          class="step" 
          :class="{ active: currentStep === 1, 'cursor-pointer': currentStep > 1 }"
          @click="currentStep > 1 ? currentStep = 1 : null"
        >
          <span class="step-num">1</span> เลือกประเภท
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <span class="step-num">2</span> กรอกรายละเอียด
        </div>
      </div>

      <!-- Step 1: Type Selection -->
      <div v-if="currentStep === 1" class="type-selection">
        <div class="type-card" @click="selectType('VISIT')">
          <span class="type-icon">📍</span>
          <div class="type-title">ภารกิจลงพื้นที่</div>
          <div class="type-desc">สำหรับการส่งตัวแทนไปเยี่ยมบ้านนักเรียนที่ถูกระบุตัวเพื่อติดตามผล</div>
        </div>
        <div class="type-card" @click="selectType('ATTENDANCE')">
          <span class="type-icon">📋</span>
          <div class="type-title">ภารกิจเช็คชื่อ</div>
          <div class="type-desc">สำหรับการมอบหมายงานเช็คชื่อนักเรียนรายห้องให้กับครูประจำชั้นหรือตัวแทน</div>
        </div>
        <div class="type-card" @click="selectType('LOGIN')">
          <span class="type-icon">🔑</span>
          <div class="type-title">ลิงก์เข้าสู่ระบบ</div>
          <div class="type-desc">สำหรับให้ผู้ใช้งานเข้าสู่ระบบอัตโนมัติผ่านลิงก์โดยไม่ต้องใช้รหัสผ่าน</div>
        </div>
      </div>

      <!-- Step 2: Forms -->
      <div v-if="currentStep === 2 && !showResult">
        
        <!-- Visit Form -->
        <div v-if="formData.type === 'VISIT'" class="card q-mb-md">
          <div v-if="formData.existing_case_id" class="linked-case-banner q-mb-md">
            <i class="fa-solid fa-link q-mr-xs"></i>
            เชื่อมกับเคส #{{ formData.existing_case_id }} — สถานะจะเปลี่ยนเป็น <strong>กำลังติดตาม</strong> หลังสร้างลิงค์
          </div>
          <div class="card-title">ข้อมูลนักเรียน (ลงพื้นที่)</div>
          <div class="form-group">
            <label>ชื่อ-สกุล นักเรียน *</label>
            <input type="text" v-model="formData.student_name" placeholder="เช่น ด.ช. สมชาย ดีใจ">
          </div>
          <div class="form-group">
            <label>โรงเรียน</label>
            <input type="text" v-model="formData.student_school" placeholder="เช่น โรงเรียนบ้านหนองไผ่">
          </div>
          <div class="form-group">
            <label>ที่อยู่บ้านนักเรียน (ละเอียด) *</label>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <input type="text" v-model="formData.student_address_house_no" placeholder="บ้านเลขที่">
              </div>
              <div class="col-12 col-sm-4">
                <input type="text" v-model="formData.student_address_moo" placeholder="หมู่">
              </div>
              <div class="col-12 col-sm-4">
                <input type="text" v-model="formData.student_address_village" placeholder="หมู่บ้าน/อาคาร (ถ้ามี)">
              </div>
            </div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-sm-6">
                <input type="text" v-model="formData.student_address_soi" placeholder="ซอย">
              </div>
              <div class="col-12 col-sm-6">
                <input type="text" v-model="formData.student_address_road" placeholder="ถนน">
              </div>
            </div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-sm-3">
                <input type="text" v-model="formData.student_address_subdistrict" placeholder="ตำบล/แขวง">
              </div>
              <div class="col-12 col-sm-3">
                <input type="text" v-model="formData.student_address_district" placeholder="อำเภอ/เขต">
              </div>
              <div class="col-12 col-sm-3">
                <input type="text" v-model="formData.student_address_province" placeholder="จังหวัด">
              </div>
              <div class="col-12 col-sm-3">
                <input
                  type="text"
                  v-model="formData.student_address_postal_code"
                  placeholder="รหัสไปรษณีย์"
                  inputmode="numeric"
                  maxlength="5"
                >
              </div>
            </div>
            <div class="q-mt-sm">
              <input type="text" v-model="formData.student_address_note" placeholder="รายละเอียดเพิ่มเติม/จุดสังเกต (ถ้ามี)">
            </div>
            <div v-if="formattedStudentAddress" class="address-preview q-mt-sm">
              <span class="text-weight-bold">ที่อยู่ที่จะบันทึก:</span> {{ formattedStudentAddress }}
            </div>
            <div v-else-if="formData.student_address" class="address-preview q-mt-sm">
              <span class="text-weight-bold">ที่อยู่จากเคสเดิม:</span> {{ formData.student_address }}
            </div>
          </div>
          <div class="form-group">
            <label>สาเหตุที่ถูก Flag</label>
            <input type="text" v-model="formData.reason_flagged" placeholder="เช่น ขาดเรียนติดต่อกัน 5 วัน">
          </div>

          <div class="form-group">
            <label>พิกัดบ้านนักเรียน (Google Maps)</label>
            <div class="coord-grid">
              <input type="number" step="any" v-model.number="formData.student_lat" placeholder="Latitude">
              <input type="number" step="any" v-model.number="formData.student_lng" placeholder="Longitude">
            </div>
            <div class="coord-actions">
              <q-btn
                flat
                color="primary"
                icon="my_location"
                label="ใช้พิกัดตำแหน่งปัจจุบัน"
                no-caps
                @click="useCurrentLocation"
              />
              <q-btn
                flat
                color="grey-7"
                icon="open_in_new"
                label="เลือกตำแหน่งบน Google Maps"
                no-caps
                :href="getMapsPickerUrl()"
                target="_blank"
              />
            </div>
            <div class="q-mt-sm">
              <div class="map-picker-help">
                เลือกตำแหน่งใน Google Maps แล้วคัดลอกลิงก์มาวางด้านล่าง ระบบจะดึงพิกัดให้อัตโนมัติ
              </div>
              <div class="coord-grid map-picker-grid q-mt-xs">
                <input
                  type="text"
                  v-model.trim="mapPickerInput"
                  placeholder="วางลิงก์ Google Maps หรือพิกัด เช่น 13.7563,100.5018"
                >
                <q-btn
                  color="secondary"
                  icon="place"
                  label="ดึงพิกัดจากลิงก์"
                  no-caps
                  @click="applyCoordinatesFromMapInput"
                />
              </div>
            </div>
            <div v-if="hasValidCoordinates" class="map-preview-wrap q-mt-sm">
              <iframe
                class="map-preview"
                :src="getEmbedMapUrl()"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <!-- Attendance Form -->
        <div v-if="formData.type === 'ATTENDANCE'" class="card q-mb-md">
          <div class="card-title">ข้อมูลชั้นเรียน & สถานศึกษา</div>
          
          <div class="q-gutter-y-md q-mb-md">
            <!-- Province -->
            <div class="form-group">
              <label>จังหวัด *</label>
              <select v-model="tempFilters.province" @change="onProvinceChange">
                <option value="">-- เลือกจังหวัด --</option>
                <option v-for="p in locationData.provinces" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <!-- District -->
            <div class="form-group">
              <label>อำเภอ *</label>
              <select v-model="tempFilters.district" @change="onDistrictChange" :disabled="!tempFilters.province">
                <option value="">-- เลือกอำเภอ --</option>
                <option v-for="d in filteredDistricts" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <!-- Sub-district -->
            <div class="form-group">
              <label>ตำบล *</label>
              <select v-model="tempFilters.subDistrict" @change="onSubDistrictChange" :disabled="!tempFilters.district">
                <option value="">-- เลือกตำบล --</option>
                <option v-for="sd in filteredSubDistricts" :key="sd" :value="sd">{{ sd }}</option>
              </select>
            </div>

            <!-- School -->
            <div class="form-group">
              <label>โรงเรียน *</label>
              <select v-model="formData.target_school_id" :disabled="!tempFilters.subDistrict">
                <option value="">-- เลือกโรงเรียน --</option>
                <option v-for="s in tempSchools" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>ระดับชั้น *</label>
                <select v-model="formData.target_grade" style="width: 100% !important; height: 48px; display: block;">
                  <option value="">-- เลือกชั้น --</option>
                  <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.label">{{ gl.label }}</option>
                </select>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>ห้อง *</label>
                <select v-model="formData.target_room" style="width: 100% !important; height: 48px; display: block;">
                  <option value="">-- เลือกห้อง --</option>
                  <option v-for="r in ['1', '2', '3', '4', '5', '6']" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-group q-mt-md">
            <label>วิชา *</label>
            <select v-model="formData.target_subject">
              <option value="">-- เลือกวิชา --</option>
              <option v-for="s in ['คณิตศาสตร์พื้นฐาน', 'ภาษาไทย', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'สังคมศึกษา', 'พละศึกษา', 'ศิลปะ', 'การงานอาชีพ']" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Login Form -->
        <div v-if="formData.type === 'LOGIN'" class="card q-mb-md">
          <div class="card-title">ตั้งค่าสิทธิ์การเข้าใช้งานผ่านลิงก์</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>ชื่อผู้ใช้งานลิงก์ *</label>
                <input type="text" v-model="formData.assigned_to_name" placeholder="เช่น อาจารย์สมเกียรติ">
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>อีเมลสำหรับ OTP / Login *</label>
                <input type="email" v-model="formData.assigned_to_email" placeholder="เช่น teacher_temp@school.ac.th">
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>บทบาท (Role) *</label>
                <select v-model="formData.role" style="width: 100% !important; height: 48px;">
                  <option value="">-- เลือกบทบาท --</option>
                  <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>อายุลิงก์</label>
                <div class="expiry-row">
                  <input type="number" v-model="formData.expires_value" min="1" max="90">
                  <select v-model="formData.expires_unit">
                    <option value="hours">ชั่วโมง</option>
                    <option value="days">วัน</option>
                    <option value="weeks">สัปดาห์</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="row items-start justify-between q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md">
                <label class="q-mb-xs">สิทธิ์การใช้งาน</label>
                <div class="permission-help-text">
                  ค่าเริ่มต้นของ {{ selectedRoleMeta?.label || formData.role || 'role ที่เลือก' }} จะขึ้นเป็นสีน้ำเงิน ส่วนสิทธิ์ที่เพิ่มหรือปิดจาก default จะมีสีแยกให้เห็นทันที
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
                  :model-value="formData.permissions.includes(opt.value)"
                  :disable="isPermissionLocked(opt.value)"
                  dense
                  size="sm"
                  class="permission-item__checkbox"
                  @update:model-value="togglePermission(opt.value, $event)"
                />
                <span class="permission-item__label">{{ opt.label }}</span>
                <span
                  v-if="shouldShowPermissionBadge(opt.value)"
                  class="permission-state-badge"
                  :class="`permission-state-badge--${getPermissionVisualState(opt.value)}`"
                >
                  {{ getPermissionBadgeLabel(opt.value) }}
                </span>
              </label>
            </div>
            <div class="q-mt-xs row q-gutter-xs">
              <q-chip
                v-for="permissionId in formData.permissions"
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

          <div class="form-group">
            <div class="row items-center justify-between q-mb-sm">
              <div>
                <label class="q-mb-xs">Data Scope</label>
                <div class="permission-help-text">{{ roleScopePreset.hint }}</div>
              </div>
              <q-toggle
                v-model="scopeForm.allProvinces"
                :disable="isNationwideToggleDisabled"
                label="ดูข้อมูลทุกจังหวัด"
                size="sm"
                class="scope-toggle-inline"
                @update:model-value="onAllProvincesToggle"
              />
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <select
                  v-model="scopeForm.province"
                  :disabled="scopeForm.allProvinces || isScopeFieldLocked('province')"
                  @change="onLoginScopeProvinceChange"
                >
                  <option :value="null">-- เลือกจังหวัด --</option>
                  <option v-for="province in availableProvinceOptions" :key="province" :value="province">{{ province }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <select
                  v-model="scopeForm.district"
                  :disabled="scopeForm.allProvinces || !scopeForm.province || isScopeFieldLocked('district')"
                  @change="onLoginScopeDistrictChange"
                >
                  <option :value="null">-- เลือกอำเภอ --</option>
                  <option v-for="district in availableDistrictOptions" :key="district" :value="district">{{ district }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <select
                  v-model="scopeForm.sub_district"
                  :disabled="scopeForm.allProvinces || !scopeForm.district || isScopeFieldLocked('sub_district')"
                  @change="onLoginScopeSubDistrictChange"
                >
                  <option :value="null">-- เลือกตำบล --</option>
                  <option v-for="subDistrict in availableSubDistrictOptions" :key="subDistrict" :value="subDistrict">{{ subDistrict }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <select
                  v-model.number="scopeForm.school_id"
                  :disabled="scopeForm.allProvinces || isScopeFieldLocked('school_id')"
                  @change="onLoginScopeSchoolChange"
                >
                  <option :value="null">-- เลือกโรงเรียน --</option>
                  <option v-for="school in filteredSchools" :key="school.value" :value="school.value">{{ school.label }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <select
                  v-model.number="scopeForm.grade_level"
                  :disabled="isScopeFieldLocked('grade_level')"
                >
                  <option :value="null">-- เลือกระดับชั้น --</option>
                  <option v-for="grade in availableGradeOptions" :key="grade.id" :value="grade.id">{{ grade.label }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <select
                  v-model="scopeForm.room"
                  :disabled="isScopeFieldLocked('room') || !scopeForm.grade_level || !scopeForm.school_id"
                >
                  <option :value="null">-- เลือกห้อง --</option>
                  <option v-for="room in availableRoomOptions" :key="room" :value="room">{{ room }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignee Info -->
        <div v-if="formData.type !== 'LOGIN'" class="card q-mb-lg">
          <div class="card-title">ผู้รับภารกิจ</div>
          <div class="form-group">
            <label>ชื่อผู้รับงาน *</label>
            <input type="text" v-model="formData.assigned_to_name" placeholder="เช่น อาจารย์สมเกียรติ">
          </div>
          <div class="form-group">
            <label>อีเมลผู้รับงาน (สำหรับรับรหัส OTP) *</label>
            <input type="email" v-model="formData.assigned_to_email" placeholder="เช่น teacher@school.ac.th">
          </div>
          <div class="form-group">
            <label>อายุลิงก์</label>
            <div class="expiry-row">
              <input type="number" v-model="formData.expires_value" min="1" max="90">
              <select v-model="formData.expires_unit">
                <option value="hours">ชั่วโมง</option>
                <option value="days">วัน</option>
                <option value="weeks">สัปดาห์</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="row q-col-gutter-md task-form-actions">
          <div class="col-4">
            <q-btn flat color="grey-7" label="ย้อนกลับ" class="full-width task-form-actions__btn" @click="currentStep = 1" no-caps />
          </div>
          <div class="col-8">
            <q-btn color="primary" :label="submitButtonLabel" class="full-width task-form-actions__btn" unelevated padding="12px" :loading="loading" @click="submitForm" />
          </div>
        </div>
      </div>

      <!-- Result Section -->
      <div v-if="showResult" class="result-section">
        <div class="card q-pa-xl text-center">
          <div class="alert alert-success q-mb-lg">สร้างภารกิจสำเร็จ!</div>
          
          <div class="text-subtitle1 text-weight-bold text-gray-700 q-mb-sm">Magic Link</div>
          <div class="magic-link-box q-mb-md">{{ resultLink }}</div>
          
          <q-btn outline color="primary" label="📋 คัดลอกลิงก์" class="full-width q-mb-md" @click="copyLink" />
          
          <q-btn 
            unelevated 
            style="background: #06C755; color: white;" 
            label="💬 ส่งลิงก์ผ่าน LINE" 
            class="full-width" 
            :href="getLineUrl(resultLink)"
            target="_blank"
          />
        </div>

        <div class="card q-pa-xl text-center">
          <div class="text-subtitle1 text-weight-bold text-gray-700 q-mb-md">QR Code</div>
          <img :src="qrCodeUrl" alt="QR Code" style="max-width: 200px; margin: 0 auto; display: block;" />
          <p class="text-caption text-gray-500 q-mt-md">สแกนเพื่อเข้าถึงภารกิจ</p>
        </div>

        <q-btn flat color="grey-7" label="กลับหน้าหลัก" class="full-width q-mt-lg" to="/" />
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import { useAttendanceFilters } from '../composables/useAttendanceFilters';
import { useLoginTaskForm } from '../composables/useLoginTaskForm';
import { useTaskFormFlow } from '../composables/useTaskFormFlow';
import { taskService } from '../services/taskService';
import { copyText } from '../utils/clipboard';
import { buildTaskCreatePayload, createTaskFormModel, createTaskScopeFormModel } from '../utils/taskForm';
import { buildTaskLineShareUrl } from '../utils/taskPresentation';

const $q = useQuasar();
const route = useRoute();
const currentStep = ref(1);
const mapPickerInput = ref('');
const formData = reactive(createTaskFormModel());
const {
  submitting: loading,
  showResult,
  resultLink,
  qrCodeUrl,
  submitTask,
} = useTaskFormFlow();
const {
  gradeLevels,
  tempSchools,
  tempFilters,
  locationData,
  filteredDistricts,
  filteredSubDistricts,
  loadLocations,
  loadGradeLevels,
  handleProvinceFilterChange,
  handleDistrictFilterChange,
  handleSubDistrictFilterChange,
} = useAttendanceFilters();
const scopeForm = reactive(createTaskScopeFormModel());
const {
  permissionOptions,
  permissionLegendItems,
  permissionLabelMap,
  selectedRoleMeta,
  roleScopePreset,
  roleOptions,
  scopeFieldLabels,
  availableProvinceOptions,
  availableDistrictOptions,
  availableSubDistrictOptions,
  filteredSchools,
  availableGradeLevels: availableGradeOptions,
  availableRoomOptions,
  isNationwideToggleDisabled,
  initializeForm: initializeLoginTaskForm,
  buildDataScope,
  handleAllProvincesToggle: onAllProvincesToggle,
  handleProvinceChange: onLoginScopeProvinceChange,
  handleDistrictChange: onLoginScopeDistrictChange,
  handleSubDistrictChange: onLoginScopeSubDistrictChange,
  handleSchoolChange: onLoginScopeSchoolChange,
  isPermissionLocked,
  isScopeFieldLocked,
  getPermissionVisualState,
  getPermissionVisualMeta,
  togglePermission,
  removePermission,
} = useLoginTaskForm({
  form: formData,
  scopeForm,
  enabled: computed(() => formData.type === 'LOGIN'),
});
const submitButtonLabel = computed(() => (
  formData.type === 'LOGIN' ? 'สร้างลิงก์เข้าสู่ระบบ' : 'สร้างภารกิจ'
));

const fetchLocations = async () => {
  try {
    await loadLocations();
  } catch (err) {
    console.error('Fetch locations error:', err);
  }
};

const onProvinceChange = () => {
  handleProvinceFilterChange({ clearTempSchools: true });
  formData.target_school_id = '';
};

const onDistrictChange = () => {
  handleDistrictFilterChange({ clearTempSchools: true });
  formData.target_school_id = '';
};

const onSubDistrictChange = async () => {
  formData.target_school_id = '';
  try {
    await handleSubDistrictFilterChange({ clearTempSchoolsWhenEmpty: true });
  } catch (err) {
    console.error('Fetch temp schools error:', err);
  }
};

const fetchGradeLevels = async () => {
  try {
    await loadGradeLevels();
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const getQueryText = (value: unknown) => {
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === 'string' ? first : '';
  }
  return typeof value === 'string' ? value : '';
};

const normalizeStudentField = (value: unknown) => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().replace(/\s+/g, ' ');
  }
  return '';
};

const getStudentFieldText = (student: Record<string, unknown>, key: string) => {
  const exact = normalizeStudentField(student[key]);
  if (exact) {
    return exact;
  }

  return normalizeStudentField(student[key.toLowerCase()]);
};

const assignAddressPartIfEmpty = (
  field:
    | 'student_address_house_no'
    | 'student_address_moo'
    | 'student_address_village'
    | 'student_address_soi'
    | 'student_address_road'
    | 'student_address_subdistrict'
    | 'student_address_district'
    | 'student_address_province'
    | 'student_address_postal_code',
  value: string,
) => {
  if (!value || value === '-' || formData[field].trim()) {
    return;
  }
  formData[field] = value;
};

const extractAddressPart = (address: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = address.match(pattern);
    const value = match?.[1]?.trim().replace(/^[\s,:-]+|[\s,.-]+$/g, '');
    if (value && value !== '-') {
      return value;
    }
  }
  return '';
};

const hydrateVisitAddressFromText = (address: string) => {
  const normalized = address.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return;
  }

  formData.student_address = normalized;
  assignAddressPartIfEmpty(
    'student_address_house_no',
    extractAddressPart(normalized, [/บ้านเลขที่\s*([^\s()]+)/, /เลขที่\s*([^\s()]+)/]),
  );
  assignAddressPartIfEmpty(
    'student_address_moo',
    extractAddressPart(normalized, [/หมู่\s*([^\s()]+)/]),
  );
  assignAddressPartIfEmpty(
    'student_address_village',
    extractAddressPart(normalized, [
      /หมู่บ้าน\s*(.+?)(?=\s+(?:ซอย|ถนน|ตำบล\/แขวง|ตำบล|แขวง|อำเภอ\/เขต|อำเภอ|เขต|จังหวัด|\d{5})|$)/,
      /อาคาร\s*(.+?)(?=\s+(?:ซอย|ถนน|ตำบล\/แขวง|ตำบล|แขวง|อำเภอ\/เขต|อำเภอ|เขต|จังหวัด|\d{5})|$)/,
    ]),
  );
  assignAddressPartIfEmpty(
    'student_address_soi',
    extractAddressPart(normalized, [
      /ซอย\s*(.+?)(?=\s+(?:ถนน|ตำบล\/แขวง|ตำบล|แขวง|อำเภอ\/เขต|อำเภอ|เขต|จังหวัด|\d{5})|$)/,
    ]),
  );
  assignAddressPartIfEmpty(
    'student_address_road',
    extractAddressPart(normalized, [
      /ถนน\s*(.+?)(?=\s+(?:ตำบล\/แขวง|ตำบล|แขวง|อำเภอ\/เขต|อำเภอ|เขต|จังหวัด|\d{5})|$)/,
    ]),
  );
  assignAddressPartIfEmpty(
    'student_address_subdistrict',
    extractAddressPart(normalized, [
      /(?:ตำบล\/แขวง|ตำบล|แขวง)\s*(.+?)(?=\s+(?:อำเภอ\/เขต|อำเภอ|เขต|จังหวัด|\d{5})|$)/,
    ]),
  );
  assignAddressPartIfEmpty(
    'student_address_district',
    extractAddressPart(normalized, [
      /(?:อำเภอ\/เขต|อำเภอ|เขต)\s*(.+?)(?=\s+(?:จังหวัด|\d{5})|$)/,
    ]),
  );
  assignAddressPartIfEmpty(
    'student_address_province',
    extractAddressPart(normalized, [/จังหวัด\s*(.+?)(?=\s+\d{5}|$)/]),
  );
  assignAddressPartIfEmpty(
    'student_address_postal_code',
    extractAddressPart(normalized, [/(\d{5})(?!.*\d)/]),
  );
};

const hydrateVisitAddressFromStudentRecord = (student: Record<string, unknown>) => {
  const villageNumber = getStudentFieldText(student, 'VillageNumber_Onec');
  const soi = getStudentFieldText(student, 'Soi_Onec');
  const street = getStudentFieldText(student, 'Street_Onec');
  const subdistrict = getStudentFieldText(student, 'SubDistrictNameThai_Onec');
  const district = getStudentFieldText(student, 'DistrictNameThai_Onec');
  const province = getStudentFieldText(student, 'ProvinceNameThai_Onec');

  assignAddressPartIfEmpty('student_address_moo', villageNumber);
  assignAddressPartIfEmpty('student_address_soi', soi);
  assignAddressPartIfEmpty('student_address_road', street);
  assignAddressPartIfEmpty('student_address_subdistrict', subdistrict);
  assignAddressPartIfEmpty('student_address_district', district);
  assignAddressPartIfEmpty('student_address_province', province);

  if (!formData.student_school.trim()) {
    formData.student_school = getStudentFieldText(student, 'school_name');
  }

  if (!formData.student_address.trim()) {
    const parts: string[] = [];
    if (villageNumber) parts.push(`หมู่ ${villageNumber}`);
    if (soi) parts.push(`ซอย${soi}`);
    if (street) parts.push(`ถนน${street}`);
    if (subdistrict) parts.push(`ตำบล/แขวง${subdistrict}`);
    if (district) parts.push(`อำเภอ/เขต${district}`);
    if (province) parts.push(`จังหวัด${province}`);
    formData.student_address = parts.join(' ');
  }
};

const fetchStudentAddressPrefill = async (studentId: string) => {
  try {
    const studentRecord = await taskService.getStudentRecord(studentId);
    hydrateVisitAddressFromStudentRecord(studentRecord);
  } catch (err) {
    console.error('Fetch student address prefill error:', err);
  }
};

onMounted(async () => {
  await fetchGradeLevels();
  void fetchLocations();

  // Pre-fill from query params when coming from dashboard OPEN case
  const caseId = getQueryText(route.query.case_id);
  if (caseId) {
    const studentId = getQueryText(route.query.student_id);
    formData.existing_case_id = caseId;
    formData.student_name = getQueryText(route.query.student_name);
    formData.student_school = getQueryText(route.query.student_school);
    formData.reason_flagged = getQueryText(route.query.reason);
    hydrateVisitAddressFromText(getQueryText(route.query.student_address));
    formData.type = 'VISIT';
    currentStep.value = 2;

    if (studentId) {
      void fetchStudentAddressPrefill(studentId);
    }
  }
});

const pageTitle = computed(() => {
  if (currentStep.value === 1) return 'สร้างภารกิจ';
  if (formData.type === 'VISIT') return 'สร้างภารกิจลงพื้นที่';
  if (formData.type === 'LOGIN') return 'สร้างลิงก์เข้าสู่ระบบ';
  return 'สร้างภารกิจเช็คชื่อ';
});

const hasValidCoordinates = computed(() => {
  if (formData.student_lat == null || formData.student_lng == null) return false;
  return (
    Number.isFinite(formData.student_lat) &&
    Number.isFinite(formData.student_lng) &&
    formData.student_lat >= -90 &&
    formData.student_lat <= 90 &&
    formData.student_lng >= -180 &&
    formData.student_lng <= 180
  );
});

const selectType = (type: 'VISIT' | 'ATTENDANCE' | 'LOGIN') => {
  formData.type = type;
  if (type === 'LOGIN') {
    void initializeLoginTaskForm();
  }
  currentStep.value = 2;
};

const shouldShowPermissionBadge = (permissionId: string) => {
  const state = getPermissionVisualState(permissionId);
  return state === 'added' || state === 'removed' || state === 'locked';
};

const getPermissionBadgeLabel = (permissionId: string) => {
  const state = getPermissionVisualState(permissionId);
  if (state === 'added') return 'เพิ่ม';
  if (state === 'removed') return 'ปิด';
  if (state === 'locked') return 'ล็อก';
  return getPermissionVisualMeta(permissionId).shortLabel;
};

const normalizeAddressPart = (value: string) => value.trim().replace(/\s+/g, ' ');

const hasCompleteStructuredVisitAddress = () => (
  [
    formData.student_address_house_no,
    formData.student_address_subdistrict,
    formData.student_address_district,
    formData.student_address_province,
    formData.student_address_postal_code,
  ].every((value) => value.trim().length > 0)
);

const buildDetailedAddress = (data: typeof formData) => {
  const parts: string[] = [];
  const houseNo = normalizeAddressPart(data.student_address_house_no);
  const moo = normalizeAddressPart(data.student_address_moo);
  const village = normalizeAddressPart(data.student_address_village);
  const soi = normalizeAddressPart(data.student_address_soi);
  const road = normalizeAddressPart(data.student_address_road);
  const subdistrict = normalizeAddressPart(data.student_address_subdistrict);
  const district = normalizeAddressPart(data.student_address_district);
  const province = normalizeAddressPart(data.student_address_province);
  const postalCode = normalizeAddressPart(data.student_address_postal_code);
  const note = normalizeAddressPart(data.student_address_note);

  if (houseNo) parts.push(`บ้านเลขที่ ${houseNo}`);
  if (moo) parts.push(`หมู่ ${moo}`);
  if (village) parts.push(village);
  if (soi) parts.push(`ซอย${soi}`);
  if (road) parts.push(`ถนน${road}`);
  if (subdistrict) parts.push(`ตำบล/แขวง${subdistrict}`);
  if (district) parts.push(`อำเภอ/เขต${district}`);
  if (province) parts.push(`จังหวัด${province}`);
  if (postalCode) parts.push(postalCode);
  if (note) parts.push(`(${note})`);

  return parts.join(' ');
};

const formattedStudentAddress = computed(() => buildDetailedAddress(formData));

const submitForm = async () => {
  // Simple validation
  if (!formData.assigned_to_email || !formData.assigned_to_name) {
    $q.notify({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน', color: 'negative' });
    return;
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!validateEmail(formData.assigned_to_email)) {
    $q.notify({ message: 'รูปแบบอีเมลไม่ถูกต้อง', color: 'negative' });
    return;
  }
  if (formData.type === 'ATTENDANCE') {
    if (!formData.target_school_id || !formData.target_grade || !formData.target_room) {
      $q.notify({ message: 'กรุณาเลือกโรงเรียน ระดับชั้น และห้องให้ครบถ้วน', color: 'negative' });
      return;
    }
  }
  if (formData.type === 'VISIT') {
    const hasStructuredAddress = hasCompleteStructuredVisitAddress();
    const existingAddress = normalizeAddressPart(formData.student_address);

    if (!hasStructuredAddress && !existingAddress) {
      $q.notify({ message: 'กรุณากรอกที่อยู่ให้ครบ (บ้านเลขที่, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์)', color: 'negative' });
      return;
    }

    if (hasStructuredAddress && !/^\d{5}$/.test(formData.student_address_postal_code.trim())) {
      $q.notify({ message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก', color: 'negative' });
      return;
    }
  }
  if (formData.type === 'LOGIN') {
    if (!formData.role) {
      $q.notify({ message: 'กรุณาเลือกบทบาท', color: 'negative' });
      return;
    }

    if (formData.permissions.length === 0) {
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
  }

  try {
    const visitStudentAddress = formData.type === 'VISIT'
      ? (hasCompleteStructuredVisitAddress()
        ? buildDetailedAddress(formData)
        : normalizeAddressPart(formData.student_address))
      : formData.student_address;

    const payload = buildTaskCreatePayload(formData, {
      loginDataScope: formData.type === 'LOGIN' ? buildDataScope() : undefined,
      visitStudentAddress,
    });

    await submitTask(payload, {
      loginLink: formData.type === 'LOGIN',
    });
  } catch (err: unknown) {
    console.error(err);
    const error = err as AxiosError<{ message?: string }>;
    $q.notify({ message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างภารกิจ', color: 'negative' });
  }
};

const copyLink = async () => {
  try {
    const method = await copyText(resultLink.value);
    $q.notify({
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอกลิงก์สำเร็จ',
      color: method === 'manual' ? 'warning' : 'positive',
      timeout: 2000,
    });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกลิงก์ได้', color: 'negative', timeout: 2000 });
  }
};

const getLineUrl = (link: string) => {
  return buildTaskLineShareUrl(link);
};

const isValidCoordinatePair = (lat: number, lng: number) => {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const parseCoordinatesFromText = (text: string): { lat: number; lng: number } | null => {
  const value = text.trim();
  if (!value) return null;

  const patterns: RegExp[] = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // .../@13.7563,100.5018,17z
    /[?&](?:q|query|destination|center)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // ...?q=13.7,100.5
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // ...!3d13.7!4d100.5
    /(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/, // fallback: "13.7,100.5"
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidCoordinatePair(lat, lng)) return { lat, lng };
  }

  return null;
};

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    $q.notify({ message: 'เบราว์เซอร์นี้ไม่รองรับการดึงตำแหน่ง', color: 'negative' });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      formData.student_lat = Number(position.coords.latitude.toFixed(6));
      formData.student_lng = Number(position.coords.longitude.toFixed(6));
      $q.notify({ message: 'ดึงพิกัดสำเร็จ', color: 'positive' });
    },
    () => {
      $q.notify({ message: 'ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตตำแหน่ง', color: 'negative' });
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
};

const applyCoordinatesFromMapInput = () => {
  const coords = parseCoordinatesFromText(mapPickerInput.value);
  if (!coords) {
    $q.notify({ message: 'ไม่พบพิกัดในข้อความที่วาง กรุณาวางลิงก์ Google Maps หรือพิกัด เช่น 13.7563,100.5018', color: 'negative' });
    return;
  }

  formData.student_lat = Number(coords.lat.toFixed(6));
  formData.student_lng = Number(coords.lng.toFixed(6));
  $q.notify({ message: 'ดึงพิกัดจากลิงก์สำเร็จ', color: 'positive' });
};

const getMapsPickerUrl = () => {
  if (!hasValidCoordinates.value) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/@${formData.student_lat},${formData.student_lng},17z`;
};

const getEmbedMapUrl = () => {
  if (!hasValidCoordinates.value) return '';
  return `https://maps.google.com/maps?q=${formData.student_lat},${formData.student_lng}&z=15&output=embed`;
};

</script>

<style lang="scss" scoped>
.btn-back-home {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 700;
  color: #64748b;
  padding: 8px 16px;
  
  &:hover {
    background: #f8fafc;
    color: #2563eb;
  }
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  transition: all 0.2s ease;
  
  &.cursor-pointer:hover {
    color: #2563eb;
    transform: translateY(-1px);
    
    .step-num {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
      border-color: #2563eb;
    }
  }
  
  &.active {
    color: #2563eb;
    
    .step-num {
      background: #2563eb;
      color: white;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }
  }
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

/* Type Selection */
.type-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.type-card {
  background: white;
  border: 2px solid #f1f5f9;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: $shadow;
  
  &:hover {
    transform: translateY(-6px);
    border-color: #2563eb;
    box-shadow: $shadow-md;
  }
}

.type-icon { font-size: 3.5rem; margin-bottom: 1.5rem; display: block; }
.type-title { font-weight: 800; font-size: 1.4rem; margin-bottom: 0.75rem; color: #1e3a8a; }
.type-desc { color: #64748b; font-size: 0.95rem; line-height: 1.5; }

/* Forms */
.form-group {
    margin-bottom: 20px;
    
    label {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    input, select, textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
    }

    textarea { min-height: 100px; resize: vertical; }
}

.permission-help-text {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.permission-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.permission-legend-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.permission-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-top: 3px;
  flex-shrink: 0;
}

.permission-legend-item--default .permission-legend-swatch,
.permission-state-badge--default {
  background: #2563eb;
  color: white;
}

.permission-legend-item--added .permission-legend-swatch,
.permission-state-badge--added {
  background: #16a34a;
  color: white;
}

.permission-legend-item--removed .permission-legend-swatch,
.permission-state-badge--removed {
  background: #ea580c;
  color: white;
}

.permission-legend-item--locked .permission-legend-swatch,
.permission-state-badge--locked {
  background: #64748b;
  color: white;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.permission-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  padding: 9px 72px 9px 12px;
  transition: all 0.2s ease;
  min-height: 52px;
}

.permission-item--default {
  border-color: rgba(37, 99, 235, 0.35);
  background: rgba(219, 234, 254, 0.45);
}

.permission-item--added {
  border-color: rgba(22, 163, 74, 0.35);
  background: rgba(220, 252, 231, 0.55);
}

.permission-item--removed {
  border-color: rgba(234, 88, 12, 0.35);
  background: rgba(255, 237, 213, 0.6);
}

.permission-item--disabled,
.permission-item--locked {
  border-color: rgba(100, 116, 139, 0.25);
  background: rgba(241, 245, 249, 0.8);
  color: #64748b;
}

.permission-item__label {
  flex: 1;
  min-width: 0;
  color: #334155;
  font-size: 0.88rem;
  line-height: 1.35;
}

.permission-state-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;
}

.selected-permission-chip {
  border: 1px solid transparent;
  font-size: 0.78rem;
}

.selected-permission-chip--default {
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(219, 234, 254, 0.85);
}

.selected-permission-chip--added {
  border-color: rgba(22, 163, 74, 0.24);
  background: rgba(220, 252, 231, 0.85);
}

.selected-permission-chip--removed {
  border-color: rgba(234, 88, 12, 0.24);
  background: rgba(255, 237, 213, 0.85);
}

.selected-permission-chip--locked {
  border-color: rgba(100, 116, 139, 0.24);
  background: rgba(241, 245, 249, 0.85);
}

.permission-item__checkbox {
  flex-shrink: 0;
}

.permission-item__checkbox :deep(.q-checkbox) {
  min-height: auto;
}

.permission-item__checkbox :deep(.q-checkbox__inner) {
  font-size: 2rem;
}

.scope-toggle-inline {
  border-radius: 999px;
  border: 1px solid #dbe3f0;
  background: #f8fafc;
  padding: 4px 12px;
}

.scope-toggle-inline :deep(.q-toggle__label) {
  font-size: 0.86rem;
  font-weight: 600;
  color: #475569;
}

.scope-toggle-inline :deep(.q-toggle__inner) {
  font-size: 2.1rem;
}

.task-form-actions__btn {
  min-height: 46px;
  border-radius: 12px;
  font-weight: 700;
}

.expiry-row {
    display: flex;
    gap: 10px;
    
    input { flex: 1; }
    select { width: 120px; }
}

.coord-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.map-picker-grid {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.coord-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.map-picker-help {
  font-size: 0.82rem;
  color: #64748b;
}

.map-preview-wrap {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.map-preview {
  width: 100%;
  height: 220px;
  border: 0;
}

.address-preview {
  border-radius: 10px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1e3a8a;
  padding: 10px 12px;
  font-size: 0.9rem;
}

.linked-case-banner {
  background: #f0fdfa;
  border: 1.5px solid #99f6e4;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  color: #0f766e;
  font-weight: 600;
}

.magic-link-box {
    background: #f1f5f9;
    padding: 16px;
    border: 1.5px dashed #cbd5e1;
    border-radius: 12px;
    word-break: break-all;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    color: #334155;
}

.alert {
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 700;
}

@media (max-width: 600px) {
    .type-selection { grid-template-columns: 1fr; }
    .step-indicator { gap: 0.75rem; }
    .step { font-size: 0.8rem; }
    .type-card { padding: 2rem 1rem; }
    .type-icon { font-size: 2.5rem; }
    .type-title { font-size: 1.2rem; }
    .coord-grid { grid-template-columns: 1fr; }
    .map-picker-grid { grid-template-columns: 1fr; }
}
</style>
