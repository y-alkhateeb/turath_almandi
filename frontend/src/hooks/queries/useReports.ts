/**
 * useReports Hooks
 * React Query hooks for report generation and export
 *
 * Features:
 * - Financial report query with date range
 * - Debt report query with status filtering
 * - Inventory report query
 * - Salary report query with date range
 * - Excel export mutation returning Blob
 * - PDF export mutation returning Blob
 * - File download helper
 * - Auto-filter accountants to their branch
 * - Full error handling and strict typing
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import reportsService from '@/api/services/reportsService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from '../useAuth';
import type {
  FinancialReport,
  DebtReport,
  InventoryReport,
  SalaryReport,
  ReportQueryFilters,
  ReportExportRequest,
} from '#/api';
import { ApiError } from '@/api/apiClient';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useFinancialReport Hook
 * Query comprehensive financial report
 *
 * Generates financial summary with:
 * - Total income and expenses
 * - Income by payment method (cash/master)
 * - Income and expenses by category
 * - Daily breakdown (optional)
 * - Net profit calculation
 *
 * Date range is required (startDate and endDate).
 *
 * @param filters - Report filters (branchId?, startDate, endDate) - Required: startDate, endDate
 * @param options - Query options (enabled, etc.)
 * @returns Query result with FinancialReport
 *
 * @example
 * ```tsx
 * const { data: report, isLoading, error } = useFinancialReport({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   branchId: 'branch-uuid', // Optional for admins
 * });
 *
 * if (report) {
 *   console.log('Total Income:', report.summary.totalIncome);
 *   console.log('Net Profit:', report.summary.netProfit);
 *   report.incomeByCategory.forEach(cat => {
 *     console.log(`${cat.category}: ${cat.amount}`);
 *   });
 * }
 * ```
 */
export const useFinancialReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>,
  options?: {
    enabled?: boolean;
  },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters.branchId,
  };

  // Only enable if dates are provided
  const hasRequiredFilters = !!(appliedFilters.startDate && appliedFilters.endDate);

  return useQuery<FinancialReport, ApiError>({
    queryKey: queryKeys.reports.financial(appliedFilters),
    queryFn: () => reportsService.getFinancialReport(appliedFilters),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
    enabled: hasRequiredFilters && (options?.enabled ?? true),
  });
};

/**
 * useDebtReport Hook
 * Query debt summary and listing
 *
 * Generates debt report with:
 * - Total debts count and amounts
 * - Total paid and remaining amounts
 * - Breakdown by status (ACTIVE, PAID, PARTIAL, OVERDUE)
 * - List of all debts with details
 * - Overdue days calculation
 *
 * @param filters - Report filters (branchId?, status?)
 * @param options - Query options (enabled, etc.)
 * @returns Query result with DebtReport
 *
 * @example
 * ```tsx
 * // All debts
 * const { data: allDebts } = useDebtReport({});
 *
 * // Active debts only
 * const { data: activeDebts } = useDebtReport({ status: 'ACTIVE' });
 *
 * // Overdue debts for specific branch
 * const { data: overdueDebts } = useDebtReport({
 *   branchId: 'branch-uuid',
 *   status: 'OVERDUE',
 * });
 *
 * if (allDebts) {
 *   console.log('Total Debts:', allDebts.summary.totalDebts);
 *   console.log('Total Amount:', allDebts.summary.totalAmount);
 *   console.log('Remaining:', allDebts.summary.totalRemaining);
 * }
 * ```
 */
export const useDebtReport = (
  filters?: Pick<ReportQueryFilters, 'branchId' | 'status'>,
  options?: {
    enabled?: boolean;
  },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<DebtReport, ApiError>({
    queryKey: queryKeys.reports.debt(appliedFilters),
    queryFn: () => reportsService.getDebtReport(appliedFilters),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
    enabled: options?.enabled ?? true,
  });
};

/**
 * useInventoryReport Hook
 * Query current inventory status
 *
 * Generates inventory report with:
 * - Total items count and value
 * - Low stock and out of stock items
 * - Detailed item listing with quantities
 * - Breakdown by unit type
 * - Auto-added vs manual items
 *
 * @param filters - Report filters (branchId?)
 * @param options - Query options (enabled, etc.)
 * @returns Query result with InventoryReport
 *
 * @example
 * ```tsx
 * // All inventory
 * const { data: inventory } = useInventoryReport();
 *
 * // Specific branch inventory
 * const { data: branchInventory } = useInventoryReport({
 *   branchId: 'branch-uuid',
 * });
 *
 * if (inventory) {
 *   console.log('Total Items:', inventory.summary.totalItems);
 *   console.log('Total Value:', inventory.summary.totalValue);
 *   console.log('Low Stock Items:', inventory.summary.lowStockItems);
 *
 *   inventory.items.forEach(item => {
 *     console.log(`${item.name}: ${item.quantity} ${item.unit}`);
 *   });
 * }
 * ```
 */
export const useInventoryReport = (
  filters?: Pick<ReportQueryFilters, 'branchId'>,
  options?: {
    enabled?: boolean;
  },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<InventoryReport, ApiError>({
    queryKey: queryKeys.reports.inventory(appliedFilters.branchId),
    queryFn: () => reportsService.getInventoryReport(appliedFilters),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
    enabled: options?.enabled ?? true,
  });
};

/**
 * useSalaryReport Hook
 * Query salary/payroll summary
 *
 * Generates salary report with:
 * - Total salaries paid in period
 * - Employee count
 * - Average salary per employee
 * - Detailed per-employee breakdown
 * - Monthly aggregation (optional)
 *
 * Date range is required (startDate and endDate).
 *
 * @param filters - Report filters (branchId?, startDate, endDate) - Required: startDate, endDate
 * @param options - Query options (enabled, etc.)
 * @returns Query result with SalaryReport
 *
 * @example
 * ```tsx
 * const { data: salaries, isLoading } = useSalaryReport({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   branchId: 'branch-uuid', // Optional for admins
 * });
 *
 * if (salaries) {
 *   console.log('Total Paid:', salaries.summary.totalPaid);
 *   console.log('Employees:', salaries.summary.employeeCount);
 *   console.log('Average:', salaries.summary.averageSalary);
 *
 *   salaries.employees.forEach(emp => {
 *     console.log(`${emp.employeeName}: ${emp.totalPaid}`);
 *   });
 * }
 * ```
 */
export const useSalaryReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>,
  options?: {
    enabled?: boolean;
  },
) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters.branchId,
  };

  // Only enable if dates are provided
  const hasRequiredFilters = !!(appliedFilters.startDate && appliedFilters.endDate);

  return useQuery<SalaryReport, ApiError>({
    queryKey: queryKeys.reports.salary(appliedFilters),
    queryFn: () => reportsService.getSalaryReport(appliedFilters),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
    enabled: hasRequiredFilters && (options?.enabled ?? true),
  });
};

// ============================================
// EXPORT MUTATION HOOKS
// ============================================

/**
 * useExportExcel Hook
 * Mutation to export report to Excel format
 *
 * Exports any report type to .xlsx file.
 * Returns Blob that can be downloaded using downloadReport helper.
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const exportExcel = useExportExcel();
 *
 * const handleExport = async () => {
 *   try {
 *     const blob = await exportExcel.mutateAsync({
 *       reportType: 'financial',
 *       filters: {
 *         startDate: '2024-01-01',
 *         endDate: '2024-01-31',
 *         branchId: branchId,
 *       },
 *     });
 *
 *     // Download the file
 *     downloadReport(blob, 'financial-report-2024-01.xlsx');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useExportExcel = () => {
  return useMutation<Blob, ApiError, ReportExportRequest>({
    mutationFn: reportsService.exportToExcel,

    onError: (error) => {
      // Show error toast
      if (error.statusCode === 400) {
        toast.error('الرجاء التحقق من نوع التقرير والفلاتر');
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لتصدير التقارير');
      } else {
        toast.error('حدث خطأ أثناء تصدير التقرير إلى Excel');
      }
    },

    onSuccess: () => {
      toast.success('تم تصدير التقرير إلى Excel بنجاح');
    },
  });
};

/**
 * useExportPDF Hook
 * Mutation to export report to PDF format
 *
 * Exports any report type to .pdf file.
 * Returns Blob that can be downloaded using downloadReport helper.
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const exportPDF = useExportPDF();
 *
 * const handleExport = async () => {
 *   try {
 *     const blob = await exportPDF.mutateAsync({
 *       reportType: 'debts',
 *       filters: {
 *         status: 'OVERDUE',
 *         branchId: branchId,
 *       },
 *     });
 *
 *     // Download the file
 *     downloadReport(blob, 'overdue-debts-report.pdf');
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useExportPDF = () => {
  return useMutation<Blob, ApiError, ReportExportRequest>({
    mutationFn: reportsService.exportToPdf,

    onError: (error) => {
      // Show error toast
      if (error.statusCode === 400) {
        toast.error('الرجاء التحقق من نوع التقرير والفلاتر');
      } else if (error.statusCode === 403) {
        toast.error('ليس لديك صلاحية لتصدير التقارير');
      } else {
        toast.error('حدث خطأ أثناء تصدير التقرير إلى PDF');
      }
    },

    onSuccess: () => {
      toast.success('تم تصدير التقرير إلى PDF بنجاح');
    },
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * downloadReport Helper
 * Triggers file download in browser
 *
 * Creates a temporary download link, triggers click,
 * and cleans up properly to avoid memory leaks.
 *
 * @param blob - File Blob to download
 * @param filename - Desired filename (e.g., 'report.xlsx', 'report.pdf')
 *
 * @example
 * ```tsx
 * const exportExcel = useExportExcel();
 *
 * const handleDownload = async () => {
 *   const blob = await exportExcel.mutateAsync({
 *     reportType: 'financial',
 *     filters: { startDate: '2024-01-01', endDate: '2024-01-31' },
 *   });
 *
 *   // Download with custom filename
 *   downloadReport(blob, 'التقرير-المالي-يناير-2024.xlsx');
 * };
 *
 * // Or generate filename based on report type and date
 * const generateFilename = (type: string, format: 'xlsx' | 'pdf') => {
 *   const date = new Date().toISOString().split('T')[0];
 *   return `${type}-report-${date}.${format}`;
 * };
 *
 * downloadReport(blob, generateFilename('financial', 'xlsx'));
 * ```
 */
export const downloadReport = (blob: Blob, filename: string): void => {
  // Create object URL from Blob
  const url = window.URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useCurrentMonthFinancialReport Hook
 * Query current month financial report (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with current month FinancialReport
 */
export const useCurrentMonthFinancialReport = (branchId?: string) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useFinancialReport({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * useActiveDebtsReport Hook
 * Query active debts report (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with active debts DebtReport
 */
export const useActiveDebtsReport = (branchId?: string) => {
  return useDebtReport({ status: 'ACTIVE', branchId });
};

/**
 * useOverdueDebtsReport Hook
 * Query overdue debts report (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with overdue debts DebtReport
 */
export const useOverdueDebtsReport = (branchId?: string) => {
  return useDebtReport({ status: 'OVERDUE', branchId });
};

/**
 * useCurrentMonthSalaryReport Hook
 * Query current month salary report (convenience hook)
 *
 * @param branchId - Optional branch UUID
 * @returns Query result with current month SalaryReport
 */
export const useCurrentMonthSalaryReport = (branchId?: string) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useSalaryReport({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};
