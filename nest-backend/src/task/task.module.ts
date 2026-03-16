import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AdminController } from './admin.controller';
import { StatsController } from './stats.controller';
import { DelegationController } from './delegation.controller';
import { DelegationService } from './delegation.service';
import { SubmissionController } from './submission.controller';
import { EmailService } from './email.service';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';

@Module({
  controllers: [
    TaskController,
    AdminController,
    StatsController,
    DelegationController,
    SubmissionController,
    CaseController,
  ],
  providers: [TaskService, DelegationService, EmailService, CaseService],
  exports: [TaskService, DelegationService, EmailService, CaseService],
})
export class TaskModule {}
