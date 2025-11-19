/**
 * useReports Hooks
 * React Query hooks for report generation and export
 *
 * Features:
 * - Financial, Debt, Inventory, and Salary report queries
 * - Excel and PDF export mutations with Blob handling
 * - Download helper function
 * - Manual query triggering (refetchOnMount: false)
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import reportsService from '@/api/services/reportsService';
import { queryKeys } from './queryKeys';
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
 * Query financial report with date range
 * Requires manual triggering (enabled: false by default)
 *
 * @param filters - Financial report filters (branchId?, startDate, endDate)
 * @param options - Query options (enabled)
 * @returns Query result with FinancialReport
 *
 * @example
 * ```tsx
 * const { data, refetch } = useFinancialReport(
 *   { startDate: '2024-01-01', endDate: '2024-01-31' },
 *   { enabled: false }
 * );
 * // Trigger manually:
 * <button onClick={() => refetch()}>Generate</button>
 * ```
 */
export const useFinancialReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<FinancialReport, ApiError>({
    queryKey: queryKeys.reports.financial(filters),
    queryFn: () => reportsService.getFinancialReport(filters),
    enabled: options?.enabled ?? false,
    staleTime: 0, // Always refetch when query is triggered
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useDebtReport Hook
 * Query debt report with optional filters
 * Requires manual triggering (enabled: false by default)
 *
 * @param filters - Debt report filters (branchId?, status?)
 * @param options - Query options (enabled)
 * @returns Query result with DebtReport
 *
 * @example
 * ```tsx
 * const { data, refetch } = useDebtReport(
 *   { status: 'ACTIVE' },
 *   { enabled: false }
 * );
 * ```
 */
export const useDebtReport = (
  filters?: Pick<ReportQueryFilters, 'branchId' | 'status'>,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<DebtReport, ApiError>({
    queryKey: queryKeys.reports.debt(filters),
    queryFn: () => reportsService.getDebtReport(filters),
    enabled: options?.enabled ?? false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useInventoryReport Hook
 * Query inventory report with optional branch filter
 * Requires manual triggering (enabled: false by default)
 *
 * @param filters - Inventory report filters (branchId?)
 * @param options - Query options (enabled)
 * @returns Query result with InventoryReport
 *
 * @example
 * ```tsx
 * const { data, refetch } = useInventoryReport(
 *   { branchId: '123' },
 *   { enabled: false }
 * );
 * ```
 */
export const useInventoryReport = (
  filters?: Pick<ReportQueryFilters, 'branchId'>,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<InventoryReport, ApiError>({
    queryKey: queryKeys.reports.inventory(filters),
    queryFn: () => reportsService.getInventoryReport(filters),
    enabled: options?.enabled ?? false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * useSalaryReport Hook
 * Query salary/payroll report with date range
 * Requires manual triggering (enabled: false by default)
 *
 * @param filters - Salary report filters (branchId?, startDate, endDate)
 * @param options - Query options (enabled)
 * @returns Query result with SalaryReport
 *
 * @example
 * ```tsx
 * const { data, refetch } = useSalaryReport(
 *   { startDate: '2024-01-01', endDate: '2024-01-31' },
 *   { enabled: false }
 * );
 * ```
 */
export const useSalaryReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<SalaryReport, ApiError>({
    queryKey: queryKeys.reports.salary(filters),
    queryFn: () => reportsService.getSalaryReport(filters),
    enabled: options?.enabled ?? false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS - EXPORT
// ============================================

/**
 * useExportExcel Hook
 * Mutation to export report to Excel (.xlsx)
 * Returns Blob for download
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const exportExcel = useExportExcel();
 *
 * const handleExport = async () => {
 *   const blob = await exportExcel.mutateAsync({
 *     reportType: 'financial',
 *     filters: { startDate: '2024-01-01', endDate: '2024-01-31' },
 *     format: 'excel',
 *   });
 *   reportsService.downloadBlob(blob, 'financial-report.xlsx');
 * };
 * ```
 */
export const useExportExcel = () => {
  return useMutation<Blob, ApiError, ReportExportRequest>({
    mutationFn: reportsService.exportToExcel,

    onSuccess: () => {
      // Success toast
      toast.success('تم تصدير التقرير إلى Excel بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
      // Additional error handling if needed
    },
  });
};

/**
 * useExportPDF Hook
 * Mutation to export report to PDF
 * Returns Blob for download
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const exportPdf = useExportPDF();
 *
 * const handleExport = async () => {
 *   const blob = await exportPdf.mutateAsync({
 *     reportType: 'debts',
 *     filters: { status: 'ACTIVE' },
 *     format: 'pdf',
 *   });
 *   reportsService.downloadBlob(blob, 'debt-report.pdf');
 * };
 * ```
 */
export const useExportPDF = () => {
  return useMutation<Blob, ApiError, ReportExportRequest>({
    mutationFn: reportsService.exportToPdf,

    onSuccess: () => {
      // Success toast
      toast.success('تم تصدير التقرير إلى PDF بنجاح');
    },

    onError: () => {
      // Error toast shown by global API interceptor
    },
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useCurrentMonthFinancialReport Hook
 * Query current month financial report
 * Convenience hook with date range preset
 *
 * @param branchId - Optional branch UUID
 * @param options - Query options (enabled)
 * @returns Query result with FinancialReport
 *
 * @example
 * ```tsx
 * const { data } = useCurrentMonthFinancialReport(branchId, { enabled: true });
 * ```
 */
export const useCurrentMonthFinancialReport = (
  branchId?: string,
  options?: {
    enabled?: boolean;
  }
) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return useFinancialReport(
    {
      startDate: firstOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      branchId,
    },
    options
  );
};

/**
 * useActiveDebtsReport Hook
 * Query active debts report
 * Convenience hook with status preset
 *
 * @param branchId - Optional branch UUID
 * @param options - Query options (enabled)
 * @returns Query result with DebtReport
 *
 * @example
 * ```tsx
 * const { data } = useActiveDebtsReport(branchId, { enabled: true });
 * ```
 */
export const useActiveDebtsReport = (
  branchId?: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useDebtReport(
    {
      status: 'ACTIVE',
      branchId,
    },
    options
  );
};
