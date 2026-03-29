<template>
  <q-page class="manage-users-page q-pa-lg">
    <div class="page-container">
      <div class="sticky-header">
        <div class="tabs-container q-mb-lg">
          <div class="page-tab-item active">
            ผู้ใช้งานทั้งหมด
          </div>
        </div>

        <div class="header-toolbar">
          <div class="search-and-count">
            <div class="search-container header-search">
              <i class="fas fa-search"></i>
              <input
                v-model="searchText"
                type="text"
                class="search-input"
                placeholder="ค้นหาชื่อผู้ใช้งาน ชื่อ-นามสกุล หรือเลขบัตร..."
              >
            </div>

            <div class="student-count-chip user-count-chip">
              <i class="fas fa-users"></i>
              <span>{{ filteredUsers.length }} คน</span>
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            no-caps
            class="action-btn-top add-user-btn"
            @click="openAddDialog"
          >
            <i class="fas fa-user-plus q-mr-sm"></i>
            เพิ่มผู้ใช้งาน
          </q-btn>
        </div>
      </div>

      <div class="user-list">
        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="3em" />
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state-box">
          <div class="empty-icon-wrapper">
            <i class="fas fa-user-shield"></i>
          </div>
          <h2>ไม่พบข้อมูลผู้ใช้งาน</h2>
          <p>ลองค้นหาด้วยชื่อ ชื่อผู้ใช้ หรือเลขบัตรประชาชนอีกครั้ง</p>
        </div>

        <UsersTable
          v-else
          :rows="filteredUsers"
          :pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="updatePagination"
          @edit="openEditDialog"
          @delete="confirmDelete"
        />
      </div>

      <UserFormDialog
        v-model="showUserDialog"
        :user="editingUser"
        @saved="handleUserSaved"
      />

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card class="q-pa-md" style="border-radius: 20px; min-width: 350px;">
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-trash" color="red" text-color="white" />
          <span class="q-ml-sm text-h6 text-weight-bold">ยืนยันการลบ</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>คุณต้องการลบผู้ใช้งาน <span class="text-weight-bold text-red">"{{ deleteTargetName }}"</span> ใช่หรือไม่?</p>
          <p class="text-caption text-grey-7">* ข้อมูลจะถูกลบออกจากระบบถาวรและไม่สามารถเรียกคืนได้</p>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
          <q-btn unelevated label="ยืนยันการลบ" color="red" @click="performDelete" no-caps class="rounded-10" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import UserFormDialog from '../components/users/UserFormDialog.vue';
import UsersTable from '../components/users/UsersTable.vue';
import { useManageUsersPage } from '../composables/useManageUsersPage';

const {
  searchText,
  loading,
  rowsPerPageOptions,
  pagination,
  showUserDialog,
  showDeleteConfirm,
  editingUser,
  filteredUsers,
  deleteTargetName,
  openAddDialog,
  openEditDialog,
  handleUserSaved,
  confirmDelete,
  performDelete,
} = useManageUsersPage();

function updatePagination(value: { page: number; rowsPerPage: number }): void {
  pagination.value = {
    page: value.page || 1,
    rowsPerPage: value.rowsPerPage || 20,
  };
}
</script>

<style lang="scss" scoped>
.manage-users-page {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  min-height: 100vh;
  overflow-y: auto;
  font-family: 'Prompt', 'Inter', sans-serif;
}

.page-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.full-width {
  width: 100%;
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

.page-tab-item {
  padding: 0.75rem 0;
  font-weight: 700;
  color: #64748b;
  position: relative;
  transition: color 0.2s ease;

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

.header-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.search-and-count {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 auto;
}

.header-search {
  flex: 0 1 460px;
  max-width: 460px;
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

  i {
    color: #3b82f6;
    font-size: 0.95rem;
  }
}

.user-count-chip {
  justify-content: center;
  flex-shrink: 0;
  white-space: nowrap;
}

.action-btn-top {
  border-radius: 99px;
  min-height: 40px;
  padding: 0 20px;
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
}

.add-user-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 100px;
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
  min-width: 980px;
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

:deep(.student-table tbody td) {
  padding-top: 1rem;
  padding-bottom: 1rem;
  vertical-align: middle;
}

:deep(.student-table .q-table__bottom) {
  border-top: 1px solid #dbeafe;
  background: white;
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
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.student-details {
  h3 {
    font-size: 1.05rem;
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

.table-value-muted {
  color: #64748b;
  font-weight: 600;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.4;
}

.table-action-group {
  display: flex;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.primary-action-btn,
.delete-action-btn {
  border-radius: 12px;
  font-weight: 700;
  min-height: 36px;

  :deep(.q-btn__content) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    line-height: 1;
  }

  :deep(.q-btn__icon),
  :deep(.q-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    margin: 0;
  }

  :deep(.block) {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }
}

.mobile-user-list {
  display: none;
}

.user-mobile-card {
  background: white;
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  opacity: 0;
  animation: fade-in-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.mobile-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-mobile-index {
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 800;
}

.mobile-user-meta {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #e0ecff;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.meta-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.meta-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.mobile-user-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
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

.empty-icon-wrapper {
  margin-bottom: 1rem;
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
    max-width: 360px;
    margin: 0 auto;
    line-height: 1.6;
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

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-12px) rotate(2deg);
  }
}

.user-dialog-card {
  border-radius: 60px !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.photo-upload-section {
  background: #f1f5f9;
  border-radius: 40px;
  height: 450px;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}

.photo-placeholder {
  border: 4px dashed #cbd5e1;
  border-radius: 40px;
  width: 100%;
  height: 100%;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: var(--q-primary);
    background: #eef2ff;

    .q-icon {
      color: var(--q-primary);
    }

    .text-blue-grey-3 {
      color: var(--q-primary);
    }
  }
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 20px !important;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0 16px;
    height: 48px;
    transition: all 0.2s ease;
    
    &:before,
    &:after {
      display: none;
    }

    &.q-field__control--focused {
      border-color: var(--q-primary);
      background: white;
      box-shadow: 0 0 0 3px rgba(15, 77, 194, 0.1);
    }
  }
}

.underline-title {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  width: 100%;
}

.permission-tabs {
  background: #f1f5f9;
  border-radius: 25px;
  padding: 6px;
  margin-bottom: 24px;

  .tab-item {
    border-radius: 20px;
    margin-right: 8px;
    min-height: 44px;
    transition: all 0.3s ease;

    &.q-tab--active {
      background: white;
      color: #0f4dc2;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    &:not(.q-tab--active) {
      background: transparent;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
    }
  }
}

.menu-permission-item {
  margin-bottom: 12px;
}

.permission-insight-panel {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ffffff, #eff6ff);
  border: 1px solid #dbeafe;
}

.permission-insight-copy {
  display: grid;
  gap: 4px;
}

.permission-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.permission-legend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
}

.permission-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-top: 3px;
  flex-shrink: 0;
  background: #94a3b8;
}

.permission-legend-item--default {
  border-color: #93c5fd;
  background: #eff6ff;

  .permission-legend-swatch {
    background: #2563eb;
  }
}

.permission-legend-item--added {
  border-color: #86efac;
  background: #f0fdf4;

  .permission-legend-swatch {
    background: #16a34a;
  }
}

.permission-legend-item--removed {
  border-color: #fdba74;
  background: #fff7ed;

  .permission-legend-swatch {
    background: #ea580c;
  }
}

.permission-legend-item--locked {
  border-color: #cbd5e1;
  background: #f8fafc;

  .permission-legend-swatch {
    background: #64748b;
  }
}

.scope-mode-banner {
  padding: 14px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
}

.rounded-card {
  border-radius: 25px;
  background: #f1f5f9 !important;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: #eef2ff !important;
    border-color: rgba(15, 77, 194, 0.2);
  }
}

.permission-menu-row,
.permission-state-card {
  position: relative;
}

.permission-state-card--default {
  background: #eff6ff !important;
  border-color: #93c5fd;
}

.permission-state-card--added {
  background: #f0fdf4 !important;
  border-color: #86efac;
}

.permission-state-card--removed {
  background: #fff7ed !important;
  border-color: #fdba74;
  border-style: dashed;
}

.permission-state-card--locked {
  background: #f8fafc !important;
  border-color: #cbd5e1;
}

.permission-menu-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.permission-mini-pill,
.permission-state-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
  border: 1px solid transparent;
}

.permission-mini-pill--default,
.permission-state-badge--default {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.permission-mini-pill--added,
.permission-state-badge--added {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.permission-mini-pill--removed,
.permission-state-badge--removed {
  background: #ffedd5;
  border-color: #fdba74;
  color: #c2410c;
}

.permission-mini-pill--locked,
.permission-state-badge--locked {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #475569;
}

.permission-locked {
  background: #e8eef8 !important;

  span {
    color: #475569;
  }
}

.save-all-btn {
  width: 320px;
  height: 64px;
  border-radius: 32px;
  background: #0f4dc2 !important;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 15px 35px rgba(15, 77, 194, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 45px rgba(15, 77, 194, 0.5);
  }

  &:active {
    transform: translateY(-1px);
  }
}

@media (max-width: 768px) {
  .header-toolbar {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .search-and-count {
    flex: 1 1 100%;
    flex-wrap: wrap;
  }

  .header-search {
    flex: 1 1 100%;
    max-width: none;
  }

  .add-user-btn {
    margin-left: 0;
    width: 100%;
  }

  .permission-legend {
    grid-template-columns: 1fr;
  }

  .permission-menu-summary {
    max-width: 180px;
  }

  .table-wrap {
    display: none;
  }

  .mobile-user-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .mobile-card-header {
    flex-direction: column;
  }

  .user-mobile-index {
    align-self: flex-end;
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

@media (max-width: 599px) {
  .user-dialog-card {
    border-radius: 24px !important;
  }

  .save-all-btn {
    width: 100%;
  }
}
</style>
