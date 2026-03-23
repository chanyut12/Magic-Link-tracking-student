import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from '../auth/password.service';
import {
  ROLE_BASELINES,
  ROLE_RANKS,
  getRoleScopeValidationError,
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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly passwordService: PasswordService
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

  private normalizeScope(scope: unknown): Required<Omit<DataScope, 'own_only'>> & Pick<DataScope, 'own_only'> {
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

  private getPrimaryRole(user?: { role?: string | null; roles?: string[] | null } | null): string | null {
    if (user?.role && user.role.trim().length > 0) {
      return user.role.trim();
    }

    const firstRole = Array.isArray(user?.roles)
      ? user.roles.find((role): role is string => typeof role === 'string' && role.trim().length > 0)
      : null;

    return firstRole?.trim() || null;
  }

  private getRoleRank(role?: string | null): number {
    if (!role) {
      return 0;
    }

    return ROLE_RANKS[role] || 0;
  }

  private canManageRole(actorRole?: string | null, targetRole?: string | null): boolean {
    const actorRank = this.getRoleRank(actorRole);
    const targetRank = this.getRoleRank(targetRole);

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

  private canGrantPermissions(actorPermissions: string[], targetPermissions: string[]): boolean {
    if (actorPermissions.includes('*') || actorPermissions.includes('ALL')) {
      return true;
    }

    return targetPermissions.every((permission) => actorPermissions.includes(permission));
  }

  private resolveDisplayPermissions(
    roles: string[],
    permissions: unknown,
    fallbackRole?: string | null,
  ): string[] {
    const storedPermissions = this.normalizePermissionList(permissions);
    if (storedPermissions.length > 0) {
      return storedPermissions;
    }

    const candidateRoles = [
      ...roles,
      ...(typeof fallbackRole === 'string' && fallbackRole.trim().length > 0
        ? [fallbackRole]
        : []),
    ];

    return Array.from(
      new Set(
        candidateRoles.flatMap((role) => ROLE_BASELINES[role] || []),
      ),
    );
  }

  private hydrateUserPermissions<T extends { roles?: string[] | null; permissions?: unknown; role?: string | null }>(user: T): T {
    const roles = Array.isArray(user.roles)
      ? user.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
      : [];
    const fallbackRole =
      typeof user.role === 'string' && user.role.trim().length > 0
        ? user.role.trim()
        : null;
    const normalizedRoles = roles.length > 0
      ? roles
      : (fallbackRole ? [fallbackRole] : []);

    return {
      ...user,
      role: fallbackRole,
      roles: normalizedRoles,
      permissions: this.resolveDisplayPermissions(normalizedRoles, user.permissions, fallbackRole),
    };
  }

  private normalizeRole(data: any): string {
    const requestedRole =
      (typeof data?.role === 'string' && data.role.trim().length > 0
        ? data.role
        : Array.isArray(data?.roles)
          ? data.roles.find((role: unknown): role is string => typeof role === 'string' && role.trim().length > 0)
          : null) || 'TEACHER';

    return requestedRole.trim();
  }

  private ensureActor(actor?: ActorContext): ActorContext {
    if (!actor?.id) {
      throw new ForbiddenException('ไม่ได้เข้าสู่ระบบ');
    }

    return actor;
  }

  private canManageUser(
    actor: ActorContext,
    target: { id?: number | null; role?: string | null; roles?: string[] | null; data_scope?: unknown },
  ): boolean {
    if (actor.id === target.id) {
      return true;
    }

    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    const targetRole = this.getPrimaryRole(target);

    if (!this.canManageRole(actorRole, targetRole)) {
      return false;
    }

    return this.isScopeSubsetOfActor(target.data_scope, actor.data_scope);
  }

  private assertAssignablePayload(
    actor: ActorContext,
    data: any,
    options: { allowEqualRole: boolean },
  ): void {
    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    const requestedRole = this.normalizeRole(data);
    const actorRank = this.getRoleRank(actorRole);
    const requestedRank = this.getRoleRank(requestedRole);

    if (requestedRank === 0) {
      throw new ForbiddenException(`ไม่สามารถกำหนดตำแหน่ง ${requestedRole} ได้`);
    }

    const exceedsRoleAuthority = options.allowEqualRole
      ? requestedRank > actorRank
      : requestedRank > actorRank || (requestedRank === actorRank && actorRole !== 'ADMIN');

    if (exceedsRoleAuthority) {
      throw new ForbiddenException('ไม่สามารถกำหนดตำแหน่งสูงกว่าหรือเทียบเท่าตำแหน่งของตนเองได้');
    }

    const requestedPermissions = this.normalizePermissionList(data?.permissions);
    if (!this.canGrantPermissions(actor.permissions || [], requestedPermissions)) {
      throw new ForbiddenException('ไม่สามารถกำหนดสิทธิ์ที่ตนเองไม่มีได้');
    }

    if (!this.isScopeSubsetOfActor(data?.data_scope, actor.data_scope)) {
      throw new ForbiddenException('ไม่สามารถกำหนดขอบเขตข้อมูลกว้างกว่าสิทธิ์ของตนเองได้');
    }

    const roleScopeError = getRoleScopeValidationError(requestedRole, data?.data_scope);
    if (roleScopeError) {
      throw new ForbiddenException(roleScopeError);
    }
  }

  async getAllUsers(actor?: ActorContext) {
    const sql = `
      SELECT u.id, u.username, u."FirstName", u."LastName", u."PersonID_Onec", 
             u.phone, u.email, u.affiliation, u.status, u.permissions, u.role, u.data_scope, u.created_at,
             CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END as roles,
             CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END as labels
      FROM users u
      LEFT JOIN roles r ON r.name = u.role
      ORDER BY u.created_at DESC
    `;
    const result = await this.db.query(sql);
    const hydratedUsers = result.rows.map((row: any) => this.hydrateUserPermissions(row));

    if (!actor) {
      return hydratedUsers;
    }

    return hydratedUsers.filter((user: any) => this.canManageUser(actor, user));
  }

  async getUserById(id: number, actor?: ActorContext) {
    const sql = `
      SELECT u.id, u.username, u."FirstName", u."LastName", u."PersonID_Onec", 
             u.phone, u.email, u.affiliation, u.status, u.permissions, u.role, u.data_scope, u.created_at,
             CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END as roles,
             CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END as labels
      FROM users u
      LEFT JOIN roles r ON r.name = u.role
      WHERE u.id = $1
    `;
    const result = await this.db.query(sql, [id]);
    const user = result.rows[0] ? this.hydrateUserPermissions(result.rows[0]) : null;

    if (!user) {
      return null;
    }

    if (actor && !this.canManageUser(actor, user)) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งานนี้');
    }

    return user;
  }

  async createUser(actor: ActorContext | undefined, data: any) {
    try {
      const currentActor = this.ensureActor(actor);
      this.assertAssignablePayload(currentActor, data, { allowEqualRole: false });

      return await this.db.transaction(async (client) => {
        const hashedPassword = await this.passwordService.hash(data.password || '123456');
        const primaryRole = this.normalizeRole(data);
        
        const userRes = await client.query(
          `
          INSERT INTO users (username, password, "FirstName", "LastName", "PersonID_Onec", phone, email, affiliation, status, permissions, role, data_scope)
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
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundException('ไม่พบผู้ใช้งาน');
      }

      if (!this.canManageUser(currentActor, existingUser)) {
        throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขผู้ใช้งานนี้');
      }

      const isSelf = currentActor.id === id;
      const existingRole = this.getPrimaryRole(existingUser);
      const requestedRole = this.normalizeRole(data);

      if (isSelf && requestedRole !== existingRole) {
        throw new ForbiddenException('ไม่สามารถเปลี่ยนตำแหน่งของบัญชีตัวเองได้');
      }

      this.assertAssignablePayload(currentActor, data, { allowEqualRole: isSelf });

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
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ');
      }

      if (currentActor.id === id) {
        throw new ForbiddenException('ไม่สามารถลบบัญชีของตัวเองได้');
      }

      if (!this.canManageUser(currentActor, existingUser)) {
        throw new ForbiddenException('ไม่มีสิทธิ์ลบผู้ใช้งานนี้');
      }

      return await this.db.transaction(async (client) => {
        this.logger.log(`Attempting to delete user with ID: ${id}`);
        const result = await client.query('DELETE FROM users WHERE id = $1', [
          id,
        ]);

        if (result.rowCount === 0) {
          throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ');
        }

        this.logger.log(`Delete user result: ${result.rowCount} rows deleted`);
        return { success: true, rowCount: result.rowCount };
      });
    } catch (err) {
      this.logger.error(`deleteUser error: ${err.message}`);
      throw err;
    }
  }

  async getRoles(actor?: ActorContext) {
    const res = await this.db.query('SELECT * FROM roles ORDER BY id');
    if (!actor) {
      return res.rows;
    }

    const actorRole = this.getPrimaryRole({ roles: actor.roles });
    return res.rows.filter((role: { name: string }) => this.canManageRole(actorRole, role.name));
  }

  async validateUser(username: string, password: string) {
    const sql = `
      SELECT u.id, u.username, u.password, u."FirstName", u."LastName", u."PersonID_Onec", u.email, u.affiliation, 
             u.status, u.permissions, u.role, u.data_scope,
             CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END as roles,
             CASE WHEN r.label IS NOT NULL THEN ARRAY[r.label]::text[] ELSE ARRAY[]::text[] END as labels
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
    return this.hydrateUserPermissions(user);
  }

  async hashExistingPasswords() {
    this.logger.log('Starting to hash existing plaintext passwords...');
    
    const result = await this.db.query(`SELECT id, password FROM users WHERE password NOT LIKE '$2%'`);
    
    let updated = 0;
    for (const row of result.rows) {
      const hashedPassword = await this.passwordService.hash(row.password);
      await this.db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, row.id]);
      updated++;
    }
    
    this.logger.log(`Hashed ${updated} passwords`);
    return { updated };
  }
}
