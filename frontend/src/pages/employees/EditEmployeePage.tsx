import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployee, useUpdateEmployee } from '@/hooks/api/useEmployees';
import branchService from '@/api/services/branchService';
import { useUserInfo } from '@/store/userStore';
import { UserRole } from '@/types/enum';
import EmployeeForm from './components/EmployeeForm';
import type { UpdateEmployeeInput } from '@/types';

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserInfo();
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data: employee, isLoading: isLoadingEmployee, error } = useEmployee(id!);
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

  // Fetch branches for admin
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (error) {
      // Handle error (e.g. redirect or show toast)
    }
  }, [error]);

  const handleSubmit = (data: any) => {
    if (!id) return;
    updateEmployee({ id, data: data as UpdateEmployeeInput }, {
      onSuccess: () => {
        navigate('/employees');
      },
    });
  };

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground mb-4">الموظف غير موجود</p>
        <Button onClick={() => navigate('/employees')}>العودة للقائمة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">تعديل بيانات الموظف</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الموظف: {employee.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            initialData={{
              name: employee.name,
              position: employee.position,
              branchId: employee.branchId,
              baseSalary: Number(employee.baseSalary),
              allowance: Number(employee.allowance),
              hireDate: new Date(employee.hireDate),
              status: employee.status,
            }}
            branches={branches || []}
            isAdmin={isAdmin}
            userBranchId={user?.branchId || undefined}
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
