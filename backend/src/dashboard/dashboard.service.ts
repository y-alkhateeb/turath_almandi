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

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
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
  // Currency removed - now frontend-only display
  paymentMethod: string | null;
  branch?: {
    name: string;
  };
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

interface BranchPerformance {
  branchId: string;
  branchName: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

interface PaymentMethodBreakdown {
  cash: number;
  mastercard: number;
  cashPercentage: number;
  mastercardPercentage: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get total revenue with optional date range and branch filtering
   */
  async getTotalRevenue(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<number> {
    const where = this.buildWhereClause(user, dateRange, branchId, TransactionType.INCOME);

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get total expenses with optional date range and branch filtering
   */
  async getTotalExpenses(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<number> {
    const where = this.buildWhereClause(user, dateRange, branchId, TransactionType.EXPENSE);

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get net profit (revenue - expenses) with optional date range and branch filtering
   */
  async getNetProfit(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<number> {
    const [revenue, expenses] = await Promise.all([
      this.getTotalRevenue(user, dateRange, branchId),
      this.getTotalExpenses(user, dateRange, branchId),
    ]);

    return revenue - expenses;
  }

  /**
   * Get today's transaction count with optional branch filtering
   */
  async getTodayTransactions(user: RequestUser, branchId?: string): Promise<number> {
    const today = getCurrentTimestamp();
    const startOfDay = getStartOfDay(today);
    const endOfDay = getEndOfDay(today);

    const where = this.buildWhereClause(
      user,
      { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() },
      branchId,
    );

    return await this.prisma.transaction.count({ where });
  }

  /**
   * Get revenue data for the last 6 months with optional branch filtering
   */
  async getRevenueData(user: RequestUser, branchId?: string, months: number = 6): Promise<MonthlyData[]> {
    const filterBranchId = this.determineBranchId(user, branchId);

    const monthNames = [
      'كانون الثاني',
      'شباط',
      'آذار',
      'نيسان',
      'أيار',
      'حزيران',
      'تموز',
      'آب',
      'أيلول',
      'تشرين الأول',
      'تشرين الثاني',
      'كانون الأول',
    ];

    const monthlyData: MonthlyData[] = [];
    const currentDate = getCurrentTimestamp();

    // Build base where clause
    const baseWhere: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };
    if (filterBranchId) {
      baseWhere.branchId = filterBranchId;
    }

    // Get last N months
    for (let i = months - 1; i >= 0; i--) {
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
      const expenses = Number(expensesAggregate._sum.amount || 0);

      monthlyData.push({
        month: monthNames[date.getMonth()],
        revenue,
        expenses,
      });
    }

    return monthlyData;
  }

  /**
   * Get category data breakdown with optional date range and branch filtering
   */
  async getCategoryData(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<CategoryData[]> {
    const where = this.buildWhereClause(user, dateRange, branchId, TransactionType.INCOME);

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        category: true,
        amount: true,
      },
    });

    return this.calculateCategoryBreakdown(transactions);
  }

  /**
   * Compare performance across all branches
   * Returns array sorted by net profit (descending)
   * Accountants can only see their own branch
   */
  async compareBranches(
    user: RequestUser,
    dateRange?: DateRangeFilter,
  ): Promise<BranchPerformance[]> {
    // Determine which branches the user can access
    let branchFilter: Prisma.BranchWhereInput = {};

    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants can only see their assigned branch
      if (!user.branchId) {
        throw new ForbiddenException('accountantMustBeAssignedToBranch');
      }
      branchFilter = { id: user.branchId };
    }
    // Admins can see all branches (no filter needed)

    // Get all branches
    const branches = await this.prisma.branch.findMany({
      where: branchFilter,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build date range filter for transactions
    const dateFilter: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };
    if (dateRange) {
      dateFilter.date = {};
      if (dateRange.startDate) {
        dateFilter.date.gte = formatDateForDB(dateRange.startDate);
      }
      if (dateRange.endDate) {
        dateFilter.date.lte = formatDateForDB(dateRange.endDate);
      }
    }

    // Get performance data for each branch in parallel
    const branchPerformancePromises = branches.map(async (branch) => {
      const branchWhere: Prisma.TransactionWhereInput = {
        ...dateFilter,
        branchId: branch.id,
      };

      // Get revenue and expenses in parallel
      const [revenueResult, expensesResult] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            ...branchWhere,
            type: TransactionType.INCOME,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            ...branchWhere,
            type: TransactionType.EXPENSE,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const revenue = Number(revenueResult._sum.amount || 0);
      const expenses = Number(expensesResult._sum.amount || 0);
      const netProfit = revenue - expenses;

      return {
        branchId: branch.id,
        branchName: branch.name,
        revenue,
        expenses,
        netProfit,
      };
    });

    const branchPerformances = await Promise.all(branchPerformancePromises);

    // Sort by net profit descending (best performing first)
    branchPerformances.sort((a, b) => b.netProfit - a.netProfit);

    return branchPerformances;
  }

  /**
   * Get payment method breakdown showing cash vs mastercard amounts and percentages
   * Useful for understanding payment preferences and cash flow
   */
  async getPaymentMethodBreakdown(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
  ): Promise<PaymentMethodBreakdown> {
    // Build where clause with filters
    const baseWhere = this.buildWhereClause(user, dateRange, branchId);

    // Get cash transactions total
    const cashResult = await this.prisma.transaction.aggregate({
      where: {
        ...baseWhere,
        paymentMethod: 'CASH',
      },
      _sum: {
        amount: true,
      },
    });

    // Get mastercard transactions total
    const mastercardResult = await this.prisma.transaction.aggregate({
      where: {
        ...baseWhere,
        paymentMethod: 'MASTER',
      },
      _sum: {
        amount: true,
      },
    });

    const cash = Number(cashResult._sum.amount || 0);
    const mastercard = Number(mastercardResult._sum.amount || 0);
    const total = cash + mastercard;

    // Calculate percentages (avoid division by zero)
    const cashPercentage = total > 0 ? (cash / total) * 100 : 0;
    const mastercardPercentage = total > 0 ? (mastercard / total) * 100 : 0;

    return {
      cash,
      mastercard,
      cashPercentage: Math.round(cashPercentage * 100) / 100, // Round to 2 decimal places
      mastercardPercentage: Math.round(mastercardPercentage * 100) / 100,
    };
  }

  /**
   * Get comprehensive dashboard statistics
   * Optimized to minimize database queries
   * Supports both single date and date range filtering
   */
  async getDashboardStats(
    date?: string,
    startDate?: string,
    endDate?: string,
    branchId?: string,
    user?: RequestUser,
  ): Promise<DashboardStats> {
    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    // Determine date range:
    // 1. If startDate/endDate provided, use them
    // 2. Otherwise, use single date (defaults to today)
    let dateRange: { startDate: string; endDate: string };

    if (startDate && endDate) {
      // Use provided date range
      dateRange = {
        startDate: formatDateForDB(startDate).toISOString(),
        endDate: formatDateForDB(endDate).toISOString(),
      };
    } else if (startDate || endDate) {
      // If only one is provided, use it as both start and end
      const singleDate = formatDateForDB(startDate || endDate!);
      dateRange = {
        startDate: getStartOfDay(singleDate).toISOString(),
        endDate: getEndOfDay(singleDate).toISOString(),
      };
    } else {
      // Use single date or default to today
      const targetDate = date ? formatDateForDB(date) : getCurrentTimestamp();
      dateRange = {
        startDate: getStartOfDay(targetDate).toISOString(),
        endDate: getEndOfDay(targetDate).toISOString(),
      };
    }

    // Execute all queries in parallel for best performance
    const [
      totalRevenue,
      totalExpenses,
      netProfit,
      todayTransactions,
      revenueData,
      categoryData,
      recentTransactions,
    ] = await Promise.all([
      this.getTotalRevenue(user, dateRange, branchId),
      this.getTotalExpenses(user, dateRange, branchId),
      this.getNetProfit(user, dateRange, branchId),
      this.getTodayTransactions(user, branchId),
      this.getRevenueData(user, branchId, 6),
      this.getCategoryData(user, dateRange, branchId),
      this.getRecentTransactions(user, branchId, 5),
    ]);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      todayTransactions,
      revenueData,
      categoryData,
      recentTransactions,
    };
  }

  /**
   * Get recent transactions with optional branch filtering
   */
  private async getRecentTransactions(
    user: RequestUser,
    branchId?: string,
    limit: number = 5,
  ): Promise<RecentTransaction[]> {
    const filterBranchId = this.determineBranchId(user, branchId);

    const baseWhere: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };
    if (filterBranchId) {
      baseWhere.branchId = filterBranchId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where: baseWhere,
      orderBy: {
        date: 'desc',
      },
      take: limit,
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      // Currency is now frontend-only, not stored in database
      paymentMethod: t.paymentMethod,
      branch: t.branch ? { name: t.branch.name } : undefined,
      status: 'completed',
    }));
  }

  /**
   * Build where clause based on user role, date range, branch, and transaction type
   */
  private buildWhereClause(
    user: RequestUser,
    dateRange?: DateRangeFilter,
    branchId?: string,
    transactionType?: TransactionType,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };

    // Apply branch filtering based on user role
    const filterBranchId = this.determineBranchId(user, branchId);
    if (filterBranchId) {
      where.branchId = filterBranchId;
    }

    // Apply date range filter
    if (dateRange) {
      where.date = {};
      if (dateRange.startDate) {
        where.date.gte = formatDateForDB(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.date.lte = formatDateForDB(dateRange.endDate);
      }
    }

    // Apply transaction type filter
    if (transactionType) {
      where.type = transactionType;
    }

    return where;
  }

  /**
   * Determine which branch ID to filter by based on user role
   */
  private determineBranchId(user: RequestUser, requestedBranchId?: string): string | undefined {
    if (user.role === UserRole.ACCOUNTANT) {
      // Accountants can only see their assigned branch
      if (!user.branchId) {
        throw new ForbiddenException('accountantMustBeAssignedToBranch');
      }
      return user.branchId;
    } else if (user.role === UserRole.ADMIN) {
      // Admins can filter by any branch, or see all branches if not specified
      return requestedBranchId;
    }

    return requestedBranchId;
  }

  /**
   * Calculate category breakdown from transactions
   */
  private calculateCategoryBreakdown(
    transactions: Array<{ category: string; amount: Prisma.Decimal }>,
  ): CategoryData[] {
    const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

    // Group by category
    const categoryMap = new Map<string, number>();

    transactions.forEach((t) => {
      const category = t.category || 'أخرى';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
    });

    // Convert to array and assign colors
    // Note: Using 'category' instead of 'name' to match frontend CategoryDataPoint interface
    const categoryData: CategoryData[] = Array.from(categoryMap.entries()).map(([category, value], index) => ({
      name: category, // Keep 'name' for backward compatibility with existing type
      value,
      color: colors[index % colors.length],
    }));

    // Sort by value descending
    categoryData.sort((a, b) => b.value - a.value);

    // Return empty state if no data
    if (categoryData.length === 0) {
      return [{ name: 'لا توجد بيانات', value: 0, color: '#e5e7eb' }];
    }

    return categoryData;
  }
}
