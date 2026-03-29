<template>
  <q-page class="bg-grey-1 q-pa-md font-sans text-slate-700 min-h-screen">
    <div class="row justify-center">
      <div class="col-12" style="max-width: 1000px">

        <!-- Loading State -->
        <div v-if="loading" class="row justify-center items-center" style="min-height: 50vh">
          <q-spinner-dots color="primary" size="3em" />
        </div>

        <!-- Loaded State -->
        <div v-else-if="student">
          <!-- Student Profile Header -->
        <q-card class="soft-shadow border-gray-100 q-mb-lg profile-card" style="border-radius: 24px;">
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-col-gutter-lg">
              <!-- Avatar -->
              <div class="col-12 col-md-auto text-center">
                <q-avatar size="110px" class="bg-grey-3 shadow-2">
                  <q-icon name="person" size="80px" color="grey-6" />
                </q-avatar>
              </div>

              <!-- Student Info -->
              <div class="col-12 col-md">
                <div class="row justify-between items-start">
                  <div class="col-12 col-sm-8 text-center text-md-left">
                    <h1 class="row justify-left text-h5 text-weight-bold text-slate-800 q-my-none">
                      {{ student ? `${student.FirstName_Onec} ${student.LastName_Onec}` : 'กำลังโหลดข้อมูล...' }}
                    </h1>
                    <div class="row q-col-gutter-x-md q-mt-sm text-slate-500 text-body2 justify-left justify-md-start" v-if="student">
                      <div>รหัสโรงเรียน: <span class="text-slate-800 text-weight-medium">{{ student.SchoolID_Onec || '-' }}</span></div>
                      <div>เลขบัตรประชาชน: <span class="text-slate-800 text-weight-medium">{{ student.PersonID_Onec }}</span></div>
                      <div>ชั้นเรียน: <span class="text-slate-800 text-weight-medium">{{ student.grade }} ห้อง {{ student.room }}</span></div>
                    </div>
                  </div>

                  <div
                    v-if="!isSelfView"
                    class="col-12 col-sm-4 text-center text-md-right q-mt-md q-sm-mt-none row justify-end items-center q-gutter-sm"
                  >
                    <q-btn
                      unelevated
                      rounded
                      color="primary"
                      class="bg-blue-6 text-primary text-weight-bold q-px-md"
                      label="ประเมิน SDQ"
                    />
                    <q-btn flat round class="bg-grey-2 text-grey-7" size="sm" icon="call" />
                    <q-btn flat round class="bg-grey-2 text-grey-7" size="sm" icon="location_on" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">ปีการศึกษา</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">{{ student?.AcademicYear_Onec || '-' }}</div>
                </q-card>
              </div>
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">ภาคเรียน</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">{{ student?.Semester_Onec || '-' }}</div>
                </q-card>
              </div>

              <div class="col-12 col-sm-4">
                <q-card flat bordered class="text-center q-pa-sm rounded-borders inner-card-shadow">
                  <div class="text-caption text-slate-500 text-weight-medium">GPAX</div>
                  <div class="text-subtitle1 text-weight-bold text-slate-800">{{ student?.GPAX_Onec || '-' }}</div>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-col-gutter-lg">
          <!-- Left Column -->
          <div class="col-12 col-md-6 column q-gutter-y-lg">

            <!-- Tracking History -->
            <q-card class="soft-shadow border-gray-100" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการติดตามนักเรียน</div>
                <div v-if="loadingCases" class="text-center q-my-md">
                  <q-spinner color="primary" size="2em" />
                </div>
                <div v-else-if="cases && cases.length === 0" class="text-center text-grey-7 q-my-md">
                  ไม่มีประวัติการติดตาม
                </div>
                <q-list v-else separator>
                  <q-item v-for="c in sortedCases.slice(0, 3)" :key="c.id" class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">{{ formatDate(c.created_at) }}</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">{{ c.reason_flagged }}</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-chip outline :color="c.status === 'OPEN' ? 'negative' : 'positive'" :class="c.status === 'OPEN' ? 'bg-red-1' : 'bg-green-1'" dense size="sm" style="font-weight: bold;">
                        {{ c.status === 'OPEN' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น' }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="text-right q-mt-sm" v-if="cases && cases.length > 3">
                  <q-btn flat color="grey-7" label="เพิ่มเติม" size="sm" class="underline font-medium" @click="showAllCasesDialog = true" />
                </div>
              </q-card-section>
            </q-card>

            <!-- Home Visit History -->
            <!-- <q-card class="soft-shadow border-gray-100 col" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการเยี่ยมบ้าน</div>
                <q-list separator>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">14 ธันวาคม 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">นักเรียนอยู่ในกลุ่มมั่วสุม</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">16 พฤศจิกายน 2564</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">นักเรียนมีพฤติกรรมก้าวร้าว</q-item-label>
                      <q-item-label caption class="text-xs q-mt-xs">โดย: อาจารย์ ทิวลี่ ญาติเยอะ</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="text-right q-mt-sm">
                  <q-btn flat color="grey-7" label="เพิ่มเติม" size="sm" class="underline font-medium" />
                </div>
              </q-card-section>
            </q-card> -->

          </div>

          <!-- Right Column: Attendance History -->
          <div class="col-12 col-md-6">
            <q-card class="soft-shadow border-gray-100 full-height" style="border-radius: 24px;">
              <q-card-section>
                <div class="text-h6 text-weight-bold text-slate-800 q-mb-md">ประวัติการเข้าเรียน</div>

                <q-card flat bordered class="rounded-borders q-pa-md inner-card-shadow bg-white q-mb-md">
                  <!-- Quasar Date Calendar -->
                  <q-date
                    v-model="attendanceDate"
                    :events="attendanceEvents"
                    :event-color="getAttendanceColor"
                    flat
                    borderless
                    class="full-width"
                    minimal
                  />

                  <!-- Legend -->
                  <div class="row justify-center q-gutter-x-md q-mt-lg text-xs text-slate-500 text-weight-medium">
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-positive"></div> <span>เข้าเรียน</span>
                    </div>
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-warning"></div> <span>มาเรียนสาย</span>
                    </div>
                    <div class="row items-center q-gutter-x-xs">
                      <div class="color-dot bg-negative"></div> <span>ไม่เข้าเรียน</span>
                    </div>
                  </div>
                </q-card>

                <!-- Daily Detail List -->
                <!-- <q-list separator>
                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">08:34:12 น.</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 q-mt-xs text-body2">วิชา: สังคมศึกษา</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip outline color="warning" text-color="orange-9" class="bg-orange-1" dense size="sm" style="font-weight: bold;">
                        สาย
                      </q-chip>
                    </q-item-section>
                  </q-item>

                  <q-item class="q-px-none q-py-md">
                    <q-item-section>
                      <q-item-label caption class="text-xs">10:02:47 น.</q-item-label>
                      <q-item-label class="text-weight-bold text-slate-700 q-mt-xs text-body2">วิชา: คณิตศาสตร์</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip outline color="positive" class="bg-green-1" dense size="sm" style="font-weight: bold;">
                        ตรงเวลา
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </q-list> -->

              </q-card-section>
            </q-card>
          </div>
        </div>
        </div>

        <!-- Not Found State -->
        <div v-else class="column justify-center items-center text-center q-pa-lg" style="min-height: 50vh">
          <q-icon name="error_outline" size="80px" color="grey-4" class="q-mb-md" />
          <div class="text-h5 text-slate-800 text-weight-bold">ไม่พบข้อมูลนักเรียน</div>
          <div class="text-slate-500 q-mt-sm">ไม่พบข้อมูลนักเรียนระเบียนหรือรหัสนี้ในระบบ</div>
          <q-btn
            unelevated
            outline
            rounded
            color="grey-7"
            class="q-mt-md text-weight-bold q-px-lg bg-white"
            label="ย้อนกลับ"

          />
        </div>

      </div>
    </div>

    <!-- Dialog for All Tracking Cases -->
    <q-dialog v-model="showAllCasesDialog">
      <q-card style="width: 600px; max-width: 90vw; border-radius: 24px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold text-slate-800">ประวัติการติดตามนักเรียนทั้งหมด</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="scroll" style="max-height: 70vh;">
          <q-list separator>
            <q-item v-for="c in sortedCases" :key="c.id" class="q-px-none q-py-md">
              <q-item-section>
                <q-item-label caption class="text-xs">{{ formatDate(c.created_at) }}</q-item-label>
                <q-item-label class="text-weight-bold text-slate-700 text-body2 q-mt-xs">{{ c.reason_flagged }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-chip outline :color="c.status === 'OPEN' ? 'negative' : 'positive'" :class="c.status === 'OPEN' ? 'bg-red-1' : 'bg-green-1'" dense size="sm" style="font-weight: bold;">
                  {{ c.status === 'OPEN' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น' }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../composables/useUserStore';
import { studentService } from '../services/studentService';
import type {
  StudentAttendanceCalendarRecord,
  StudentCase,
  StudentDetail,
} from '../types/student';

const route = useRoute();
const { user, loadUser } = useUserStore();
const student = ref<StudentDetail | null>(null);
const loading = ref(true);

const cases = ref<StudentCase[]>([]);
const loadingCases = ref(false);
const showAllCasesDialog = ref(false);

const getTodayFormatted = () => {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};

const attendanceDate = ref(getTodayFormatted());
const attendanceRecords = ref<Record<string, string>>({});

const isSelfView = computed(() => route.path === '/my-attendance');
const resolvedStudentId = computed(() => {
  const routeId =
    typeof route.params.id === 'string' ? route.params.id.trim() : '';

  if (routeId) {
    return routeId;
  }

  return isSelfView.value ? user.value?.PersonID_Onec?.trim() : undefined;
});

const attendanceEvents = computed(() => Object.keys(attendanceRecords.value));

const getAttendanceColor = (dateString: string) => {
  return attendanceRecords.value[dateString] || 'grey-3';
};

const resetStudentViewState = () => {
  student.value = null;
  cases.value = [];
  attendanceRecords.value = {};
  showAllCasesDialog.value = false;
};

const getStudentFullName = (detail: StudentDetail | null) => {
  if (!detail) {
    return '';
  }

  return `${detail.FirstName_Onec || ''} ${detail.LastName_Onec || ''}`.trim();
};

const formatAttendanceDate = (dateString: string) => {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
};

const getAttendanceStatusColor = (status: number) => {
  if (status === 1) return 'positive';
  if (status === 2) return 'warning';
  if (status === 3) return 'negative';
  return 'grey-3';
};

const fetchAttendance = async (id: string) => {
  try {
    const newMapping: Record<string, string> = {};
    const records = await studentService.getStudentAttendance(id);

    records.forEach((record: StudentAttendanceCalendarRecord) => {
      const formattedDate = formatAttendanceDate(record.date);
      if (!formattedDate) {
        return;
      }

      newMapping[formattedDate] = getAttendanceStatusColor(record.status);
    });

    attendanceRecords.value = newMapping;
  } catch (error) {
    console.error('Error fetching attendance:', error);
  }
};

const sortedCases = computed(() => {
  return [...cases.value].sort((a, b) => {
    // 1st Priority: Status ('OPEN' first)
    if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
    if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;

    // 2nd Priority: Date (Newest to Oldest)
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
});

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fetchCases = async (name: string) => {
  loadingCases.value = true;
  try {
    cases.value = await studentService.getStudentCasesByName(name);
  } catch (error) {
    console.error('Error fetching cases:', error);
  } finally {
    loadingCases.value = false;
  }
};

const fetchStudent = async (id: string) => {
  loading.value = true;
  resetStudentViewState();

  try {
    const studentDetail = await studentService.getStudentById(id);
    student.value = studentDetail;

    const fullName = getStudentFullName(studentDetail);
    await Promise.all([
      fetchAttendance(id),
      fullName ? fetchCases(fullName) : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('Error fetching student:', error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => resolvedStudentId.value,
  (id) => {
    if (!id) {
      resetStudentViewState();
      loading.value = isSelfView.value;
      return;
    }

    void fetchStudent(id);
  },
  { immediate: true },
);

onMounted(() => {
  if (isSelfView.value) {
    loadUser();
  }
});
</script>

<style scoped>
/* Keeping exact smooth shadows to preserve the visual identity */
.soft-shadow {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
.inner-card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.text-xs {
  font-size: 0.75rem;
}
</style>
