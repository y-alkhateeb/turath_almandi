import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useEmployees, useDeleteEmployee } from '@/hooks/api/useEmployees';
import { useUserInfo } from '@/store/userStore';
import { UserRole, EmployeeStatus } from '@/types/enum';
import type { Employee, EmployeeFilters } from '@/types';
import EmployeeListTable from './components/EmployeeListTable';
import { useQuery } from '@tanstack/react-query';
import branchService from '@/api/services/branchService';

const DEFAULT_PAGE_SIZE = 10;

export default function EmployeesPage() {
  const navigate = useNavigate();
  const user = useUserInfo();
  const isAdmin = user?.role === UserRole.ADMIN;

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [branchId, setBranchId] = useState<string>('all');

  // Build query filters
  const filters: EmployeeFilters = useMemo(() => {
    const f: EmployeeFilters = {
      page,
      limit: pageSize,
    };

    if (search) f.search = search;
    if (status !== 'all') f.status = status as EmployeeStatus;
    if (branchId !== 'all') f.branchId = branchId;

    return f;
  }, [page, pageSize, search, status, branchId]);

  // Data Fetching
  const { data, isLoading, error } = useEmployees(filters);
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

  // Fetch branches for admin filter
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin,
  });

  // Handlers
  const handleAddEmployee = () => {
    navigate('/employees/new');
  };

  const handleViewEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleEditEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  const handleResignEmployee = (employee: Employee) => {
    // Navigate to resign page or open dialog (we'll use a page/route for now as per plan, or maybe a dialog later)
    // For now let's assume we navigate to edit page or a specific resign page
    // Since we didn't plan a specific resign page yet, let's use the detail page or edit page
    // Actually, let's just navigate to detail page where resign action might be available or add a query param
    navigate(`/employees/${employee.id}?action=resign`);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      deleteEmployee(employee.id);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">حدث خطأ أثناء تحميل الموظفين</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">الموظفين</h1>
        <Button onClick={handleAddEmployee}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة موظف جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-card p-4 rounded-lg border">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو المنصب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value={EmployeeStatus.ACTIVE}>نشط</SelectItem>
            <SelectItem value={EmployeeStatus.RESIGNED}>مستقيل</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger>
              <SelectValue placeholder="الفرع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفروع</SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <EmployeeListTable
        employees={data?.data || []}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onResign={handleResignEmployee}
        onDelete={handleDeleteEmployee}
        isDeleting={isDeleting}
      />

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          limit={pageSize}
          total={data.meta.total}
          onPageChange={setPage}
          onLimitChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
