import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';
import { hashToken, generateToken, clean } from '../common/utils/helpers';
import * as QRCode from 'qrcode';
import { EmailService } from './email.service';

function maskName(name: string | null | undefined): string {
  if (!name) return '-';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p[0] + '*';
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1];
    })
    .join(' ');
}

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async createTask(data: any, baseUrl: string) {
    const taskType = data.task_type || 'VISIT';
    const assignedName = clean(data.assigned_to_name);
    const assignedEmail = clean(data.assigned_to_email);

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
    const expiresAt = new Date(
      Date.now() + expiresHours * 60 * 60 * 1000,
    ).toISOString();
    const magicLink = `${baseUrl}/#/task/${token}`;

    try {
      await this.db.transaction(async (client) => {
        let caseId: number | null = null;

        if (taskType === 'VISIT') {
          const existingCaseId = data.existing_case_id
            ? Number(data.existing_case_id)
            : null;

          if (existingCaseId) {
            const caseCheck = await client.query(
              `SELECT id FROM cases WHERE id = $1 LIMIT 1`,
              [existingCaseId],
            );
            if (!caseCheck.rows[0]) throw new Error('Case not found');
            caseId = existingCaseId;
            await client.query(
              `UPDATE cases SET status = 'IN_PROGRESS' WHERE id = $1`,
              [caseId],
            );
          } else {
            const studentName = clean(data.student_name);
            if (!studentName)
              throw new Error('student_name is required for Field Visit');

            const caseResult = await client.query(
              `
              INSERT INTO cases (student_name, student_school, student_address, student_lat, student_lng, reason_flagged)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `,
              [
                studentName,
                clean(data.student_school),
                clean(data.student_address),
                parseFloat(data.student_lat) || null,
                parseFloat(data.student_lng) || null,
                clean(data.reason_flagged),
              ],
            );
            caseId = caseResult.rows[0].id;
            await client.query(
              `UPDATE cases SET status = 'IN_PROGRESS' WHERE id = $1`,
              [caseId],
            );
          }
        }

        await client.query(
          `
          INSERT INTO tasks (id, case_id, task_type, target_grade, target_room, status, target_school_id)
          VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', $6)
        `,
          [
            taskId,
            caseId,
            taskType,
            clean(data.target_grade) || null,
            clean(data.target_room) || null,
            data.target_school_id ? parseInt(data.target_school_id, 10) : null,
          ],
        );

        await client.query(
          `
          INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, assigned_to_email, expires_at, subject, otp_verified)
          VALUES ($1, $2, NULL, $3, $4, 0, $5, $6, $7, $8, $9, $10)
        `,
          [
            linkId,
            taskId,
            tokenHash,
            magicLink,
            assignedName,
            clean(data.assigned_to_phone),
            assignedEmail,
            expiresAt,
            clean(data.subject),
            assignedEmail ? 0 : 1,
          ],
        );
      });

      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await QRCode.toDataURL(magicLink, {
          width: 300,
          margin: 2,
        });
      } catch (err) {
        this.logger.warn('Failed to generate QR code', err);
      }

      return {
        task_id: taskId,
        magic_link: magicLink,
        qr_code_data: qrDataUrl,
        expires_at: expiresAt,
      };
    } catch (err) {
      this.logger.error(`createTask error: ${err.message}`);
      throw err;
    }
  }

  async getTaskByToken(token: string) {
    const tokenHash = hashToken(token);

    const resultLink = await this.db.query(
      `
      SELECT tl.*, t.task_type, t.target_grade, t.target_room, t.target_school_id, t.status as task_status, t.max_delegation_depth,
             s.name as school_name
      FROM task_links tl
      JOIN tasks t ON t.id = tl.task_id
      LEFT JOIN schools s ON s.id = t.target_school_id
      WHERE tl.token_hash = $1
    `,
      [tokenHash],
    );

    const link = resultLink.rows[0];
    if (!link) return null;

    if (new Date(link.expires_at) < new Date()) {
      return { error: 'Link expired', status: 'EXPIRED' };
    }

    if (link.admin_locked) {
      return {
        error: 'Link is disabled by admin',
        status: 'ADMIN_LOCKED',
        reason: link.admin_lock_reason || null,
      };
    }

    if (link.status === 'COMPLETED' && link.task_type !== 'ATTENDANCE') {
      return { error: 'Task already completed', status: 'COMPLETED' };
    }

    if (link.status === 'DELEGATED') {
      return { error: 'Task already delegated', status: 'DELEGATED' };
    }

    const canDelegate =
      link.delegation_depth < link.max_delegation_depth &&
      link.status === 'ACTIVE' &&
      !link.admin_locked;

    const result: any = {
      task_id: link.task_id,
      link_id: link.id,
      type: link.task_type,
      task_type: link.task_type,
      target_grade: link.target_grade,
      target_room: link.target_room,
      target_school_id: link.target_school_id,
      assigned_to_name: link.assigned_to_name,
      delegation_depth: link.delegation_depth,
      max_delegation_depth: link.max_delegation_depth,
      can_delegate: canDelegate,
      expires_at: link.expires_at,
      subject: link.subject,
      school_name: link.school_name,
    };

    const hasEmailForOtp =
      typeof link.assigned_to_email === 'string' &&
      link.assigned_to_email.trim().length > 0;

    result.auth_required = !!(hasEmailForOtp && !link.otp_verified);

    if (link.task_type === 'VISIT') {
      const caseResult = await this.db.query(
        `
        SELECT c.* FROM cases c
        JOIN tasks t ON t.case_id = c.id
        WHERE t.id = $1
      `,
        [link.task_id],
      );
      const caseData = caseResult.rows[0];

      if (result.auth_required) {
        result.student_name = maskName(caseData?.student_name);
        result.student_school = maskName(caseData?.student_school);
        result.student_address = '*** (กรุณายืนยันตัวตน) ***';
        result.reason_flagged = '*** (กรุณายืนยันตัวตน) ***';
        result.student_lat = null;
        result.student_lng = null;
      } else {
        result.student_name = caseData?.student_name || null;
        result.student_school = caseData?.student_school || null;
        result.student_address = caseData?.student_address || null;
        result.student_lat = caseData?.student_lat || null;
        result.student_lng = caseData?.student_lng || null;
        result.reason_flagged = caseData?.reason_flagged || null;
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
        SELECT DISTINCT ON (s."PersonID_Onec")
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

      if ('target_school_id' in task && task.target_school_id) {
        params.push(task.target_school_id);
        query += ` AND s."SchoolID_Onec" = $${params.length}`;
      }

      query += ` ORDER BY s."PersonID_Onec" ASC`;
      
      const result = await this.db.query(query, params);
      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getTaskStudents error: ${err.message}`);
      throw err;
    }
  }

  async getTaskHistory(token: string, date: string) {
    try {
      const task = await this.getTaskByToken(token);
      if (!task || task.status === 'EXPIRED') {
        throw new Error('Task not found or expired');
      }

      const result = await this.db.query(
        `
        SELECT DISTINCT ON (a."PersonID_Onec")
          a."PersonID_Onec" as student_id,
          (s."FirstName_Onec" || ' ' || s."LastName_Onec") as student_name,
          a."AttendanceStatus" as status
        FROM attendance a
        JOIN student_term s ON s."PersonID_Onec" = a."PersonID_Onec"
        WHERE a."AttendanceDate" = $1
          AND s."GradeLevelID_Onec" = (SELECT id FROM grade_levels WHERE label = $2)
          AND s."RoomID_Onec" = $3
          AND a."Period" = 1
          AND s."SchoolID_Onec" = $4
        ORDER BY a."PersonID_Onec" ASC
      `,
        [date, task.target_grade, parseInt(task.target_room || '0', 10), task.target_school_id],
      );

      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getTaskHistory error: ${err.message}`);
      throw err;
    }
  }

  async getTaskChain(taskId: string) {
    try {
      const taskResult = await this.db.query(
        `
        SELECT t.*, 
          c.student_name, c.student_school, c.student_address, 
          c.reason_flagged, c.status as case_status, c.result_summary
        FROM tasks t
        LEFT JOIN cases c ON c.id = t.case_id
        WHERE t.id = $1
      `,
        [taskId],
      );

      const task = taskResult.rows[0];
      if (!task) return null;

      const linksResult = await this.db.query(
        `
        SELECT tl.* FROM task_links tl
        WHERE tl.task_id = $1
        ORDER BY tl.delegation_depth ASC
      `,
        [taskId],
      );

      const chain = await Promise.all(
        linksResult.rows.map(async (link: Record<string, unknown>) => {
          const submissionResult = await this.db.query(
            `
          SELECT * FROM task_submissions WHERE task_link_id = $1
        `,
            [link.id as string],
          );
          return { ...link, submission: submissionResult.rows[0] || null };
        }),
      );

      let reviews: any[] = [];
      if (task.case_id) {
        const reviewsResult = await this.db.query(
          `
          SELECT * FROM case_reviews
          WHERE case_id = $1
          ORDER BY reviewed_at DESC
        `,
          [task.case_id],
        );
        reviews = reviewsResult.rows;
      }

      return {
        task_id: task.id,
        case_id: task.case_id,
        task_type: task.task_type,
        target_grade: task.target_grade,
        target_room: task.target_room,
        student_name: task.student_name,
        student_school: task.student_school,
        student_address: task.student_address,
        reason_flagged: task.reason_flagged,
        task_status: task.status,
        case_status: task.case_status,
        result_summary: task.result_summary,
        chain,
        reviews,
      };
    } catch (err) {
      this.logger.error(`getTaskChain error: ${err.message}`);
      throw err;
    }
  }

  async saveTaskAttendance(token: string, records: any[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      const task = await this.getTaskByToken(token);
      const recorder = task?.assigned_to_name || 'Teacher (Magic Link)';

      await this.db.transaction(async (client) => {
        for (const record of records) {
          // Fetch student metadata to satisfy new schema
          const studentRes = await client.query(
            `
            SELECT "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", "Semester_Onec", "AcademicYear_Onec"
            FROM student_term WHERE "PersonID_Onec" = $1
          `,
            [record.student_id],
          );
          const s = studentRes.rows[0];

          if (s) {
            // Check if already exists for today to avoid duplicates
            await client.query(
              `
              DELETE FROM attendance 
              WHERE "AttendanceDate" = $1 AND "PersonID_Onec" = $2
            `,
              [today, record.student_id],
            );

            await client.query(
              `
              INSERT INTO attendance (
                "PersonID_Onec", "SchoolID_Onec", "GradeLevelID_Onec", "RoomID_Onec", 
                "AttendanceDate", "Semester_Onec", "AcademicYear_Onec", "AttendanceStatus",
                "Period", "RecordedBy"
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
              [
                record.student_id,
                s.SchoolID_Onec,
                s.GradeLevelID_Onec,
                s.RoomID_Onec,
                today,
                s.Semester_Onec,
                s.AcademicYear_Onec,
                record.status === 'P_PRESENT'
                  ? 1
                  : record.status === 'P_ABSENT'
                    ? 2
                    : 3,
                1, // Default to Period 1 for demo
                recorder,
              ],
            );
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
    this.logger.log(
      `[saveTaskSubmission] token=${token}, data=${JSON.stringify(data)}`,
    );
    try {
      const tokenHash = hashToken(token);

      const linkRes = await this.db.query(
        `
        SELECT tl.id as link_id, t.id as task_id, t.case_id, t.task_type
        FROM task_links tl
        JOIN tasks t ON t.id = tl.task_id
        WHERE tl.token_hash = $1
      `,
        [tokenHash],
      );

      const link = linkRes.rows[0];
      if (!link) {
        throw new Error('Task not found');
      }

      await this.db.transaction(async (client) => {
        await client.query(
          `
          INSERT INTO task_submissions (
            task_link_id,
            visit_lat,
            visit_lng,
            cause_category,
            cause_detail,
            recommendation,
            photo_paths,
            address_changed,
            updated_student_address,
            updated_lat,
            updated_lng
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
          [
            link.link_id,
            data.visit_lat ?? null,
            data.visit_lng ?? null,
            data.cause_category ?? null,
            data.notes ?? data.cause_detail ?? null,
            data.recommendation ?? null,
            data.photo_paths ?? null,
            !!data.address_changed,
            data.updated_student_address ?? null,
            data.updated_lat ?? null,
            data.updated_lng ?? null,
          ],
        );

        if (link.task_type === 'VISIT' && link.case_id) {
          const nextSummary =
            data.notes || data.cause_detail || 'No notes provided';
          if (data.address_changed && data.updated_student_address) {
            await client.query(
              `
              UPDATE cases
              SET
                status = $1,
                result_summary = $2,
                student_address = $3,
                student_lat = COALESCE($4, student_lat),
                student_lng = COALESCE($5, student_lng)
              WHERE id = $6
            `,
              [
                'PENDING_REVIEW',
                nextSummary,
                data.updated_student_address,
                data.updated_lat ?? data.visit_lat ?? null,
                data.updated_lng ?? data.visit_lng ?? null,
                link.case_id,
              ],
            );
          } else {
            await client.query(
              `UPDATE cases SET status = $1, result_summary = $2 WHERE id = $3`,
              ['PENDING_REVIEW', nextSummary, link.case_id],
            );
          }
        }

        await client.query(`UPDATE tasks SET status = $1 WHERE id = $2`, [
          'COMPLETED',
          link.task_id,
        ]);

        await client.query(`UPDATE task_links SET status = $1 WHERE id = $2`, [
          'COMPLETED',
          link.link_id,
        ]);
      });

      this.logger.log(`[saveTaskSubmission] success`);
      return { success: true };
    } catch (err) {
      this.logger.error(`saveTaskSubmission error: ${err.message}`);
      throw err;
    }
  }

  async requestOtp(token: string) {
    const tokenHash = hashToken(token);

    const linkRes = await this.db.query(
      `
      SELECT id, assigned_to_email FROM task_links WHERE token_hash = $1
    `,
      [tokenHash],
    );

    const link = linkRes.rows[0];
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    const email =
      typeof link.assigned_to_email === 'string'
        ? link.assigned_to_email.trim()
        : '';
    if (!email) {
      throw new BadRequestException('No email found for this link');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.db.query(
      `
      UPDATE task_links SET otp_code = $1, otp_expires_at = $2, otp_verified = 0 WHERE id = $3
    `,
      [otp, expiresAt.toISOString(), link.id],
    );

    try {
      await this.emailService.sendOTP(email, otp);
      return {
        success: true,
        message: 'OTP sent successfully',
        expires_at: expiresAt.toISOString(),
        method: 'EMAIL',
      };
    } catch (err) {
      this.logger.error(
        `Failed to send OTP: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  async verifyOtp(token: string, otp: string) {
    if (!otp) {
      throw new Error('OTP is required');
    }

    const tokenHash = hashToken(token);

    const linkRes = await this.db.query(
      `
      SELECT id, otp_code, otp_expires_at FROM task_links WHERE token_hash = $1
    `,
      [tokenHash],
    );

    const link = linkRes.rows[0];
    if (!link) {
      throw new Error('Link not found');
    }

    if (link.otp_code !== otp) {
      throw new Error('Invalid OTP code');
    }

    if (new Date(link.otp_expires_at) < new Date()) {
      throw new Error('OTP expired');
    }

    await this.db.query(
      `UPDATE task_links SET otp_verified = 1 WHERE id = $1`,
      [link.id],
    );

    return { success: true, message: 'OTP verified successfully' };
  }

  async adminLockLink(
    linkId: string,
    action: 'lock' | 'unlock',
    reason?: string,
  ) {
    try {
      const res = await this.db.query(
        `SELECT * FROM task_links WHERE id = $1`,
        [linkId],
      );
      const link = res.rows[0];
      if (!link) throw new Error('Link not found');
      if (link.status !== 'ACTIVE')
        throw new Error('Only ACTIVE links can be changed by admin');

      if (action === 'lock') {
        if (!reason) throw new Error('reason is required when locking link');
        await this.db.query(
          `
          UPDATE task_links
          SET admin_locked = 1, admin_lock_reason = $1, admin_lock_at = $2
          WHERE id = $3
        `,
          [reason, new Date().toISOString(), linkId],
        );
        return {
          message: 'Link locked by admin',
          link_id: linkId,
          admin_locked: 1,
        };
      } else {
        await this.db.query(
          `
          UPDATE task_links
          SET admin_locked = 0, admin_lock_reason = NULL, admin_lock_at = NULL
          WHERE id = $1
        `,
          [linkId],
        );
        return {
          message: 'Link unlocked by admin',
          link_id: linkId,
          admin_locked: 0,
        };
      }
    } catch (err) {
      this.logger.error(`adminLockLink error: ${err.message}`);
      throw err;
    }
  }

  async getCases() {
    try {
      const result = await this.db.query(`
        SELECT
          c.*,
          t.id as task_id,
          tl.id as active_link_id,
          tl.magic_link as active_link,
          tl.admin_locked as active_link_locked,
          tl.admin_lock_reason as active_link_lock_reason,
          tl.expires_at as active_link_expires_at,
          tl.assigned_to_name as active_link_assigned_to,
          tl.delegation_depth as active_link_depth
        FROM cases c
        LEFT JOIN tasks t ON t.case_id = c.id
        LEFT JOIN LATERAL (
          SELECT * FROM task_links
          WHERE task_id = t.id
            AND status = 'ACTIVE'
            AND expires_at > NOW()
          ORDER BY delegation_depth DESC
          LIMIT 1
        ) tl ON true
        ORDER BY c.created_at DESC
      `);
      return result.rows;
    } catch (err) {
      this.logger.error(`getCases error: ${err.message}`);
      throw err;
    }
  }

  async getStats() {
    try {
      const totalRes = await this.db.query(`SELECT count(*) FROM cases`);
      const inProgressRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'IN_PROGRESS'`,
      );
      const resolvedRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'RESOLVED'`,
      );
      const pendingReviewRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'PENDING_REVIEW'`,
      );
      const activeLinksRes = await this.db.query(
        `SELECT count(*) FROM task_links WHERE status = 'ACTIVE' AND expires_at > NOW()`,
      );

      const today = new Date().toISOString().split('T')[0];
      const todayRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE created_at::date = $1`,
        [today],
      );

      return {
        total: parseInt(totalRes.rows[0].count, 10),
        inProgress: parseInt(inProgressRes.rows[0].count, 10),
        resolved: parseInt(resolvedRes.rows[0].count, 10),
        today: parseInt(todayRes.rows[0].count, 10),
        pendingReview: parseInt(pendingReviewRes.rows[0].count, 10),
        activeLinks: parseInt(activeLinksRes.rows[0].count, 10),
        delegations: 0,
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
      const dropoutRes = await this.db.query(
        `SELECT count(*) FROM student_dropouts`,
      );

      // 3. At-risk (Mock for now or based on some criteria, let's say 4% of total)
      const totalCount = parseInt(totalRes.rows[0].count, 10);
      const atRiskCount = 0; // Set to 0 as requested, criteria pending

      // 4. Help Case Statuses (from cases table)
      const waitingRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'OPEN'`,
      );
      const inProgressRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'IN_PROGRESS'`,
      );
      const resolvedRes = await this.db.query(
        `SELECT count(*) FROM cases WHERE status = 'RESOLVED'`,
      );

      return {
        success: true,
        data: {
          totalStudents: totalCount,
          dropoutStudents: parseInt(dropoutRes.rows[0].count, 10),
          atRiskStudents: atRiskCount,
          helpStats: {
            waiting: parseInt(waitingRes.rows[0].count, 10),
            inProgress: parseInt(inProgressRes.rows[0].count, 10),
            resolved: parseInt(resolvedRes.rows[0].count, 10),
          },
        },
      };
    } catch (err) {
      this.logger.error(`getOverviewStats error: ${err.message}`);
      throw err;
    }
  }
}
