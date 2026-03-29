import { ref } from 'vue';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceTask } from '../types/attendance';
import { formatAttendanceRefreshTimestamp } from '../utils/attendancePresentation';

export function useAttendanceDashboardData() {
  const loading = ref(false);
  const tasks = ref<AttendanceTask[]>([]);
  const lastUpdated = ref('');
  const loadError = ref('');

  async function fetchTasks(silent = false): Promise<AttendanceTask[]> {
    if (!silent) {
      loading.value = true;
    }

    try {
      tasks.value = await attendanceService.getTasks();
      loadError.value = '';
      lastUpdated.value = formatAttendanceRefreshTimestamp();
      return tasks.value;
    } catch {
      loadError.value = 'ตรวจสอบการเชื่อมต่อหรือสิทธิ์การเข้าถึง แล้วกดรีเฟรชอีกครั้ง';
      return tasks.value;
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  }

  async function refreshData(): Promise<AttendanceTask[]> {
    return fetchTasks();
  }

  return {
    loading,
    tasks,
    lastUpdated,
    loadError,
    fetchTasks,
    refreshData,
  };
}
