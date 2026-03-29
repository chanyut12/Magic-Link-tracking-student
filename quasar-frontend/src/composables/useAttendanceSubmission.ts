import { reactive, ref } from 'vue';
import { attendanceService } from '../services/attendanceService';
import type {
  AttendanceHistoryRecord,
  AttendanceSaveResponse,
  AttendanceSelectionStatus,
  AttendanceStudent,
} from '../types/attendance';

export function useAttendanceSubmission() {
  const saving = ref(false);
  const attendanceSelections = reactive<Record<string, AttendanceSelectionStatus>>({});
  const modifiedIds = ref(new Set<string>());

  function initializeSelections(students: AttendanceStudent[]): void {
    students.forEach((student) => {
      if (!attendanceSelections[student.id]) {
        attendanceSelections[student.id] = 'P_PRESENT';
      }
    });
  }

  function syncSelectionsFromHistory(records: AttendanceHistoryRecord[]): void {
    records.forEach((record) => {
      const studentId = String(record.PersonID_Onec || record.id || '');
      if (!studentId || record.status === 'NONE') {
        return;
      }

      if (!modifiedIds.value.has(studentId) || !attendanceSelections[studentId]) {
        attendanceSelections[studentId] = record.status;
      }
    });
  }

  function setStatus(id: string, status: AttendanceSelectionStatus): void {
    attendanceSelections[id] = status;
    modifiedIds.value.add(id);
  }

  async function saveAttendance(students: AttendanceStudent[]): Promise<AttendanceSaveResponse> {
    saving.value = true;

    try {
      const response = await attendanceService.saveAttendance(
        students.map((student) => ({
          student_id: student.id,
          status: attendanceSelections[student.id] || 'P_PRESENT',
        })),
      );

      modifiedIds.value.clear();
      return response;
    } finally {
      saving.value = false;
    }
  }

  return {
    saving,
    attendanceSelections,
    modifiedIds,
    initializeSelections,
    syncSelectionsFromHistory,
    setStatus,
    saveAttendance,
  };
}
