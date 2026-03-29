import { api } from 'boot/axios';
import type {
  CheckMissingSchoolsResponse,
  ImportMode,
  ImportResult,
  ManualSchoolRecord,
  MissingSchoolRecord,
} from '../types/import';

interface CheckMissingSchoolsParams {
  file: File;
  mapping: Record<string, string>;
}

interface SubmitImportParams extends CheckMissingSchoolsParams {
  target: ImportMode;
  schools?: ManualSchoolRecord[];
}

async function checkMissingSchools(
  params: CheckMissingSchoolsParams,
): Promise<MissingSchoolRecord[]> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('mapping', JSON.stringify(params.mapping));

  const response = await api.post<CheckMissingSchoolsResponse>(
    '/api/imports/check-schools',
    formData,
  );

  return Array.isArray(response.data?.missingSchools) ? response.data.missingSchools : [];
}

async function submitImport(params: SubmitImportParams): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('target', params.target);
  formData.append('mapping', JSON.stringify(params.mapping));

  if (Array.isArray(params.schools) && params.schools.length > 0) {
    formData.append('schools', JSON.stringify(params.schools));
  }

  const response = await api.post<ImportResult>('/api/imports/bulk', formData);
  return response.data;
}

export const importService = {
  checkMissingSchools,
  submitImport,
};
