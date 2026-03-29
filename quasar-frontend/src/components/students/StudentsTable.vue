<template>
  <div class="table-wrap">
    <q-table
      class="student-table"
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      v-model:pagination="paginationModel"
      :rows-per-page-options="rowsPerPageOptions"
      @row-click="handleRowClick"
    >
      <template v-slot:body-cell-index="props">
        <q-td :props="props" class="text-grey-5">
          {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
        </q-td>
      </template>

      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div class="student-info">
            <div class="student-avatar" :style="getStudentAvatarGradient(props.row.name)">
              {{ props.row.name?.[0] || '?' }}
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
          <span class="count-badge">{{ formatStudentRoom(props.row.room) }}</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type {
  StudentListItem,
  StudentListPagination,
} from '../../types/student';
import {
  formatStudentRoom,
  getStudentAvatarGradient,
} from '../../utils/studentPresentation';

const props = defineProps<{
  rows: StudentListItem[];
  pagination: StudentListPagination;
  rowsPerPageOptions: readonly number[];
}>();

const emit = defineEmits<{
  'update:pagination': [value: StudentListPagination];
  'row-click': [studentId: string];
}>();

const columns: QTableColumn<StudentListItem>[] = [
  { name: 'index', label: '#', field: 'id', align: 'left' },
  { name: 'name', label: 'ชื่อ - นามสกุล', field: 'name', align: 'left', sortable: true },
  { name: 'school_name', label: 'โรงเรียน', field: (row: StudentListItem) => row.school_name || '-', align: 'left', sortable: true },
  { name: 'grade', label: 'ระดับชั้น', field: 'grade', align: 'center', sortable: true },
  { name: 'room', label: 'ห้อง', field: 'room', align: 'center', sortable: true },
];

const paginationModel = computed({
  get: () => props.pagination,
  set: (value: StudentListPagination) => {
    emit('update:pagination', value);
  },
});

function handleRowClick(_event: Event, row: StudentListItem) {
  emit('row-click', row.id);
}
</script>

<style lang="scss" scoped>
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

@media (max-width: 767px) {
  .table-wrap {
    display: none;
  }
}
</style>
