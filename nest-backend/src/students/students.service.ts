import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { DatabaseService } from '../database/database.service';
import { buildDataScopeQuery, DataScope } from '../common/utils/authorization';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly db: DatabaseService) {}

  create(createStudentDto: CreateStudentDto) {
    return 'This action adds a new student';
  }

  async findAll(queryParams?: any, userScope?: DataScope) {
    try {
      let query = `
        SELECT 
          s."PersonID_Onec" as id,
          (s."FirstName_Onec" || ' ' || s."LastName_Onec") as name,
          COALESCE(gl.label, 'ไม่ทราบ') as grade,
          s."RoomID_Onec"::text as room,
          sc.name as school_name,
          sc.id as school_id
        FROM student_term s
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        LEFT JOIN schools sc ON s."SchoolID_Onec" = sc.id
        WHERE 1=1
      `;
      const params: any[] = [];

      // Apply Data Scope Filter
      if (userScope) {
        const scopeRes = buildDataScopeQuery(userScope, {
          school_id: `s."SchoolID_Onec"`,
          grade: `s."GradeLevelID_Onec"`,
          room: `s."RoomID_Onec"::text`,
          province: `sc.province`,
          district: `sc.district`,
          sub_district: `sc.sub_district`,
        }, params.length + 1);

        if (scopeRes.sql !== '1=1') {
          query += ` AND (${scopeRes.sql})`;
          params.push(...scopeRes.params);
        }
      }

      if (queryParams) {
        if (queryParams.grade && queryParams.grade !== 'ALL') {
          params.push(queryParams.grade);
          query += ` AND gl.label = $${params.length}`;
        }
        if (queryParams.room && queryParams.room !== 'all' && queryParams.room !== 'ALL') {
          params.push(parseInt(queryParams.room, 10));
          query += ` AND s."RoomID_Onec" = $${params.length}`;
        }
        if (queryParams.schoolId) {
          params.push(parseInt(queryParams.schoolId, 10));
          query += ` AND s."SchoolID_Onec" = $${params.length}`;
        }
        if (queryParams.searchTerm) {
          params.push(`%${queryParams.searchTerm}%`);
          query += ` AND (s."FirstName_Onec" || ' ' || s."LastName_Onec") ILIKE $${params.length}`;
        }
      }

      query += ` ORDER BY s."SchoolID_Onec" ASC, s."GradeLevelID_Onec" ASC, s."RoomID_Onec" ASC, s."PersonID_Onec" ASC`;

      const result = await this.db.query(query, params);
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`findAll error: ${err.message}`);
      throw err;
    }
  }

  async findOne(id: string) {
    try {
      const query = `
        SELECT 
          s.*,
          gl.label as grade,
          s."RoomID_Onec"::text as room,
          sc.name as school_name
        FROM student_term s
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        LEFT JOIN schools sc ON s."SchoolID_Onec" = sc.id
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
      const error = err as Error;
      this.logger.error(`findOne error: ${error.message}`);
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

      return result.rows as Record<string, any>[];
    } catch (err) {
      const error = err as Error;
      this.logger.error(`findCasesByName error: ${error.message}`);
      throw err;
    }
  }

  async findAttendanceByStudentId(id: string) {
    try {
      const query = `
        SELECT 
          "AttendanceDate" as date,
          "AttendanceStatus" as status,
          "Period" as period
        FROM attendance
        WHERE "PersonID_Onec" = $1
        ORDER BY "AttendanceDate" DESC
      `;
      const result = (await this.db.query(query, [id])) as { rows: any[] };
      return result.rows as Record<string, any>[];
    } catch (err) {
      const error = err as Error;
      this.logger.error(`findAttendanceByStudentId error: ${error.message}`);
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
