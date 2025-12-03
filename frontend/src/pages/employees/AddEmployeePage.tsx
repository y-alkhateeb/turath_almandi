import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateEmployee } from '@/hooks/api/useEmployees';
import branchService from '@/api/services/branchService';
import { useUserInfo } from '@/store/userStore';
import { UserRole } from '@/types/enum';
import EmployeeForm from './components/EmployeeForm';
import type { CreateEmployeeInput } from '@/types';

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const user = useUserInfo();
  const isAdmin = user?.role === UserRole.ADMIN;

  const { mutate: createEmployee, isPending } = useCreateEmployee();

  // Fetch branches for admin
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin,
  });

  const handleSubmit = (data: any) => {
    createEmployee(data as CreateEmployeeInput, {
      onSuccess: () => {
        navigate('/employees');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">إضافة موظف جديد</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الموظف</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            branches={branches || []}
            isAdmin={isAdmin}
            userBranchId={user?.branchId || undefined}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
