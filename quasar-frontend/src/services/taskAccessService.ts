import { api } from 'boot/axios';
import type {
  TaskAccessTask,
  TaskAttendancePayload,
  TaskDelegationPayload,
  TaskDelegationResponse,
  TaskHistoryResponse,
  TaskOtpVerifyResponse,
  TaskStudentsResponse,
  TaskSubmitResponse,
  TaskVisitSubmitPayload,
} from '../types/task';

function createMagicSessionConfig(magicSessionToken?: string) {
  if (!magicSessionToken) {
    return undefined;
  }

  return {
    headers: {
      'x-magic-session': magicSessionToken,
    },
  };
}

async function getTask(
  token: string,
  magicSessionToken?: string,
): Promise<TaskAccessTask> {
  const config = createMagicSessionConfig(magicSessionToken);
  const response = config
    ? await api.get<TaskAccessTask>(`/api/tasks/${token}`, config)
    : await api.get<TaskAccessTask>(`/api/tasks/${token}`);

  return response.data;
}

async function getTaskStudents(token: string): Promise<TaskStudentsResponse> {
  const response = await api.get<TaskStudentsResponse>(`/api/tasks/${token}/students`);
  return response.data;
}

async function getTaskHistory(
  token: string,
  date: string,
): Promise<TaskHistoryResponse> {
  const response = await api.get<TaskHistoryResponse>(`/api/tasks/${token}/history?date=${date}`);
  return response.data;
}

async function requestTaskOtp(token: string): Promise<void> {
  await api.post(`/api/tasks/${token}/otp`);
}

async function verifyTaskOtp(
  token: string,
  otp: string,
): Promise<TaskOtpVerifyResponse> {
  const response = await api.post<TaskOtpVerifyResponse>(
    `/api/tasks/${token}/verify`,
    { otp },
  );

  return response.data;
}

async function submitTaskSubmission(
  token: string,
  payload: TaskVisitSubmitPayload | FormData,
  magicSessionToken?: string,
): Promise<TaskSubmitResponse> {
  const config = createMagicSessionConfig(magicSessionToken);
  const response = config
    ? await api.post<TaskSubmitResponse>(`/api/tasks/${token}/submit`, payload, config)
    : await api.post<TaskSubmitResponse>(`/api/tasks/${token}/submit`, payload);

  return response.data;
}

async function submitTaskAttendance(
  token: string,
  records: TaskAttendancePayload[],
): Promise<TaskSubmitResponse> {
  const response = await api.post<TaskSubmitResponse>(
    `/api/tasks/${token}/attendance`,
    { records },
  );

  return response.data;
}

async function delegateTask(
  token: string,
  payload: TaskDelegationPayload,
): Promise<TaskDelegationResponse> {
  const response = await api.post<TaskDelegationResponse>(
    `/api/tasks/${token}/delegate`,
    payload,
  );

  return response.data;
}

export const taskAccessService = {
  getTask,
  getTaskStudents,
  getTaskHistory,
  requestTaskOtp,
  verifyTaskOtp,
  submitTaskSubmission,
  submitTaskAttendance,
  delegateTask,
};
