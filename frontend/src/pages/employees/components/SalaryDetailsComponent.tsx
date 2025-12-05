import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployeeSalaryDetails, usePaySalary } from '@/hooks/api/usePayroll';
import { formatCurrency } from '@/utils/format';
import { Loader2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalaryDetailsProps {
  employeeId: string;
  employeeName: string;
}

export function SalaryDetailsComponent({ employeeId, employeeName }: SalaryDetailsProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showPayDialog, setShowPayDialog] = useState(false);

  const { data: salaryDetails, isLoading } = useEmployeeSalaryDetails(employeeId, selectedMonth);
  const { mutate: paySalary, isPending: isPayingLoading } = usePaySalary();

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  const handlePaySalary = () => {
    paySalary(
      {
        employeeId,
        paymentDate: new Date().toISOString(),
        salaryMonth: selectedMonth,
        paymentMethod: 'CASH',
      },
      {
        onSuccess: () => setShowPayDialog(false),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">اختر الشهر:</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => {
              const date = new Date(month + '-01');
              const monthName = date.toLocaleDateString('ar-EG', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <SelectItem key={month} value={month}>
                  {monthName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {salaryDetails && (
        <>
          {/* Salary Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                تفاصيل الراتب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">الراتب الأساسي</span>
                  <span className="font-medium">{formatCurrency(salaryDetails.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">البدلات</span>
                  <span className="font-medium">{formatCurrency(salaryDetails.allowance)}</span>
                </div>
                <div className="flex justify-between py-2 text-secondary">
                  <span>المكافآت</span>
                  <span className="font-medium">+{formatCurrency(salaryDetails.adjustments.bonuses)}</span>
                </div>
                <div className="flex justify-between py-2 text-destructive">
                  <span>الخصومات</span>
                  <span className="font-medium">-{formatCurrency(salaryDetails.adjustments.deductions)}</span>
                </div>
                <div className="flex justify-between py-2 text-warning-600">
                  <span>السلف</span>
                  <span className="font-medium">-{formatCurrency(salaryDetails.adjustments.advances)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">صافي الراتب</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(salaryDetails.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowPayDialog(true)}
                className="w-full"
                size="lg"
              >
                صرف الراتب
              </Button>
            </CardContent>
          </Card>

          {/* Pay Confirmation Dialog */}
          {showPayDialog && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>تأكيد صرف الراتب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    هل أنت متأكد من صرف راتب <strong>{employeeName}</strong> عن شهر{' '}
                    <strong>
                      {new Date(selectedMonth + '-01').toLocaleDateString('ar-EG', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                    ؟
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between font-bold text-lg">
                      <span>المبلغ الإجمالي:</span>
                      <span className="text-primary">{formatCurrency(salaryDetails.netSalary)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePaySalary}
                      disabled={isPayingLoading}
                      className="flex-1"
                    >
                      {isPayingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      تأكيد الصرف
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPayDialog(false)}
                      disabled={isPayingLoading}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
