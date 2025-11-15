import { api } from './axios';
import { DashboardStats, Transaction } from '@/types/dashboard';

interface TransactionSummary {
  date: string;
  branchId: string | null;
  income_cash: number;
  income_master: number;
  total_income: number;
  total_expense: number;
  net: number;
}

interface TransactionResponse {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  category: string;
  paymentMethod?: string;
  employeeVendorName?: string;
  notes?: string;
  createdAt: string;
}

interface TransactionsListResponse {
  data: TransactionResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Dashboard Service
 * Handles all dashboard-related API calls and data transformations
 */
class DashboardService {
  /**
   * Get today's financial summary
   */
  async getTodaySummary(branchId?: string): Promise<TransactionSummary> {
    const params: Record<string, string> = {};

    if (branchId) {
      params.branchId = branchId;
    }

    const response = await api.get<TransactionSummary>('/transactions/summary', { params });
    return response.data;
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 5, branchId?: string): Promise<Transaction[]> {
    const params: Record<string, string> = {
      limit: limit.toString(),
      page: '1',
    };

    if (branchId) {
      params.branchId = branchId;
    }

    const response = await api.get<TransactionsListResponse>('/transactions', { params });

    return response.data.data.map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      status: 'completed' as const,
    }));
  }

  /**
   * Get monthly revenue data (last 6 months)
   * Note: This is a simplified version. In production, you'd want a dedicated backend endpoint
   * that aggregates data by month for better performance.
   */
  async getMonthlyRevenueData(branchId?: string) {
    const monthNames = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];

    const months = [];
    const currentDate = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      try {
        // Get all transactions for this month
        const params: Record<string, string> = {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          limit: '1000', // Get all transactions for the month
        };

        if (branchId) {
          params.branchId = branchId;
        }

        const response = await api.get<TransactionsListResponse>('/transactions', { params });
        const transactions = response.data.data;

        // Calculate revenue and expenses
        const revenue = transactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);

        months.push({
          month: monthNames[date.getMonth()],
          revenue,
          expenses,
        });
      } catch (error) {
        console.error(`Error fetching data for month ${date.getMonth() + 1}:`, error);
        months.push({
          month: monthNames[date.getMonth()],
          revenue: 0,
          expenses: 0,
        });
      }
    }

    return months;
  }

  /**
   * Get category breakdown
   * Analyzes transactions to group by category
   */
  async getCategoryData(branchId?: string) {
    // Get current month's transactions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const params: Record<string, string> = {
      startDate: startOfMonth.toISOString(),
      type: 'INCOME',
      limit: '1000',
    };

    if (branchId) {
      params.branchId = branchId;
    }

    const response = await api.get<TransactionsListResponse>('/transactions', { params });
    const transactions = response.data.data;

    // Group by category
    const categoryMap = new Map<string, number>();

    transactions.forEach((t) => {
      const category = t.category || 'أخرى';
      categoryMap.set(category, (categoryMap.get(category) || 0) + t.amount);
    });

    // Convert to array and assign colors
    const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];
    let colorIndex = 0;

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[colorIndex++ % colors.length],
    }));

    // Sort by value descending
    categoryData.sort((a, b) => b.value - a.value);

    return categoryData;
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(branchId?: string): Promise<DashboardStats> {
    try {
      // Fetch all data in parallel for better performance
      const [summary, recentTransactions, revenueData, categoryData] = await Promise.all([
        this.getTodaySummary(branchId),
        this.getRecentTransactions(5, branchId),
        this.getMonthlyRevenueData(branchId),
        this.getCategoryData(branchId),
      ]);

      // Get today's transaction count
      const todayParams: Record<string, string> = {
        limit: '1000',
      };
      if (branchId) {
        todayParams.branchId = branchId;
      }

      const todayTransactionsResponse = await api.get<TransactionsListResponse>(
        '/transactions',
        { params: todayParams }
      );

      return {
        totalRevenue: summary.total_income,
        totalExpenses: summary.total_expense,
        netProfit: summary.net,
        todayTransactions: todayTransactionsResponse.data.meta.total,
        revenueData,
        categoryData: categoryData.length > 0 ? categoryData : [
          { name: 'لا توجد بيانات', value: 0, color: '#e5e7eb' }
        ],
        recentTransactions,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
