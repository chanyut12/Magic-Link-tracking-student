<template>
  <q-page class="guest-page">
    <div v-if="loading" style="padding: 4rem 0; text-align: center;">
      <q-spinner color="primary" size="3rem" />
      <p class="q-mt-md text-gray-500">กำลังโหลดข้อมูล...</p>
    </div>

    <template v-else-if="task">
      <!-- Header -->
      <div class="guest-header">
        <h1>
          {{ task.type === 'VISIT' ? 'ภารกิจลงพื้นที่' : 'รายวิชา: ' + (task.subject || 'ไม่ระบุวิชา') }}
        </h1>
        <div class="subtitle" v-if="task.type === 'ATTENDANCE'">
          รร. {{ task.school_name || 'ไม่ระบุ' }} | ชั้น {{ task.target_grade }} ห้อง {{ task.target_room }}
        </div>
        <div class="subtitle" v-else>
          มอบหมาย: {{ task.assigned_to_name }}
        </div>

        <div class="expiry-box" v-if="!isExpired">
          <i class="fas fa-clock"></i>
          <span>ลิงก์หมดอายุใน: {{ countdownText }}</span>
        </div>
        <div class="expiry-box expired" v-else>
          <i class="fas fa-exclamation-circle"></i>
          <span>ลิงก์หมดอายุแล้ว</span>
        </div>
      </div>

      <div class="container q-pa-lg" :class="{ wide: task && task.type === 'ATTENDANCE' }">

        <!-- OTP Screen -->
        <div v-if="authRequired" class="otp-container">
          <div class="otp-icon"><i class="fas fa-shield-alt"></i></div>
          <div class="otp-title">ยืนยันตัวตน</div>
          <div class="otp-desc">{{ otpSent ? 'รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว (โปรดตรวจสอบใน Log ระบบ)' : 'กรุณากดปุ่มด้านล่างเพื่อรับรหัส OTP ทางอีเมลที่ลงทะเบียนไว้' }}</div>

          <div v-if="!otpSent">
            <q-btn
              unelevated
              color="primary"
              label="รับรหัส OTP"
              class="full-width q-py-md"
              :loading="otpLoading"
              @click="requestOTP"
            />
          </div>

          <div v-else class="otp-input-group">
            <input
              type="text"
              v-model="otpInput"
              class="otp-input"
              maxlength="6"
              placeholder="000000"
              inputmode="numeric"
            />
            <q-btn
              unelevated
              color="primary"
              label="ตรวจสอบรหัส"
              class="full-width q-py-md"
              :loading="otpLoading"
              @click="verifyOTP"
            />
            <div class="resend-link q-mt-md" @click="otpSent = false">ส่งรหัสอีกครั้ง</div>
          </div>
        </div>

        <!-- Main UI (Attendance) -->
        <div v-else-if="task.type === 'ATTENDANCE'" class="main-ui">
          
          <!-- Tabs container -->
          <div class="tabs-container q-mb-lg">
            <div 
              class="tab-item" 
              :class="{ active: currentTab === 'today' }" 
              @click="currentTab = 'today'"
            >
              เช็คชื่อวันนี้
            </div>
            <div 
              class="tab-item" 
              :class="{ active: currentTab === 'history' }" 
              @click="currentTab = 'history'; loadHistory();"
            >
              ประวัติการเช็คชื่อ
            </div>
          </div>

          <div class="row items-center q-col-gutter-sm q-mb-md">
            <!-- Search Bar -->
            <div class="col-12 col-sm-6">
              <div class="search-container">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  class="search-input" 
                  placeholder="ค้นหาชื่อหรือรหัส..."
                  v-model="searchQuery"
                >
              </div>
            </div>

            <!-- Date picker for History and Save button container -->
            <div class="col-12 col-sm-6 text-right">
              <div v-if="currentTab === 'history'" class="date-picker-container" style="max-width: 250px; margin-left: auto;">
                <i class="far fa-calendar-alt" style="color: #64748b; margin-right: 8px;"></i>
                <input type="date" v-model="historyDate" @change="loadHistory" class="date-picker-input" style="border: none; border-bottom: 1.5px solid #e2e8f0; outline: none;">
              </div>
            </div>
          </div>

          <!-- Stats Grid inside Today/History -->
          <div class="stats-grid">
            <div class="stat-mini-card present">
              <span class="label">มา</span>
              <span class="value">{{ attendanceStats.present }}</span>
            </div>
            <div class="stat-mini-card late">
              <span class="label">สาย</span>
              <span class="value">{{ attendanceStats.late }}</span>
            </div>
            <div class="stat-mini-card absent">
              <span class="label">ขาด</span>
              <span class="value">{{ attendanceStats.absent }}</span>
            </div>
          </div>

          <!-- Table Header -->
          <div class="table-header d-none-mobile q-mb-sm" style="display: grid; grid-template-columns: 2.5fr 3fr; padding: 0 1.5rem; color: #64748b; font-size: 0.85rem; font-weight: 700;" v-if="(currentTab === 'today' ? filteredStudents : historyRecords).length > 0">
            <div>ชื่อ - นามสกุล</div>
            <div class="text-right">{{ currentTab === 'today' ? 'สถานะเช็คชื่อ' : 'สถานะ' }}</div>
          </div>

          <div class="student-list" style="padding-bottom: 8rem;">
            <div v-for="s in (currentTab === 'today' ? filteredStudents : historyRecords)" :key="s.id" class="student-card">
              <div class="student-info">
                <div 
                  class="student-avatar"
                  :style="getAvatarGradient(s.name)"
                >{{ s.name[0] }}</div>
                <div class="student-details">
                  <div class="student-name">{{ s.name }}</div>
                  <div class="student-id">รหัส: {{ s.id }}</div>
                </div>
              </div>

              <!-- Today tab actions -->
              <div v-if="currentTab === 'today'" class="status-options">
                <button
                  class="status-btn present"
                  :class="{ active: (attendanceSelections[s.id] || 'P_PRESENT') === 'P_PRESENT' }"
                  @click="setStatus(s.id, 'P_PRESENT')"
                >
                  <i class="fas fa-check"></i> มา
                </button>
                <button
                  class="status-btn absent"
                  :class="{ active: attendanceSelections[s.id] === 'P_ABSENT' }"
                  @click="setStatus(s.id, 'P_ABSENT')"
                >
                  <i class="fas fa-times"></i> ขาด
                </button>
                <button
                  class="status-btn late"
                  :class="{ active: attendanceSelections[s.id] === 'P_LATE' }"
                  @click="setStatus(s.id, 'P_LATE')"
                >
                  <i class="fas fa-clock"></i> สาย
                </button>
              </div>

              <!-- History tab badge -->
              <div v-else class="status-badge-view text-right">
                <span class="badge" style="padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem;" 
                  :style="getStatusBadgeStyle(s)"
                >
                  {{ getStatusLabel(s) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main UI (Visit) -->
        <div v-else class="main-ui">
          <div class="card q-mb-lg">
            <div class="card-title">ข้อมูลนักเรียน</div>
            <div class="info-row">
              <span class="label">ชื่อ</span>
              <span class="value">{{ task.student_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">โรงเรียน</span>
              <span class="value">{{ task.student_school || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">ที่อยู่</span>
              <span class="value">{{ task.student_address || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">สาเหตุ</span>
              <span class="value text-negative text-weight-bold">{{ task.reason_flagged }}</span>
            </div>
          </div>

          <div class="card q-mb-lg" v-if="task.student_lat != null && task.student_lng != null">
            <div class="card-title">พิกัดบ้านนักเรียน</div>
            <iframe
              class="map-frame"
              :src="getEmbedMapUrl()"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <q-btn outline color="primary" label="🗺️ เปิดใน Google Maps" class="full-width q-mt-md" :href="getGmapsUrl()" target="_blank" />
          </div>

          <!-- Action Selector -->
          <div class="card q-mb-lg" v-if="!showVisitResults && !visitMode">
            <div class="card-title">เลือกการดำเนินการ</div>
            <p class="text-gray-500 q-mb-md">กรุณาเลือกว่าจะลงพื้นที่เอง หรือมอบหมายให้ผู้อื่นดำเนินการแทน</p>
            <q-btn
              color="positive"
              label="📍 ลงพื้นที่"
              class="full-width q-py-md q-mb-sm"
              unelevated
              @click="startVisit"
            />
            <q-btn
              v-if="canDelegate"
              color="warning"
              icon="group"
              label="มอบหมายให้ผู้อื่น"
              class="full-width q-py-md"
              unelevated
              :to="`/task/${token}/delegate`"
            />
          </div>

          <!-- Visit Detail: show only after user chooses "ลงพื้นที่" -->
          <template v-if="!showVisitResults && visitMode">
            <div class="card q-mb-lg">
              <div class="card-title">ลงพื้นที่เอง</div>
              <p class="text-gray-500 q-mb-md">บันทึก GPS และถ่ายรูปประกอบรายงาน</p>
              <q-btn
                color="positive"
                label="📍 ลงพื้นที่พร้อมรูปภาพ"
                icon="camera_alt"
                class="full-width q-py-md"
                unelevated
                :to="`/task/${token}/report`"
              />
            </div>

            <div class="card q-mb-lg">
              <div class="card-title text-gray-500">หรือสรุปผลแบบเร็ว</div>
              <div class="form-group">
                <label>รายละเอียดการเยี่ยมบ้าน</label>
                <textarea v-model="visitData.notes" placeholder="กรอกข้อมูลที่พบจากการลงพื้นที่..."></textarea>
              </div>
              <q-btn color="positive" label="✅ บันทึกสำเร็จ" class="full-width q-py-md q-mb-sm" unelevated @click="submitVisit('COMPLETED')" :loading="saving" />
              <q-btn flat color="grey-7" label="ย้อนกลับ" class="full-width q-mt-sm" @click="visitMode = false" />
            </div>
          </template>

          <div v-else class="card q-pa-xl text-center">
            <div class="alert alert-success q-mb-md">บันทึกข้อมูลการลงพื้นที่เรียบร้อยแล้ว</div>
            <p class="text-gray-500">ขอบคุณสำหรับความร่วมมือในการติดตามนักเรียนครับ</p>
          </div>
        </div>

      </div>

      <!-- Floating Footer (for Attendance) -->
      <div v-if="!authRequired && task.type === 'ATTENDANCE' && currentTab === 'today'" class="floating-footer">
        <q-btn
          unelevated
          class="btn-save"
          @click="saveAttendance"
          :loading="saving"
          :disabled="isExpired"
        >
          <i class="fas fa-save q-mr-sm"></i>
          <span>บันทึกข้อมูลหน้าคลาส</span>
        </q-btn>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

interface TaskData {
  id: string;
  type: string;
  subject?: string;
  target_grade?: string;
  target_room?: string;
  assigned_to_name: string;
  expires_at: string;
  student_name?: string;
  student_school?: string;
  student_address?: string;
  reason_flagged?: string;
  student_lat?: number;
  student_lng?: number;
  auth_required?: boolean;
  can_delegate?: boolean;
  delegation_depth?: number;
  max_delegation_depth?: number;
  school_name?: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  room: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const token = route.params.token as string;

const loading = ref(true);
const task = ref<TaskData | null>(null);
const authRequired = ref(false);
const otpSent = ref(false);
const otpInput = ref('');
const otpLoading = ref(false);
const students = ref<Student[]>([]);
const attendanceSelections = reactive<Record<string, string>>({});
const touchedSelections = reactive<Record<string, boolean>>({});
const searchQuery = ref('');

const avatarColors = [
  ['#6366f1', '#8b5cf6'],
  ['#ec4899', '#f43f5e'],
  ['#14b8a6', '#06b6d4'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#22c55e'],
  ['#3b82f6', '#0ea5e9'],
  ['#8b5cf6', '#a855f7'],
  ['#ef4444', '#f97316'],
];

const getAvatarGradient = (name: string) => {
  let hash = 0;
  if (!name) return { background: '#e2e8f0', color: '#64748b' };
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  const colorPair = avatarColors[index];
  if (!colorPair) return { background: '#e2e8f0', color: '#64748b' };
  const [c1, c2] = colorPair;
  return {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };
};

const filteredStudents = computed(() => {
  if (!searchQuery.value) return [...students.value].sort((a: Student, b: Student) => a.name.localeCompare(b.name));
  const q = searchQuery.value.toLowerCase().trim();
  return students.value
    .filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q))
    .sort((a: Student, b: Student) => a.name.localeCompare(b.name));
});

interface HistoryRecord {
  id: string;
  name: string;
  status: number;
}

const currentTab = ref('today');
const historyDate = ref(new Date().toISOString().split('T')[0]);
const historyRecords = ref<HistoryRecord[]>([]);
const saving = ref(false);
const showVisitResults = ref(false);
const visitMode = ref(false);
const isExpired = ref(false);
const countdownText = ref('--:--');

const visitData = reactive({
  notes: '',
  status: 'IN_PROGRESS'
});

let timer: ReturnType<typeof setInterval> | null = null;
let polling: ReturnType<typeof setInterval> | null = null;

const fetchData = async () => {
  try {
    const res = await api.get(`/api/tasks/${token}`);

    if (res.data.status === 'EXPIRED') {
      void router.push(`/task/${token}/expired`);
      return;
    }

    if (res.data.status === 'ADMIN_LOCKED') {
      const reason = res.data.reason ? `?reason=${encodeURIComponent(res.data.reason)}` : '';
      void router.push(`/task/${token}/locked${reason}`);
      return;
    }

    task.value = res.data;
    authRequired.value = !!res.data.auth_required;

    if (res.data.expires_at) {
      console.log('[DEBUG] fetchData - expires_at raw:', res.data.expires_at);
      startCountdown(new Date(res.data.expires_at));
    }

    if (!authRequired.value) {
      await loadTaskData();
    }
  } catch (err) {
    console.error(err);
    $q.notify({ message: 'ไม่สามารถโหลดข้อมูลภารกิจได้', color: 'negative' });
  } finally {
    loading.value = false;
  }
};

const loadTaskData = async () => {
  try {
    if (task.value?.type === 'ATTENDANCE') {
      const res = await api.get(`/api/tasks/${token}/students`);
      if (res.data.success) {
        students.value = res.data.data.filter((s: Student) => {
          const matchGrade = String(s.grade) === String(task.value?.target_grade);
          const matchRoom = String(s.room) === String(task.value?.target_room);
          return matchGrade && matchRoom;
        });
        
        students.value.forEach(s => { 
          if (!attendanceSelections[s.id]) {
            attendanceSelections[s.id] = 'P_PRESENT'; 
          }
        });
        
        await loadHistory();
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const loadHistory = async () => {
  try {
    const dateToFetch = currentTab.value === 'today' ? new Date().toISOString().split('T')[0] : historyDate.value;
    const hRes = await api.get(`/api/tasks/${token}/history?date=${dateToFetch}`);
    const statusMap: Record<number, string> = { 1: 'P_PRESENT', 2: 'P_ABSENT', 3: 'P_LATE' };
    
    if (hRes.data.success) {
      if (currentTab.value === 'history') {
        historyRecords.value = hRes.data.data.map((r: { student_id: string, student_name: string, status: number }) => ({
          id: r.student_id,
          name: r.student_name,
          status: r.status
        })).sort((a: HistoryRecord, b: HistoryRecord) => a.name.localeCompare(b.name));
      } else {
        // Feed into selections for today
        hRes.data.data.forEach((r: { student_id: string, status: number }) => {
          if (Object.prototype.hasOwnProperty.call(attendanceSelections, r.student_id)) {
            if (!touchedSelections[r.student_id]) {
              attendanceSelections[r.student_id] = statusMap[r.status] || 'P_PRESENT';
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('loadHistory error:', err);
  }
};

const requestOTP = async () => {
  otpLoading.value = true;
  try {
    await api.post(`/api/tasks/${token}/otp`);
    otpSent.value = true;
    $q.notify({ message: 'ส่งรหัส OTP เรียบร้อยแล้ว', color: 'positive' });
  } catch (err: unknown) {
    const error = err as {
      response?: { data?: { message?: string | string[]; error?: string } };
    };
    const message = error.response?.data?.message;
    const normalizedMessage = Array.isArray(message) ? message[0] : message;
    if (normalizedMessage === 'No email found for this link') {
      const taskRes = await api.get(`/api/tasks/${token}`);
      task.value = taskRes.data;
      authRequired.value = false;
      await loadTaskData();
      $q.notify({
        message: 'ลิงก์นี้ไม่ได้ลงทะเบียนอีเมล จึงข้าม OTP อัตโนมัติ',
        color: 'warning'
      });
      return;
    }
    $q.notify({
      message: normalizedMessage || error.response?.data?.error || 'ส่ง OTP ไม่สำเร็จ',
      color: 'negative'
    });
  } finally {
    otpLoading.value = false;
  }
};

const verifyOTP = async () => {
  if (otpInput.value.length !== 6) return;
  otpLoading.value = true;
  try {
    const res = await api.post(`/api/tasks/${token}/verify`, { otp: otpInput.value });
    if (res.data.success) {
      // Re-fetch task to get unmasked student data
      const taskRes = await api.get(`/api/tasks/${token}`);
      task.value = taskRes.data;
      authRequired.value = false;
      visitMode.value = false;
      await loadTaskData();
    }
  } catch {
    $q.notify({ message: 'รหัส OTP ไม่ถูกต้อง', color: 'negative' });
  } finally {
    otpLoading.value = false;
  }
};

const setStatus = (id: string, status: string) => {
  attendanceSelections[id] = status;
  touchedSelections[id] = true; // Mark as locally edited
};

const submitVisit = async (status: string) => {
  console.log('[DEBUG] submitVisit called with status:', status);
  saving.value = true;
  visitData.status = status;
  try {
    console.log('[DEBUG] Sending submission:', { token, visitData });
    const res = await api.post(`/api/tasks/${token}/submit`, visitData);
    console.log('[DEBUG] Submission response:', res.data);
    if (res.data.success) {
      $q.notify({ message: 'บันทึกข้อมูลการลงพื้นที่แล้ว', color: 'positive' });
      showVisitResults.value = true;
    } else {
      $q.notify({ message: res.data.error || 'บันทึกไม่สำเร็จ', color: 'negative' });
    }
  } catch (err: unknown) {
    console.error('[DEBUG] Submission error:', err);
    const axiosErr = err as { response?: { data?: { message?: string } } };
    $q.notify({ message: axiosErr?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', color: 'negative' });
  } finally {
    saving.value = false;
  }
};

const startVisit = () => {
  visitMode.value = true;
};

const attendanceStats = computed(() => {
  const stats = { present: 0, late: 0, absent: 0 };
  
  if (currentTab.value === 'today') {
    students.value.forEach((s: Student) => {
      const status = attendanceSelections[s.id] || 'P_PRESENT';
      if (status === 'P_PRESENT') stats.present++;
      else if (status === 'P_LATE') stats.late++;
      else if (status === 'P_ABSENT') stats.absent++;
    });
  } else {
    historyRecords.value.forEach((s: HistoryRecord) => {
      if (s.status === 1) stats.present++;
      else if (s.status === 3) stats.late++;
      else if (s.status === 2) stats.absent++;
    });
  }
  return stats;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatusBadgeStyle = (item: any) => {
  const status = item && 'status' in item ? item.status : 1;
  if (status === 1) return 'background: #dcfce7; color: #15803d;';
  if (status === 2) return 'background: #fee2e2; color: #b91c1c;';
  return 'background: #fef3c7; color: #b45309;';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatusLabel = (item: any) => {
  const status = item && 'status' in item ? item.status : 1;
  return status === 1 ? 'มา' : status === 2 ? 'ขาด' : 'สาย';
};

const canDelegate = computed(() => {
  if (!task.value) return false;
  const depth = task.value.delegation_depth ?? 0;
  const maxDepth = task.value.max_delegation_depth ?? 3;
  return depth < maxDepth;
});

const saveAttendance = async () => {
  saving.value = true;
  const records = Object.entries(attendanceSelections).map(([id, status]) => ({
    student_id: id,
    status
  }));

  try {
    const res = await api.post(`/api/tasks/${token}/attendance`, { records });
    if (res.data.success) {
      $q.notify({ message: 'บันทึกข้อมูลสำเร็จ', color: 'positive' });
      // Clear touched state
      for (const key in touchedSelections) {
         delete touchedSelections[key];
      }
      await fetchData();
    }
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาดในการบันทึก', color: 'negative' });
  } finally {
    saving.value = false;
  }
};

 const startCountdown = (expiry: Date | null) => {
  if (!expiry) return;

  const expiryDate = typeof expiry === 'string' ? new Date(expiry) : expiry;

  const update = () => {
    const now = new Date().getTime();
    const diff = expiryDate.getTime() - now;
    if (diff <= 0) {
      isExpired.value = true;
      countdownText.value = 'หมดอายุแล้ว';
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    countdownText.value = `${h > 0 ? h + 'ชม. ' : ''}${m}นาที ${s}วินาที`;
  };
  update();
  timer = setInterval(update, 1000);
};

const getGmapsUrl = () => {
  if (task.value?.student_lat == null || task.value?.student_lng == null) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${task.value.student_lat},${task.value.student_lng}`;
};

const getEmbedMapUrl = () => {
  if (task.value?.student_lat == null || task.value?.student_lng == null) return '';
  return `https://maps.google.com/maps?q=${task.value.student_lat},${task.value.student_lng}&z=15&output=embed`;
};

onMounted(() => {
  void fetchData();
  
  polling = setInterval(() => {
    if (task.value?.type === 'ATTENDANCE') {
      if (currentTab.value === 'today') void loadTaskData();
      else void loadHistory();
    }
  }, 5000); // 5 seconds
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (polling) {
    clearInterval(polling);
    polling = null;
  }
});
</script>

<style lang="scss" scoped>
.guest-page {
  background-color: #f4f7fe;
  min-height: 100vh;
}

.guest-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 3rem 1.5rem;
  text-align: center;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 30px rgba(30, 64, 175, 0.2);
  position: relative;

  h1 { font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .subtitle { opacity: 0.9; font-size: 1rem; font-weight: 600; }
}

.expiry-box {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px 24px;
  border-radius: 99px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  color: #ef4444;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  border: 1.5px solid #fee2e2;

  &.expired { color: #94a3b8; border-color: #f1f5f9; }
}

.container {
  max-width: 600px;
  margin: 1.5rem auto 0;
}

/* Forms */
.form-group {
    margin-bottom: 20px;
    text-align: left;

    label {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        min-height: 120px;
        transition: all 0.2s;

        &:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
    }
}

/* OTP */
.otp-container {
  background: white;
  padding: 2.5rem;
  border-radius: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.otp-icon { font-size: 3.5rem; color: #2563eb; margin-bottom: 1.5rem; }
.otp-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }
.otp-desc { color: #64748b; font-size: 1rem; margin-bottom: 2.5rem; line-height: 1.6; }

.otp-input {
  width: 100%;
  padding: 1.25rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 800;
  outline: none;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
}

.resend-link { color: #2563eb; font-weight: 700; cursor: pointer; text-decoration: underline; }

/* Search Bar */
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
    color: #2563eb;
  }
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 38px;
  border-radius: 99px;
  border: 1.5px solid #e2e8f0;
  background: white;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2rem 0 1.5rem;
}

.stat-mini-card {
  background: white;
  padding: 1rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border-bottom: 5px solid transparent;

  &.present { border-color: #22c55e; }
  &.late { border-color: #eab308; }
  &.absent { border-color: #ef4444; }

  .label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
}

/* Student List */
.student-list { display: flex; flex-direction: column; gap: 0.75rem; padding-bottom: 120px; }
.student-card {
  background: white; border-radius: 20px; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}

.student-info { display: flex; align-items: center; gap: 1rem; }
.student-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: #f1f5f9; display: flex; align-items: center;
    justify-content: center; font-weight: 800; color: #94a3b8; font-size: 1.2rem;
}
.student-name { font-weight: 800; color: #1e293b; font-size: 1rem; }
.student-id { font-size: 0.8rem; color: #94a3b8; }

.status-options { display: flex; gap: 0.5rem; }
.status-btn {
  flex: 1; padding: 10px 4px; border-radius: 12px; border: 1.5px solid #e2e8f0;
  background: white; color: #64748b; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s; display: flex;
  align-items: center; justify-content: center; gap: 6px;

  &.present.active { background: #dcfce7; color: #15803d; border-color: #15803d; }
  &.absent.active { background: #fee2e2; color: #b91c1c; border-color: #b91c1c; }
  &.late.active { background: #fef3c7; color: #b45309; border-color: #b45309; }
}

/* Floating Footer */
.floating-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
  padding: 1rem; border-top: 1px solid #e2e8f0; z-index: 1000;
}

.btn-save {
  width: 100%; padding: 1.25rem; border-radius: 20px;
  background: #1e40af; color: white; font-weight: 800;
  font-size: 1.1rem; border: none;
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
}

/* Visit UI */
.info-row {
  display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;
  &:last-child { border-bottom: none; }
  .label { font-weight: 700; color: #64748b; font-size: 0.9rem; }
  .value { font-weight: 600; color: #1e293b; text-align: right; }
}

.map-frame {
  width: 100%;
  height: 220px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

/* Tabs and Wide Layout for Attendance dashboard resemblance */
.container.wide {
  max-width: 1000px !important;
}

.tabs-container {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
  white-space: nowrap;
  margin-bottom: 1.5rem;
  
  &::-webkit-scrollbar { display: none; }
}

.tab-item {
  padding: 0.75rem 0;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  
  &:hover { color: #3b82f6; }
  
  &.active {
    color: #2563eb;
    &::after {
      content: '';
      position: absolute;
      bottom: -2px; left: 0; right: 0;
      height: 3px;
      background: #2563eb;
      border-radius: 3px;
    }
  }
}

@media (min-width: 600px) {
  .container.wide .student-card {
    display: grid;
    grid-template-columns: 2.5fr 3fr;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .guest-header { padding: 2rem 1rem 2.5rem; }
  .otp-container { padding: 1.5rem; }
  .stat-mini-card { padding: 0.75rem; .value { font-size: 1.25rem; } }
}
</style>
