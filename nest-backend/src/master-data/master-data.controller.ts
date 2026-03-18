import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('api/master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get(':table')
  getAll(@Param('table') table: string) {
    return this.masterDataService.getAll(table);
  }

  @Get(':table/:id')
  getById(@Param('table') table: string, @Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getById(table, id);
  }

  @Post(':table')
  create(@Param('table') table: string, @Body() body: any) {
    return this.masterDataService.create(table, body);
  }

  @Put(':table/:id')
  update(@Param('table') table: string, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.masterDataService.update(table, id, body);
  }

  @Delete(':table/:id')
  remove(@Param('table') table: string, @Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.remove(table, id);
  }
}
