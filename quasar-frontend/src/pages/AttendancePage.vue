<template>
  <q-page class="q-pa-lg attendance-page">
    <div class="page-container">
      
      <!-- Sticky Header Area -->
      <div class="sticky-header">
        <!-- Tabs -->
        <div class="tabs-container q-mb-lg">
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'today' }" 
            @click="currentTab = 'today'; fetchTodayRecords()"
          >
            เช็คชื่อวันนี้
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTab === 'history' }" 
            @click="currentTab = 'history'; fetchHistory()"
          >
            ประวัติการเช็คชื่อ
          </div>
        </div>

        <!-- Filters & Search & Actions -->
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-4">
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

          <div class="col-12 col-sm-auto row items-center q-col-gutter-sm">
            <div class="col-12 col-sm-auto">
              <q-btn 
                outline 
                color="primary" 
                class="filter-select-btn full-width"
                @click="showFilterDialog = true"
                :disable="isSchoolLocked"
              >
                {{ selectedSchoolName }}
                <i class="fas fa-chevron-down q-ml-sm" style="font-size: 0.7rem;"></i>
              </q-btn>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.grade" class="filter-select full-width" :disabled="isGradeLocked">
                <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.label">{{ gl.label }}</option>
              </select>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.room" class="filter-select full-width" :disabled="isRoomLocked">
                <option v-for="r in rooms" :key="r" :value="r">ห้อง {{ r }}</option>
              </select>
            </div>
            
            <div class="col-12 col-sm-auto">
              <div class="student-count-chip full-width justify-center">
                <i class="fas fa-users"></i>
                <span>{{ filteredDisplayList.length }} คน</span>
              </div>
            </div>
          </div>

          <q-space class="gt-xs" />

          <div class="col-12 col-sm-auto">
            <!-- Save Button (Today Tab) -->
            <q-btn 
              v-if="currentTab === 'today'"
              unelevated 
              color="primary" 
              class="full-width-mobile action-btn-top"
              :loading="saving"
              @click="saveAttendance"
              padding="10px 24px"
            >
              <i class="fas fa-save q-mr-sm"></i>
              บันทึกข้อมูล
            </q-btn>

            <!-- Date Picker (History Tab) -->
            <div v-if="currentTab === 'history'" class="date-picker-container">
              <i class="far fa-calendar-alt" style="color: #64748b;"></i>
              <input type="date" v-model="historyDate" class="date-picker-input">
            </div>
          </div>
        </div>
      </div>

      <AttendanceHistoryStats
        v-if="currentTab === 'history'"
        :total="filteredHistory.length"
        :stats="historyStats"
      />

      <!-- Table Header (Desktop) -->
      <div class="table-header d-none-mobile" v-if="filteredDisplayList.length > 0">
        <div>ชื่อ - นามสกุล</div>
        <div class="text-center">{{ currentTab === 'today' ? 'ขาด' : '' }}</div>
        <div class="text-center">{{ currentTab === 'today' ? 'สาย' : '' }}</div>
        <div class="text-right">สถานะเช็คชื่อ</div>
      </div>

      <!-- Student List -->
      <div class="student-list">
        <div v-if="filteredDisplayList.length === 0" class="empty-state-box">
          <div class="empty-icon-wrapper">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h2>พร้อมเริ่มเช็คชื่อหรือยัง?</h2>
          <p>กรุณาเลือก <strong>ชั้นเรียน</strong> และ <strong>ห้อง</strong> เพื่อแสดงรายชื่อนักเรียนครับ</p>
        </div>

        <div 
          v-for="(s, index) in filteredDisplayList" 
          :key="s.id" 
          class="student-card"
          :style="{ animationDelay: `${index * 30}ms` }"
        >
          <div class="student-info">
            <div 
              class="student-avatar" 
              :style="getAvatarGradient(s.name)"
            >{{ s.name[0] }}</div>
            <div class="student-details">
              <h3>{{ s.name }}</h3>
              <div class="student-id">รหัส: {{ s.id }}</div>
            </div>
          </div>

          <template v-if="currentTab === 'today'">
            <div class="count-badge d-none-mobile">{{ 'total_absent' in s ? s.total_absent || 0 : 0 }}</div>
            <div class="count-badge d-none-mobile">{{ 'total_late' in s ? s.total_late || 0 : 0 }}</div>
            <div class="attendance-options">
              <button 
                @click="setStatus(s.id, 'P_PRESENT')" 
                class="status-btn present" 
                :class="{ active: (attendanceSelections[s.id] || 'P_PRESENT') === 'P_PRESENT' }"
              >
                <i class="fas fa-check"></i> มา
              </button>
              <button 
                @click="setStatus(s.id, 'P_ABSENT')" 
                class="status-btn absent" 
                :class="{ active: attendanceSelections[s.id] === 'P_ABSENT' }"
              >
                <i class="fas fa-times"></i> ขาด
              </button>
              <button 
                @click="setStatus(s.id, 'P_LATE')" 
                class="status-btn late" 
                :class="{ active: attendanceSelections[s.id] === 'P_LATE' }"
              >
                <i class="fas fa-clock"></i> สาย
              </button>
            </div>
          </template>

          <template v-else>
            <div></div>
            <div></div>
            <div class="text-right">
              <div :class="['status-display', getStatusClass('status' in s ? s.status : 'NONE')]">
                <i :class="['fas', getStatusIcon('status' in s ? s.status : 'NONE')]"></i>
                {{ getStatusLabel('status' in s ? s.status : 'NONE') }}
              </div>
            </div>
          </template>
        </div>
      </div>


    </div>

    <!-- Advanced Filter Dialog -->
    <q-dialog v-model="showFilterDialog" persistent>
      <q-card style="min-width: 350px; border-radius: 20px;" class="q-pa-md">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 font-weight-bold color-primary">ค้นหาโรงเรียน</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="q-gutter-md">
            <!-- Province -->
            <div>
              <label class="q-mb-sm block text-caption text-weight-bold text-grey-7">จังหวัด</label>
              <select v-model="tempFilters.province" class="filter-select full-width" @change="onProvinceChange" :disabled="isProvinceLocked">
                <option value="">เลือกจังหวัด</option>
                <option v-for="p in locationData.provinces" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <!-- District -->
            <div>
              <label class="q-mb-sm block text-caption text-weight-bold text-grey-7">อำเภอ</label>
              <select v-model="tempFilters.district" class="filter-select full-width" @change="onDistrictChange" :disabled="!tempFilters.province">
                <option value="">เลือกอำเภอ</option>
                <option v-for="d in filteredDistricts" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <!-- Sub-district -->
            <div>
              <label class="q-mb-sm block text-caption text-weight-bold text-grey-7">ตำบล</label>
              <select v-model="tempFilters.subDistrict" class="filter-select full-width" @change="onSubDistrictChange" :disabled="!tempFilters.district">
                <option value="">เลือกตำบล</option>
                <option v-for="sd in filteredSubDistricts" :key="sd" :value="sd">{{ sd }}</option>
              </select>
            </div>

            <!-- School -->
            <div>
              <label class="q-mb-sm block text-caption text-weight-bold text-grey-7">โรงเรียน</label>
              <select v-model="tempFilters.schoolId" class="filter-select full-width" :disabled="!tempFilters.subDistrict">
                <option value="">เลือกโรงเรียน</option>
                <option v-for="s in tempSchools" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
              </select>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup />
          <q-btn 
            unelevated 
            label="ตกลง" 
            color="primary" 
            @click="applyFilters"
            :disabled="!tempFilters.schoolId"
            padding="8px 24px"
            class="action-btn-top"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Auto-Case Alert Dialog -->
    <q-dialog v-model="newCasesDialog.show">
      <q-card style="min-width: 360px; max-width: 92vw;">
        <q-card-section class="row items-center q-pb-none">
          <i class="fa-solid fa-triangle-exclamation text-amber-8 q-mr-sm" style="font-size:1.4rem;"></i>
          <div class="text-h6 text-amber-9">แจ้งเตือน: สร้างเคสอัตโนมัติ</div>
        </q-card-section>
        <q-card-section>
          <p class="text-body2 q-mb-sm">ระบบสร้างเคสใหม่อัตโนมัติสำหรับนักเรียนต่อไปนี้:</p>
          <q-list bordered separator>
            <q-item v-for="c in newCasesDialog.cases" :key="c.case_id">
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ c.student_name }}</q-item-label>
                <q-item-label caption>{{ c.student_school }}</q-item-label>
                <q-item-label caption class="text-amber-8">{{ c.reason_flagged }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ปิด" v-close-popup />
          <q-btn color="primary" label="ดูรายการเคส" to="/" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confetti Celebration -->
    <div v-if="showConfetti" class="confetti-container">
      <div 
        v-for="i in 50" 
        :key="i"
        class="confetti-piece"
        :style="{
          left: `${Math.random() * 100}%`,
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][Math.floor(Math.random() * 6)],
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${2 + Math.random() * 1}s`
        }"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import AttendanceHistoryStats from '../components/attendance/AttendanceHistoryStats.vue';
import { useAttendanceFilters } from '../composables/useAttendanceFilters';
import { useAttendanceHistory } from '../composables/useAttendanceHistory';
import { useAttendanceSubmission } from '../composables/useAttendanceSubmission';
import { useUserStore } from '../composables/useUserStore';
import { useDataScopeLock } from '../composables/useDataScopeLock';
import { attendanceService } from '../services/attendanceService';
import type {
  AttendanceAutoCase,
  AttendanceFilter,
  AttendanceHistoryRecord,
  AttendanceStudent,
} from '../types/attendance';
import {
  buildAttendanceHistoryStats,
  getAttendanceStatusClass,
  getAttendanceStatusIcon,
  getAttendanceStatusLabel,
} from '../utils/attendancePresentation';
import { getStudentAvatarGradient } from '../utils/studentPresentation';

const $q = useQuasar();
const currentTab = ref('today');
const searchQuery = ref('');
const showConfetti = ref(false);
const { user, loadUser } = useUserStore();
const userScope = computed(() => user.value?.data_scope);
const {
  isProvinceLocked,
  isSchoolLocked,
  isGradeLocked,
  isRoomLocked,
  lockedProvinceValue,
  lockedSchoolValue,
  lockedGradeValue,
  lockedRoomValue,
} = useDataScopeLock(userScope);
const {
  gradeLevels,
  schools,
  rooms,
  tempSchools,
  tempFilters,
  locationData,
  filteredDistricts,
  filteredSubDistricts,
  loadLocations,
  loadAllSchools,
  loadGradeLevels,
  loadRooms,
  handleProvinceFilterChange,
  handleDistrictFilterChange,
  handleSubDistrictFilterChange,
} = useAttendanceFilters();
const {
  history,
  historyDate,
  fetchHistory: loadHistory,
  fetchTodayRecords: loadTodayRecords,
} = useAttendanceHistory();
const {
  saving,
  attendanceSelections,
  initializeSelections,
  syncSelectionsFromHistory,
  setStatus,
  saveAttendance: submitAttendance,
} = useAttendanceSubmission();

const newCasesDialog = reactive<{ show: boolean; cases: AttendanceAutoCase[] }>({
  show: false,
  cases: [],
});

const getAvatarGradient = getStudentAvatarGradient;
const getStatusClass = getAttendanceStatusClass;
const getStatusIcon = getAttendanceStatusIcon;
const getStatusLabel = getAttendanceStatusLabel;

const triggerConfetti = () => {
  showConfetti.value = true;
  setTimeout(() => { showConfetti.value = false; }, 2500);
};

const students = ref<AttendanceStudent[]>([]);

const filters = reactive<Pick<AttendanceFilter, 'schoolId' | 'grade' | 'room'>>({
  schoolId: '',
  grade: '',
  room: '1',
});

const showFilterDialog = ref(false);

const applyActiveScope = () => {
  if (isProvinceLocked.value && lockedProvinceValue.value) {
    if (tempFilters.province !== lockedProvinceValue.value) {
      tempFilters.province = lockedProvinceValue.value;
      onProvinceChange();
    }
  }

  if (isSchoolLocked.value && lockedSchoolValue.value !== null) {
    const nextSchoolId = String(lockedSchoolValue.value);
    if (filters.schoolId !== nextSchoolId) {
      filters.schoolId = nextSchoolId;
    }
  }

  if (isGradeLocked.value && lockedGradeValue.value !== null && gradeLevels.value.length > 0) {
    const lockedGrade = gradeLevels.value.find(g => g.id === lockedGradeValue.value);
    if (lockedGrade && filters.grade !== lockedGrade.label) {
      filters.grade = lockedGrade.label;
    }
  }

  if (isRoomLocked.value && lockedRoomValue.value !== null) {
    const nextRoom = String(lockedRoomValue.value);
    if (filters.room !== nextRoom) {
      filters.room = nextRoom;
    }
  }
};

const selectedSchoolName = computed(() => {
  if (!filters.schoolId) return 'เลือกโรงเรียน';
  const school = schools.value.find(s => String(s.id) === filters.schoolId);
  return school ? school.name : 'เลือกโรงเรียน';
});

const fetchLocations = async () => {
  try {
    await loadLocations();
  } catch (err) {
    console.error('Fetch locations error:', err);
  }
};

const onProvinceChange = () => {
  handleProvinceFilterChange({ clearTempSchools: true });
};

const onDistrictChange = () => {
  handleDistrictFilterChange({ clearTempSchools: true });
};

const onSubDistrictChange = async () => {
  try {
    await handleSubDistrictFilterChange({ clearTempSchoolsWhenEmpty: true });
  } catch (err) {
    console.error('Fetch temp schools error:', err);
  }
};

const applyFilters = () => {
  const previousSchoolId = filters.schoolId;
  filters.schoolId = tempFilters.schoolId;
  // If school not in schools list, add it or just rely on fetchStudents
  // We should refresh the 'schools' list so the computed 'selectedSchoolName' works
  const chosen = tempSchools.value.find(s => String(s.id) === filters.schoolId);
  if (chosen && !schools.value.find(s => s.id === chosen.id)) {
    schools.value.push(chosen);
  }
  showFilterDialog.value = false;
  if (previousSchoolId === filters.schoolId) {
    if (currentTab.value === 'today') {
      void fetchStudents();
      void fetchTodayRecords();
    } else {
      void fetchHistory();
    }
  }
};

const fetchGradeLevels = async () => {
  try {
    await loadGradeLevels();
    if (gradeLevels.value.length > 0 && !filters.grade) {
      filters.grade = gradeLevels.value[0]?.label || '';
    }
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const fetchSchools = async () => {
  try {
    await loadAllSchools();
    if (schools.value.length > 0 && !filters.schoolId) {
      const fallbackSchoolId =
        isSchoolLocked.value && lockedSchoolValue.value !== null
          ? String(lockedSchoolValue.value)
          : String(schools.value[0]?.id || '');
      filters.schoolId = fallbackSchoolId;
    }
  } catch (err) {
    console.error('Fetch schools error:', err);
  }
};

const fetchStudents = async () => {
  if (!filters.grade || !filters.room || !filters.schoolId) {
    students.value = [];
    return;
  }
  try {
    students.value = await attendanceService.getStudents({
      grade: filters.grade,
      room: filters.room,
      schoolId: filters.schoolId,
    });
    initializeSelections(students.value);
  } catch (err) {
    console.error('Fetch students error:', err);
  }
};

const fetchTodayRecords = async () => {
  try {
    const records = await loadTodayRecords();
    syncSelectionsFromHistory(records);
  } catch (err) {
    console.error('Fetch today records error:', err);
  }
};

const fetchRooms = async () => {
  if (!filters.grade || !filters.schoolId) {
    rooms.value = [];
    if (!isRoomLocked.value) {
      filters.room = '';
    }
    return;
  }
  try {
    await loadRooms(filters.grade, filters.schoolId);
    if (isRoomLocked.value && lockedRoomValue.value !== null) {
      filters.room = String(lockedRoomValue.value);
      return;
    }
    if (rooms.value.length > 0) {
      // If current room is not in the new rooms list, select the first one
      if (!rooms.value.includes(filters.room)) {
        filters.room = rooms.value[0] || '';
      }
    } else {
      rooms.value = [];
      filters.room = '';
    }
  } catch (err) {
    console.error('Fetch rooms error:', err);
  }
};

const fetchHistory = async () => {
  if (!historyDate.value) return;
  try {
    await loadHistory();
  } catch (err) {
    console.error('Fetch history error:', err);
  }
};

const saveAttendance = async () => {
  try {
    const response = await submitAttendance(filteredStudents.value);
    if (response.success) {
      triggerConfetti();
      $q.notify({
        message: 'บันทึกสำเร็จ! 🎉',
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        timeout: 2000
      });

      if (response.newCases?.length) {
        newCasesDialog.cases = response.newCases;
        newCasesDialog.show = true;
      }

      await fetchStudents();
      await fetchTodayRecords();
    }
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาด', color: 'negative' });
  }
};

const filteredStudents = computed(() => {
  return students.value
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || s.id.includes(searchQuery.value);
      return matchesSearch;
    })
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
});

const filteredHistory = computed(() => {
  return history.value
    .filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || h.id.includes(searchQuery.value);
      const matchesGrade = h.grade === filters.grade;
      const matchesRoom = h.room === filters.room;
      const matchesSchool = !filters.schoolId || String(h.school_id) === String(filters.schoolId);
      return matchesSearch && matchesGrade && matchesRoom && matchesSchool;
    })
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
});

const filteredDisplayList = computed(() => {
  return currentTab.value === 'today' ? filteredStudents.value : (filteredHistory.value as AttendanceHistoryRecord[]);
});

const historyStats = computed(() => buildAttendanceHistoryStats(filteredHistory.value));

watch(() => filters.schoolId, async () => {
  await fetchRooms();
  if (currentTab.value === 'today') void fetchStudents();
  else void fetchHistory();
});

watch(() => filters.grade, async () => {
  await fetchRooms();
  if (currentTab.value === 'today') void fetchStudents();
  else void fetchHistory();
});

watch(() => filters.room, () => {
  if (currentTab.value === 'today') void fetchStudents();
  else void fetchHistory();
});

watch(currentTab, (newTab) => {
  if (newTab === 'today') void fetchStudents();
  else void fetchHistory();
});

watch(historyDate, () => {
  void fetchHistory();
});

watch(showFilterDialog, (isOpen) => {
  if (isOpen && isProvinceLocked.value && lockedProvinceValue.value) {
    if (tempFilters.province !== lockedProvinceValue.value) {
      tempFilters.province = lockedProvinceValue.value;
      onProvinceChange();
    }
  }
});

watch(
  [() => user.value?.data_scope, () => gradeLevels.value.length],
  () => {
    applyActiveScope();
  },
  { immediate: true, deep: true }
);

let polling: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  loadUser();
  await fetchLocations();
  await fetchSchools(); 
  await fetchGradeLevels();
  applyActiveScope();

  await fetchRooms();
  await fetchStudents();
  await fetchTodayRecords();

  polling = setInterval(() => {
    if (currentTab.value === 'today') void fetchTodayRecords();
    else void fetchHistory();
  }, 5000); // 5 seconds
});

onUnmounted(() => {
  if (polling) clearInterval(polling);
});
</script>

<style lang="scss" scoped>
.attendance-page {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  min-height: 100vh;
  overflow-y: scroll; /* Prevent scrollbar layout shift */
}

.page-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
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

.tab-item {
  padding: 0.75rem 0;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
  }
  
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

.filter-select-btn {
  border-radius: 99px; /* full rounded */
  padding: 0 20px;
  height: 40px;
  min-height: 40px;
  font-weight: 700;
  text-transform: none;
  background: white;
  border: 1.5px solid #dbeafe; /* soft border */
  color: #1e40af;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.05);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:hover {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    transform: translateY(-1px);
    border-color: #3b82f6;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.color-primary {
  color: #1e40af;
}

.full-width {
  width: 100%;
}

.filter-select {
  padding: 0 36px 0 16px; /* space for custom arrow */
  height: 40px;
  border-radius: 99px; /* full rounded */
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


.date-picker-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0 16px;
  height: 40px; /* Match height of filter buttons */
  border-radius: 99px; /* Match rounded visual style */
  border: 1.5px solid #dbeafe; /* Match primary soft border */
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.05); /* Match subtle shadow */
  
  &:hover {
    border-color: #3b82f6;
    background-color: #f8fbff;
  }
}

.date-picker-input {
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.95rem;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card-mini {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  
  &.present {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    
    .stat-icon {
      color: #22c55e;
    }
    
    .value {
      color: #15803d;
    }
  }
  
  &.absent {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    
    .stat-icon {
      color: #ef4444;
    }
    
    .value {
      color: #b91c1c;
    }
  }
  
  &.late {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    
    .stat-icon {
      color: #f59e0b;
    }
    
    .value {
      color: #b45309;
    }
  }
  
  .stat-icon {
    font-size: 1.75rem;
    opacity: 0.9;
  }
  
  .label {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  
  .value {
    font-size: 2.75rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1;
  }
}

.table-header {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 2fr;
  padding: 0 1.5rem 0.75rem;
  font-weight: 700;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 5rem;
}

.student-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 2fr;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9;
  opacity: 0;
  animation: fade-in-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    transform: translateY(-2px);
    border-color: #e2e8f0;
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
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.student-details {
  h3 {
    font-size: 1.1rem;
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

.count-badge {
  font-size: 1rem;
  font-weight: 700;
  color: #475569;
  text-align: center;
}

.attendance-options {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.status-btn {
  padding: 8px 16px;
  border-radius: 99px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 80px;
  transition: all 0.15s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: scale(0.92);
  }
  
  &.present {
    &:hover, &.active {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #15803d;
      border-color: #22c55e;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
    }
    
    &.active {
      animation: pulse-success 0.4s ease-out;
    }
  }
  
  &.absent {
    &:hover, &.active {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #b91c1c;
      border-color: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }
    
    &.active {
      animation: pulse-success 0.4s ease-out;
    }
  }
  
  &.late {
    &:hover, &.active {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      border-color: #f59e0b;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
    
    &.active {
      animation: pulse-success 0.4s ease-out;
    }
  }
}

@keyframes pulse-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.status-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 99px;
  font-weight: 700;
  font-size: 0.85rem;
  
  &.present {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    color: #15803d;
  }
  
  &.absent {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #b91c1c;
  }
  
  &.late {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #b45309;
  }
  
  &.none {
    background: #f1f5f9;
    color: #94a3b8;
  }
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
    max-width: 320px;
    margin: 0 auto;
    line-height: 1.6;
    
    strong {
      color: #3b82f6;
      font-weight: 700;
    }
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
  transition: all 0.2s;

  i {
    color: #3b82f6;
    font-size: 0.95rem;
  }
}

.action-btn-top {
  border-radius: 99px;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
  
  &:active {
    transform: scale(0.96);
  }
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall 2.5s ease-out forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card-mini {
    padding: 1.25rem;
    
    .stat-icon {
      font-size: 1.5rem;
    }
    
    .value {
      font-size: 2rem;
    }
  }
  
  .d-none-mobile {
    display: none !important;
  }
  
  .student-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    border-radius: 20px;
    padding: 1.5rem;
  }
  
  .attendance-options {
    justify-content: space-between;
    gap: 0.5rem;
  }
  
  .status-btn {
    flex: 1;
    padding: 12px 8px;
    min-width: 0;
    font-size: 0.85rem;
  }
  
  .full-width-mobile {
    width: 100%;
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

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .stat-card-mini {
    padding: 1rem;
    
    .stat-icon {
      font-size: 1.25rem;
    }
    
    .value {
      font-size: 1.75rem;
    }
    
    .label {
      font-size: 0.65rem;
    }
  }
}
</style>
