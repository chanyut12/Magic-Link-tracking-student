import type { DataScope } from '../constants/permissions';
import type { RoleScopeMode } from './role';

export interface ManagedUser {
  id: number | null;
  username: string;
  FirstName: string | null;
  LastName: string | null;
  fullname?: string | null | undefined;
  PersonID_Onec: string | null;
  phone: string | null;
  email: string | null;
  affiliation: string | null;
  role?: string | null | undefined;
  roles: string[];
  labels?: string[] | undefined;
  permissions: string[];
  status: string;
  password?: string | undefined;
  data_scope?: DataScope | undefined;
  created_at?: string | null | undefined;
}

export interface UserFormModel {
  id: number | null;
  username: string;
  password: string;
  FirstName: string;
  LastName: string;
  PersonID_Onec: string;
  phone: string;
  email: string;
  affiliation: string;
  role: string | null;
  roles: string[];
  labels: string[];
  permissions: string[];
  status: string;
  data_scope: DataScope;
}

export interface UserSavePayload {
  id?: number | null | undefined;
  username: string;
  password?: string | undefined;
  FirstName: string;
  LastName: string;
  PersonID_Onec: string;
  phone: string;
  email: string;
  affiliation: string;
  role: string | null;
  roles: string[];
  labels?: string[] | undefined;
  permissions: string[];
  status: string;
  data_scope: DataScope;
}

export interface RoleGroupForm {
  name: string;
  label: string;
  rank: number;
  scope_mode: RoleScopeMode;
  default_permissions: string[];
}

export interface PermissionMenuItem {
  id: string;
  label: string;
  expanded?: boolean | undefined;
  children?: PermissionMenuItem[] | undefined;
}
