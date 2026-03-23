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
          <div class="form-group">
            <label>ชื่อ-นามสกุล ผู้ใช้งานลิงก์ *</label>
            <input type="text" v-model="formData.assigned_to_name" placeholder="เช่น อาจารย์สมเกียรติติตรงนี้">
          </div>
          <div class="form-group">
            <label>อีเมล/Username (สวมสิทธิ์) *</label>
            <input type="email" v-model="formData.assigned_to_email" placeholder="เช่น teacher_temp@school.ac.th">
          </div>

          <div class="form-group">
            <label>บทบาท (Role) *</label>
            <select v-model="formData.selected_role" style="width: 100% !important; height: 48px;">
              <option value="ADMIN_SCHOOL">ผู้บริหารโรงเรียน</option>
              <option value="TEACHER">ครูประจำชั้น</option>
            </select>
          </div>

          <div class="form-group">
            <label>สิทธิ์การใช้งาน (Permissions) - ฟังก์ชันอนาคต</label>
            <q-btn-dropdown
              color="white"
              text-color="grey-8"
              flat
              no-caps
              class="full-width dropdown-btn-select"
              label="-- เลือกสิทธิ์การใช้งาน --"
              style="border: 1px solid #e2e8f0; border-radius: 8px; height: 48px; text-align: left !important; justify-content: space-between !important;"
              align="left"
            >
              <q-list class="q-pa-sm" style="min-width: 250px;">
                <q-item v-for="opt in permissionOptions" :key="opt.value" dense class="q-py-xs">
                  <q-item-section side>
                    <q-checkbox v-model="formData.mock_permissions" :val="opt.value" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <!-- Display Selected Permissions as Chips -->
            <div class="q-mt-sm q-gutter-xs">
              <q-chip 
                v-for="val in formData.mock_permissions" 
                :key="val" 
                dense 
                color="blue-1" 
                text-color="primary"
                removable
                @remove="formData.mock_permissions = formData.mock_permissions.filter(p => p !== val)"
              >
                {{ permissionOptions.find(o => o.value === val)?.label }}
              </q-chip>
            </div>
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
        <div class="row q-col-gutter-md">
          <div class="col-4">
            <q-btn flat color="grey-7" label="ย้อนกลับ" class="full-width" @click="currentStep = 1" no-caps />
          </div>
          <div class="col-8">
            <q-btn color="primary" label="สร้างภารกิจ" class="full-width" unelevated padding="12px" :loading="loading" @click="submitForm" />
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
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const currentStep = ref(1);
const loading = ref(false);
const showResult = ref(false);
const resultLink = ref('');
const qrCodeUrl = ref('');
const mapPickerInput = ref('');

const permissionOptions = [
  { label: 'ดูแดชบอร์ดรายงาน', value: 'VIEW_DASHBOARD' },
  { label: 'จัดการรายชื่อนักเรียน', value: 'MANAGE_STUDENTS' },
  { label: 'เช็คชื่อขาด/มา', value: 'CHECK_ATTENDANCE' },
  { label: 'สร้างลิงก์/มอบหมายงาน', value: 'MANAGE_TASKS' }
];

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
  selected_role: 'TEACHER', // For UI placeholder roles
  mock_permissions: ['VIEW_DASHBOARD'], // For UI placeholder checklist
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
  if (type === 'LOGIN') {
    void router.push('/login-links');
    return;
  }

  formData.type = type;
  currentStep.value = 2;
};

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

  loading.value = true;
  try {
    const payload: Record<string, unknown> = {
      ...formData,
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
