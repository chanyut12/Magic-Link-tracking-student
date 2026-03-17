import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DelegationService } from './delegation.service';
import type { Request } from 'express';

@Controller('api/tasks')
export class DelegationController {
  constructor(private readonly delegationService: DelegationService) {}

  private resolveBaseUrl(req: Request): string {
    const envBase = process.env.FRONTEND_BASE_URL;
    if (envBase) return envBase;

    const origin = req.get('origin');
    if (origin) return origin;

    const xfProto = req.get('x-forwarded-proto');
    const xfHost = req.get('x-forwarded-host');
    if (xfHost) return `${xfProto || req.protocol}://${xfHost}`;

    return `${req.protocol}://${req.get('host')}`;
  }

  @Post(':token/delegate')
  async delegateTask(
    @Param('token') token: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    try {
      const baseUrl = this.resolveBaseUrl(req);
      return await this.delegationService.delegateTask(token, body, baseUrl);
    } catch (err) {
      if (err.message.includes('not found')) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND);
      }
      if (err.message.includes('expired')) {
        throw new HttpException(err.message, HttpStatus.GONE);
      }
      if (
        err.message.includes('no longer active') ||
        err.message.includes('disabled') ||
        err.message.includes('Max delegation')
      ) {
        throw new HttpException(err.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
