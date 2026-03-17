import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly db: DatabaseService) {}

  async getGradeLevels() {
    try {
      const result = await this.db.query(
        'SELECT id, label, category FROM grade_levels ORDER BY id',
      );
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getGradeLevels error: ${err.message}`);
      throw err;
    }
  }

  async getSchools(province?: string, district?: string, subDistrict?: string) {
    try {
      let query =
        'SELECT id, name, province, district, sub_district FROM schools WHERE 1=1';
      const params: any[] = [];

      if (province) {
        params.push(province);
        query += ` AND province = $${params.length}`;
      }
      if (district) {
        params.push(district);
        query += ` AND district = $${params.length}`;
      }
      if (subDistrict) {
        params.push(subDistrict);
        query += ` AND sub_district = $${params.length}`;
      }

      query += ' ORDER BY name ASC';
      const result = await this.db.query(query, params);
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getSchools error: ${err.message}`);
      throw err;
    }
  }

  async getLocations() {
    try {
      // Get unique provinces
      const provinceRes = await this.db.query(
        'SELECT DISTINCT province FROM schools ORDER BY province ASC',
      );
      // Get unique districts
      const districtRes = await this.db.query(
        'SELECT DISTINCT province, district FROM schools ORDER BY province ASC, district ASC',
      );
      // Get unique sub-districts
      const subDistrictRes = await this.db.query(
        'SELECT DISTINCT province, district, sub_district FROM schools ORDER BY province ASC, district ASC, sub_district ASC',
      );

      return {
        success: true,
        data: {
          provinces: provinceRes.rows.map(
            (r: { province: string }) => r.province,
          ),
          districts: districtRes.rows,
          subDistricts: subDistrictRes.rows,
        },
      };
    } catch (err) {
      this.logger.error(`getLocations error: ${err.message}`);
      throw err;
    }
  }

  async getStudents(grade?: string, room?: string, schoolId?: string) {
    try {
      let query = `
        SELECT 
          s."PersonID_Onec" as id,
          (s."FirstName_Onec" || ' ' || s."LastName_Onec") as name,
          COALESCE(gl.label, 'ไม่ทราบ') as grade,
          s."RoomID_Onec"::text as room,
          (SELECT COUNT(*) FROM attendance a WHERE a."PersonID_Onec" = s."PersonID_Onec" AND a."AttendanceStatus" = 3) as total_late,
          (SELECT COUNT(*) FROM attendance a WHERE a."PersonID_Onec" = s."PersonID_Onec" AND a."AttendanceStatus" = 2) as total_absent
        FROM student_term s
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (grade && grade !== 'ALL') {
        params.push(grade);
        query += ` AND gl.label = $${params.length}`;
      }
      if (room && room !== 'all' && room !== 'ALL') {
        params.push(parseInt(room, 10));
        query += ` AND s."RoomID_Onec" = $${params.length}`;
      }
      if (schoolId) {
        params.push(parseInt(schoolId, 10));
        query += ` AND s."SchoolID_Onec" = $${params.length}`;
      }

      query += ` ORDER BY s."GradeLevelID_Onec" ASC, s."RoomID_Onec" ASC, s."PersonID_Onec" ASC`;

      const result = await this.db.query(query, params);
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getStudents error: ${err.message}`);
      throw err;
    }
  }

  async getHistory(date: string) {
    try {
      const result = await this.db.query(
        `
        SELECT 
          a.*, 
          a."SchoolID_Onec" as school_id,
          (s."FirstName_Onec" || ' ' || s."LastName_Onec") as name,
          COALESCE(gl.label, 'ไม่ทราบ') as grade,
          s."RoomID_Onec"::text as room,
          a."AttendanceStatus" as status
        FROM attendance a
        JOIN student_term s ON s."PersonID_Onec" = a."PersonID_Onec"
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        WHERE a."AttendanceDate" = $1
        ORDER BY s."GradeLevelID_Onec" ASC, s."RoomID_Onec" ASC
      `,
        [date],
      );

      // Map back to frontend expected status strings if needed,
      // but let's keep them as integers or map here
      const mapped = result.rows.map((r: any) => ({
        ...r,
        status:
          r.status === 1
            ? 'P_PRESENT'
            : r.status === 2
              ? 'P_ABSENT'
              : r.status === 3
                ? 'P_LATE'
                : 'NONE',
      }));

      return { success: true, data: mapped };
    } catch (err) {
      this.logger.error(`getHistory error: ${err.message}`);
      throw err;
    }
  }

  async saveAttendance(records: { student_id: string; status: string }[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await this.db.transaction(async (client) => {
        // Only delete existing records for the students in this specific batch for today
        const studentIds = records.map((r) => r.student_id);
        if (studentIds.length > 0) {
          await client.query(
            `
            DELETE FROM attendance 
            WHERE "AttendanceDate" = $1 AND "PersonID_Onec" = ANY($2)
          `,
            [today, studentIds],
          );
        }

        for (const record of records) {
          // Fetch student metadata to satisfy the attendance table constraints
          const studentRes = await client.query(
            `
            SELECT "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", "AcademicYear_Onec", "Semester_Onec"
            FROM student_term 
            WHERE "PersonID_Onec" = $1
          `,
            [record.student_id],
          );

          if (studentRes.rows.length === 0) continue;
          const s = studentRes.rows[0];

          // Map status: P_PRESENT=1, P_ABSENT=2, P_LATE=3
          let statusCode = 1;
          if (record.status === 'P_ABSENT') statusCode = 2;
          else if (record.status === 'P_LATE') statusCode = 3;

          await client.query(
            `
            INSERT INTO attendance (
              "PersonID_Onec", "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", 
              "AcademicYear_Onec", "Semester_Onec", "AttendanceDate", "Period", 
              "AttendanceStatus", "RecordedBy"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
            [
              record.student_id,
              s.SchoolID_Onec,
              s.GradeLevelID_Onec,
              s.RoomID_Onec,
              s.AcademicYear_Onec,
              s.Semester_Onec,
              today,
              1, // Default to Period 1 for now
              statusCode,
              'Admin',
            ],
          );
        }
      });
      return { success: true };
    } catch (err) {
      this.logger.error(`saveAttendance error: ${err.message}`);
      throw err;
    }
  }

  async getAttendanceTasks() {
    try {
      const result = await this.db.query(`
        SELECT 
          t.id as task_id,
          t.task_type,
          t.target_grade,
          t.target_room,
          t.status as task_status,
          t.created_at,
          tl.id as active_link_id,
          tl.magic_link as active_link,
          tl.assigned_to_name as link_assigned_to,
          COALESCE(tl.admin_locked, 0) as active_link_locked,
          tl.admin_lock_reason as active_link_lock_reason,
          tl.admin_lock_at as active_link_lock_at
        FROM tasks t
        LEFT JOIN task_links tl ON tl.task_id = t.id AND tl.status = 'ACTIVE'
        ORDER BY t.created_at DESC
      `);
      return result.rows;
    } catch (err) {
      this.logger.error(`getAttendanceTasks error: ${err.message}`);
      throw err;
    }
  }
  async getRooms(gradeLabel: string, schoolId?: string) {
    try {
      let query = `
        SELECT DISTINCT s."RoomID_Onec"::text as room
        FROM student_term s
        JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        WHERE gl.label = $1
      `;
      const params: any[] = [gradeLabel];

      if (schoolId) {
        params.push(parseInt(schoolId, 10));
        query += ` AND s."SchoolID_Onec" = $${params.length}`;
      }

      query += ` ORDER BY room ASC`;
      const result = await this.db.query(query, params);
      return {
        success: true,
        data: result.rows.map((r: { room: string }) => r.room),
      };
    } catch (err) {
      this.logger.error(`getRooms error: ${err.message}`);
      throw err;
    }
  }
}
