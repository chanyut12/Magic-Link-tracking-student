import type { DataScope } from '../constants/permissions';
import type {
  LoginTaskFormModel,
  TaskCreateFormModel,
  TaskCreatePayload,
  TaskScopeFormModel,
} from '../types/task';

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function createTaskFormModel(): TaskCreateFormModel {
  return {
    type: '',
    student_name: '',
    student_school: '',
    student_address: '',
    student_address_house_no: '',
    student_address_moo: '',
    student_address_village: '',
    student_address_soi: '',
    student_address_road: '',
    student_address_subdistrict: '',
    student_address_district: '',
    student_address_province: '',
    student_address_postal_code: '',
    student_address_note: '',
    student_lat: null,
    student_lng: null,
    reason_flagged: '',
    target_grade: '',
    target_room: '',
    target_subject: '',
    assigned_to_name: '',
    assigned_to_email: '',
    expires_value: 1,
    expires_unit: 'days',
    target_school_id: '',
    selected_user_id: '',
    role: 'TEACHER',
    permissions: [],
    existing_case_id: '',
  };
}

export function createLoginTaskFormModel(): LoginTaskFormModel {
  return {
    assigned_to_name: '',
    assigned_to_email: '',
    permissions: [],
    role: 'TEACHER',
    expires_value: 1,
    expires_unit: 'days',
  };
}

export function createTaskScopeFormModel(
  allProvinces = true,
): TaskScopeFormModel {
  return {
    allProvinces,
    province: null,
    district: null,
    sub_district: null,
    school_id: null,
    grade_level: null,
    room: null,
  };
}

export function buildLoginDataScope(scopeForm: TaskScopeFormModel): DataScope {
  const dataScope: DataScope = {};

  if (!scopeForm.allProvinces && scopeForm.province) {
    dataScope.provinces = [scopeForm.province];
  }
  if (!scopeForm.allProvinces && scopeForm.district) {
    dataScope.districts = [scopeForm.district];
  }
  if (!scopeForm.allProvinces && scopeForm.sub_district) {
    dataScope.sub_districts = [scopeForm.sub_district];
  }
  if (!scopeForm.allProvinces && scopeForm.school_id) {
    dataScope.school_ids = [scopeForm.school_id];
  }
  if (scopeForm.grade_level) {
    dataScope.grade_levels = [scopeForm.grade_level];
  }
  if (scopeForm.room) {
    dataScope.room_ids = [scopeForm.room];
  }

  return dataScope;
}

export function buildTaskCreatePayload(
  formData: TaskCreateFormModel,
  options: {
    loginDataScope?: DataScope | undefined;
    visitStudentAddress?: string | undefined;
  } = {},
): TaskCreatePayload {
  const taskType = formData.type || 'VISIT';

  return {
    task_type: taskType,
    type: taskType,
    assigned_to_name: normalizeText(formData.assigned_to_name),
    assigned_to_email: normalizeText(formData.assigned_to_email) || null,
    expires_value: Number(formData.expires_value) || 1,
    expires_unit: formData.expires_unit,
    student_name: normalizeText(formData.student_name) || null,
    student_school: normalizeText(formData.student_school) || null,
    student_address: (
      taskType === 'VISIT'
        ? normalizeText(options.visitStudentAddress || formData.student_address)
        : normalizeText(formData.student_address)
    ) || null,
    student_lat: formData.student_lat,
    student_lng: formData.student_lng,
    reason_flagged: normalizeText(formData.reason_flagged) || null,
    target_grade: normalizeText(formData.target_grade) || null,
    target_room: normalizeText(formData.target_room) || null,
    subject: normalizeText(formData.target_subject) || null,
    target_school_id: (
      taskType === 'ATTENDANCE' && formData.target_school_id
        ? Number.parseInt(formData.target_school_id, 10)
        : null
    ),
    role: taskType === 'LOGIN' ? normalizeText(formData.role) || null : undefined,
    permissions: taskType === 'LOGIN' ? [...formData.permissions] : undefined,
    data_scope: taskType === 'LOGIN' ? options.loginDataScope || {} : undefined,
    existing_case_id: normalizeText(formData.existing_case_id) || undefined,
  };
}

export function buildLoginLinkTaskPayload(
  form: LoginTaskFormModel,
  scopeForm: TaskScopeFormModel,
): TaskCreatePayload {
  return {
    task_type: 'LOGIN',
    type: 'LOGIN',
    assigned_to_name: normalizeText(form.assigned_to_name),
    assigned_to_email: normalizeText(form.assigned_to_email) || null,
    expires_value: Number(form.expires_value) || 1,
    expires_unit: form.expires_unit,
    permissions: [...form.permissions],
    role: normalizeText(form.role) || 'TEACHER',
    data_scope: buildLoginDataScope(scopeForm),
  };
}
