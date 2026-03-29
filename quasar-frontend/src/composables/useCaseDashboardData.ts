import { ref } from 'vue';
import { caseService } from '../services/caseService';
import { statsService } from '../services/statsService';
import type { CaseDashboardStats, CaseRecord } from '../types/case';
import { formatCaseRefreshTimestamp } from '../utils/casePresentation';

export function useCaseDashboardData() {
  const loading = ref(false);
  const rawCases = ref<CaseRecord[]>([]);
  const stats = ref<CaseDashboardStats>(statsService.createEmptyCaseDashboardStats());
  const lastUpdated = ref('');
  const loadError = ref('');

  async function fetchData(silent = false): Promise<void> {
    if (!silent) {
      loading.value = true;
    }

    try {
      const [casesResponse, statsResponse] = await Promise.all([
        caseService.getCases(),
        statsService.getCaseDashboardStats(),
      ]);

      rawCases.value = casesResponse;
      stats.value = statsResponse;
      loadError.value = '';

      if (!silent) {
        lastUpdated.value = formatCaseRefreshTimestamp();
      }
    } catch (error) {
      console.error(error);
      loadError.value = 'ตรวจสอบการเชื่อมต่อหรือสิทธิ์การเข้าถึง แล้วกดรีเฟรชอีกครั้ง';
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  }

  async function refreshData(): Promise<void> {
    await fetchData();
  }

  return {
    loading,
    rawCases,
    stats,
    lastUpdated,
    loadError,
    fetchData,
    refreshData,
  };
}

