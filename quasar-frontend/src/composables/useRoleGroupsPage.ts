import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  ROLE_RANKS,
  ROLE_SCOPE_MODE_LABELS,
} from '../constants/permissions';
import { useUserStore } from './useUserStore';
import { roleGroupService } from '../services/roleGroupService';
import { buildPermissionLabelMap, collectLeafPermissionIds, createPermissionMenuItems } from '../utils/permissionMenu';
import { notifyError } from '../utils/notify';
import type { PermissionMenuItem, RoleGroupForm } from '../types/user';
import type { RoleDefinition, RoleScopeMode } from '../types/role';

export function useRoleGroupsPage() {
  const $q = useQuasar();
  const { user: currentUser } = useUserStore();

  const rowsPerPageOptions = [10, 20, 50] as const;
  const pagination = ref({
    page: 1,
    rowsPerPage: 20,
  });
  const loading = ref(false);
  const saving = ref(false);
  const searchText = ref('');
  const roleGroups = ref<RoleDefinition[]>([]);
  const showDialog = ref(false);
  const showDeleteConfirm = ref(false);
  const isEdit = ref(false);
  const deleteTarget = ref<RoleDefinition | null>(null);
  const editingRoleName = ref<string | null>(null);
  const form = ref<RoleGroupForm>({
    name: '',
    label: '',
    rank: 1,
    scope_mode: 'flexible',
    default_permissions: [],
  });

  const menuList = computed<PermissionMenuItem[]>(() => createPermissionMenuItems());
  const permissionLabelMap = computed<Record<string, string>>(() => (
    buildPermissionLabelMap(menuList.value)
  ));

  const currentUserRoleMeta = computed(() => (
    roleGroups.value.find((role) => role.name === (currentUser.value?.roles?.[0] || null)) || null
  ));
  const currentUserRoleName = computed(() => currentUser.value?.roles?.[0] || null);
  const currentUserRank = computed(() => {
    const currentRoleName = currentUserRoleName.value;
    if (!currentRoleName) {
      return 0;
    }

    return ROLE_RANKS[currentRoleName] || currentUserRoleMeta.value?.rank || 0;
  });
  const currentUserGrantablePermissionSet = computed(() => new Set([
    ...(currentUser.value?.permissions || []),
    ...(currentUserRoleMeta.value?.default_permissions || []),
  ]));
  const maxAssignableRank = computed(() => {
    if (currentUserRank.value <= 0) {
      return 0;
    }

    if (currentUserRoleName.value === 'ADMIN') {
      return currentUserRank.value;
    }

    return Math.max(0, currentUserRank.value - 1);
  });

  const scopeModeOptions = computed(() => (
    Object.entries(ROLE_SCOPE_MODE_LABELS).map(([value, label]) => ({ value, label }))
  ));

  const scopeModeHint = computed(() => {
    const hints: Record<RoleScopeMode, string> = {
      flexible: 'role นี้กำหนด data scope ได้ยืดหยุ่นตามหน้าเพิ่มผู้ใช้',
      global: 'role นี้จะถูกบังคับให้เห็นข้อมูลระดับประเทศเท่านั้น',
      province: 'role นี้ต้องเลือกจังหวัดเดียว และจะเห็นทั้งจังหวัด',
      district: 'role นี้ต้องเลือกจังหวัดและอำเภอเดียว',
      sub_district: 'role นี้ต้องเลือกจังหวัด อำเภอ และตำบลเดียว',
      school: 'role นี้ต้องเลือกจังหวัด อำเภอ ตำบล และโรงเรียนเดียว',
    };

    return hints[form.value.scope_mode] || hints.flexible;
  });
  const rankHint = computed(() => {
    if (currentUserRank.value <= 0) {
      return 'ไม่พบข้อมูลลำดับสิทธิ์ของบัญชีปัจจุบัน กรุณาให้ผู้ดูแลระบบตรวจสอบ role ของคุณ';
    }

    if (currentUserRoleName.value === 'ADMIN') {
      return `บัญชี ADMIN สร้างหรือแก้ไข role ได้สูงสุดลำดับ ${currentUserRank.value}`;
    }

    if (maxAssignableRank.value <= 0) {
      return 'บัญชีนี้ไม่มีสิทธิ์สร้างหรือยกระดับ role ใหม่';
    }

    return `บัญชีของคุณกำหนด role ได้สูงสุดลำดับ ${maxAssignableRank.value} และต้องต่ำกว่าลำดับของตัวเอง`;
  });

  const columns: QTableColumn<RoleDefinition>[] = [
    { name: 'index', label: '#', field: 'name', align: 'left' },
    { name: 'role', label: 'กลุ่มผู้ใช้งาน', field: (row) => row.label, align: 'left' },
    { name: 'rank', label: 'ลำดับสิทธิ์', field: (row) => row.rank, align: 'left' },
    { name: 'scope', label: 'Data Scope', field: (row) => row.scope_mode, align: 'left' },
    { name: 'permissions', label: 'สิทธิ์เริ่มต้น', field: (row) => row.default_permissions.join(', '), align: 'left' },
    { name: 'usage', label: 'การใช้งาน', field: (row) => row.user_count || 0, align: 'left' },
    { name: 'actions', label: 'จัดการ', field: 'name', align: 'right' },
  ];

  const filteredRoles = computed(() => {
    if (!searchText.value.trim()) {
      return roleGroups.value;
    }

    const lowerSearch = searchText.value.toLowerCase();
    return roleGroups.value.filter((role) => (
      role.name.toLowerCase().includes(lowerSearch)
      || role.label.toLowerCase().includes(lowerSearch)
    ));
  });

  const totalPages = computed(() => (
    Math.max(1, Math.ceil(filteredRoles.value.length / pagination.value.rowsPerPage))
  ));
  const paginatedRoles = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
    return filteredRoles.value.slice(start, start + pagination.value.rowsPerPage);
  });
  const paginationStart = computed(() => (
    filteredRoles.value.length === 0 ? 0 : (pagination.value.page - 1) * pagination.value.rowsPerPage + 1
  ));
  const paginationEnd = computed(() => (
    filteredRoles.value.length === 0 ? 0 : Math.min(pagination.value.page * pagination.value.rowsPerPage, filteredRoles.value.length)
  ));

  function canGrantPermission(permissionId: string): boolean {
    return (
      GRANT_EXEMPT_PERMISSION_IDS.includes(permissionId)
      || currentUserGrantablePermissionSet.value.has('*')
      || currentUserGrantablePermissionSet.value.has('ALL')
      || currentUserGrantablePermissionSet.value.has(permissionId)
    );
  }

  function isPermissionLocked(permissionId: string): boolean {
    return !form.value.default_permissions.includes(permissionId) && !canGrantPermission(permissionId);
  }

  function getLeafChildPermissions(menu: PermissionMenuItem): string[] {
    return menu.children && menu.children.length > 0
      ? collectLeafPermissionIds(menu.children)
      : [menu.id];
  }

  function getMenuSelectionState(menu: PermissionMenuItem) {
    const permissionIds = getLeafChildPermissions(menu);
    const selectedCount = permissionIds.filter((permissionId) => (
      form.value.default_permissions.includes(permissionId)
    )).length;

    if (selectedCount === 0) return false;
    if (selectedCount === permissionIds.length) return true;
    return null;
  }

  function isMenuLocked(menu: PermissionMenuItem): boolean {
    return getLeafChildPermissions(menu).every((permissionId) => (
      !form.value.default_permissions.includes(permissionId) && !canGrantPermission(permissionId)
    ));
  }

  function normalizeRoleCode(value: string): string {
    return String(value || '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  }

  function scopeModeLabel(mode?: string | null): string {
    return ROLE_SCOPE_MODE_LABELS[(mode || 'flexible') as RoleScopeMode] || ROLE_SCOPE_MODE_LABELS.flexible;
  }

  function canDeleteRole(role: RoleDefinition): boolean {
    return !role.is_system && (role.user_count || 0) === 0 && (role.login_link_count || 0) === 0;
  }

  function getDeleteDisabledReason(role: RoleDefinition): string {
    if (role.is_system) {
      return 'ลบไม่ได้ เพราะเป็น role ของระบบ';
    }

    if ((role.user_count || 0) > 0) {
      return `ลบไม่ได้ เพราะยังมีผู้ใช้ ${role.user_count || 0} คนใช้งาน role นี้`;
    }

    if ((role.login_link_count || 0) > 0) {
      return `ลบไม่ได้ เพราะยังมีลิงก์เข้าสู่ระบบ ${role.login_link_count || 0} รายการใช้งาน role นี้`;
    }

    return 'ลบ role นี้ได้';
  }

  async function fetchRoleGroups(): Promise<void> {
    loading.value = true;
    try {
      roleGroups.value = await roleGroupService.getRoleGroups();
    } catch (error) {
      console.error('Error fetching role groups:', error);
      notifyError($q, error, 'ไม่สามารถโหลดข้อมูลกลุ่มผู้ใช้งานได้');
    } finally {
      loading.value = false;
    }
  }

  function resetForm(): void {
    isEdit.value = false;
    editingRoleName.value = null;
    form.value = {
      name: '',
      label: '',
      rank: 1,
      scope_mode: 'flexible',
      default_permissions: [],
    };
  }

  function openCreateDialog(): void {
    resetForm();
    showDialog.value = true;
  }

  function openEditDialog(role: RoleDefinition): void {
    isEdit.value = true;
    editingRoleName.value = role.name;
    form.value = {
      name: role.name,
      label: role.label,
      rank: role.rank,
      scope_mode: role.scope_mode,
      default_permissions: [...role.default_permissions],
    };
    showDialog.value = true;
  }

  function togglePermission(permissionId: string): void {
    const isSelected = form.value.default_permissions.includes(permissionId);
    if (!isSelected && !canGrantPermission(permissionId)) {
      return;
    }

    if (isSelected) {
      form.value.default_permissions = form.value.default_permissions.filter((item) => item !== permissionId);
      return;
    }

    form.value.default_permissions = Array.from(
      new Set([...form.value.default_permissions, permissionId]),
    );
  }

  function toggleMenuPermission(menu: PermissionMenuItem): void {
    const childPermissions = getLeafChildPermissions(menu);
    const manageablePermissions = childPermissions.filter((permissionId) => (
      form.value.default_permissions.includes(permissionId) || canGrantPermission(permissionId)
    ));
    const allSelected = manageablePermissions.length > 0
      && manageablePermissions.every((permissionId) => form.value.default_permissions.includes(permissionId));

    if (allSelected) {
      form.value.default_permissions = form.value.default_permissions.filter(
        (permissionId) => !manageablePermissions.includes(permissionId),
      );
      return;
    }

    const nextPermissions = new Set(form.value.default_permissions);
    manageablePermissions
      .filter((permissionId) => canGrantPermission(permissionId))
      .forEach((permissionId) => nextPermissions.add(permissionId));
    form.value.default_permissions = Array.from(nextPermissions);
  }

  function removePermission(permissionId: string): void {
    form.value.default_permissions = form.value.default_permissions.filter((item) => item !== permissionId);
  }

  async function saveRoleGroup(): Promise<void> {
    const payload: RoleGroupForm = {
      name: normalizeRoleCode(form.value.name),
      label: form.value.label.trim(),
      rank: Number(form.value.rank),
      scope_mode: form.value.scope_mode,
      default_permissions: [...form.value.default_permissions],
    };

    const missingFields: string[] = [];
    if (!payload.name && !isEdit.value) missingFields.push('รหัสกลุ่มผู้ใช้งาน');
    if (!payload.label) missingFields.push('ชื่อกลุ่มผู้ใช้งาน');
    if (!Number.isInteger(payload.rank) || payload.rank < 1) missingFields.push('ลำดับสิทธิ์');
    if (payload.default_permissions.length === 0) missingFields.push('สิทธิ์เริ่มต้นอย่างน้อย 1 รายการ');

    if (missingFields.length > 0) {
      $q.notify({
        color: 'negative',
        message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`,
        position: 'top',
      });
      return;
    }

    if (currentUserRank.value <= 0) {
      $q.notify({
        color: 'negative',
        message: 'ไม่พบข้อมูลลำดับสิทธิ์ของบัญชีปัจจุบัน กรุณาเข้าสู่ระบบใหม่หรือตรวจสอบ role ของคุณ',
        position: 'top',
      });
      return;
    }

    if (
      payload.rank > currentUserRank.value
      || (payload.rank === currentUserRank.value && currentUserRoleName.value !== 'ADMIN')
    ) {
      $q.notify({
        color: 'negative',
        message: currentUserRoleName.value === 'ADMIN'
          ? `บัญชี ADMIN กำหนด role ได้สูงสุดลำดับ ${currentUserRank.value}`
          : `ไม่สามารถกำหนดลำดับสิทธิ์ ${payload.rank} ได้ เพราะบัญชีของคุณกำหนดได้สูงสุดลำดับ ${maxAssignableRank.value}`,
        position: 'top',
      });
      return;
    }

    saving.value = true;
    try {
      if (isEdit.value && editingRoleName.value) {
        await roleGroupService.updateRoleGroup(editingRoleName.value, payload);
        $q.notify({ color: 'positive', message: 'แก้ไขกลุ่มผู้ใช้งานสำเร็จ', position: 'top' });
      } else {
        await roleGroupService.createRoleGroup(payload);
        $q.notify({ color: 'positive', message: 'เพิ่มกลุ่มผู้ใช้งานสำเร็จ', position: 'top' });
      }

      showDialog.value = false;
      await fetchRoleGroups();
      resetForm();
    } catch (error: unknown) {
      notifyError($q, error, 'เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล');
    } finally {
      saving.value = false;
    }
  }

  function confirmDelete(role: RoleDefinition): void {
    deleteTarget.value = role;
    showDeleteConfirm.value = true;
  }

  async function performDelete(): Promise<void> {
    if (!deleteTarget.value) {
      return;
    }

    try {
      await roleGroupService.deleteRoleGroup(deleteTarget.value.name);
      $q.notify({ color: 'positive', message: 'ลบกลุ่มผู้ใช้งานสำเร็จ', position: 'top' });
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      await fetchRoleGroups();
    } catch (error: unknown) {
      notifyError($q, error, 'ไม่สามารถลบกลุ่มผู้ใช้งานได้');
    }
  }

  watch(searchText, () => {
    pagination.value.page = 1;
  });

  watch(() => pagination.value.rowsPerPage, () => {
    pagination.value.page = 1;
  });

  watch(() => filteredRoles.value.length, () => {
    if (pagination.value.page > totalPages.value) {
      pagination.value.page = totalPages.value;
    }
  });

  onMounted(() => {
    void fetchRoleGroups();
  });

  return {
    rowsPerPageOptions,
    pagination,
    loading,
    saving,
    searchText,
    roleGroups,
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
    fetchRoleGroups,
    openCreateDialog,
    openEditDialog,
    togglePermission,
    toggleMenuPermission,
    removePermission,
    saveRoleGroup,
    confirmDelete,
    performDelete,
  };
}
