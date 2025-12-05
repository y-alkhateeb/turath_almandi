import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/types/prisma-enums';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { applyBranchFilter } from '../common/utils/query-builder';
import { BRANCH_SELECT, USER_SELECT, CONTACT_SELECT } from '../common/constants/prisma-includes';
import { ERROR_MESSAGES } from '../common/constants/error-messages';
import { RequestUser } from '../common/interfaces';

// Type for contact with relations
type ContactWithRelations = Prisma.ContactGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
  };
}>;

// Type for contact with full relations including counts
type ContactWithFullRelations = Prisma.ContactGetPayload<{
  include: {
    branch: {
      select: typeof BRANCH_SELECT;
    };
    creator: {
      select: typeof USER_SELECT;
    };
    _count: {
      select: {
        accountsPayable: true;
        accountsReceivable: true;
      };
    };
  };
}>;

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new contact
   * Branch filtering: accountants can only create contacts for their branch
   * Validates: no duplicate name within the same branch
   */
  async create(createContactDto: CreateContactDto, user: RequestUser): Promise<ContactWithRelations> {
    // Determine branch ID
    let branchId: string;

    if (user.role === UserRole.ACCOUNTANT) {
      if (!user.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.CONTACT.BRANCH_REQUIRED);
      }
      branchId = user.branchId;
    } else {
      // Admins must specify a branch (now required)
      if (!createContactDto.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.CONTACT.BRANCH_REQUIRED);
      }
      branchId = createContactDto.branchId;
    }

    // Check for duplicate name within the same branch
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        name: createContactDto.name,
        branchId,
        isDeleted: false,
      },
    });

    if (existingContact) {
      throw new ConflictException(ERROR_MESSAGES.CONTACT.DUPLICATE_NAME);
    }

    // Create the contact
    const contact = await this.prisma.contact.create({
      data: {
        name: createContactDto.name,
        type: createContactDto.type,
        phone: createContactDto.phone,
        email: createContactDto.email,
        address: createContactDto.address,
        creditLimit: createContactDto.creditLimit,
        notes: createContactDto.notes,
        branchId,
        createdBy: user.id,
      },
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logCreate(
      user.id,
      AuditEntityType.CONTACT,
      contact.id,
      { name: contact.name, type: contact.type, branchId: contact.branchId },
    );

    return contact;
  }

  /**
   * Find all contacts with pagination and filtering
   * Branch filtering: accountants see only their branch contacts
   */
  async findAll(user: RequestUser, query: QueryContactsDto) {
    const { page = 1, limit = 50, search, type, branchId } = query;

    // Build where clause
    const where: Prisma.ContactWhereInput = {
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where, branchId);

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply type filter
    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await this.prisma.contact.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get contacts
    const contacts = await this.prisma.contact.findMany({
      where,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data: contacts,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find one contact by ID
   * Branch filtering: accountants can only view their branch contacts
   */
  async findOne(id: string, user: RequestUser): Promise<ContactWithFullRelations> {
    const where: Prisma.ContactWhereInput = {
      id,
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where);

    const contact = await this.prisma.contact.findFirst({
      where,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
        _count: {
          select: {
            accountsPayable: {
              where: { isDeleted: false },
            },
            accountsReceivable: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(ERROR_MESSAGES.CONTACT.NOT_FOUND);
    }

    return contact;
  }

  /**
   * Update a contact
   * Branch filtering: accountants can only update their branch contacts
   */
  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    user: RequestUser,
  ): Promise<ContactWithRelations> {
    // Find the contact first (with branch filtering)
    const existingContact = await this.findOne(id, user);

    // Validate branchId if provided (must be valid UUID and not null)
    if (updateContactDto.branchId !== undefined) {
      if (!updateContactDto.branchId) {
        throw new BadRequestException(ERROR_MESSAGES.CONTACT.BRANCH_REQUIRED);
      }
    }

    // Check for duplicate name if name is being updated
    const branchIdForDuplicateCheck = updateContactDto.branchId || existingContact.branchId;
    if (updateContactDto.name && updateContactDto.name !== existingContact.name) {
      const duplicateContact = await this.prisma.contact.findFirst({
        where: {
          name: updateContactDto.name,
          branchId: branchIdForDuplicateCheck,
          isDeleted: false,
          id: { not: id },
        },
      });

      if (duplicateContact) {
        throw new ConflictException(ERROR_MESSAGES.CONTACT.DUPLICATE_NAME);
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: Prisma.ContactUpdateInput = {};
    if (updateContactDto.name !== undefined) updateData.name = updateContactDto.name;
    if (updateContactDto.type !== undefined) updateData.type = updateContactDto.type;
    if (updateContactDto.phone !== undefined) updateData.phone = updateContactDto.phone;
    if (updateContactDto.email !== undefined) updateData.email = updateContactDto.email;
    if (updateContactDto.address !== undefined) updateData.address = updateContactDto.address;
    if (updateContactDto.creditLimit !== undefined) updateData.creditLimit = updateContactDto.creditLimit;
    if (updateContactDto.notes !== undefined) updateData.notes = updateContactDto.notes;
    if (updateContactDto.branchId !== undefined) updateData.branch = { connect: { id: updateContactDto.branchId } };

    // Update the contact
    const updatedContact = await this.prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: BRANCH_SELECT,
        },
        creator: {
          select: USER_SELECT,
        },
      },
    });

    // Audit log
    await this.auditLogService.logUpdate(
      user.id,
      AuditEntityType.CONTACT,
      id,
      {
        name: existingContact.name,
        type: existingContact.type,
      },
      {
        name: updatedContact.name,
        type: updatedContact.type,
      },
    );

    return updatedContact;
  }

  /**
   * Soft delete a contact
   * Branch filtering: accountants can only delete their branch contacts
   * Validates: no linked payables or receivables
   */
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    // Find the contact first (with branch filtering)
    const contact = await this.findOne(id, user);

    // Check for linked payables
    const payablesCount = await this.prisma.accountPayable.count({
      where: {
        contactId: id,
        isDeleted: false,
      },
    });

    if (payablesCount > 0) {
      throw new BadRequestException(ERROR_MESSAGES.CONTACT.LINKED_PAYABLES);
    }

    // Check for linked receivables
    const receivablesCount = await this.prisma.accountReceivable.count({
      where: {
        contactId: id,
        isDeleted: false,
      },
    });

    if (receivablesCount > 0) {
      throw new BadRequestException(ERROR_MESSAGES.CONTACT.LINKED_RECEIVABLES);
    }

    // Soft delete the contact
    await this.prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        isDeleted: true,
      },
    });

    // Audit log
    await this.auditLogService.logDelete(user.id, AuditEntityType.CONTACT, id, {
      name: contact.name,
      type: contact.type,
    });

    return { message: 'تم حذف جهة الاتصال بنجاح' };
  }

  /**
   * Get contacts summary statistics
   * Branch filtering: accountants see only their branch stats
   */
  async getSummary(user: RequestUser, branchId?: string) {
    const where: Prisma.ContactWhereInput = {
      isDeleted: false,
    };

    // Apply branch filter
    applyBranchFilter(user, where, branchId);

    const [total, suppliers, customers, both, other] = await Promise.all([
      this.prisma.contact.count({ where }),
      this.prisma.contact.count({ where: { ...where, type: 'SUPPLIER' } }),
      this.prisma.contact.count({ where: { ...where, type: 'CUSTOMER' } }),
      this.prisma.contact.count({ where: { ...where, type: 'BOTH' } }),
      this.prisma.contact.count({ where: { ...where, type: 'OTHER' } }),
    ]);

    return {
      total,
      byType: {
        suppliers,
        customers,
        both,
        other,
      },
    };
  }
}
