import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AdminController } from './admin.controller';
import { StatsController } from './stats.controller';

@Module({
  controllers: [TaskController, AdminController, StatsController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
