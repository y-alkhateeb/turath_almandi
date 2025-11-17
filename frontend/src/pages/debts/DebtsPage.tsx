import { useState } from 'react';
import { Plus, DollarSign, ChevronRight } from 'lucide-react';
import { DebtForm } from '@/components/DebtForm';
import { Modal } from '@/components/Modal';
import { PayDebtModal } from '@/components/PayDebtModal';
import { DebtPaymentHistory } from '@/components/DebtPaymentHistory';
import { useDebts } from '@/hooks/useDebts';
import { PageLoading } from '@/components/loading';
import { EmptyState, PageHeader, Table } from '@/components/ui';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Alert } from '@/ui/alert';
import { DebtStatus, type Debt } from '@/types/debts.types';
import type { Column } from '@/components/ui/Table';

/**
 * Debts Page - Debt Management
 *
 * Features:
 * - List of all debts
 * - Add debt button with modal
 * - Integration with useDebts hook
 * - Loading and empty states
 * - Status badges (ACTIVE, PAID, PARTIAL)
 * - Overdue indicator
 * - Payment history expansion
 * - Arabic interface
 */
export const DebtsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const { data: debts, isLoading, error } = useDebts();

  const handleSuccess = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedDebt(null);
  };

  const toggleExpandDebt = (debtId: string) => {
    setExpandedDebtId(expandedDebtId === debtId ? null : debtId);
  };

  const formatStatus = (status: DebtStatus) => {
    const statusMap = {
      ACTIVE: 'نشط',
      PAID: 'مدفوع',
      PARTIAL: 'مدفوع جزئيًا',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: DebtStatus) => {
    const variantMap = {
      ACTIVE: 'warning' as const,
      PAID: 'success' as const,
      PARTIAL: 'info' as const,
    };
    return variantMap[status] || ('default' as const);
  };

  const isOverdue = (dueDate: string, status: DebtStatus) => {
    if (status === DebtStatus.PAID) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  // Table columns configuration
  const columns: Column<Debt>[] = [
    {
      key: 'creditorName',
      header: 'اسم الدائن',
      render: (debt) => {
        const overdueFlag = isOverdue(debt.dueDate, debt.status);
        const hasPayments = debt.payments && debt.payments.length > 0;
        const isExpanded = expandedDebtId === debt.id;

        return (
          <div className="flex items-center gap-2">
            {hasPayments && (
              <button
                onClick={() => toggleExpandDebt(debt.id)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={isExpanded ? 'إخفاء السجل' : 'عرض السجل'}
              >
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            )}
            <span className="font-medium text-[var(--text-primary)]">{debt.creditorName}</span>
            {overdueFlag && (
              <Badge variant="danger" size="sm">
                متأخر
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'originalAmount',
      header: 'المبلغ الأصلي',
      render: (debt) => (
        <div className="text-[var(--text-primary)]" dir="ltr">
          {formatCurrency(debt.originalAmount)} IQD
        </div>
      ),
    },
    {
      key: 'paidAmount',
      header: 'المبلغ المدفوع',
      render: (debt) => {
        const paidAmount = debt.originalAmount - debt.remainingAmount;
        return (
          <div className="text-green-600" dir="ltr">
            {formatCurrency(paidAmount)} IQD
          </div>
        );
      },
    },
    {
      key: 'remainingAmount',
      header: 'المبلغ المتبقي',
      render: (debt) => (
        <div className="text-red-600 font-medium" dir="ltr">
          {formatCurrency(debt.remainingAmount)} IQD
        </div>
      ),
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (debt) => <div className="text-[var(--text-primary)]">{formatDate(debt.date)}</div>,
    },
    {
      key: 'dueDate',
      header: 'تاريخ الاستحقاق',
      render: (debt) => {
        const overdueFlag = isOverdue(debt.dueDate, debt.status);
        return (
          <div className={overdueFlag ? 'text-red-600 font-medium' : 'text-[var(--text-primary)]'}>
            {formatDate(debt.dueDate)}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (debt) => (
        <Badge variant={getStatusVariant(debt.status)}>
          {formatStatus(debt.status)}
        </Badge>
      ),
    },
    {
      key: 'branch',
      header: 'الفرع',
      render: (debt) => (
        <div className="text-[var(--text-primary)]">{debt.branch?.name || '-'}</div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (debt) => (
        <div className="flex items-center gap-2">
          {debt.status !== DebtStatus.PAID && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handlePayDebt(debt)}
            >
              دفع
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Custom row renderer to support expandable rows
  const renderRow = (debt: Debt) => {
    const isExpanded = expandedDebtId === debt.id;
    const overdueFlag = isOverdue(debt.dueDate, debt.status);

    return (
      <>
        <tr
          key={debt.id}
          className={`hover:bg-[var(--bg-tertiary)] transition-colors ${
            overdueFlag ? 'bg-red-50' : ''
          }`}
        >
          {columns.map((column) => (
            <td key={column.key as string} className="px-6 py-4 whitespace-nowrap text-sm">
              {column.render ? column.render(debt) : String(debt[column.key as keyof Debt])}
            </td>
          ))}
        </tr>
        {isExpanded && debt.payments && debt.payments.length > 0 && (
          <tr>
            <td colSpan={columns.length} className="px-6 py-4 bg-[var(--bg-tertiary)]">
              <DebtPaymentHistory payments={debt.payments} />
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="إدارة الديون"
        description="إدارة جميع الديون والذمم"
        actions={
          <Button
            variant="default"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            إضافة دين
          </Button>
        }
      />

      {/* Debt Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="إضافة دين جديد"
        size="lg"
      >
        <DebtForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Modal>

      {/* Pay Debt Modal */}
      <PayDebtModal
        isOpen={isPayModalOpen}
        onClose={handleClosePayModal}
        debt={selectedDebt}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          حدث خطأ أثناء تحميل البيانات
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <PageLoading message="جاري تحميل الديون..." />
      ) : debts && debts.length === 0 ? (
        /* Empty State */
        <EmptyState
          variant="default"
          icon={<DollarSign className="w-full h-full" />}
          title="لا توجد ديون"
          description="تتبع الديون المستحقة وسددها بسهولة. ابدأ بإضافة أول دين لمتابعة المدفوعات والمستحقات."
          actions={{
            primary: {
              label: 'إضافة دين جديد',
              onClick: () => setIsModalOpen(true),
            },
          }}
          size="lg"
        />
      ) : (
        /* Debts Table with Custom Row Renderer */
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key as string}
                      className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {debts?.map((debt) => renderRow(debt))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
