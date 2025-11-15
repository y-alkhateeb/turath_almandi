import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/types/dashboard';

// Mock data for development
const mockDashboardStats: DashboardStats = {
  totalRevenue: 45000000, // 45M IQD
  totalExpenses: 28000000, // 28M IQD
  netProfit: 17000000, // 17M IQD
  todayTransactions: 156,
  revenueData: [
    { month: 'كانون الثاني', revenue: 35000000, expenses: 22000000 },
    { month: 'شباط', revenue: 38000000, expenses: 24000000 },
    { month: 'آذار', revenue: 42000000, expenses: 26000000 },
    { month: 'نيسان', revenue: 40000000, expenses: 25000000 },
    { month: 'أيار', revenue: 45000000, expenses: 28000000 },
    { month: 'حزيران', revenue: 48000000, expenses: 30000000 },
  ],
  categoryData: [
    { name: 'مبيعات', value: 25000000, color: '#0ea5e9' },
    { name: 'خدمات', value: 12000000, color: '#22c55e' },
    { name: 'طلبات توصيل', value: 8000000, color: '#f59e0b' },
  ],
  recentTransactions: [
    {
      id: '1',
      date: '2025-11-15',
      type: 'INCOME',
      category: 'مبيعات',
      amount: 250000,
      status: 'completed',
    },
    {
      id: '2',
      date: '2025-11-15',
      type: 'EXPENSE',
      category: 'رواتب',
      amount: 150000,
      status: 'completed',
    },
    {
      id: '3',
      date: '2025-11-15',
      type: 'INCOME',
      category: 'خدمات',
      amount: 180000,
      status: 'completed',
    },
    {
      id: '4',
      date: '2025-11-14',
      type: 'EXPENSE',
      category: 'مشتريات',
      amount: 320000,
      status: 'completed',
    },
    {
      id: '5',
      date: '2025-11-14',
      type: 'INCOME',
      category: 'طلبات توصيل',
      amount: 95000,
      status: 'completed',
    },
  ],
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // TODO: Replace with actual API call
      // const response = await api.get('/dashboard/stats');
      // return response.data;

      return mockDashboardStats;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
