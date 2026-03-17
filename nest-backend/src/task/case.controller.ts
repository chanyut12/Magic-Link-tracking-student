import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CaseService } from './case.service';

@Controller('api/cases')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post(':caseId/review')
  async reviewCase(
    @Param('caseId') caseIdParam: string,
    @Body() body: Record<string, unknown>,
  ) {
    const caseId = Number(caseIdParam);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      throw new HttpException('Invalid case id', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.caseService.reviewCase(caseId, body);
    } catch (err) {
      const status =
        err.message === 'Case not found'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(err.message, status);
    }
  }

  @Get(':caseId/tasks')
  async getCaseTasks(@Param('caseId') caseIdParam: string) {
    const caseId = Number(caseIdParam);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      throw new HttpException('Invalid case id', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.caseService.getTasksByCase(caseId);
    } catch (err) {
      const status =
        err.message === 'Case not found'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(err.message, status);
    }
  }

  @Get(':caseId/reviews')
  async getCaseReviews(@Param('caseId') caseIdParam: string) {
    const caseId = Number(caseIdParam);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      throw new HttpException('Invalid case id', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.caseService.getCaseReviews(caseId);
    } catch (err) {
      const status =
        err.message === 'Case not found'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(err.message, status);
    }
  }
}
