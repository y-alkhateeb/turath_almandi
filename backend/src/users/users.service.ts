import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUserId?: string) {
    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('اسم المستخدم موجود بالفعل');
    }

    // If branchId is provided, verify it exists
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: createUserDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        passwordHash,
        role: createUserDto.role,
        branchId: createUserDto.branchId || null,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log the creation in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logCreate(
        currentUserId,
        AuditEntityType.USER,
        user.id,
        user,
      );
    }

    return user;
  }

  /**
   * Find all users with filtering
   * Returns all users matching the filters (no pagination)
   *
   * @param filters - Filter parameters (role, isActive, search)
   * @returns Array of users
   */
  async findAll(filters: UserFilters = {}) {
    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Filter by active status (default to active only, unless explicitly set)
    if (filters.isActive === true) {
      where.isDeleted = false;
    } else if (filters.isActive === false) {
      where.isDeleted = true;
    }
    // If isActive is undefined, show all users (both active and inactive)

    // Filter by role
    if (filters.role) {
      where.role = filters.role;
    }

    // Search by username
    if (filters.search) {
      where.username = { contains: filters.search, mode: 'insensitive' };
    }

    const userSelect = {
      id: true,
      username: true,
      role: true,
      branchId: true,
      isDeleted: true,
      deletedAt: true,
      deletedBy: true,
      createdAt: true,
      updatedAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    };

    // Execute query without pagination
    const users = await this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId?: string) {
    const existingUser = await this.findOne(id); // Check existence

    // Prepare update data
    const { password, ...restDto } = updateUserDto;
    const updateData: Record<string, unknown> = { ...restDto };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log the update in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logUpdate(
        currentUserId,
        AuditEntityType.USER,
        id,
        existingUser,
        updatedUser,
      );
    }

    return updatedUser;
  }

  async assignBranch(userId: string, branchId: string | null) {
    return this.update(userId, { branchId });
  }

  async remove(id: string, currentUserId?: string) {
    const existingUser = await this.findOne(id); // Check existence

    // Soft delete using soft delete pattern
    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUserId || null,
        isDeleted: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log the deletion in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logDelete(
        currentUserId,
        AuditEntityType.USER,
        id,
        existingUser,
      );
    }

    return deletedUser;
  }

  /**
   * Reactivate a soft-deleted user
   * Restores the user by clearing soft delete fields
   */
  async reactivate(id: string, currentUserId?: string) {
    // Find even deleted users
    const existingUser = await this.prisma.user.findFirst({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Reactivate user by clearing soft delete fields
    const reactivatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        isDeleted: false,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log the reactivation in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logUpdate(
        currentUserId,
        AuditEntityType.USER,
        id,
        { isDeleted: existingUser.isDeleted, deletedAt: existingUser.deletedAt, deletedBy: existingUser.deletedBy },
        { isDeleted: reactivatedUser.isDeleted, deletedAt: null, deletedBy: null },
      );
    }

    return reactivatedUser;
  }
}
