/**
 * TransactionForm Component Tests
 * Tests for transaction form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/componentTestUtils';
import { TransactionForm } from './TransactionForm';
import type { Transaction, CreateTransactionInput } from '#/entity';
import { TransactionType, PaymentMethod } from '@/types/enum';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      username: 'testuser',
      role: 'ADMIN',
      branchId: null,
    },
    isAdmin: true,
    isAccountant: false,
  }),
}));

vi.mock('@/hooks/useBranches', () => ({
  useBranches: () => ({
    data: [
      { id: 'branch-1', name: 'Branch 1', isActive: true },
      { id: 'branch-2', name: 'Branch 2', isActive: true },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTransaction: Transaction = {
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
    notes: 'Test transaction',
    employeeVendorName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render form in create mode', () => {
      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      expect(screen.getByRole('radiogroup', { name: /نوع العملية/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/المبلغ/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/التاريخ/i)).toBeInTheDocument();
    });

    it('should show transaction type selector in create mode', () => {
      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      expect(screen.getByText(/إيراد/i)).toBeInTheDocument();
      expect(screen.getByText(/مصروف/i)).toBeInTheDocument();
    });

    it('should validate required amount field', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/المبلغ مطلوب|amount.*required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate amount is positive', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const amountInput = screen.getByLabelText(/المبلغ/i);
      await user.type(amountInput, '-100');

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/المبلغ يجب أن يكون موجبًا|must be positive/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is at least 0.01', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const amountInput = screen.getByLabelText(/المبلغ/i);
      await user.clear(amountInput);
      await user.type(amountInput, '0');

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/0.01 على الأقل|at least 0.01/i)).toBeInTheDocument();
      });
    });

    it('should validate required date field', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const dateInput = screen.getByLabelText(/التاريخ/i);
      await user.clear(dateInput);

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/التاريخ مطلوب|date.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate notes max length', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const notesInput = screen.getByLabelText(/ملاحظات/i);
      const longText = 'a'.repeat(1001);

      // Use paste instead of type for performance
      await user.click(notesInput);
      await user.paste(longText);

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/1000 حرف|1000 characters/i)).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      // Fill form
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/التاريخ/i), '2024-01-01');

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: TransactionType.INCOME,
            amount: 1000,
            date: '2024-01-01',
          }),
        );
      });
    });

    it('should switch transaction type', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      // Click expense radio button
      const expenseRadio = screen.getByLabelText(/مصروف/i);
      await user.click(expenseRadio);

      expect(expenseRadio).toBeChecked();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /إلغاء|cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable form when isSubmitting is true', () => {
      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />,
      );

      const amountInput = screen.getByLabelText(/المبلغ/i);
      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });

      expect(amountInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    it('should render form in edit mode with initial data', () => {
      renderWithClient(
        <TransactionForm
          mode="edit"
          initialData={mockTransaction}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const amountInput = screen.getByLabelText(/المبلغ/i) as HTMLInputElement;
      expect(amountInput.value).toBe('1000');
    });

    it('should not show transaction type selector in edit mode', () => {
      renderWithClient(
        <TransactionForm
          mode="edit"
          initialData={mockTransaction}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('radiogroup', { name: /نوع العملية/i })).not.toBeInTheDocument();
    });

    it('should populate all fields with initial data', () => {
      renderWithClient(
        <TransactionForm
          mode="edit"
          initialData={mockTransaction}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      expect((screen.getByLabelText(/المبلغ/i) as HTMLInputElement).value).toBe('1000');
      expect((screen.getByLabelText(/التاريخ/i) as HTMLInputElement).value).toBe('2024-01-01');
      expect((screen.getByLabelText(/ملاحظات/i) as HTMLTextAreaElement).value).toBe('Test transaction');
    });

    it('should submit updated data in edit mode', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <TransactionForm
          mode="edit"
          initialData={mockTransaction}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      // Update amount
      const amountInput = screen.getByLabelText(/المبلغ/i);
      await user.clear(amountInput);
      await user.type(amountInput, '2000');

      const submitButton = screen.getByRole('button', { name: /إضافة عملية|تحديث العملية|add.*transaction|update.*transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 2000,
          }),
        );
      });
    });
  });

  describe('Payment Method Selection', () => {
    it('should allow selecting payment method', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const masterRadio = screen.getByLabelText(/ماستر كارد|master/i);
      await user.click(masterRadio);

      expect(masterRadio).toBeChecked();
    });
  });

  // Currency Selection tests have been removed
  // Currency is now managed globally via settings, not per-transaction
  // describe('Currency Selection', () => {
  //   it('should allow selecting currency', async () => {
  //     const user = userEvent.setup();
  //
  //     renderWithClient(
  //       <TransactionForm
  //         mode="create"
  //         onSubmit={mockOnSubmit}
  //         isSubmitting={false}
  //       />,
  //     );
  //
  //     const currencySelect = screen.getByLabelText(/العملة|currency/i);
  //     await user.selectOptions(currencySelect, Currency.USD);
  //
  //     expect((currencySelect as HTMLSelectElement).value).toBe(Currency.USD);
  //   });
  // });

  describe('Category Selection', () => {
    it('should allow selecting category', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <TransactionForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const categorySelect = screen.getByLabelText(/الفئة|category/i);
      await user.selectOptions(categorySelect, 'SALE');

      expect((categorySelect as HTMLSelectElement).value).toBe('SALE');
    });
  });
});
