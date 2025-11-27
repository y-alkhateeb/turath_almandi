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
  Gift,
  Banknote,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useEmployee,
  useResignEmployee,
  useSalaryPaymentHistory,
  useSalaryIncreaseHistory,
  useBonusHistory,
  useDeleteSalaryPayment,
  useRecordSalaryPayment,
  useRecordSalaryIncrease,
  useCreateBonus,
  useDeleteBonus,
  useEmployeeAdvances,
} from '@/hooks/useEmployees';
import { AdvanceDialog } from '@/components/employees/AdvanceDialog';
import { AdvancesList } from '@/components/employees/AdvancesList';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Table, ConfirmModal } from '@/components/ui';
import { DateInput } from '@/components/form';
import { CurrencyAmount, CurrencyAmountCompact } from '@/components/currency';
import { formatDateShort } from '@/utils/formatters';
import { EmployeeStatus } from '@/types';
import type { SalaryPayment, SalaryIncrease, Bonus } from '@/types';
import type { Column } from '@/components/ui/Table';

export const EmployeeDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  const { data: employee, isLoading, error } = useEmployee(id!);
  const { data: payments = [] } = useSalaryPaymentHistory(id!);
  const { data: increases = [] } = useSalaryIncreaseHistory(id!);
  const { data: bonuses = [] } = useBonusHistory(id!);
  const { data: advancesData } = useEmployeeAdvances(id!);

  const resignEmployee = useResignEmployee();
  const deletePayment = useDeleteSalaryPayment();
  const recordPayment = useRecordSalaryPayment();
  const recordIncrease = useRecordSalaryIncrease();
  const createBonus = useCreateBonus();
  const deleteBonus = useDeleteBonus();

  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'increases' | 'bonuses' | 'advances'>('info');
  const [showResignModal, setShowResignModal] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [resignDate, setResignDate] = useState('');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    notes: '',
  });

  // Increase modal state
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [increaseData, setIncreaseData] = useState({
    effectiveDate: new Date().toISOString().split('T')[0],
    increaseAmount: '',
    reason: '',
  });

  // Bonus modal state
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusData, setBonusData] = useState({
    bonusDate: new Date().toISOString().split('T')[0],
    amount: '',
    reason: '',
  });
  const [deletingBonusId, setDeletingBonusId] = useState<string | null>(null);

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

  const handleRecordPayment = async () => {
    if (!id || !paymentData.amount) return;
    await recordPayment.mutateAsync({
      employeeId: id,
      data: {
        paymentDate: paymentData.paymentDate,
        amount: parseFloat(paymentData.amount),
        notes: paymentData.notes || undefined,
      },
    });
    setShowPaymentModal(false);
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      notes: '',
    });
  };

  const handleRecordIncrease = async () => {
    if (!id || !increaseData.increaseAmount || !employee) return;
    const newSalary = Number(employee.baseSalary) + Number(increaseData.increaseAmount);
    await recordIncrease.mutateAsync({
      employeeId: id,
      data: {
        effectiveDate: increaseData.effectiveDate,
        newSalary: newSalary,
        reason: increaseData.reason || undefined,
      },
    });
    setShowIncreaseModal(false);
    setIncreaseData({
      effectiveDate: new Date().toISOString().split('T')[0],
      increaseAmount: '',
      reason: '',
    });
  };

  const handleCreateBonus = async () => {
    if (!id || !bonusData.amount) return;
    await createBonus.mutateAsync({
      employeeId: id,
      data: {
        bonusDate: bonusData.bonusDate,
        amount: parseFloat(bonusData.amount),
        reason: bonusData.reason || undefined,
      },
    });
    setShowBonusModal(false);
    setBonusData({
      bonusDate: new Date().toISOString().split('T')[0],
      amount: '',
      reason: '',
    });
  };

  const handleDeleteBonus = async () => {
    if (!id || !deletingBonusId) return;
    await deleteBonus.mutateAsync({ id: deletingBonusId, employeeId: id });
    setDeletingBonusId(null);
  };

  // Salary Payments Table Columns
  const paymentColumns: Column<SalaryPayment>[] = [
    {
      key: 'paymentDate',
      header: 'تاريخ الدفع',
      render: (payment) => (
        <div className="text-sm">
          {formatDateShort(payment.paymentDate)}
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
          {formatDateShort(increase.effectiveDate)}
        </div>
      ),
    },
    {
      key: 'previousSalary',
      header: 'الراتب السابق',
      render: (increase) => (
        <div className="text-sm">
          <CurrencyAmountCompact amount={increase.oldSalary} />
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
        const increaseAmount = increase.newSalary - increase.oldSalary;
        const increasePercentage = (
          (increaseAmount / increase.oldSalary) *
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

  // Bonuses Table Columns
  const bonusColumns: Column<Bonus>[] = [
    {
      key: 'bonusDate',
      header: 'تاريخ المكافأة',
      render: (bonus) => (
        <div className="text-sm">
          {formatDateShort(bonus.bonusDate)}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      render: (bonus) => (
        <div className="text-sm font-medium text-green-600">
          <CurrencyAmountCompact amount={bonus.amount} />
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'السبب',
      render: (bonus) => (
        <div className="text-sm text-[var(--text-secondary)]">{bonus.reason || '-'}</div>
      ),
    },
    {
      key: 'recordedBy',
      header: 'سجل بواسطة',
      render: (bonus) => (
        <div className="text-sm text-[var(--text-secondary)]">
          {bonus.recorder?.username || '-'}
        </div>
      ),
    },
  ];

  // Add delete action column for bonuses if employee is active
  if (employee?.status === EmployeeStatus.ACTIVE) {
    bonusColumns.push({
      key: 'actions',
      header: 'إجراءات',
      render: (bonus) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeletingBonusId(bonus.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          حذف
        </Button>
      ),
    });
  }

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
      <Card className="p-8 mb-6">
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
              {formatDateShort(employee.hireDate)}
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
              <CurrencyAmount amount={Number(employee.baseSalary) + Number(employee.allowance)} />
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
                {formatDateShort(employee.resignDate)}
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
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'bonuses'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift className="w-4 h-4 inline ml-2" />
          المكافآت ({bonuses.length})
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'advances'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Banknote className="w-4 h-4 inline ml-2" />
          السلف ({advancesData?.summary?.totalActiveAdvances || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'payments' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">دفعات الرواتب</h3>
            {employee.status === EmployeeStatus.ACTIVE && (
              <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                <DollarSign className="w-4 h-4" />
                تسجيل دفعة راتب
              </Button>
            )}
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
        <Card className="p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">سجل الزيادات</h3>
            {employee.status === EmployeeStatus.ACTIVE && (
              <Button size="sm" onClick={() => setShowIncreaseModal(true)}>
                <TrendingUp className="w-4 h-4" />
                تسجيل زيادة
              </Button>
            )}
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

      {activeTab === 'bonuses' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">سجل المكافآت</h3>
            {employee.status === EmployeeStatus.ACTIVE && (
              <Button size="sm" onClick={() => setShowBonusModal(true)}>
                <Gift className="w-4 h-4" />
                إضافة مكافأة
              </Button>
            )}
          </div>
          {bonuses.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-8">
              لا توجد مكافآت مسجلة
            </div>
          ) : (
            <Table columns={bonusColumns} data={bonuses} keyExtractor={(b) => b.id} />
          )}
        </Card>
      )}

      {activeTab === 'advances' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">سجل السلف</h3>
            {employee.status === EmployeeStatus.ACTIVE && (
              <Button size="sm" onClick={() => setShowAdvanceDialog(true)}>
                <Banknote className="w-4 h-4" />
                تسجيل سلفة
              </Button>
            )}
          </div>
          <AdvancesList
            employeeId={id!}
            employeeName={employee.name}
          />
        </Card>
      )}

      {/* Advance Dialog */}
      {employee && (
        <AdvanceDialog
          isOpen={showAdvanceDialog}
          onClose={() => setShowAdvanceDialog(false)}
          employeeId={id!}
          employeeName={employee.name}
          baseSalary={Number(employee.baseSalary)}
          allowance={Number(employee.allowance)}
        />
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
          <DateInput
            label="تاريخ الاستقالة"
            value={resignDate}
            onChange={(value) => setResignDate(value || '')}
            max={new Date().toISOString().split('T')[0]}
            showLabel={true}
          />
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

      {/* Record Payment Modal */}
      <ConfirmModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentData({
            paymentDate: new Date().toISOString().split('T')[0],
            amount: '',
            notes: '',
          });
        }}
        onConfirm={handleRecordPayment}
        title="تسجيل دفعة راتب"
        confirmText="تسجيل"
        cancelText="إلغاء"
        variant="success"
        isLoading={recordPayment.isPending}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            سيتم تسجيل دفعة راتب جديدة للموظف <strong>{employee?.name}</strong>
          </p>

          <DateInput
            label="تاريخ الدفع"
            value={paymentData.paymentDate}
            onChange={(value) => setPaymentData({ ...paymentData, paymentDate: value || '' })}
            max={new Date().toISOString().split('T')[0]}
            showLabel={true}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              المبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {employee && (
              <div className="text-xs text-[var(--text-secondary)] mt-1 space-y-1">
                <p>
                  الراتب الكامل: <CurrencyAmountCompact amount={Number(employee.baseSalary) + Number(employee.allowance)} />
                </p>
                {advancesData?.summary?.totalMonthlyDeduction && advancesData.summary.totalMonthlyDeduction > 0 && (
                  <>
                    <p className="text-amber-600">
                      خصم السلفة الشهري: <CurrencyAmountCompact amount={advancesData.summary.totalMonthlyDeduction} />
                    </p>
                    <p className="text-green-600 font-medium">
                      صافي الراتب بعد الخصم: <CurrencyAmountCompact amount={advancesData.summary.netSalaryAfterDeduction || (Number(employee.baseSalary) + Number(employee.allowance) - advancesData.summary.totalMonthlyDeduction)} />
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* Record Increase Modal */}
      <ConfirmModal
        isOpen={showIncreaseModal}
        onClose={() => {
          setShowIncreaseModal(false);
          setIncreaseData({
            effectiveDate: new Date().toISOString().split('T')[0],
            increaseAmount: '',
            reason: '',
          });
        }}
        onConfirm={handleRecordIncrease}
        title="تسجيل زيادة راتب"
        confirmText="تسجيل"
        cancelText="إلغاء"
        variant="success"
        isLoading={recordIncrease.isPending}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            سيتم تسجيل زيادة راتب للموظف <strong>{employee?.name}</strong>
          </p>

          <DateInput
            label="تاريخ السريان"
            value={increaseData.effectiveDate}
            onChange={(value) => setIncreaseData({ ...increaseData, effectiveDate: value || '' })}
            showLabel={true}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              مقدار الزيادة <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={increaseData.increaseAmount}
              onChange={(e) => setIncreaseData({ ...increaseData, increaseAmount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {employee && increaseData.increaseAmount && !isNaN(parseFloat(increaseData.increaseAmount)) && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                <p className="text-[var(--text-secondary)]">
                  الراتب الحالي: <CurrencyAmountCompact amount={employee.baseSalary} />
                </p>
                <p className="text-green-600 font-medium">
                  الراتب الجديد:{' '}
                  <CurrencyAmountCompact
                    amount={Number(employee.baseSalary) + Number(increaseData.increaseAmount)}
                  />{' '}
                  (+
                  {(
                    (Number(increaseData.increaseAmount) / Number(employee.baseSalary)) *
                    100
                  ).toFixed(1)}
                  %)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              سبب الزيادة (اختياري)
            </label>
            <textarea
              value={increaseData.reason}
              onChange={(e) => setIncreaseData({ ...increaseData, reason: e.target.value })}
              rows={3}
              placeholder="مثال: أداء متميز، ترقية، ..."
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* Delete Bonus Modal */}
      <ConfirmModal
        isOpen={!!deletingBonusId}
        onClose={() => setDeletingBonusId(null)}
        onConfirm={handleDeleteBonus}
        title="تأكيد حذف المكافأة"
        message="هل أنت متأكد من حذف هذه المكافأة؟ سيتم أيضاً حذف المعاملة المالية المرتبطة بها. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteBonus.isPending}
      />

      {/* Create Bonus Modal */}
      <ConfirmModal
        isOpen={showBonusModal}
        onClose={() => {
          setShowBonusModal(false);
          setBonusData({
            bonusDate: new Date().toISOString().split('T')[0],
            amount: '',
            reason: '',
          });
        }}
        onConfirm={handleCreateBonus}
        title="إضافة مكافأة"
        confirmText="إضافة"
        cancelText="إلغاء"
        variant="success"
        isLoading={createBonus.isPending}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            سيتم إضافة مكافأة للموظف <strong>{employee?.name}</strong>
          </p>

          <DateInput
            label="تاريخ المكافأة"
            value={bonusData.bonusDate}
            onChange={(value) => setBonusData({ ...bonusData, bonusDate: value || '' })}
            max={new Date().toISOString().split('T')[0]}
            showLabel={true}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              مبلغ المكافأة <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bonusData.amount}
              onChange={(e) => setBonusData({ ...bonusData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              سبب المكافأة (اختياري)
            </label>
            <textarea
              value={bonusData.reason}
              onChange={(e) => setBonusData({ ...bonusData, reason: e.target.value })}
              rows={3}
              placeholder="مثال: أداء متميز، إنجاز خاص، ..."
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </ConfirmModal>
    </PageLayout>
  );
};

export default EmployeeDetailsPage;
