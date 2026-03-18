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
} from '@nestjs/common';
import { TaskService } from './task.service';
import type { Request } from 'express';

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

  @Post()
  async createTask(@Body() body: any, @Req() req: Request) {
    try {
      const baseUrl = this.resolveBaseUrl(req);
      return await this.taskService.createTask(body, baseUrl);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('login-links')
  async getLoginLinks() {
    return await this.taskService.getLoginLinks();
  }

  @Get(':token')
  async getTask(@Param('token') token: string) {
    const task = await this.taskService.getTaskByToken(token);
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
