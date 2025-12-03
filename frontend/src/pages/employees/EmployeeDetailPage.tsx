import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Loader2, UserX, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployee, useDeleteEmployee, useResignEmployee } from '@/hooks/api/useEmployees';
import { EmployeeStatus } from '@/types/enum';
import { formatCurrency, formatDate } from '@/utils/format';
import { AdjustmentForm } from './components/AdjustmentForm';
import { SalaryDetailsComponent } from './components/SalaryDetailsComponent';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);

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
        data: { resignDate: new Date().toISOString() }, // Default to today
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
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {employee.name}
              <Badge
                variant={employee.status === EmployeeStatus.ACTIVE ? 'default' : 'secondary'}
              >
                {employee.status === EmployeeStatus.ACTIVE ? 'نشط' : 'مستقيل'}
              </Badge>
            </h1>
            <p className="text-muted-foreground">{employee.position}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          {employee.status === EmployeeStatus.ACTIVE && (
            <Button variant="secondary" onClick={handleResign} disabled={isResigning}>
              <UserX className="h-4 w-4 ml-2" />
              تسجيل استقالة
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 ml-2" />
            حذف
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="history">سجل الرواتب</TabsTrigger>
          <TabsTrigger value="adjustments">المكافآت والخصومات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الشخصية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">الفرع</span>
                  <span className="font-medium">{employee.branch?.name || '-'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">تاريخ التعيين</span>
                  <span className="font-medium">
                    {formatDate(new Date(employee.hireDate))}
                  </span>
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
                <CardTitle>المعلومات المالية</CardTitle>
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
                <div className="flex justify-between border-b pb-2 pt-2 bg-muted/50 px-2 rounded">
                  <span className="font-bold">إجمالي الراتب</span>
                  <span className="font-bold">
                    {formatCurrency(Number(employee.baseSalary) + Number(employee.allowance))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryDetailsComponent employeeId={id!} employeeName={employee.name} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>المكافآت والخصومات</CardTitle>
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
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-right font-medium">التاريخ</th>
                          <th className="p-3 text-right font-medium">النوع</th>
                          <th className="p-3 text-right font-medium">المبلغ</th>
                          <th className="p-3 text-right font-medium">الحالة</th>
                          <th className="p-3 text-right font-medium">الوصف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.adjustments.map((adjustment) => (
                          <tr key={adjustment.id} className="border-b">
                            <td className="p-3">{formatDate(new Date(adjustment.date))}</td>
                            <td className="p-3">
                              <Badge variant={
                                adjustment.type === 'BONUS' ? 'default' : 
                                adjustment.type === 'DEDUCTION' ? 'destructive' : 
                                'secondary'
                              }>
                                {adjustment.type === 'BONUS' ? 'مكافأة' :
                                 adjustment.type === 'DEDUCTION' ? 'خصم' : 'سلفة'}
                              </Badge>
                            </td>
                            <td className="p-3 font-medium">{formatCurrency(adjustment.amount)}</td>
                            <td className="p-3">
                              <Badge variant={
                                adjustment.status === 'PENDING' ? 'outline' :
                                adjustment.status === 'PROCESSED' ? 'default' :
                                'secondary'
                              }>
                                {adjustment.status === 'PENDING' ? 'معلق' :
                                 adjustment.status === 'PROCESSED' ? 'تم المعالجة' : 'ملغي'}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{adjustment.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  لا توجد تسويات لهذا الموظف
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Adjustment Dialog */}
          {showAdjustmentDialog && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>إضافة تسوية جديدة</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdjustmentForm
                    employeeId={id!}
                    onSuccess={() => setShowAdjustmentDialog(false)}
                  />
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAdjustmentDialog(false)}
                      className="w-full"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
