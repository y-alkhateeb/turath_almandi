import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSettingsService } from './notification-settings.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock enums
enum DisplayMethod {
  POPUP = 'POPUP',
  TOAST = 'TOAST',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

describe('NotificationSettingsService', () => {
  let service: NotificationSettingsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    role: 'ACCOUNTANT',
  };

  const mockSetting = {
    id: 'setting-1',
    userId: 'user-1',
    notificationType: 'new_debt',
    isEnabled: true,
    minAmount: 5000,
    selectedBranches: ['branch-1', 'branch-2'],
    displayMethod: DisplayMethod.POPUP,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationSettingsService>(NotificationSettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return all settings for a user', async () => {
      const settings = [mockSetting];
      mockPrismaService.notificationSetting.findMany.mockResolvedValue(settings);

      const result = await service.getUserSettings('user-1');

      expect(result).toEqual(settings);
      expect(mockPrismaService.notificationSetting.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: {
          notificationType: 'asc',
        },
      });
    });

    it('should return empty array if no settings exist', async () => {
      mockPrismaService.notificationSetting.findMany.mockResolvedValue([]);

      const result = await service.getUserSettings('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateSettings', () => {
    it('should create new setting if it does not exist', async () => {
      const updateDto = {
        notificationType: 'new_debt',
        isEnabled: true,
        minAmount: 5000,
        selectedBranches: ['branch-1'],
        displayMethod: DisplayMethod.POPUP,
      };

      mockPrismaService.notificationSetting.upsert.mockResolvedValue(mockSetting);

      const result = await service.updateSettings('user-1', updateDto);

      expect(result).toEqual(mockSetting);
      expect(mockPrismaService.notificationSetting.upsert).toHaveBeenCalledWith({
        where: {
          userId_notificationType: {
            userId: 'user-1',
            notificationType: 'new_debt',
          },
        },
        update: {
          isEnabled: true,
          minAmount: 5000,
          selectedBranches: ['branch-1'],
          displayMethod: DisplayMethod.POPUP,
        },
        create: {
          userId: 'user-1',
          notificationType: 'new_debt',
          isEnabled: true,
          minAmount: 5000,
          selectedBranches: ['branch-1'],
          displayMethod: DisplayMethod.POPUP,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
    });

    it('should update existing setting', async () => {
      const updateDto = {
        notificationType: 'new_debt',
        isEnabled: false,
      };

      const updatedSetting = { ...mockSetting, isEnabled: false };
      mockPrismaService.notificationSetting.upsert.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings('user-1', updateDto);

      expect(result.isEnabled).toBe(false);
      expect(mockPrismaService.notificationSetting.upsert).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const updateDto = {
        notificationType: 'new_debt',
        minAmount: 10000,
      };

      mockPrismaService.notificationSetting.upsert.mockResolvedValue({
        ...mockSetting,
        minAmount: 10000,
      });

      const result = await service.updateSettings('user-1', updateDto);

      expect(result.minAmount).toBe(10000);
    });
  });

  describe('getSetting', () => {
    it('should return a specific setting', async () => {
      mockPrismaService.notificationSetting.findUnique.mockResolvedValue(mockSetting);

      const result = await service.getSetting('user-1', 'new_debt');

      expect(result).toEqual(mockSetting);
      expect(mockPrismaService.notificationSetting.findUnique).toHaveBeenCalledWith({
        where: {
          userId_notificationType: {
            userId: 'user-1',
            notificationType: 'new_debt',
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
    });

    it('should return null if setting not found', async () => {
      mockPrismaService.notificationSetting.findUnique.mockResolvedValue(null);

      const result = await service.getSetting('user-1', 'non_existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteSetting', () => {
    it('should delete a notification setting', async () => {
      mockPrismaService.notificationSetting.delete.mockResolvedValue(mockSetting);

      await service.deleteSetting('user-1', 'new_debt');

      expect(mockPrismaService.notificationSetting.delete).toHaveBeenCalledWith({
        where: {
          userId_notificationType: {
            userId: 'user-1',
            notificationType: 'new_debt',
          },
        },
      });
    });
  });

  describe('getEnabledNotificationTypes', () => {
    it('should return only enabled notification types', async () => {
      const enabledSettings = [
        { notificationType: 'new_debt' },
        { notificationType: 'debt_payment' },
      ];

      mockPrismaService.notificationSetting.findMany.mockResolvedValue(enabledSettings);

      const result = await service.getEnabledNotificationTypes('user-1');

      expect(result).toEqual(['new_debt', 'debt_payment']);
      expect(mockPrismaService.notificationSetting.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isEnabled: true,
        },
        select: {
          notificationType: true,
        },
      });
    });

    it('should return empty array if no enabled settings', async () => {
      mockPrismaService.notificationSetting.findMany.mockResolvedValue([]);

      const result = await service.getEnabledNotificationTypes('user-1');

      expect(result).toEqual([]);
    });
  });
});
