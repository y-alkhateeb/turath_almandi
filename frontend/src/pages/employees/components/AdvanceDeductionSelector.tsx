import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/format';
import type { EmployeeAdjustment, AdvanceDeductionInput } from '@/types/entity';
import { Banknote, Calendar, Info } from 'lucide-react';

interface AdvanceDeductionSelectorProps {
  advances: EmployeeAdjustment[];
  onChange: (deductions: AdvanceDeductionInput[]) => void;
}

export function AdvanceDeductionSelector({
  advances,
  onChange,
}: AdvanceDeductionSelectorProps) {
  // Track deduction amounts for each advance
  const [deductionAmounts, setDeductionAmounts] = useState<Record<string, number>>({});

  // Initialize with full remaining amounts by default
  useEffect(() => {
    const initialAmounts: Record<string, number> = {};
    advances.forEach((advance) => {
      const remaining = advance.remainingAmount ?? advance.amount;
      initialAmounts[advance.id] = remaining;
    });
    setDeductionAmounts(initialAmounts);
  }, [advances]);

  // Notify parent of changes
  useEffect(() => {
    const deductions: AdvanceDeductionInput[] = Object.entries(deductionAmounts)
      .filter(([_, amount]) => amount > 0)
      .map(([adjustmentId, deductionAmount]) => ({
        adjustmentId,
        deductionAmount,
      }));
    onChange(deductions);
  }, [deductionAmounts, onChange]);

  const handleAmountChange = (advanceId: string, value: string, maxAmount: number) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.min(Math.max(0, numValue), maxAmount);
    setDeductionAmounts((prev) => ({
      ...prev,
      [advanceId]: clampedValue,
    }));
  };

  // Calculate estimated months to fully pay off an advance
  const calculateEstimatedMonths = (remaining: number, monthlyDeduction: number): number => {
    if (monthlyDeduction <= 0) return Infinity;
    return Math.ceil(remaining / monthlyDeduction);
  };

  const totalDeduction = Object.values(deductionAmounts).reduce((sum, val) => sum + val, 0);

  if (advances.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning-500/30 bg-warning-500/5 dark:bg-warning-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-5 w-5 text-warning-600 dark:text-warning-400" />
          السلف المعلقة
          <Badge variant="outline" className="mr-2">
            {advances.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          حدد المبلغ المراد خصمه من كل سلفة هذا الشهر
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {advances.map((advance) => {
          const originalAmount = advance.amount;
          const remainingAmount = advance.remainingAmount ?? advance.amount;
          const paidAmount = originalAmount - remainingAmount;
          const currentDeduction = deductionAmounts[advance.id] ?? 0;
          const afterDeduction = remainingAmount - currentDeduction;
          const estimatedMonths =
            afterDeduction > 0
              ? calculateEstimatedMonths(afterDeduction, currentDeduction)
              : 0;

          return (
            <div
              key={advance.id}
              className="p-4 bg-background rounded-lg border space-y-3"
            >
              {/* Header with description and date */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {advance.description || 'سلفة نقدية'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(new Date(advance.date))}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {formatCurrency(originalAmount)}
                </Badge>
              </div>

              {/* Progress indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">المدفوع</span>
                  <span className="text-muted-foreground">المتبقي</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(paidAmount / originalAmount) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-primary">{formatCurrency(paidAmount)}</span>
                  <span className="text-warning-600 dark:text-warning-400">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>

              {/* Deduction input */}
              <div className="space-y-2">
                <Label htmlFor={`deduction-${advance.id}`} className="text-sm">
                  مبلغ الخصم هذا الشهر
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`deduction-${advance.id}`}
                    type="number"
                    min={0}
                    max={remainingAmount}
                    step={1000}
                    value={currentDeduction || ''}
                    onChange={(e) =>
                      handleAmountChange(advance.id, e.target.value, remainingAmount)
                    }
                    className="text-left"
                    dir="rtl"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    / {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>

              {/* After deduction info */}
              {currentDeduction > 0 && afterDeduction > 0 && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    المتبقي بعد الخصم:{' '}
                    <strong className="text-warning-600 dark:text-warning-400">{formatCurrency(afterDeduction)}</strong>
                    {estimatedMonths < Infinity && (
                      <span className="text-muted-foreground">
                        {' '}
                        (تقريباً {estimatedMonths} شهر للتسديد الكامل)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {currentDeduction > 0 && afterDeduction <= 0 && (
                <div className="flex items-center gap-2 text-sm bg-success/10 text-success p-2 rounded">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>سيتم تسديد السلفة بالكامل</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Total summary */}
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center font-medium">
            <span>إجمالي خصم السلف هذا الشهر</span>
            <span className="text-lg text-warning-600 dark:text-warning-400">
              -{formatCurrency(totalDeduction)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
