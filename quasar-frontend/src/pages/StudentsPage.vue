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
                :disable="isSchoolLocked"
              >
                {{ selectedSchoolName }}
                <i class="fas fa-chevron-down q-ml-sm" style="font-size: 0.7rem;"></i>
              </q-btn>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.grade" class="filter-select full-width" :disabled="isGradeLocked">
                <option value="ALL">ทุกระดับชั้น</option>
                <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.label">{{ gl.label }}</option>
              </select>
            </div>
            <div class="col-6 col-sm-auto">
              <select v-model="filters.room" class="filter-select full-width" :disabled="isRoomLocked">
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
          <StudentsTable
            :rows="filteredStudents"
            :pagination="pagination"
            :rows-per-page-options="rowsPerPageOptions"
            @update:pagination="pagination = $event"
            @row-click="openStudent"
          />

          <StudentsMobileList
            :students="paginatedStudents"
            :pagination="pagination"
            :rows-per-page-options="rowsPerPageOptions"
            :total-count="filteredStudents.length"
            @update:pagination="pagination = $event"
            @row-click="openStudent"
          />
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import StudentsMobileList from '../components/students/StudentsMobileList.vue';
import StudentsTable from '../components/students/StudentsTable.vue';
import { useAttendanceFilters } from '../composables/useAttendanceFilters';
import { useStudentList } from '../composables/useStudentList';
import { useUserStore } from '../composables/useUserStore';
import { useDataScopeLock } from '../composables/useDataScopeLock';

// --- State Variables ---
const $router = useRouter();
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
  searchQuery,
  loading,
  filters,
  rowsPerPageOptions,
  pagination,
  filteredStudents,
  paginatedStudents,
  fetchStudentsList,
} = useStudentList();

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

// --- Computed Properties ---
const selectedSchoolName = computed(() => {
  if (!filters.schoolId) return 'ทุกโรงเรียน';
  const school = schools.value.find(s => String(s.id) === filters.schoolId);
  return school ? school.name : 'ทุกโรงเรียน';
});

const openStudent = (studentId: string) => {
  void $router.push(`/students/${studentId}`);
};

// --- API Calls & Data Fetching ---
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

const fetchGradeLevels = async () => {
  try {
    await loadGradeLevels();
  } catch (err) {
    console.error('Fetch grade levels error:', err);
  }
};

const fetchRooms = async () => {
  if (filters.grade === 'ALL' || !filters.schoolId) {
    rooms.value = [];
    if (!isRoomLocked.value) {
      filters.room = 'ALL';
    }
    return;
  }
  try {
    await loadRooms(filters.grade, filters.schoolId);
    if (isRoomLocked.value && lockedRoomValue.value !== null) {
      filters.room = String(lockedRoomValue.value);
      return;
    }
    if (!rooms.value.includes(filters.room) && filters.room !== 'ALL') {
      filters.room = 'ALL';
    }
  } catch (err) {
    console.error('Fetch rooms error:', err);
  }
};

// --- Event Handlers ---
const onProvinceChange = () => {
  handleProvinceFilterChange();
};

const onDistrictChange = () => {
  handleDistrictFilterChange();
};

const onSubDistrictChange = async () => {
  try {
    await handleSubDistrictFilterChange();
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

// --- Init ---
onMounted(async () => {
  loadUser();
  await loadLocations();
  await fetchSchools(); 
  await fetchGradeLevels();
  applyActiveScope();

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
