import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log/audit-log.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { SettingsService } from '../settings/settings.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Mock enums to avoid Prisma client generation dependencies
enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

enum PaymentMethod {
  CASH = 'CASH',
  MASTER = 'MASTER',
  CREDIT = 'CREDIT',
}

enum Currency {
  USD = 'USD',
  IQD = 'IQD',
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let inventoryService: InventoryService;
  let notificationsService: NotificationsService;
  let websocketGateway: WebSocketGatewayService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditLogService = {
    logCreate: jest.fn(),
    logUpdate: jest.fn(),
    logDelete: jest.fn(),
  };

  const mockInventoryService = {
    updateFromPurchase: jest.fn(),
  };

  const mockNotificationsService = {
    notifyNewTransaction: jest.fn().mockResolvedValue(undefined),
  };

  const mockWebSocketGateway = {
    emitNewTransaction: jest.fn(),
    emitTransactionUpdate: jest.fn(),
  };

  const mockSettingsService = {
    getDefaultCurrency: jest.fn().mockResolvedValue({
      id: 'currency-1',
      code: 'IQD',
      name_ar: 'دينار عراقي',
      name_en: 'Iraqi Dinar',
      symbol: 'د.ع',
      is_default: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocketGateway,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    inventoryService = module.get<InventoryService>(InventoryService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    websocketGateway = module.get<WebSocketGatewayService>(WebSocketGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const createTransactionDto = {
      type: TransactionType.INCOME,
      amount: 1000,
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      category: 'Sales',
      employeeVendorName: 'Customer A',
      notes: 'Test transaction',
    };

    const mockTransaction = {
      id: 'transaction-1',
      type: TransactionType.INCOME,
      amount: 1000,
      date: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      category: 'Sales',
      employeeVendorName: 'Customer A',
      notes: 'Test transaction',
      currency: Currency.USD,
      branchId: 'branch-1',
      createdBy: 'user-1',
      inventoryItemId: null,
      branch: {
        id: 'branch-1',
        name: 'Main Branch',
        location: 'Main St',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      creator: {
        id: 'user-1',
        username: 'testuser',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a transaction successfully', async () => {
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(createTransactionDto, mockUser);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: TransactionType.INCOME,
          amount: 1000,
          category: 'Sales',
          branchId: 'branch-1',
          createdBy: 'user-1',
          // Note: currency is auto-applied by service from default currency settings
        }),
        include: expect.any(Object),
      });
      expect(mockAuditLogService.logCreate).toHaveBeenCalledWith(
        'user-1',
        'TRANSACTION',
        'transaction-1',
        mockTransaction,
      );
      expect(mockNotificationsService.notifyNewTransaction).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitNewTransaction).toHaveBeenCalledWith(mockTransaction);
    });

    it('should throw ForbiddenException if user has no branch', async () => {
      const userWithoutBranch = { ...mockUser, branchId: null };

      await expect(service.create(createTransactionDto, userWithoutBranch)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if amount is not positive', async () => {
      const invalidDto = { ...createTransactionDto, amount: -100 };

      await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount is zero', async () => {
      const invalidDto = { ...createTransactionDto, amount: 0 };

      await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid payment method on income transaction', async () => {
      const invalidDto = {
        ...createTransactionDto,
        type: TransactionType.INCOME,
        paymentMethod: PaymentMethod.CREDIT,
      };

      await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should allow CASH payment method for income transaction', async () => {
      const dto = {
        ...createTransactionDto,
        type: TransactionType.INCOME,
        paymentMethod: PaymentMethod.CASH,
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(dto, mockUser);

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });

    it('should allow MASTER payment method for income transaction', async () => {
      const dto = {
        ...createTransactionDto,
        type: TransactionType.INCOME,
        paymentMethod: PaymentMethod.MASTER,
      };

      mockPrismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        paymentMethod: PaymentMethod.MASTER,
      });

      await service.create(dto, mockUser);

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });

    it('should use default category "General" if not provided', async () => {
      const dtoWithoutCategory = { ...createTransactionDto, category: undefined };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(dtoWithoutCategory, mockUser);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: 'General',
        }),
        include: expect.any(Object),
      });
    });

    it('should use default employeeVendorName "N/A" if not provided', async () => {
      const dtoWithoutVendor = { ...createTransactionDto, employeeVendorName: undefined };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(dtoWithoutVendor, mockUser);

      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeVendorName: 'N/A',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const mockTransactions = [
      {
        id: 'transaction-1',
        type: TransactionType.INCOME,
        amount: 1000,
        date: new Date('2024-01-15'),
        paymentMethod: PaymentMethod.CASH,
        category: 'Sales',
        employeeVendorName: 'Customer A',
        notes: null,
        currency: Currency.USD,
        branchId: 'branch-1',
        createdBy: 'user-1',
        inventoryItemId: null,
        branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
        creator: { id: 'user-1', username: 'testuser' },
        inventoryItem: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'transaction-2',
        type: TransactionType.EXPENSE,
        amount: 500,
        date: new Date('2024-01-14'),
        paymentMethod: null,
        category: 'Supplies',
        employeeVendorName: 'Vendor B',
        notes: null,
        currency: Currency.USD,
        branchId: 'branch-1',
        createdBy: 'user-1',
        inventoryItemId: null,
        branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
        creator: { id: 'user-1', username: 'testuser' },
        inventoryItem: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return paginated transactions for accountant', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(2);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll(mockUser, { page: 1, limit: 50 });

      expect(result).toEqual({
        data: mockTransactions,
        meta: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });

    it('should return all transactions for admin without branch filter', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        branchId: null,
      };

      mockPrismaService.transaction.count.mockResolvedValue(10);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      await service.findAll(adminUser, { page: 1, limit: 50 });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'desc' },
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(100);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll(mockUser, { page: 3, limit: 20 });

      expect(result.meta).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 40, // (page 3 - 1) * 20
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should filter by transaction type', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      await service.findAll(mockUser, {}, { type: TransactionType.INCOME });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: TransactionType.INCOME,
        }),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
        include: expect.any(Object),
      });
    });

    it('should filter by category', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      await service.findAll(mockUser, {}, { category: 'Sales' });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: 'Sales',
        }),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
        include: expect.any(Object),
      });
    });

    it('should filter by payment method', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      await service.findAll(mockUser, {}, { paymentMethod: PaymentMethod.CASH });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          paymentMethod: PaymentMethod.CASH,
        }),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
        include: expect.any(Object),
      });
    });

    it('should filter by date range', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      await service.findAll(
        mockUser,
        {},
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      );

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: expect.any(Object),
        }),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number),
        include: expect.any(Object),
      });
    });

    it('should use default pagination values', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(2);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      await service.findAll(mockUser, {});

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const existingTransaction = {
      id: 'transaction-1',
      type: TransactionType.INCOME,
      amount: 1000,
      date: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      category: 'Sales',
      employeeVendorName: 'Customer A',
      notes: 'Old notes',
      currency: Currency.USD,
      branchId: 'branch-1',
      createdBy: 'user-1',
      inventoryItemId: null,
      branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
      creator: { id: 'user-1', username: 'testuser' },
      inventoryItem: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTransaction = {
      ...existingTransaction,
      amount: 1500,
      notes: 'Updated notes',
    };

    const updateDto = {
      amount: 1500,
      notes: 'Updated notes',
    };

    it('should update a transaction successfully', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await service.update('transaction-1', updateDto, mockUser);

      expect(result).toEqual(updatedTransaction);
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
        data: expect.objectContaining({
          amount: 1500,
          notes: 'Updated notes',
        }),
        include: expect.any(Object),
      });
      expect(mockAuditLogService.logUpdate).toHaveBeenCalledWith(
        'user-1',
        'TRANSACTION',
        'transaction-1',
        existingTransaction,
        updatedTransaction,
      );
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if accountant tries to update different branch transaction', async () => {
      const differentBranchTransaction = {
        ...existingTransaction,
        branchId: 'branch-2',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(differentBranchTransaction);

      await expect(service.update('transaction-1', updateDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if updated amount is not positive', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);

      const invalidDto = { amount: -100 };

      await expect(service.update('transaction-1', invalidDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if updated amount is zero', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);

      const invalidDto = { amount: 0 };

      await expect(service.update('transaction-1', invalidDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid payment method on income transaction', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);

      const invalidDto = {
        type: TransactionType.INCOME,
        paymentMethod: PaymentMethod.CREDIT,
      };

      await expect(service.update('transaction-1', invalidDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow partial updates', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);
      mockPrismaService.transaction.update.mockResolvedValue({
        ...existingTransaction,
        category: 'Updated Category',
      });

      await service.update('transaction-1', { category: 'Updated Category' }, mockUser);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
        data: expect.objectContaining({
          category: 'Updated Category',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const existingTransaction = {
      id: 'transaction-1',
      type: TransactionType.INCOME,
      amount: 1000,
      date: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      category: 'Sales',
      employeeVendorName: 'Customer A',
      notes: null,
      currency: Currency.USD,
      branchId: 'branch-1',
      createdBy: 'user-1',
      inventoryItemId: null,
      branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
      creator: { id: 'user-1', username: 'testuser' },
      inventoryItem: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete a transaction successfully', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);
      mockPrismaService.transaction.delete.mockResolvedValue(existingTransaction);

      const result = await service.remove('transaction-1', mockUser);

      expect(result).toEqual({
        message: 'Transaction deleted successfully',
        id: 'transaction-1',
      });
      expect(mockPrismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
      });
      expect(mockAuditLogService.logDelete).toHaveBeenCalledWith(
        'user-1',
        'TRANSACTION',
        'transaction-1',
        existingTransaction,
      );
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if accountant tries to delete different branch transaction', async () => {
      const differentBranchTransaction = {
        ...existingTransaction,
        branchId: 'branch-2',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(differentBranchTransaction);

      await expect(service.remove('transaction-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any transaction', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        branchId: null,
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(existingTransaction);
      mockPrismaService.transaction.delete.mockResolvedValue(existingTransaction);

      await service.remove('transaction-1', adminUser);

      expect(mockPrismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'transaction-1' },
      });
    });
  });
});
