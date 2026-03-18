import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MasterDataService {
  private readonly logger = new Logger(MasterDataService.name);

  constructor(private readonly db: DatabaseService) {}

  // Helpers to prevent SQL injection by whitelisting table names
  private validateTableName(table: string): string {
    const allowed = ['risk_factors', 'dropout_reasons', 'assistance_measures', 'related_agencies', 'schools', 'educational_areas'];
    if (!allowed.includes(table)) {
      throw new Error('Invalid master data table');
    }
    return table;
  }

  async getAll(table: string) {
    const validTable = this.validateTableName(table);
    const sql = `SELECT * FROM ${validTable} ORDER BY id ASC`;
    const result = await this.db.query(sql);
    return result.rows;
  }

  async getById(table: string, id: number) {
    const validTable = this.validateTableName(table);
    const sql = `SELECT * FROM ${validTable} WHERE id = $1`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async create(table: string, data: any) {
    const validTable = this.validateTableName(table);
    const labelColumn = ['related_agencies', 'schools', 'educational_areas'].includes(table) ? 'name' : 'label';
    const sql = `
      INSERT INTO ${validTable} (${labelColumn})
      VALUES ($1)
      RETURNING *;
    `;
    const result = await this.db.query(sql, [data.label || data.name]);
    return result.rows[0];
  }

  async update(table: string, id: number, data: any) {
    const validTable = this.validateTableName(table);
    const labelColumn = ['related_agencies', 'schools', 'educational_areas'].includes(table) ? 'name' : 'label';
    const sql = `
      UPDATE ${validTable}
      SET ${labelColumn} = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await this.db.query(sql, [data.label || data.name, id]);
    return result.rows[0];
  }

  async remove(table: string, id: number) {
    const validTable = this.validateTableName(table);
    const sql = `DELETE FROM ${validTable} WHERE id = $1 RETURNING *`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }
}
