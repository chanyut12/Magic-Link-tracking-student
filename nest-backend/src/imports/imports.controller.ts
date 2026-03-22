import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService, ManualSchool } from './imports.service';

@Controller('api/imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('check-schools')
  @UseInterceptors(FileInterceptor('file'))
  async checkSchools(
    @UploadedFile() file: Express.Multer.File,
    @Body('mapping') mappingStr: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!mappingStr) throw new BadRequestException('Mapping configuration not provided');

    let mapping: Record<string, string>;
    try {
      mapping = JSON.parse(mappingStr);
    } catch {
      throw new BadRequestException('Invalid JSON in mapping');
    }

    return this.importsService.checkMissingSchools(file, mapping);
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  async importData(
    @UploadedFile() file: Express.Multer.File,
    @Body('target') target: string,
    @Body('mapping') mappingStr: string,
    @Body('schools') schoolsStr?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!target) throw new BadRequestException('Target database not specified');
    if (!mappingStr) throw new BadRequestException('Mapping configuration not provided');

    let mapping: Record<string, string>;
    try {
      mapping = JSON.parse(mappingStr);
    } catch {
      throw new BadRequestException('Invalid JSON in mapping');
    }

    let manualSchools: ManualSchool[] = [];
    if (schoolsStr) {
      try {
        manualSchools = JSON.parse(schoolsStr);
      } catch {
        throw new BadRequestException('Invalid JSON in schools');
      }
    }

    return this.importsService.processImport(file, target, mapping, manualSchools);
  }
}
