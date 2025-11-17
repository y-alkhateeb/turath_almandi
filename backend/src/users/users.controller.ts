import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles([UserRole.ADMIN])
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles([UserRole.ADMIN])
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles([UserRole.ADMIN])
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles([UserRole.ADMIN])
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/assign-branch')
  @Roles([UserRole.ADMIN])
  assignBranch(@Param('id') id: string, @Body('branchId') branchId: string | null) {
    return this.usersService.assignBranch(id, branchId);
  }

  @Delete(':id')
  @Roles([UserRole.ADMIN])
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
