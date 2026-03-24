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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import { useUserStore } from '../composables/useUserStore';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  PERMISSION_DELTA_LEGEND,
  PERMISSION_DELTA_META,
  getLeafMenuItems,
  getPermissionDeltaState,
  getRoleScopePreset,
  type DataScope,
  type RoleDefinition,
  type ScopeFormField,
} from '../constants/permissions';

const $q = useQuasar();
const route = useRoute();
const { user } = useUserStore();
const currentStep = ref(1);
const loading = ref(false);
const showResult = ref(false);
const resultLink = ref('');
const qrCodeUrl = ref('');
const mapPickerInput = ref('');

const rolesCatalog = ref<RoleDefinition[]>([]);
const schoolOptions = ref<Array<{
  label: string;
  value: number;
  province?: string;
  district?: string;
  sub_district?: string;
}>>([]);
const roomOptions = ref<string[]>([]);
const suppressRolePermissionSync = ref(false);

const permissionOptions = getLeafMenuItems().map((item) => ({
  label: item.label,
  value: item.id,
}));
const permissionLegendItems = PERMISSION_DELTA_LEGEND;

const formData = reactive({
  type: '',
  student_name: '',
  student_school: '',
  student_address: '',
  student_address_house_no: '',
  student_address_moo: '',
  student_address_village: '',
  student_address_soi: '',
  student_address_road: '',
  student_address_subdistrict: '',
  student_address_district: '',
  student_address_province: '',
  student_address_postal_code: '',
  student_address_note: '',
  student_lat: null as number | null,
  student_lng: null as number | null,
  reason_flagged: '',
  target_grade: '',
  target_room: '',
  target_subject: '',
  assigned_to_name: '',
  assigned_to_email: '',
  expires_value: 1,
  expires_unit: 'days',
  target_school_id: '', // Added for attendance scoping
  selected_user_id: '', // For magic login lookup
  role: 'TEACHER',
  permissions: [] as string[],
  existing_case_id: '', // Pre-linked case when coming from dashboard
});

interface GradeLevel { id: number; label: string; }
interface School { id: number; name: string; }
interface District { province: string; district: string; }
interface SubDistrict { province: string; district: string; sub_district: string; }

const gradeLevels = ref<GradeLevel[]>([]);

// Location Cascade Data
const locationData = reactive({
  provinces: [] as string[],
  districts: [] as District[],
  subDistricts: [] as SubDistrict[]
});

const tempFilters = reactive({
  province: '',
  district: '',
  subDistrict: '',
});

const scopeForm = reactive({
  allProvinces: true,
  province: null as string | null,
  district: null as string | null,
  sub_district: null as string | null,
  school_id: null as number | null,
  grade_level: null as number | null,
  room: null as string | null,
});

const tempSchools = ref<School[]>([]);

const filteredDistricts = computed(() => {
  if (!tempFilters.province) return [];
  return Array.from(new Set(
    locationData.districts
      .filter((d: District) => d.province === tempFilters.province)
      .map((d: District) => d.district)
  ));
});

const filteredSubDistricts = computed(() => {
  if (!tempFilters.district) return [];
  return Array.from(new Set(
    locationData.subDistricts
      .filter((sd: SubDistrict) => sd.province === tempFilters.province && sd.district === tempFilters.district)
      .map((sd: SubDistrict) => sd.sub_district)
  ));
});

const permissionLabelMap = computed<Record<string, string>>(() => (
  Object.fromEntries(permissionOptions.map((item) => [item.value, item.label]))
));

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
  rolesCatalog.value.find((role) => role.name === formData.role) || null
));
const roleDefaultPermissions = computed(() => selectedRoleMeta.value?.default_permissions || []);
const roleScopePreset = computed(() => (
  getRoleScopePreset(formData.role, selectedRoleMeta.value?.scope_mode)
));
const canUseNationwideScope = computed(() => (
  currentUserScope.value.provinces.length === 0 &&
  currentUserScope.value.districts.length === 0 &&
  currentUserScope.value.sub_districts.length === 0 &&
  currentUserScope.value.school_ids.length === 0
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
const availableProvinceOptions = computed(() => (
  currentUserScope.value.provinces.length > 0
    ? locationData.provinces.filter((province) => currentUserScope.value.provinces.includes(province))
    : locationData.provinces
));
const availableDistrictOptions = computed(() => {
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
const availableSubDistrictOptions = computed(() => {
  if (!scopeForm.province || !scopeForm.district) return [];
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
    ? gradeLevels.value.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.id)))
    : gradeLevels.value
));
const availableRoomOptions = computed(() => (
  currentUserScope.value.room_ids.length > 0
    ? roomOptions.value.filter((room) => currentUserScope.value.room_ids.includes(String(room)))
    : roomOptions.value
));
const submitButtonLabel = computed(() => (
  formData.type === 'LOGIN' ? 'สร้างลิงก์เข้าสู่ระบบ' : 'สร้างภารกิจ'
));

const fetchLocations = async () => {
  try {
    const res = await api.get('/api/attendance/locations');
    Object.assign(locationData, res.data.data);
  } catch (err) {
    console.error('Fetch locations error:', err);
  }
};

const onProvinceChange = () => {
  tempFilters.district = '';
  tempFilters.subDistrict = '';
  formData.target_school_id = '';
  tempSchools.value = [];
};

const onDistrictChange = () => {
  tempFilters.subDistrict = '';
  formData.target_school_id = '';
  tempSchools.value = [];
};

const onSubDistrictChange = async () => {
  formData.target_school_id = '';
  if (!tempFilters.subDistrict) return;
  try {
    const res = await api.get('/api/attendance/schools', {
      params: {
        province: tempFilters.province,
        district: tempFilters.district,
        subDistrict: tempFilters.subDistrict
      }
    });
    tempSchools.value = res.data.data;
  } catch (err) {
    console.error('Fetch temp schools error:', err);
  }
};

const fetchGradeLevels = async () => {
  try {
    const res = await api.get('/api/attendance/grade-levels');
    gradeLevels.value = res.data.data;
  } catch (err) {
    console.error('Fetch grade levels error:', err);
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

const fetchRolesCatalog = async () => {
  try {
    const res = await api.get<RoleDefinition[]>('/api/users/roles');
    rolesCatalog.value = res.data;
  } catch (err) {
    console.error('Fetch roles error:', err);
  }
};

const fetchLoginScopeRooms = async () => {
  if (!scopeForm.grade_level || !scopeForm.school_id) {
    roomOptions.value = [];
    scopeForm.room = null;
    return;
  }

  try {
    const selectedGrade = gradeLevels.value.find((grade) => grade.id === scopeForm.grade_level);
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
    console.error('Fetch login scope rooms error:', err);
  }
};

const ensureLoginOptionsLoaded = async () => {
  const tasks: Promise<void>[] = [];
  if (locationData.provinces.length === 0) tasks.push(fetchLocations());
  if (gradeLevels.value.length === 0) tasks.push(fetchGradeLevels());
  if (schoolOptions.value.length === 0) tasks.push(fetchSchools());
  if (rolesCatalog.value.length === 0) tasks.push(fetchRolesCatalog());
  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
};

onMounted(async () => {
  await fetchGradeLevels();
  void fetchLocations();

  // Pre-fill from query params when coming from dashboard OPEN case
  const { case_id, student_name, student_school, reason } = route.query;
  if (case_id) {
    formData.existing_case_id = String(case_id);
    formData.student_name = student_name ? String(student_name) : '';
    formData.student_school = student_school ? String(student_school) : '';
    formData.reason_flagged = reason ? String(reason) : '';
    formData.type = 'VISIT';
    currentStep.value = 2;
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

const selectType = (type: string) => {
  formData.type = type;
  if (type === 'LOGIN') {
    void initializeLoginTaskForm();
  }
  currentStep.value = 2;
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

const applyRoleScopePreset = () => {
  const preset = roleScopePreset.value;

  if (preset.mode === 'flexible') {
    return;
  }

  if (preset.mode === 'global') {
    resetScopeForm();
    scopeForm.allProvinces = true;
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

  resetScopeForm();
  scopeForm.allProvinces = true;
};

const onLoginScopeProvinceChange = () => {
  scopeForm.allProvinces = false;
  scopeForm.district = null;
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onLoginScopeDistrictChange = () => {
  scopeForm.sub_district = null;
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onLoginScopeSubDistrictChange = () => {
  scopeForm.school_id = null;
  scopeForm.grade_level = null;
  scopeForm.room = null;
  roomOptions.value = [];
};

const onLoginScopeSchoolChange = () => {
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
  !formData.permissions.includes(permissionId) && !canGrantPermission(permissionId)
);

const getPermissionVisualState = (permissionId: string) => (
  getPermissionDeltaState(
    permissionId,
    formData.permissions,
    roleDefaultPermissions.value,
    isPermissionLocked(permissionId),
  )
);

const getPermissionVisualMeta = (permissionId: string) => (
  PERMISSION_DELTA_META[getPermissionVisualState(permissionId)]
);

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

const togglePermission = (permissionId: string, checked: boolean) => {
  if (checked) {
    if (!formData.permissions.includes(permissionId) && canGrantPermission(permissionId)) {
      formData.permissions = [...formData.permissions, permissionId];
    }
    return;
  }

  formData.permissions = formData.permissions.filter((item) => item !== permissionId);
};

const removePermission = (permissionId: string) => {
  formData.permissions = formData.permissions.filter((item) => item !== permissionId);
};

const buildLoginDataScope = (): DataScope => {
  const dataScope: DataScope = {};
  if (!scopeForm.allProvinces && scopeForm.province) dataScope.provinces = [scopeForm.province];
  if (!scopeForm.allProvinces && scopeForm.district) dataScope.districts = [scopeForm.district];
  if (!scopeForm.allProvinces && scopeForm.sub_district) dataScope.sub_districts = [scopeForm.sub_district];
  if (!scopeForm.allProvinces && scopeForm.school_id) dataScope.school_ids = [scopeForm.school_id];
  if (scopeForm.grade_level) dataScope.grade_levels = [scopeForm.grade_level];
  if (scopeForm.room) dataScope.room_ids = [scopeForm.room];
  return dataScope;
};

const initializeLoginTaskForm = async () => {
  await ensureLoginOptionsLoaded();
  suppressRolePermissionSync.value = true;
  formData.role = roleOptions.value.find((item) => item.value === 'TEACHER')?.value || roleOptions.value[0]?.value || 'TEACHER';
  formData.permissions = [];
  resetScopeForm();
  await nextTick();
  suppressRolePermissionSync.value = false;
  formData.permissions = Array.from(
    new Set(
      (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
    ),
  );
  applyRoleScopePreset();
};

watch(() => formData.role, () => {
  if (formData.type !== 'LOGIN') {
    return;
  }

  if (!suppressRolePermissionSync.value) {
    formData.permissions = Array.from(
      new Set(
        (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
      ),
    );
  }

  applyRoleScopePreset();
});

watch(
  () => [scopeForm.grade_level, scopeForm.school_id],
  () => {
    if (formData.type !== 'LOGIN') {
      return;
    }

    if (scopeForm.grade_level && scopeForm.school_id) {
      void fetchLoginScopeRooms();
    } else {
      roomOptions.value = [];
      scopeForm.room = null;
    }
  },
);

const normalizeAddressPart = (value: string) => value.trim().replace(/\s+/g, ' ');

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
    const hasRequiredAddressParts = [
      formData.student_address_house_no,
      formData.student_address_subdistrict,
      formData.student_address_district,
      formData.student_address_province,
      formData.student_address_postal_code,
    ].every((value) => value.trim().length > 0);

    if (!hasRequiredAddressParts) {
      $q.notify({ message: 'กรุณากรอกที่อยู่ให้ครบ (บ้านเลขที่, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์)', color: 'negative' });
      return;
    }

    if (!/^\d{5}$/.test(formData.student_address_postal_code.trim())) {
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

  loading.value = true;
  try {
    const payload: Record<string, unknown> = {
      ...formData,
      role: formData.type === 'LOGIN' ? formData.role : undefined,
      permissions: formData.type === 'LOGIN' ? [...formData.permissions] : undefined,
      data_scope: formData.type === 'LOGIN' ? buildLoginDataScope() : undefined,
      student_address: formData.type === 'VISIT' ? buildDetailedAddress(formData) : formData.student_address,
      task_type: formData.type,
      subject: formData.target_subject || null,
      target_school_id: formData.type === 'ATTENDANCE' && formData.target_school_id ? parseInt(formData.target_school_id, 10) : null,
    };
    if (formData.existing_case_id) {
      payload.existing_case_id = formData.existing_case_id;
    }
    const res = await api.post('/api/tasks', payload);
    let link = normalizePublicLink(res.data.magic_link);
    if (formData.type === 'LOGIN') {
      link = link.replace('/task/', '/login/magic/');
    }
    resultLink.value = link;
    // We don't have a QR code generator in this mock yet, so just leave it empty or use dummy
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resultLink.value)}`;
    showResult.value = true;
  } catch (err: unknown) {
    console.error(err);
    const error = err as AxiosError<{ message?: string }>;
    $q.notify({ message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างภารกิจ', color: 'negative' });
  } finally {
    loading.value = false;
  }
};

const copyLink = () => {
  void navigator.clipboard.writeText(resultLink.value).then(() => {
    $q.notify({ message: 'คัดลอกลิงก์สำเร็จ', color: 'positive', timeout: 2000 });
  });
};

const getLineUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
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
