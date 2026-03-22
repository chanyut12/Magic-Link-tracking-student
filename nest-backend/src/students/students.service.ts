import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly db: DatabaseService) {}

  create(createStudentDto: CreateStudentDto) {
    return 'This action adds a new student';
  }

  findAll() {
    return `This action returns all students`;
  }

  async findOne(id: string) {
    try {
      const query = `
        SELECT 
          s.*,
          gl.label as grade,
          s."RoomID_Onec"::text as room
        FROM student_term s
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        WHERE s."PersonID_Onec" = $1
      `;
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`findOne error: ${err.message}`);
      throw err;
    }
  }

  async findCasesByName(name: string) {
    try {
      const query = `
        SELECT *
        FROM cases
        WHERE student_name = $1
      `;
      const result = await this.db.query(query, [name]);

      return result.rows;
    } catch (err) {
      this.logger.error(`findCasesByName error: ${err.message}`);
      throw err;
    }
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }

  remove(id: number) {
    return `This action removes a #${id} student`;
  }
}
