import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';

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

  async findAll(branchId?: string) {
    const where = branchId ? { id: branchId, isActive: true } : { isActive: true };

    return this.prisma.branch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
            debts: true,
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
            isActive: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            debts: true,
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

    // Soft delete: set isActive to false
    const deletedBranch = await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
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
