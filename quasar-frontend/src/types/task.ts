import type { DataScope } from '../constants/permissions';
import type { RoleDefinition } from './role';

export type TaskType = 'ATTENDANCE' | 'VISIT' | 'LOGIN';
export type TaskDurationUnit = 'minutes' | 'hours' | 'days' | 'weeks';
export type TaskLinkAdminAction = 'lock' | 'unlock';

export interface TaskAccessTask {
  id: string;
  type: string;
  assigned_to_name: string;
  expires_at: string;
  status?: string | undefined;
  reason?: string | undefined;
  subject?: string | undefined;
  target_grade?: string | undefined;
  target_room?: string | undefined;
  student_name?: string | undefined;
  student_school?: string | undefined;
  student_address?: string | undefined;
  reason_flagged?: string | undefined;
  student_lat?: number | null | undefined;
  student_lng?: number | null | undefined;
  auth_required?: boolean | undefined;
  can_delegate?: boolean | undefined;
  delegation_depth?: number | undefined;
  max_delegation_depth?: number | undefined;
  school_name?: string | undefined;
}

export interface TaskGuestStudent {
  id: string;
  name: string;
  grade: string;
  room: string;
}

export interface TaskHistoryEntry {
  student_id: string;
  student_name: string;
  status: number;
}

export interface TaskStudentsResponse {
  success: boolean;
  data: TaskGuestStudent[];
}

export interface TaskHistoryResponse {
  success: boolean;
  data: TaskHistoryEntry[];
}

export interface TaskOtpVerifyResponse {
  success?: boolean | undefined;
  session_token?: string | undefined;
}

export interface TaskSubmitResponse {
  success?: boolean | undefined;
  error?: string | undefined;
  message?: string | undefined;
  session_token?: string | undefined;
}

export interface TaskVisitSubmitPayload {
  notes: string;
  status: string;
}

export interface TaskAttendancePayload {
  student_id: string;
  status: string;
}

export interface TaskCreateResponse {
  task_id: string;
  magic_link: string;
  qr_code_data?: string | null;
  expires_at: string;
}

export interface TaskLinkAdminPayload {
  action: TaskLinkAdminAction;
  reason: string;
}

export interface TaskLinkAdminResponse {
  message: string;
  link_id: string;
  admin_locked: number | boolean;
}

export interface LoginLink {
  id: string;
  task_id: string;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  expires_at: string;
  status: string;
  magic_link: string;
  created_at: string;
  admin_locked?: boolean | number;
  login_role?: string | null;
  login_role_label?: string | null;
  login_permissions?: string[];
  login_data_scope?: DataScope;
}

export interface TaskDelegationPayload {
  new_assignee_name: string;
  new_assignee_phone?: string | null;
  new_assignee_email?: string | null;
  expires_in_hours: number;
}

export interface TaskDelegationResponse {
  magic_link: string;
  qr_code_data: string | null;
  expires_at: string;
  delegation_depth: number;
}

export interface TaskCreateFormModel {
  type: TaskType | '';
  student_name: string;
  student_school: string;
  student_address: string;
  student_address_house_no: string;
  student_address_moo: string;
  student_address_village: string;
  student_address_soi: string;
  student_address_road: string;
  student_address_subdistrict: string;
  student_address_district: string;
  student_address_province: string;
  student_address_postal_code: string;
  student_address_note: string;
  student_lat: number | null;
  student_lng: number | null;
  reason_flagged: string;
  target_grade: string;
  target_room: string;
  target_subject: string;
  assigned_to_name: string;
  assigned_to_email: string;
  expires_value: number;
  expires_unit: TaskDurationUnit;
  target_school_id: string;
  selected_user_id: string;
  role: string;
  permissions: string[];
  existing_case_id: string;
}

export interface LoginTaskFormModel {
  assigned_to_name: string;
  assigned_to_email: string;
  permissions: string[];
  role: string;
  expires_value: number;
  expires_unit: Exclude<TaskDurationUnit, 'weeks'>;
}

export interface TaskScopeFormModel {
  allProvinces: boolean;
  province: string | null;
  district: string | null;
  sub_district: string | null;
  school_id: number | null;
  grade_level: number | null;
  room: string | null;
}

export interface TaskCreatePayload {
  task_type: TaskType;
  type: TaskType;
  assigned_to_name: string;
  assigned_to_email?: string | null | undefined;
  assigned_to_phone?: string | null | undefined;
  expires_value: number;
  expires_unit: TaskDurationUnit;
  student_name?: string | null | undefined;
  student_school?: string | null | undefined;
  student_address?: string | null | undefined;
  student_lat?: number | null | undefined;
  student_lng?: number | null | undefined;
  reason_flagged?: string | null | undefined;
  target_grade?: string | null | undefined;
  target_room?: string | null | undefined;
  subject?: string | null | undefined;
  target_school_id?: number | null | undefined;
  role?: string | null | undefined;
  permissions?: string[] | undefined;
  data_scope?: DataScope | undefined;
  existing_case_id?: string | null | undefined;
}

export type TaskRolesCatalog = RoleDefinition[];
export type TaskStudentRecord = Record<string, unknown>;
