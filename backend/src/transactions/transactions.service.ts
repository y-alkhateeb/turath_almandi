import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType, Currency, UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, user: RequestUser) {
    // Validate user has a branch assigned
    if (!user.branchId) {
      throw new ForbiddenException('User must be assigned to a branch to create transactions');
    }

    // Validate amount is positive
    if (createTransactionDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate payment method for income transactions
    if (createTransactionDto.type === TransactionType.INCOME) {
      if (createTransactionDto.paymentMethod &&
          !['CASH', 'MASTER'].includes(createTransactionDto.paymentMethod)) {
        throw new BadRequestException('Payment method must be either CASH or MASTER for income transactions');
      }
    }

    // Build transaction data
    const transactionData = {
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      date: new Date(createTransactionDto.date),
      paymentMethod: createTransactionDto.paymentMethod || null,
      category: createTransactionDto.category || 'General',
      employeeVendorName: createTransactionDto.employeeVendorName || 'N/A',
      notes: createTransactionDto.notes || null,
      currency: Currency.USD, // Default currency
      branchId: user.branchId, // Auto-fill from logged user
      createdBy: user.id,
    };

    return this.prisma.transaction.create({
      data: transactionData,
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(branchId?: string) {
    const where = branchId ? { branchId } : {};

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        branch: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }
}
