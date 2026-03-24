import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from '../auth/password.service';
import {
  GRANT_EXEMPT_PERMISSION_IDS,
  ROLE_BASELINES,
  ROLE_LABELS,
  ROLE_RANKS,
  VALID_PERMISSION_IDS,
  getRoleScopeValidationError,
  type RoleScopeMode,
} from '../auth/permissions.constants';

interface DataScope {
  provinces?: string[];
  districts?: string[];
  sub_districts?: string[];
  school_ids?: Array<number | string>;
  grade_levels?: Array<number | string>;
  room_ids?: Array<number | string>;
  own_only?: boolean;
}

interface ActorContext {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
  data_scope?: DataScope;
}

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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly passwordService: PasswordService,
  ) {}

  private normalizePermissionList(permissions: unknown): string[] {
    if (!Array.isArray(permissions)) {
      return [];
    }

    return Array.from(
      new Set(
        permissions.filter(
          (permission): permission is string =>
            typeof permission === 'string' && permission.trim().length > 0,
        ),
      ),
    );
  }

  private normalizeScope(
    scope: unknown,
  ): Required<Omit<DataScope, 'own_only'>> & Pick<DataScope, 'own_only'> {
    const source = scope && typeof scope === 'object' ? (scope as DataScope) : {};
    const normalizeArray = (value: unknown): string[] => {
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
    };

    return {
      provinces: normalizeArray(source.provinces),
      districts: normalizeArray(source.districts),
      sub_districts: normalizeArray(source.sub_districts),
      school_ids: normalizeArray(source.school_ids),
      grade_levels: normalizeArray(source.grade_levels),
      room_ids: normalizeArray(source.room_ids),
      own_only: source.own_only === true,
    };
  }

  private normalizeRoleName(name: unknown): string {
    if (typeof name !== 'string') {
      return '';
    }

    return name.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private normalizeScopeMode(mode: unknown): RoleScopeMode {
    if (
      mode === 'global' ||
      mode === 'province' ||
      mode === 'district' ||
      mode === 'sub_district' ||
      mode === 'school'
    ) {
      return mode;
    }

    return 'flexible';
  }

  private async getRoleDefinitions(includeUsage = false): Promise<RoleDefinition[]> {
    const sql = includeUsage
      ? `
          SELECT
            r.id,
            r.name,
            r.label,
            r.rank,
            r.default_permissions,
            r.scope_mode,
            r.is_system,
            COALESCE(u.user_count, 0)::int AS user_count,
            COALESCE(tl.login_link_count, 0)::int AS login_link_count
          FROM roles r
          LEFT JOIN (
            SELECT role, COUNT(*) AS user_count
            FROM users
            GROUP BY role
          ) u ON u.role = r.name
          LEFT JOIN (
            SELECT login_role, COUNT(*) AS login_link_count
            FROM task_links
            WHERE login_role IS NOT NULL
            GROUP BY login_role
          ) tl ON tl.login_role = r.name
          ORDER BY r.rank DESC, r.name ASC
        `
      : `
          SELECT
            id,
            name,
            label,
            rank,
            default_permissions,
            scope_mode,
            is_system
          FROM roles
          ORDER BY rank DESC, name ASC
        `;

    const res = await this.db.query(sql);
    return res.rows.map((row: any) => ({
      id: Number(row.id),
      name: String(row.name),
      label: String(row.label),
      rank: Number(row.rank) || 0,
      default_permissions: this.normalizePermissionList(row.default_permissions),
      scope_mode: this.normalizeScopeMode(row.scope_mode),
      is_system: row.is_system === true,
      user_count: row.user_count !== undefined ? Number(row.user_count) || 0 : undefined,
      login_link_count: row.login_link_count !== undefined ? Number(row.login_link_count) || 0 : undefined,
    }));
  }

  private async getRoleMap(includeUsage = false): Promise<Map<string, RoleDefinition>> {
    const definitions = await this.getRoleDefinitions(includeUsage);
    return new Map(definitions.map((definition) => [definition.name, definition]));
  }

  private getRoleRank(role?: string | null, roleMap?: Map<string, RoleDefinition>): number {
    if (!role) {
      return 0;
    }

    const dbRank = roleMap?.get(role)?.rank;
    if (typeof dbRank === 'number' && dbRank > 0) {
      return dbRank;
    }

    return ROLE_RANKS[role] || 0;
  }

  private getRoleLabel(role?: string | null, roleMap?: Map<string, RoleDefinition>): string {
    if (!role) {
      return '';
    }

    return roleMap?.get(role)?.label || ROLE_LABELS[role] || role;
  }

  private getRoleDefaultPermissions(
    role?: string | null,
    roleMap?: Map<string, RoleDefinition>,
  ): string[] {
    if (!role) {
      return [];
    }

    const dbPermissions = roleMap?.get(role)?.default_permissions;
    if (Array.isArray(dbPermissions) && dbPermissions.length > 0) {
      return dbPermissions;
    }

    return Array.from(new Set(ROLE_BASELINES[role] || []));
  }

  private getRoleScopeMode(
    role?: string | null,
    roleMap?: Map<string, RoleDefinition>,
  ): RoleScopeMode {
    if (!role) {
      return 'flexible';
    }

    return roleMap?.get(role)?.scope_mode || 'flexible';
  }

  private getPrimaryRole(
    user?: { role?: string | null; roles?: string[] | null } | null,
  ): string | null {
    if (user?.role && user.role.trim().length > 0) {
      return user.role.trim();
    }

    const firstRole = Array.isArray(user?.roles)
      ? user.roles.find(
          (role): role is string =>
            typeof role === 'string' && role.trim().length > 0,
        )
      : null;

    return firstRole?.trim() || null;
  }

  private canManageRole(
    actorRole?: string | null,
    targetRole?: string | null,
    roleMap?: Map<string, RoleDefinition>,
  ): boolean {
    const actorRank = this.getRoleRank(actorRole, roleMap);
    const targetRank = this.getRoleRank(targetRole, roleMap);

    if (targetRank > actorRank) {
      return false;
    }

    if (targetRank === actorRank && actorRole !== 'ADMIN') {
      return false;
    }

    return true;
  }

  private isScopeGlobal(scope: unknown): boolean {
    const normalized = this.normalizeScope(scope);
    return (
      normalized.provinces.length === 0 &&
      normalized.districts.length === 0 &&
      normalized.sub_districts.length === 0 &&
      normalized.school_ids.length === 0 &&
      normalized.grade_levels.length === 0 &&
      normalized.room_ids.length === 0 &&
      normalized.own_only !== true
    );
  }

  private isScopeSubsetOfActor(targetScope: unknown, actorScope: unknown): boolean {
    if (this.isScopeGlobal(actorScope)) {
      return true;
    }

    const actor = this.normalizeScope(actorScope);
    const target = this.normalizeScope(targetScope);
    const keys: Array<keyof Omit<DataScope, 'own_only'>> = [
      'provinces',
      'districts',
      'sub_districts',
      'school_ids',
      'grade_levels',
      'room_ids',
    ];

    for (const key of keys) {
      const actorValues = actor[key].map(String);
      const targetValues = target[key].map(String);

      if (actorValues.length === 0) {
        continue;
      }

      if (targetValues.length === 0) {
        return false;
      }

      if (!targetValues.every((value) => actorValues.includes(value))) {
        return false;
      }
    }

    if (actor.own_only === true && target.own_only !== true) {
      return false;
    }

    return true;
  }

  private canGrantPermissions(
    actorPermissions: string[],
    targetPermissions: string[],
    actorRole?: string | null,
    roleMap?: Map<string, RoleDefinition>,
  ): boolean {
    const grantablePermissions = Array.from(new Set([
      ...actorPermissions,
      ...this.getRoleDefaultPermissions(actorRole, roleMap),
    ]));

    if (grantablePermissions.includes('*') || grantablePermissions.includes('ALL')) {
      return true;
    }

    return targetPermissions
      .filter((permission) => !GRANT_EXEMPT_PERMISSION_IDS.includes(permission))
      .every((permission) => grantablePermissions.includes(permission));
  }

  private resolveDisplayPermissions(
    permissions: unknown,
    roleDefaultPermissions: unknown,
    fallbackRole?: string | null,
    roleMap?: Map<string, RoleDefinition>,
  ): string[] {
    const storedPermissions = this.normalizePermissionList(permissions);
    if (storedPermissions.length > 0) {
      return storedPermissions;
    }

    const fallbackDefaults = this.normalizePermissionList(roleDefaultPermissions);
    if (fallbackDefaults.length > 0) {
      return fallbackDefaults;
    }

    return this.getRoleDefaultPermissions(fallbackRole, roleMap);
  }

  private hydrateUserPermissions<
    T extends {
      roles?: string[] | null;
      permissions?: unknown;
      role?: string | null;
      role_default_permissions?: unknown;
    },
  >(user: T, roleMap?: Map<string, RoleDefinition>): T {
    const roles = Array.isArray(user.roles)
      ? user.roles.filter(
          (role): role is string =>
            typeof role === 'string' && role.trim().length > 0,
        )
      : [];
    const fallbackRole =
      typeof user.role === 'string' && user.role.trim().length > 0
        ? user.role.trim()
        : null;
    const normalizedRoles = roles.length > 0 ? roles : fallbackRole ? [fallbackRole] : [];

    return {
      ...user,
      role: fallbackRole,
      roles: normalizedRoles,
      permissions: this.resolveDisplayPermissions(
        user.permissions,
        user.role_default_permissions,
        fallbackRole,
        roleMap,
      ),
    };
  }

  private normalizeRole(data: any): string {
    const requestedRole =
      (typeof data?.role === 'string' && data.role.trim().length > 0
        ? data.role
        : Array.isArray(data?.roles)
          ? data.roles.find(
              (role: unknown): role is string =>
                typeof role === 'string' && role.trim().length > 0,
            )
          : null) || 'TEACHER';

    return requestedRole.trim();
  }

  private ensureActor(actor?: ActorContext): ActorContext {
    if (!actor?.id) {
      throw new ForbiddenException('ไม่ได้เข้าสู่ระบบ');
    }

    return actor;
  }

  private assertValidPermissionList(permissionIds: string[]): void {
    const invalidPermissions = permissionIds.filter(
      (permissionId) => !VALID_PERMISSION_IDS.includes(permissionId),
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`สิทธิ์ไม่ถูกต้อง: ${invalidPermissions.join(', ')}`);
    }
  }

  private canManageUser(
    actor: ActorContext,
    target: {
      id?: number | null;
      role?: string | null;
      roles?: string[] | null;
      data_scope?: unknown;
    },
    roleMap?: Map<string, RoleDefinition>,
  ): boolean {
    if (actor.id === target.id) {
      return true;
    }

    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    const targetRole = this.getPrimaryRole(target);

    if (!this.canManageRole(actorRole, targetRole, roleMap)) {
      return false;
    }

    return this.isScopeSubsetOfActor(target.data_scope, actor.data_scope);
  }

  private async assertAssignablePayload(
    actor: ActorContext,
    data: any,
    options: { allowEqualRole: boolean },
    roleMap?: Map<string, RoleDefinition>,
  ): Promise<void> {
    const currentRoleMap = roleMap || await this.getRoleMap();
    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    const requestedRole = this.normalizeRole(data);
    const actorRank = this.getRoleRank(actorRole, currentRoleMap);
    const requestedRank = this.getRoleRank(requestedRole, currentRoleMap);

    if (requestedRank === 0) {
      throw new ForbiddenException(`ไม่สามารถกำหนดตำแหน่ง ${requestedRole} ได้`);
    }

    const exceedsRoleAuthority = options.allowEqualRole
      ? requestedRank > actorRank
      : requestedRank > actorRank || (requestedRank === actorRank && actorRole !== 'ADMIN');

    if (exceedsRoleAuthority) {
      throw new ForbiddenException(
        'ไม่สามารถกำหนดตำแหน่งสูงกว่าหรือเทียบเท่าตำแหน่งของตนเองได้',
      );
    }

    const requestedPermissions = this.normalizePermissionList(data?.permissions);
    this.assertValidPermissionList(requestedPermissions);

    if (!this.canGrantPermissions(actor.permissions || [], requestedPermissions, actorRole, currentRoleMap)) {
      throw new ForbiddenException('ไม่สามารถกำหนดสิทธิ์ที่ตนเองไม่มีได้');
    }

    if (!this.isScopeSubsetOfActor(data?.data_scope, actor.data_scope)) {
      throw new ForbiddenException('ไม่สามารถกำหนดขอบเขตข้อมูลกว้างกว่าสิทธิ์ของตนเองได้');
    }

    const roleScopeError = getRoleScopeValidationError(requestedRole, data?.data_scope, {
      scopeMode: this.getRoleScopeMode(requestedRole, currentRoleMap),
      roleLabel: this.getRoleLabel(requestedRole, currentRoleMap),
    });
    if (roleScopeError) {
      throw new ForbiddenException(roleScopeError);
    }
  }

  private async getUserRecordById(
    id: number,
    roleMap?: Map<string, RoleDefinition>,
  ): Promise<any | null> {
    const sql = `
      SELECT
        u.id,
        u.username,
        u."FirstName",
        u."LastName",
        u."PersonID_Onec",
        u.phone,
        u.email,
        u.affiliation,
        u.status,
        u.permissions,
        u.role,
        u.data_scope,
        u.created_at,
        CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END AS roles,
        CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END AS labels,
        r.default_permissions AS role_default_permissions
      FROM users u
      LEFT JOIN roles r ON r.name = u.role
      WHERE u.id = $1
    `;
    const result = await this.db.query(sql, [id]);
    const row = result.rows[0];

    return row ? this.hydrateUserPermissions(row, roleMap) : null;
  }

  private normalizeRoleGroupPayload(
    data: any,
    existing?: RoleDefinition | null,
  ): {
    name: string;
    label: string;
    rank: number;
    default_permissions: string[];
    scope_mode: RoleScopeMode;
  } {
    const name = existing?.name || this.normalizeRoleName(data?.name);
    if (!name) {
      throw new BadRequestException('กรุณากรอกรหัสกลุ่มผู้ใช้งาน');
    }

    if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(name)) {
      throw new BadRequestException(
        'รหัสกลุ่มผู้ใช้งานต้องเป็นตัวพิมพ์ใหญ่ ภาษาอังกฤษ ตัวเลข หรือ _ และขึ้นต้นด้วยตัวอักษร',
      );
    }

    const label = typeof data?.label === 'string' ? data.label.trim() : '';
    if (!label) {
      throw new BadRequestException('กรุณากรอกชื่อกลุ่มผู้ใช้งาน');
    }

    const rank = Number(data?.rank);
    if (!Number.isInteger(rank) || rank < 1) {
      throw new BadRequestException('ลำดับสิทธิ์ต้องเป็นตัวเลขจำนวนเต็มที่มากกว่าศูนย์');
    }

    const defaultPermissions = this.normalizePermissionList(
      data?.default_permissions ?? data?.permissions,
    );
    this.assertValidPermissionList(defaultPermissions);
    if (defaultPermissions.length === 0) {
      throw new BadRequestException('กรุณาเลือกสิทธิ์เริ่มต้นอย่างน้อย 1 รายการ');
    }

    return {
      name,
      label,
      rank,
      default_permissions: defaultPermissions,
      scope_mode: this.normalizeScopeMode(data?.scope_mode),
    };
  }

  async getAllUsers(actor?: ActorContext) {
    const roleMap = await this.getRoleMap();
    const sql = `
      SELECT
        u.id,
        u.username,
        u."FirstName",
        u."LastName",
        u."PersonID_Onec",
        u.phone,
        u.email,
        u.affiliation,
        u.status,
        u.permissions,
        u.role,
        u.data_scope,
        u.created_at,
        CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END AS roles,
        CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END AS labels,
        r.default_permissions AS role_default_permissions
      FROM users u
      LEFT JOIN roles r ON r.name = u.role
      ORDER BY u.created_at DESC
    `;
    const result = await this.db.query(sql);
    const hydratedUsers = result.rows.map((row: any) =>
      this.hydrateUserPermissions(row, roleMap),
    );

    if (!actor) {
      return hydratedUsers;
    }

    return hydratedUsers.filter((user: any) => this.canManageUser(actor, user, roleMap));
  }

  async getUserById(id: number, actor?: ActorContext) {
    const roleMap = await this.getRoleMap();
    const user = await this.getUserRecordById(id, roleMap);

    if (!user) {
      return null;
    }

    if (actor && !this.canManageUser(actor, user, roleMap)) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งานนี้');
    }

    return user;
  }

  async createUser(actor: ActorContext | undefined, data: any) {
    try {
      const currentActor = this.ensureActor(actor);
      const roleMap = await this.getRoleMap();
      await this.assertAssignablePayload(currentActor, data, { allowEqualRole: false }, roleMap);

      return await this.db.transaction(async (client) => {
        const hashedPassword = await this.passwordService.hash(data.password || '123456');
        const primaryRole = this.normalizeRole(data);

        const userRes = await client.query(
          `
            INSERT INTO users (
              username,
              password,
              "FirstName",
              "LastName",
              "PersonID_Onec",
              phone,
              email,
              affiliation,
              status,
              permissions,
              role,
              data_scope
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `,
          [
            data.username,
            hashedPassword,
            data.FirstName,
            data.LastName,
            data.PersonID_Onec,
            data.phone,
            data.email,
            data.affiliation,
            data.status || 'ACTIVE',
            JSON.stringify(data.permissions || []),
            primaryRole,
            JSON.stringify(data.data_scope || {}),
          ],
        );

        return { success: true, userId: userRes.rows[0].id };
      });
    } catch (err) {
      this.logger.error(`createUser error: ${err.message}`);
      throw err;
    }
  }

  async updateUser(actor: ActorContext | undefined, id: number, data: any) {
    try {
      const currentActor = this.ensureActor(actor);
      const roleMap = await this.getRoleMap();
      const existingUser = await this.getUserRecordById(id, roleMap);
      if (!existingUser) {
        throw new NotFoundException('ไม่พบผู้ใช้งาน');
      }

      if (!this.canManageUser(currentActor, existingUser, roleMap)) {
        throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขผู้ใช้งานนี้');
      }

      const isSelf = currentActor.id === id;
      const existingRole = this.getPrimaryRole(existingUser);
      const requestedRole = this.normalizeRole(data);

      if (isSelf && requestedRole !== existingRole) {
        throw new ForbiddenException('ไม่สามารถเปลี่ยนตำแหน่งของบัญชีตัวเองได้');
      }

      await this.assertAssignablePayload(currentActor, data, { allowEqualRole: isSelf }, roleMap);

      return await this.db.transaction(async (client) => {
        const primaryRole = this.normalizeRole(data);
        const setClauses = [
          `username = $1`,
          `"FirstName" = $2`,
          `"LastName" = $3`,
          `"PersonID_Onec" = $4`,
          `phone = $5`,
          `email = $6`,
          `affiliation = $7`,
          `status = $8`,
          `permissions = $9`,
          `role = $10`,
          `data_scope = $11`,
        ];
        const queryParams = [
          data.username,
          data.FirstName,
          data.LastName,
          data.PersonID_Onec,
          data.phone,
          data.email,
          data.affiliation,
          data.status,
          JSON.stringify(data.permissions || []),
          primaryRole,
          JSON.stringify(data.data_scope || {}),
        ];
        let paramIndex = queryParams.length + 1;

        if (data.password) {
          const hashedPassword = await this.passwordService.hash(data.password);
          setClauses.push(`password = $${paramIndex++}`);
          queryParams.push(hashedPassword);
        }

        queryParams.push(id);

        await client.query(
          `
            UPDATE users
            SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
          `,
          queryParams,
        );

        return { success: true };
      });
    } catch (err) {
      this.logger.error(`updateUser error: ${err.message}`);
      throw err;
    }
  }

  async deleteUser(actor: ActorContext | undefined, id: number) {
    try {
      const currentActor = this.ensureActor(actor);
      const roleMap = await this.getRoleMap();
      const existingUser = await this.getUserRecordById(id, roleMap);
      if (!existingUser) {
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ');
      }

      if (currentActor.id === id) {
        throw new ForbiddenException('ไม่สามารถลบบัญชีของตัวเองได้');
      }

      if (!this.canManageUser(currentActor, existingUser, roleMap)) {
        throw new ForbiddenException('ไม่มีสิทธิ์ลบผู้ใช้งานนี้');
      }

      return await this.db.transaction(async (client) => {
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
          throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ');
        }

        return { success: true, rowCount: result.rowCount };
      });
    } catch (err) {
      this.logger.error(`deleteUser error: ${err.message}`);
      throw err;
    }
  }

  async getRoles(actor?: ActorContext) {
    const definitions = await this.getRoleDefinitions();
    if (!actor) {
      return definitions;
    }

    const roleMap = new Map(definitions.map((definition) => [definition.name, definition]));
    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    return definitions.filter((role) => (
      role.name === actorRole ||
      (
        this.canManageRole(actorRole, role.name, roleMap) &&
        this.canGrantPermissions(actor.permissions || [], role.default_permissions || [], actorRole, roleMap)
      )
    ));
  }

  async getRoleGroups(actor?: ActorContext) {
    const definitions = await this.getRoleDefinitions(true);
    if (!actor) {
      return definitions;
    }

    const roleMap = new Map(definitions.map((definition) => [definition.name, definition]));
    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    return definitions.filter((role) => (
      this.canManageRole(actorRole, role.name, roleMap) &&
      this.canGrantPermissions(actor.permissions || [], role.default_permissions || [], actorRole, roleMap)
    ));
  }

  async createRoleGroup(actor: ActorContext | undefined, data: any) {
    const currentActor = this.ensureActor(actor);
    const definitions = await this.getRoleDefinitions();
    const roleMap = new Map(definitions.map((definition) => [definition.name, definition]));
    const payload = this.normalizeRoleGroupPayload(data);

    if (roleMap.has(payload.name)) {
      throw new BadRequestException('มีกลุ่มผู้ใช้งานนี้อยู่แล้ว');
    }

    const actorRole = this.getPrimaryRole({ roles: currentActor.roles });
    const actorRank = this.getRoleRank(actorRole, roleMap);
    if (payload.rank > actorRank || (payload.rank === actorRank && actorRole !== 'ADMIN')) {
      throw new ForbiddenException('ไม่สามารถสร้างกลุ่มผู้ใช้งานที่มีลำดับสิทธิ์สูงกว่าหรือเทียบเท่าตนเองได้');
    }

    if (!this.canGrantPermissions(currentActor.permissions || [], payload.default_permissions, actorRole, roleMap)) {
      throw new ForbiddenException('ไม่สามารถกำหนดสิทธิ์เริ่มต้นที่ตนเองไม่มีได้');
    }

    const res = await this.db.query(
      `
        INSERT INTO roles (name, label, rank, default_permissions, scope_mode, is_system)
        VALUES ($1, $2, $3, $4::jsonb, $5, FALSE)
        RETURNING id, name, label, rank, default_permissions, scope_mode, is_system
      `,
      [
        payload.name,
        payload.label,
        payload.rank,
        JSON.stringify(payload.default_permissions),
        payload.scope_mode,
      ],
    );

    return {
      success: true,
      role: {
        ...res.rows[0],
        default_permissions: this.normalizePermissionList(res.rows[0].default_permissions),
      },
    };
  }

  async updateRoleGroup(actor: ActorContext | undefined, roleName: string, data: any) {
    const currentActor = this.ensureActor(actor);
    const normalizedRoleName = this.normalizeRoleName(roleName);
    const definitions = await this.getRoleDefinitions(true);
    const roleMap = new Map(definitions.map((definition) => [definition.name, definition]));
    const existingRole = roleMap.get(normalizedRoleName);

    if (!existingRole) {
      throw new NotFoundException('ไม่พบกลุ่มผู้ใช้งาน');
    }

    const actorRole = this.getPrimaryRole({ roles: currentActor.roles });
    if (!this.canManageRole(actorRole, existingRole.name, roleMap)) {
      throw new ForbiddenException('ไม่มีสิทธิ์จัดการกลุ่มผู้ใช้งานนี้');
    }

    const payload = this.normalizeRoleGroupPayload(data, existingRole);
    const actorRank = this.getRoleRank(actorRole, roleMap);
    if (payload.rank > actorRank || (payload.rank === actorRank && actorRole !== 'ADMIN')) {
      throw new ForbiddenException('ไม่สามารถกำหนดลำดับสิทธิ์สูงกว่าหรือเทียบเท่าตนเองได้');
    }

    if (!this.canGrantPermissions(currentActor.permissions || [], payload.default_permissions, actorRole, roleMap)) {
      throw new ForbiddenException('ไม่สามารถกำหนดสิทธิ์เริ่มต้นที่ตนเองไม่มีได้');
    }

    const res = await this.db.query(
      `
        UPDATE roles
        SET label = $2,
            rank = $3,
            default_permissions = $4::jsonb,
            scope_mode = $5
        WHERE name = $1
        RETURNING id, name, label, rank, default_permissions, scope_mode, is_system
      `,
      [
        existingRole.name,
        payload.label,
        payload.rank,
        JSON.stringify(payload.default_permissions),
        payload.scope_mode,
      ],
    );

    return {
      success: true,
      role: {
        ...res.rows[0],
        default_permissions: this.normalizePermissionList(res.rows[0].default_permissions),
      },
    };
  }

  async deleteRoleGroup(actor: ActorContext | undefined, roleName: string) {
    const currentActor = this.ensureActor(actor);
    const normalizedRoleName = this.normalizeRoleName(roleName);
    const definitions = await this.getRoleDefinitions(true);
    const roleMap = new Map(definitions.map((definition) => [definition.name, definition]));
    const existingRole = roleMap.get(normalizedRoleName);

    if (!existingRole) {
      throw new NotFoundException('ไม่พบกลุ่มผู้ใช้งาน');
    }

    const actorRole = this.getPrimaryRole({ roles: currentActor.roles });
    if (!this.canManageRole(actorRole, existingRole.name, roleMap)) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบกลุ่มผู้ใช้งานนี้');
    }

    if (existingRole.is_system) {
      throw new ForbiddenException('ไม่สามารถลบบทบาทระบบได้');
    }

    if ((existingRole.user_count || 0) > 0) {
      throw new ForbiddenException('ไม่สามารถลบบทบาทที่ยังมีผู้ใช้งานอยู่ได้');
    }

    if ((existingRole.login_link_count || 0) > 0) {
      throw new ForbiddenException('ไม่สามารถลบบทบาทที่ยังถูกใช้งานในลิงก์เข้าสู่ระบบได้');
    }

    await this.db.query('DELETE FROM roles WHERE name = $1', [existingRole.name]);
    return { success: true };
  }

  async validateUser(username: string, password: string) {
    const roleMap = await this.getRoleMap();
    const sql = `
      SELECT
        u.id,
        u.username,
        u.password,
        u."FirstName",
        u."LastName",
        u."PersonID_Onec",
        u.email,
        u.affiliation,
        u.status,
        u.permissions,
        u.role,
        u.data_scope,
        CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END AS roles,
        CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END AS labels,
        r.default_permissions AS role_default_permissions
      FROM users u
      LEFT JOIN roles r ON r.name = u.role
      WHERE u.username = $1
    `;
    const result = await this.db.query(sql, [username]);
    const user = result.rows[0];

    if (!user) return null;

    const isPasswordValid = await this.passwordService.compare(password, user.password);
    if (!isPasswordValid) return null;

    delete user.password;
    return this.hydrateUserPermissions(user, roleMap);
  }

  async hashExistingPasswords() {
    this.logger.log('Starting to hash existing plaintext passwords...');

    const result = await this.db.query(
      `SELECT id, password FROM users WHERE password NOT LIKE '$2%'`,
    );

    let updated = 0;
    for (const row of result.rows) {
      const hashedPassword = await this.passwordService.hash(row.password);
      await this.db.query('UPDATE users SET password = $1 WHERE id = $2', [
        hashedPassword,
        row.id,
      ]);
      updated++;
    }

    this.logger.log(`Hashed ${updated} passwords`);
    return { updated };
  }
}
