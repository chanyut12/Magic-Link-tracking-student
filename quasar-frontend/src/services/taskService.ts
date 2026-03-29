import { api } from 'boot/axios';
import type {
  LoginLink,
  TaskCreatePayload,
  TaskCreateResponse,
  TaskLinkAdminPayload,
  TaskLinkAdminResponse,
  TaskRolesCatalog,
  TaskStudentRecord,
} from '../types/task';
import type { RoleDefinition } from '../types/role';
import { normalizeArrayResponse } from '../utils/api';

async function getRolesCatalog(): Promise<TaskRolesCatalog> {
  const response = await api.get<RoleDefinition[]>('/api/users/roles');
  return normalizeArrayResponse(response.data);
}

async function getStudentRecord(studentId: string): Promise<TaskStudentRecord> {
  const response = await api.get<TaskStudentRecord>(
    `/api/students/${encodeURIComponent(studentId)}`,
  );
  return response.data;
}

async function createTask(payload: TaskCreatePayload): Promise<TaskCreateResponse> {
  const response = await api.post<TaskCreateResponse>('/api/tasks', payload);
  return response.data;
}

async function getLoginLinks(): Promise<LoginLink[]> {
  const response = await api.get<LoginLink[]>('/api/tasks/login-links');
  return normalizeArrayResponse(response.data);
}

async function updateTaskLinkAdminStatus(
  linkId: string,
  payload: TaskLinkAdminPayload,
): Promise<TaskLinkAdminResponse> {
  const response = await api.post<TaskLinkAdminResponse>(
    `/api/task-links/${linkId}/admin-lock`,
    payload,
  );
  return response.data;
}

export const taskService = {
  getRolesCatalog,
  getStudentRecord,
  createTask,
  getLoginLinks,
  updateTaskLinkAdminStatus,
};
