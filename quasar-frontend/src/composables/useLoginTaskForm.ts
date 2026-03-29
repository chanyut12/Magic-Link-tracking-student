import { computed, nextTick, ref, watch, type ComputedRef, type Ref } from 'vue';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  PERMISSION_DELTA_LEGEND,
  PERMISSION_DELTA_META,
  getPermissionDeltaState,
  getRoleScopePreset,
  getLeafMenuItems,
} from '../constants/permissions';
import { useAttendanceFilters } from './useAttendanceFilters';
import { useUserStore } from './useUserStore';
import { taskService } from '../services/taskService';
import {
  mapAttendanceGradesToOptions,
  mapAttendanceSchoolsToOptions,
} from '../utils/attendanceLookupOptions';
import { buildLoginDataScope } from '../utils/taskForm';
import type { LoginTaskFormModel, TaskScopeFormModel } from '../types/task';
import type { RoleDefinition, ScopeFormField } from '../types/role';

type MaybeRefBoolean = boolean | Ref<boolean> | ComputedRef<boolean>;

interface UseLoginTaskFormOptions {
  form: Pick<LoginTaskFormModel, 'role' | 'permissions'>;
  scopeForm: TaskScopeFormModel;
  enabled?: MaybeRefBoolean;
}

const scopeFieldLabels: Record<ScopeFormField, string> = {
  province: 'จังหวัด',
  district: 'อำเภอ',
  sub_district: 'ตำบล',
  school_id: 'โรงเรียน',
  grade_level: 'ระดับชั้น',
  room: 'ห้องเรียน',
};

export function useLoginTaskForm(options: UseLoginTaskFormOptions) {
  const { user } = useUserStore();
  const enabled = computed(() => (
    typeof options.enabled === 'boolean' ? options.enabled : options.enabled?.value ?? true
  ));

  const rolesCatalog = ref<RoleDefinition[]>([]);
  const suppressRolePermissionSync = ref(false);

  const {
    gradeLevels,
    schools,
    rooms: roomOptions,
    locationData,
    loadLocations,
    loadAllSchools,
    loadGradeLevels,
    loadRooms,
  } = useAttendanceFilters();

  const permissionOptions = getLeafMenuItems().map((item) => ({
    label: item.label,
    value: item.id,
  }));
  const permissionLegendItems = PERMISSION_DELTA_LEGEND;

  const schoolOptions = computed(() => mapAttendanceSchoolsToOptions(schools.value));
  const gradeOptions = computed(() => mapAttendanceGradesToOptions(gradeLevels.value));

  const permissionLabelMap = computed<Record<string, string>>(() => (
    Object.fromEntries(permissionOptions.map((item) => [item.value, item.label]))
  ));

  const roleLabelMap = computed<Record<string, string>>(() => (
    Object.fromEntries(rolesCatalog.value.map((role) => [role.name, role.label]))
  ));

  const normalizeScopeValueList = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  };

  const currentUserRole = computed(() => user.value?.roles?.[0] || null);
  const currentUserRoleMeta = computed(() => (
    rolesCatalog.value.find((role) => role.name === (user.value?.roles?.[0] || null)) || null
  ));
  const currentUserGrantablePermissionSet = computed(() => new Set([
    ...(user.value?.permissions || []),
    ...(currentUserRoleMeta.value?.default_permissions || []),
  ]));
  const currentUserScope = computed(() => ({
    provinces: normalizeScopeValueList(user.value?.data_scope?.provinces),
    districts: normalizeScopeValueList(user.value?.data_scope?.districts),
    sub_districts: normalizeScopeValueList(user.value?.data_scope?.sub_districts),
    school_ids: normalizeScopeValueList(user.value?.data_scope?.school_ids),
    grade_levels: normalizeScopeValueList(user.value?.data_scope?.grade_levels),
    room_ids: normalizeScopeValueList(user.value?.data_scope?.room_ids),
  }));
  const selectedRoleMeta = computed(() => (
    rolesCatalog.value.find((role) => role.name === options.form.role) || null
  ));
  const roleDefaultPermissions = computed(() => selectedRoleMeta.value?.default_permissions || []);
  const roleScopePreset = computed(() => (
    getRoleScopePreset(options.form.role, selectedRoleMeta.value?.scope_mode)
  ));
  const canUseNationwideScope = computed(() => (
    currentUserScope.value.provinces.length === 0 &&
    currentUserScope.value.districts.length === 0 &&
    currentUserScope.value.sub_districts.length === 0 &&
    currentUserScope.value.school_ids.length === 0
  ));
  const isNationwideToggleDisabled = computed(() => (
    roleScopePreset.value.mode !== 'flexible' || !canUseNationwideScope.value
  ));

  const roleOptions = computed(() => {
    const actorRole = currentUserRole.value;
    const actorRank = rolesCatalog.value.find((role) => role.name === actorRole)?.rank || 0;

    return rolesCatalog.value
      .filter((role) => {
        const targetRank = role.rank || 0;
        if (targetRank > actorRank) {
          return false;
        }

        if (targetRank === actorRank && actorRole !== 'ADMIN') {
          return false;
        }

        return true;
      })
      .sort((a, b) => (b.rank || 0) - (a.rank || 0))
      .map((role) => ({ value: role.name, label: role.label }));
  });

  const availableProvinceOptions = computed(() => (
    currentUserScope.value.provinces.length > 0
      ? locationData.provinces.filter((province) => currentUserScope.value.provinces.includes(province))
      : locationData.provinces
  ));

  const availableDistrictOptions = computed(() => {
    if (!options.scopeForm.province) return [];

    let available = Array.from(new Set(
      locationData.districts
        .filter((item) => item.province === options.scopeForm.province)
        .map((item) => item.district),
    ));

    if (currentUserScope.value.districts.length > 0) {
      available = available.filter((district) => currentUserScope.value.districts.includes(district));
    }

    return available;
  });

  const availableSubDistrictOptions = computed(() => {
    if (!options.scopeForm.province || !options.scopeForm.district) return [];

    let available = Array.from(new Set(
      locationData.subDistricts
        .filter((item) => (
          item.province === options.scopeForm.province
          && item.district === options.scopeForm.district
        ))
        .map((item) => item.sub_district),
    ));

    if (currentUserScope.value.sub_districts.length > 0) {
      available = available.filter((subDistrict) => currentUserScope.value.sub_districts.includes(subDistrict));
    }

    return available;
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

    if (options.scopeForm.allProvinces) {
      return list;
    }
    if (options.scopeForm.province) {
      list = list.filter((school) => school.province === options.scopeForm.province);
    }
    if (options.scopeForm.district) {
      list = list.filter((school) => school.district === options.scopeForm.district);
    }
    if (options.scopeForm.sub_district) {
      list = list.filter((school) => school.sub_district === options.scopeForm.sub_district);
    }

    return list;
  });

  const availableGradeLevels = computed(() => (
    currentUserScope.value.grade_levels.length > 0
      ? gradeLevels.value.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.id)))
      : gradeLevels.value
  ));

  const availableGradeOptions = computed(() => (
    currentUserScope.value.grade_levels.length > 0
      ? gradeOptions.value.filter((grade) => currentUserScope.value.grade_levels.includes(String(grade.value)))
      : gradeOptions.value
  ));

  const availableRoomOptions = computed(() => (
    currentUserScope.value.room_ids.length > 0
      ? roomOptions.value.filter((room) => currentUserScope.value.room_ids.includes(String(room)))
      : roomOptions.value
  ));

  async function fetchRolesCatalog(): Promise<void> {
    rolesCatalog.value = await taskService.getRolesCatalog();
  }

  async function ensureOptionsLoaded(): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (locationData.provinces.length === 0) tasks.push(loadLocations().then(() => undefined));
    if (schools.value.length === 0) tasks.push(loadAllSchools({ syncTempSchools: false }).then(() => undefined));
    if (gradeLevels.value.length === 0) tasks.push(loadGradeLevels().then(() => undefined));
    if (rolesCatalog.value.length === 0) tasks.push(fetchRolesCatalog());

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  function resetScopeForm(): void {
    options.scopeForm.allProvinces = canUseNationwideScope.value;
    options.scopeForm.province = null;
    options.scopeForm.district = null;
    options.scopeForm.sub_district = null;
    options.scopeForm.school_id = null;
    options.scopeForm.grade_level = null;
    options.scopeForm.room = null;
    roomOptions.value = [];
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
      resetScopeForm();
      options.scopeForm.allProvinces = true;
      return;
    }

    options.scopeForm.allProvinces = false;

    if (!preset.allowedFields.includes('province')) options.scopeForm.province = null;
    if (!preset.allowedFields.includes('district')) options.scopeForm.district = null;
    if (!preset.allowedFields.includes('sub_district')) options.scopeForm.sub_district = null;
    if (!preset.allowedFields.includes('school_id')) options.scopeForm.school_id = null;
    if (!preset.allowedFields.includes('grade_level')) options.scopeForm.grade_level = null;
    if (!preset.allowedFields.includes('room')) options.scopeForm.room = null;

    if (preset.requiredFields.includes('province') && !options.scopeForm.province && availableProvinceOptions.value.length === 1) {
      options.scopeForm.province = availableProvinceOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('district') && !options.scopeForm.district && availableDistrictOptions.value.length === 1) {
      options.scopeForm.district = availableDistrictOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('sub_district') && !options.scopeForm.sub_district && availableSubDistrictOptions.value.length === 1) {
      options.scopeForm.sub_district = availableSubDistrictOptions.value[0] || null;
    }
    if (preset.requiredFields.includes('school_id') && !options.scopeForm.school_id && filteredSchools.value.length === 1) {
      options.scopeForm.school_id = filteredSchools.value[0]?.value || null;
    }
    if (isScopeFieldLocked('room')) {
      roomOptions.value = [];
    }
  }

  function handleAllProvincesToggle(nextValue: boolean | null): void {
    if (!canUseNationwideScope.value) {
      options.scopeForm.allProvinces = false;
      return;
    }

    if (!nextValue) {
      return;
    }

    resetScopeForm();
    options.scopeForm.allProvinces = true;
  }

  function handleProvinceChange(): void {
    options.scopeForm.allProvinces = false;
    options.scopeForm.district = null;
    options.scopeForm.sub_district = null;
    options.scopeForm.school_id = null;
    options.scopeForm.grade_level = null;
    options.scopeForm.room = null;
    roomOptions.value = [];
  }

  function handleDistrictChange(): void {
    options.scopeForm.sub_district = null;
    options.scopeForm.school_id = null;
    options.scopeForm.grade_level = null;
    options.scopeForm.room = null;
    roomOptions.value = [];
  }

  function handleSubDistrictChange(): void {
    options.scopeForm.school_id = null;
    options.scopeForm.grade_level = null;
    options.scopeForm.room = null;
    roomOptions.value = [];
  }

  function handleSchoolChange(): void {
    options.scopeForm.grade_level = null;
    options.scopeForm.room = null;
    roomOptions.value = [];
  }

  function canGrantPermission(permissionId: string): boolean {
    return (
      GRANT_EXEMPT_PERMISSION_IDS.includes(permissionId) ||
      currentUserGrantablePermissionSet.value.has('*') ||
      currentUserGrantablePermissionSet.value.has('ALL') ||
      currentUserGrantablePermissionSet.value.has(permissionId)
    );
  }

  function isPermissionLocked(permissionId: string): boolean {
    return !options.form.permissions.includes(permissionId) && !canGrantPermission(permissionId);
  }

  function getPermissionVisualState(permissionId: string) {
    return getPermissionDeltaState(
      permissionId,
      options.form.permissions,
      roleDefaultPermissions.value,
      isPermissionLocked(permissionId),
    );
  }

  function getPermissionVisualMeta(permissionId: string) {
    return PERMISSION_DELTA_META[getPermissionVisualState(permissionId)];
  }

  function togglePermission(permissionId: string, checked: boolean): void {
    if (checked) {
      if (!options.form.permissions.includes(permissionId) && canGrantPermission(permissionId)) {
        options.form.permissions = [...options.form.permissions, permissionId];
      }
      return;
    }

    options.form.permissions = options.form.permissions.filter((item) => item !== permissionId);
  }

  function removePermission(permissionId: string): void {
    options.form.permissions = options.form.permissions.filter((item) => item !== permissionId);
  }

  async function loadRoomsForScope(): Promise<void> {
    if (!options.scopeForm.grade_level || !options.scopeForm.school_id) {
      roomOptions.value = [];
      options.scopeForm.room = null;
      return;
    }

    const selectedGrade = gradeLevels.value.find((grade) => grade.id === options.scopeForm.grade_level);
    if (!selectedGrade) {
      roomOptions.value = [];
      options.scopeForm.room = null;
      return;
    }

    await loadRooms(selectedGrade.label, options.scopeForm.school_id);
    if (options.scopeForm.room && !roomOptions.value.includes(String(options.scopeForm.room))) {
      options.scopeForm.room = null;
    }
  }

  async function initializeForm(): Promise<void> {
    await ensureOptionsLoaded();
    suppressRolePermissionSync.value = true;
    options.form.role = roleOptions.value.find((item) => item.value === 'TEACHER')?.value || roleOptions.value[0]?.value || 'TEACHER';
    options.form.permissions = [];
    resetScopeForm();
    await nextTick();
    suppressRolePermissionSync.value = false;
    options.form.permissions = Array.from(
      new Set(
        (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
      ),
    );
    applyRoleScopePreset();
  }

  watch(() => options.form.role, () => {
    if (!enabled.value) {
      return;
    }

    if (!suppressRolePermissionSync.value) {
      options.form.permissions = Array.from(
        new Set(
          (selectedRoleMeta.value?.default_permissions || []).filter((permissionId) => canGrantPermission(permissionId)),
        ),
      );
    }

    applyRoleScopePreset();
  });

  watch(
    () => [options.scopeForm.grade_level, options.scopeForm.school_id],
    () => {
      if (!enabled.value) {
        return;
      }

      if (options.scopeForm.grade_level && options.scopeForm.school_id) {
        void loadRoomsForScope();
      } else {
        roomOptions.value = [];
        options.scopeForm.room = null;
      }
    },
  );

  return {
    rolesCatalog,
    gradeLevels,
    schools,
    roomOptions,
    schoolOptions,
    gradeOptions,
    permissionOptions,
    permissionLegendItems,
    permissionLabelMap,
    roleLabelMap,
    selectedRoleMeta,
    roleScopePreset,
    roleOptions,
    scopeFieldLabels,
    availableProvinceOptions,
    availableDistrictOptions,
    availableSubDistrictOptions,
    filteredSchools,
    availableGradeLevels,
    availableGradeOptions,
    availableRoomOptions,
    canUseNationwideScope,
    isNationwideToggleDisabled,
    ensureOptionsLoaded,
    fetchRolesCatalog,
    initializeForm,
    resetScopeForm,
    buildDataScope: () => buildLoginDataScope(options.scopeForm),
    handleAllProvincesToggle,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
    handleSchoolChange,
    canGrantPermission,
    isPermissionLocked,
    isScopeFieldLocked,
    getPermissionVisualState,
    getPermissionVisualMeta,
    togglePermission,
    removePermission,
  };
}
