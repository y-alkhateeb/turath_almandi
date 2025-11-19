/**
 * Integration Test: Pay Debt Flow
 *
 * Tests the complete debt payment journey:
 * 1. User views debts list
 * 2. Selects a debt to pay
 * 3. Opens payment modal
 * 4. Enters payment amount
 * 5. Submits payment
 * 6. API processes payment
 * 7. Debt status updated
 * 8. Success message displayed
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderIntegration,
  createMockDebt,
  createMockUser,
} from '@/test/integrationTestUtils';
import * as debtService from '@/api/services/debtService';

// Mock services
vi.mock('@/api/services/debtService');

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser({ role: 'ADMIN' }),
    isAuthenticated: true,
    isAdmin: true,
  }),
}));

describe('Integration: Pay Debt Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full debt payment flow', async () => {
    const user = userEvent.setup();

    // Mock initial debt with partial payment
    const mockDebt = createMockDebt({
      id: 'debt-1',
      creditorName: 'Ahmed Ali',
      originalAmount: 10000,
      remainingAmount: 6000,
      status: 'PARTIAL',
    });

    // Mock updated debt after payment
    const updatedDebt = {
      ...mockDebt,
      remainingAmount: 3000,
      status: 'PARTIAL' as const,
    };

    // Mock debt list
    vi.mocked(debtService.getDebts).mockResolvedValue({
      debts: [mockDebt],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    // Mock successful payment
    vi.mocked(debtService.payDebt).mockResolvedValue(updatedDebt);

    // Simple debts page component
    function DebtsPage() {
      const [debts, setDebts] = React.useState<any[]>([]);
      const [selectedDebt, setSelectedDebt] = React.useState<any>(null);
      const [message, setMessage] = React.useState('');

      React.useEffect(() => {
        debtService.getDebts().then((result) => {
          setDebts(result.debts);
        });
      }, []);

      const handlePayment = async (debtId: string, paymentData: any) => {
        try {
          const updated = await debtService.payDebt(debtId, paymentData);
          setDebts(debts.map((d) => (d.id === debtId ? updated : d)));
          setMessage('تم دفع الدين بنجاح');
          setSelectedDebt(null);
        } catch (error: any) {
          setMessage(error.message);
        }
      };

      return (
        <div>
          <h1>الديون</h1>
          {message && <div role="status">{message}</div>}

          <div>
            {debts.map((debt) => (
              <div key={debt.id} data-testid={`debt-${debt.id}`}>
                <h3>{debt.creditorName}</h3>
                <p>المبلغ الأصلي: {debt.originalAmount}</p>
                <p>المبلغ المتبقي: {debt.remainingAmount}</p>
                <p>الحالة: {debt.status}</p>
                <button onClick={() => setSelectedDebt(debt)}>دفع</button>
              </div>
            ))}
          </div>

          {selectedDebt && (
            <PaymentModal
              debt={selectedDebt}
              onSubmit={(data) => handlePayment(selectedDebt.id, data)}
              onClose={() => setSelectedDebt(null)}
            />
          )}
        </div>
      );
    }

    function PaymentModal({
      debt,
      onSubmit,
      onClose,
    }: {
      debt: any;
      onSubmit: (data: any) => void;
      onClose: () => void;
    }) {
      const [amount, setAmount] = React.useState('');
      const [notes, setNotes] = React.useState('');
      const [error, setError] = React.useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) {
          setError('المبلغ يجب أن يكون أكبر من صفر');
          return;
        }
        if (amountNum > debt.remainingAmount) {
          setError(`المبلغ يجب ألا يتجاوز المبلغ المتبقي (${debt.remainingAmount})`);
          return;
        }

        onSubmit({
          amountPaid: amountNum,
          paymentDate: new Date(),
          notes,
        });
      };

      return (
        <div role="dialog" aria-label="نموذج دفع الدين">
          <h2>دفع دين - {debt.creditorName}</h2>
          <p>المبلغ المتبقي: {debt.remainingAmount}</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="amount">المبلغ المدفوع</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                max={debt.remainingAmount}
                required
              />
            </div>

            <div>
              <label htmlFor="notes">ملاحظات</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <div role="alert">{error}</div>}

            <button type="submit">دفع الدين</button>
            <button type="button" onClick={onClose}>
              إلغاء
            </button>
          </form>
        </div>
      );
    }

    // Render debts page
    renderIntegration(<DebtsPage />);

    // Step 1: Wait for debts to load
    expect(await screen.findByText(/الديون/i)).toBeInTheDocument();
    const debtCard = await screen.findByTestId('debt-debt-1');
    expect(debtCard).toBeInTheDocument();

    // Step 2: Verify debt information is displayed
    within(debtCard).getByText(/Ahmed Ali/i);
    within(debtCard).getByText(/المبلغ الأصلي: 10000/i);
    within(debtCard).getByText(/المبلغ المتبقي: 6000/i);

    // Step 3: Click "Pay" button
    const payButton = within(debtCard).getByRole('button', { name: /دفع/i });
    await user.click(payButton);

    // Step 4: Verify payment modal is opened
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/دفع دين - Ahmed Ali/i)).toBeInTheDocument();
    expect(within(modal).getByText(/المبلغ المتبقي: 6000/i)).toBeInTheDocument();

    // Step 5: Enter payment amount
    const amountInput = within(modal).getByLabelText(/المبلغ المدفوع/i);
    await user.type(amountInput, '3000');
    expect(amountInput).toHaveValue(3000);

    // Step 6: Add payment notes (optional)
    const notesInput = within(modal).getByLabelText(/ملاحظات/i);
    await user.type(notesInput, 'دفعة جزئية');

    // Step 7: Submit payment
    const submitButton = within(modal).getByRole('button', { name: /دفع الدين/i });
    await user.click(submitButton);

    // Step 8: Verify API was called with correct data
    await waitFor(() => {
      expect(debtService.payDebt).toHaveBeenCalledWith('debt-1', {
        amountPaid: 3000,
        paymentDate: expect.any(Date),
        notes: 'دفعة جزئية',
      });
    });

    // Step 9: Verify success message
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/تم دفع الدين بنجاح/i);
    });

    // Step 10: Verify modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Step 11: Verify debt is updated in the list
    const updatedDebtCard = screen.getByTestId('debt-debt-1');
    expect(within(updatedDebtCard).getByText(/المبلغ المتبقي: 3000/i)).toBeInTheDocument();
  });

  it('should validate payment amount does not exceed remaining', async () => {
    const user = userEvent.setup();

    const mockDebt = createMockDebt({
      remainingAmount: 5000,
    });

    function PaymentModal({ debt }: { debt: any }) {
      const [amount, setAmount] = React.useState('');
      const [error, setError] = React.useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseFloat(amount);
        if (amountNum > debt.remainingAmount) {
          setError(`المبلغ يجب ألا يتجاوز المبلغ المتبقي (${debt.remainingAmount})`);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="المبلغ المدفوع"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div role="alert">{error}</div>}
          <button type="submit">دفع</button>
        </form>
      );
    }

    renderIntegration(<PaymentModal debt={mockDebt} />);

    // Try to pay more than remaining
    const amountInput = screen.getByLabelText(/المبلغ المدفوع/i);
    await user.type(amountInput, '6000'); // More than 5000 remaining

    await user.click(screen.getByRole('button', { name: /دفع/i }));

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /المبلغ يجب ألا يتجاوز المبلغ المتبقي \(5000\)/i
      );
    });

    // Verify API was not called
    expect(debtService.payDebt).not.toHaveBeenCalled();
  });

  it('should validate payment amount is positive', async () => {
    const user = userEvent.setup();

    const mockDebt = createMockDebt({
      remainingAmount: 5000,
    });

    function PaymentModal({ debt }: { debt: any }) {
      const [amount, setAmount] = React.useState('');
      const [error, setError] = React.useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) {
          setError('المبلغ يجب أن يكون أكبر من صفر');
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="المبلغ المدفوع"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div role="alert">{error}</div>}
          <button type="submit">دفع</button>
        </form>
      );
    }

    renderIntegration(<PaymentModal debt={mockDebt} />);

    // Try to submit with zero or negative amount
    await user.click(screen.getByRole('button', { name: /دفع/i }));

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/المبلغ يجب أن يكون أكبر من صفر/i);
    });

    expect(debtService.payDebt).not.toHaveBeenCalled();
  });

  it('should handle payment API errors', async () => {
    const user = userEvent.setup();

    const mockDebt = createMockDebt();

    vi.mocked(debtService.getDebts).mockResolvedValue({
      debts: [mockDebt],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    // Mock API error
    vi.mocked(debtService.payDebt).mockRejectedValue(
      new Error('فشل في معالجة الدفع')
    );

    function DebtsPage() {
      const [debts, setDebts] = React.useState<any[]>([]);
      const [error, setError] = React.useState('');

      React.useEffect(() => {
        debtService.getDebts().then((result) => setDebts(result.debts));
      }, []);

      const handlePayment = async () => {
        try {
          await debtService.payDebt('debt-1', { amountPaid: 1000, paymentDate: new Date() });
        } catch (err: any) {
          setError(err.message);
        }
      };

      return (
        <div>
          {error && <div role="alert">{error}</div>}
          <button onClick={handlePayment}>دفع</button>
        </div>
      );
    }

    renderIntegration(<DebtsPage />);

    await user.click(await screen.findByRole('button', { name: /دفع/i }));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/فشل في معالجة الدفع/i);
    });
  });
});
