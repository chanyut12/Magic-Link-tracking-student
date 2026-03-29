import { api } from 'boot/axios';
import type {
  SettingsUpdatePayload,
  SettingsUpdateResponse,
  SystemSetting,
} from '../types/settings';
import { normalizeArrayResponse } from '../utils/api';

async function getSettings(): Promise<SystemSetting[]> {
  const response = await api.get<SystemSetting[]>('/api/settings');
  return normalizeArrayResponse(response.data);
}

async function updateSetting(
  key: string,
  payload: SettingsUpdatePayload,
): Promise<SettingsUpdateResponse> {
  const response = await api.put<SettingsUpdateResponse>(
    `/api/settings/${encodeURIComponent(key)}`,
    payload,
  );

  return response.data;
}

export const settingsService = {
  getSettings,
  updateSetting,
};
