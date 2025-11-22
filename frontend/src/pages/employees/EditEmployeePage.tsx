import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EmployeeForm } from '@/components/EmployeeForm';
import { useEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import { PageLoading } from '@/components/loading';
import type { UpdateEmployeeInput } from '@/types';

/**
 * Edit Employee Page
 * Full page for editing an existing employee
 */
export const EditEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading: isLoadingEmployee, error } = useEmployee(id!);
  const updateEmployee = useUpdateEmployee();

  const handleUpdate = async (data: UpdateEmployeeInput) => {
    if (!id) return;
    await updateEmployee.mutateAsync({ id, data });
    navigate(`/employees/view/${id}`);
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/employees/view/${id}`);
    } else {
      navigate('/employees');
    }
  };

  return (
    <PageLayout
      title="تعديل بيانات الموظف"
      description="تحديث معلومات الموظف"
      error={error}
      onRetry={() => window.location.reload()}
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {isLoadingEmployee ? (
        <PageLoading message="جاري تحميل بيانات الموظف..." />
      ) : employee ? (
        <Card padding="lg">
          <EmployeeForm
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            initialData={employee}
            isLoading={updateEmployee.isPending}
          />
        </Card>
      ) : (
        <div className="text-center text-[var(--text-secondary)] py-8">لم يتم العثور على الموظف</div>
      )}
    </PageLayout>
  );
};

export default EditEmployeePage;
