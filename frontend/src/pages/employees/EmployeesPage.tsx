import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, UserX, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { Table, ConfirmModal } from '@/components/ui';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { CurrencyAmountCompact } from '@/components/currency';
import { formatDateShort } from '@/utils/formatters';
import type { Employee } from '@/types';
import type { Column } from '@/components/ui/Table';
import { EmployeeStatus } from '@/types';

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const deleteEmployee = useDeleteEmployee();

  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resigned'>('active');

  // Filter employees by status
  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return emp.status === EmployeeStatus.ACTIVE;
    if (statusFilter === 'resigned') return emp.status === EmployeeStatus.RESIGNED;
    return true;
  });

  const handleDelete = async () => {
    if (!deletingEmployeeId) return;
    await deleteEmployee.mutateAsync(deletingEmployeeId);
    setDeletingEmployeeId(null);
  };

  // Helper functions
  const getStatusDisplay = (status: EmployeeStatus) => {
    return status === EmployeeStatus.ACTIVE ? 'نشط' : 'مستقيل';
  };

  const getStatusBadgeVariant = (
    status: EmployeeStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    return status === EmployeeStatus.ACTIVE ? 'default' : 'destructive';
  };

  // Table columns configuration
  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'اسم الموظف',
      render: (employee) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="mr-4">
            <div className="text-sm font-medium text-[var(--text-primary)]">{employee.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{employee.position}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'الفرع',
      render: (employee) => (
        <div className="text-sm text-[var(--text-primary)]">
          {employee.branch ? (
            <div>
              <div className="font-medium">{employee.branch.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">{employee.branch.location}</div>
            </div>
          ) : (
            <span className="text-[var(--text-secondary)]">بدون فرع</span>
          )}
        </div>
      ),
    },
    {
      key: 'baseSalary',
      header: 'الراتب الأساسي',
      render: (employee) => (
        <div className="text-sm font-medium">
          <CurrencyAmountCompact amount={employee.baseSalary} />
        </div>
      ),
    },
    {
      key: 'allowance',
      header: 'البدلات',
      render: (employee) => (
        <div className="text-sm">
          <CurrencyAmountCompact amount={employee.allowance} />
        </div>
      ),
    },
    {
      key: 'totalSalary',
      header: 'الإجمالي',
      render: (employee) => (
        <div className="text-sm font-semibold text-green-600">
          <CurrencyAmountCompact amount={employee.baseSalary + employee.allowance} />
        </div>
      ),
    },
    {
      key: 'hireDate',
      header: 'تاريخ التوظيف',
      render: (employee) => (
        <div className="text-sm text-[var(--text-primary)]">
          {formatDateShort(employee.hireDate)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (employee) => (
        <Badge variant={getStatusBadgeVariant(employee.status)}>
          {getStatusDisplay(employee.status)}
        </Badge>
      ),
    },
  ];

  // Add actions column
  columns.push({
    key: 'actions',
    header: 'الإجراءات',
    render: (employee) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/employees/view/${employee.id}`)}
          title="عرض التفاصيل"
        >
          <Users className="w-4 h-4" />
          عرض
        </Button>
        {employee.status === EmployeeStatus.ACTIVE && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/employees/edit/${employee.id}`)}
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
              تعديل
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingEmployeeId(employee.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </Button>
            )}
          </>
        )}
      </div>
    ),
  });

  return (
    <PageLayout
      title="إدارة الموظفين والرواتب"
      description="إدارة بيانات الموظفين والرواتب والزيادات"
      error={error}
      onRetry={() => refetch()}
      actions={
        <Button onClick={() => navigate('/employees/create')}>
          <Plus className="w-5 h-5" />
          إضافة موظف جديد
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[var(--border-color)]">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'active'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          الموظفون النشطون
          <span className="mr-2 text-sm">
            ({employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length})
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('resigned')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'resigned'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          المستقيلون
          <span className="mr-2 text-sm">
            ({employees.filter((e) => e.status === EmployeeStatus.RESIGNED).length})
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          الكل
          <span className="mr-2 text-sm">({employees.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <PageLoading message="جاري تحميل بيانات الموظفين..." />
      ) : filteredEmployees.length === 0 ? (
        /* Empty State */
        <EmptyState
          variant="default"
          icon={<Users className="w-full h-full" />}
          title={
            statusFilter === 'active'
              ? 'لا يوجد موظفون نشطون'
              : statusFilter === 'resigned'
              ? 'لا يوجد موظفون مستقيلون'
              : 'لا يوجد موظفون'
          }
          description={
            statusFilter === 'active'
              ? 'أضف موظفين جدد لبدء إدارة الرواتب والمدفوعات.'
              : 'لا توجد سجلات موظفين في هذه الفئة.'
          }
          actions={
            statusFilter === 'active'
              ? {
                  primary: {
                    label: 'إضافة موظف جديد',
                    onClick: () => navigate('/employees/create'),
                  },
                }
              : undefined
          }
          size="lg"
        />
      ) : (
        /* Employees Table */
        <Table columns={columns} data={filteredEmployees} keyExtractor={(emp) => emp.id} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEmployeeId}
        onClose={() => setDeletingEmployeeId(null)}
        onConfirm={handleDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع السجلات المرتبطة به. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteEmployee.isPending}
      />
    </PageLayout>
  );
};

export default EmployeesPage;
