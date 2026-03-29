import { api } from 'boot/axios';
import type {
  AttendanceHistoryRecord,
  AttendanceSaveRecord,
  AttendanceSaveResponse,
  AttendanceStudent,
  AttendanceStudentQuery,
  AttendanceTask,
} from '../types/attendance';
import { normalizeAttendanceSelectionStatus } from '../utils/attendancePresentation';

interface ListResponse<T> {
  data: T;
}

async function getStudents(
  query: AttendanceStudentQuery,
): Promise<AttendanceStudent[]> {
  const response = await api.get<ListResponse<AttendanceStudent[]>>(
    '/api/attendance/students',
    {
      params: {
        grade: query.grade,
        room: query.room,
        schoolId: query.schoolId,
      },
    },
  );

  return response.data.data || [];
}

async function getHistory(date: string): Promise<AttendanceHistoryRecord[]> {
  const response = await api.get<ListResponse<AttendanceHistoryRecord[]>>(
    '/api/attendance/history',
    {
      params: { date },
    },
  );

  return (response.data.data || []).map((record) => ({
    ...record,
    id: String(record.PersonID_Onec || record.student_id || record.id || ''),
    name: record.name || record.student_name || '',
    status: normalizeAttendanceSelectionStatus(record.status),
    recorded_by: record.RecordedBy || record.recorded_by || 'Admin',
  }));
}

async function saveAttendance(
  records: AttendanceSaveRecord[],
): Promise<AttendanceSaveResponse> {
  const response = await api.post<AttendanceSaveResponse>('/api/attendance', { records });
  return response.data;
}

async function getTasks(): Promise<AttendanceTask[]> {
  const response = await api.get<AttendanceTask[]>('/api/attendance/tasks');
  return (response.data || []).filter((task) => task.task_type === 'ATTENDANCE');
}

export const attendanceService = {
  getStudents,
  getHistory,
  saveAttendance,
  getTasks,
};
