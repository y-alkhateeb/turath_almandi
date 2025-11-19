/**
 * NotificationList Component Tests
 * Tests for notification list rendering and mark as read functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/componentTestUtils';
import { NotificationList } from './NotificationList';
import type { Notification } from '#/entity';
import { NotificationSeverity } from '@/types/enum';

describe('NotificationList', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'TRANSACTION_CREATED',
      title: 'معاملة جديدة',
      message: 'تم إنشاء معاملة جديدة',
      severity: NotificationSeverity.INFO,
      isRead: false,
      userId: 'user-1',
      branchId: 'branch-1',
      relatedEntityId: 'tx-1',
      relatedEntityType: 'TRANSACTION',
      createdAt: '2024-01-01T00:00:00Z',
      readAt: null,
    },
    {
      id: 'notif-2',
      type: 'DEBT_DUE_SOON',
      title: 'دين يستحق قريباً',
      message: 'دين سوف يستحق خلال 3 أيام',
      severity: NotificationSeverity.WARNING,
      isRead: true,
      userId: 'user-1',
      branchId: 'branch-1',
      relatedEntityId: 'debt-1',
      relatedEntityType: 'DEBT',
      createdAt: '2024-01-02T00:00:00Z',
      readAt: '2024-01-02T01:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render notification list with data', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      expect(screen.getByText('معاملة جديدة')).toBeInTheDocument();
      expect(screen.getByText('دين يستحق قريباً')).toBeInTheDocument();
    });

    it('should render empty state when no notifications', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={[]}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      expect(screen.getByText(/لا توجد إشعارات|لا يوجد إشعارات/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={[]}
          isLoading={true}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // Check for loading skeleton
      const skeletons = screen.getAllByTestId('notification-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display unread badge for unread notifications', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // First notification is unread, should have unread indicator
      const unreadIndicators = screen.getAllByTestId('unread-indicator');
      expect(unreadIndicators.length).toBeGreaterThan(0);
    });

    it('should display different severity icons', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // Check that severity-based styling is applied
      const infoNotif = screen.getByText('معاملة جديدة').closest('div');
      const warningNotif = screen.getByText('دين يستحق قريباً').closest('div');

      expect(infoNotif).toHaveClass(/blue|info/);
      expect(warningNotif).toHaveClass(/yellow|warning/);
    });
  });

  describe('Mark as Read Functionality', () => {
    it('should call onMarkAsRead when clicking unread notification', async () => {
      const user = userEvent.setup();
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // Click on unread notification
      const unreadNotification = screen.getByText('معاملة جديدة');
      await user.click(unreadNotification);

      expect(onMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should not call onMarkAsRead when clicking read notification', async () => {
      const user = userEvent.setup();
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // Click on already read notification
      const readNotification = screen.getByText('دين يستحق قريباً');
      await user.click(readNotification);

      // Should still be called as clicking navigates to related entity
      expect(onMarkAsRead).toHaveBeenCalledTimes(0);
    });

    it('should call onMarkAllAsRead when clicking mark all button', async () => {
      const user = userEvent.setup();
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      const markAllButton = screen.getByRole('button', { name: /تعليم الكل كمقروء|mark all as read/i });
      await user.click(markAllButton);

      expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('should disable mark all button when no unread notifications', () => {
      const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }));
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={allRead}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      const markAllButton = screen.getByRole('button', { name: /تعليم الكل كمقروء|mark all as read/i });
      expect(markAllButton).toBeDisabled();
    });
  });

  describe('Notification Content', () => {
    it('should display notification title and message', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      expect(screen.getByText('معاملة جديدة')).toBeInTheDocument();
      expect(screen.getByText('تم إنشاء معاملة جديدة')).toBeInTheDocument();
      expect(screen.getByText('دين يستحق قريباً')).toBeInTheDocument();
      expect(screen.getByText('دين سوف يستحق خلال 3 أيام')).toBeInTheDocument();
    });

    it('should display relative time', () => {
      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={mockNotifications}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      // Check for relative time text (منذ)
      expect(screen.getAllByText(/منذ/i).length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle notifications without related entity', () => {
      const noRelatedEntity: Notification = {
        ...mockNotifications[0],
        relatedEntityId: null,
        relatedEntityType: null,
      };

      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={[noRelatedEntity]}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      expect(screen.getByText('معاملة جديدة')).toBeInTheDocument();
    });

    it('should handle critical severity notifications', () => {
      const criticalNotif: Notification = {
        ...mockNotifications[0],
        severity: NotificationSeverity.CRITICAL,
        title: 'تنبيه حرج',
      };

      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={[criticalNotif]}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      const criticalElement = screen.getByText('تنبيه حرج').closest('div');
      expect(criticalElement).toHaveClass(/red/);
    });

    it('should handle error severity notifications', () => {
      const errorNotif: Notification = {
        ...mockNotifications[0],
        severity: NotificationSeverity.ERROR,
        title: 'خطأ',
      };

      const onMarkAsRead = vi.fn();
      const onMarkAllAsRead = vi.fn();

      renderWithClient(
        <NotificationList
          notifications={[errorNotif]}
          isLoading={false}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );

      expect(screen.getByText('خطأ')).toBeInTheDocument();
    });
  });
});
