import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, UserRole, Transaction, Prisma } from '@prisma/client';
import {
  formatDateForDB,
  getCurrentTimestamp,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
} from '../common/utils/date.utils';

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

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayTransactions: number;
  revenueData: MonthlyData[];
  categoryData: CategoryData[];
  recentTransactions: RecentTransaction[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard statistics
   * Optimized to minimize database queries
   */
  async getDashboardStats(date?: string, branchId?: string, user?: RequestUser): Promise<DashboardStats> {
    // Determine the target date (default to today)
    const targetDate = date ? formatDateForDB(date) : getCurrentTimestamp();

    // Set to start and end of day for today's summary
    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

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
    const baseWhere: Prisma.TransactionWhereInput = {};
    if (filterBranchId) {
      baseWhere.branchId = filterBranchId;
    }

    // Build where clause for today's transactions
    const todayWhere: Prisma.TransactionWhereInput = {
      ...baseWhere,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Execute all queries in parallel for best performance
    const [
      todayIncomeAggregate,
      todayExpensesAggregate,
      todayIncomeTransactions,
      todayTransactionCount,
      recentTransactions,
      monthlyData,
    ] = await Promise.all([
      // Aggregate today's income
      this.prisma.transaction.aggregate({
        where: {
          ...todayWhere,
          type: TransactionType.INCOME,
        },
        _sum: {
          amount: true,
        },
      }),

      // Aggregate today's expenses
      this.prisma.transaction.aggregate({
        where: {
          ...todayWhere,
          type: TransactionType.EXPENSE,
        },
        _sum: {
          amount: true,
        },
      }),

      // Get today's income transactions for category breakdown
      this.prisma.transaction.findMany({
        where: {
          ...todayWhere,
          type: TransactionType.INCOME,
        },
      }),

      // Today's transaction count
      this.prisma.transaction.count({
        where: todayWhere,
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

    // Extract aggregated values
    const totalRevenue = Number(todayIncomeAggregate._sum.amount || 0);
    const totalExpenses = Number(todayExpensesAggregate._sum.amount || 0);
    const netProfit = totalRevenue - totalExpenses;

    // Get category breakdown from today's income
    const categoryData = this.getCategoryBreakdown(todayIncomeTransactions);

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
    const currentDate = getCurrentTimestamp();

    // Build base where clause
    const baseWhere: Prisma.TransactionWhereInput = {};
    if (branchId) {
      baseWhere.branchId = branchId;
    }

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = getStartOfMonth(date);
      const endOfMonth = getEndOfMonth(date);

      const monthWhere: Prisma.TransactionWhereInput = {
        ...baseWhere,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };

      // Use aggregate queries for this month
      const [incomeAggregate, expensesAggregate] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            ...monthWhere,
            type: TransactionType.INCOME,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            ...monthWhere,
            type: TransactionType.EXPENSE,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const revenue = Number(incomeAggregate._sum.amount || 0);
      const expenseTotal = Number(expensesAggregate._sum.amount || 0);

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
  private getCategoryBreakdown(transactions: Transaction[]): CategoryData[] {
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
