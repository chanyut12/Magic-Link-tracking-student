import { api } from 'boot/axios';
import type { CaseDashboardStats } from '../types/case';
import type { OverviewStatsData, OverviewStatsResponse } from '../types/stats';
import { createEmptyCaseDashboardStats } from '../utils/casePresentation';

function toNumber(value: unknown): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

function createEmptyOverviewStats(): OverviewStatsData {
  return {
    totalStudents: 0,
    dropoutStudents: 0,
    atRiskStudents: 0,
    helpStats: {
      waiting: 0,
      inProgress: 0,
      resolved: 0,
    },
  };
}

async function getCaseDashboardStats(): Promise<CaseDashboardStats> {
  const response = await api.get<Partial<CaseDashboardStats>>('/api/stats');

  return {
    total: toNumber(response.data?.total),
    open: toNumber(response.data?.open),
    inProgress: toNumber(response.data?.inProgress),
    resolved: toNumber(response.data?.resolved),
    today: toNumber(response.data?.today),
    pendingReview: toNumber(response.data?.pendingReview),
    activeLinks: toNumber(response.data?.activeLinks),
    delegations: toNumber(response.data?.delegations),
  };
}

async function getOverviewStats(): Promise<OverviewStatsData> {
  const response = await api.get<OverviewStatsResponse>('/api/stats/overview');
  const payload = response.data?.data;

  if (!payload) {
    return createEmptyOverviewStats();
  }

  return {
    totalStudents: toNumber(payload.totalStudents),
    dropoutStudents: toNumber(payload.dropoutStudents),
    atRiskStudents: toNumber(payload.atRiskStudents),
    helpStats: {
      waiting: toNumber(payload.helpStats?.waiting),
      inProgress: toNumber(payload.helpStats?.inProgress),
      resolved: toNumber(payload.helpStats?.resolved),
    },
  };
}

export const statsService = {
  createEmptyCaseDashboardStats,
  createEmptyOverviewStats,
  getCaseDashboardStats,
  getOverviewStats,
};

