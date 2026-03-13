import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('grade-levels')
  async getGradeLevels() {
    return await this.attendanceService.getGradeLevels();
  }

  @Get('schools')
  async getSchools(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('subDistrict') subDistrict?: string
  ) {
    return await this.attendanceService.getSchools(province, district, subDistrict);
  }

  @Get('locations')
  async getLocations() {
    return await this.attendanceService.getLocations();
  }

  @Get('students')
  async getStudents(
    @Query('grade') grade?: string,
    @Query('room') room?: string,
    @Query('schoolId') schoolId?: string
  ) {
    return await this.attendanceService.getStudents(grade, room, schoolId);
  }

  @Get('history')
  async getHistory(@Query('date') date: string) {
    if (!date) {
      throw new HttpException('Date is required', HttpStatus.BAD_REQUEST);
    }
    return await this.attendanceService.getHistory(date);
  }

  @Post()
  async saveAttendance(@Body() body: { records: { student_id: string; status: string }[] }) {
    if (!body.records || !Array.isArray(body.records)) {
      throw new HttpException('Invalid records', HttpStatus.BAD_REQUEST);
    }
    return await this.attendanceService.saveAttendance(body.records);
  }

  @Get('tasks')
  async getAttendanceTasks() {
    return await this.attendanceService.getAttendanceTasks();
  }

  @Get('rooms')
  async getRooms(
    @Query('grade') grade: string,
    @Query('schoolId') schoolId?: string
  ) {
    if (!grade) {
      throw new HttpException('Grade is required', HttpStatus.BAD_REQUEST);
    }
    return await this.attendanceService.getRooms(grade, schoolId);
  }
}
