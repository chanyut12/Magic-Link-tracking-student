import { api } from 'boot/axios';
import type { RoleDefinition } from '../types/role';
import type { RoleGroupForm } from '../types/user';
import { normalizeArrayResponse } from '../utils/api';

async function getRoleGroups(): Promise<RoleDefinition[]> {
  const response = await api.get<RoleDefinition[]>('/api/users/role-groups');
  return normalizeArrayResponse(response.data);
}

async function createRoleGroup(payload: RoleGroupForm): Promise<RoleDefinition> {
  const response = await api.post<{ role?: RoleDefinition | undefined }>(
    '/api/users/role-groups',
    payload,
  );

  return response.data?.role as RoleDefinition;
}

async function updateRoleGroup(
  roleName: string,
  payload: RoleGroupForm,
): Promise<RoleDefinition> {
  const response = await api.put<{ role?: RoleDefinition | undefined }>(
    `/api/users/role-groups/${encodeURIComponent(roleName)}`,
    payload,
  );

  return response.data?.role as RoleDefinition;
}

async function deleteRoleGroup(roleName: string): Promise<void> {
  await api.delete(`/api/users/role-groups/${encodeURIComponent(roleName)}`);
}

export const roleGroupService = {
  getRoleGroups,
  createRoleGroup,
  updateRoleGroup,
  deleteRoleGroup,
};
