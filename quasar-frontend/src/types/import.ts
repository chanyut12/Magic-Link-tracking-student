export type ImportMode = 'student_term' | 'student_dropouts';

export interface ImportPreviewData {
  fileHeaders: string[];
  filePreviewData: string[][];
  totalRows: number;
}

export interface MissingSchoolRecord {
  id: number;
}

export interface ManualSchoolRecord {
  id: number;
  name: string;
  province?: string;
  district?: string;
  sub_district?: string;
}

export interface CheckMissingSchoolsResponse {
  missingSchools: MissingSchoolRecord[];
}

export interface ImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsInserted: number;
  rowsSkipped: number;
}
