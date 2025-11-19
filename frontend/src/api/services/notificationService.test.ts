/**
 * Notification Service Tests
 * Tests for notification management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { Notification, NotificationSettings, UpdateNotificationSettingsInput } from '#/entity';
import type { PaginatedResponse, NotificationQueryFilters } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as notificationService from './notificationService';
import { NotificationApiEndpoints } from './notificationService';

describe('notificationService', () => {
  const mockNotification: Notification = {
    id: 'notif-123',
    type: 'TRANSACTION_CREATED',
    title: 'New Transaction',
    message: 'Transaction created',
    isRead: false,
    userId: 'user-123',
    branchId: 'branch-123',
    relatedEntityId: 'entity-123',
    createdAt: '2024-01-01T00:00:00Z',
    readAt: null,
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    const mockPaginatedResponse: PaginatedResponse<Notification> = {
      data: [mockNotification],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get all notifications without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await notificationService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: NotificationApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get notifications with filters', async () => {
      const filters: NotificationQueryFilters = {
        branchId: 'branch-123',
        isRead: false,
        type: 'TRANSACTION_CREATED',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await notificationService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: NotificationApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(notificationService.getAll()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      const mockCount = { count: 5 };
      mockApiClient.get.mockReturnValue(mockSuccess(mockCount));

      const result = await notificationService.getUnreadCount();

      expect(result).toEqual(mockCount);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: NotificationApiEndpoints.GetUnreadCount,
      });
    });

    it('should return zero count when no unread notifications', async () => {
      const mockCount = { count: 0 };
      mockApiClient.get.mockReturnValue(mockSuccess(mockCount));

      const result = await notificationService.getUnreadCount();

      expect(result.count).toBe(0);
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ count: 5 }));

      const result = notificationService.getUnreadCount();

      const _typeCheck: Promise<{ count: number }> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    const readNotification = { ...mockNotification, isRead: true, readAt: '2024-01-01T01:00:00Z' };

    it('should mark notification as read', async () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(readNotification));

      const result = await notificationService.markAsRead('notif-123');

      expect(result).toEqual(readNotification);
      expect(result.isRead).toBe(true);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/notifications/notif-123/read',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Notification not found'));

      await expect(notificationService.markAsRead('nonexistent')).rejects.toThrow('Notification not found');
    });

    it('should handle 403 error for non-owner', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(notificationService.markAsRead('notif-123')).rejects.toThrow('Forbidden');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(undefined));

      await notificationService.markAllAsRead();

      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: NotificationApiEndpoints.MarkAllAsRead,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(notificationService.markAllAsRead()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getSettings', () => {
    const mockSettings: NotificationSettings[] = [
      {
        id: 'settings-1',
        userId: 'user-123',
        notificationType: 'TRANSACTION_CREATED',
        isEnabled: true,
        minAmount: 1000,
        selectedBranches: ['branch-123'],
        displayMethod: 'TOAST',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should get notification settings', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSettings));

      const result = await notificationService.getSettings();

      expect(result).toEqual(mockSettings);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: NotificationApiEndpoints.GetSettings,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(notificationService.getSettings()).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateSettings', () => {
    const updateData: UpdateNotificationSettingsInput = {
      notificationType: 'TRANSACTION_CREATED',
      isEnabled: false,
      minAmount: 2000,
      selectedBranches: ['branch-123', 'branch-456'],
      displayMethod: 'EMAIL',
    };

    const updatedSettings: NotificationSettings = {
      id: 'settings-1',
      userId: 'user-123',
      ...updateData,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T01:00:00Z',
    };

    it('should update notification settings', async () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedSettings));

      const result = await notificationService.updateSettings(updateData);

      expect(result).toEqual(updatedSettings);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: NotificationApiEndpoints.UpdateSettings,
        data: updateData,
      });
    });

    it('should update only specific fields', async () => {
      const partialUpdate = { notificationType: 'TRANSACTION_CREATED', isEnabled: false };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedSettings));

      await notificationService.updateSettings(partialUpdate);

      verifyRequest(mockApiClient.patch, {
        url: NotificationApiEndpoints.UpdateSettings,
        data: partialUpdate,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(400, 'Invalid notification type'));

      await expect(notificationService.updateSettings(updateData)).rejects.toThrow('Invalid notification type');
    });
  });

  describe('getUnreadNotifications', () => {
    const mockPaginatedResponse: PaginatedResponse<Notification> = {
      data: [mockNotification],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get unread notifications', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await notificationService.getUnreadNotifications();

      expect(result).toEqual(mockPaginatedResponse);
      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.isRead).toBe(false);
    });

    it('should get unread notifications with additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await notificationService.getUnreadNotifications({
        branchId: 'branch-123',
        type: 'TRANSACTION_CREATED',
      });

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.isRead).toBe(false);
      expect(callParams.branchId).toBe('branch-123');
      expect(callParams.type).toBe('TRANSACTION_CREATED');
    });
  });

  describe('getReadNotifications', () => {
    const readNotification = { ...mockNotification, isRead: true };
    const mockPaginatedResponse: PaginatedResponse<Notification> = {
      data: [readNotification],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get read notifications', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await notificationService.getReadNotifications();

      expect(result).toEqual(mockPaginatedResponse);
      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.isRead).toBe(true);
    });

    it('should get read notifications with additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await notificationService.getReadNotifications({
        branchId: 'branch-123',
      });

      const callParams = mockApiClient.get.mock.calls[0][0].params;
      expect(callParams.isRead).toBe(true);
      expect(callParams.branchId).toBe('branch-123');
    });
  });

  describe('NotificationApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(NotificationApiEndpoints.GetAll).toBe('/notifications');
      expect(NotificationApiEndpoints.GetUnreadCount).toBe('/notifications/unread/count');
      expect(NotificationApiEndpoints.MarkAsRead).toBe('/notifications/:id/read');
      expect(NotificationApiEndpoints.MarkAllAsRead).toBe('/notifications/read-all');
      expect(NotificationApiEndpoints.GetSettings).toBe('/notifications/settings');
      expect(NotificationApiEndpoints.UpdateSettings).toBe('/notifications/settings');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(notificationService.default).toBeDefined();
      expect(notificationService.default.getAll).toBe(notificationService.getAll);
      expect(notificationService.default.getUnreadCount).toBe(notificationService.getUnreadCount);
      expect(notificationService.default.getUnreadNotifications).toBe(notificationService.getUnreadNotifications);
      expect(notificationService.default.getReadNotifications).toBe(notificationService.getReadNotifications);
      expect(notificationService.default.markAsRead).toBe(notificationService.markAsRead);
      expect(notificationService.default.markAllAsRead).toBe(notificationService.markAllAsRead);
      expect(notificationService.default.getSettings).toBe(notificationService.getSettings);
      expect(notificationService.default.updateSettings).toBe(notificationService.updateSettings);
    });
  });
});
