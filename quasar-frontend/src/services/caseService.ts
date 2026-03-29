import { api } from 'boot/axios';
import type {
  CaseRecord,
  CaseReviewPayload,
  CaseReviewRecord,
  CaseReviewResponse,
  CaseReviewsResponse,
  CaseTaskDetail,
  CaseTaskRecord,
  CaseTasksResponse,
} from '../types/case';

async function getCases(): Promise<CaseRecord[]> {
  const response = await api.get<CaseRecord[]>('/api/cases');
  return Array.isArray(response.data) ? response.data : [];
}

async function getTaskDetail(taskId: string): Promise<CaseTaskDetail | null> {
  const response = await api.get<CaseTaskDetail>(
    `/api/tasks/${encodeURIComponent(taskId)}/chain`,
  );

  return response.data || null;
}

async function getCaseTasks(caseId: number): Promise<CaseTaskRecord[]> {
  const response = await api.get<CaseTasksResponse>(`/api/cases/${caseId}/tasks`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

async function getCaseReviews(caseId: number): Promise<CaseReviewRecord[]> {
  const response = await api.get<CaseReviewsResponse>(`/api/cases/${caseId}/reviews`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

async function reviewCase(
  caseId: number,
  payload: CaseReviewPayload,
): Promise<CaseReviewResponse> {
  const response = await api.post<CaseReviewResponse>(`/api/cases/${caseId}/review`, payload);
  return response.data;
}

export const caseService = {
  getCases,
  getTaskDetail,
  getCaseTasks,
  getCaseReviews,
  reviewCase,
};

