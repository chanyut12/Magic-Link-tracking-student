import { ref } from 'vue';
import { defineStore } from 'pinia';
import { attendanceLookupService } from '../services/attendanceLookupService';
import type {
  AttendanceGradeLevel,
  AttendanceLocationData,
  AttendanceRoomQuery,
  AttendanceSchool,
  AttendanceSchoolQuery,
} from '../types/attendance';

type RoomCache = Record<string, string[]>;
type SchoolCache = Record<string, AttendanceSchool[]>;

function createEmptyLocations(): AttendanceLocationData {
  return {
    provinces: [],
    districts: [],
    subDistricts: [],
  };
}

function buildSchoolKey(filters: AttendanceSchoolQuery = {}): string {
  return JSON.stringify({
    province: filters.province || '',
    district: filters.district || '',
    subDistrict: filters.subDistrict || '',
  });
}

function buildRoomKey(filters: AttendanceRoomQuery): string {
  return `${String(filters.schoolId || '')}::${filters.grade}`;
}

export const useAttendanceLookupStore = defineStore('attendance-lookup', () => {
  const locations = ref<AttendanceLocationData>(createEmptyLocations());
  const hasLocations = ref(false);
  const schoolsByKey = ref<SchoolCache>({});
  const gradeLevels = ref<AttendanceGradeLevel[]>([]);
  const hasGradeLevels = ref(false);
  const roomsByKey = ref<RoomCache>({});

  async function getLocations(options: { force?: boolean } = {}): Promise<AttendanceLocationData> {
    if (hasLocations.value && options.force !== true) {
      return locations.value;
    }

    locations.value = await attendanceLookupService.getLocations();
    hasLocations.value = true;
    return locations.value;
  }

  async function getSchools(
    filters: AttendanceSchoolQuery = {},
    options: { force?: boolean } = {},
  ): Promise<AttendanceSchool[]> {
    const cacheKey = buildSchoolKey(filters);
    const cached = schoolsByKey.value[cacheKey];
    if (cached && options.force !== true) {
      return cached;
    }

    const nextSchools = await attendanceLookupService.getSchools(filters);
    schoolsByKey.value = {
      ...schoolsByKey.value,
      [cacheKey]: nextSchools,
    };
    return nextSchools;
  }

  async function getGradeLevels(
    options: { force?: boolean } = {},
  ): Promise<AttendanceGradeLevel[]> {
    if (hasGradeLevels.value && options.force !== true) {
      return gradeLevels.value;
    }

    gradeLevels.value = await attendanceLookupService.getGradeLevels();
    hasGradeLevels.value = true;
    return gradeLevels.value;
  }

  async function getRooms(
    filters: AttendanceRoomQuery,
    options: { force?: boolean } = {},
  ): Promise<string[]> {
    const cacheKey = buildRoomKey(filters);
    const cached = roomsByKey.value[cacheKey];
    if (cached && options.force !== true) {
      return cached;
    }

    const nextRooms = await attendanceLookupService.getRooms(filters);
    roomsByKey.value = {
      ...roomsByKey.value,
      [cacheKey]: nextRooms,
    };
    return nextRooms;
  }

  function invalidate(): void {
    hasLocations.value = false;
    locations.value = createEmptyLocations();
    schoolsByKey.value = {};
    hasGradeLevels.value = false;
    gradeLevels.value = [];
    roomsByKey.value = {};
  }

  return {
    locations,
    schoolsByKey,
    gradeLevels,
    roomsByKey,
    getLocations,
    getSchools,
    getGradeLevels,
    getRooms,
    invalidate,
  };
});
