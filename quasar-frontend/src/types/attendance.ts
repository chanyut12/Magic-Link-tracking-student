export interface AttendanceFilter {
  province: string;
  district: string;
  subDistrict: string;
  schoolId: string;
  grade: string;
  room: string;
}

export type AttendanceSelectionStatus =
  | 'P_PRESENT'
  | 'P_ABSENT'
  | 'P_LATE'
  | 'NONE';

export type AttendanceTaskStatus = 'ACTIVE' | 'LOCKED' | 'EXPIRED';

export type AttendanceTaskAdminAction = 'lock' | 'unlock';

export interface AttendanceGradeLevel {
  id: number;
  label: string;
  category?: string | undefined;
}

export interface AttendanceSchool {
  id: number;
  name: string;
  province?: string | undefined;
  district?: string | undefined;
  sub_district?: string | undefined;
}

export interface AttendanceDistrict {
  province: string;
  district: string;
}

export interface AttendanceSubDistrict {
  province: string;
  district: string;
  sub_district: string;
}

export interface AttendanceLocationData {
  provinces: string[];
  districts: AttendanceDistrict[];
  subDistricts: AttendanceSubDistrict[];
}

export interface AttendanceSchoolQuery {
  province?: string | undefined;
  district?: string | undefined;
  subDistrict?: string | undefined;
}

export interface AttendanceRoomQuery {
  grade: string;
  schoolId: string | number;
}

export interface AttendanceStudentQuery {
  grade: string;
  room: string;
  schoolId: string | number;
}

export interface AttendanceStudent {
  id: string;
  name: string;
  grade: string;
  room: string;
  school_id?: string | number | undefined;
  school_name?: string | undefined;
  total_late?: number | undefined;
  total_absent?: number | undefined;
}

export interface AttendanceHistoryRecord {
  id: string;
  name: string;
  grade: string;
  room: string;
  status: AttendanceSelectionStatus;
  check_date?: string | undefined;
  PersonID_Onec?: string | undefined;
  school_id?: string | number | undefined;
  student_id?: string | undefined;
  student_name?: string | undefined;
  recorded_by?: string | undefined;
  RecordedBy?: string | undefined;
}

export interface AttendanceHistoryStats {
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceSaveRecord {
  student_id: string;
  status: AttendanceSelectionStatus;
}

export interface AttendanceAutoCase {
  case_id: number;
  student_name: string;
  student_school: string;
  reason_flagged: string;
}

export interface AttendanceSaveResponse {
  success: boolean;
  newCases?: AttendanceAutoCase[] | undefined;
}

export interface AttendanceTask {
  task_id: string;
  task_type: string;
  target_grade: string;
  target_room: string;
  target_school_id: string | number | null;
  target_school_name: string | null;
  link_assigned_to: string | null;
  active_link: string | null;
  active_link_locked: boolean;
  active_link_id: string | null;
  created_at: string;
}

export interface AttendanceTaskCardStats {
  total: number;
  active: number;
  locked: number;
  expired: number;
}
