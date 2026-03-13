<template>
  <q-page class="q-pa-lg">
    <div style="max-width: 1000px; margin: 0 auto;">
      
      <!-- Sticky Header Area -->
      <div class="sticky-header bg-white q-pb-md">
        <!-- Tabs -->
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
            @click="currentTab = 'history'"
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
            <div class="col-auto">
              <select v-model="filters.grade" class="filter-select">
                <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.label">{{ gl.label }}</option>
              </select>
            </div>
            <div class="col-auto">
              <select v-model="filters.room" class="filter-select">
                <option v-for="r in rooms" :key="r" :value="r">ห้อง {{ r }}</option>
              </select>
            </div>
            
            <div v-if="currentTab === 'history'" class="col-auto">
              <div class="date-picker-container">
                <i class="far fa-calendar-alt" style="color: #64748b;"></i>
                <input type="date" v-model="historyDate" class="date-picker-input">
              </div>
            </div>
          </div>

          <q-space class="gt-xs" />

          <div v-if="currentTab === 'today'" class="col-12 col-sm-auto">
            <q-btn 
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
          </div>
        </div>
      </div>

      <!-- History Stats -->
      <div v-if="currentTab === 'history'" class="stats-cards q-mb-lg">
        <div class="stat-card-mini">
          <span class="label">นักเรียนทั้งหมด</span>
          <span class="value">{{ filteredHistory.length }}</span>
        </div>
        <div class="stat-card-mini" style="border-left: 5px solid #22c55e;">
          <span class="label">มา</span>
          <span class="value">{{ historyStats.present }}</span>
        </div>
        <div class="stat-card-mini" style="border-left: 5px solid #ef4444;">
          <span class="label">ขาด</span>
          <span class="value">{{ historyStats.absent }}</span>
        </div>
        <div class="stat-card-mini" style="border-left: 5px solid #eab308;">
          <span class="label">สาย</span>
          <span class="value">{{ historyStats.late }}</span>
        </div>
      </div>

      <!-- Table Header (Desktop) -->
      <div class="table-header d-none-mobile" v-if="filteredDisplayList.length > 0">
        <div>ชื่อ - นามสกุล</div>
        <div class="text-center">{{ currentTab === 'today' ? 'ขาด' : 'วันที่ประมวลผล' }}</div>
        <div class="text-center">{{ currentTab === 'today' ? 'สาย' : '-' }}</div>
        <div class="text-right">สถานะเช็คชื่อ</div>
      </div>

      <!-- Student List -->
      <div class="student-list">
        <div v-if="filteredDisplayList.length === 0" class="empty-state-box">
          <i class="fas fa-layer-group"></i>
          <h2>พร้อมเริ่มเช็คชื่อหรือยัง?</h2>
          <p>กรุณาเลือก <strong>ชั้นเรียน</strong> และ <strong>ห้อง</strong> เพื่อแสดงรายชื่อนักเรียนครับ</p>
        </div>

        <div 
          v-for="s in filteredDisplayList" 
          :key="s.id" 
          class="student-card"
        >
          <div class="student-info">
            <div class="student-avatar">{{ s.name[0] }}</div>
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
            <div class="count-badge" style="font-size: 0.8rem; color: #94a3b8;">{{ 'check_date' in s ? s.check_date || '-' : '-' }}</div>
            <div class="count-badge">-</div>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

interface Student {
  id: string;
  name: string;
  grade: string;
  room: string;
  total_late?: number;
  total_absent?: number;
}

interface AttendanceRecord {
  id: string;
  name: string;
  grade: string;
  room: string;
  status: string;
  check_date?: string;
  PersonID_Onec?: string;
}

interface GradeLevel {
  id: number;
  label: string;
  category: string;
}

const $q = useQuasar();
const currentTab = ref('today');
const searchQuery = ref('');
const historyDate = ref(new Date().toISOString().split('T')[0]);
const saving = ref(false);

const students = ref<Student[]>([]);
const gradeLevels = ref<GradeLevel[]>([]);
const history = ref<AttendanceRecord[]>([]);
const rooms = ref<string[]>([]);
const attendanceSelections = reactive<Record<string, string>>({});

const filters = reactive({
  grade: '',
  room: '1'
});

const fetchGradeLevels = async () => {
  try {
    const res = await api.get('/api/attendance/grade-levels');
    gradeLevels.value = res.data.data;
    if (gradeLevels.value.length > 0 && !filters.grade) {
      filters.grade = gradeLevels.value[0]?.label || '';
    }
    if (filters.grade) await fetchRooms();
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const fetchStudents = async () => {
  if (!filters.grade || !filters.room) return;
  try {
    const res = await api.get('/api/attendance/students', {
      params: { 
        grade: filters.grade,
        room: filters.room
      }
    });
    students.value = res.data.data;
    
    // Default everyone to present if not set
    students.value.forEach(s => {
      if (!attendanceSelections[s.id]) {
        attendanceSelections[s.id] = 'P_PRESENT';
      }
    });
  } catch (err) {
    console.error('Fetch students error:', err);
  }
};

const fetchTodayRecords = async () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await api.get(`/api/attendance/history?date=${today}`);
    const data = res.data.data;
    data.forEach((r: AttendanceRecord) => {
      if (r.status) attendanceSelections[r.PersonID_Onec || r.id] = r.status;
    });
  } catch (err) {
    console.error('Fetch today records error:', err);
  }
};

const fetchRooms = async () => {
  if (!filters.grade) return;
  try {
    const res = await api.get('/api/attendance/rooms', { params: { grade: filters.grade } });
    rooms.value = res.data.data;
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
    const res = await api.get(`/api/attendance/history?date=${historyDate.value}`);
    history.value = res.data.data;
  } catch (err) {
    console.error('Fetch history error:', err);
  }
};

const setStatus = (id: string, status: string) => {
  attendanceSelections[id] = status;
};

const saveAttendance = async () => {
  saving.value = true;
  const records = filteredStudents.value.map(s => ({
    student_id: s.id,
    status: attendanceSelections[s.id] || 'P_PRESENT'
  }));
  
  try {
    const res = await api.post('/api/attendance', { records });
    if (res.data.success) {
      $q.notify({ message: 'บันทึกสำเร็จ', color: 'positive', position: 'top' });
      await fetchStudents();
    }
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาด', color: 'negative' });
  } finally {
    saving.value = false;
  }
};

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || s.id.includes(searchQuery.value);
    return matchesSearch;
  });
});

const filteredHistory = computed(() => {
  return history.value.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || h.id.includes(searchQuery.value);
    const matchesGrade = h.grade === filters.grade;
    const matchesRoom = h.room === filters.room;
    return matchesSearch && matchesGrade && matchesRoom;
  });
});

const filteredDisplayList = computed(() => {
  return currentTab.value === 'today' ? filteredStudents.value : (filteredHistory.value as AttendanceRecord[]);
});

const historyStats = computed(() => {
  const stats = { present: 0, absent: 0, late: 0 };
  filteredHistory.value.forEach(h => {
    if (h.status === 'P_PRESENT') stats.present++;
    else if (h.status === 'P_ABSENT') stats.absent++;
    else if (h.status === 'P_LATE') stats.late++;
  });
  return stats;
});

const getStatusClass = (status: string) => {
  if (status === 'P_PRESENT') return 'present';
  if (status === 'P_ABSENT') return 'absent';
  if (status === 'P_LATE') return 'late';
  return 'none';
};

const getStatusIcon = (status: string) => {
  if (status === 'P_PRESENT') return 'fa-check';
  if (status === 'P_ABSENT') return 'fa-times';
  if (status === 'P_LATE') return 'fa-clock';
  return 'fa-question-circle';
};

const getStatusLabel = (status: string) => {
  if (status === 'P_PRESENT') return 'มาเรียน';
  if (status === 'P_ABSENT') return 'ขาด';
  if (status === 'P_LATE') return 'สาย';
  return 'ไม่ได้เช็คชื่อ';
};

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

onMounted(async () => {
  await fetchGradeLevels();
  await fetchStudents();
  await fetchTodayRecords();
});
</script>

<style lang="scss" scoped>
/* Tabs Styling */
.tabs-container {
    display: flex;
    gap: 2rem;
    border-bottom: 1px solid #e2e8f0;
}

.tab-item {
    padding: 0.75rem 0;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    
    &.active {
        color: #2563eb;
        
        &::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 3px;
            background: #2563eb;
            border-radius: 3px 3px 0 0;
        }
    }
}

/* Search Row */
.search-container {
    position: relative;
    width: 100%;
    
    i {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
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
    transition: border-color 0.2s;
    
    &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
}

.filter-select {
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: white;
    outline: none;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e40af;
    cursor: pointer;
}

.date-picker-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
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

/* History Stats */
.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
}

.stat-card-mini {
    background: white;
    padding: 1.25rem;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .value { font-size: 1.5rem; font-weight: 800; }
}

/* Table Header */
.table-header {
    display: grid;
    grid-template-columns: 2.5fr 1fr 1fr 2fr;
    padding: 0 1.5rem 0.75rem;
    font-weight: 700;
    color: #64748b;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.student-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 5rem;
}

.student-card {
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: grid;
    grid-template-columns: 2.5fr 1fr 1fr 2fr;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    border: 1px solid #f1f5f9;
}

.student-info { display: flex; align-items: center; gap: 1rem; }
.student-avatar { 
    width: 44px; height: 44px; border-radius: 50%; 
    background: #f1f5f9; display: flex; align-items: center; 
    justify-content: center; font-weight: 800; color: #94a3b8; 
}
.student-details {
    h3 { font-size: 1rem; font-weight: 700; margin: 0; color: #1e293b; }
    .student-id { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
}

.count-badge { font-size: 1rem; font-weight: 700; color: #475569; text-align: center; }

.attendance-options { display: flex; justify-content: flex-end; gap: 0.5rem; }

.status-btn {
    padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: white;
    color: #64748b; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px; min-width: 76px;
    
    &.present:hover, &.present.active { background: #dcfce7; color: #15803d; border-color: #15803d; }
    &.absent:hover, &.absent.active { background: #fee2e2; color: #b91c1c; border-color: #b91c1c; }
    &.late:hover, &.late.active { background: #fef3c7; color: #b45309; border-color: #b45309; }
}

.status-display {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.85rem;
    
    &.present { background: #dcfce7; color: #15803d; }
    &.absent { background: #fee2e2; color: #b91c1c; }
    &.late { background: #fef3c7; color: #b45309; }
    &.none { background: #f1f5f9; color: #94a3b8; }
}

.save-bar { 
    position: fixed; bottom: 1.5rem; left: 0; right: 0; 
    z-index: 1000; padding: 0 1.5rem; display: flex; justify-content: flex-end;
    pointer-events: none; // Allow clicks through container
}
.btn-save {
    pointer-events: auto; // Re-enable clicks for button
    background: linear-gradient(135deg, #2563eb, #1e40af); 
    color: white; padding: 16px 32px; border-radius: 16px;
    font-weight: 800; font-size: 1.1rem; display: flex; 
    align-items: center; gap: 12px; border: none; cursor: pointer; 
    transition: all 0.2s; box-shadow: 0 10px 20px -5px rgba(30, 64, 175, 0.4);
    
    &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(30, 64, 175, 0.5); }
    &:active:not(:disabled) { transform: scale(0.98); }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
}

.empty-state-box {
    text-align: center; padding: 4rem 2rem; color: #64748b; 
    background: white; border-radius: 16px; border: 2.5px dashed #e2e8f0; margin-top: 1rem;
    
    i { font-size: 3.5rem; margin-bottom: 1.5rem; color: #3b82f6; opacity: 0.8; }
    h2 { color: #1e3a8a; margin-bottom: 0.5rem; font-weight: 800; font-size: 1.5rem; }
    p { font-size: 1rem; color: #64748b; }
}

@media (max-width: 1024px) {
    .save-bar { left: 0; }
}

.sticky-header {
    position: sticky;
    top: 0;
    z-index: 100;
}

.action-btn-top {
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

@media (max-width: 768px) {
    .d-none-mobile { display: none !important; }
    .student-card { grid-template-columns: 1fr; gap: 1rem; border-radius: 16px; padding: 1.25rem; }
    .count-row { display: flex; justify-content: space-around; background: #f8fafc; padding: 0.75rem; border-radius: 12px; }
    .count-item { display: flex; flex-direction: column; align-items: center; }
    .count-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    .attendance-options { justify-content: space-between; gap: 0.5rem; }
    .status-btn { flex: 1; padding: 10px 4px; min-width: 0; font-size: 0.8rem; }
    .full-width-mobile { width: 100%; }
}
</style>
