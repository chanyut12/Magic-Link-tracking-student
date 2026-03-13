import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Post()
  async createUser(@Body() data: any) {
    try {
      return await this.usersService.createUser(data);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return await this.usersService.updateUser(parseInt(id, 10), data);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new HttpException('ID ผู้ใช้งานไม่ถูกต้อง', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.usersService.deleteUser(userId);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('roles')
  async getRoles() {
    return await this.usersService.getRoles();
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.usersService.validateUser(body.username, body.password);
    if (!user) {
      throw new HttpException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
