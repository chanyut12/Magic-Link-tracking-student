export const ROLE_RANKS: Record<string, number> = {
  STUDENT: 1,
  TEACHER: 2,
  EXECUTIVE: 3,
  DIRECTOR: 4,
  ADMIN_SCHOOL: 5,
  ADMIN_SUBDISTRICT: 6,
  ADMIN_DISTRICT: 7,
  ADMIN_PROVINCE: 8,
  ADMIN: 9,
};

export const ROLE_BASELINES: Record<string, string[]> = {
  ADMIN: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links', 'settings', 'import-data'],
  ADMIN_PROVINCE: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links'],
  ADMIN_DISTRICT: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links'],
  ADMIN_SUBDISTRICT: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links'],
  ADMIN_SCHOOL: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links'],
  DIRECTOR: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'login-links', 'settings'],
  EXECUTIVE: ['home', 'dashboard', 'students', 'attendance-dashboard'],
  TEACHER: ['home', 'students', 'attendance', 'attendance-dashboard'],
  STUDENT: ['home', 'student-self'],
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ADMIN_PROVINCE: 'แอดมินระดับจังหวัด',
  ADMIN_DISTRICT: 'แอดมินระดับอำเภอ',
  ADMIN_SUBDISTRICT: 'แอดมินระดับตำบล',
  ADMIN_SCHOOL: 'แอดมินระดับโรงเรียน',
  DIRECTOR: 'ผู้อำนวยการ',
  EXECUTIVE: 'ผู้บริหาร',
  TEACHER: 'คุณครู',
  STUDENT: 'นักเรียน',
};

export interface DataScope {
  provinces?: string[];
  districts?: string[];
  sub_districts?: string[];
  school_ids?: number[];
  grade_levels?: number[];
  room_ids?: Array<number | string>;
  own_only?: boolean;
}

function normalizeScopeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0),
    ),
  );
}

export function getRoleScopeValidationError(role: string, scope: unknown): string | null {
  const source = scope && typeof scope === 'object' ? (scope as DataScope) : {};
  const normalized = {
    provinces: normalizeScopeArray(source.provinces),
    districts: normalizeScopeArray(source.districts),
    sub_districts: normalizeScopeArray(source.sub_districts),
    school_ids: normalizeScopeArray(source.school_ids),
    grade_levels: normalizeScopeArray(source.grade_levels),
    room_ids: normalizeScopeArray(source.room_ids),
  };

  const hasExtraSchoolFiltering =
    normalized.grade_levels.length > 0 || normalized.room_ids.length > 0;

  if (role === 'ADMIN') {
    const hasAnyScope =
      normalized.provinces.length > 0 ||
      normalized.districts.length > 0 ||
      normalized.sub_districts.length > 0 ||
      normalized.school_ids.length > 0 ||
      hasExtraSchoolFiltering;

    return hasAnyScope
      ? 'ผู้ดูแลระบบส่วนกลางต้องใช้ขอบเขตข้อมูลระดับประเทศเท่านั้น'
      : null;
  }

  if (role === 'ADMIN_PROVINCE') {
    if (normalized.provinces.length !== 1) {
      return 'แอดมินระดับจังหวัดต้องเลือกจังหวัด 1 แห่ง';
    }
    if (
      normalized.districts.length > 0 ||
      normalized.sub_districts.length > 0 ||
      normalized.school_ids.length > 0 ||
      hasExtraSchoolFiltering
    ) {
      return 'แอดมินระดับจังหวัดห้ามจำกัดอำเภอ ตำบล โรงเรียน ชั้น หรือห้อง';
    }
  }

  if (role === 'ADMIN_DISTRICT') {
    if (normalized.provinces.length !== 1 || normalized.districts.length !== 1) {
      return 'แอดมินระดับอำเภอต้องเลือกจังหวัดและอำเภออย่างละ 1 รายการ';
    }
    if (
      normalized.sub_districts.length > 0 ||
      normalized.school_ids.length > 0 ||
      hasExtraSchoolFiltering
    ) {
      return 'แอดมินระดับอำเภอห้ามจำกัดตำบล โรงเรียน ชั้น หรือห้อง';
    }
  }

  if (role === 'ADMIN_SUBDISTRICT') {
    if (
      normalized.provinces.length !== 1 ||
      normalized.districts.length !== 1 ||
      normalized.sub_districts.length !== 1
    ) {
      return 'แอดมินระดับตำบลต้องเลือกจังหวัด อำเภอ และตำบลอย่างละ 1 รายการ';
    }
    if (normalized.school_ids.length > 0 || hasExtraSchoolFiltering) {
      return 'แอดมินระดับตำบลห้ามจำกัดโรงเรียน ชั้น หรือห้อง';
    }
  }

  if (role === 'ADMIN_SCHOOL') {
    if (
      normalized.provinces.length !== 1 ||
      normalized.districts.length !== 1 ||
      normalized.sub_districts.length !== 1 ||
      normalized.school_ids.length !== 1
    ) {
      return 'แอดมินระดับโรงเรียนต้องเลือกจังหวัด อำเภอ ตำบล และโรงเรียนอย่างละ 1 รายการ';
    }
    if (hasExtraSchoolFiltering) {
      return 'แอดมินระดับโรงเรียนห้ามจำกัดระดับชั้นหรือห้องเรียน';
    }
  }

  return null;
}

export function getEffectivePermissions(roles: string[], customPermissions: string[] = []): string[] {
  void roles;
  return Array.from(new Set(customPermissions));
}

export function hasPermission(roles: string[], customPermissions: string[], permission: string): boolean {
  if (customPermissions.includes('*') || customPermissions.includes('ALL')) return true;
  const effectivePermissions = getEffectivePermissions(roles, customPermissions);
  return effectivePermissions.includes(permission);
}
