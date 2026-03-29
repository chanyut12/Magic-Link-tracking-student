import { api } from 'boot/axios';
import type {
  StudentAttendanceCalendarRecord,
  StudentAttendanceSummaryResponse,
  StudentCase,
  StudentDetail,
  StudentListItem,
  StudentListQuery,
} from '../types/student';
import { buildRequestParams, normalizeArrayResponse } from '../utils/api';

interface ListResponse<T> {
  data: T;
}

function normalizeAttendanceStatus(status: unknown): string {
  if (status === 1 || status === '1' || status === 'P_PRESENT' || status === 'PRESENT') {
    return 'PRESENT';
  }

  if (status === 2 || status === '2' || status === 'P_ABSENT' || status === 'ABSENT') {
    return 'ABSENT';
  }

  if (status === 3 || status === '3' || status === 'P_LATE' || status === 'LATE') {
    return 'LATE';
  }

  if (status === 4 || status === '4' || status === 'P_LEAVE' || status === 'LEAVE') {
    return 'LEAVE';
  }

  return 'UNKNOWN';
}

function buildStudentListParams(query: StudentListQuery) {
  return buildRequestParams({
    schoolId: query.schoolId,
    grade: query.grade === 'ALL' ? undefined : query.grade,
    room: query.room === 'ALL' ? undefined : query.room,
  });
}

async function getStudents(query: StudentListQuery = {}): Promise<StudentListItem[]> {
  const params = buildStudentListParams(query);
  const response = await api.get<ListResponse<StudentListItem[]>>('/api/students', { params });
  return normalizeArrayResponse(response.data);
}

async function getStudentById(studentId: string): Promise<StudentDetail> {
  const response = await api.get<StudentDetail>(`/api/students/${studentId}`);
  return response.data;
}

async function getStudentAttendance(studentId: string): Promise<StudentAttendanceCalendarRecord[]> {
  const response = await api.get<StudentAttendanceCalendarRecord[]>(
    `/api/students/attendance/${studentId}`,
  );
  return normalizeArrayResponse(response.data);
}

async function getStudentCasesByName(studentName: string): Promise<StudentCase[]> {
  const response = await api.get<StudentCase[]>(
    `/api/students/cases/by-name/${encodeURIComponent(studentName)}`,
  );
  return normalizeArrayResponse(response.data);
}

async function getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummaryResponse> {
  const records = await getStudentAttendance(studentId);

  const summaryRecords = records.map((record, index) => ({
    id: `${record.date}-${record.period ?? index}`,
    date: record.date,
    status: normalizeAttendanceStatus(record.status),
  }));

  const stats = summaryRecords.reduce<StudentAttendanceSummaryResponse['stats']>((acc, record) => {
    if (record.status === 'PRESENT') {
      acc.present += 1;
    } else if (record.status === 'ABSENT') {
      acc.absent += 1;
    } else if (record.status === 'LATE') {
      acc.late += 1;
    }

    acc.total += 1;
    return acc;
  }, {
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });

  return {
    records: summaryRecords,
    stats,
  };
}

export const studentService = {
  getStudents,
  getStudentById,
  getStudentAttendance,
  getStudentCasesByName,
  getStudentAttendanceSummary,
};
