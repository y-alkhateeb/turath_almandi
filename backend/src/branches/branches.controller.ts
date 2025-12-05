import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UserRole } from '../common/types/prisma-enums';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BranchGuard } from '../common/guards/branch.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  /**
   * Get all branches
   * By default returns only active branches
   * Admin users can set includeInactive=true to see all branches (including inactive)
   *
   * Query Parameters:
   * - search: Search by branch name
   * - includeInactive: If true and user is ADMIN, include inactive branches (default: false)
   */
  @Get()
  @UseGuards(BranchGuard)
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const filters = {
      search,
      includeInactive: includeInactive === 'true',
    };
    return this.branchesService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
