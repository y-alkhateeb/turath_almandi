import { useState, useCallback, useMemo } from 'react';
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
import { formatCurrency, formatDate } from '@/utils/format';
import { Loader2, DollarSign, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdvanceDeductionSelector } from './AdvanceDeductionSelector';
import type { AdvanceDeductionInput } from '@/types/entity';

interface SalaryDetailsProps {
  employeeId: string;
  employeeName: string;
}

export function SalaryDetailsComponent({ employeeId, employeeName }: SalaryDetailsProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [advanceDeductions, setAdvanceDeductions] = useState<AdvanceDeductionInput[]>([]);

  const { data: salaryDetails, isLoading } = useEmployeeSalaryDetails(employeeId, selectedMonth);
  const { mutate: paySalary, isPending: isPayingLoading } = usePaySalary();

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  // Calculate actual net salary based on selected advance deductions
  const actualNetSalary = useMemo(() => {
    if (!salaryDetails) return 0;

    const baseNet =
      salaryDetails.totalSalary +
      salaryDetails.adjustments.bonuses -
      salaryDetails.adjustments.deductions;

    const totalAdvanceDeduction = advanceDeductions.reduce(
      (sum, d) => sum + d.deductionAmount,
      0
    );

    return baseNet - totalAdvanceDeduction;
  }, [salaryDetails, advanceDeductions]);

  const handleAdvanceDeductionsChange = useCallback(
    (deductions: AdvanceDeductionInput[]) => {
      setAdvanceDeductions(deductions);
    },
    []
  );

  const handlePaySalary = () => {
    const paymentData = {
      employeeId,
      paymentDate: new Date().toISOString(),
      salaryMonth: selectedMonth,
      paymentMethod: 'CASH' as const,
      advanceDeductions: advanceDeductions.length > 0 ? advanceDeductions : undefined,
    };

    paySalary(paymentData, {
      onSuccess: () => {
        setShowPayDialog(false);
        setAdvanceDeductions([]);
      },
    });
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
      {/* Month Selector with Payment Status */}
      <div className="flex items-center justify-between gap-4">
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

        {/* Payment Status Badge */}
        {salaryDetails && (
          <Badge
            variant={salaryDetails.isPaid ? 'default' : 'secondary'}
            className={`gap-1 ${
              salaryDetails.isPaid ? 'bg-success/10 text-success hover:bg-success/20' : ''
            }`}
          >
            {salaryDetails.isPaid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                مدفوع
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                غير مدفوع
              </>
            )}
          </Badge>
        )}
      </div>

      {salaryDetails && (
        <>
          {/* Already Paid Info */}
          {salaryDetails.isPaid && salaryDetails.existingPayment && (
            <Card className="border-success/30 bg-success/5 dark:bg-success/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-success" />
                  <div className="flex-1">
                    <p className="font-medium text-success">
                      تم صرف راتب هذا الشهر بتاريخ{' '}
                      {formatDate(new Date(salaryDetails.existingPayment.paymentDate))}
                    </p>
                    <p className="text-success/80">
                      المبلغ: {formatCurrency(salaryDetails.existingPayment.amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">الراتب الأساسي</span>
                  <span className="font-medium">{formatCurrency(salaryDetails.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">البدلات</span>
                  <span className="font-medium">{formatCurrency(salaryDetails.allowance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b bg-success/5 dark:bg-success/10 px-2 rounded text-success">
                  <span>المكافآت</span>
                  <span className="font-medium">
                    +{formatCurrency(salaryDetails.adjustments.bonuses)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b bg-destructive/5 dark:bg-destructive/10 px-2 rounded text-destructive">
                  <span>الخصومات</span>
                  <span className="font-medium">
                    -{formatCurrency(salaryDetails.adjustments.deductions)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advance Deduction Selector - Only show if not paid and has advances */}
          {!salaryDetails.isPaid && salaryDetails.pendingAdvances.length > 0 && (
            <AdvanceDeductionSelector
              advances={salaryDetails.pendingAdvances}
              onChange={handleAdvanceDeductionsChange}
            />
          )}

          {/* Net Salary Summary */}
          <Card className="border-primary/20 bg-primary/10 dark:bg-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">صافي الراتب</span>
                <div className="text-left">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(
                      salaryDetails.isPaid
                        ? salaryDetails.existingPayment?.amount ?? salaryDetails.netSalary
                        : actualNetSalary
                    )}
                  </span>
                  {!salaryDetails.isPaid &&
                    advanceDeductions.length > 0 &&
                    actualNetSalary !== salaryDetails.netSalary && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (قبل تعديل السلف: {formatCurrency(salaryDetails.netSalary)})
                      </p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pay Button - Only if not paid */}
          {!salaryDetails.isPaid && (
            <Button
              onClick={() => setShowPayDialog(true)}
              className="w-full"
              size="lg"
              disabled={actualNetSalary <= 0}
            >
              <DollarSign className="h-5 w-5 me-2" />
              صرف الراتب ({formatCurrency(actualNetSalary)})
            </Button>
          )}

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

                  {/* Payment Summary */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>إجمالي الراتب</span>
                      <span>{formatCurrency(salaryDetails.totalSalary)}</span>
                    </div>
                    {salaryDetails.adjustments.bonuses > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>+ المكافآت</span>
                        <span>{formatCurrency(salaryDetails.adjustments.bonuses)}</span>
                      </div>
                    )}
                    {salaryDetails.adjustments.deductions > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>- الخصومات</span>
                        <span>{formatCurrency(salaryDetails.adjustments.deductions)}</span>
                      </div>
                    )}
                    {advanceDeductions.length > 0 && (
                      <div className="flex justify-between text-sm text-warning-600 dark:text-warning-400">
                        <span>- خصم السلف</span>
                        <span>
                          {formatCurrency(
                            advanceDeductions.reduce((sum, d) => sum + d.deductionAmount, 0)
                          )}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>صافي الراتب:</span>
                        <span className="text-primary">{formatCurrency(actualNetSalary)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePaySalary}
                      disabled={isPayingLoading}
                      className="flex-1"
                    >
                      {isPayingLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
