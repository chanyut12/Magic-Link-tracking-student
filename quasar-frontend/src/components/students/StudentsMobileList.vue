<template>
  <div class="mobile-student-list">
    <div
      v-for="(student, index) in students"
      :key="student.id"
      class="student-card q-mb-sm"
      style="cursor: pointer;"
      :style="{ animationDelay: `${(index % pagination.rowsPerPage) * 30}ms` }"
      @click="emit('row-click', student.id)"
    >
      <div class="student-info">
        <div class="student-avatar" :style="getStudentAvatarGradient(student.name)">
          {{ student.name?.[0] || '?' }}
        </div>
        <div class="student-details">
          <h3>{{ student.name }}</h3>
          <div class="student-id">รหัส: {{ student.id }}</div>
        </div>
      </div>

      <div class="school-name">
        {{ student.school_name || '-' }}
      </div>
      <div class="text-center count-badge">
        {{ student.grade || '-' }}
      </div>
      <div class="text-center count-badge">
        {{ formatStudentRoom(student.room) }}
      </div>
    </div>

    <div class="pagination-panel">
      <div class="pagination-summary">
        แสดง {{ paginationStart }}-{{ paginationEnd }} จาก {{ totalCount }} คน
      </div>

      <div class="pagination-controls">
        <label class="rows-per-page-control">
          <span>ต่อหน้า</span>
          <select v-model.number="rowsPerPageModel" class="filter-select rows-per-page-select">
            <option v-for="size in rowsPerPageOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>

        <q-pagination
          v-model="pageModel"
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

<script setup lang="ts">
import { computed } from 'vue';
import type {
  StudentListItem,
  StudentListPagination,
} from '../../types/student';
import {
  formatStudentRoom,
  getStudentAvatarGradient,
} from '../../utils/studentPresentation';

const props = defineProps<{
  students: StudentListItem[];
  totalCount: number;
  pagination: StudentListPagination;
  rowsPerPageOptions: readonly number[];
}>();

const emit = defineEmits<{
  'update:pagination': [value: StudentListPagination];
  'row-click': [studentId: string];
}>();

const totalPages = computed(() => (
  Math.max(1, Math.ceil(props.totalCount / props.pagination.rowsPerPage))
));

const paginationStart = computed(() => {
  if (props.totalCount === 0) return 0;
  return (props.pagination.page - 1) * props.pagination.rowsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (props.totalCount === 0) return 0;
  return Math.min(props.pagination.page * props.pagination.rowsPerPage, props.totalCount);
});

const pageModel = computed({
  get: () => props.pagination.page,
  set: (value: number) => {
    emit('update:pagination', {
      ...props.pagination,
      page: value,
    });
  },
});

const rowsPerPageModel = computed({
  get: () => props.pagination.rowsPerPage,
  set: (value: number) => {
    emit('update:pagination', {
      ...props.pagination,
      page: 1,
      rowsPerPage: Number(value),
    });
  },
});
</script>

<style lang="scss" scoped>
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

.school-name {
  color: #64748b;
  font-weight: 600;
}

.count-badge {
  font-size: 1rem;
  font-weight: 700;
  color: #475569;
}

@media (max-width: 767px) {
  .mobile-student-list {
    display: block;
  }

  .student-card {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1.1rem 1rem;
  }

  .pagination-panel {
    padding: 1rem;
  }

  .pagination-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
