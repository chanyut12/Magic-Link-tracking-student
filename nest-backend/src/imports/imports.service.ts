import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as xlsx from 'xlsx';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async processImport(file: Express.Multer.File, target: string, mapping: Record<string, string>) {
    if (target !== 'student_term' && target !== 'student_dropouts') {
      throw new BadRequestException('Invalid target database');
    }

    this.logger.log(`Parsing file: ${file.originalname} for target: ${target}`);
    
    // xlsx handles .csv seamlessly as well.
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data || data.length === 0) {
      throw new BadRequestException('The uploaded file is empty or unreadable');
    }

    this.logger.log(`Found ${data.length} rows. Mapping to ${target}...`);

    // Extract mapped DB columns (ignoring ones without a mapped CSV header)
    const validDbColumns = Object.keys(mapping);
    
    // We execute the insert in a transaction
    return await this.databaseService.transaction(async (client) => {
      let inserted = 0;
      let skipped = 0;

      this.logger.log(`Using mapping: ${JSON.stringify(mapping)}`);
      if (data.length > 0) {
        this.logger.log(`First row parsed: ${JSON.stringify(data[0])}`);
      }

      for (const row of data) {
        // Construct dbRow according to mapping
        const dbRow: Record<string, any> = {};
        
        for (const dbCol of validDbColumns) {
          const csvHeader = mapping[dbCol];
          if (csvHeader && row[csvHeader] !== undefined) {
             dbRow[dbCol] = row[csvHeader];
          } else {
             // Null pad unmapped or missing fields
             dbRow[dbCol] = null;
          }
        }

        // We only insert if we have a PersonID_Onec which is the Primary Key
        if (!dbRow['PersonID_Onec']) {
           skipped++;
           continue;
        }

        const columns = Object.keys(dbRow);
        const values = Object.values(dbRow);

        // Build INSERT query
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const queryStr = `
          INSERT INTO ${target} (${columns.map(c => `"${c}"`).join(', ')})
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
