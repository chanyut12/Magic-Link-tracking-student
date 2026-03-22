<template>
  <q-page class="q-pa-lg students-page">
    <div class="page-container">
      
      <!-- Sticky Header Area -->
      <div class="sticky-header">
        <!-- Tabs / Title area (mocking AttendancePage style) -->
        <div class="tabs-container q-mb-lg">
          <div class="tab-item active">
            รายชื่อนักเรียนทั้งหมด
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
              >
                {{ selectedSchoolName }}
                <i class="fas fa-chevron-down q-ml-sm" style="font-size: 0.7rem;"></i>
              </q-btn>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.grade" class="filter-select full-width">
                <option value="ALL">ทุกระดับชั้น</option>
                <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.label">{{ gl.label }}</option>
              </select>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.room" class="filter-select full-width">
                <option value="ALL">ทุกห้อง</option>
                <option v-for="r in rooms" :key="r" :value="r">ห้อง {{ r }}</option>
              </select>
            </div>
            
            <div class="col-12 col-sm-auto">
              <div class="student-count-chip full-width justify-center">
                <i class="fas fa-users"></i>
                <span>{{ filteredStudents.length }} คน</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student List -->
      <div class="student-list">
        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="filteredStudents.length === 0" class="empty-state-box">
          <div class="empty-icon-wrapper">
            <i class="fas fa-user-graduate"></i>
          </div>
          <h2>ไม่พบข้อมูลนักเรียน</h2>
          <p>ลองปรับตัวกรอง หรือค้นหาด้วยชื่อนักเรียนอีกครั้ง</p>
        </div>

        <template v-else>
          <div class="table-wrap">
            <q-table
              class="student-table"
              :rows="filteredStudents"
              :columns="columns"
              row-key="id"
              flat
              v-model:pagination="pagination"
              :rows-per-page-options="rowsPerPageOptions"
              @row-click="onStudentRowClick"
            >
              <template v-slot:body-cell-index="props">
                <q-td :props="props" class="text-grey-5">
                  {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
                </q-td>
              </template>

              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div class="student-info">
                    <div class="student-avatar" :style="getAvatarGradient(props.row.name)">
                      {{ props.row.name[0] }}
                    </div>
                    <div class="student-details">
                      <h3>{{ props.row.name }}</h3>
                      <div class="student-id">รหัส: {{ props.row.id }}</div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-school_name="props">
                <q-td :props="props" class="table-value-muted">
                  {{ props.row.school_name || '-' }}
                </q-td>
              </template>

              <template v-slot:body-cell-grade="props">
                <q-td :props="props" class="text-center">
                  <span class="count-badge">{{ props.row.grade || '-' }}</span>
                </q-td>
              </template>

              <template v-slot:body-cell-room="props">
                <q-td :props="props" class="text-center">
                  <span class="count-badge">{{ props.row.room === '0' || !props.row.room ? '-' : `ห้อง ${props.row.room}` }}</span>
                </q-td>
              </template>
            </q-table>
          </div>

          <div class="mobile-student-list">
            <div
              v-for="(s, index) in paginatedStudents"
              :key="s.id"
              class="student-card q-mb-sm"
              style="cursor: pointer;"
              @click="openStudent(s.id)"
              :style="{ animationDelay: `${(index % pagination.rowsPerPage) * 30}ms` }"
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

              <div style="color: #64748b; font-weight: 600;">
                {{ s.school_name || '-' }}
              </div>
              <div class="text-center count-badge">
                {{ s.grade }}
              </div>
              <div class="text-center count-badge">
                {{ s.room === '0' || !s.room ? '-' : 'ห้อง ' + s.room }}
              </div>
            </div>

            <div class="pagination-panel">
              <div class="pagination-summary">
                แสดง {{ paginationStart }}-{{ paginationEnd }} จาก {{ filteredStudents.length }} คน
              </div>

              <div class="pagination-controls">
                <label class="rows-per-page-control">
                  <span>ต่อหน้า</span>
                  <select v-model.number="pagination.rowsPerPage" class="filter-select rows-per-page-select">
                    <option v-for="size in rowsPerPageOptions" :key="size" :value="size">{{ size }}</option>
                  </select>
                </label>

                <q-pagination
                  v-model="pagination.page"
                  :max="totalPages"
                  :max-pages="6"
                  direction-links
                  boundary-links
                  color="primary"
                  active-design="unelevated"
                  active-color="primary"
                />
              </div>
            </div>
          </div>
        </template>
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
              <select v-model="tempFilters.province" class="filter-select full-width" @change="onProvinceChange">
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
              <select v-model="tempFilters.schoolId" class="filter-select full-width" :disabled="!tempFilters.subDistrict && tempFilters.province !== ''">
                <option value="">ทุกโรงเรียน</option>
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
            padding="8px 24px"
            class="action-btn-top"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { api } from 'boot/axios';
import type { QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';

// --- Interfaces ---
interface Student {
  id: string;
  name: string;
  grade: string;
  room: string;
  school_name?: string;
  school_id?: number | string;
}

interface GradeLevel {
  id: number;
  label: string;
  category: string;
}

interface School {
  id: number;
  name: string;
}

interface District {
  province: string;
  district: string;
}

interface SubDistrict {
  province: string;
  district: string;
  sub_district: string;
}

// --- State Variables ---
const students = ref<Student[]>([]);
const gradeLevels = ref<GradeLevel[]>([]);
const schools = ref<School[]>([]);
const rooms = ref<string[]>([]);
const searchQuery = ref('');
const loading = ref(false);
const $router = useRouter();

const filters = reactive({
  schoolId: '',
  grade: 'ALL',
  room: 'ALL'
});

const showFilterDialog = ref(false);
const tempFilters = reactive({
  province: '',
  district: '',
  subDistrict: '',
  schoolId: ''
});

const locationData = reactive({
  provinces: [] as string[],
  districts: [] as District[],
  subDistricts: [] as SubDistrict[]
});

const tempSchools = ref<School[]>([]);

// --- Computed Properties ---
const selectedSchoolName = computed(() => {
  if (!filters.schoolId) return 'ทุกโรงเรียน';
  const school = schools.value.find(s => String(s.id) === filters.schoolId);
  return school ? school.name : 'ทุกโรงเรียน';
});

const filteredDistricts = computed(() => {
  if (!tempFilters.province) return [];
  return Array.from(new Set(
    locationData.districts
      .filter(d => d.province === tempFilters.province)
      .map(d => d.district)
  ));
});

const filteredSubDistricts = computed(() => {
  if (!tempFilters.district) return [];
  return Array.from(new Set(
    locationData.subDistricts
      .filter(sd => sd.province === tempFilters.province && sd.district === tempFilters.district)
      .map(sd => sd.sub_district)
  ));
});

const filteredStudents = computed(() => {
  let list = [...students.value];
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase();
    list = list.filter(s => 
      s.name.toLowerCase().includes(term) || 
      String(s.id).includes(term)
    );
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

const rowsPerPageOptions = [10, 20, 50];
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  sortBy: 'name',
  descending: false,
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / pagination.value.rowsPerPage));
});

const paginatedStudents = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return filteredStudents.value.slice(start, end);
});

const paginationStart = computed(() => {
  if (filteredStudents.value.length === 0) return 0;
  return (pagination.value.page - 1) * pagination.value.rowsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (filteredStudents.value.length === 0) return 0;
  return Math.min(pagination.value.page * pagination.value.rowsPerPage, filteredStudents.value.length);
});

const columns: QTableColumn<Student>[] = [
  { name: 'index', label: '#', field: 'id', align: 'left' },
  { name: 'name', label: 'ชื่อ - นามสกุล', field: 'name', align: 'left', sortable: true },
  { name: 'school_name', label: 'โรงเรียน', field: (row: Student) => row.school_name || '-', align: 'left', sortable: true },
  { name: 'grade', label: 'ระดับชั้น', field: 'grade', align: 'center', sortable: true },
  { name: 'room', label: 'ห้อง', field: 'room', align: 'center', sortable: true },
];

// --- UI Helpers ---
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
  if (!name) return { background: '#ccc', color: '#fff' };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  const colorPair = avatarColors[index];
  if (!colorPair) {
    return {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white'
    };
  }
  const [c1, c2] = colorPair;
  return {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  };
};

const openStudent = (studentId: string) => {
  void $router.push(`/students/${studentId}`);
};

const onStudentRowClick = (_event: Event, row: Student) => {
  openStudent(row.id);
};

// --- API Calls & Data Fetching ---
const fetchLocations = async () => {
  try {
    const res = await api.get('/api/attendance/locations');
    Object.assign(locationData, res.data.data);
  } catch (err) {
    console.error('Fetch locations error:', err);
  }
};

const fetchSchools = async () => {
  try {
    const res = await api.get('/api/attendance/schools');
    schools.value = res.data.data;
    tempSchools.value = res.data.data;
  } catch (err) {
    console.error('Fetch schools error:', err);
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

const fetchRooms = async () => {
  if (filters.grade === 'ALL' || !filters.schoolId) {
    rooms.value = [];
    filters.room = 'ALL';
    return;
  }
  try {
    const res = await api.get('/api/attendance/rooms', { 
      params: { 
        grade: filters.grade,
        schoolId: filters.schoolId
      } 
    });
    rooms.value = res.data.data;
    if (!rooms.value.includes(filters.room) && filters.room !== 'ALL') {
      filters.room = 'ALL';
    }
  } catch (err) {
    console.error('Fetch rooms error:', err);
  }
};

const fetchStudentsList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/students', {
      params: { 
        grade: filters.grade,
        room: filters.room,
        schoolId: filters.schoolId
      }
    });
    students.value = res.data.data || [];
  } catch (err) {
    console.error('Fetch students error:', err);
  } finally {
    loading.value = false;
  }
};

// --- Event Handlers ---
const onProvinceChange = () => {
  tempFilters.district = '';
  tempFilters.subDistrict = '';
  tempFilters.schoolId = '';
  tempSchools.value = schools.value;
};

const onDistrictChange = () => {
  tempFilters.subDistrict = '';
  tempFilters.schoolId = '';
  tempSchools.value = schools.value;
};

const onSubDistrictChange = async () => {
  tempFilters.schoolId = '';
  if (!tempFilters.subDistrict) {
    tempSchools.value = schools.value;
    return;
  }
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

const applyFilters = () => {
  const previousSchoolId = filters.schoolId;
  filters.schoolId = tempFilters.schoolId;
  const chosen = tempSchools.value.find(s => String(s.id) === filters.schoolId);
  if (chosen && !schools.value.find(s => s.id === chosen.id)) {
    schools.value.push(chosen);
  }
  showFilterDialog.value = false;
  if (previousSchoolId === filters.schoolId) {
    void fetchStudentsList();
  }
};

// --- Watchers ---
watch([() => filters.schoolId, () => filters.grade, () => filters.room, searchQuery], () => {
  pagination.value.page = 1;
});

watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1;
});

watch(() => filteredStudents.value.length, () => {
  if (pagination.value.page > totalPages.value) {
    pagination.value.page = totalPages.value;
  }
});

watch(() => filters.schoolId, async () => {
  await fetchRooms();
  await fetchStudentsList();
});

watch(() => filters.grade, async () => {
  await fetchRooms();
  await fetchStudentsList();
});

watch(() => filters.room, async () => {
  await fetchStudentsList();
});

// --- Init ---
onMounted(async () => {
  await fetchLocations();
  await fetchSchools(); 
  await fetchGradeLevels();
  
  await fetchRooms();
  void fetchStudentsList();
});
</script>

<style lang="scss" scoped>
/* Copied exact CSS from AttendancePage.vue for consistency */
.students-page {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  min-height: 100vh;
  overflow-y: scroll;
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
  border-radius: 99px;
  padding: 0 20px;
  height: 40px;
  min-height: 40px;
  font-weight: 700;
  text-transform: none;
  background: white;
  border: 1.5px solid #dbeafe;
  color: #1e40af;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.05);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
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
  padding: 0 36px 0 16px;
  height: 40px;
  border-radius: 99px;
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

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 5rem;
}

.table-wrap {
  display: block;
  background: white;
  border-radius: 24px;
  border: 1px solid #dbeafe;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
  overflow: hidden;
}

:deep(.student-table .q-table__middle) {
  overflow: auto;
}

:deep(.student-table table) {
  min-width: 860px;
}

:deep(.student-table thead tr) {
  background: #f8fbff;
}

:deep(.student-table thead th) {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:deep(.student-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.student-table tbody tr:hover) {
  background: #f8fbff;
}

:deep(.student-table tbody td) {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.mobile-student-list {
  display: none;
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

.pagination-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(147, 197, 253, 0.35);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(10px);
}

.pagination-summary {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a8a;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.rows-per-page-control {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
}

.rows-per-page-select {
  min-width: 92px;
  padding-right: 2.4rem;
}

:deep(.q-pagination) {
  gap: 0.25rem;
}

:deep(.q-pagination .q-btn) {
  border-radius: 12px;
  min-width: 38px;
  min-height: 38px;
  font-weight: 700;
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
}

.table-value-muted {
  color: #64748b;
  font-weight: 600;
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

@media (max-width: 768px) {
  .d-none-mobile {
    display: none !important;
  }

  .table-wrap {
    display: none;
  }

  .mobile-student-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .student-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    border-radius: 20px;
    padding: 1.5rem;
  }

  .pagination-panel {
    padding: 1rem;
  }

  .pagination-controls {
    width: 100%;
    justify-content: space-between;
  }

  .rows-per-page-control {
    width: 100%;
    justify-content: space-between;
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
</style>
