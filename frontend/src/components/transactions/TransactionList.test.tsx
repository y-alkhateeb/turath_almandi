/**
 * TransactionList Component Tests
 * Tests for transaction list rendering and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/componentTestUtils';
import { TransactionList } from './TransactionList';
import type { Transaction } from '#/entity';
import { TransactionType, PaymentMethod } from '@/types/enum';

describe('TransactionList', () => {
  // Currency enum has been removed from imports
  // Currency is now managed globally via settings, not per-transaction
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: TransactionType.INCOME,
      amount: 1000,
      currency: 'IQD',
      paymentMethod: PaymentMethod.CASH,
      category: 'SALE',
      date: '2024-01-01T00:00:00Z',
      branchId: 'branch-1',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      notes: 'Test income',
    },
    {
      id: 'tx-2',
      type: TransactionType.EXPENSE,
      amount: 500,
      currency: 'USD',
      paymentMethod: PaymentMethod.CARD,
      category: 'EXPENSE',
      date: '2024-01-02T00:00:00Z',
      branchId: 'branch-1',
      createdById: 'user-1',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render transaction list with data', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      // Check if transactions are rendered
      expect(screen.getByText(/إيراد/i)).toBeInTheDocument();
      expect(screen.getByText(/مصروف/i)).toBeInTheDocument();
    });

    it('should render empty state when no transactions', () => {
      renderWithClient(
        <TransactionList transactions={[]} isLoading={false} />,
      );

      expect(screen.getByText(/لا توجد معاملات/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      renderWithClient(
        <TransactionList transactions={[]} isLoading={true} />,
      );

      // Check for loading skeleton or spinner
      expect(screen.getByTestId('loading-skeleton') || screen.getByRole('status')).toBeDefined();
    });

    it('should display transaction amounts with correct colors', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      // Income should be green, expense should be red
      const incomeElement = screen.getByText(/1,000/);
      const expenseElement = screen.getByText(/500/);

      expect(incomeElement).toHaveClass('text-green-600');
      expect(expenseElement).toHaveClass('text-red-600');
    });

    it('should display transaction types correctly', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      expect(screen.getByText('إيراد')).toBeInTheDocument();
      expect(screen.getByText('مصروف')).toBeInTheDocument();
    });

    it('should display payment methods correctly', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      expect(screen.getByText('نقدي')).toBeInTheDocument();
      expect(screen.getByText(/بطاقة|CARD/i)).toBeInTheDocument();
    });

    it('should display categories correctly', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/بيع/i)).toBeInTheDocument();
      expect(screen.getByText(/مصروف/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
          onEdit={onEdit}
        />,
      );

      const editButtons = screen.getAllByRole('button', { name: /تعديل|edit/i });
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith('tx-1');
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
          onDelete={onDelete}
        />,
      );

      const deleteButtons = screen.getAllByRole('button', { name: /حذف|delete/i });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith('tx-1');
    });

    it('should not render action buttons when handlers not provided', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      expect(screen.queryByRole('button', { name: /تعديل|edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /حذف|delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format dates correctly', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      // Dates should be formatted
      expect(screen.getByText(/2024-01-01|01\/01\/2024/)).toBeInTheDocument();
    });

    it('should format currency amounts correctly', () => {
      renderWithClient(
        <TransactionList
          transactions={mockTransactions}
          isLoading={false}
        />,
      );

      // Check for formatted amounts
      expect(screen.getByText(/1,000/)).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it('should handle null/undefined values gracefully', () => {
      const transactionWithNulls: Transaction = {
        ...mockTransactions[0],
        notes: null as any,
        employeeVendorName: null as any,
        category: null as any,
      };

      renderWithClient(
        <TransactionList
          transactions={[transactionWithNulls]}
          isLoading={false}
        />,
      );

      // Should render without crashing
      expect(screen.getByText(/إيراد/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notes field', () => {
      const transactionNoNotes: Transaction = {
        ...mockTransactions[0],
        notes: undefined,
      };

      renderWithClient(
        <TransactionList
          transactions={[transactionNoNotes]}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/إيراد/i)).toBeInTheDocument();
    });

    it('should handle large amounts', () => {
      const largeAmountTransaction: Transaction = {
        ...mockTransactions[0],
        amount: 1000000.50,
      };

      renderWithClient(
        <TransactionList
          transactions={[largeAmountTransaction]}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    });

    it('should handle multiple transactions of same type', () => {
      const allIncome = mockTransactions.map((t) => ({
        ...t,
        type: TransactionType.INCOME,
      }));

      renderWithClient(
        <TransactionList
          transactions={allIncome}
          isLoading={false}
        />,
      );

      const incomeLabels = screen.getAllByText('إيراد');
      expect(incomeLabels).toHaveLength(2);
    });
  });
});
