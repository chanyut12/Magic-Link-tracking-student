import { api } from 'boot/axios';
import type {
  MasterDataItem,
  MasterDataPayload,
  MasterDataTableId,
} from '../types/settings';
import { normalizeArrayResponse } from '../utils/api';

async function getMasterData(table: MasterDataTableId): Promise<MasterDataItem[]> {
  const response = await api.get<MasterDataItem[]>(`/api/master-data/${table}`);
  return normalizeArrayResponse(response.data);
}

async function createMasterData(
  table: MasterDataTableId,
  payload: MasterDataPayload,
): Promise<MasterDataItem> {
  const response = await api.post<MasterDataItem>(`/api/master-data/${table}`, payload);
  return response.data;
}

async function updateMasterData(
  table: MasterDataTableId,
  id: number,
  payload: MasterDataPayload,
): Promise<MasterDataItem> {
  const response = await api.put<MasterDataItem>(`/api/master-data/${table}/${id}`, payload);
  return response.data;
}

async function deleteMasterData(table: MasterDataTableId, id: number): Promise<MasterDataItem> {
  const response = await api.delete<MasterDataItem>(`/api/master-data/${table}/${id}`);
  return response.data;
}

export const masterDataService = {
  getMasterData,
  createMasterData,
  updateMasterData,
  deleteMasterData,
};
