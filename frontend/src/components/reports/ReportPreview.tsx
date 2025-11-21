/**
 * ReportPreview - Presentational Component
 * Renders reports based on type with discriminated union
 *
 * Features:
 * - Financial: income/expenses/net table + summary cards + charts
 * - Debts: debts table + summary cards
 * - Inventory: items table + total value card
 * - Salary: expenses by employee + total card
 * - Print button, Export Excel button, Export PDF button
 * - RTL support
 * - No business logic
 */

import {
  Printer,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/utils/format';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Table, type Column } from '../ui/Table';
import { StatCard } from '../ui/StatCard';
import type { FinancialReport, DebtReport, InventoryReport, SalaryReport } from '@/types/api';
import type { CurrencySettings } from '#/settings.types';

// ============================================
// DISCRIMINATED UNION FOR REPORT DATA
// ============================================

export type ReportData =
  | { type: 'financial'; data: FinancialReport }
  | { type: 'debt'; data: DebtReport }
  | { type: 'inventory'; data: InventoryReport }
  | { type: 'salary'; data: SalaryReport };

// ============================================
// TYPES
// ============================================

export interface ReportPreviewProps {
  reportData: ReportData;
  currency?: CurrencySettings | null;
  onPrint: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

// ============================================
// FINANCIAL REPORT COMPONENT
// ============================================

function FinancialReportView({ data, currency }: { data: FinancialReport; currency?: CurrencySettings | null }) {
  // Table columns for income by category
  const incomeColumns: Column<{ category: string; amount: number; count: number }>[] = [
    {
      key: 'category',
      header: 'الفئة',
      render: (item) => <span className="font-medium">{item.category}</span>,
    },
    {
      key: 'count',
      header: 'العدد',
      width: '100px',
      align: 'center',
      render: (item) => formatNumber(item.count),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      width: '150px',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-green-600">{formatCurrency(item.amount, currency)}</span>
      ),
    },
  ];

  // Table columns for expenses by category
  const expensesColumns: Column<{ category: string; amount: number; count: number }>[] = [
    {
      key: 'category',
      header: 'الفئة',
      render: (item) => <span className="font-medium">{item.category}</span>,
    },
    {
      key: 'count',
      header: 'العدد',
      width: '100px',
      align: 'center',
      render: (item) => formatNumber(item.count),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      width: '150px',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-red-600">{formatCurrency(item.amount, currency)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Report Header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">التقرير المالي</h2>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              من {formatDate(data.startDate)} إلى {formatDate(data.endDate)}
            </span>
          </div>
          {data.branchName && <span>• الفرع: {data.branchName}</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(data.summary.totalIncome, currency)}
          icon={TrendingUp}
          description={`نقدي: ${formatCurrency(data.summary.cashIncome, currency)} • ماستر: ${formatCurrency(data.summary.masterIncome, currency)}`}
          className="border-r-4 border-green-500"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(data.summary.totalExpenses, currency)}
          icon={TrendingDown}
          description="إجمالي المصروفات المسجلة"
          className="border-r-4 border-red-500"
        />
        <StatCard
          title="صافي الربح"
          value={formatCurrency(data.summary.netProfit, currency)}
          icon={TrendingUp}
          description={`هامش الربح: ${((data.summary.netProfit / data.summary.totalIncome) * 100).toFixed(1)}%`}
          className={`border-r-4 ${data.summary.netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}
        />
      </div>

      {/* Income by Category */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          الإيرادات حسب الفئة
        </h3>
        <Table
          data={data.incomeByCategory}
          columns={incomeColumns}
          keyExtractor={(item) => item.category}
          isLoading={false}
          emptyMessage="لا توجد إيرادات"
          striped
        />
      </div>

      {/* Expenses by Category */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          المصروفات حسب الفئة
        </h3>
        <Table
          data={data.expensesByCategory}
          columns={expensesColumns}
          keyExtractor={(item) => item.category}
          isLoading={false}
          emptyMessage="لا توجد مصروفات"
          striped
        />
      </div>
    </div>
  );
}

// ============================================
// DEBT REPORT COMPONENT
// ============================================

function DebtReportView({ data, currency }: { data: DebtReport; currency?: CurrencySettings | null }) {
  // Table columns for debts
  const debtColumns: Column<DebtReport['debts'][0]>[] = [
    {
      key: 'creditorName',
      header: 'اسم الدائن',
      width: '200px',
      render: (debt) => <span className="font-medium">{debt.creditorName}</span>,
    },
    {
      key: 'originalAmount',
      header: 'المبلغ الأصلي',
      width: '140px',
      align: 'right',
      render: (debt) => formatCurrency(debt.originalAmount, currency),
    },
    {
      key: 'remainingAmount',
      header: 'المبلغ المتبقي',
      width: '140px',
      align: 'right',
      render: (debt) => (
        <span className="font-semibold text-red-600">{formatCurrency(debt.remainingAmount, currency)}</span>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      width: '100px',
      align: 'center',
      render: (debt) => {
        const statusColors = {
          ACTIVE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          PARTIAL: 'bg-blue-100 text-blue-800 border-blue-300',
          PAID: 'bg-green-100 text-green-800 border-green-300',
        };
        const statusLabels = {
          ACTIVE: 'نشط',
          PARTIAL: 'جزئي',
          PAID: 'مدفوع',
        };
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[debt.status as keyof typeof statusColors]}`}
          >
            {statusLabels[debt.status as keyof typeof statusLabels] || debt.status}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'تاريخ الدين',
      width: '120px',
      render: (debt) => formatDate(debt.date),
    },
    {
      key: 'dueDate',
      header: 'تاريخ الاستحقاق',
      width: '120px',
      render: (debt) => (
        <div>
          {formatDate(debt.dueDate)}
          {debt.overdueDays && debt.overdueDays > 0 && (
            <div className="text-xs text-red-600 mt-1">متأخر {debt.overdueDays} يوم</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Report Header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">تقرير الديون</h2>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          {data.branchName && <span>الفرع: {data.branchName}</span>}
          {data.status && data.status !== 'all' && <span>• الحالة: {data.status}</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الديون"
          value={formatNumber(data.summary.totalDebts)}
          description="عدد الديون الكلي"
          className="border-r-4 border-gray-500"
        />
        <StatCard
          title="المبلغ الإجمالي"
          value={formatCurrency(data.summary.totalAmount, currency)}
          description="مجموع المبالغ الأصلية"
          className="border-r-4 border-blue-500"
        />
        <StatCard
          title="المبلغ المدفوع"
          value={formatCurrency(data.summary.totalPaid, currency)}
          description={`${data.summary.paidDebtsCount} دين مدفوع`}
          className="border-r-4 border-green-500"
        />
        <StatCard
          title="المبلغ المتبقي"
          value={formatCurrency(data.summary.totalRemaining, currency)}
          description={`${data.summary.activeDebtsCount} دين نشط • ${data.summary.overdueDebtsCount} متأخر`}
          className="border-r-4 border-red-500"
        />
      </div>

      {/* Debts Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          قائمة الديون ({data.debts.length})
        </h3>
        <Table
          data={data.debts}
          columns={debtColumns}
          keyExtractor={(debt) => debt.id}
          isLoading={false}
          emptyMessage="لا توجد ديون"
          striped
        />
      </div>
    </div>
  );
}

// ============================================
// INVENTORY REPORT COMPONENT
// ============================================

function InventoryReportView({ data, currency }: { data: InventoryReport; currency?: CurrencySettings | null }) {
  // Table columns for inventory items
  const itemColumns: Column<InventoryReport['items'][0]>[] = [
    {
      key: 'name',
      header: 'الصنف',
      width: '200px',
      render: (item) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.autoAdded && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              تلقائي
            </span>
          )}
          {item.isLowStock && <div className="text-xs text-orange-600 mt-1">مخزون منخفض</div>}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'الكمية',
      width: '100px',
      align: 'right',
      render: (item) => (
        <span className={item.isLowStock ? 'text-orange-600 font-semibold' : ''}>
          {item.quantity.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'الوحدة',
      width: '80px',
      align: 'center',
      render: (item) => item.unit,
    },
    {
      key: 'costPerUnit',
      header: 'سعر الوحدة',
      width: '120px',
      align: 'right',
      render: (item) => formatCurrency(item.costPerUnit, currency),
    },
    {
      key: 'totalValue',
      header: 'القيمة الإجمالية',
      width: '140px',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-primary-600">{formatCurrency(item.totalValue, currency)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Report Header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">تقرير المخزون</h2>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          {data.branchName && <span>الفرع: {data.branchName}</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الأصناف"
          value={formatNumber(data.summary.totalItems)}
          description="عدد الأصناف في المخزون"
          className="border-r-4 border-blue-500"
        />
        <StatCard
          title="القيمة الإجمالية"
          value={formatCurrency(data.summary.totalValue, currency)}
          description="قيمة المخزون الكلية"
          className="border-r-4 border-green-500"
        />
        <StatCard
          title="مخزون منخفض"
          value={formatNumber(data.summary.lowStockItems)}
          description="أصناف تحتاج إعادة تعبئة"
          className="border-r-4 border-orange-500"
        />
        <StatCard
          title="نفذ من المخزون"
          value={formatNumber(data.summary.outOfStockItems)}
          description="أصناف غير متوفرة"
          className="border-r-4 border-red-500"
        />
      </div>

      {/* Items Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          قائمة الأصناف ({data.items.length})
        </h3>
        <Table
          data={data.items}
          columns={itemColumns}
          keyExtractor={(item) => item.id}
          isLoading={false}
          emptyMessage="لا توجد أصناف"
          striped
        />
      </div>
    </div>
  );
}

// ============================================
// SALARY REPORT COMPONENT
// ============================================

function SalaryReportView({ data, currency }: { data: SalaryReport; currency?: CurrencySettings | null }) {
  // Table columns for salaries
  const salaryColumns: Column<SalaryReport['salaries'][0]>[] = [
    {
      key: 'employeeName',
      header: 'اسم الموظف',
      width: '200px',
      render: (salary) => <span className="font-medium">{salary.employeeName}</span>,
    },
    {
      key: 'paymentCount',
      header: 'عدد الدفعات',
      width: '120px',
      align: 'center',
      render: (salary) => formatNumber(salary.paymentCount),
    },
    {
      key: 'totalAmount',
      header: 'المبلغ الإجمالي',
      width: '150px',
      align: 'right',
      render: (salary) => (
        <span className="font-semibold text-green-600">{formatCurrency(salary.totalAmount, currency)}</span>
      ),
    },
    {
      key: 'lastPaymentDate',
      header: 'آخر دفعة',
      width: '140px',
      render: (salary) => (salary.lastPaymentDate ? formatDate(salary.lastPaymentDate) : '-'),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Report Header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">تقرير الرواتب</h2>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              من {formatDate(data.startDate)} إلى {formatDate(data.endDate)}
            </span>
          </div>
          {data.branchName && <span>• الفرع: {data.branchName}</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي الرواتب المدفوعة"
          value={formatCurrency(data.summary.totalSalariesPaid, currency)}
          description={`${formatNumber(data.summary.transactionCount)} دفعة`}
          className="border-r-4 border-green-500"
        />
        <StatCard
          title="عدد الموظفين"
          value={formatNumber(data.summary.employeeCount)}
          description="موظف تلقى رواتب"
          className="border-r-4 border-blue-500"
        />
        <StatCard
          title="متوسط الراتب"
          value={formatCurrency(data.summary.averageSalary, currency)}
          description="متوسط الراتب لكل موظف"
          className="border-r-4 border-purple-500"
        />
      </div>

      {/* Salaries Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          الرواتب حسب الموظف ({data.salaries.length})
        </h3>
        <Table
          data={data.salaries}
          columns={salaryColumns}
          keyExtractor={(salary) => salary.employeeName}
          isLoading={false}
          emptyMessage="لا توجد رواتب"
          striped
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ReportPreview({
  reportData,
  currency,
  onPrint,
  onExportExcel,
  onExportPDF,
}: ReportPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div
        className="flex items-center justify-end gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4"
        dir="rtl"
      >
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Printer className="w-4 h-4" />
          طباعة
        </button>
        <button
          onClick={onExportExcel}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </button>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          تصدير PDF
        </button>
      </div>

      {/* Report Content - Discriminated Union */}
      {reportData.type === 'financial' && <FinancialReportView data={reportData.data} currency={currency} />}
      {reportData.type === 'debt' && <DebtReportView data={reportData.data} currency={currency} />}
      {reportData.type === 'inventory' && <InventoryReportView data={reportData.data} currency={currency} />}
      {reportData.type === 'salary' && <SalaryReportView data={reportData.data} currency={currency} />}

      {/* Generated At Footer */}
      <div className="text-center text-sm text-[var(--text-secondary)] py-4" dir="rtl">
        تم إنشاء التقرير في: {formatDate(reportData.data.generatedAt)}
      </div>
    </div>
  );
}

export default ReportPreview;
