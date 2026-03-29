import type { AttendanceGradeLevel, AttendanceSchool } from '../types/attendance';

export interface AttendanceSchoolOption {
  label: string;
  value: number;
  province?: string | undefined;
  district?: string | undefined;
  sub_district?: string | undefined;
}

export interface AttendanceGradeOption {
  label: string;
  value: number;
}

export function mapAttendanceSchoolsToOptions(
  schools: AttendanceSchool[],
): AttendanceSchoolOption[] {
  return schools.map((school) => ({
    label: school.name,
    value: school.id,
    province: school.province,
    district: school.district,
    sub_district: school.sub_district,
  }));
}

export function mapAttendanceGradesToOptions(
  gradeLevels: AttendanceGradeLevel[],
): AttendanceGradeOption[] {
  return gradeLevels.map((grade) => ({
    label: grade.label,
    value: grade.id,
  }));
}
