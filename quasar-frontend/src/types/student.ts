export interface StudentListItem {
  id: string;
  name: string;
  grade: string;
  room: string;
  school_name?: string | undefined;
  school_id?: number | string | undefined;
  total_late?: number | undefined;
  total_absent?: number | undefined;
}

export interface StudentListQuery {
  schoolId?: string | undefined;
  grade?: string | undefined;
  room?: string | undefined;
}

export interface StudentListFilters {
  schoolId: string;
  grade: string;
  room: string;
}

export interface StudentListPagination {
  page: number;
  rowsPerPage: number;
  sortBy: string;
  descending: boolean;
}

export interface StudentDetail extends Record<string, unknown> {
  PersonID_Onec: string;
  FirstName?: string | undefined;
  LastName?: string | undefined;
  FirstName_Onec?: string | undefined;
  MiddleName_Onec?: string | undefined;
  LastName_Onec?: string | undefined;
  SchoolID_Onec?: number | string | undefined;
  AcademicYear_Onec?: number | string | undefined;
  Semester_Onec?: number | string | undefined;
  GPAX_Onec?: number | string | undefined;
  school_name?: string | undefined;
  school_id?: number | string | undefined;
  grade?: string | undefined;
  grade_label?: string | undefined;
  room?: string | undefined;
}

export interface StudentCase {
  id: string | number;
  created_at: string;
  reason_flagged: string;
  status: string;
}

export interface StudentAttendanceCalendarRecord {
  date: string;
  status: number;
  period?: string | number | undefined;
}

export interface StudentAttendanceHistoryRecord {
  id?: number | string | undefined;
  date: string;
  status: string;
  subject?: string | undefined;
}

export interface StudentAttendanceSummaryStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface StudentAttendanceSummaryResponse {
  records: StudentAttendanceHistoryRecord[];
  stats: StudentAttendanceSummaryStats;
}
