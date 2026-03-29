import { api } from 'boot/axios';
import type { RoleDefinition } from '../types/role';
import type { ManagedUser, UserSavePayload } from '../types/user';
import { normalizeArrayResponse } from '../utils/api';

async function getUsers(): Promise<ManagedUser[]> {
  const response = await api.get<ManagedUser[]>('/api/users');
  const users = normalizeArrayResponse(response.data);
  return users.map((user) => ({
    ...user,
    labels: user.labels || [],
    permissions: user.permissions || [],
    roles: user.roles || [],
  }));
}

async function getRolesCatalog(): Promise<RoleDefinition[]> {
  const response = await api.get<RoleDefinition[]>('/api/users/roles');
  return normalizeArrayResponse(response.data);
}

async function createUser(payload: UserSavePayload): Promise<void> {
  await api.post('/api/users', payload);
}

async function updateUser(id: number, payload: UserSavePayload): Promise<void> {
  await api.put(`/api/users/${id}`, payload);
}

async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}`);
}

export const userService = {
  getUsers,
  getRolesCatalog,
  createUser,
  updateUser,
  deleteUser,
};
