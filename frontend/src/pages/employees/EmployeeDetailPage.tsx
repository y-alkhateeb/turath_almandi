import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Edit, Loader2, UserX, Trash2, User, Wallet, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployee, useDeleteEmployee, useResignEmployee } from '@/hooks/api/useEmployees';
import { EmployeeStatus, EmployeeAdjustmentStatus } from '@/types/enum';
import { formatCurrency, formatDate } from '@/utils/format';
import { SalaryDetailsComponent } from './components/SalaryDetailsComponent';
import { PaymentHistoryTable } from './components/PaymentHistoryTable';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: employee, isLoading, error } = useEmployee(id!);
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const { mutate: resignEmployee, isPending: isResigning } = useResignEmployee();

  const handleEdit = () => {
    navigate(`/employees/${id}/edit`);
  };

  const handleResign = () => {
    if (window.confirm('هل أنت متأكد من تسجيل استقالة هذا الموظف؟')) {
      resignEmployee({
        id: id!,
        data: { resignDate: new Date().toISOString() },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      deleteEmployee(id!, {
        onSuccess: () => navigate('/employees'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground mb-4">الموظف غير موجود</p>
        <Button onClick={() => navigate('/employees')}>العودة للقائمة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {employee.name}
              <Badge
                variant={employee.status === EmployeeStatus.ACTIVE ? 'default' : 'secondary'}
                className={
                  employee.status === EmployeeStatus.ACTIVE
                    ? 'bg-success/10 text-success hover:bg-success/20'
                    : ''
                }
              >
                {employee.status === EmployeeStatus.ACTIVE ? 'نشط' : 'مستقيل'}
              </Badge>
            </h1>
            <p className="text-muted-foreground">{employee.position}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 me-2" />
            تعديل
          </Button>
          {employee.status === EmployeeStatus.ACTIVE && (
            <Button variant="secondary" onClick={handleResign} disabled={isResigning}>
              <UserX className="h-4 w-4 me-2" />
              تسجيل استقالة
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 me-2" />
            حذف
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-2">
            <Wallet className="h-4 w-4" />
            الراتب الحالي
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            الدفعات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">الفرع</span>
                  <span className="font-medium">{employee.branch?.name || '-'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">تاريخ التعيين</span>
                  <span className="font-medium">{formatDate(new Date(employee.hireDate))}</span>
                </div>
                {employee.resignDate && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">تاريخ الاستقالة</span>
                    <span className="font-medium">
                      {formatDate(new Date(employee.resignDate))}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  المعلومات المالية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">الراتب الأساسي</span>
                  <span className="font-medium">{formatCurrency(employee.baseSalary)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">البدلات</span>
                  <span className="font-medium">{formatCurrency(employee.allowance)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 pt-2 bg-primary/10 dark:bg-primary/20 px-2 rounded">
                  <span className="font-bold">إجمالي الراتب</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(Number(employee.baseSalary) + Number(employee.allowance))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                إدارة الراتب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryDetailsComponent employeeId={id!} employeeName={employee.name} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <PaymentHistoryTable employeeId={id!} employeeStatus={employee.status} />
        </TabsContent>
      </Tabs>

      {/* Keep adjustment dialog state but remove tab - kept for backward compatibility */}
      {false && (
        <TabsContent value="adjustments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المكافآت والخصومات والسلف
              </CardTitle>
              <Button
                onClick={() => setShowAdjustmentDialog(true)}
                disabled={employee.status !== EmployeeStatus.ACTIVE}
              >
                إضافة تسوية
              </Button>
            </CardHeader>
            <CardContent>
              {employee.adjustments && employee.adjustments.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-right font-medium">التاريخ</th>
                          <th className="p-3 text-right font-medium">النوع</th>
                          <th className="p-3 text-right font-medium">المبلغ</th>
                          <th className="p-3 text-right font-medium">المتبقي</th>
                          <th className="p-3 text-right font-medium">الحالة</th>
                          <th className="p-3 text-right font-medium">الوصف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.adjustments.map((adjustment) => {
                          const isAdvance = adjustment.type === 'ADVANCE';
                          const remaining = adjustment.remainingAmount ?? adjustment.amount;

                          return (
                            <tr key={adjustment.id} className="border-b last:border-0">
                              <td className="p-3">{formatDate(new Date(adjustment.date))}</td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    adjustment.type === 'BONUS'
                                      ? 'default'
                                      : adjustment.type === 'DEDUCTION'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                  className={
                                    adjustment.type === 'BONUS'
                                      ? 'bg-success/10 text-success hover:bg-success/20'
                                      : adjustment.type === 'ADVANCE'
                                        ? 'bg-warning-500/10 text-warning-700 dark:text-warning-400 hover:bg-warning-500/20'
                                        : ''
                                  }
                                >
                                  {adjustment.type === 'BONUS'
                                    ? 'مكافأة'
                                    : adjustment.type === 'DEDUCTION'
                                      ? 'خصم'
                                      : 'سلفة'}
                                </Badge>
                              </td>
                              <td className="p-3 font-medium">
                                {formatCurrency(adjustment.amount)}
                              </td>
                              <td className="p-3">
                                {isAdvance ? (
                                  <span
                                    className={
                                      remaining > 0 ? 'text-warning-600 dark:text-warning-400 font-medium' : 'text-success'
                                    }
                                  >
                                    {formatCurrency(remaining)}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    adjustment.status === EmployeeAdjustmentStatus.PENDING
                                      ? 'outline'
                                      : adjustment.status === EmployeeAdjustmentStatus.PROCESSED
                                        ? 'default'
                                        : 'secondary'
                                  }
                                  className={
                                    adjustment.status === EmployeeAdjustmentStatus.PROCESSED
                                      ? 'bg-success/10 text-success hover:bg-success/20'
                                      : ''
                                  }
                                >
                                  {adjustment.status === EmployeeAdjustmentStatus.PENDING
                                    ? 'معلق'
                                    : adjustment.status === EmployeeAdjustmentStatus.PROCESSED
                                      ? 'تم المعالجة'
                                      : 'ملغي'}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                                {adjustment.description || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد تسويات لهذا الموظف</p>
                  {employee.status === EmployeeStatus.ACTIVE && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowAdjustmentDialog(true)}
                    >
                      إضافة أول تسوية
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </div>
  );
}
