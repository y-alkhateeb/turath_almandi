/**
 * Reports Service Tests
 * Tests for reports API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type {
  FinancialReport,
  DebtReport,
  InventoryReport,
  SalaryReport,
  ReportQueryFilters,
  ReportExportRequest,
} from '#/api';

// Mock the apiClient module and axiosInstance
vi.mock('../apiClient', () => ({
  default: mockApiClient,
  axiosInstance: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import after mocking
import * as reportsService from './reportsService';
import { ReportsApiEndpoints } from './reportsService';
import { axiosInstance } from '../apiClient';

// Get the mocked axiosInstance
const mockAxiosInstance = axiosInstance as any;

describe('reportsService', () => {
  const mockFinancialReport: FinancialReport = {
    totalIncome: 50000,
    totalExpenses: 30000,
    netProfit: 20000,
    incomeByPaymentMethod: {
      CASH: 25000,
      MASTER: 25000,
    },
    expensesByCategory: {
      Salaries: 20000,
      Utilities: 10000,
    },
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  };

  const mockDebtReport: DebtReport = {
    totalDebts: 10,
    activeDebts: 5,
    paidDebts: 3,
    partialDebts: 2,
    totalOwed: 15000,
    overdueDebts: 1,
    debts: [],
  };

  const mockInventoryReport: InventoryReport = {
    totalItems: 50,
    totalValue: 25000,
    lowStockItems: 5,
    outOfStockItems: 2,
    items: [],
  };

  const mockSalaryReport: SalaryReport = {
    totalSalaries: 40000,
    employeeCount: 10,
    averageSalary: 4000,
    salariesByEmployee: {},
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  };

  beforeEach(() => {
    resetApiClientMocks();
    vi.clearAllMocks();
  });

  describe('getFinancialReport', () => {
    it('should get financial report with date range', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockFinancialReport));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = await reportsService.getFinancialReport(filters);

      expect(result).toEqual(mockFinancialReport);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetFinancialReport,
        params: filters,
      });
    });

    it('should get financial report with branch filter', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockFinancialReport));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        branchId: 'branch-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await reportsService.getFinancialReport(filters);

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetFinancialReport,
        params: filters,
      });
    });

    it('should throw error when startDate is missing', () => {
      const filters = {
        endDate: '2024-12-31',
      } as Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>;

      expect(() => reportsService.getFinancialReport(filters)).toThrow('startDate and endDate are required');
    });

    it('should throw error when endDate is missing', () => {
      const filters = {
        startDate: '2024-01-01',
      } as Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>;

      expect(() => reportsService.getFinancialReport(filters)).toThrow('startDate and endDate are required');
    });

    it('should handle 400 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(400, 'Invalid date range'));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await expect(reportsService.getFinancialReport(filters)).rejects.toThrow('Invalid date range');
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await expect(reportsService.getFinancialReport(filters)).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockFinancialReport));

      const result = reportsService.getFinancialReport({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      const _typeCheck: Promise<FinancialReport> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getDebtReport', () => {
    it('should get debt report without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      const result = await reportsService.getDebtReport();

      expect(result).toEqual(mockDebtReport);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: undefined,
      });
    });

    it('should get debt report with filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'status'> = {
        branchId: 'branch-123',
        status: 'ACTIVE',
      };

      await reportsService.getDebtReport(filters);

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: filters,
      });
    });

    it('should filter by status only', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      await reportsService.getDebtReport({ status: 'OVERDUE' });

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: { status: 'OVERDUE' },
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(reportsService.getDebtReport()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      const result = reportsService.getDebtReport();

      const _typeCheck: Promise<DebtReport> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getInventoryReport', () => {
    it('should get inventory report without filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryReport));

      const result = await reportsService.getInventoryReport();

      expect(result).toEqual(mockInventoryReport);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetInventoryReport,
        params: undefined,
      });
    });

    it('should get inventory report with branch filter', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryReport));

      const filters: Pick<ReportQueryFilters, 'branchId'> = {
        branchId: 'branch-123',
      };

      await reportsService.getInventoryReport(filters);

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetInventoryReport,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(reportsService.getInventoryReport()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryReport));

      const result = reportsService.getInventoryReport();

      const _typeCheck: Promise<InventoryReport> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getSalaryReport', () => {
    it('should get salary report with date range', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSalaryReport));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = await reportsService.getSalaryReport(filters);

      expect(result).toEqual(mockSalaryReport);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetSalaryReport,
        params: filters,
      });
    });

    it('should get salary report with branch filter', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSalaryReport));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        branchId: 'branch-123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await reportsService.getSalaryReport(filters);

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetSalaryReport,
        params: filters,
      });
    });

    it('should throw error when startDate is missing', () => {
      const filters = {
        endDate: '2024-12-31',
      } as Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>;

      expect(() => reportsService.getSalaryReport(filters)).toThrow('startDate and endDate are required');
    });

    it('should throw error when endDate is missing', () => {
      const filters = {
        startDate: '2024-01-01',
      } as Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'>;

      expect(() => reportsService.getSalaryReport(filters)).toThrow('startDate and endDate are required');
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await expect(reportsService.getSalaryReport(filters)).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSalaryReport));

      const result = reportsService.getSalaryReport({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      const _typeCheck: Promise<SalaryReport> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('exportToExcel', () => {
    it('should export report to Excel', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const request: ReportExportRequest = {
        reportType: 'financial',
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        format: 'excel',
      };

      const result = await reportsService.exportToExcel(request);

      expect(result).toEqual(mockBlob);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportExcel,
        request,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle 400 error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Invalid report type'));

      const request: ReportExportRequest = {
        reportType: 'financial',
        filters: {},
        format: 'excel',
      };

      await expect(reportsService.exportToExcel(request)).rejects.toThrow('Invalid report type');
    });

    it('should handle 401 error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Not authenticated'));

      const request: ReportExportRequest = {
        reportType: 'debts',
        filters: {},
        format: 'excel',
      };

      await expect(reportsService.exportToExcel(request)).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const result = reportsService.exportToExcel({
        reportType: 'financial',
        filters: {},
        format: 'excel',
      });

      const _typeCheck: Promise<Blob> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('exportToPdf', () => {
    it('should export report to PDF', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const request: ReportExportRequest = {
        reportType: 'financial',
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        format: 'pdf',
      };

      const result = await reportsService.exportToPdf(request);

      expect(result).toEqual(mockBlob);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportPdf,
        request,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle 400 error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Invalid report type'));

      const request: ReportExportRequest = {
        reportType: 'debts',
        filters: {},
        format: 'pdf',
      };

      await expect(reportsService.exportToPdf(request)).rejects.toThrow('Invalid report type');
    });

    it('should have correct TypeScript types', () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const result = reportsService.exportToPdf({
        reportType: 'financial',
        filters: {},
        format: 'pdf',
      });

      const _typeCheck: Promise<Blob> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('downloadBlob', () => {
    it('should trigger file download', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      const blob = new Blob(['test'], { type: 'application/pdf' });
      const filename = 'report.pdf';

      reportsService.downloadBlob(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('getCurrentMonthFinancialReport', () => {
    it('should get financial report for current month without branchId', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockFinancialReport));

      await reportsService.getCurrentMonthFinancialReport();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('startDate');
      expect(call.params).toHaveProperty('endDate');
    });

    it('should get financial report for current month with branchId', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockFinancialReport));

      await reportsService.getCurrentMonthFinancialReport('branch-123');

      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params.branchId).toBe('branch-123');
    });
  });

  describe('getActiveDebtsReport', () => {
    it('should get debt report with ACTIVE status', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      await reportsService.getActiveDebtsReport();

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: { status: 'ACTIVE' },
      });
    });

    it('should pass branchId filter', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      await reportsService.getActiveDebtsReport('branch-123');

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: { status: 'ACTIVE', branchId: 'branch-123' },
      });
    });
  });

  describe('getOverdueDebtsReport', () => {
    it('should get debt report with OVERDUE status', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockDebtReport));

      await reportsService.getOverdueDebtsReport();

      verifyRequest(mockApiClient.get, {
        url: ReportsApiEndpoints.GetDebtReport,
        params: { status: 'OVERDUE' },
      });
    });
  });

  describe('getCurrentMonthSalaryReport', () => {
    it('should get salary report for current month', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockSalaryReport));

      await reportsService.getCurrentMonthSalaryReport();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      const call = mockApiClient.get.mock.calls[0][0];
      expect(call.params).toHaveProperty('startDate');
      expect(call.params).toHaveProperty('endDate');
    });
  });

  describe('exportFinancialToExcel', () => {
    it('should export financial report to Excel', async () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const filters: Pick<ReportQueryFilters, 'branchId' | 'startDate' | 'endDate'> = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await reportsService.exportFinancialToExcel(filters);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportExcel,
        {
          reportType: 'financial',
          filters,
          format: 'excel',
        },
        expect.any(Object),
      );
    });
  });

  describe('exportDebtToPdf', () => {
    it('should export debt report to PDF without filters', async () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      await reportsService.exportDebtToPdf();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportPdf,
        {
          reportType: 'debts',
          filters: undefined,
          format: 'pdf',
        },
        expect.any(Object),
      );
    });

    it('should export debt report to PDF with filters', async () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      const filters: Pick<ReportQueryFilters, 'branchId' | 'status'> = {
        branchId: 'branch-123',
        status: 'ACTIVE',
      };

      await reportsService.exportDebtToPdf(filters);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportPdf,
        {
          reportType: 'debts',
          filters,
          format: 'pdf',
        },
        expect.any(Object),
      );
    });
  });

  describe('exportInventoryToExcel', () => {
    it('should export inventory report to Excel without branchId', async () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      await reportsService.exportInventoryToExcel();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportExcel,
        {
          reportType: 'inventory',
          filters: { branchId: undefined },
          format: 'excel',
        },
        expect.any(Object),
      );
    });

    it('should export inventory report to Excel with branchId', async () => {
      const mockBlob = new Blob(['test']);
      mockAxiosInstance.post.mockResolvedValue({ data: mockBlob });

      await reportsService.exportInventoryToExcel('branch-123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        ReportsApiEndpoints.ExportExcel,
        {
          reportType: 'inventory',
          filters: { branchId: 'branch-123' },
          format: 'excel',
        },
        expect.any(Object),
      );
    });
  });

  describe('ReportsApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(ReportsApiEndpoints.GetFinancialReport).toBe('/reports/financial');
      expect(ReportsApiEndpoints.GetDebtReport).toBe('/reports/debts');
      expect(ReportsApiEndpoints.GetInventoryReport).toBe('/reports/inventory');
      expect(ReportsApiEndpoints.GetSalaryReport).toBe('/reports/salaries');
      expect(ReportsApiEndpoints.ExportExcel).toBe('/reports/export/excel');
      expect(ReportsApiEndpoints.ExportPdf).toBe('/reports/export/pdf');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(reportsService.default).toBeDefined();
      expect(reportsService.default.getFinancialReport).toBe(reportsService.getFinancialReport);
      expect(reportsService.default.getDebtReport).toBe(reportsService.getDebtReport);
      expect(reportsService.default.getInventoryReport).toBe(reportsService.getInventoryReport);
      expect(reportsService.default.getSalaryReport).toBe(reportsService.getSalaryReport);
      expect(reportsService.default.exportToExcel).toBe(reportsService.exportToExcel);
      expect(reportsService.default.exportToPdf).toBe(reportsService.exportToPdf);
      expect(reportsService.default.downloadBlob).toBe(reportsService.downloadBlob);
      expect(reportsService.default.getCurrentMonthFinancialReport).toBe(reportsService.getCurrentMonthFinancialReport);
      expect(reportsService.default.getActiveDebtsReport).toBe(reportsService.getActiveDebtsReport);
      expect(reportsService.default.getOverdueDebtsReport).toBe(reportsService.getOverdueDebtsReport);
      expect(reportsService.default.getCurrentMonthSalaryReport).toBe(reportsService.getCurrentMonthSalaryReport);
      expect(reportsService.default.exportFinancialToExcel).toBe(reportsService.exportFinancialToExcel);
      expect(reportsService.default.exportDebtToPdf).toBe(reportsService.exportDebtToPdf);
      expect(reportsService.default.exportInventoryToExcel).toBe(reportsService.exportInventoryToExcel);
    });
  });
});
