import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log/audit-log.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Mock enums to avoid Prisma client generation dependencies
enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

enum DebtStatus {
  ACTIVE = 'ACTIVE',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

describe('DebtsService', () => {
  let service: DebtsService;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let websocketGateway: WebSocketGatewayService;

  const mockPrismaService = {
    debt: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    debtPayment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLogService = {
    logCreate: jest.fn(),
    logUpdate: jest.fn(),
  };

  const mockWebSocketGateway = {
    emitNewDebt: jest.fn(),
    emitDebtUpdate: jest.fn(),
    emitDebtPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocketGateway,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
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

    const createDebtDto = {
      creditorName: 'Test Creditor',
      amount: 1000,
      date: '2024-01-15',
      dueDate: '2024-02-15',
      notes: 'Test debt',
      branchId: undefined,
    };

    const mockDebt = {
      id: 'debt-1',
      creditorName: 'Test Creditor',
      originalAmount: 1000,
      remainingAmount: 1000,
      status: DebtStatus.ACTIVE,
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      notes: 'Test debt',
      branchId: 'branch-1',
      createdBy: 'user-1',
      branch: {
        id: 'branch-1',
        name: 'Main Branch',
        location: 'Main St',
      },
      creator: {
        id: 'user-1',
        username: 'testuser',
      },
    };

    it('should create a debt for accountant with their branch', async () => {
      mockPrismaService.debt.create.mockResolvedValue(mockDebt);

      const result = await service.create(createDebtDto, mockUser);

      expect(result).toEqual(mockDebt);
      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creditorName: 'Test Creditor',
          originalAmount: 1000,
          remainingAmount: 1000,
          status: DebtStatus.ACTIVE,
          branchId: 'branch-1',
          createdBy: 'user-1',
        }),
        include: expect.any(Object),
      });
      expect(mockAuditLogService.logCreate).toHaveBeenCalledWith(
        'user-1',
        'DEBT',
        'debt-1',
        mockDebt,
      );
      expect(mockWebSocketGateway.emitNewDebt).toHaveBeenCalledWith(mockDebt);
    });

    it('should throw ForbiddenException if accountant has no branch', async () => {
      const userWithoutBranch = { ...mockUser, branchId: null };

      await expect(service.create(createDebtDto, userWithoutBranch)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create debt for admin with provided branchId', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        branchId: null,
      };

      const dtoWithBranch = { ...createDebtDto, branchId: 'branch-2' };

      mockPrismaService.debt.create.mockResolvedValue({
        ...mockDebt,
        branchId: 'branch-2',
      });

      await service.create(dtoWithBranch, adminUser);

      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: 'branch-2',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if admin does not provide branchId', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        branchId: null,
      };

      await expect(service.create(createDebtDto, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if amount is not positive', async () => {
      const invalidDto = { ...createDebtDto, amount: -100 };

      await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dueDate is before date', async () => {
      const invalidDto = {
        ...createDebtDto,
        date: '2024-02-15',
        dueDate: '2024-01-15',
      };

      await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const mockDebts = [
      {
        id: 'debt-1',
        creditorName: 'Creditor 1',
        originalAmount: 1000,
        remainingAmount: 500,
        status: DebtStatus.PARTIAL,
        date: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        notes: null,
        branchId: 'branch-1',
        createdBy: 'user-1',
        branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
        creator: { id: 'user-1', username: 'testuser' },
        payments: [
          {
            id: 'payment-1',
            amountPaid: 500,
            paymentDate: new Date('2024-01-20'),
          },
        ],
      },
      {
        id: 'debt-2',
        creditorName: 'Creditor 2',
        originalAmount: 2000,
        remainingAmount: 2000,
        status: DebtStatus.ACTIVE,
        date: new Date('2024-01-10'),
        dueDate: new Date('2024-02-10'),
        notes: null,
        branchId: 'branch-1',
        createdBy: 'user-1',
        branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
        creator: { id: 'user-1', username: 'testuser' },
        payments: [],
      },
    ];

    it('should return paginated debts for accountant', async () => {
      mockPrismaService.debt.count.mockResolvedValue(2);
      mockPrismaService.debt.findMany.mockResolvedValue(mockDebts);

      const result = await service.findAll(mockUser, { page: 1, limit: 50 });

      expect(result).toEqual({
        data: mockDebts,
        meta: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      });

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        orderBy: { dueDate: 'asc' },
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });

    it('should return all debts for admin without branch filter', async () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        branchId: null,
      };

      mockPrismaService.debt.count.mockResolvedValue(10);
      mockPrismaService.debt.findMany.mockResolvedValue(mockDebts);

      await service.findAll(adminUser, { page: 1, limit: 50 });

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { dueDate: 'asc' },
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.debt.count.mockResolvedValue(100);
      mockPrismaService.debt.findMany.mockResolvedValue(mockDebts);

      const result = await service.findAll(mockUser, { page: 3, limit: 20 });

      expect(result.meta).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
      });

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 40, // (page 3 - 1) * 20
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should use default pagination values', async () => {
      mockPrismaService.debt.count.mockResolvedValue(2);
      mockPrismaService.debt.findMany.mockResolvedValue(mockDebts);

      await service.findAll(mockUser, {});

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 50,
        include: expect.any(Object),
      });
    });
  });

  describe('payDebt', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const payDebtDto = {
      amountPaid: 500,
      paymentDate: '2024-01-20',
      notes: 'Partial payment',
    };

    const mockDebt = {
      id: 'debt-1',
      creditorName: 'Test Creditor',
      originalAmount: 1000,
      remainingAmount: 1000,
      status: DebtStatus.ACTIVE,
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      notes: null,
      branchId: 'branch-1',
      createdBy: 'user-1',
      branch: { id: 'branch-1', name: 'Main Branch', location: 'Main St' },
      creator: { id: 'user-1', username: 'testuser' },
    };

    const mockPayment = {
      id: 'payment-1',
      debtId: 'debt-1',
      amountPaid: 500,
      paymentDate: new Date('2024-01-20'),
      notes: 'Partial payment',
      recordedBy: 'user-1',
    };

    const mockUpdatedDebt = {
      ...mockDebt,
      remainingAmount: 500,
      status: DebtStatus.PARTIAL,
      payments: [mockPayment],
    };

    it('should pay debt and update status to PARTIAL', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
            update: jest.fn().mockResolvedValue(mockUpdatedDebt),
          },
          debtPayment: {
            create: jest.fn().mockResolvedValue(mockPayment),
          },
        };

        return callback(tx);
      });

      const result = await service.payDebt('debt-1', payDebtDto, mockUser);

      expect(result).toEqual(mockUpdatedDebt);
      expect(mockAuditLogService.logCreate).toHaveBeenCalledWith(
        'user-1',
        'DEBT_PAYMENT',
        'payment-1',
        mockPayment,
      );
      expect(mockAuditLogService.logUpdate).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitDebtPayment).toHaveBeenCalledWith(mockPayment);
      expect(mockWebSocketGateway.emitDebtUpdate).toHaveBeenCalledWith(mockUpdatedDebt);
    });

    it('should pay debt fully and update status to PAID', async () => {
      const fullPaymentDto = {
        amountPaid: 1000,
        paymentDate: '2024-01-20',
        notes: 'Full payment',
      };

      const paidDebt = {
        ...mockDebt,
        remainingAmount: 0,
        status: DebtStatus.PAID,
        payments: [{ ...mockPayment, amountPaid: 1000 }],
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
            update: jest.fn().mockResolvedValue(paidDebt),
          },
          debtPayment: {
            create: jest.fn().mockResolvedValue({ ...mockPayment, amountPaid: 1000 }),
          },
        };

        return callback(tx);
      });

      const result = await service.payDebt('debt-1', fullPaymentDto, mockUser);

      expect(result.status).toBe(DebtStatus.PAID);
      expect(result.remainingAmount).toBe(0);
    });

    it('should throw ForbiddenException if user has no branch', async () => {
      const userWithoutBranch = { ...mockUser, branchId: null };

      await expect(service.payDebt('debt-1', payDebtDto, userWithoutBranch)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if payment amount is not positive', async () => {
      const invalidDto = { ...payDebtDto, amountPaid: -100 };

      await expect(service.payDebt('debt-1', invalidDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if debt does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };

        return callback(tx);
      });

      await expect(service.payDebt('non-existent', payDebtDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if accountant tries to pay debt from different branch', async () => {
      const differentBranchDebt = {
        ...mockDebt,
        branchId: 'branch-2',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(differentBranchDebt),
          },
        };

        return callback(tx);
      });

      await expect(service.payDebt('debt-1', payDebtDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if payment exceeds remaining amount', async () => {
      const excessivePaymentDto = {
        amountPaid: 1500,
        paymentDate: '2024-01-20',
        notes: 'Too much',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          debt: {
            findUnique: jest.fn().mockResolvedValue(mockDebt),
          },
        };

        return callback(tx);
      });

      await expect(service.payDebt('debt-1', excessivePaymentDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
