<template>
  <q-page class="manage-users-page q-pa-lg">
    <div class="page-container">
      <div class="sticky-header">
        <div class="tabs-container q-mb-lg">
          <div class="page-tab-item active">
            กลุ่มผู้ใช้งานทั้งหมด
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
                placeholder="ค้นหารหัส role หรือชื่อกลุ่มผู้ใช้งาน"
              >
            </div>

            <div class="student-count-chip user-count-chip">
              <i class="fas fa-user-tag"></i>
              <span>{{ filteredRoles.length }} กลุ่ม</span>
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            no-caps
            class="action-btn-top add-user-btn"
            icon="fas fa-user-tag"
            label="เพิ่มกลุ่มผู้ใช้งาน"
            @click="openCreateDialog"
          />
        </div>
      </div>

      <div class="user-list">
        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="3em" />
        </div>

        <div v-else-if="filteredRoles.length === 0" class="empty-state-box">
          <div class="empty-icon-wrapper">
            <i class="fas fa-users-cog"></i>
          </div>
          <h2>ไม่พบข้อมูลกลุ่มผู้ใช้งาน</h2>
          <p>ลองค้นหาด้วยรหัส role หรือชื่อกลุ่มผู้ใช้งานอีกครั้ง</p>
        </div>

        <template v-else>
          <div class="table-wrap">
            <q-table
              class="student-table user-table"
              :rows="filteredRoles"
              :columns="columns"
              row-key="name"
              flat
              v-model:pagination="pagination"
              :rows-per-page-options="rowsPerPageOptions"
            >
              <template #body-cell-index="props">
                <q-td :props="props" class="text-grey-5">
                  {{ (pagination.page - 1) * pagination.rowsPerPage + props.pageIndex + 1 }}
                </q-td>
              </template>

              <template #body-cell-role="props">
                <q-td :props="props">
                  <div class="role-card-head">
                    <div>
                      <div class="text-weight-bold text-body1">{{ props.row.label }}</div>
                      <div class="text-caption text-blue-grey-6">{{ props.row.name }}</div>
                    </div>
                    <div class="role-chip-wrap">
                      <q-badge
                        :color="props.row.is_system ? 'blue-1' : 'teal-1'"
                        :text-color="props.row.is_system ? 'primary' : 'teal-9'"
                        class="role-kind-badge"
                      >
                        {{ props.row.is_system ? 'ระบบ' : 'กำหนดเอง' }}
                      </q-badge>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-rank="props">
                <q-td :props="props" class="table-value-muted">
                  ลำดับ {{ props.row.rank }}
                </q-td>
              </template>

              <template #body-cell-scope="props">
                <q-td :props="props" class="table-value-muted">
                  {{ scopeModeLabel(props.row.scope_mode) }}
                </q-td>
              </template>

              <template #body-cell-permissions="props">
                <q-td :props="props">
                  <div class="permission-preview">
                    <q-chip
                      v-for="permissionId in props.row.default_permissions.slice(0, 3)"
                      :key="permissionId"
                      dense
                      color="blue-1"
                      text-color="primary"
                    >
                      {{ permissionLabelMap[permissionId] || permissionId }}
                    </q-chip>
                    <span v-if="props.row.default_permissions.length > 3" class="text-caption text-blue-grey-6">
                      +{{ props.row.default_permissions.length - 3 }} รายการ
                    </span>
                  </div>
                </q-td>
              </template>

              <template #body-cell-usage="props">
                <q-td :props="props" class="table-value-muted">
                  <div>{{ props.row.user_count || 0 }} ผู้ใช้</div>
                  <div class="text-caption text-blue-grey-5">{{ props.row.login_link_count || 0 }} ลิงก์</div>
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
                      @click.stop="openEditDialog(props.row)"
                    />
                    <q-btn
                      unelevated
                      color="red"
                      icon="fas fa-trash"
                      size="sm"
                      class="delete-action-btn"
                      :class="{ 'delete-action-btn--locked': !canDeleteRole(props.row) }"
                      label="ลบ"
                      no-caps
                      :disable="!canDeleteRole(props.row)"
                      @click.stop="confirmDelete(props.row)"
                    >
                      <q-tooltip v-if="!canDeleteRole(props.row)">
                        {{ getDeleteDisabledReason(props.row) }}
                      </q-tooltip>
                    </q-btn>
                  </div>
                </q-td>
              </template>
            </q-table>
          </div>

          <div class="mobile-user-list">
            <div
              v-for="(role, index) in paginatedRoles"
              :key="role.name"
              class="user-mobile-card"
              :style="{ animationDelay: `${(index % pagination.rowsPerPage) * 30}ms` }"
            >
              <div class="mobile-card-header">
                <div>
                  <div class="text-weight-bold text-body1">{{ role.label }}</div>
                  <div class="text-caption text-blue-grey-6">{{ role.name }}</div>
                </div>
                <div class="user-mobile-index">
                  {{ paginationStart + index }}
                </div>
              </div>

              <div class="mobile-user-meta">
                <div class="meta-item">
                  <span class="meta-label">ลำดับสิทธิ์</span>
                  <span class="meta-value">{{ role.rank }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Data Scope</span>
                  <span class="meta-value">{{ scopeModeLabel(role.scope_mode) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">การใช้งาน</span>
                  <span class="meta-value">{{ role.user_count || 0 }} ผู้ใช้ / {{ role.login_link_count || 0 }} ลิงก์</span>
                </div>
              </div>

              <div class="permission-preview q-mb-md">
                <q-chip
                  v-for="permissionId in role.default_permissions.slice(0, 4)"
                  :key="permissionId"
                  dense
                  color="blue-1"
                  text-color="primary"
                >
                  {{ permissionLabelMap[permissionId] || permissionId }}
                </q-chip>
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
                  @click="openEditDialog(role)"
                />
                <q-btn
                  unelevated
                  color="red"
                  icon="fas fa-trash"
                  size="sm"
                  class="full-width delete-action-btn"
                  :class="{ 'delete-action-btn--locked': !canDeleteRole(role) }"
                  label="ลบ"
                  no-caps
                  :disable="!canDeleteRole(role)"
                  @click="confirmDelete(role)"
                >
                  <q-tooltip v-if="!canDeleteRole(role)">
                    {{ getDeleteDisabledReason(role) }}
                  </q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="pagination-panel">
              <div class="pagination-summary">
                แสดง {{ paginationStart }}-{{ paginationEnd }} จาก {{ filteredRoles.length }} กลุ่ม
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

      <q-dialog v-model="showDialog" persistent full-width class="advanced-dialog">
        <q-card class="user-dialog-card" style="height: 90vh; display: flex; flex-direction: column;">
          <q-card-section class="row items-center q-pa-lg">
            <div class="text-h5 text-weight-bold full-width text-center relative-position">
              {{ isEdit ? 'แก้ไขกลุ่มผู้ใช้งาน' : 'เพิ่มกลุ่มผู้ใช้งานใหม่' }}
              <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
            </div>
          </q-card-section>

          <q-card-section class="col scroll q-pa-lg">
            <div class="role-form-grid">
              <section class="form-shell">
                <div class="text-h6 text-weight-bold q-mb-lg underline-title">ข้อมูลกลุ่มผู้ใช้งาน</div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-5">
                    <div class="text-weight-bold q-mb-xs">รหัสกลุ่มผู้ใช้งาน</div>
                    <q-input
                      v-model="form.name"
                      outlined
                      dense
                      :disable="isEdit"
                      bg-color="white"
                      class="custom-input"
                      placeholder="เช่น ADMIN_BRANCH"
                      @update:model-value="form.name = normalizeRoleCode(form.name)"
                    />
                    <div class="text-caption text-blue-grey-5 q-mt-xs">
                      ใช้ตัวพิมพ์ใหญ่ ภาษาอังกฤษ ตัวเลข และ `_`
                    </div>
                  </div>

                  <div class="col-12 col-md-7">
                    <div class="text-weight-bold q-mb-xs">ชื่อที่แสดง</div>
                    <q-input
                      v-model="form.label"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input"
                      placeholder="เช่น แอดมินระดับโรงเรียน"
                    />
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="text-weight-bold q-mb-xs">ลำดับสิทธิ์</div>
                    <q-input
                      v-model.number="form.rank"
                      outlined
                      dense
                      type="number"
                      min="1"
                      :max="maxAssignableRank || undefined"
                      bg-color="white"
                      class="custom-input"
                    />
                    <div class="text-caption text-blue-grey-5 q-mt-xs">
                      {{ rankHint }}
                    </div>
                  </div>

                  <div class="col-12 col-md-8">
                    <div class="text-weight-bold q-mb-xs">รูปแบบ Data Scope</div>
                    <q-select
                      v-model="form.scope_mode"
                      :options="scopeModeOptions"
                      outlined
                      dense
                      emit-value
                      map-options
                      bg-color="white"
                      class="custom-input"
                    />
                    <div class="text-caption text-blue-grey-5 q-mt-xs">
                      {{ scopeModeHint }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="form-shell">
                <div class="text-h6 text-weight-bold q-mb-md underline-title">สิทธิ์เริ่มต้นของ role</div>
                <div class="text-caption text-blue-grey-6 q-mb-lg">
                  เมื่อเลือก role นี้ในหน้าเพิ่มผู้ใช้หรือสร้างลิงก์ ระบบจะเติมสิทธิ์เริ่มต้นจากชุดนี้ให้อัตโนมัติ
                </div>

                <div class="menu-permission-list">
                  <div v-for="menu in menuList" :key="menu.id" class="menu-permission-item">
                    <div
                      class="menu-permission-parent"
                      :class="{ 'permission-locked': isMenuLocked(menu) }"
                      @click="toggleMenuPermission(menu)"
                    >
                      <div class="menu-permission-title">
                        <q-checkbox
                          :model-value="getMenuSelectionState(menu)"
                          :disable="isMenuLocked(menu)"
                          color="primary"
                          dense
                          :indeterminate-value="null"
                        />
                        <span>{{ menu.label }}</span>
                      </div>
                      <q-badge v-if="isMenuLocked(menu)" color="blue-grey-2" text-color="blue-grey-8">
                        จำกัดตามสิทธิ์ของคุณ
                      </q-badge>
                    </div>

                    <div v-if="menu.children?.length" class="menu-permission-children">
                      <div
                        v-for="child in menu.children"
                        :key="child.id"
                        class="menu-permission-child"
                        :class="{ 'permission-locked': isPermissionLocked(child.id) }"
                        @click="togglePermission(child.id)"
                      >
                        <div class="menu-permission-title">
                          <q-checkbox
                            :model-value="form.default_permissions.includes(child.id)"
                            :disable="isPermissionLocked(child.id)"
                            color="primary"
                            dense
                          />
                          <span>{{ child.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="form.default_permissions.length > 0" class="selected-permission-chips q-mt-lg">
                  <q-chip
                    v-for="permissionId in form.default_permissions"
                    :key="permissionId"
                    removable
                    dense
                    color="primary"
                    text-color="white"
                    @remove="removePermission(permissionId)"
                  >
                    {{ permissionLabelMap[permissionId] || permissionId }}
                  </q-chip>
                </div>
              </section>
            </div>
          </q-card-section>

          <q-card-actions class="dialog-footer-actions q-px-lg q-pb-lg q-pt-md bg-white">
            <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps class="dialog-cancel-btn" />
            <q-btn
              unelevated
              color="primary"
              no-caps
              class="save-all-btn"
              :loading="saving"
              icon="fas fa-save"
              :label="isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างกลุ่มผู้ใช้งาน'"
              @click="saveRoleGroup"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showDeleteConfirm" persistent>
        <q-card class="confirm-dialog-card">
          <q-card-section class="row items-center no-wrap q-pb-none">
            <div class="confirm-icon bg-red-1 text-negative">
              <i class="fas fa-triangle-exclamation"></i>
            </div>
            <div class="q-ml-md">
              <div class="text-h6 text-weight-bold">ยืนยันการลบกลุ่มผู้ใช้งาน</div>
              <div class="text-caption text-blue-grey-6">การลบ role ที่ยังถูกใช้งานอยู่จะถูกระบบป้องกันไว้</div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1">
              ต้องการลบกลุ่มผู้ใช้งาน <strong>{{ deleteTarget?.label }}</strong>
              <span class="text-blue-grey-6">({{ deleteTarget?.name }})</span>
              ใช่หรือไม่
            </div>
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
import { useRoleGroupsPage } from '../composables/useRoleGroupsPage';

const {
  rowsPerPageOptions,
  pagination,
  loading,
  saving,
  searchText,
  showDialog,
  showDeleteConfirm,
  isEdit,
  deleteTarget,
  form,
  menuList,
  permissionLabelMap,
  scopeModeOptions,
  scopeModeHint,
  maxAssignableRank,
  rankHint,
  columns,
  filteredRoles,
  totalPages,
  paginatedRoles,
  paginationStart,
  paginationEnd,
  isPermissionLocked,
  getMenuSelectionState,
  isMenuLocked,
  normalizeRoleCode,
  scopeModeLabel,
  canDeleteRole,
  getDeleteDisabledReason,
  openCreateDialog,
  openEditDialog,
  togglePermission,
  toggleMenuPermission,
  removePermission,
  saveRoleGroup,
  confirmDelete,
  performDelete,
} = useRoleGroupsPage();
</script>

<style scoped lang="scss">
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

.tabs-container {
  display: flex;
  gap: 0;
  position: relative;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.page-tab-item {
  position: relative;
  padding: 0.9rem 0.4rem 0.95rem;
  margin-right: 2rem;
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
  cursor: default;
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

  :deep(.q-btn__content) {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    line-height: 1;
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
  min-width: 1080px;
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

.role-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.role-chip-wrap {
  flex-shrink: 0;
}

.role-kind-badge {
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.permission-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.table-value-muted {
  color: #64748b;
  font-weight: 600;
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

.delete-action-btn--locked {
  background: #dc2626 !important;
  color: #ffffff !important;
  opacity: 0.58 !important;
  box-shadow: none;

  :deep(.q-btn__content) {
    opacity: 1;
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
    background: linear-gradient(135deg, #3b82f6, #2563eb);
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

.user-dialog-card {
  border-radius: 60px !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.role-form-grid {
  display: grid;
  gap: 1.25rem;
}

.form-shell {
  background: white;
  border-radius: 32px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
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

.menu-permission-list {
  display: grid;
  gap: 0.85rem;
}

.menu-permission-item {
  display: grid;
  gap: 0.65rem;
}

.menu-permission-parent,
.menu-permission-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 22px;
  background: #f1f5f9;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #eef2ff;
    border-color: rgba(15, 77, 194, 0.18);
  }
}

.menu-permission-children {
  display: grid;
  gap: 0.65rem;
  padding-left: 1.25rem;
}

.menu-permission-child {
  background: #f8fbff;
}

.menu-permission-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;

  span {
    color: #1e293b;
    font-weight: 600;
  }
}

.permission-locked {
  background: #e8eef8 !important;

  span {
    color: #475569;
  }
}

.selected-permission-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dialog-footer-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.dialog-cancel-btn {
  min-height: 44px;
  padding: 0 1rem;
  border-radius: 999px;
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

  :deep(.q-btn__content) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    line-height: 1;
  }
}

.confirm-dialog-card {
  width: min(92vw, 460px);
  border-radius: 24px;
}

.confirm-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
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

  .menu-permission-children {
    padding-left: 0.5rem;
  }

  .dialog-footer-actions {
    flex-direction: column;
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
