import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as path from 'path';

// Load .env explicitly since it's located in the parent directory
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'sts',
    });

    try {
      await this.pool.query('SELECT 1');
      this.logger.log(`Database connected to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      await this.runMigrations();
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  private async runMigrations() {
    this.logger.log('Running migrations...');
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE TABLE IF NOT EXISTS schools (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          province TEXT,
          district TEXT,
          sub_district TEXT
        );

        CREATE TABLE IF NOT EXISTS grade_levels (
          id INTEGER PRIMARY KEY,
          label TEXT NOT NULL,
          category TEXT
        );

        CREATE TABLE IF NOT EXISTS cases (
          id SERIAL PRIMARY KEY,
          student_name TEXT NOT NULL,
          student_school TEXT,
          student_address TEXT,
          student_lat REAL,
          student_lng REAL,
          reason_flagged TEXT,
          status TEXT DEFAULT 'OPEN',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'PENDING',
          max_delegation_depth INTEGER DEFAULT 3,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          task_type TEXT DEFAULT 'VISIT',
          target_grade TEXT,
          target_room TEXT
        );

        CREATE TABLE IF NOT EXISTS task_links (
          id TEXT PRIMARY KEY,
          task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
          parent_link_id TEXT REFERENCES task_links(id),
          token_hash TEXT NOT NULL UNIQUE,
          magic_link TEXT,
          delegation_depth INTEGER DEFAULT 0,
          assigned_to_name TEXT,
          assigned_to_phone TEXT,
          assigned_to_email TEXT,
          otp_code TEXT,
          otp_expires_at TIMESTAMP,
          otp_verified INTEGER DEFAULT 0,
          subject TEXT,
          status TEXT DEFAULT 'ACTIVE',
          admin_locked INTEGER DEFAULT 0,
          admin_lock_reason TEXT,
          admin_lock_at TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS task_submissions (
          id SERIAL PRIMARY KEY,
          task_link_id TEXT REFERENCES task_links(id),
          visit_lat REAL,
          visit_lng REAL,
          cause_category TEXT,
          cause_detail TEXT,
          photo_paths TEXT,
          recommendation TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS case_reviews (
          id TEXT PRIMARY KEY,
          case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
          review_action TEXT NOT NULL,
          review_note TEXT,
          reviewed_by TEXT,
          reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );


        CREATE TABLE IF NOT EXISTS student_term (
          "AcademicYear_Onec" INTEGER,
          "Semester_Onec" INTEGER,
          "DepartmentID_Onec" INTEGER,
          "SchoolID_Onec" INTEGER,
          "PersonID_Onec" TEXT PRIMARY KEY,
          "PassportNumber_Onec" TEXT,
          "PrefixID_Onec" INTEGER,
          "FirstName_Onec" TEXT,
          "MiddleName_Onec" TEXT,
          "LastName_Onec" TEXT,
          "GenderID_Onec" INTEGER,
          "NationalityID_Onec" INTEGER,
          "DisabilityID_Onec" INTEGER,
          "DisadvantageEducationID_Onec" INTEGER,
          "VillageNumber_Onec" TEXT,
          "Street_Onec" TEXT,
          "Soi_Onec" TEXT,
          "Trok_Onec" TEXT,
          "SubDistrictID_Onec" INTEGER,
          "SchoolAdmissionYear_Onec" INTEGER,
          "GradeLevelID_Onec" INTEGER,
          "RoomID_Onec" INTEGER,
          "GPAX_Onec" REAL,
          "StudentStatusID_Onec" INTEGER,
          "ProvinceNameThai_Onec" TEXT,
          "DistrictNameThai_Onec" TEXT,
          "SubDistrictNameThai_Onec" TEXT
        );

        CREATE TABLE IF NOT EXISTS student_dropouts (
          "ProvinceNameThai_Onec" TEXT,
          "DistrictNameThai_Onec" TEXT,
          "SubDistrictNameThai_Onec" TEXT,
          "PersonID_Onec" TEXT PRIMARY KEY,
          "Fullname_Onec" TEXT,
          "Gender_Onec" TEXT,
          "NationalityName_Onec" TEXT,
          "BirthDate_Onec" TEXT,
          "HouseNumber_Onec" TEXT,
          "VillageNumber_Onec" TEXT,
          "Street_Onec" TEXT,
          "Soi_Onec" TEXT,
          "Trok_Onec" TEXT,
          "StatusCodeCause_Onec" TEXT,
          "Remark_Onec" TEXT,
          "SchoolName_Onec" TEXT,
          "GradeLevelID_Onec" INTEGER,
          "AcademicYearPresent_Onec" INTEGER,
          "DropoutTransferID_Onec" INTEGER,
          "ACADYEAR" INTEGER,
          "RoomID_Onec" INTEGER,
          "SchoolID_Onec" INTEGER,
          "GenderID_Onec" INTEGER,
          "GPAX_Onec" REAL
        );

        CREATE TABLE IF NOT EXISTS attendance (
            "AttendanceID"        SERIAL PRIMARY KEY,
            "PersonID_Onec"       VARCHAR(20) NOT NULL REFERENCES student_term("PersonID_Onec"),
            "SchoolID_Onec"       INT NOT NULL,
            "GradeLevelID_Onec"   INT NOT NULL,
            "RoomID_Onec"         INT NOT NULL,
            "AcademicYear_Onec"   INT NOT NULL,
            "Semester_Onec"       INT NOT NULL,
            "AttendanceDate"      DATE NOT NULL,
            "Period"              INT NOT NULL,  -- คาบที่ 1-8
            "AttendanceStatus"    SMALLINT NOT NULL,  -- 1=มา 2=ขาด 3=สาย
            "RecordedAt"          TIMESTAMP DEFAULT NOW(),
            "RecordedBy"          VARCHAR(100)  -- ครูที่เช็ค
        );

        CREATE TABLE IF NOT EXISTS schedules (
          id SERIAL PRIMARY KEY,
          grade TEXT,
          room TEXT,
          day_of_week INTEGER,
          subject TEXT,
          start_time TEXT,
          end_time TEXT,
          teacher TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_task_links_token ON task_links(token_hash);
        CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
        CREATE INDEX IF NOT EXISTS idx_case_reviews_case_id ON case_reviews(case_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_person_id ON attendance("PersonID_Onec");
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance("AttendanceDate");
      `);
      await client.query('COMMIT');
      this.logger.log('Migrations complete.');
    } catch (e) {
      await client.query('ROLLBACK');
      this.logger.error('Migration failed', e);
      throw e;
    } finally {
      client.release();
    }
  }

  get instance(): Pool {
    return this.pool;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.pool.query(sql, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
