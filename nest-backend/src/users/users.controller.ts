import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { AuthGuard, PermissionsGuard, RequirePermission } from '../auth';

type RequestWithActor = Request & {
  user?: {
    id: number;
    username: string;
    roles: string[];
    permissions: string[];
    data_scope?: Record<string, unknown>;
  };
};

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-users-list')
  @Get()
  async getAllUsers(@Req() req: RequestWithActor) {
    return await this.usersService.getAllUsers(req.user);
  }

  @UseGuards(AuthGuard)
  @Get('roles')
  async getRoles(@Req() req: RequestWithActor) {
    return await this.usersService.getRoles(req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-role-groups')
  @Get('role-groups')
  async getRoleGroups(@Req() req: RequestWithActor) {
    return await this.usersService.getRoleGroups(req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-role-groups')
  @Post('role-groups')
  async createRoleGroup(@Body() data: any, @Req() req: RequestWithActor) {
    return await this.usersService.createRoleGroup(req.user, data);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-role-groups')
  @Put('role-groups/:name')
  async updateRoleGroup(
    @Param('name') name: string,
    @Body() data: any,
    @Req() req: RequestWithActor,
  ) {
    return await this.usersService.updateRoleGroup(req.user, name, data);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-role-groups')
  @Delete('role-groups/:name')
  async deleteRoleGroup(@Param('name') name: string, @Req() req: RequestWithActor) {
    return await this.usersService.deleteRoleGroup(req.user, name);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-users-list')
  @Get(':id')
  async getUserById(@Param('id') id: string, @Req() req: RequestWithActor) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new HttpException('ID ผู้ใช้งานไม่ถูกต้อง', HttpStatus.BAD_REQUEST);
    }
    const user = await this.usersService.getUserById(userId, req.user);
    if (!user) {
      throw new HttpException('ไม่พบผู้ใช้งาน', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-users-list')
  @Post()
  async createUser(@Body() data: any, @Req() req: RequestWithActor) {
    return await this.usersService.createUser(req.user, data);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-users-list')
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: any, @Req() req: RequestWithActor) {
    return await this.usersService.updateUser(req.user, parseInt(id, 10), data);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('manage-users-list')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: RequestWithActor) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new HttpException('ID ผู้ใช้งานไม่ถูกต้อง', HttpStatus.BAD_REQUEST);
    }
    return await this.usersService.deleteUser(req.user, userId);
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.usersService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new HttpException(
        'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('settings')
  @Post('migrate-passwords')
  async migratePasswords() {
    return await this.usersService.hashExistingPasswords();
  }
}
