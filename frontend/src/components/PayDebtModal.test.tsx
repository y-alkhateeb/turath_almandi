/**
 * PayDebtModal Component Tests
 * Tests for pay debt modal with amount validation (amount <= remaining)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/componentTestUtils';
import { PayDebtModal } from './PayDebtModal';
import type { Debt } from '../types/debts.types';
import { Currency, DebtStatus } from '@/types/enum';

// Create mockable functions
const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockIsPending = { value: false };

// Mock dependencies
vi.mock('../hooks/useDebts', () => ({
  usePayDebt: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  }),
}));

describe('PayDebtModal', () => {
  const mockDebt: Debt = {
    id: 'debt-1',
    creditorName: 'John Doe',
    originalAmount: 5000,
    remainingAmount: 3000,
    date: '2024-01-01',
    dueDate: '2024-02-01',
    status: DebtStatus.PARTIAL,
    notes: null,
    branchId: 'branch-1',
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    mockIsPending.value = false;
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      expect(screen.getByText(/دفع دين|pay debt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/المبلغ المراد دفعه|amount.*to.*pay/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/تاريخ الدفع|payment date/i)).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderWithClient(
        <PayDebtModal isOpen={false} onClose={mockOnClose} debt={mockDebt} />,
      );

      expect(screen.queryByText(/دفع دين|pay debt/i)).not.toBeInTheDocument();
    });

    it('should display debt information', () => {
      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/5,?000/)).toBeInTheDocument(); // Original amount
      expect(screen.getByText(/3,?000/)).toBeInTheDocument(); // Remaining amount
    });

    it('should handle null debt gracefully', () => {
      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={null} />,
      );

      // Should render modal but without form
      expect(screen.queryByLabelText(/المبلغ المدفوع/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation - Amount Must Be Positive', () => {
    it('should validate amount is required', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/المبلغ المدفوع مطلوب|amount.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is greater than zero', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '0');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/أكبر من صفر|greater than.*zero/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is a valid number', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, 'abc');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/رقم|number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation - Amount Must Not Exceed Remaining', () => {
    it('should validate amount does not exceed remaining amount', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '4000'); // More than remaining 3000

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/لا يمكن أن يتجاوز المبلغ المتبقي|cannot exceed.*remaining|3000/i),
        ).toBeInTheDocument();
      });
    });

    it('should allow amount equal to remaining amount', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '3000'); // Exactly remaining amount

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should allow amount less than remaining amount', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '1000'); // Less than remaining amount

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit payment with valid data', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '1500');

      const notesInput = screen.getByLabelText(/ملاحظات|notes/i);
      await user.type(notesInput, 'Partial payment');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          debtId: 'debt-1',
          data: expect.objectContaining({
            amountPaid: 1500,
            notes: 'Partial payment',
          }),
        });
      });
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '1500');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should submit without notes', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '1500');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const cancelButton = screen.getByRole('button', { name: /إلغاء|cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should disable form during submission', async () => {
      mockIsPending.value = true;

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });

      expect(amountInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during submission', async () => {
      mockIsPending.value = true;

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle debt with zero remaining amount', () => {
      const paidDebt: Debt = {
        ...mockDebt,
        remainingAmount: 0,
        status: DebtStatus.PAID,
      };

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={paidDebt} />,
      );

      // Should show that debt is fully paid
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('should handle decimal amounts', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <PayDebtModal isOpen={true} onClose={mockOnClose} debt={mockDebt} />,
      );

      const amountInput = screen.getByLabelText(/المبلغ المراد دفعه/i);
      await user.type(amountInput, '1500.50');

      const submitButton = screen.getByRole('button', { name: /دفع|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          debtId: 'debt-1',
          data: expect.objectContaining({
            amountPaid: 1500.50,
          }),
        });
      });
    });
  });
});
