import { Controller, Post, Get, Body, Param, Req, HttpException, HttpStatus } from '@nestjs/common';
import { TaskService } from './task.service';
import type { Request } from 'express';

@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() body: any, @Req() req: Request) {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return await this.taskService.createTask(body, baseUrl);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':token')
  async getTask(@Param('token') token: string) {
    const task = await this.taskService.getTaskByToken(token);
    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    if (task.error) {
    }
    return task;
  }

  @Get(':token/students')
  async getTaskStudents(@Param('token') token: string) {
    return await this.taskService.getTaskStudents(token);
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
}
