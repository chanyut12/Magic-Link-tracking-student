import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('api/task-links')
export class AdminController {
  constructor(private readonly taskService: TaskService) {}

  @Post(':linkId/admin-lock')
  async adminLockLink(
    @Param('linkId') linkId: string,
    @Body('action') action: 'lock' | 'unlock',
    @Body('reason') reason: string,
  ) {
    try {
      if (!['lock', 'unlock'].includes(action)) {
        throw new Error('action must be lock or unlock');
      }
      return await this.taskService.adminLockLink(linkId, action, reason);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
