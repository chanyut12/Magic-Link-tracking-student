import {
  Controller,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import type { Request } from 'express';
import { AuthGuard, PermissionsGuard, RequirePermission } from '../auth';

type RequestWithActor = Request & {
  user?: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
    data_scope?: Record<string, unknown>;
    virtual_login?: boolean;
  };
};

@Controller('api/task-links')
export class AdminController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('login-links')
  @Post(':linkId/admin-lock')
  async adminLockLink(
    @Param('linkId') linkId: string,
    @Body('action') action: 'lock' | 'unlock',
    @Body('reason') reason: string,
    @Req() req: RequestWithActor,
  ) {
    try {
      if (!['lock', 'unlock'].includes(action)) {
        throw new Error('action must be lock or unlock');
      }
      return await this.taskService.adminLockLink(req.user, linkId, action, reason);
    } catch (err) {
      const status =
        typeof err === 'object' &&
        err !== null &&
        'getStatus' in err &&
        typeof err.getStatus === 'function'
          ? (err.getStatus() as HttpStatus)
          : HttpStatus.BAD_REQUEST;
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      throw new HttpException(message, status);
    }
  }
}
