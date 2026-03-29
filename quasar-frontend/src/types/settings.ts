export type MasterDataTableId =
  | 'risk_factors'
  | 'dropout_reasons'
  | 'assistance_measures'
  | 'related_agencies'
  | 'schools'
  | 'educational_areas';

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description?: string | null | undefined;
  updated_at?: string | null | undefined;
}

export interface SettingsUpdatePayload {
  value: string;
  description?: string | null | undefined;
}

export interface SettingsUpdateResponse {
  success?: boolean | undefined;
  data?: SystemSetting | undefined;
}

export interface MasterDataItem {
  id: number;
  label?: string | null | undefined;
  name?: string | null | undefined;
}

export interface MasterTableDefinition {
  id: MasterDataTableId;
  title: string;
  tabLabel: string;
  fieldLabel: string;
  icon: string;
  helper: string;
  accent: string;
  soft: string;
}

export interface MasterDataPayload {
  label?: string | null | undefined;
  name?: string | null | undefined;
}

