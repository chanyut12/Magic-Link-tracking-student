import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AutomationService implements OnModuleInit {
  private readonly logger = new Logger(AutomationService.name);
  private readonly ABSENCE_JOB_NAME = 'check_consecutive_absences_job';

  constructor(
    private readonly db: DatabaseService,
    private schedulerRegistry: SchedulerRegistry
  ) {}

  async onModuleInit() {
    await this.refreshDynamicCron();
  }

  async refreshDynamicCron() {
    // Read current settings
    const triggerRes = await this.db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'ALERT_TRIGGER_TYPE'");
    const timeRes = await this.db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'ALERT_SCHEDULE_TIME'");
    
    const triggerType = triggerRes.rowCount > 0 ? triggerRes.rows[0].setting_value : 'SCHEDULED';
    const scheduleTime = timeRes.rowCount > 0 ? timeRes.rows[0].setting_value : '18:00'; // HH:MM format

    // Clean up existing job if it exists
    if (this.schedulerRegistry.doesExist('cron', this.ABSENCE_JOB_NAME)) {
      this.schedulerRegistry.deleteCronJob(this.ABSENCE_JOB_NAME);
      this.logger.log(`Deleted existing CronJob: ${this.ABSENCE_JOB_NAME}`);
    }

    if (triggerType === 'IMMEDIATE') {
      this.logger.log('Alert Trigger Type is IMMEDIATE. Skipping Cron registration.');
      return;
    }

    // Parse HH:MM
    const timeParts = scheduleTime.split(':');
    if (timeParts.length !== 2) {
       this.logger.error(`Invalid ALERT_SCHEDULE_TIME format: ${scheduleTime}. Expected HH:MM. Using fallback 18:00.`);
       timeParts[0] = '18';
       timeParts[1] = '00';
    }

    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    // Construct Cron string (e.g. 0 18 * * *)
    const cronTime = `0 ${minute} ${hour} * * *`;

    const job = new CronJob(cronTime, () => {
      this.logger.log(`Executing Scheduled Job: ${cronTime}`);
      this.checkConsecutiveAbsences();
    });

    this.schedulerRegistry.addCronJob(this.ABSENCE_JOB_NAME, job);
    job.start();
    
    this.logger.log(`Registered Dynamic CronJob [${this.ABSENCE_JOB_NAME}] to run at ${cronTime}`);
  }

  // Core logic routine (callable by CRON or Manually via IMMEDIATE triggers)
  async checkConsecutiveAbsences() {
    this.logger.log('Starting CRON Job: Checking consecutive absences...');
    
    // 1. Get Settings for ABSENT_THRESHOLD_DAYS
    const settingRes = await this.db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'ABSENT_THRESHOLD_DAYS'"
    );
    const thresholdDays = settingRes.rowCount > 0 ? parseInt(settingRes.rows[0].setting_value, 10) : 3;

    if (isNaN(thresholdDays) || thresholdDays <= 0) {
      this.logger.warn('ABSENT_THRESHOLD_DAYS is invalid. Skipping job.');
      return;
    }

    try {
      await this.db.transaction(async (client) => {
        // Find students with consecutive absences meeting the threshold
        // AttendanceStatus = 0 (Absent) assumption.
        const absentQuery = `
          WITH RankedAttendance AS (
            SELECT
                "PersonID_Onec",
                "AttendanceDate",
                "AttendanceStatus",
                ROW_NUMBER() OVER (PARTITION BY "PersonID_Onec" ORDER BY "AttendanceDate" DESC, "AttendanceID" DESC) as rn
            FROM attendance
          ),
          RecentConsecutiveAbsences AS (
            SELECT "PersonID_Onec", COUNT(*) as consecutive_days
            FROM RankedAttendance
            WHERE rn <= $1 AND "AttendanceStatus" = 2
            GROUP BY "PersonID_Onec"
            HAVING COUNT(*) >= $1
          )
          SELECT r."PersonID_Onec", r.consecutive_days, s."FirstName_Onec", s."LastName_Onec", s."SchoolID_Onec", s."GradeLevelID_Onec", s."RoomID_Onec", s."SubDistrictNameThai_Onec", s."DistrictNameThai_Onec", s."ProvinceNameThai_Onec" ,
                 sc.name as school_name
          FROM RecentConsecutiveAbsences r
          JOIN student_term s ON r."PersonID_Onec" = s."PersonID_Onec"
          LEFT JOIN schools sc ON s."SchoolID_Onec" = sc.id;
        `;
        
        const absentStudents = await client.query(absentQuery, [thresholdDays]);
        const absentNamesSet = new Set(absentStudents.rows.map(s => `${s.FirstName_Onec.trim()} ${s.LastName_Onec.trim()}`));

        // Auto-delete / cancel cases for students who no longer meet the threshold (e.g. attendance was corrected / mistyped)
        const openCasesQuery = "SELECT id, student_name FROM cases WHERE status = 'OPEN' AND reason_flagged LIKE 'ขาดเรียนติดต่อกัน%'";
        const openCasesRes = await client.query(openCasesQuery);

        for (const openCase of openCasesRes.rows) {
          const cName = openCase.student_name ? openCase.student_name.trim() : '';
          if (!absentNamesSet.has(cName)) {
            await client.query("DELETE FROM cases WHERE id = $1 AND status = 'OPEN'", [openCase.id]);
            this.logger.log(`Deleted / Canceled Case ${openCase.id} for ${cName} due to attendance correction.`);
          }
        }

        if (absentStudents.rowCount === 0) {
          this.logger.log('No students found meeting the consecutive absence threshold.');
          return;
        }

        this.logger.log(`Found ${absentStudents.rowCount} students over the threshold.`);

        // Create tasks/cases for them if not already existing
        for (const student of absentStudents.rows) {
          const studentName = `${student.FirstName_Onec} ${student.LastName_Onec}`;
          this.logger.log(`Checking existing cases for: ${studentName}`);
          
          // Check if an OPEN case already exists for this student
          const existingCase = await client.query(
            "SELECT id FROM cases WHERE student_name = $1 AND status = 'OPEN'",
            [studentName]
          );

          this.logger.log(`Existing case count for ${studentName}: ${existingCase.rowCount}`);

          if (existingCase.rowCount === 0) {
             const insertCaseQuery = `
              INSERT INTO cases (student_name, student_school, student_address, reason_flagged, status)
              VALUES ($1, $2, $3, $4, 'OPEN')
              RETURNING id;
             `;
             const schoolName = student.school_name || `School ID: ${student.SchoolID_Onec}`;
             const address = `${student.SubDistrictNameThai_Onec || ''} ${student.DistrictNameThai_Onec || ''} ${student.ProvinceNameThai_Onec || ''}`.trim();
             const reason = `ขาดเรียนติดต่อกัน ${thresholdDays} วัน`;

             this.logger.log(`Inserting Case for ${studentName} with Reason: ${reason}`);

             const newCaseRes = await client.query(insertCaseQuery, [
                studentName,
                schoolName,
                address,
                reason
              ]);

             this.logger.log(`Generated Case ${newCaseRes.rows[0].id} for ${studentName}`);
          }
        }
      });
    } catch (error) {
       this.logger.error('Error in checking consecutive absences', error);
    }
    
    this.logger.log('Finished CRON Job: Checking consecutive absences.');
  }
}
