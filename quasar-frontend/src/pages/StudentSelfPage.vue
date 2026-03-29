<template>
  <q-page class="student-self-page q-pa-lg">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">ข้อมูลการเข้าเรียนของฉัน</h1>
        <p class="page-subtitle">ดูประวัติการเข้าเรียนและสถิติของคุณ</p>
      </div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="3em" />
      </div>

      <template v-else-if="studentInfo">
        <div class="student-card">
          <div class="student-header">
            <div class="student-avatar" :style="avatarStyle">
              {{ studentInitial }}
            </div>
            <div class="student-info">
              <h2>{{ studentDisplayName }}</h2>
              <div class="student-meta">
                <span><i class="fas fa-id-card"></i> {{ studentInfo.PersonID_Onec }}</span>
                <span><i class="fas fa-school"></i> {{ studentInfo.school_name || '-' }}</span>
              </div>
              <div class="student-meta">
                <span><i class="fas fa-graduation-cap"></i> ชั้น {{ studentInfo.grade_label || studentInfo.grade || '-' }}</span>
                <span><i class="fas fa-door-open"></i> {{ formatStudentRoom(studentInfo.room) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon present">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-value">{{ attendanceStats.present }}</div>
            <div class="stat-label">วันที่มาเรียน</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon absent">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-value">{{ attendanceStats.absent }}</div>
            <div class="stat-label">วันที่ขาด</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon late">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ attendanceStats.late }}</div>
            <div class="stat-label">วันที่มาสาย</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon rate">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="stat-value">{{ attendanceRate }}%</div>
            <div class="stat-label">อัตราการเข้าเรียน</div>
          </div>
        </div>

        <div class="attendance-history">
          <h3 class="section-title">ประวัติการเข้าเรียนล่าสุด</h3>
          
          <div v-if="attendanceHistory.length === 0" class="empty-state">
            <i class="fas fa-calendar-check"></i>
            <p>ยังไม่มีข้อมูลการเข้าเรียน</p>
          </div>

          <div v-else class="history-list">
            <div 
              v-for="(record, index) in attendanceHistory" 
              :key="`${record.id ?? 'record'}-${record.date}-${index}`" 
              class="history-item"
              :class="record.status.toLowerCase()"
            >
              <div class="history-date">
                <div class="date-day">{{ formatDateDay(record.date) }}</div>
                <div class="date-month">{{ formatDateMonth(record.date) }}</div>
              </div>
              <div class="history-details">
                <div class="history-status">
                  <span class="status-badge" :class="record.status.toLowerCase()">
                    {{ getStatusLabel(record.status) }}
                  </span>
                </div>
                <div class="history-subject" v-if="record.subject">
                  {{ record.subject }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state-box">
        <i class="fas fa-user-slash"></i>
        <h2>ไม่พบข้อมูล</h2>
        <p>ไม่พบข้อมูลนักเรียนของคุณในระบบ</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '../composables/useUserStore';
import { studentService } from '../services/studentService';
import type {
  StudentAttendanceHistoryRecord,
  StudentAttendanceSummaryStats,
  StudentDetail,
} from '../types/student';
import {
  formatStudentRoom,
  getStudentAvatarGradient,
} from '../utils/studentPresentation';

const EMPTY_ATTENDANCE_STATS: StudentAttendanceSummaryStats = {
  present: 0,
  absent: 0,
  late: 0,
  total: 0,
};

const { user, loadUser } = useUserStore();
const loading = ref(true);
const studentInfo = ref<StudentDetail | null>(null);
const attendanceHistory = ref<StudentAttendanceHistoryRecord[]>([]);
const attendanceStats = ref<StudentAttendanceSummaryStats>({ ...EMPTY_ATTENDANCE_STATS });

const studentDisplayName = computed(() => {
  if (!studentInfo.value) {
    return '-';
  }

  const firstName = studentInfo.value.FirstName_Onec || studentInfo.value.FirstName || '';
  const lastName = studentInfo.value.LastName_Onec || studentInfo.value.LastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || studentInfo.value.PersonID_Onec;
});

const studentInitial = computed(() => {
  if (studentDisplayName.value && studentDisplayName.value !== '-') {
    return studentDisplayName.value.charAt(0).toUpperCase();
  }
  return '?';
});

const avatarStyle = computed(() => getStudentAvatarGradient(studentDisplayName.value));

const attendanceRate = computed(() => {
  if (attendanceStats.value.total === 0) return 0;
  const rate = ((attendanceStats.value.present + attendanceStats.value.late) / attendanceStats.value.total) * 100;
  return Math.round(rate * 10) / 10;
});

function formatDateDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.getDate().toString();
}

function formatDateMonth(dateStr: string): string {
  const months: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(dateStr);
  return months[d.getMonth()] || '';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PRESENT: 'มาเรียน',
    ABSENT: 'ขาดเรียน',
    LATE: 'มาสาย',
    LEAVE: 'ลา',
    UNKNOWN: 'ไม่ทราบ',
  };
  return labels[status.toUpperCase()] || status;
}

function resetStudentSelfState() {
  studentInfo.value = null;
  attendanceHistory.value = [];
  attendanceStats.value = { ...EMPTY_ATTENDANCE_STATS };
}

async function fetchStudentSelf(studentId: string) {
  loading.value = true;
  resetStudentSelfState();

  try {
    const [studentDetail, attendanceSummary] = await Promise.all([
      studentService.getStudentById(studentId),
      studentService.getStudentAttendanceSummary(studentId),
    ]);

    studentInfo.value = studentDetail;
    attendanceHistory.value = attendanceSummary.records.slice(0, 20);
    attendanceStats.value = attendanceSummary.stats;
  } catch (err) {
    console.error('Failed to fetch student self data', err);
  } finally {
    loading.value = false;
  }
}

watch(
  () => user.value?.PersonID_Onec,
  (studentId) => {
    if (!studentId) {
      resetStudentSelfState();
      loading.value = false;
      return;
    }

    void fetchStudentSelf(studentId);
  },
  { immediate: true },
);

onMounted(() => {
  loadUser();
});
</script>

<style lang="scss" scoped>
.student-self-page {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  min-height: 100vh;
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e3a8a;
  margin: 0 0 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.student-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.student-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  flex-shrink: 0;
}

.student-info {
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem;
  }
}

.student-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #64748b;
    
    i {
      color: #3b82f6;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  font-size: 1.25rem;
  
  &.present {
    background: #dcfce7;
    color: #16a34a;
  }
  
  &.absent {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.late {
    background: #fef3c7;
    color: #d97706;
  }
  
  &.rate {
    background: #dbeafe;
    color: #2563eb;
  }
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.attendance-history {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  border-left: 4px solid #cbd5e1;
  
  &.present {
    border-left-color: #16a34a;
  }
  
  &.absent {
    border-left-color: #dc2626;
  }
  
  &.late {
    border-left-color: #d97706;
  }
}

.history-date {
  text-align: center;
  min-width: 50px;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.date-month {
  font-size: 0.75rem;
  color: #64748b;
}

.history-details {
  flex: 1;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  
  &.present {
    background: #dcfce7;
    color: #16a34a;
  }
  
  &.absent {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.late {
    background: #fef3c7;
    color: #d97706;
  }
}

.history-subject {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
}

.empty-state-box {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed #cbd5e1;
  
  i {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem;
  }
  
  p {
    color: #64748b;
    margin: 0;
  }
}
</style>
