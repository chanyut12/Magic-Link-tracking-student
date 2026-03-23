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

export type ScopeFormField =
  | 'province'
  | 'district'
  | 'sub_district'
  | 'school_id'
  | 'grade_level'
  | 'room';

export interface RoleScopePreset {
  mode: 'flexible' | 'global' | 'province' | 'district' | 'sub_district' | 'school';
  allowedFields: ScopeFormField[];
  requiredFields: ScopeFormField[];
  hint: string;
}

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

export const ROLE_SCOPE_PRESETS: Record<string, RoleScopePreset> = {
  ADMIN: {
    mode: 'global',
    allowedFields: [],
    requiredFields: [],
    hint: 'ผู้ดูแลระบบส่วนกลางจะเห็นข้อมูลทั้งประเทศเสมอ',
  },
  ADMIN_PROVINCE: {
    mode: 'province',
    allowedFields: ['province'],
    requiredFields: ['province'],
    hint: 'แอดมินระดับจังหวัดต้องผูกกับจังหวัดเดียว และจะเห็นทั้งจังหวัด',
  },
  ADMIN_DISTRICT: {
    mode: 'district',
    allowedFields: ['province', 'district'],
    requiredFields: ['province', 'district'],
    hint: 'แอดมินระดับอำเภอต้องผูกกับจังหวัดและอำเภอเดียว',
  },
  ADMIN_SUBDISTRICT: {
    mode: 'sub_district',
    allowedFields: ['province', 'district', 'sub_district'],
    requiredFields: ['province', 'district', 'sub_district'],
    hint: 'แอดมินระดับตำบลต้องผูกกับจังหวัด อำเภอ และตำบลเดียว',
  },
  ADMIN_SCHOOL: {
    mode: 'school',
    allowedFields: ['province', 'district', 'sub_district', 'school_id'],
    requiredFields: ['province', 'district', 'sub_district', 'school_id'],
    hint: 'แอดมินระดับโรงเรียนต้องผูกกับโรงเรียนเดียว และจะเห็นทั้งโรงเรียน',
  },
};

export function getRoleScopePreset(role?: string | null): RoleScopePreset {
  return ROLE_SCOPE_PRESETS[role || ''] || {
    mode: 'flexible',
    allowedFields: ['province', 'district', 'sub_district', 'school_id', 'grade_level', 'room'],
    requiredFields: [],
    hint: 'กำหนดขอบเขตข้อมูลได้ตามต้องการ',
  };
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
