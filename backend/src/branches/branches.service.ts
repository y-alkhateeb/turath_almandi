import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/types/prisma-enums';
import { RequestUser } from '../common/interfaces';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createBranchDto: CreateBranchDto, currentUserId?: string) {
    const branch = await this.prisma.branch.create({
      data: createBranchDto,
    });

    // Log the creation in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logCreate(
        currentUserId,
        AuditEntityType.BRANCH,
        branch.id,
        branch,
      );
    }

    return branch;
  }

  /**
   * Find all branches with optional filtering
   * By default, returns only active branches
   * Admin users can request to see all branches (including inactive) with includeInactive=true
   *
   * @param user - Current user (for role-based access)
   * @param branchId - Optional specific branch ID filter
   * @param includeInactive - If true and user is ADMIN, include inactive branches (default: false)
   * @returns Array of branches matching the filter criteria
   */
  async findAll(user?: RequestUser, branchId?: string, includeInactive: boolean = false) {
    // Build where clause
    const where: Prisma.BranchWhereInput = {};

    // Filter by specific branch if provided
    if (branchId) {
      where.id = branchId;
    }

    // By default, show only non-deleted branches
    // Admin users can optionally see all branches (including deleted) by setting includeInactive=true
    if (!includeInactive || user?.role !== UserRole.ADMIN) {
      where.isDeleted = false;
    }

    return this.prisma.branch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
            accountsPayable: true,
            accountsReceivable: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            role: true,
            isDeleted: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            accountsPayable: true,
            accountsReceivable: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('الفرع غير موجود');
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto, currentUserId?: string) {
    const existingBranch = await this.findOne(id); // Check existence

    const updatedBranch = await this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });

    // Log the update in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logUpdate(
        currentUserId,
        AuditEntityType.BRANCH,
        id,
        existingBranch,
        updatedBranch,
      );
    }

    return updatedBranch;
  }

  async remove(id: string, currentUserId?: string) {
    const existingBranch = await this.findOne(id); // Check existence

    // Soft delete: set soft delete fields
    const deletedBranch = await this.prisma.branch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUserId || null,
        isDeleted: true,
      },
    });

    // Log the deletion in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logDelete(
        currentUserId,
        AuditEntityType.BRANCH,
        id,
        existingBranch,
      );
    }

    return deletedBranch;
  }
}
