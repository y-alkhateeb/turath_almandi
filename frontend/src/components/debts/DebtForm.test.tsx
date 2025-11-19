/**
 * DebtForm Component Tests
 * Tests for debt form rendering, validation (especially due date), and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/componentTestUtils';
import { DebtForm } from './DebtForm';
import type { CreateDebtInput } from '#/entity';
import { Currency } from '@/types/enum';

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

describe('DebtForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all fields', () => {
      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      expect(screen.getByLabelText(/اسم الدائن|creditor name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/المبلغ|amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/تاريخ الدين|debt date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/تاريخ الاستحقاق|due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ملاحظات|notes/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />,
      );

      expect(screen.getByRole('button', { name: /حفظ|submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إلغاء|cancel/i })).toBeInTheDocument();
    });
  });

  describe('Validation - Required Fields', () => {
    it('should validate required creditor name', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/اسم الدائن مطلوب|creditor.*required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate required amount', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/المبلغ مطلوب|amount.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate required debt date', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');

      // Clear the date field
      const dateInput = screen.getByLabelText(/تاريخ الدين/i);
      await user.clear(dateInput);

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/تاريخ الدين مطلوب|debt date.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate required due date', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/تاريخ الاستحقاق مطلوب|due date.*required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should validate creditor name max length', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const longName = 'a'.repeat(201);
      await user.type(screen.getByLabelText(/اسم الدائن/i), longName);

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/200 حرف|200 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is positive', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '-100');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/المبلغ يجب أن يكون موجبًا|must be positive/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is at least 0.01', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '0');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/0.01 على الأقل|at least 0.01/i)).toBeInTheDocument();
      });
    });

    it('should validate notes max length', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const notesInput = screen.getByLabelText(/ملاحظات/i);
      const longNotes = 'a'.repeat(1001);

      // Use paste instead of type for performance
      await user.click(notesInput);
      await user.paste(longNotes);

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/1000 حرف|1000 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation - Due Date Logic', () => {
    it('should validate due date is not before debt date', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/تاريخ الدين/i), '2024-01-10');
      await user.type(screen.getByLabelText(/تاريخ الاستحقاق/i), '2024-01-05'); // Before debt date

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/تاريخ الاستحقاق يجب أن يكون بعد أو يساوي تاريخ الدين|due date.*after.*equal/i),
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should allow due date equal to debt date', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/تاريخ الدين/i), '2024-01-10');
      await user.type(screen.getByLabelText(/تاريخ الاستحقاق/i), '2024-01-10'); // Same as debt date

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should allow due date after debt date', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/تاريخ الدين/i), '2024-01-10');
      await user.type(screen.getByLabelText(/تاريخ الاستحقاق/i), '2024-01-20'); // After debt date

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/تاريخ الدين/i), '2024-01-01');
      await user.type(screen.getByLabelText(/تاريخ الاستحقاق/i), '2024-01-31');
      await user.type(screen.getByLabelText(/ملاحظات/i), 'Test debt');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            creditorName: 'John Doe',
            amount: 1000,
            date: '2024-01-01',
            dueDate: '2024-01-31',
            notes: 'Test debt',
          }),
        );
      });
    });

    it('should submit without optional notes', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      await user.type(screen.getByLabelText(/اسم الدائن/i), 'John Doe');
      await user.type(screen.getByLabelText(/المبلغ/i), '1000');
      await user.type(screen.getByLabelText(/تاريخ الدين/i), '2024-01-01');
      await user.type(screen.getByLabelText(/تاريخ الاستحقاق/i), '2024-01-31');

      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
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
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />,
      );

      const creditorInput = screen.getByLabelText(/اسم الدائن/i);
      const amountInput = screen.getByLabelText(/المبلغ/i);
      const submitButton = screen.getByRole('button', { name: /حفظ|submit/i });

      expect(creditorInput).toBeDisabled();
      expect(amountInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Currency Selection', () => {
    it('should allow selecting currency', async () => {
      const user = userEvent.setup();

      renderWithClient(
        <DebtForm
          mode="create"
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
      );

      const currencySelect = screen.getByLabelText(/العملة|currency/i);
      await user.selectOptions(currencySelect, Currency.USD);

      expect((currencySelect as HTMLSelectElement).value).toBe(Currency.USD);
    });
  });
});
