<template>
  <template v-if="rows.length > 0">
    <div class="table-wrap">
      <q-table
        class="user-table"
        :rows="rows"
        :columns="columns"
        row-key="id"
        flat
        v-model:pagination="paginationModel"
        :rows-per-page-options="rowsPerPageOptions"
      >
        <template #body-cell-index="props">
          <q-td :props="props" class="text-grey-5">
            {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
          </q-td>
        </template>

        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="student-info">
              <div class="student-avatar" :style="getUserAvatarGradient(getUserDisplayName(props.row))">
                {{ getUserInitial(props.row) }}
              </div>
              <div class="student-details">
                <h3>{{ getUserDisplayName(props.row) }}</h3>
                <div class="student-id">บัญชี: {{ props.row.username || '-' }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-person_id="props">
          <q-td :props="props" class="table-value-muted">
            {{ props.row.PersonID_Onec || '-' }}
          </q-td>
        </template>

        <template #body-cell-role="props">
          <q-td :props="props">
            <span class="role-pill">{{ getUserRoleText(props.row) }}</span>
          </q-td>
        </template>

        <template #body-cell-affiliation="props">
          <q-td :props="props" class="table-value-muted">
            {{ props.row.affiliation || '-' }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <div class="table-action-group">
              <q-btn
                unelevated
                color="primary"
                icon="fas fa-pencil"
                size="sm"
                class="primary-action-btn"
                label="แก้ไข"
                no-caps
                @click.stop="emit('edit', props.row)"
              />
              <q-btn
                unelevated
                color="red"
                icon="fas fa-trash"
                size="sm"
                class="delete-action-btn"
                label="ลบ"
                no-caps
                @click.stop="emit('delete', props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <div class="mobile-user-list">
      <div
        v-for="(user, index) in paginatedUsers"
        :key="user.id ?? index"
        class="user-mobile-card"
        :style="{ animationDelay: `${(index % pagination.rowsPerPage) * 30}ms` }"
      >
        <div class="mobile-card-header">
          <div class="student-info">
            <div class="student-avatar" :style="getUserAvatarGradient(getUserDisplayName(user))">
              {{ getUserInitial(user) }}
            </div>
            <div class="student-details">
              <h3>{{ getUserDisplayName(user) }}</h3>
              <div class="student-id">บัญชี: {{ user.username || '-' }}</div>
            </div>
          </div>

          <div class="user-mobile-index">
            {{ paginationStart + index }}
          </div>
        </div>

        <div class="mobile-user-meta">
          <div class="meta-item">
            <span class="meta-label">เลขบัตรประชาชน</span>
            <span class="meta-value">{{ user.PersonID_Onec || '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">ตำแหน่ง</span>
            <span class="meta-value">{{ getUserRoleText(user) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">สังกัด</span>
            <span class="meta-value">{{ user.affiliation || '-' }}</span>
          </div>
        </div>

        <div class="mobile-user-actions">
          <q-btn
            unelevated
            color="primary"
            icon="fas fa-pencil"
            size="sm"
            class="full-width primary-action-btn"
            label="แก้ไข"
            no-caps
            @click="emit('edit', user)"
          />
          <q-btn
            unelevated
            color="red"
            icon="fas fa-trash"
            size="sm"
            class="full-width delete-action-btn"
            label="ลบ"
            no-caps
            @click="emit('delete', user)"
          />
        </div>
      </div>

      <div class="pagination-panel">
        <div class="pagination-summary">
          แสดง {{ paginationStart }}-{{ paginationEnd }} จาก {{ rows.length }} คน
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type { ManagedUser } from '../../types/user';
import {
  getUserAvatarGradient,
  getUserDisplayName,
  getUserInitial,
  getUserRoleText,
} from '../../utils/userPresentation';

const props = defineProps<{
  rows: ManagedUser[];
  pagination: {
    page: number;
    rowsPerPage: number;
  };
  rowsPerPageOptions: readonly number[];
}>();

const emit = defineEmits<{
  'update:pagination': [value: { page: number; rowsPerPage: number }];
  edit: [user: ManagedUser];
  delete: [user: ManagedUser];
}>();

const columns: QTableColumn<ManagedUser>[] = [
  { name: 'index', label: '#', field: 'id', align: 'left' },
  { name: 'name', label: 'ผู้ใช้งาน', field: (row) => getUserDisplayName(row), align: 'left' },
  { name: 'person_id', label: 'เลขบัตรประชาชน', field: (row) => row.PersonID_Onec || '-', align: 'left' },
  { name: 'role', label: 'ตำแหน่ง', field: (row) => getUserRoleText(row), align: 'left' },
  { name: 'affiliation', label: 'สังกัด', field: (row) => row.affiliation || '-', align: 'left' },
  { name: 'actions', label: 'จัดการ', field: 'id', align: 'right' },
];

const paginationModel = computed({
  get: () => props.pagination,
  set: (value: { page: number; rowsPerPage: number }) => {
    emit('update:pagination', value);
  },
});

const totalPages = computed(() => (
  Math.max(1, Math.ceil(props.rows.length / props.pagination.rowsPerPage))
));

const paginatedUsers = computed(() => {
  const start = (props.pagination.page - 1) * props.pagination.rowsPerPage;
  return props.rows.slice(start, start + props.pagination.rowsPerPage);
});

const paginationStart = computed(() => {
  if (props.rows.length === 0) return 0;
  return (props.pagination.page - 1) * props.pagination.rowsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (props.rows.length === 0) return 0;
  return Math.min(props.pagination.page * props.pagination.rowsPerPage, props.rows.length);
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

<style scoped lang="scss">
.table-wrap {
  display: block;
  background: white;
  border-radius: 24px;
  border: 1px solid #dbeafe;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
  overflow: hidden;
}

:deep(.user-table .q-table__middle) {
  overflow: auto;
}

:deep(.user-table table) {
  min-width: 940px;
}

:deep(.user-table thead tr) {
  background: #f8fbff;
}

:deep(.user-table thead th) {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:deep(.user-table tbody td) {
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

.student-details h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
}

.student-id {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  margin-top: 2px;
}

.table-value-muted {
  color: #64748b;
  font-weight: 600;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.82rem;
}

.table-action-group,
.mobile-user-actions {
  display: flex;
  gap: 0.5rem;
}

.primary-action-btn,
.delete-action-btn {
  border-radius: 12px;
}

.mobile-user-list {
  display: none;
}

.user-mobile-card {
  background: white;
  border-radius: 18px;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  opacity: 0;
  animation: fade-in-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.user-mobile-card + .user-mobile-card {
  margin-top: 0.75rem;
}

.mobile-card-header,
.mobile-user-meta,
.pagination-panel,
.pagination-controls {
  display: flex;
  gap: 1rem;
}

.mobile-card-header {
  justify-content: space-between;
  align-items: flex-start;
}

.user-mobile-index {
  min-width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #2563eb;
  background: #eff6ff;
}

.mobile-user-meta {
  flex-direction: column;
  margin: 1rem 0;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.92rem;
}

.meta-label {
  color: #64748b;
  font-weight: 700;
}

.meta-value {
  color: #1e293b;
  font-weight: 600;
  text-align: right;
}

.full-width {
  width: 100%;
}

.pagination-panel {
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(147, 197, 253, 0.35);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
}

.pagination-summary {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a8a;
}

.pagination-controls {
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
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
  background: white;
  outline: none;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e40af;
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

@media (max-width: 767px) {
  .table-wrap {
    display: none;
  }

  .mobile-user-list {
    display: block;
  }
}
</style>

