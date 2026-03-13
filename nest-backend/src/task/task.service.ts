import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';
import { hashToken, generateToken, clean } from '../common/utils/helpers';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly db: DatabaseService) {}

  async createTask(data: any, baseUrl: string) {
    const taskType = data.task_type || 'VISIT';
    const assignedName = clean(data.assigned_to_name);

    if (!assignedName) {
      throw new Error('assigned_to_name is required');
    }

    const taskId = uuidv4();
    const token = generateToken();
    const tokenHash = hashToken(token);
    const linkId = uuidv4();
    
    let expiresHours = parseInt(data.expires_value, 10) || 24;
    const expiresUnit = data.expires_unit || 'hours';

    if (expiresUnit === 'days') expiresHours *= 24;
    else if (expiresUnit === 'weeks') expiresHours *= 168;

    if (taskType === 'ATTENDANCE') {
      expiresHours = Math.max(expiresHours, 1); // Ensure at least 1 hour for attendance
    }
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
    const magicLink = `${baseUrl}/#/task/${token}`;

    try {
      await this.db.transaction(async (client) => {
        let caseId: number | null = null;

        if (taskType === 'VISIT') {
          const studentName = clean(data.student_name);
          if (!studentName) throw new Error('student_name is required for Field Visit');

          const caseResult = await client.query(`
            INSERT INTO cases (student_name, student_school, student_address, student_lat, student_lng, reason_flagged)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [
            studentName, 
            clean(data.student_school), 
            clean(data.student_address), 
            parseFloat(data.student_lat) || null, 
            parseFloat(data.student_lng) || null, 
            clean(data.reason_flagged)
          ]);
          caseId = caseResult.rows[0].id;
          await client.query(`UPDATE cases SET status = 'IN_PROGRESS' WHERE id = $1`, [caseId]);
        }

        await client.query(`
          INSERT INTO tasks (id, case_id, task_type, target_grade, target_room, status)
          VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS')
        `, [
          taskId,
          caseId,
          taskType,
          clean(data.target_grade) || null,
          clean(data.target_room) || null
        ]);

        await client.query(`
          INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, assigned_to_email, expires_at, subject)
          VALUES ($1, $2, NULL, $3, $4, 0, $5, $6, $7, $8, $9)
        `, [
          linkId, 
          taskId, 
          tokenHash, 
          magicLink, 
          assignedName, 
          clean(data.assigned_to_phone), 
          clean(data.assigned_to_email), 
          expiresAt, 
          clean(data.subject)
        ]);
      });

      return {
        task_id: taskId,
        magic_link: magicLink,
        expires_at: expiresAt
      };
    } catch (err) {
      this.logger.error(`createTask error: ${err.message}`);
      throw err;
    }
  }

  async getTaskByToken(token: string) {
    const tokenHash = hashToken(token);

    const resultLink = await this.db.query(`
      SELECT tl.*, t.task_type, t.target_grade, t.target_room, t.status as task_status
      FROM task_links tl
      JOIN tasks t ON t.id = tl.task_id
      WHERE tl.token_hash = $1
    `, [tokenHash]);

    const link = resultLink.rows[0];
    if (!link) return null;

    if (new Date(link.expires_at) < new Date()) {
      return { error: 'Link expired', status: 'EXPIRED' };
    }

    const result: any = {
      task_id: link.task_id,
      link_id: link.id,
      task_type: link.task_type,
      target_grade: link.target_grade,
      target_room: link.target_room,
      assigned_to_name: link.assigned_to_name,
      expires_at: link.expires_at,
      subject: link.subject
    };

    if (link.task_type === 'VISIT') {
      const caseResult = await this.db.query(`
        SELECT c.* FROM cases c
        JOIN tasks t ON t.case_id = c.id
        WHERE t.id = $1
      `, [link.task_id]);
      const caseData = caseResult.rows[0];
      
      if (caseData) {
        result.student_name = caseData.student_name;
        result.student_school = caseData.student_school;
        result.student_address = caseData.student_address;
      }
    }
    return result;
  }

  async getTaskStudents(token: string) {
    try {
      const task = await this.getTaskByToken(token);
      if (!task || task.status === 'EXPIRED') {
        throw new Error('Task not found or expired');
      }

      let query = `
        SELECT 
          s."PersonID_Onec" as id,
          (s."FirstName_Onec" || ' ' || s."LastName_Onec") as name,
          COALESCE(gl.label, 'ไม่ทราบ') as grade,
          s."RoomID_Onec"::text as room
        FROM student_term s
        LEFT JOIN grade_levels gl ON s."GradeLevelID_Onec" = gl.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (task.target_grade) {
        params.push(task.target_grade);
        query += ` AND gl.label = $${params.length}`;
      }
      if (task.target_room) {
        params.push(parseInt(task.target_room, 10));
        query += ` AND s."RoomID_Onec" = $${params.length}`;
      }

      const result = await this.db.query(query, params);
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getTaskStudents error: ${err.message}`);
      throw err;
    }
  }

  async saveTaskAttendance(token: string, records: any[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await this.db.transaction(async (client) => {
        for (const record of records) {
          // Fetch student metadata to satisfy new schema
          const studentRes = await client.query(`
            SELECT "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", "Semester_Onec", "AcademicYear_Onec"
            FROM student_term WHERE "PersonID_Onec" = $1
          `, [record.student_id]);
          const s = studentRes.rows[0];

          if (s) {
            // Check if already exists for today to avoid duplicates
            await client.query(`
              DELETE FROM attendance 
              WHERE "AttendanceDate" = $1 AND "PersonID_Onec" = $2
            `, [today, record.student_id]);

            await client.query(`
              INSERT INTO attendance (
                "PersonID_Onec", "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", 
                "AttendanceDate", "Semester_Onec", "AcademicYear_Onec", "AttendanceStatus",
                "Period", "RecordedBy"
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              record.student_id, s.SchoolID_Onec, s.GradeLevelID_Onec, s.RoomID_Onec, 
              today, s.Semester_Onec, s.AcademicYear_Onec, 
              record.status === 'P_PRESENT' ? 1 : record.status === 'P_ABSENT' ? 2 : 3,
              1, // Default to Period 1 for demo
              'Teacher (Magic Link)'
            ]);
          }
        }
      });
      return { success: true };
    } catch (err) {
      this.logger.error(`saveTaskAttendance error: ${err.message}`);
      throw err;
    }
  }

  async saveTaskSubmission(token: string, data: any) {
    try {
      const task = await this.getTaskByToken(token);
      if (!task || task.status === 'EXPIRED') {
        throw new Error('Task not found or expired');
      }

      await this.db.transaction(async (client) => {
        // Record submission
        await client.query(`
          INSERT INTO task_submissions (task_id, link_id, submission_data, submitted_by)
          VALUES ($1, $2, $3, $4)
        `, [task.task_id, task.link_id, JSON.stringify(data), task.assigned_to_name]);

        // Update task and case status if it's a VISIT
        if (task.task_type === 'VISIT') {
          const caseIdRes = await client.query(`SELECT case_id FROM tasks WHERE id = $1`, [task.task_id]);
          const caseId = caseIdRes.rows[0]?.case_id;
          
          if (caseId) {
            const finalStatus = data.status === 'COMPLETED' ? 'RESOLVED' : 'IN_PROGRESS';
            await client.query(`UPDATE cases SET status = $1, result_summary = $2 WHERE id = $3`, [
              finalStatus,
              data.notes || 'No notes provided',
              caseId
            ]);
          }
        }

        // Mark task as done if completed
        if (data.status === 'COMPLETED') {
          await client.query(`UPDATE tasks SET status = 'DONE' WHERE id = $1`, [task.task_id]);
        }
      });

      return { success: true };
    } catch (err) {
      this.logger.error(`saveTaskSubmission error: ${err.message}`);
      throw err;
    }
  }

  async requestOtp(token: string) {
    const otp = '123456';
    this.logger.log(`[MOCK OTP] Token: ${token}, OTP: ${otp}`);
    return { success: true, message: 'OTP sent (check server logs)' };
  }

  async verifyOtp(token: string, otp: string) {
    if (otp === '123456') {
      return { success: true };
    }
    return { success: false, error: 'Invalid OTP' };
  }

  async adminLockLink(linkId: string, action: 'lock' | 'unlock', reason?: string) {
    try {
      const res = await this.db.query(`SELECT * FROM task_links WHERE id = $1`, [linkId]);
      const link = res.rows[0];
      if (!link) throw new Error('Link not found');
      if (link.status !== 'ACTIVE') throw new Error('Only ACTIVE links can be changed by admin');
      
      if (action === 'lock') {
        if (!reason) throw new Error('reason is required when locking link');
        await this.db.query(`
          UPDATE task_links
          SET admin_locked = 1, admin_lock_reason = $1, admin_lock_at = $2
          WHERE id = $3
        `, [reason, new Date().toISOString(), linkId]);
        return { message: 'Link locked by admin', link_id: linkId, admin_locked: 1 };
      } else {
        await this.db.query(`
          UPDATE task_links
          SET admin_locked = 0, admin_lock_reason = NULL, admin_lock_at = NULL
          WHERE id = $1
        `, [linkId]);
        return { message: 'Link unlocked by admin', link_id: linkId, admin_locked: 0 };
      }
    } catch (err) {
      this.logger.error(`adminLockLink error: ${err.message}`);
      throw err;
    }
  }

  async getCases() {
    try {
      const result = await this.db.query(`SELECT * FROM cases ORDER BY created_at DESC`);
      return result.rows;
    } catch (err) {
      this.logger.error(`getCases error: ${err.message}`);
      throw err;
    }
  }

  async getStats() {
    try {
      const totalRes = await this.db.query(`SELECT count(*) FROM cases`);
      const inProgressRes = await this.db.query(`SELECT count(*) FROM cases WHERE status = 'IN_PROGRESS'`);
      const resolvedRes = await this.db.query(`SELECT count(*) FROM cases WHERE status = 'RESOLVED'`);
      const activeLinksRes = await this.db.query(`SELECT count(*) FROM task_links WHERE status = 'ACTIVE' AND expires_at > NOW()`);
      
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await this.db.query(`SELECT count(*) FROM cases WHERE created_at::date = $1`, [today]);

      return {
        total: parseInt(totalRes.rows[0].count, 10),
        inProgress: parseInt(inProgressRes.rows[0].count, 10),
        resolved: parseInt(resolvedRes.rows[0].count, 10),
        today: parseInt(todayRes.rows[0].count, 10),
        pendingReview: 0,
        activeLinks: parseInt(activeLinksRes.rows[0].count, 10),
        delegations: 0
      };
    } catch (err) {
      this.logger.error(`getStats error: ${err.message}`);
      throw err;
    }
  }

  async getOverviewStats() {
    try {
      // 1. Total Students (from student_term)
      const totalRes = await this.db.query(`SELECT count(*) FROM student_term`);
      
      // 2. Dropout Students (from student_dropouts)
      const dropoutRes = await this.db.query(`SELECT count(*) FROM student_dropouts`);
      
      // 3. At-risk (Mock for now or based on some criteria, let's say 4% of total)
      const totalCount = parseInt(totalRes.rows[0].count, 10);
      const atRiskCount = 0; // Set to 0 as requested, criteria pending

      // 4. Help Case Statuses (from cases table)
      const waitingRes = await this.db.query(`SELECT count(*) FROM cases WHERE status = 'OPEN'`);
      const inProgressRes = await this.db.query(`SELECT count(*) FROM cases WHERE status = 'IN_PROGRESS'`);
      const resolvedRes = await this.db.query(`SELECT count(*) FROM cases WHERE status = 'RESOLVED'`);

      return {
        success: true,
        data: {
          totalStudents: totalCount,
          dropoutStudents: parseInt(dropoutRes.rows[0].count, 10),
          atRiskStudents: atRiskCount,
          helpStats: {
            waiting: parseInt(waitingRes.rows[0].count, 10),
            inProgress: parseInt(inProgressRes.rows[0].count, 10),
            resolved: parseInt(resolvedRes.rows[0].count, 10)
          }
        }
      };
    } catch (err) {
      this.logger.error(`getOverviewStats error: ${err.message}`);
      throw err;
    }
  }
}
