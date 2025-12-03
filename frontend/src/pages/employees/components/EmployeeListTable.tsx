import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, UserX, Trash2 } from 'lucide-react';
import type { Employee } from '@/types';
import { EmployeeStatus } from '@/types/enum';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmployeeListTableProps {
  employees: Employee[];
  isLoading: boolean;
  isAdmin: boolean;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onResign: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isDeleting?: boolean;
}

export default function EmployeeListTable({
  employees,
  isLoading,
  onView,
  onEdit,
  onResign,
  onDelete,
  isDeleting = false,
}: EmployeeListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المنصب</TableHead>
              <TableHead className="text-right">الفرع</TableHead>
              <TableHead className="text-right">الراتب الأساسي</TableHead>
              <TableHead className="text-right">تاريخ التعيين</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-card">
        <p className="text-muted-foreground mb-4">لا يوجد موظفين</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">المنصب</TableHead>
            <TableHead className="text-right">الفرع</TableHead>
            <TableHead className="text-right">الراتب الأساسي</TableHead>
            <TableHead className="text-right">تاريخ التعيين</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>{employee.branch?.name || '-'}</TableCell>
              <TableCell>{formatCurrency(employee.baseSalary)}</TableCell>
              <TableCell>
                {format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: ar })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={employee.status === EmployeeStatus.ACTIVE ? 'default' : 'secondary'}
                >
                  {employee.status === EmployeeStatus.ACTIVE ? 'نشط' : 'مستقيل'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(employee)}>
                      <Eye className="ml-2 h-4 w-4" />
                      عرض التفاصيل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(employee)}>
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </DropdownMenuItem>
                    {employee.status === EmployeeStatus.ACTIVE && (
                      <DropdownMenuItem onClick={() => onResign(employee)}>
                        <UserX className="ml-2 h-4 w-4" />
                        تسجيل استقالة
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(employee)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
