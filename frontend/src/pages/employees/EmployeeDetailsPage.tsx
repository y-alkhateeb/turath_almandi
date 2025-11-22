import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Edit,
  UserX,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Briefcase,
  User,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useEmployee,
  useResignEmployee,
  useSalaryPaymentHistory,
  useSalaryIncreaseHistory,
  useDeleteSalaryPayment,
} from '@/hooks/useEmployees';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Table, ConfirmModal } from '@/components/ui';
import { CurrencyAmount, CurrencyAmountCompact } from '@/components/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { EmployeeStatus } from '@/types';
import type { SalaryPayment, SalaryIncrease } from '@/types';
import type { Column } from '@/components/ui/Table';

export const EmployeeDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  const { data: employee, isLoading, error } = useEmployee(id!);
  const { data: payments = [] } = useSalaryPaymentHistory(id!);
  const { data: increases = [] } = useSalaryIncreaseHistory(id!);

  const resignEmployee = useResignEmployee();
  const deletePayment = useDeleteSalaryPayment();

  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'increases'>('info');
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignDate, setResignDate] = useState('');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const handleResign = async () => {
    if (!id || !resignDate) return;
    await resignEmployee.mutateAsync({ id, resignDate });
    setShowResignModal(false);
    setResignDate('');
  };

  const handleDeletePayment = async () => {
    if (!id || !deletingPaymentId) return;
    await deletePayment.mutateAsync({ employeeId: id, paymentId: deletingPaymentId });
    setDeletingPaymentId(null);
  };

  // Salary Payments Table Columns
  const paymentColumns: Column<SalaryPayment>[] = [
    {
      key: 'paymentDate',
      header: 'تاريخ الدفع',
      render: (payment) => (
        <div className="text-sm">
          {format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: ar })}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      render: (payment) => (
        <div className="text-sm font-medium">
          <CurrencyAmountCompact amount={payment.amount} />
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'ملاحظات',
      render: (payment) => (
        <div className="text-sm text-[var(--text-secondary)]">{payment.notes || '-'}</div>
      ),
    },
    {
      key: 'recordedBy',
      header: 'سجل بواسطة',
      render: (payment) => (
        <div className="text-sm text-[var(--text-secondary)]">
          {payment.recordedBy?.username || '-'}
        </div>
      ),
    },
  ];

  // Add delete action column if employee is active
  if (employee?.status === EmployeeStatus.ACTIVE) {
    paymentColumns.push({
      key: 'actions',
      header: 'إجراءات',
      render: (payment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeletingPaymentId(payment.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          حذف
        </Button>
      ),
    });
  }

  // Salary Increases Table Columns
  const increaseColumns: Column<SalaryIncrease>[] = [
    {
      key: 'effectiveDate',
      header: 'تاريخ الزيادة',
      render: (increase) => (
        <div className="text-sm">
          {format(new Date(increase.effectiveDate), 'dd/MM/yyyy', { locale: ar })}
        </div>
      ),
    },
    {
      key: 'previousSalary',
      header: 'الراتب السابق',
      render: (increase) => (
        <div className="text-sm">
          <CurrencyAmountCompact amount={increase.previousSalary} />
        </div>
      ),
    },
    {
      key: 'newSalary',
      header: 'الراتب الجديد',
      render: (increase) => (
        <div className="text-sm font-medium text-green-600">
          <CurrencyAmountCompact amount={increase.newSalary} />
        </div>
      ),
    },
    {
      key: 'increase',
      header: 'مقدار الزيادة',
      render: (increase) => {
        const increaseAmount = increase.newSalary - increase.previousSalary;
        const increasePercentage = (
          (increaseAmount / increase.previousSalary) *
          100
        ).toFixed(1);
        return (
          <div className="text-sm">
            <div className="font-medium text-green-600">
              +<CurrencyAmountCompact amount={increaseAmount} />
            </div>
            <div className="text-xs text-[var(--text-secondary)]">({increasePercentage}%)</div>
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'السبب',
      render: (increase) => (
        <div className="text-sm text-[var(--text-secondary)]">{increase.reason || '-'}</div>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات الموظف..." />;
  }

  if (!employee) {
    return (
      <PageLayout title="تفاصيل الموظف" description="لم يتم العثور على الموظف">
        <div className="text-center text-[var(--text-secondary)] py-8">لم يتم العثور على الموظف</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={employee.name}
      description={employee.position}
      error={error}
      onRetry={() => window.location.reload()}
      actions={
        <div className="flex gap-2">
          {employee.status === EmployeeStatus.ACTIVE && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/edit/${id}`)}>
                <Edit className="w-4 h-4" />
                تعديل
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowResignModal(true)}>
                <UserX className="w-4 h-4" />
                تسجيل استقالة
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
        </div>
      }
    >
      {/* Employee Info Card */}
      <Card padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Name & Status */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <User className="w-4 h-4" />
              <span>الموظف</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {employee.name}
              </div>
              <Badge
                variant={
                  employee.status === EmployeeStatus.ACTIVE ? 'default' : 'destructive'
                }
              >
                {employee.status === EmployeeStatus.ACTIVE ? 'نشط' : 'مستقيل'}
              </Badge>
            </div>
          </div>

          {/* Position */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <Briefcase className="w-4 h-4" />
              <span>المنصب</span>
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">
              {employee.position}
            </div>
          </div>

          {/* Branch */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>الفرع</span>
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">
              {employee.branch ? employee.branch.name : '-'}
            </div>
          </div>

          {/* Hire Date */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <Calendar className="w-4 h-4" />
              <span>تاريخ التوظيف</span>
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">
              {format(new Date(employee.hireDate), 'dd/MM/yyyy', { locale: ar })}
            </div>
          </div>

          {/* Base Salary */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>الراتب الأساسي</span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              <CurrencyAmount amount={employee.baseSalary} />
            </div>
          </div>

          {/* Allowance */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>البدلات</span>
            </div>
            <div className="text-lg font-semibold text-blue-600">
              <CurrencyAmount amount={employee.allowance} />
            </div>
          </div>

          {/* Total Salary */}
          <div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>إجمالي الراتب</span>
            </div>
            <div className="text-xl font-bold text-primary-600">
              <CurrencyAmount amount={employee.baseSalary + employee.allowance} />
            </div>
          </div>

          {/* Resign Date (if resigned) */}
          {employee.status === EmployeeStatus.RESIGNED && employee.resignDate && (
            <div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
                <Calendar className="w-4 h-4" />
                <span>تاريخ الاستقالة</span>
              </div>
              <div className="text-lg font-semibold text-red-600">
                {format(new Date(employee.resignDate), 'dd/MM/yyyy', { locale: ar })}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {employee.notes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <div className="text-sm text-[var(--text-secondary)] mb-2">ملاحظات:</div>
            <div className="text-[var(--text-primary)]">{employee.notes}</div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'payments'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <DollarSign className="w-4 h-4 inline ml-2" />
          دفعات الرواتب ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('increases')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'increases'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline ml-2" />
          الزيادات ({increases.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'payments' && (
        <Card padding="lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">دفعات الرواتب</h3>
          </div>
          {payments.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-8">
              لا توجد دفعات رواتب مسجلة
            </div>
          ) : (
            <Table columns={paymentColumns} data={payments} keyExtractor={(p) => p.id} />
          )}
        </Card>
      )}

      {activeTab === 'increases' && (
        <Card padding="lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">سجل الزيادات</h3>
          </div>
          {increases.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-8">
              لا توجد زيادات مسجلة
            </div>
          ) : (
            <Table columns={increaseColumns} data={increases} keyExtractor={(i) => i.id} />
          )}
        </Card>
      )}

      {/* Resign Modal */}
      <ConfirmModal
        isOpen={showResignModal}
        onClose={() => {
          setShowResignModal(false);
          setResignDate('');
        }}
        onConfirm={handleResign}
        title="تسجيل استقالة الموظف"
        confirmText="تسجيل الاستقالة"
        cancelText="إلغاء"
        variant="warning"
        isLoading={resignEmployee.isPending}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            سيتم تحديث حالة الموظف إلى "مستقيل" ولن يظهر في قائمة الموظفين النشطين.
          </p>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              تاريخ الاستقالة <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={resignDate}
              onChange={(e) => setResignDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* Delete Payment Modal */}
      <ConfirmModal
        isOpen={!!deletingPaymentId}
        onClose={() => setDeletingPaymentId(null)}
        onConfirm={handleDeletePayment}
        title="تأكيد حذف دفعة الراتب"
        message="هل أنت متأكد من حذف هذه الدفعة؟ سيتم أيضاً حذف المعاملة المالية المرتبطة بها. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deletePayment.isPending}
      />
    </PageLayout>
  );
};

export default EmployeeDetailsPage;
