import type {
  RoleScopeMode,
  RoleScopePreset,
} from '../types/role';

export interface DataScope {
  provinces?: string[];
  districts?: string[];
  sub_districts?: string[];
  school_ids?: number[];
  grade_levels?: number[];
  room_ids?: Array<number | string>;
  own_only?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
}

export type {
  RoleDefinition,
  RoleScopeMode,
  RoleScopePreset,
  ScopeFormField,
} from '../types/role';

export type PermissionDeltaState =
  | 'default'
  | 'added'
  | 'removed'
  | 'neutral'
  | 'locked';

export interface PermissionDeltaMeta {
  label: string;
  shortLabel: string;
  description: string;
}

export interface PermissionDeltaSummary {
  defaultCount: number;
  addedCount: number;
  removedCount: number;
  neutralCount: number;
  lockedCount: number;
}

export const GRANT_EXEMPT_PERMISSION_IDS = ['student-self'];

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
  ADMIN: ['home', 'dashboard', 'students', 'create', 'attendance', 'attendance-dashboard', 'manage-users-list', 'manage-role-groups', 'login-links', 'settings', 'import-data'],
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

export const ROLE_SCOPE_MODE_LABELS: Record<RoleScopeMode, string> = {
  flexible: 'กำหนดเอง',
  global: 'ระดับประเทศ',
  province: 'ระดับจังหวัด',
  district: 'ระดับอำเภอ',
  sub_district: 'ระดับตำบล',
  school: 'ระดับโรงเรียน',
};

export const ROLE_SCOPE_PRESETS: Record<RoleScopeMode, RoleScopePreset> = {
  flexible: {
    mode: 'flexible',
    allowedFields: ['province', 'district', 'sub_district', 'school_id', 'grade_level', 'room'],
    requiredFields: [],
    hint: 'กำหนดขอบเขตข้อมูลได้ตามต้องการ',
  },
  global: {
    mode: 'global',
    allowedFields: [],
    requiredFields: [],
    hint: 'บทบาทนี้จะเห็นข้อมูลทั้งประเทศเสมอ',
  },
  province: {
    mode: 'province',
    allowedFields: ['province'],
    requiredFields: ['province'],
    hint: 'บทบาทนี้ต้องผูกกับจังหวัดเดียว และจะเห็นทั้งจังหวัด',
  },
  district: {
    mode: 'district',
    allowedFields: ['province', 'district'],
    requiredFields: ['province', 'district'],
    hint: 'บทบาทนี้ต้องผูกกับจังหวัดและอำเภอเดียว',
  },
  sub_district: {
    mode: 'sub_district',
    allowedFields: ['province', 'district', 'sub_district'],
    requiredFields: ['province', 'district', 'sub_district'],
    hint: 'บทบาทนี้ต้องผูกกับจังหวัด อำเภอ และตำบลเดียว',
  },
  school: {
    mode: 'school',
    allowedFields: ['province', 'district', 'sub_district', 'school_id'],
    requiredFields: ['province', 'district', 'sub_district', 'school_id'],
    hint: 'บทบาทนี้ต้องผูกกับโรงเรียนเดียว และจะเห็นทั้งโรงเรียน',
  },
};

export const ROLE_SCOPE_MODE_BY_ROLE: Record<string, RoleScopeMode> = {
  ADMIN: 'global',
  ADMIN_PROVINCE: 'province',
  ADMIN_DISTRICT: 'district',
  ADMIN_SUBDISTRICT: 'sub_district',
  ADMIN_SCHOOL: 'school',
};

export function getRoleScopePreset(role?: string | null, scopeMode?: RoleScopeMode | null): RoleScopePreset {
  const resolvedMode = scopeMode || ROLE_SCOPE_MODE_BY_ROLE[role || ''] || 'flexible';
  return ROLE_SCOPE_PRESETS[resolvedMode] || ROLE_SCOPE_PRESETS.flexible;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'หน้าหลัก', icon: 'fas fa-home', route: '/' },
  { id: 'dashboard', label: 'รายงานนักเรียน', icon: 'fas fa-chart-line', route: '/dashboard' },
  { id: 'students', label: 'รายชื่อนักเรียน', icon: 'fas fa-user-graduate', route: '/students' },
  { id: 'student-self', label: 'ข้อมูลตัวเอง', icon: 'fas fa-user-circle', route: '/my-attendance' },
  { id: 'create', label: 'สร้างลิงค์', icon: 'fas fa-link', route: '/create' },
  { id: 'import-data', label: 'นำเข้าข้อมูล', icon: 'fas fa-file-import', route: '/import-data' },
  {
    id: 'attendance-system',
    label: 'ระบบเช็คชื่อ',
    icon: 'fas fa-clipboard-check',
    children: [
      { id: 'attendance-dashboard', label: 'Dashboard เช็คชื่อ', icon: 'fas fa-chart-bar', route: '/attendance-dashboard' },
      { id: 'attendance', label: 'เช็คชื่อ', icon: 'fas fa-edit', route: '/attendance' },
    ],
  },
  {
    id: 'manage-users',
    label: 'จัดการสิทธิ์ผู้ใช้งาน',
    icon: 'fas fa-users-cog',
    children: [
      { id: 'manage-users-list', label: 'จัดการรายชื่อผู้ใช้งาน', icon: 'fas fa-users', route: '/manage-users' },
      { id: 'manage-role-groups', label: 'จัดการกลุ่มผู้ใช้งาน', icon: 'fas fa-user-tag', route: '/manage-role-groups' },
      { id: 'login-links', label: 'ลิงก์เข้าสู่ระบบ', icon: 'fas fa-link', route: '/login-links' },
    ],
  },
  { id: 'settings', label: 'ตั้งค่าระบบ (Master Data)', icon: 'fas fa-cogs', route: '/settings' },
];

export function getEffectivePermissions(roles: string[], customPermissions: string[] = []): string[] {
  void roles;
  return Array.from(new Set(customPermissions));
}

export function hasPermission(userPermissions: string[], permissionId: string): boolean {
  if (userPermissions.includes('ADMIN') || userPermissions.includes('*') || userPermissions.includes('ALL')) return true;
  return userPermissions.includes(permissionId);
}

export function filterMenuItems(menuItems: MenuItem[], userPermissions: string[]): MenuItem[] {
  return menuItems
    .map(item => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => 
          hasPermission(userPermissions, child.id)
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return hasPermission(userPermissions, item.id) ? item : null;
    })
    .filter((item): item is MenuItem => item !== null);
}

export function getFirstAccessibleRoute(userPermissions: string[]): string {
  const filteredMenuItems = filterMenuItems(MENU_ITEMS, userPermissions);

  for (const item of filteredMenuItems) {
    if (item.route) {
      return item.route;
    }
    const firstChildRoute = item.children?.find((child) => child.route)?.route;
    if (firstChildRoute) {
      return firstChildRoute;
    }
  }

  return '/forbidden';
}

export function getLeafMenuItems(menuItems: MenuItem[] = MENU_ITEMS): MenuItem[] {
  return menuItems.flatMap((item) => (
    item.children && item.children.length > 0
      ? getLeafMenuItems(item.children)
      : [item]
  ));
}

export const PERMISSION_DELTA_META: Record<PermissionDeltaState, PermissionDeltaMeta> = {
  default: {
    label: 'ค่าเริ่มต้นของ role',
    shortLabel: 'ค่าเริ่มต้น',
    description: 'สิทธิ์นี้มาจากค่าเริ่มต้นของ role ที่เลือกไว้',
  },
  added: {
    label: 'เพิ่มจากค่าเริ่มต้น',
    shortLabel: 'เพิ่ม',
    description: 'สิทธิ์นี้ถูกเพิ่มเกินจาก default ของ role',
  },
  removed: {
    label: 'เอาออกจากค่าเริ่มต้น',
    shortLabel: 'ปิด default',
    description: 'role ควรมีสิทธิ์นี้ แต่ถูกเอาออกเฉพาะบัญชีนี้',
  },
  neutral: {
    label: 'ไม่ได้เลือก',
    shortLabel: 'ไม่ได้เลือก',
    description: 'สิทธิ์นี้ไม่อยู่ใน default และยังไม่ได้เปิดใช้งาน',
  },
  locked: {
    label: 'ไม่มีสิทธิ์มอบต่อ',
    shortLabel: 'ล็อก',
    description: 'ผู้ใช้ปัจจุบันไม่สามารถมอบสิทธิ์นี้ให้ผู้อื่นได้',
  },
};

export const PERMISSION_DELTA_LEGEND = ([
  'default',
  'added',
  'removed',
  'locked',
] as PermissionDeltaState[]).map((state) => ({
  state,
  ...PERMISSION_DELTA_META[state],
}));

export function getPermissionDeltaState(
  permissionId: string,
  selectedPermissions: string[],
  defaultPermissions: string[],
  isLocked = false,
): PermissionDeltaState {
  if (isLocked) {
    return 'locked';
  }

  const selectedSet = new Set(selectedPermissions);
  const defaultSet = new Set(defaultPermissions);
  const isSelected = selectedSet.has(permissionId);
  const isDefault = defaultSet.has(permissionId);

  if (isSelected && isDefault) {
    return 'default';
  }

  if (isSelected) {
    return 'added';
  }

  if (isDefault) {
    return 'removed';
  }

  return 'neutral';
}

export function getPermissionDeltaSummary(
  permissionIds: string[],
  selectedPermissions: string[],
  defaultPermissions: string[],
  isLocked: (permissionId: string) => boolean = () => false,
): PermissionDeltaSummary {
  return permissionIds.reduce<PermissionDeltaSummary>((summary, permissionId) => {
    const state = getPermissionDeltaState(
      permissionId,
      selectedPermissions,
      defaultPermissions,
      isLocked(permissionId),
    );

    switch (state) {
      case 'default':
        summary.defaultCount += 1;
        break;
      case 'added':
        summary.addedCount += 1;
        break;
      case 'removed':
        summary.removedCount += 1;
        break;
      case 'locked':
        summary.lockedCount += 1;
        break;
      default:
        summary.neutralCount += 1;
        break;
    }

    return summary;
  }, {
    defaultCount: 0,
    addedCount: 0,
    removedCount: 0,
    neutralCount: 0,
    lockedCount: 0,
  });
}
