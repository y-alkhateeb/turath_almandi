import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ResignEmployeeDto } from './dto/resign-employee.dto';
import { Prisma } from '@prisma/client';
import { EmployeeStatus, UserRole } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import {
  BRANCH_SELECT,
  USER_SELECT,
} from '../common/constants/prisma-includes';
import { formatDateForDB } from '../common/utils/date.utils';
import { ERROR_MESSAGES } from '../common/constants/error-messages';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface EmployeeFilters {
  status?: EmployeeStatus;
  branchId?: string;
  search?: string;
}

// Type for employee with relations
type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    salaryPayments: {
      where: { deletedAt: null };
      orderBy: { paymentDate: 'desc' };
      take: 10;
      include: {
        recorder: {
          select: typeof USER_SELECT;
        };
      };
    };
    salaryIncreases: {
      orderBy: { effectiveDate: 'desc' };
      take: 10;
      include: {
        recorder: {
          select: typeof USER_SELECT;
        };
      };
    };
  };
}>;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, user: RequestUser): Promise<EmployeeWithRelations> {
    // Determine branchId based on user role
    let branchId: string;

    if (user.role === UserRole.ADMIN) {
      // Admin must provide branchId in request
      if (!createEmployeeDto.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.BRANCH_REQUIRED);
      }
      branchId = createEmployeeDto.branchId;
    } else {
      // Accountant uses their assigned branch
      if (!user.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.ACCOUNTANT_NO_BRANCH);
      }
      branchId = user.branchId;
    }

    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(ERROR_MESSAGES.BRANCH.NOT_FOUND);
    }

    // Validate base salary and allowance
    if (createEmployeeDto.baseSalary <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.SALARY_POSITIVE);
    }

    if (createEmployeeDto.allowance && createEmployeeDto.allowance < 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.ALLOWANCE_POSITIVE);
    }

    // Build employee data
    const employeeData = {
      name: createEmployeeDto.name,
      position: createEmployeeDto.position,
      baseSalary: createEmployeeDto.baseSalary,
      allowance: createEmployeeDto.allowance || 0,
      hireDate: formatDateForDB(createEmployeeDto.hireDate),
      status: createEmployeeDto.status || EmployeeStatus.ACTIVE,
      branchId: branchId,
      createdBy: user.id,
    };

    const employee = await this.prisma.employee.create({
      data: employeeData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        salaryPayments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
        salaryIncreases: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    // Log the creation in audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.EMPLOYEE,
      employee.id,
      employee,
    );

    return employee;
  }

  /**
   * Find all employees with pagination and filters
   */
  async findAll(
    user: RequestUser,
    pagination: PaginationParams = {},
    filters: EmployeeFilters = {},
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause with branch access control
    let where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
    };

    // Apply branch filter based on user role
    where = applyBranchFilter(user, where, filters.branchId);

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Apply search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { hireDate: 'desc' },
        include: {
          branch: {
            select: BRANCH_SELECT,
          },
          creator: {
            select: USER_SELECT,
          },
          salaryPayments: {
            where: { deletedAt: null },
            orderBy: { paymentDate: 'desc' },
            take: 1,
          },
          salaryIncreases: {
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one employee by ID
   */
  async findOne(id: string, user: RequestUser): Promise<EmployeeWithRelations> {
    const employee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        salaryPayments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
        salaryIncreases: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    return employee;
  }

  /**
   * Update employee
   */
  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    user: RequestUser,
  ): Promise<EmployeeWithRelations> {
    // Fetch existing employee
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingEmployee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (existingEmployee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Validate salary and allowance if provided
    if (updateEmployeeDto.baseSalary !== undefined && updateEmployeeDto.baseSalary <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.SALARY_POSITIVE);
    }

    if (updateEmployeeDto.allowance !== undefined && updateEmployeeDto.allowance < 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.ALLOWANCE_POSITIVE);
    }

    // Build update data
    const updateData: Prisma.EmployeeUpdateInput = {};

    if (updateEmployeeDto.name !== undefined) {
      updateData.name = updateEmployeeDto.name;
    }

    if (updateEmployeeDto.position !== undefined) {
      updateData.position = updateEmployeeDto.position;
    }

    if (updateEmployeeDto.baseSalary !== undefined) {
      updateData.baseSalary = updateEmployeeDto.baseSalary;
    }

    if (updateEmployeeDto.allowance !== undefined) {
      updateData.allowance = updateEmployeeDto.allowance;
    }

    if (updateEmployeeDto.hireDate !== undefined) {
      updateData.hireDate = formatDateForDB(updateEmployeeDto.hireDate);
    }

    if (updateEmployeeDto.status !== undefined) {
      updateData.status = updateEmployeeDto.status;
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        salaryPayments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
        salaryIncreases: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    // Log the update in audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.EMPLOYEE,
      id,
      existingEmployee,
      employee,
    );

    return employee;
  }

  /**
   * Soft delete employee
   */
  async remove(id: string, user: RequestUser): Promise<void> {
    // Fetch existing employee
    const employee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Soft delete
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log the deletion in audit log
    await this.auditLogService.logDelete(
      user.id,
      AuditEntityType.EMPLOYEE,
      id,
      employee,
    );
  }

  /**
   * Get active employees for a branch
   */
  async getActive(branchId: string, user: RequestUser) {
    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    return await this.prisma.employee.findMany({
      where: {
        branchId,
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        position: true,
        baseSalary: true,
        allowance: true,
      },
    });
  }

  /**
   * Resign employee
   */
  async resign(
    id: string,
    resignEmployeeDto: ResignEmployeeDto,
    user: RequestUser,
  ): Promise<EmployeeWithRelations> {
    // Fetch existing employee
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingEmployee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    // Check branch access for accountants
    if (user.role === UserRole.ACCOUNTANT) {
      if (existingEmployee.branchId !== user.branchId) {
        throw new ForbiddenException(ERROR_MESSAGES.PERMISSION.BRANCH_ACCESS);
      }
    }

    // Validate employee is not already resigned
    if (existingEmployee.status === EmployeeStatus.RESIGNED) {
      throw new BadRequestException(ERROR_MESSAGES.EMPLOYEE.ALREADY_RESIGNED);
    }

    // Update employee status
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.RESIGNED,
        resignDate: formatDateForDB(resignEmployeeDto.resignDate),
      },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        salaryPayments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
        salaryIncreases: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
          include: {
            recorder: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    // Log the update in audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.EMPLOYEE,
      id,
      existingEmployee,
      employee,
    );

    return employee;
  }
}
