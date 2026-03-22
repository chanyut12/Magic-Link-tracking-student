import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as xlsx from 'xlsx';

export interface ManualSchool {
  id: number;
  name: string;
  province?: string;
  district?: string;
  sub_district?: string;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async checkMissingSchools(
    file: Express.Multer.File,
    mapping: Record<string, string>,
  ): Promise<{ missingSchools: Array<{ id: number }> }> {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const schoolIdCsvHeader = mapping['SchoolID_Onec'];
    if (!schoolIdCsvHeader) {
      return { missingSchools: [] };
    }

    const uniqueSchoolIds = [
      ...new Set(data.map((row) => row[schoolIdCsvHeader]).filter(Boolean)),
    ];
    if (uniqueSchoolIds.length === 0) {
      return { missingSchools: [] };
    }

    const result = await this.databaseService.query(
      `SELECT id FROM schools WHERE id = ANY($1::int[])`,
      [uniqueSchoolIds.map(Number)],
    );
    const existingIds = new Set(result.rows.map((r: { id: number }) => Number(r.id)));
    const missingIds = uniqueSchoolIds.filter((id) => !existingIds.has(Number(id)));

    return { missingSchools: missingIds.map((id) => ({ id: Number(id) })) };
  }

  async processImport(
    file: Express.Multer.File,
    target: string,
    mapping: Record<string, string>,
    manualSchools: ManualSchool[] = [],
  ) {
    if (target !== 'student_term' && target !== 'student_dropouts') {
      throw new BadRequestException('Invalid target database');
    }

    this.logger.log(`Parsing file: ${file.originalname} for target: ${target}`);

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data || data.length === 0) {
      throw new BadRequestException('The uploaded file is empty or unreadable');
    }

    this.logger.log(`Found ${data.length} rows. Mapping to ${target}...`);

    const validDbColumns = Object.keys(mapping);

    return await this.databaseService.transaction(async (client) => {
      // Insert manual schools provided by user first
      for (const school of manualSchools) {
        await client.query(
          `INSERT INTO schools (id, name, province, district, sub_district)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             province = EXCLUDED.province,
             district = EXCLUDED.district,
             sub_district = EXCLUDED.sub_district`,
          [school.id, school.name, school.province ?? null, school.district ?? null, school.sub_district ?? null],
        );
      }

      let inserted = 0;
      let skipped = 0;

      this.logger.log(`Using mapping: ${JSON.stringify(mapping)}`);
      if (data.length > 0) {
        this.logger.log(`First row parsed: ${JSON.stringify(data[0])}`);
      }

      for (const row of data) {
        const dbRow: Record<string, any> = {};

        for (const dbCol of validDbColumns) {
          const csvHeader = mapping[dbCol];
          if (csvHeader && row[csvHeader] !== undefined) {
            dbRow[dbCol] = row[csvHeader];
          } else {
            dbRow[dbCol] = null;
          }
        }

        if (!dbRow['PersonID_Onec']) {
          skipped++;
          continue;
        }

        const columns = Object.keys(dbRow);
        const values = Object.values(dbRow);

        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const queryStr = `
          INSERT INTO ${target} (${columns.map((c) => `"${c}"`).join(', ')})
          VALUES (${placeholders})
          ON CONFLICT ("PersonID_Onec") DO NOTHING
        `;

        await client.query(queryStr, values);
        inserted++;
      }

      this.logger.log(`Successfully completed import of ${inserted} rows into ${target} (skipped: ${skipped})`);
      return {
        success: true,
        rowsProcessed: data.length,
        rowsInserted: inserted,
        rowsSkipped: skipped,
      };
    });
  }
}
