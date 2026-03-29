import { api } from 'boot/axios';
import type {
  AttendanceGradeLevel,
  AttendanceLocationData,
  AttendanceRoomQuery,
  AttendanceSchool,
  AttendanceSchoolQuery,
} from '../types/attendance';

interface LookupResponse<T> {
  data: T;
}

function buildSchoolParams(filters: AttendanceSchoolQuery) {
  const params: Record<string, string> = {};

  if (filters.province) {
    params.province = filters.province;
  }

  if (filters.district) {
    params.district = filters.district;
  }

  if (filters.subDistrict) {
    params.subDistrict = filters.subDistrict;
  }

  return params;
}

async function getLocations(): Promise<AttendanceLocationData> {
  const response = await api.get<LookupResponse<AttendanceLocationData>>('/api/attendance/locations');
  return response.data.data;
}

async function getSchools(
  filters: AttendanceSchoolQuery = {},
): Promise<AttendanceSchool[]> {
  const params = buildSchoolParams(filters);
  const response = Object.keys(params).length > 0
    ? await api.get<LookupResponse<AttendanceSchool[]>>('/api/attendance/schools', { params })
    : await api.get<LookupResponse<AttendanceSchool[]>>('/api/attendance/schools');

  return response.data.data || [];
}

async function getGradeLevels(): Promise<AttendanceGradeLevel[]> {
  const response = await api.get<LookupResponse<AttendanceGradeLevel[]>>('/api/attendance/grade-levels');
  return response.data.data || [];
}

async function getRooms(filters: AttendanceRoomQuery): Promise<string[]> {
  const response = await api.get<LookupResponse<Array<string | number>>>(
    '/api/attendance/rooms',
    {
      params: {
        grade: filters.grade,
        schoolId: filters.schoolId,
      },
    },
  );

  return (response.data.data || []).map(String);
}

export const attendanceLookupService = {
  getLocations,
  getSchools,
  getGradeLevels,
  getRooms,
};
