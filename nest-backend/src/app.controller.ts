import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/api/admin/verify')
  verifyAdmin(@Body('admin_key') adminKey: string) {
    const secret = this.configService.get<string>('ADMIN_ACCESS_KEY') || 'new';
    if (adminKey === secret) {
      return { success: true };
    }
    throw new UnauthorizedException('Invalid admin key');
  }
}
