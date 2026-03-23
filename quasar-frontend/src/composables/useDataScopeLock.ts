import { computed, type Ref } from 'vue';
import type { DataScope } from '../constants/permissions';

interface ScopeLockConfig {
  provinces?: boolean;
  districts?: boolean;
  school_ids?: boolean;
  grade_levels?: boolean;
  room_ids?: boolean;
}

interface ScopeLockState {
  lockedProvince: string | null;
  lockedDistrict: string | null;
  lockedSchoolId: number | null;
  lockedGradeLevel: number | null;
  lockedRoom: string | number | null;
}

export function useDataScopeLock(userScope: Ref<DataScope | undefined>) {
  const lockState = computed<ScopeLockState>(() => ({
    lockedProvince: (userScope.value?.provinces?.length === 1 ? userScope.value.provinces[0] : null) ?? null,
    lockedDistrict: (userScope.value?.districts?.length === 1 ? userScope.value.districts[0] : null) ?? null,
    lockedSchoolId: (userScope.value?.school_ids?.length === 1 ? userScope.value.school_ids[0] : null) ?? null,
    lockedGradeLevel: (userScope.value?.grade_levels?.length === 1 ? userScope.value.grade_levels[0] : null) ?? null,
    lockedRoom: (userScope.value?.room_ids?.length === 1 ? userScope.value.room_ids[0] : null) ?? null,
  }));

  const lockConfig = computed<ScopeLockConfig>(() => ({
    provinces: !!lockState.value.lockedProvince,
    districts: !!lockState.value.lockedDistrict,
    school_ids: !!lockState.value.lockedSchoolId,
    grade_levels: !!lockState.value.lockedGradeLevel,
    room_ids: !!lockState.value.lockedRoom,
  }));

  const isProvinceLocked = computed(() => lockConfig.value.provinces);
  const isDistrictLocked = computed(() => lockConfig.value.districts);
  const isSchoolLocked = computed(() => lockConfig.value.school_ids);
  const isGradeLocked = computed(() => lockConfig.value.grade_levels);
  const isRoomLocked = computed(() => lockConfig.value.room_ids);

  const lockedProvinceValue = computed(() => lockState.value.lockedProvince);
  const lockedDistrictValue = computed(() => lockState.value.lockedDistrict);
  const lockedSchoolValue = computed(() => lockState.value.lockedSchoolId);
  const lockedGradeValue = computed(() => lockState.value.lockedGradeLevel);
  const lockedRoomValue = computed(() => lockState.value.lockedRoom);

  function isFieldLocked(field: keyof ScopeLockConfig): boolean {
    return lockConfig.value[field] ?? false;
  }

  function getLockedValue(field: keyof ScopeLockState): string | number | null {
    return lockState.value[field];
  }

  function applyScopeToFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const result = { ...filters };
    
    if (isProvinceLocked.value && lockedProvinceValue.value) {
      result.province = lockedProvinceValue.value;
    }
    if (isDistrictLocked.value && lockedDistrictValue.value) {
      result.district = lockedDistrictValue.value;
    }
    if (isSchoolLocked.value && lockedSchoolValue.value) {
      result.school_id = lockedSchoolValue.value;
    }
    if (isGradeLocked.value && lockedGradeValue.value) {
      result.grade_level_id = lockedGradeValue.value;
    }
    if (isRoomLocked.value && lockedRoomValue.value) {
      result.room = lockedRoomValue.value;
    }
    
    return result;
  }

  return {
    lockState,
    lockConfig,
    isProvinceLocked,
    isDistrictLocked,
    isSchoolLocked,
    isGradeLocked,
    isRoomLocked,
    lockedProvinceValue,
    lockedDistrictValue,
    lockedSchoolValue,
    lockedGradeValue,
    lockedRoomValue,
    isFieldLocked,
    getLockedValue,
    applyScopeToFilters,
  };
}
