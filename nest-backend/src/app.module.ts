import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TaskModule } from './task/task.module';
import { AttendanceModule } from './attendance/attendance.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule, 
    TaskModule, 
    AttendanceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
