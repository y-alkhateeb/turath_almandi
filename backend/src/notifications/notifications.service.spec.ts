import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

// Mock enums
enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  SUCCESS = 'SUCCESS',
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let websocketGateway: WebSocketGatewayService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  const mockWebSocketGateway = {
    emitNewNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocketGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    websocketGateway = module.get<WebSocketGatewayService>(WebSocketGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyNewDebt', () => {
    const baseParams = {
      debtId: 'debt-1',
      creditorName: 'Test Creditor',
      amount: 5000,
      dueDate: new Date('2024-02-15'),
      branchId: 'branch-1',
      createdBy: 'user-1',
    };

    const mockNotification = {
      id: 'notif-1',
      type: 'new_debt',
      title: 'دين جديد: Test Creditor',
      message: expect.any(String),
      severity: NotificationSeverity.INFO,
      relatedId: 'debt-1',
      relatedType: 'DEBT',
      branchId: 'branch-1',
      createdBy: 'user-1',
      isRead: false,
      branch: { id: 'branch-1', name: 'Main Branch' },
      creator: { id: 'user-1', username: 'testuser' },
    };

    it('should create notification for large debt (>= $5000)', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        5000,
        baseParams.dueDate,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'new_debt',
          title: 'دين جديد: Test Creditor',
          message: expect.stringContaining('5000.00'),
          severity: NotificationSeverity.INFO,
          relatedId: 'debt-1',
          relatedType: 'DEBT',
          branchId: 'branch-1',
          createdBy: 'user-1',
          isRead: false,
        },
        include: expect.any(Object),
      });
      expect(mockWebSocketGateway.emitNewNotification).toHaveBeenCalledWith(mockNotification);
    });

    it('should create notification for debt with approaching due date (<= 7 days)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        1000, // Below threshold
        tomorrow, // But due soon
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should return null for small debt with distant due date', async () => {
      const distantFuture = new Date();
      distantFuture.setDate(distantFuture.getDate() + 30);

      const result = await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        1000, // Below threshold
        distantFuture, // Not urgent
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toBeNull();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });

    it('should use WARNING severity for very large debt (>= $10,000)', async () => {
      const warningNotification = {
        ...mockNotification,
        severity: NotificationSeverity.WARNING,
      };
      mockPrismaService.notification.create.mockResolvedValue(warningNotification);

      await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        10000,
        baseParams.dueDate,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: NotificationSeverity.WARNING,
        }),
        include: expect.any(Object),
      });
    });

    it('should use CRITICAL severity for extremely large debt (>= $25,000)', async () => {
      const criticalNotification = {
        ...mockNotification,
        severity: NotificationSeverity.CRITICAL,
      };
      mockPrismaService.notification.create.mockResolvedValue(criticalNotification);

      await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        25000,
        baseParams.dueDate,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: NotificationSeverity.CRITICAL,
        }),
        include: expect.any(Object),
      });
    });

    it('should use WARNING severity for debt due within 3 days', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);

      const warningNotification = {
        ...mockNotification,
        severity: NotificationSeverity.WARNING,
      };
      mockPrismaService.notification.create.mockResolvedValue(warningNotification);

      await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        5000,
        soon,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: NotificationSeverity.WARNING,
        }),
        include: expect.any(Object),
      });
    });

    it('should use custom threshold when provided', async () => {
      const result = await service.notifyNewDebt(
        baseParams.debtId,
        baseParams.creditorName,
        2000, // Below default threshold but above custom
        new Date('2024-03-15'), // Distant future
        baseParams.branchId,
        baseParams.createdBy,
        1000, // Custom threshold
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('notifyDebtPayment', () => {
    const baseParams = {
      debtId: 'debt-1',
      paymentId: 'payment-1',
      creditorName: 'Test Creditor',
      amountPaid: 3000,
      remainingAmount: 2000,
      branchId: 'branch-1',
      createdBy: 'user-1',
    };

    const mockNotification = {
      id: 'notif-1',
      type: 'debt_payment',
      title: 'دفعة دين: Test Creditor',
      message: expect.any(String),
      severity: NotificationSeverity.INFO,
      relatedId: 'debt-1',
      relatedType: 'DEBT',
      branchId: 'branch-1',
      createdBy: 'user-1',
      isRead: false,
      branch: { id: 'branch-1', name: 'Main Branch' },
      creator: { id: 'user-1', username: 'testuser' },
    };

    it('should create notification for large payment (>= $3000)', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        3000,
        baseParams.remainingAmount,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          type: 'debt_payment',
          title: 'دفعة دين: Test Creditor',
          message: expect.stringContaining('3000.00'),
          severity: NotificationSeverity.INFO,
          relatedId: 'debt-1',
          relatedType: 'DEBT',
          branchId: 'branch-1',
          createdBy: 'user-1',
          isRead: false,
        },
        include: expect.any(Object),
      });
      expect(mockWebSocketGateway.emitNewNotification).toHaveBeenCalledWith(mockNotification);
    });

    it('should create notification for fully paid debt with SUCCESS severity', async () => {
      const successNotification = {
        ...mockNotification,
        type: 'debt_paid',
        severity: NotificationSeverity.SUCCESS,
      };
      mockPrismaService.notification.create.mockResolvedValue(successNotification);

      const result = await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        1000,
        0, // Fully paid
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toEqual(successNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'debt_paid',
          severity: NotificationSeverity.SUCCESS,
          message: expect.stringContaining('بالكامل'),
        }),
        include: expect.any(Object),
      });
    });

    it('should return null for small payment below threshold', async () => {
      const result = await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        500, // Below threshold
        5000, // Not fully paid
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toBeNull();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });

    it('should use WARNING severity for very large payment (>= $6000)', async () => {
      const warningNotification = {
        ...mockNotification,
        severity: NotificationSeverity.WARNING,
      };
      mockPrismaService.notification.create.mockResolvedValue(warningNotification);

      await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        6000,
        1000,
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: NotificationSeverity.WARNING,
        }),
        include: expect.any(Object),
      });
    });

    it('should create notification for small payment if debt is fully paid', async () => {
      const successNotification = {
        ...mockNotification,
        type: 'debt_paid',
        severity: NotificationSeverity.SUCCESS,
      };
      mockPrismaService.notification.create.mockResolvedValue(successNotification);

      const result = await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        100, // Below threshold but debt is paid
        0, // Fully paid
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'debt_paid',
          severity: NotificationSeverity.SUCCESS,
        }),
        include: expect.any(Object),
      });
    });

    it('should use custom threshold when provided', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        1500, // Below default threshold but above custom
        5000,
        baseParams.branchId,
        baseParams.createdBy,
        1000, // Custom threshold
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should include remaining amount in message for partial payment', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      await service.notifyDebtPayment(
        baseParams.debtId,
        baseParams.paymentId,
        baseParams.creditorName,
        3000,
        2000, // Remaining
        baseParams.branchId,
        baseParams.createdBy,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: expect.stringMatching(/2000\.00.*المتبقي/),
        }),
        include: expect.any(Object),
      });
    });
  });
});
