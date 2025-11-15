export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  status?: 'completed' | 'pending' | 'cancelled';
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayTransactions: number;
  revenueData: RevenueDataPoint[];
  categoryData: CategoryDataPoint[];
  recentTransactions: Transaction[];
}

export interface StatCardData {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber';
}
