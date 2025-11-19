/**
 * Reports Service
 * Generate and export various business reports
 *
 * Endpoints:
 * - GET /reports/financial?branchId&startDate&endDate � FinancialReport
 * - GET /reports/debts?branchId&status � DebtReport
 * - GET /reports/inventory?branchId � InventoryReport
 * - GET /reports/salaries?branchId&startDate&endDate � SalaryReport
 * - POST /reports/export/excel � Blob
 * - POST /reports/export/pdf � Blob
 *
 * All types match backend DTOs exactly. No any types.
 * Blob responses handled correctly for file downloads.
 */

import apiClient, { axiosInstance } from '../apiClient';
import type {
  FinancialReport,
  DebtReport,
  InventoryReport,
  SalaryReport,
  ReportQueryFilters,
  ReportExportRequest,
} from '#/api';

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Reports API endpoints enum
 * Centralized endpoint definitions
 */
export enum ReportsApiEndpoints {
  GetFinancialReport = '/reports/financial',
  GetDebtReport = '/reports/debts',
  GetInventoryReport = '/reports/inventory',
  GetSalaryReport = '/reports/salaries',
  ExportExcel = '/reports/export/excel',
  ExportPdf = '/reports/export/pdf',
}

// ============================================
// REPORTS SERVICE METHODS
// ============================================

/**
 * Get financial report
 * GET /reports/financial?branchId&startDate&endDate
 *
 * Generates comprehensive financial summary:
 * - Total income and expenses
 * - Income by payment method (cash/master)
 * - Income and expenses by category
 * - Daily breakdown (optional)
 * - Net profit calculation
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by any branch or see all
 * - Date range required (startDate and endDate)
 * - Includes only non-deleted transactions
 * - Groups transactions by category
 *
 * @param filters - Query filters (branchId?, startDate, endDate)
 * @returns FinancialReport with comprehensive financial data
 * @throws ApiError on 400 (missing dates), 401
 */
export const getFinancialReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>
): Promise<FinancialReport> => {
  if (!filters.startDate || !filters.endDate) {
    throw new Error('startDate and endDate are required for financial report');
  }

  return apiClient.get<FinancialReport>({
    url: ReportsApiEndpoints.GetFinancialReport,
    params: filters,
  });
};

/**
 * Get debt report
 * GET /reports/debts?branchId&status
 *
 * Generates debt summary and detailed listing:
 * - Total debts count and amounts
 * - Total paid and remaining amounts
 * - Breakdown by status (ACTIVE, PAID, PARTIAL, OVERDUE)
 * - List of all debts with details
 * - Overdue days calculation
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by any branch or see all
 * - Optional status filter (ACTIVE, PAID, PARTIAL, OVERDUE)
 * - Includes payment history summary
 * - Excludes deleted debts
 *
 * @param filters - Query filters (branchId?, status?)
 * @returns DebtReport with debt summary and listing
 * @throws ApiError on 401
 */
export const getDebtReport = (
  filters?: Pick<ReportQueryFilters, 'branchId' | 'status'>
): Promise<DebtReport> => {
  return apiClient.get<DebtReport>({
    url: ReportsApiEndpoints.GetDebtReport,
    params: filters,
  });
};

/**
 * Get inventory report
 * GET /reports/inventory?branchId
 *
 * Generates current inventory status:
 * - Total items count and value
 * - Low stock and out of stock items
 * - Detailed item listing with quantities
 * - Breakdown by unit type
 * - Auto-added vs manual items
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by any branch or see all
 * - Includes all active inventory items
 * - Calculates total value (quantity * costPerUnit)
 * - Groups by unit for aggregation
 *
 * @param filters - Query filters (branchId?)
 * @returns InventoryReport with inventory status
 * @throws ApiError on 401
 */
export const getInventoryReport = (
  filters?: Pick<ReportQueryFilters, 'branchId'>
): Promise<InventoryReport> => {
  return apiClient.get<InventoryReport>({
    url: ReportsApiEndpoints.GetInventoryReport,
    params: filters,
  });
};

/**
 * Get salary report
 * GET /reports/salaries?branchId&startDate&endDate
 *
 * Generates salary/payroll summary:
 * - Total salaries paid in period
 * - Employee count
 * - Average salary per employee
 * - Detailed per-employee breakdown
 * - Monthly aggregation (optional)
 *
 * Backend behavior:
 * - Accountants: Auto-filtered to their branch
 * - Admins: Can filter by any branch or see all
 * - Date range required (startDate and endDate)
 * - Includes only EXPENSE transactions with category containing "salary" or "payroll"
 * - Groups by employeeVendorName for per-employee totals
 *
 * @param filters - Query filters (branchId?, startDate, endDate)
 * @returns SalaryReport with payroll summary
 * @throws ApiError on 400 (missing dates), 401
 */
export const getSalaryReport = (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>
): Promise<SalaryReport> => {
  if (!filters.startDate || !filters.endDate) {
    throw new Error('startDate and endDate are required for salary report');
  }

  return apiClient.get<SalaryReport>({
    url: ReportsApiEndpoints.GetSalaryReport,
    params: filters,
  });
};

// ============================================
// EXPORT METHODS (Blob Handling)
// ============================================

/**
 * Export report to Excel
 * POST /reports/export/excel
 *
 * Exports a report to Excel (.xlsx) format:
 * - Returns file as Blob for download
 * - Includes formatted tables and charts
 * - Proper Excel styling (headers, totals, etc.)
 * - Filename generated by backend
 *
 * Backend behavior:
 * - Generates report based on reportType and filters
 * - Creates Excel file with multiple sheets if applicable
 * - Returns file with proper Content-Type and Content-Disposition headers
 * - Filename includes report type and date range
 *
 * @param request - Export request with reportType and filters
 * @returns Blob - Excel file for download
 * @throws ApiError on 400 (invalid reportType), 401
 */
export const exportToExcel = async (request: ReportExportRequest): Promise<Blob> => {
  const response = await axiosInstance.post<Blob>(ReportsApiEndpoints.ExportExcel, request, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

/**
 * Export report to PDF
 * POST /reports/export/pdf
 *
 * Exports a report to PDF format:
 * - Returns file as Blob for download
 * - Includes formatted tables and headers
 * - Professional PDF styling
 * - Filename generated by backend
 *
 * Backend behavior:
 * - Generates report based on reportType and filters
 * - Creates PDF with proper formatting
 * - Returns file with proper Content-Type and Content-Disposition headers
 * - Filename includes report type and date range
 *
 * @param request - Export request with reportType and filters
 * @returns Blob - PDF file for download
 * @throws ApiError on 400 (invalid reportType), 401
 */
export const exportToPdf = async (request: ReportExportRequest): Promise<Blob> => {
  const response = await axiosInstance.post<Blob>(ReportsApiEndpoints.ExportPdf, request, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Download blob as file
 * Helper to trigger file download in browser
 *
 * @param blob - Blob to download
 * @param filename - Filename for download
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get current month financial report
 * GET /reports/financial?startDate=firstOfMonth&endDate=today
 *
 * Convenience method for current month financial report
 *
 * @param branchId - Optional branch UUID
 * @returns FinancialReport for current month
 * @throws ApiError on 401
 */
export const getCurrentMonthFinancialReport = (branchId?: string): Promise<FinancialReport> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getFinancialReport({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * Get active debts report
 * GET /reports/debts?status=ACTIVE
 *
 * Convenience method for active debts only
 *
 * @param branchId - Optional branch UUID
 * @returns DebtReport for active debts
 * @throws ApiError on 401
 */
export const getActiveDebtsReport = (branchId?: string): Promise<DebtReport> => {
  return getDebtReport({
    status: 'ACTIVE',
    branchId,
  });
};

/**
 * Get overdue debts report
 * GET /reports/debts?status=OVERDUE
 *
 * Convenience method for overdue debts only
 *
 * @param branchId - Optional branch UUID
 * @returns DebtReport for overdue debts
 * @throws ApiError on 401
 */
export const getOverdueDebtsReport = (branchId?: string): Promise<DebtReport> => {
  return getDebtReport({
    status: 'OVERDUE',
    branchId,
  });
};

/**
 * Get current month salary report
 * GET /reports/salaries?startDate=firstOfMonth&endDate=today
 *
 * Convenience method for current month payroll
 *
 * @param branchId - Optional branch UUID
 * @returns SalaryReport for current month
 * @throws ApiError on 401
 */
export const getCurrentMonthSalaryReport = (branchId?: string): Promise<SalaryReport> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return getSalaryReport({
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    branchId,
  });
};

/**
 * Export financial report to Excel
 * POST /reports/export/excel
 *
 * Convenience method for exporting financial report
 *
 * @param filters - Report filters
 * @returns Blob - Excel file
 * @throws ApiError on 400, 401
 */
export const exportFinancialToExcel = async (
  filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>
): Promise<Blob> => {
  return exportToExcel({
    reportType: 'financial',
    filters,
    format: 'excel',
  });
};

/**
 * Export debt report to PDF
 * POST /reports/export/pdf
 *
 * Convenience method for exporting debt report
 *
 * @param filters - Report filters
 * @returns Blob - PDF file
 * @throws ApiError on 400, 401
 */
export const exportDebtToPdf = async (
  filters?: Pick<ReportQueryFilters, 'branchId' | 'status'>
): Promise<Blob> => {
  return exportToPdf({
    reportType: 'debts',
    filters,
    format: 'pdf',
  });
};

/**
 * Export inventory report to Excel
 * POST /reports/export/excel
 *
 * Convenience method for exporting inventory report
 *
 * @param branchId - Optional branch UUID
 * @returns Blob - Excel file
 * @throws ApiError on 400, 401
 */
export const exportInventoryToExcel = async (branchId?: string): Promise<Blob> => {
  return exportToExcel({
    reportType: 'inventory',
    filters: { branchId },
    format: 'excel',
  });
};

// ============================================
// EXPORTS
// ============================================

/**
 * Reports service object with all methods
 * Use named exports or default object
 */
const reportsService = {
  getFinancialReport,
  getDebtReport,
  getInventoryReport,
  getSalaryReport,
  exportToExcel,
  exportToPdf,
  downloadBlob,
  getCurrentMonthFinancialReport,
  getActiveDebtsReport,
  getOverdueDebtsReport,
  getCurrentMonthSalaryReport,
  exportFinancialToExcel,
  exportDebtToPdf,
  exportInventoryToExcel,
};

export default reportsService;
