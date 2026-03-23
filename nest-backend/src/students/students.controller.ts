import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';

import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { parseScopeHeader } from '../common/utils/authorization';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll(@Query() query: any, @Headers('x-user-scope') scopeHeader?: string) {
    const userScope = parseScopeHeader(scopeHeader);
    return this.studentsService.findAll(query, userScope);
  }

  @Get('cases/by-name/:name')
  findCasesByName(@Param('name') name: string) {
    return this.studentsService.findCasesByName(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get('attendance/:id')
  findAttendanceByStudentId(@Param('id') id: string) {
    return this.studentsService.findAttendanceByStudentId(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }
}
