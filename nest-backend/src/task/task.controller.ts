import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
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

@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  private resolveBaseUrl(req: Request): string {
    const envBase = process.env.FRONTEND_BASE_URL;
    if (envBase) return envBase;

    const origin = req.get('origin');
    if (origin) return origin;

    const xfProto = req.get('x-forwarded-proto');
    const xfHost = req.get('x-forwarded-host');
    if (xfHost) return `${xfProto || req.protocol}://${xfHost}`;

    return `${req.protocol}://${req.get('host')}`;
  }

  private resolveStatusCode(err: unknown, fallbackStatus: HttpStatus): HttpStatus {
    if (typeof err === 'object' && err !== null && 'getStatus' in err && typeof err.getStatus === 'function') {
      return err.getStatus() as HttpStatus;
    }

    return fallbackStatus;
  }

  @UseGuards(AuthGuard)
  @Post()
  async createTask(@Body() body: any, @Req() req: RequestWithActor) {
    try {
      const baseUrl = this.resolveBaseUrl(req);
      return await this.taskService.createTask(req.user, body, baseUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      throw new HttpException(
        message,
        this.resolveStatusCode(err, HttpStatus.BAD_REQUEST),
      );
    }
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('login-links')
  @Get('login-links')
  async getLoginLinks(@Req() req: RequestWithActor) {
    return await this.taskService.getLoginLinks(req.user);
  }

  @Get(':token')
  async getTask(@Param('token') token: string, @Req() req: Request) {
    const sessionToken = req.headers['x-magic-session'] as string;
    const task = await this.taskService.getTaskByToken(token, sessionToken);
    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    if (task.error && task.status === 'EXPIRED') {
      throw new HttpException(
        { error: task.error, status: 'EXPIRED' },
        HttpStatus.GONE,
      );
    }
    return task;
  }

  @Get(':token/students')
  async getTaskStudents(@Param('token') token: string) {
    return await this.taskService.getTaskStudents(token);
  }

  @Get(':token/login-verify')
  async verifyMagicLogin(@Param('token') token: string, @Req() req: Request) {
    try {
      const sessionToken = req.headers['x-magic-session'] as string;
      return await this.taskService.verifyMagicLogin(token, sessionToken);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get(':token/history')
  async getTaskHistory(
    @Param('token') token: string,
    @Query('date') date: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return await this.taskService.getTaskHistory(token, targetDate);
  }

  @Get(':taskId/chain')
  async getTaskChain(@Param('taskId') taskId: string) {
    const result = await this.taskService.getTaskChain(taskId);
    if (!result) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Post(':token/attendance')
  async saveTaskAttendance(@Param('token') token: string, @Body() body: any) {
    return await this.taskService.saveTaskAttendance(token, body.records);
  }

  @Post(':token/submission')
  async saveTaskSubmission(@Param('token') token: string, @Body() body: any) {
    return await this.taskService.saveTaskSubmission(token, body);
  }

  @Post(':token/otp')
  async requestOtp(@Param('token') token: string) {
    return await this.taskService.requestOtp(token);
  }

  @Post(':token/verify')
  async verifyOtp(@Param('token') token: string, @Body('otp') otp: string) {
    return await this.taskService.verifyOtp(token, otp);
  }

  @Post(':taskId/delete') // Wait, using @Delete is better standard
  @Post('delete/:taskId') // Wait, let's just do standard @Delete
  @Delete(':taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return await this.taskService.deleteTask(taskId);
  }
}
