import { Pool } from 'pg';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function importExcel() {
  console.log('Starting data import with Mockup V2 and Grade Levels...');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'sts',
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Initializing COMPLETE schema...');
    // Drop existing tables to ensure a clean state
    await client.query(`
        DROP TABLE IF EXISTS schools, grade_levels, attendance, attendance_records, task_submissions, task_links, tasks, case_reviews, cases, student_term, students, student_dropouts, academic_records, schedules CASCADE;

        CREATE TABLE grade_levels (
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
          target_room TEXT,
          target_school_id INTEGER
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
          address_changed BOOLEAN DEFAULT FALSE,
          updated_student_address TEXT,
          updated_lat REAL,
          updated_lng REAL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            "Period"              INT NOT NULL,
            "AttendanceStatus"    SMALLINT NOT NULL,
            "RecordedAt"          TIMESTAMP DEFAULT NOW(),
            "RecordedBy"          VARCHAR(100)
        );
        CREATE TABLE IF NOT EXISTS schools (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          province TEXT,
          district TEXT,
          sub_district TEXT
        );
    `);

    console.log('Seeding schools with location data...');
    const activePath_seed = path.resolve(
      __dirname,
      '../../../../student2567เทอม1-2_mockup_v2.xlsx',
    );
    const activeWorkbook_seed = xlsx.readFile(activePath_seed);
    const activeData_seed: any[] = xlsx.utils.sheet_to_json(
      activeWorkbook_seed.Sheets[activeWorkbook_seed.SheetNames[0]],
    );

    // School data is often more complete in student records if we map name from dropout or hardcode if missing
    const dropoutPath_ls = path.resolve(
      __dirname,
      '../../../../studentหลุดจากระบบ2567_mockup_v2.xlsx',
    );
    const dropoutWorkbook_ls = xlsx.readFile(dropoutPath_ls);
    const dropoutData_ls: any[] = xlsx.utils.sheet_to_json(
      dropoutWorkbook_ls.Sheets[dropoutWorkbook_ls.SheetNames[0]],
    );

    const schoolNameMap = new Map<number, string>();
    dropoutData_ls.forEach((row) => {
      if (row.SchoolID_Onec && row.SchoolName_Onec) {
        schoolNameMap.set(row.SchoolID_Onec, row.SchoolName_Onec);
      }
    });

    const schoolInfoMap = new Map<
      number,
      { name: string; province: string; district: string; sub_district: string }
    >();

    activeData_seed.forEach((row) => {
      if (row.SchoolID_Onec) {
        if (!schoolInfoMap.has(row.SchoolID_Onec)) {
          schoolInfoMap.set(row.SchoolID_Onec, {
            name:
              schoolNameMap.get(row.SchoolID_Onec) ||
              `โรงเรียนรหัส ${row.SchoolID_Onec}`,
            province: row.ProvinceNameThai_Onec || 'ไม่ระบุ',
            district: row.DistrictNameThai_Onec || 'ไม่ระบุ',
            sub_district: row.SubDistrictNameThai_Onec || 'ไม่ระบุ',
          });
        }
      }
    });

    for (const [id, info] of schoolInfoMap.entries()) {
      await client.query(
        `
        INSERT INTO schools (id, name, province, district, sub_district) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          province = EXCLUDED.province,
          district = EXCLUDED.district,
          sub_district = EXCLUDED.sub_district
      `,
        [id, info.name, info.province, info.district, info.sub_district],
      );
    }

    console.log('Seeding grade_levels...');
    await client.query(`
      INSERT INTO grade_levels (id, label, category) VALUES
      (101, 'ป.1', 'ประถมศึกษา'),
      (102, 'ป.2', 'ประถมศึกษา'),
      (103, 'ป.3', 'ประถมศึกษา'),
      (104, 'ป.4', 'ประถมศึกษา'),
      (105, 'ป.5', 'ประถมศึกษา'),
      (106, 'ป.6', 'ประถมศึกษา'),
      (111, 'ม.1', 'มัธยมศึกษาตอนต้น'),
      (112, 'ม.2', 'มัธยมศึกษาตอนต้น'),
      (113, 'ม.3', 'มัธยมศึกษาตอนต้น'),
      (421, 'ม.4', 'มัธยมศึกษาตอนปลาย'),
      (422, 'ม.5', 'มัธยมศึกษาตอนปลาย'),
      (423, 'ม.6', 'มัธยมศึกษาตอนปลาย')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Load active students from V2
    const activePath = path.resolve(
      __dirname,
      '../../../../student2567เทอม1-2_mockup_v2.xlsx',
    );
    console.log(`Reading ${activePath}...`);
    const activeWorkbook = xlsx.readFile(activePath);
    const activeData: any[] = xlsx.utils.sheet_to_json(
      activeWorkbook.Sheets[activeWorkbook.SheetNames[0]],
    );
    console.log(`Found ${activeData.length} active students.`);

    for (const row of activeData) {
      const year =
        row.AcademicYear_Onec === 2567 ? 2569 : row.AcademicYear_Onec;
      const admissionYear =
        row.SchoolAdmissionYear_Onec === 2565
          ? 2567
          : row.SchoolAdmissionYear_Onec;

      await client.query(
        `
        INSERT INTO student_term (
          "AcademicYear_Onec", "Semester_Onec", "DepartmentID_Onec", "SchoolID_Onec", 
          "PersonID_Onec", "PassportNumber_Onec", "PrefixID_Onec", "FirstName_Onec", 
          "MiddleName_Onec", "LastName_Onec", "GenderID_Onec", "NationalityID_Onec", 
          "DisabilityID_Onec", "DisadvantageEducationID_Onec", "VillageNumber_Onec", 
          "Street_Onec", "Soi_Onec", "Trok_Onec", "SubDistrictID_Onec", 
          "SchoolAdmissionYear_Onec", "GradeLevelID_Onec", "RoomID_Onec", "GPAX_Onec", 
          "StudentStatusID_Onec", "ProvinceNameThai_Onec", "DistrictNameThai_Onec", 
          "SubDistrictNameThai_Onec"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        ON CONFLICT ("PersonID_Onec") DO NOTHING
      `,
        [
          year,
          row.Semester_Onec,
          row.DepartmentID_Onec,
          row.SchoolID_Onec,
          row.PersonID_Onec,
          row.PassportNumber_Onec,
          row.PrefixID_Onec,
          row.FirstName_Onec,
          row.MiddleName_Onec,
          row.LastName_Onec,
          row.GenderID_Onec,
          row.NationalityID_Onec,
          row.DisabilityID_Onec,
          row.DisadvantageEducationID_Onec,
          String(row.VillageNumber_Onec || ''),
          row.Street_Onec,
          row.Soi_Onec,
          row.Trok_Onec,
          row.SubDistrictID_Onec,
          admissionYear,
          row.GradeLevelID_Onec,
          row.RoomID_Onec,
          row.GPAX_Onec,
          row.StudentStatusID_Onec,
          row.ProvinceNameThai_Onec,
          row.DistrictNameThai_Onec,
          row.SubDistrictNameThai_Onec,
        ],
      );
    }

    // Load dropout students from V2
    const dropoutPath = path.resolve(
      __dirname,
      '../../../../studentหลุดจากระบบ2567_mockup_v2.xlsx',
    );
    console.log(`Reading ${dropoutPath}...`);
    const dropoutWorkbook = xlsx.readFile(dropoutPath);
    const dropoutData: any[] = xlsx.utils.sheet_to_json(
      dropoutWorkbook.Sheets[dropoutWorkbook.SheetNames[0]],
    );
    console.log(`Found ${dropoutData.length} dropout students.`);

    for (const row of dropoutData) {
      const year =
        row.AcademicYearPresent_Onec === 2567
          ? 2569
          : row.AcademicYearPresent_Onec;
      const acadYear = row.ACADYEAR === 2567 ? 2569 : row.ACADYEAR;

      await client.query(
        `
        INSERT INTO student_dropouts (
          "ProvinceNameThai_Onec", "DistrictNameThai_Onec", "SubDistrictNameThai_Onec", 
          "PersonID_Onec", "Fullname_Onec", "Gender_Onec", "NationalityName_Onec", 
          "BirthDate_Onec", "HouseNumber_Onec", "VillageNumber_Onec", "Street_Onec", 
          "Soi_Onec", "Trok_Onec", "StatusCodeCause_Onec", "Remark_Onec", 
          "SchoolName_Onec", "GradeLevelID_Onec", "AcademicYearPresent_Onec", 
          "DropoutTransferID_Onec", "ACADYEAR", "RoomID_Onec", "SchoolID_Onec", 
          "GenderID_Onec", "GPAX_Onec"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT ("PersonID_Onec") DO NOTHING
      `,
        [
          row.ProvinceNameThai_Onec,
          row.DistrictNameThai_Onec,
          row.SubDistrictNameThai_Onec,
          row.PersonID_Onec,
          row.Fullname_Onec,
          row.Gender_Onec,
          row.NationalityName_Onec,
          row.BirthDate_Onec,
          row.HouseNumber_Onec,
          String(row.VillageNumber_Onec || ''),
          row.Street_Onec,
          row.Soi_Onec,
          row.Trok_Onec,
          String(row.StatusCodeCause_Onec),
          row.Remark_Onec,
          row.SchoolName_Onec,
          row.GradeLevelID_Onec,
          year,
          row.DropoutTransferID_Onec,
          acadYear,
          row.RoomID_Onec,
          row.SchoolID_Onec,
          row.GenderID_Onec,
          row.GPAX_Onec,
        ],
      );
    }

    await client.query('COMMIT');
    console.log('V2 Reset and Grade Levels Import successfully completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

importExcel();
