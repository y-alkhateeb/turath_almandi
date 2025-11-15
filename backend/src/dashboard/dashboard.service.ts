import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, UserRole } from '@prisma/client';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface RecentTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  status: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard statistics
   * Optimized to minimize database queries
   */
  async getDashboardStats(date?: string, branchId?: string, user?: RequestUser) {
    // Determine the target date (default to today)
    const targetDate = date ? new Date(date) : new Date();

    // Set to start and end of day for today's summary
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Determine which branch to filter by
    let filterBranchId: string | undefined = undefined;

    if (user) {
      if (user.role === UserRole.ACCOUNTANT) {
        // Accountants can only see their assigned branch
        if (!user.branchId) {
          throw new ForbiddenException('Accountant must be assigned to a branch');
        }
        filterBranchId = user.branchId;
      } else if (user.role === UserRole.ADMIN) {
        // Admins can filter by any branch, or see all branches if not specified
        filterBranchId = branchId;
      }
    } else {
      filterBranchId = branchId;
    }

    // Build base where clause
    const baseWhere: any = {};
    if (filterBranchId) {
      baseWhere.branchId = filterBranchId;
    }

    // Execute all queries in parallel for best performance
    const [
      todayIncome,
      todayExpenses,
      todayTransactionCount,
      recentTransactions,
      monthlyData,
    ] = await Promise.all([
      // Today's income
      this.prisma.transaction.findMany({
        where: {
          ...baseWhere,
          type: TransactionType.INCOME,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Today's expenses
      this.prisma.transaction.findMany({
        where: {
          ...baseWhere,
          type: TransactionType.EXPENSE,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Today's transaction count
      this.prisma.transaction.count({
        where: {
          ...baseWhere,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Recent transactions (last 5)
      this.prisma.transaction.findMany({
        where: baseWhere,
        orderBy: {
          date: 'desc',
        },
        take: 5,
        include: {
          branch: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Last 6 months of data for charts
      this.getMonthlyData(filterBranchId),
    ]);

    // Calculate today's totals
    const totalRevenue = todayIncome.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Get category breakdown from today's income
    const categoryData = this.getCategoryBreakdown(todayIncome);

    // Format recent transactions
    const formattedTransactions: RecentTransaction[] = recentTransactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      status: 'completed',
    }));

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      todayTransactions: todayTransactionCount,
      revenueData: monthlyData,
      categoryData,
      recentTransactions: formattedTransactions,
    };
  }

  /**
   * Get monthly revenue and expense data for the last 6 months
   */
  private async getMonthlyData(branchId?: string): Promise<MonthlyData[]> {
    const monthNames = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
    ];

    const months: MonthlyData[] = [];
    const currentDate = new Date();

    // Build base where clause
    const baseWhere: any = {};
    if (branchId) {
      baseWhere.branchId = branchId;
    }

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      // Get transactions for this month
      const [income, expenses] = await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            ...baseWhere,
            type: TransactionType.INCOME,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        this.prisma.transaction.findMany({
          where: {
            ...baseWhere,
            type: TransactionType.EXPENSE,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
      ]);

      const revenue = income.reduce((sum, t) => sum + Number(t.amount), 0);
      const expenseTotal = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({
        month: monthNames[date.getMonth()],
        revenue,
        expenses: expenseTotal,
      });
    }

    return months;
  }

  /**
   * Get category breakdown from income transactions
   */
  private getCategoryBreakdown(transactions: any[]): CategoryData[] {
    const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

    // Group by category
    const categoryMap = new Map<string, number>();

    transactions.forEach((t) => {
      const category = t.category || 'أخرى';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
    });

    // Convert to array and assign colors
    const categoryData: CategoryData[] = Array.from(categoryMap.entries()).map(
      ([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }),
    );

    // Sort by value descending
    categoryData.sort((a, b) => b.value - a.value);

    // Return empty state if no data
    if (categoryData.length === 0) {
      return [{ name: 'لا توجد بيانات', value: 0, color: '#e5e7eb' }];
    }

    return categoryData;
  }
}
