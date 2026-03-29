import { ref } from 'vue';
import { statsService } from '../services/statsService';
import type { OverviewStatsData } from '../types/stats';

export function useOverviewDashboardData() {
  const loading = ref(false);
  const loadError = ref('');
  const overviewData = ref<OverviewStatsData>(statsService.createEmptyOverviewStats());

  async function fetchOverviewData(silent = false): Promise<void> {
    if (!silent) {
      loading.value = true;
    }

    try {
      overviewData.value = await statsService.getOverviewStats();
      loadError.value = '';
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      loadError.value = 'ไม่สามารถโหลดข้อมูลสรุปภาพรวมได้';
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  }

  async function refreshData(): Promise<void> {
    await fetchOverviewData();
  }

  return {
    loading,
    loadError,
    overviewData,
    fetchOverviewData,
    refreshData,
  };
}

