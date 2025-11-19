/**
 * Reports Page - Container Component
 * Main page for generating and exporting various business reports
 *
 * Architecture:
 * - Business logic in hooks (useFinancialReport, useDebtReport, etc.)
 * - Presentational components (ReportFilters, ReportPreview)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Tabs for report types: Financial, Debts, Inventory, Salaries
 * - Dynamic filters based on report type (discriminated union)
 * - Generate button triggers query manually
 * - Export to Excel and PDF with Blob download
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useState, useCallback, useMemo } from 'react';
import { FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import {
  useFinancialReport,
  useDebtReport,
  useInventoryReport,
  useSalaryReport,
  useExportExcel,
  useExportPDF,
} from '@/hooks/queries/useReports';
import reportsService from '@/api/services/reportsService';
import {
  ReportFilters as ReportFiltersComponent,
  type ReportFilters,
  type FinancialReportFilters,
  type DebtReportFilters,
  type InventoryReportFilters,
  type SalaryReportFilters,
} from '@/components/reports/ReportFilters';
import {
  ReportPreview,
  type ReportData,
} from '@/components/reports/ReportPreview';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { toInputDate, startOfMonth } from '@/utils/format';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

type ReportTab = 'financial' | 'debt' | 'inventory' | 'salary';

// ============================================
// PAGE COMPONENT
// ============================================

export default function ReportsPage() {
  const { isAdmin } = useAuth();

  // ============================================
  // STATE
  // ============================================

  /**
   * Active report tab
   */
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');

  /**
   * Report filters (discriminated union)
   */
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const today = new Date();
    const firstDayOfMonth = toInputDate(startOfMonth(today));
    const todayStr = toInputDate(today);

    return {
      type: 'financial',
      startDate: firstDayOfMonth,
      endDate: todayStr,
      branchId: null,
    };
  });

  /**
   * Flag to track if report has been generated at least once
   */
  const [hasGenerated, setHasGenerated] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch branches for branch selector
   */
  const { data: branches = [] } = useBranches();

  /**
   * Financial report query (enabled: false, manual trigger)
   */
  const financialReport = useFinancialReport(
    filters.type === 'financial'
      ? {
          startDate: filters.startDate,
          endDate: filters.endDate,
          branchId: filters.branchId,
        }
      : { startDate: '', endDate: '', branchId: null },
    { enabled: false }
  );

  /**
   * Debt report query (enabled: false, manual trigger)
   */
  const debtReport = useDebtReport(
    filters.type === 'debt'
      ? {
          branchId: filters.branchId,
          status: filters.status === 'all' ? undefined : filters.status,
        }
      : undefined,
    { enabled: false }
  );

  /**
   * Inventory report query (enabled: false, manual trigger)
   */
  const inventoryReport = useInventoryReport(
    filters.type === 'inventory'
      ? {
          branchId: filters.branchId,
        }
      : undefined,
    { enabled: false }
  );

  /**
   * Salary report query (enabled: false, manual trigger)
   */
  const salaryReport = useSalaryReport(
    filters.type === 'salary'
      ? {
          startDate: filters.startDate,
          endDate: filters.endDate,
          branchId: filters.branchId,
        }
      : { startDate: '', endDate: '', branchId: null },
    { enabled: false }
  );

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Export to Excel mutation
   */
  const exportExcel = useExportExcel();

  /**
   * Export to PDF mutation
   */
  const exportPDF = useExportPDF();

  // ============================================
  // COMPUTED VALUES
  // ============================================

  /**
   * Get current report query based on active tab
   */
  const currentReport = useMemo(() => {
    switch (activeTab) {
      case 'financial':
        return financialReport;
      case 'debt':
        return debtReport;
      case 'inventory':
        return inventoryReport;
      case 'salary':
        return salaryReport;
      default:
        return financialReport;
    }
  }, [activeTab, financialReport, debtReport, inventoryReport, salaryReport]);

  /**
   * Get report data with type discrimination
   */
  const reportData: ReportData | null = useMemo(() => {
    if (!hasGenerated || !currentReport.data) return null;

    switch (activeTab) {
      case 'financial':
        return financialReport.data ? { type: 'financial', data: financialReport.data } : null;
      case 'debt':
        return debtReport.data ? { type: 'debt', data: debtReport.data } : null;
      case 'inventory':
        return inventoryReport.data ? { type: 'inventory', data: inventoryReport.data } : null;
      case 'salary':
        return salaryReport.data ? { type: 'salary', data: salaryReport.data } : null;
      default:
        return null;
    }
  }, [activeTab, hasGenerated, financialReport.data, debtReport.data, inventoryReport.data, salaryReport.data]);

  /**
   * Check if currently loading
   */
  const isGenerating = currentReport.isFetching;

  /**
   * Get current error
   */
  const error = currentReport.error;

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle tab change
   * Reset filters to default for new tab
   */
  const handleTabChange = useCallback((tab: ReportTab) => {
    const today = new Date();
    const firstDayOfMonth = toInputDate(startOfMonth(today));
    const todayStr = toInputDate(today);

    setActiveTab(tab);
    setHasGenerated(false);

    // Set default filters based on tab
    switch (tab) {
      case 'financial':
        setFilters({
          type: 'financial',
          startDate: firstDayOfMonth,
          endDate: todayStr,
          branchId: null,
        });
        break;
      case 'debt':
        setFilters({
          type: 'debt',
          branchId: null,
          status: 'all',
        });
        break;
      case 'inventory':
        setFilters({
          type: 'inventory',
          branchId: null,
          unit: 'all',
        });
        break;
      case 'salary':
        setFilters({
          type: 'salary',
          startDate: firstDayOfMonth,
          endDate: todayStr,
          branchId: null,
        });
        break;
    }
  }, []);

  /**
   * Handle filters change
   */
  const handleFiltersChange = useCallback((newFilters: ReportFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle generate report
   * Triggers the query refetch
   */
  const handleGenerate = useCallback(async () => {
    try {
      await currentReport.refetch();
      setHasGenerated(true);
    } catch (error) {
      // Error toast shown by global API interceptor
    }
  }, [currentReport]);

  /**
   * Handle print report
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Handle export to Excel
   */
  const handleExportExcel = useCallback(async () => {
    if (!reportData) return;

    try {
      const reportTypeMap = {
        financial: 'financial' as const,
        debt: 'debts' as const,
        inventory: 'inventory' as const,
        salary: 'salaries' as const,
      };

      const blob = await exportExcel.mutateAsync({
        reportType: reportTypeMap[activeTab],
        filters: getApiFilters(filters),
        format: 'excel',
      });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${activeTab}-report-${timestamp}.xlsx`;

      // Download blob
      reportsService.downloadBlob(blob, filename);
    } catch (error) {
      // Error toast shown by mutation
    }
  }, [reportData, activeTab, filters, exportExcel]);

  /**
   * Handle export to PDF
   */
  const handleExportPDF = useCallback(async () => {
    if (!reportData) return;

    try {
      const reportTypeMap = {
        financial: 'financial' as const,
        debt: 'debts' as const,
        inventory: 'inventory' as const,
        salary: 'salaries' as const,
      };

      const blob = await exportPDF.mutateAsync({
        reportType: reportTypeMap[activeTab],
        filters: getApiFilters(filters),
        format: 'pdf',
      });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${activeTab}-report-${timestamp}.pdf`;

      // Download blob
      reportsService.downloadBlob(blob, filename);
    } catch (error) {
      // Error toast shown by mutation
    }
  }, [reportData, activeTab, filters, exportPDF]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    currentReport.refetch();
  }, [currentReport]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">التقارير</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            توليد وتصدير تقارير الأعمال
          </p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2" dir="rtl">
        <button
          onClick={() => handleTabChange('financial')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'financial'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          التقرير المالي
        </button>
        <button
          onClick={() => handleTabChange('debt')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'debt'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          تقرير الديون
        </button>
        <button
          onClick={() => handleTabChange('inventory')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'inventory'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          تقرير المخزون
        </button>
        <button
          onClick={() => handleTabChange('salary')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'salary'
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          تقرير الرواتب
        </button>
      </div>

      {/* Report Filters */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <ReportFiltersComponent
          reportType={activeTab}
          filters={filters}
          branches={branches}
          onChange={handleFiltersChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="space-y-6">
          <CardSkeleton count={3} variant="stat" />
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
            <ListSkeleton items={5} variant="default" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isGenerating && error && hasGenerated && (
        <ErrorState error={error} onRetry={handleRetry} />
      )}

      {/* Empty State - Before First Generation */}
      {!isGenerating && !error && !hasGenerated && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-primary-600" />}
          title="لم يتم توليد التقرير بعد"
          description="اختر الفلاتر المناسبة واضغط على زر 'توليد التقرير' لعرض البيانات."
        />
      )}

      {/* Report Preview */}
      {!isGenerating && !error && hasGenerated && reportData && (
        <ReportPreview
          reportData={reportData}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      )}

      {/* Loading Overlay - During Export */}
      {(exportExcel.isPending || exportPDF.isPending) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">
              {exportExcel.isPending ? 'جاري التصدير إلى Excel...' : 'جاري التصدير إلى PDF...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert ReportFilters to API filters format
 */
function getApiFilters(filters: ReportFilters): Record<string, unknown> {
  switch (filters.type) {
    case 'financial':
      return {
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      };
    case 'debt':
      return {
        branchId: filters.branchId,
        status: filters.status === 'all' ? undefined : filters.status,
      };
    case 'inventory':
      return {
        branchId: filters.branchId,
      };
    case 'salary':
      return {
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      };
    default:
      return {};
  }
}
