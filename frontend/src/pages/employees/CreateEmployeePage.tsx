import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EmployeeForm } from '@/components/EmployeeForm';
import { useCreateEmployee } from '@/hooks/useEmployees';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { CreateEmployeeInput } from '@/types';

/**
 * Create Employee Page
 * Full page for creating a new employee
 */
export const CreateEmployeePage = () => {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();

  const handleCreate = async (data: CreateEmployeeInput) => {
    await createEmployee.mutateAsync(data);
    navigate('/employees');
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <PageLayout
      title="إضافة موظف جديد"
      description="إضافة موظف جديد إلى النظام"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card className="p-8">
        <EmployeeForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={createEmployee.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateEmployeePage;
