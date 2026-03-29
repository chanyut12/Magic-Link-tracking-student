export type RoleScopeMode =
  | 'flexible'
  | 'global'
  | 'province'
  | 'district'
  | 'sub_district'
  | 'school';

export type ScopeFormField =
  | 'province'
  | 'district'
  | 'sub_district'
  | 'school_id'
  | 'grade_level'
  | 'room';

export interface RoleDefinition {
  id: number;
  name: string;
  label: string;
  rank: number;
  default_permissions: string[];
  scope_mode: RoleScopeMode;
  is_system: boolean;
  user_count?: number;
  login_link_count?: number;
}

export interface RoleScopePreset {
  mode: RoleScopeMode;
  allowedFields: ScopeFormField[];
  requiredFields: ScopeFormField[];
  hint: string;
}
