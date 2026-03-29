import { ref } from 'vue';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceHistoryRecord } from '../types/attendance';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] || '';
}

export function useAttendanceHistory() {
  const history = ref<AttendanceHistoryRecord[]>([]);
  const historyDate = ref(getTodayDate());
  const loadingHistory = ref(false);
  const historyError = ref('');

  async function fetchHistory(date = historyDate.value): Promise<AttendanceHistoryRecord[]> {
    if (!date) {
      history.value = [];
      return history.value;
    }

    loadingHistory.value = true;

    try {
      const nextHistory = await attendanceService.getHistory(date);
      history.value = nextHistory;
      historyError.value = '';
      return nextHistory;
    } catch (error) {
      historyError.value = 'โหลดประวัติการเช็คชื่อไม่สำเร็จ';
      throw error;
    } finally {
      loadingHistory.value = false;
    }
  }

  async function fetchTodayRecords(): Promise<AttendanceHistoryRecord[]> {
    return attendanceService.getHistory(getTodayDate());
  }

  return {
    history,
    historyDate,
    loadingHistory,
    historyError,
    fetchHistory,
    fetchTodayRecords,
  };
}
