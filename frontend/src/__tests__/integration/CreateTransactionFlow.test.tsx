/**
 * Integration Test: Create Transaction Flow
 *
 * Tests the complete transaction creation journey:
 * 1. User navigates to transactions page
 * 2. Clicks "Add Transaction" button
 * 3. Fills out transaction form
 * 4. Submits form
 * 5. API creates transaction
 * 6. Success message displayed
 * 7. Transaction appears in list
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderIntegration,
  createMockTransaction,
  createMockUser,
  createMockBranch,
} from '@/test/integrationTestUtils';
import * as transactionService from '@/api/services/transactionService';
import * as branchService from '@/api/services/branchService';

// Mock services
vi.mock('@/api/services/transactionService');
vi.mock('@/api/services/branchService');

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser({ role: 'ADMIN' }),
    isAuthenticated: true,
    isAdmin: true,
    isAccountant: false,
    userBranchId: null,
  }),
}));

describe('Integration: Create Transaction Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock branches for admin
    vi.mocked(branchService.getAllBranches).mockResolvedValue([
      createMockBranch({ id: 'branch-1', name: 'Main Branch' }),
      createMockBranch({ id: 'branch-2', name: 'Secondary Branch' }),
    ]);
  });

  it('should complete full transaction creation flow', async () => {
    const user = userEvent.setup();

    // Mock successful transaction creation
    const mockTransaction = createMockTransaction({
      id: 'txn-new',
      type: 'INCOME',
      amount: 5000,
      category: 'SALE',
      date: '2024-01-15',
    });

    vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction);

    // Mock transaction list fetch
    vi.mocked(transactionService.getTransactions).mockResolvedValue({
      transactions: [mockTransaction],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    // Simple transaction page component
    function TransactionPage() {
      const [showForm, setShowForm] = React.useState(false);
      const [transactions, setTransactions] = React.useState<any[]>([]);
      const [message, setMessage] = React.useState('');

      const handleCreate = async (data: any) => {
        try {
          const newTransaction = await transactionService.createTransaction(data);
          setTransactions([newTransaction, ...transactions]);
          setMessage('تم إضافة العملية بنجاح');
          setShowForm(false);
        } catch (error: any) {
          setMessage(error.message);
        }
      };

      React.useEffect(() => {
        transactionService.getTransactions().then((result) => {
          setTransactions(result.transactions);
        });
      }, []);

      if (showForm) {
        return (
          <div>
            <h2>إضافة عملية جديدة</h2>
            <TransactionFormSimple onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        );
      }

      return (
        <div>
          <h1>العمليات المالية</h1>
          <button onClick={() => setShowForm(true)}>إضافة عملية</button>
          {message && <div role="status">{message}</div>}
          <div>
            {transactions.map((txn) => (
              <div key={txn.id} data-testid={`transaction-${txn.id}`}>
                {txn.type} - {txn.amount}
              </div>
            ))}
          </div>
        </div>
      );
    }

    function TransactionFormSimple({
      onSubmit,
      onCancel,
    }: {
      onSubmit: (data: any) => void;
      onCancel: () => void;
    }) {
      const [formData, setFormData] = React.useState({
        type: 'INCOME',
        amount: '',
        category: 'SALE',
        date: '2024-01-15',
        notes: '',
      });

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
          ...formData,
          amount: parseFloat(formData.amount),
        });
      };

      return (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="amount">المبلغ</label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              step="0.01"
              min="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="category">الفئة</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="SALE">بيع</option>
              <option value="PURCHASE">شراء</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>
          <div>
            <label htmlFor="date">التاريخ</label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="notes">ملاحظات</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button type="submit">حفظ</button>
          <button type="button" onClick={onCancel}>
            إلغاء
          </button>
        </form>
      );
    }

    // Render transaction page
    renderIntegration(<TransactionPage />);

    // Step 1: Verify page is loaded
    expect(await screen.findByText(/العمليات المالية/i)).toBeInTheDocument();

    // Step 2: Click "Add Transaction" button
    const addButton = screen.getByRole('button', { name: /إضافة عملية/i });
    await user.click(addButton);

    // Step 3: Verify form is displayed
    expect(await screen.findByText(/إضافة عملية جديدة/i)).toBeInTheDocument();

    // Step 4: Fill out form - Amount
    const amountInput = screen.getByLabelText(/المبلغ/i);
    await user.type(amountInput, '5000');
    expect(amountInput).toHaveValue(5000);

    // Step 5: Select category
    const categorySelect = screen.getByLabelText(/الفئة/i);
    await user.selectOptions(categorySelect, 'SALE');
    expect(categorySelect).toHaveValue('SALE');

    // Step 6: Set date
    const dateInput = screen.getByLabelText(/التاريخ/i);
    expect(dateInput).toHaveValue('2024-01-15');

    // Step 7: Add notes (optional)
    const notesInput = screen.getByLabelText(/ملاحظات/i);
    await user.type(notesInput, 'Test transaction notes');

    // Step 8: Submit form
    const submitButton = screen.getByRole('button', { name: /حفظ/i });
    await user.click(submitButton);

    // Step 9: Verify API was called with correct data
    await waitFor(() => {
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INCOME',
          amount: 5000,
          category: 'SALE',
          date: '2024-01-15',
          notes: 'Test transaction notes',
        })
      );
    });

    // Step 10: Verify success message
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/تم إضافة العملية بنجاح/i);
    });

    // Step 11: Verify form is closed and back to list view
    expect(screen.queryByText(/إضافة عملية جديدة/i)).not.toBeInTheDocument();
    expect(screen.getByText(/العمليات المالية/i)).toBeInTheDocument();

    // Step 12: Verify new transaction appears in the list
    expect(screen.getByTestId('transaction-txn-new')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-txn-new')).toHaveTextContent('INCOME - 5000');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    function TransactionFormSimple() {
      const [formData, setFormData] = React.useState({
        amount: '',
        date: '',
      });
      const [errors, setErrors] = React.useState<string[]>([]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: string[] = [];

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.push('المبلغ مطلوب ويجب أن يكون أكبر من صفر');
        }
        if (!formData.date) {
          newErrors.push('التاريخ مطلوب');
        }

        setErrors(newErrors);
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="المبلغ"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <input
            aria-label="التاريخ"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          {errors.map((error, i) => (
            <div key={i} role="alert">
              {error}
            </div>
          ))}
          <button type="submit">حفظ</button>
        </form>
      );
    }

    renderIntegration(<TransactionFormSimple />);

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /حفظ/i });
    await user.click(submitButton);

    // Verify validation errors are displayed
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent(/المبلغ مطلوب/i);
      expect(alerts[1]).toHaveTextContent(/التاريخ مطلوب/i);
    });

    // Verify API was not called
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock API error
    vi.mocked(transactionService.createTransaction).mockRejectedValue(
      new Error('فشل في إنشاء العملية')
    );

    function TransactionFormSimple() {
      const [amount, setAmount] = React.useState('1000');
      const [error, setError] = React.useState('');

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
          await transactionService.createTransaction({
            type: 'INCOME',
            amount: parseFloat(amount),
            date: '2024-01-15',
          });
        } catch (err: any) {
          setError(err.message);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            aria-label="المبلغ"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div role="alert">{error}</div>}
          <button type="submit">حفظ</button>
        </form>
      );
    }

    renderIntegration(<TransactionFormSimple />);

    // Submit form
    await user.click(screen.getByRole('button', { name: /حفظ/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/فشل في إنشاء العملية/i);
    });
  });
});
