import { computed, nextTick, ref, watch, type Ref } from 'vue';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  PERMISSION_DELTA_LEGEND,
  PERMISSION_DELTA_META,
  getPermissionDeltaState,
  getPermissionDeltaSummary,
  getRoleScopePreset,
} from '../constants/permissions';
import { useAttendanceFilters } from './useAttendanceFilters';
import { useUserStore } from './useUserStore';
import {
  mapAttendanceGradesToOptions,
  mapAttendanceSchoolsToOptions,
} from '../utils/attendanceLookupOptions';
import { buildLoginDataScope, createTaskScopeFormModel } from '../utils/taskForm';
import { collectLeafPermissionIds, createPermissionMenuItems } from '../utils/permissionMenu';
import type { PermissionMenuItem } from '../types/user';
import type { TaskScopeFormModel } from '../types/task';
import type { DataScope } from '../constants/permissions';
import type { RoleDefinition, ScopeFormField } from '../types/role';

interface UseUserScopeFormOptions {
  roles: Ref<RoleDefinition[]>;
  selectedRole: Ref<string | null>;
  customPermissions: Ref<string[]>;
  scopeForm: Ref<TaskScopeFormModel>;
  isEdit: Ref<boolean>;
  editingUserId: Ref<number | null>;
}

const scopeFieldLabels: Record<ScopeFormField, string> = {
  province: 'จังหวัด',
  district: 'อำเภอ',
  sub_district: 'ตำบล',
  school_id: 'โรงเรียน',
  grade_level: 'ระดับชั้น',
  room: 'ห้องเรียน',
};

export function useUserScopeForm(options: UseUserScopeFormOptions) {
  const { user: currentUser } = useUserStore();
  const suppressRolePermissionSync = ref(false);
  const menuList = ref<PermissionMenuItem[]>(createPermissionMenuItems());

  const {
    gradeLevels,
    schools,
    rooms,
    locationData,
    loadLocations,
    loadAllSchools,
    loadGradeLevels,
    loadRooms,
  } = useAttendanceFilters();

  const schoolOptions = computed(() => mapAttendanceSchoolsToOptions(schools.value));
  const gradeOptions = computed(() => mapAttendanceGradesToOptions(gradeLevels.value));
  const permissionLegendItems = PERMISSION_DELTA_LEGEND;

  const normalizeScopeValueList = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  };

  const currentUserRoleMeta = computed(() => (
    options.roles.value.find((role) => role.name === (currentUser.value?.roles?.[0] || null)) || null
  ));
  const currentUserGrantablePermissionSet = computed(() => new Set([
    ...(currentUser.value?.permissions || []),
    ...(currentUserRoleMeta.value?.default_permissions || []),
  ]));
  const currentUserScope = computed(() => ({
    provinces: normalizeScopeValueList(currentUser.value?.data_scope?.provinces),
    districts: normalizeScopeValueList(currentUser.value?.data_scope?.districts),
    sub_districts: normalizeScopeValueList(currentUser.value?.data_scope?.sub_districts),
    school_ids: normalizeScopeValueList(currentUser.value?.data_scope?.school_ids),
    grade_levels: normalizeScopeValueList(currentUser.value?.data_scope?.grade_levels),
    room_ids: normalizeScopeValueList(currentUser.value?.data_scope?.room_ids),
  }));
  const canUseNationwideScope = computed(() => (
    currentUserScope.value.provinces.length === 0
    && currentUserScope.value.districts.length === 0
    && currentUserScope.value.sub_districts.length === 0
    && currentUserScope.value.school_ids.length === 0
  ));
  const selectedRoleMeta = computed(() => (
    options.roles.value.find((role) => role.name === options.selectedRole.value) || null
  ));
  const roleDefaultPermissions = computed(() => selectedRoleMeta.value?.default_permissions || []);
  const roleScopePreset = computed(() => (
    getRoleScopePreset(options.selectedRole.value, selectedRoleMeta.value?.scope_mode)
  ));
  const isNationwideToggleDisabled = computed(() => (
    roleScopePreset.value.mode !== 'flexible' || !canUseNationwideScope.value
  ));

  const roleOptions = computed(() => {
    const currentRole = currentUser.value?.roles?.[0] || null;
    const currentRank = options.roles.value.find((role) => role.name === currentRole)?.rank || 0;
    const assignableRoles = options.roles.value
      .filter((role) => {
        const targetRank = role.rank || 0;
        if (targetRank > currentRank) {
          return false;
        }

        if (targetRank === currentRank && currentRole !== 'ADMIN') {
          return false;
        }

        return true;
      })
      .map((role) => ({ label: role.label, value: role.name }));

    if (
      options.isEdit.value
      && options.editingUserId.value === currentUser.value?.id
      && options.selectedRole.value
      && !assignableRoles.some((role) => role.value === options.selectedRole.value)
    ) {
      const selfRole = options.roles.value.find((role) => role.name === options.selectedRole.value);
      if (selfRole) {
        assignableRoles.unshift({ label: selfRole.label, value: selfRole.name });
      }
    }

    return assignableRoles;
  });

  const districtOptions = computed(() => {
    if (!options.scopeForm.value.province) return [];

    let nextOptions = Array.from(new Set(
      locationData.districts
        .filter((item) => item.province === options.scopeForm.value.province)
        .map((item) => item.district),
    ));

    if (currentUserScope.value.districts.length > 0) {
      nextOptions = nextOptions.filter((district) => currentUserScope.value.districts.includes(district));
    }

    return nextOptions;
  });

  const subDistrictOptions = computed(() => {
    if (!options.scopeForm.value.province || !options.scopeForm.value.district) return [];

    let nextOptions = Array.from(new Set(
      locationData.subDistricts
        .filter((item) => (
          item.province === options.scopeForm.value.province
          && item.district === options.scopeForm.value.district
        ))
        .map((item) => item.sub_district),
    ));

    if (currentUserScope.value.sub_districts.length > 0) {
      nextOptions = nextOptions.filter((subDistrict) => currentUserScope.value.sub_districts.includes(subDistrict));
    }

    return nextOptions;
  });

  const filteredSchools = computed(() => {
    let list = schoolOptions.value;

    if (currentUserScope.value.provinces.length > 0) {
      list = list.filter((school) => currentUserScope.value.provinces.includes(String(school.province || '')));
    }
    if (currentUserScope.value.districts.length > 0) {
      list = list.filter((school) => currentUserScope.value.districts.includes(String(school.district || '')));
    }
    if (currentUserScope.value.sub_districts.length > 0) {
      list = list.filter((school) => currentUserScope.value.sub_districts.includes(String(school.sub_district || '')));
    }
    if (currentUserScope.value.school_ids.length > 0) {
      list = list.filter((school) => currentUserScope.value.school_ids.includes(String(school.value)));
    }

    if (options.scopeForm.value.allProvinces) {
      return list;
    }
    if (options.scopeForm.value.province) {
      list = list.filter((school) => school.province === options.scopeForm.value.province);
    }
    if (options.scopeForm.value.district) {
      list = list.filter((school) => school.district === options.scopeForm.value.district);
    }
    if (options.scopeForm.value.sub_district) {
      list = list.filter((school) => school.sub_district === options.scopeForm.value.sub_district);
    }

    return list;
  });

  const availableProvinceOptions = computed(() => (
    currentUserScope.value.provinces.length > 0
      ? locationData.provinces.filter((province) => currentUserScope.value.provinces.includes(province))
      : locationData.provinces
  ));

  const availableDistrictOptions = computed(() => (
    currentUserScope.value.districts.length > 0
      ? districtOptions.value.filter((district) => currentUserScope.value.districts.includes(district))
      : districtOptions.value
  ));

  const availableSubDistrictOptions = computed(() => (
    currentUserScope.value.sub_districts.length > 0
      ? subDistrictOptions.value.filter((subDistrict) => currentUserScope.value.sub_districts.includes(subDistrict))
      : subDistrictOptions.value
  ));

  const availableGradeOptions = computed(() => (
    currentUserScope.value.grade_levels.length > 0
      ? gradeOptions.value.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.value)))
      : gradeOptions.value
  ));

  const availableRoomOptions = computed(() => (
    currentUserScope.value.room_ids.length > 0
      ? rooms.value.filter((room) => currentUserScope.value.room_ids.includes(String(room)))
      : rooms.value
  ));

  async function ensureScopeOptionsLoaded(): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (locationData.provinces.length === 0) tasks.push(loadLocations().then(() => undefined));
    if (schools.value.length === 0) tasks.push(loadAllSchools({ syncTempSchools: false }).then(() => undefined));
    if (gradeLevels.value.length === 0) tasks.push(loadGradeLevels().then(() => undefined));

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  function applyScopeForm(dataScope?: DataScope): void {
    const ds = dataScope || {};
    options.scopeForm.value = {
      allProvinces: canUseNationwideScope.value
        && !ds.provinces?.length
        && !ds.districts?.length
        && !ds.sub_districts?.length
        && !ds.school_ids?.length,
      province: ds.provinces?.[0] || null,
      district: ds.districts?.[0] || null,
      sub_district: ds.sub_districts?.[0] || null,
      school_id: ds.school_ids?.[0] || null,
      grade_level: ds.grade_levels?.[0] || null,
      room: (ds.room_ids?.[0] as string | null | undefined) || null,
    };
  }

  function resetScopeForm(): void {
    options.scopeForm.value = createTaskScopeFormModel(canUseNationwideScope.value);
    rooms.value = [];
  }

  async function fetchRooms(): Promise<void> {
    if (!options.scopeForm.value.grade_level || !options.scopeForm.value.school_id) {
      rooms.value = [];
      options.scopeForm.value.room = null;
      return;
    }

    try {
      const selectedGrade = gradeOptions.value.find((grade) => grade.value === options.scopeForm.value.grade_level);
      const gradeLabel = selectedGrade ? selectedGrade.label : null;
      if (!gradeLabel) return;

      await loadRooms(gradeLabel, options.scopeForm.value.school_id);
      if (options.scopeForm.value.room && !rooms.value.includes(String(options.scopeForm.value.room))) {
        options.scopeForm.value.room = null;
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }

  function onScopeProvinceChange(): void {
    options.scopeForm.value.allProvinces = false;
    options.scopeForm.value.district = null;
    options.scopeForm.value.sub_district = null;
    options.scopeForm.value.school_id = null;
    options.scopeForm.value.grade_level = null;
    options.scopeForm.value.room = null;
    rooms.value = [];
  }

  function onScopeDistrictChange(): void {
    options.scopeForm.value.sub_district = null;
    options.scopeForm.value.school_id = null;
    options.scopeForm.value.grade_level = null;
    options.scopeForm.value.room = null;
    rooms.value = [];
  }

  function onAllProvincesToggle(enabled: boolean | null): void {
    if (!canUseNationwideScope.value) {
      options.scopeForm.value.allProvinces = false;
      return;
    }

    if (!enabled) {
      return;
    }

    options.scopeForm.value.province = null;
    options.scopeForm.value.district = null;
    options.scopeForm.value.sub_district = null;
    options.scopeForm.value.school_id = null;
    options.scopeForm.value.grade_level = null;
    options.scopeForm.value.room = null;
    rooms.value = [];
  }

  function onScopeSchoolChange(): void {
    options.scopeForm.value.room = null;
  }

  function isScopeFieldLocked(field: ScopeFormField): boolean {
    return !roleScopePreset.value.allowedFields.includes(field);
  }

  function applyRoleScopePreset(): void {
    const preset = roleScopePreset.value;

    if (preset.mode === 'flexible') {
      return;
    }

    if (preset.mode === 'global') {
      options.scopeForm.value.allProvinces = true;
      options.scopeForm.value.province = null;
      options.scopeForm.value.district = null;
      options.scopeForm.value.sub_district = null;
      options.scopeForm.value.school_id = null;
      options.scopeForm.value.grade_level = null;
      options.scopeForm.value.room = null;
      rooms.value = [];
      return;
    }

    options.scopeForm.value.allProvinces = false;

    if (!preset.allowedFields.includes('province')) options.scopeForm.value.province = null;
    if (!preset.allowedFields.includes('district')) options.scopeForm.value.district = null;
    if (!preset.allowedFields.includes('sub_district')) options.scopeForm.value.sub_district = null;
    if (!preset.allowedFields.includes('school_id')) options.scopeForm.value.school_id = null;
    if (!preset.allowedFields.includes('grade_level')) options.scopeForm.value.grade_level = null;
    if (!preset.allowedFields.includes('room')) options.scopeForm.value.room = null;

    if (preset.requiredFields.includes('province') && !options.scopeForm.value.province && availableProvinceOptions.value.length === 1) {
      options.scopeForm.value.province = availableProvinceOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('district') && !options.scopeForm.value.district && availableDistrictOptions.value.length === 1) {
      options.scopeForm.value.district = availableDistrictOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('sub_district') && !options.scopeForm.value.sub_district && availableSubDistrictOptions.value.length === 1) {
      options.scopeForm.value.sub_district = availableSubDistrictOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('school_id') && !options.scopeForm.value.school_id && filteredSchools.value.length === 1) {
      options.scopeForm.value.school_id = Number(filteredSchools.value[0]?.value) || null;
    }

    if (isScopeFieldLocked('room')) {
      rooms.value = [];
    }
  }

  const effectivePermissions = computed(() => Array.from(new Set(options.customPermissions.value)));
  const validPermissionIds = computed(() => new Set(collectLeafPermissionIds(menuList.value)));

  function sanitizePermissions(permissions: string[]): string[] {
    return Array.from(new Set(
      permissions.filter((permission) => validPermissionIds.value.has(permission)),
    ));
  }

  function setCustomPermissionsFromStored(permissions: string[]): void {
    options.customPermissions.value = sanitizePermissions(permissions);
  }

  function canGrantPermission(permissionId: string): boolean {
    return (
      GRANT_EXEMPT_PERMISSION_IDS.includes(permissionId)
      || currentUserGrantablePermissionSet.value.has('*')
      || currentUserGrantablePermissionSet.value.has('ALL')
      || currentUserGrantablePermissionSet.value.has(permissionId)
    );
  }

  function isPermissionLocked(permissionId: string): boolean {
    return !effectivePermissions.value.includes(permissionId) && !canGrantPermission(permissionId);
  }

  function getPermissionVisualState(permissionId: string) {
    return getPermissionDeltaState(
      permissionId,
      effectivePermissions.value,
      roleDefaultPermissions.value,
      isPermissionLocked(permissionId),
    );
  }

  function getPermissionVisualMeta(permissionId: string) {
    return PERMISSION_DELTA_META[getPermissionVisualState(permissionId)];
  }

  function getLeafChildPermissions(menu: PermissionMenuItem): string[] {
    return menu.children && menu.children.length > 0
      ? collectLeafPermissionIds(menu.children)
      : [menu.id];
  }

  function getMenuSelectionState(menu: PermissionMenuItem) {
    const permissionIds = getLeafChildPermissions(menu);
    const selectedCount = permissionIds.filter((permissionId) => effectivePermissions.value.includes(permissionId)).length;

    if (selectedCount === 0) return false;
    if (selectedCount === permissionIds.length) return true;
    return null;
  }

  function isMenuLocked(menu: PermissionMenuItem): boolean {
    const permissionIds = getLeafChildPermissions(menu);
    return permissionIds.every((permissionId) => (
      !effectivePermissions.value.includes(permissionId) && !canGrantPermission(permissionId)
    ));
  }

  function getMenuPermissionSummary(menu: PermissionMenuItem) {
    return getPermissionDeltaSummary(
      getLeafChildPermissions(menu),
      effectivePermissions.value,
      roleDefaultPermissions.value,
      (permissionId) => isPermissionLocked(permissionId),
    );
  }

  function togglePermission(permissionId: string): void {
    const isSelected = options.customPermissions.value.includes(permissionId);
    if (!isSelected && !canGrantPermission(permissionId)) {
      return;
    }

    const index = options.customPermissions.value.indexOf(permissionId);
    if (index === -1) {
      options.customPermissions.value.push(permissionId);
    } else {
      options.customPermissions.value.splice(index, 1);
    }
  }

  function toggleMenuPermission(menu: PermissionMenuItem): void {
    if (!menu.children || menu.children.length === 0) {
      togglePermission(menu.id);
      return;
    }

    const childPermissions = getLeafChildPermissions(menu);
    const manageablePermissions = childPermissions.filter((permissionId) => (
      effectivePermissions.value.includes(permissionId) || canGrantPermission(permissionId)
    ));
    const allSelected = manageablePermissions.length > 0
      && manageablePermissions.every((permissionId) => effectivePermissions.value.includes(permissionId));

    if (allSelected) {
      options.customPermissions.value = options.customPermissions.value.filter(
        (permissionId) => !manageablePermissions.includes(permissionId),
      );
      return;
    }

    const nextPermissions = new Set(options.customPermissions.value);
    manageablePermissions
      .filter((permissionId) => canGrantPermission(permissionId))
      .forEach((permissionId) => nextPermissions.add(permissionId));
    options.customPermissions.value = sanitizePermissions(Array.from(nextPermissions));
  }

  function resetPermissionMenuState(): void {
    menuList.value = createPermissionMenuItems();
  }

  watch(() => [options.scopeForm.value.grade_level, options.scopeForm.value.school_id], () => {
    if (options.scopeForm.value.grade_level && options.scopeForm.value.school_id) {
      void fetchRooms();
    } else {
      rooms.value = [];
      options.scopeForm.value.room = null;
    }
  });

  watch(options.selectedRole, () => {
    applyRoleScopePreset();

    if (!suppressRolePermissionSync.value) {
      options.customPermissions.value = sanitizePermissions(
        (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
      );
    }
  });

  async function initializeForEdit(dataScope: DataScope | undefined, permissions: string[]): Promise<void> {
    suppressRolePermissionSync.value = true;
    await nextTick();
    applyScopeForm(dataScope);
    setCustomPermissionsFromStored(permissions);
    await nextTick();
    suppressRolePermissionSync.value = false;
    if (options.scopeForm.value.grade_level && options.scopeForm.value.school_id) {
      await fetchRooms();
    } else {
      rooms.value = [];
    }
  }

  return {
    permissionLegendItems,
    menuList,
    roleOptions,
    selectedRoleMeta,
    roleScopePreset,
    scopeFieldLabels,
    availableProvinceOptions,
    availableDistrictOptions,
    availableSubDistrictOptions,
    filteredSchools,
    availableGradeOptions,
    availableRoomOptions,
    isNationwideToggleDisabled,
    ensureScopeOptionsLoaded,
    applyScopeForm,
    resetScopeForm,
    fetchRooms,
    onAllProvincesToggle,
    onScopeProvinceChange,
    onScopeDistrictChange,
    onScopeSchoolChange,
    isScopeFieldLocked,
    effectivePermissions,
    isPermissionLocked,
    getPermissionVisualState,
    getPermissionVisualMeta,
    getMenuSelectionState,
    isMenuLocked,
    getMenuPermissionSummary,
    togglePermission,
    toggleMenuPermission,
    setCustomPermissionsFromStored,
    initializeForEdit,
    buildDataScope: () => buildLoginDataScope(options.scopeForm.value),
    resetPermissionMenuState,
    canUseNationwideScope,
  };
}
