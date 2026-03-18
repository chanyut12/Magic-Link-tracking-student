import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AutomationService } from '../automation/automation.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly automationService: AutomationService
  ) {}

  async getSettings() {
    const sql = `SELECT * FROM system_settings ORDER BY setting_key`;
    const result = await this.db.query(sql);
    return result.rows;
  }

  async getSettingByKey(key: string) {
    const sql = `SELECT * FROM system_settings WHERE setting_key = $1`;
    const result = await this.db.query(sql, [key]);
    return result.rows[0];
  }

  async updateSetting(key: string, value: string, description?: string) {
    const query = `
      INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
      `;
      const result = await this.db.query(query, [key, String(value), description]);
      
      // If the setting affects the cron schedule, trigger a refresh
      if (key === 'ALERT_TRIGGER_TYPE' || key === 'ALERT_SCHEDULE_TIME') {
         this.logger.log(`Setting ${key} changed. Triggering dynamic cron refresh.`);
         await this.automationService.refreshDynamicCron();
      }

      return { success: true, data: result.rows[0] };
  }
}
