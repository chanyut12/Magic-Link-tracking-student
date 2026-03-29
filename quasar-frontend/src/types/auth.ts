import type { DataScope } from '../constants/permissions';

export interface AuthUser {
  id: number;
  username: string;
  FirstName: string | null;
  LastName: string | null;
  roles: string[];
  labels?: string[] | undefined;
  permissions: string[];
  data_scope?: DataScope | undefined;
  PersonID_Onec?: string | undefined;
  affiliation?: string | null | undefined;
  virtual_login?: boolean | undefined;
  magic_link_token?: string | undefined;
  magic_session_token?: string | undefined;
  virtual_auth_token?: string | undefined;
}

export type AuthStorageTarget = 'auto' | 'local' | 'session';
export type ResolvedAuthStorageTarget = Exclude<AuthStorageTarget, 'auto'>;

export interface AuthSessionSnapshot {
  user: AuthUser | null;
  hasAdminAccess: boolean;
  storageTarget: ResolvedAuthStorageTarget | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface MockThaIdLoginPayload {
  personId: string;
}

export interface MagicLoginVerifyResponse extends Partial<AuthUser> {
  otp_required?: boolean;
  email?: string;
  assigned_to_name?: string;
  expires_at?: string | null;
}

export interface MagicOtpVerifyResponse {
  session_token?: string;
}
