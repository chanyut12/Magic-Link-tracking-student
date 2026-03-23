import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY } from './permissions.decorator';
import { hasPermission } from './permissions.constants';
import { DatabaseService } from '../database/database.service';
import { hashToken } from '../common/utils/helpers';
import * as crypto from 'crypto';

interface RequestWithUser {
  user?: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
    data_scope?: Record<string, unknown>;
    virtual_login?: boolean;
  };
  headers: Record<string, string>;
  session?: Record<string, unknown>;
}

function resolvePermissions(
  roles: string[],
  permissions: unknown,
  defaultPermissions: unknown,
): string[] {
  void roles;
  const storedPermissions = Array.isArray(permissions)
    ? permissions.filter(
        (permission): permission is string =>
          typeof permission === 'string' && permission.trim().length > 0,
      )
    : [];

  if (storedPermissions.length > 0) {
    return Array.from(new Set(storedPermissions));
  }

  return Array.from(
    new Set(
      Array.isArray(defaultPermissions)
        ? defaultPermissions.filter(
            (permission): permission is string =>
              typeof permission === 'string' && permission.trim().length > 0,
          )
        : [],
    ),
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    
    const userId = this.extractUserId(request);
    const magicLinkToken = request.headers['x-magic-link-token'];
    const magicSessionToken = request.headers['x-magic-session'];

    const user = userId
      ? await this.loadUser(userId)
      : magicLinkToken
        ? await this.loadMagicLinkUser(magicLinkToken, magicSessionToken)
        : null;
    if (!user) {
      throw new UnauthorizedException('ไม่ได้เข้าสู่ระบบ');
    }

    request.user = user;
    return true;
  }

  private extractUserId(request: RequestWithUser): number | null {
    if (request.session?.['userId']) {
      return request.session['userId'] as number;
    }
    
    const userIdHeader = request.headers['x-user-id'];
    if (userIdHeader) {
      return parseInt(userIdHeader, 10);
    }
    
    return null;
  }

  private async loadUser(userId: number): Promise<RequestWithUser['user'] | null> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          u.id, 
          u.username,
          CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END as roles,
          u.permissions,
          u.data_scope,
          r.default_permissions AS role_default_permissions
        FROM users u
        LEFT JOIN roles r ON r.name = u.role
        WHERE u.id = $1 AND u.status = 'ACTIVE'`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const roles = Array.isArray(row.roles) ? row.roles : [];
      return {
        id: row.id,
        username: row.username,
        roles,
        permissions: resolvePermissions(roles, row.permissions, row.role_default_permissions),
        data_scope: row.data_scope,
      };
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  private isMagicSessionVerified(linkId: string, sessionToken?: string): boolean {
    if (!sessionToken) {
      return false;
    }

    try {
      const [base64Payload, signature] = sessionToken.split('.');
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const expectedSign = crypto
        .createHmac('sha256', 'SECRET_STS_KEY')
        .update(payload)
        .digest('hex');

      if (expectedSign !== signature) {
        return false;
      }

      const data = JSON.parse(payload);
      return data.link_id === linkId && data.verified === true;
    } catch {
      return false;
    }
  }

  private buildVirtualUserId(linkId: string): number {
    const parsed = parseInt(hashToken(linkId).slice(0, 8), 16);
    return Number.isFinite(parsed) && parsed > 0 ? -parsed : -1;
  }

  private async loadMagicLinkUser(
    rawToken: string,
    sessionToken?: string,
  ): Promise<RequestWithUser['user'] | null> {
    try {
      const tokenHash = hashToken(rawToken);
      const result = await this.databaseService.query(
        `SELECT
          tl.id,
          tl.assigned_to_email,
          tl.login_role,
          tl.login_permissions,
          r.default_permissions AS role_default_permissions,
          tl.login_data_scope,
          tl.otp_verified,
          tl.expires_at,
          tl.admin_locked,
          tl.status,
          t.task_type
        FROM task_links tl
        JOIN tasks t ON t.id = tl.task_id
        LEFT JOIN roles r ON r.name = tl.login_role
        WHERE tl.token_hash = $1`,
        [tokenHash],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      if (row.task_type !== 'LOGIN') return null;
      if (row.admin_locked) return null;
      if (row.status !== 'ACTIVE') return null;
      if (new Date(row.expires_at) < new Date()) return null;

      const hasEmailForOtp =
        typeof row.assigned_to_email === 'string' &&
        row.assigned_to_email.trim().length > 0;
      if (hasEmailForOtp && !row.otp_verified && !this.isMagicSessionVerified(row.id, sessionToken)) {
        return null;
      }

      const role =
        typeof row.login_role === 'string' && row.login_role.trim().length > 0
          ? row.login_role.trim()
          : 'TEACHER';
      const permissions = resolvePermissions([role], row.login_permissions, row.role_default_permissions);

      return {
        id: this.buildVirtualUserId(row.id),
        username: row.assigned_to_email || `magic-link-${row.id}`,
        roles: [role],
        permissions,
        data_scope: row.login_data_scope || {},
        virtual_login: true,
      };
    } catch (error) {
      console.error('Error loading magic-link user:', error);
      return null;
    }
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('ไม่ได้เข้าสู่ระบบ');
    }

    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(user.roles, user.permissions, permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึง');
    }

    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('ไม่ได้เข้าสู่ระบบ');
    }

    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึง');
    }

    return true;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    
    const userId = request.session?.['userId'] as number | undefined || 
                   parseInt(request.headers['x-user-id'] || '', 10) || null;

    if (userId) {
      const user = await this.loadUser(userId, this.databaseService);
      if (user) {
        request.user = user;
      }
      return true;
    }

    const magicLinkToken = request.headers['x-magic-link-token'];
    if (magicLinkToken) {
      const user = await this.loadMagicLinkUser(
        magicLinkToken,
        this.databaseService,
        request.headers['x-magic-session'],
      );
      if (user) {
        request.user = user;
      }
    }

    return true;
  }

  private async loadUser(userId: number, db: DatabaseService): Promise<RequestWithUser['user'] | null> {
    try {
      const result = await db.query(
        `SELECT 
          u.id, 
          u.username,
          CASE WHEN u.role IS NOT NULL THEN ARRAY[u.role]::text[] ELSE ARRAY[]::text[] END as roles,
          u.permissions,
          u.data_scope,
          r.default_permissions AS role_default_permissions
        FROM users u
        LEFT JOIN roles r ON r.name = u.role
        WHERE u.id = $1 AND u.status = 'ACTIVE'`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const roles = Array.isArray(row.roles) ? row.roles : [];
      return {
        id: row.id,
        username: row.username,
        roles,
        permissions: resolvePermissions(roles, row.permissions, row.role_default_permissions),
        data_scope: row.data_scope,
      };
    } catch {
      return null;
    }
  }

  private isMagicSessionVerified(linkId: string, sessionToken?: string): boolean {
    if (!sessionToken) {
      return false;
    }

    try {
      const [base64Payload, signature] = sessionToken.split('.');
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const expectedSign = crypto
        .createHmac('sha256', 'SECRET_STS_KEY')
        .update(payload)
        .digest('hex');

      if (expectedSign !== signature) {
        return false;
      }

      const data = JSON.parse(payload);
      return data.link_id === linkId && data.verified === true;
    } catch {
      return false;
    }
  }

  private buildVirtualUserId(linkId: string): number {
    const parsed = parseInt(hashToken(linkId).slice(0, 8), 16);
    return Number.isFinite(parsed) && parsed > 0 ? -parsed : -1;
  }

  private async loadMagicLinkUser(
    rawToken: string,
    db: DatabaseService,
    sessionToken?: string,
  ): Promise<RequestWithUser['user'] | null> {
    try {
      const tokenHash = hashToken(rawToken);
      const result = await db.query(
        `SELECT
          tl.id,
          tl.assigned_to_email,
          tl.login_role,
          tl.login_permissions,
          r.default_permissions AS role_default_permissions,
          tl.login_data_scope,
          tl.otp_verified,
          tl.expires_at,
          tl.admin_locked,
          tl.status,
          t.task_type
        FROM task_links tl
        JOIN tasks t ON t.id = tl.task_id
        LEFT JOIN roles r ON r.name = tl.login_role
        WHERE tl.token_hash = $1`,
        [tokenHash],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      if (row.task_type !== 'LOGIN') return null;
      if (row.admin_locked) return null;
      if (row.status !== 'ACTIVE') return null;
      if (new Date(row.expires_at) < new Date()) return null;

      const hasEmailForOtp =
        typeof row.assigned_to_email === 'string' &&
        row.assigned_to_email.trim().length > 0;
      if (hasEmailForOtp && !row.otp_verified && !this.isMagicSessionVerified(row.id, sessionToken)) {
        return null;
      }

      const role =
        typeof row.login_role === 'string' && row.login_role.trim().length > 0
          ? row.login_role.trim()
          : 'TEACHER';
      const permissions = resolvePermissions([role], row.login_permissions, row.role_default_permissions);

      return {
        id: this.buildVirtualUserId(row.id),
        username: row.assigned_to_email || `magic-link-${row.id}`,
        roles: [role],
        permissions,
        data_scope: row.login_data_scope || {},
        virtual_login: true,
      };
    } catch {
      return null;
    }
  }
}
