import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountReasonDto } from './dto/create-discount-reason.dto';
import { UpdateDiscountReasonDto } from './dto/update-discount-reason.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Injectable()
export class DiscountReasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiscountReasonDto) {
    // Check if reason already exists
    const existing = await this.prisma.discountReason.findFirst({
      where: {
        reason: dto.reason,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException(`السبب "${dto.reason}" موجود بالفعل`);
    }

    return this.prisma.discountReason.create({
      data: {
        reason: dto.reason,
        description: dto.description || null,
        isDefault: dto.isDefault || false,
        sortOrder: dto.sortOrder || 999,
      },
    });
  }

  async findAll() {
    return this.prisma.discountReason.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { reason: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const reason = await this.prisma.discountReason.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!reason) {
      throw new NotFoundException(`السبب غير موجود`);
    }

    return reason;
  }

  async update(id: string, dto: UpdateDiscountReasonDto) {
    await this.findOne(id); // Validate exists

    // If updating reason, check uniqueness
    if (dto.reason) {
      const existing = await this.prisma.discountReason.findFirst({
        where: {
          reason: dto.reason,
          id: { not: id },
          isDeleted: false,
        },
      });

      if (existing) {
        throw new BadRequestException(`السبب "${dto.reason}" موجود بالفعل`);
      }
    }

    return this.prisma.discountReason.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, user: RequestUser) {
    await this.findOne(id); // Validate exists

    return this.prisma.discountReason.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
  }
}
