import { computed, reactive, ref } from 'vue';
import { useAttendanceLookupStore } from '../stores/attendance-lookup-store';
import type {
  AttendanceFilter,
  AttendanceGradeLevel,
  AttendanceLocationData,
  AttendanceSchool,
} from '../types/attendance';

type AttendanceLocationFilterState = Pick<
  AttendanceFilter,
  'province' | 'district' | 'subDistrict' | 'schoolId'
>;

interface AttendanceFilterResetOptions {
  clearTempSchools?: boolean;
}

interface AttendanceSubDistrictOptions {
  clearTempSchoolsWhenEmpty?: boolean;
}

export function useAttendanceFilters() {
  const lookupStore = useAttendanceLookupStore();
  const gradeLevels = ref<AttendanceGradeLevel[]>([]);
  const schools = ref<AttendanceSchool[]>([]);
  const rooms = ref<string[]>([]);
  const tempSchools = ref<AttendanceSchool[]>([]);

  const tempFilters = reactive<AttendanceLocationFilterState>({
    province: '',
    district: '',
    subDistrict: '',
    schoolId: '',
  });

  const locationData = reactive<AttendanceLocationData>({
    provinces: [],
    districts: [],
    subDistricts: [],
  });

  const filteredDistricts = computed(() => {
    if (!tempFilters.province) return [];
    return Array.from(new Set(
      locationData.districts
        .filter((district) => district.province === tempFilters.province)
        .map((district) => district.district),
    ));
  });

  const filteredSubDistricts = computed(() => {
    if (!tempFilters.district) return [];
    return Array.from(new Set(
      locationData.subDistricts
        .filter((subDistrict) => (
          subDistrict.province === tempFilters.province
          && subDistrict.district === tempFilters.district
        ))
        .map((subDistrict) => subDistrict.sub_district),
    ));
  });

  async function loadLocations() {
    Object.assign(locationData, await lookupStore.getLocations());
    return locationData;
  }

  async function loadAllSchools(options: { syncTempSchools?: boolean } = {}) {
    const nextSchools = await lookupStore.getSchools();
    schools.value = nextSchools;
    if (options.syncTempSchools !== false) {
      tempSchools.value = nextSchools;
    }
    return nextSchools;
  }

  async function loadGradeLevels() {
    gradeLevels.value = await lookupStore.getGradeLevels();
    return gradeLevels.value;
  }

  async function loadRooms(grade: string, schoolId: string | number) {
    rooms.value = await lookupStore.getRooms({ grade, schoolId });
    return rooms.value;
  }

  function resetFromProvinceChange() {
    tempFilters.district = '';
    tempFilters.subDistrict = '';
    tempFilters.schoolId = '';
    tempSchools.value = schools.value;
  }

  function resetFromDistrictChange() {
    tempFilters.subDistrict = '';
    tempFilters.schoolId = '';
    tempSchools.value = schools.value;
  }

  function handleProvinceFilterChange(
    options: AttendanceFilterResetOptions = {},
  ) {
    resetFromProvinceChange();

    if (options.clearTempSchools) {
      tempSchools.value = [];
    }
  }

  function handleDistrictFilterChange(
    options: AttendanceFilterResetOptions = {},
  ) {
    resetFromDistrictChange();

    if (options.clearTempSchools) {
      tempSchools.value = [];
    }
  }

  async function loadSchoolsForSelectedSubDistrict(
    options: AttendanceSubDistrictOptions = {},
  ) {
    tempFilters.schoolId = '';

    if (!tempFilters.subDistrict) {
      tempSchools.value = options.clearTempSchoolsWhenEmpty ? [] : schools.value;
      return tempSchools.value;
    }

    tempSchools.value = await lookupStore.getSchools({
      province: tempFilters.province,
      district: tempFilters.district,
      subDistrict: tempFilters.subDistrict,
    });

    return tempSchools.value;
  }

  async function handleSubDistrictFilterChange(
    options: AttendanceSubDistrictOptions = {},
  ) {
    return loadSchoolsForSelectedSubDistrict(options);
  }

  return {
    gradeLevels,
    schools,
    rooms,
    tempSchools,
    tempFilters,
    locationData,
    filteredDistricts,
    filteredSubDistricts,
    loadLocations,
    loadAllSchools,
    loadGradeLevels,
    loadRooms,
    resetFromProvinceChange,
    resetFromDistrictChange,
    handleProvinceFilterChange,
    handleDistrictFilterChange,
    handleSubDistrictFilterChange,
    loadSchoolsForSelectedSubDistrict,
  };
}
