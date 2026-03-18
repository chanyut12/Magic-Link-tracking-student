import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Get(':key')
  getSettingByKey(@Param('key') key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @Put(':key')
  updateSetting(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    return this.settingsService.updateSetting(key, body.value, body.description);
  }
}
