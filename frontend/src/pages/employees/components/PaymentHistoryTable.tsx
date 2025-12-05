import { useState } from 'react';
import { useTransactions } from '@/hooks/api/useTransactions';
import { TransactionType } from '@/types/enum';
import { formatCurrency, formatDate } from '@/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History, Receipt, Calendar, DollarSign, Plus } from 'lucide-react';
import { FormDialog } from '@/components/shared/FormDialog';
import { AdjustmentForm } from './AdjustmentForm';
import { EmployeeStatus } from '@/types/enum';

interface PaymentHistoryTableProps {
  employeeId: string;
  employeeStatus?: string;
}

/**
 * Format month string (YYYY-MM) to Arabic month name
 */
function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });
}

export function PaymentHistoryTable({ employeeId, employeeStatus }: PaymentHistoryTableProps) {
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);

  // Fetch all employee expense transactions (includes both salaries and adjustments)
  // Adjustments are stored as EMPLOYEE_SALARIES category with bonus/deduction notes
  const { data: transactionsData, isLoading } = useTransactions({
    employeeId,
    type: TransactionType.EXPENSE,
    limit: 24,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get all transactions and sort by date (newest first)
  const allTransactions = (transactionsData?.data ?? []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (allTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">لا يوجد سجل دفعات أو تسويات لهذا الموظف</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            سيظهر السجل هنا بعد صرف أول راتب أو إضافة تسوية
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalPaid = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-primary/10 dark:bg-primary/20 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {allTransactions.length} دفعة
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            الدفعات
          </CardTitle>
          <Button
            onClick={() => setShowAdjustmentDialog(true)}
            size="sm"
            disabled={employeeStatus !== EmployeeStatus.ACTIVE}
          >
            <Plus className="h-4 w-4 me-2" />
            إضافة تسوية
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-right font-medium">الشهر</th>
                  <th className="p-3 text-right font-medium">تاريخ الصرف</th>
                  <th className="p-3 text-right font-medium">المبلغ</th>
                  <th className="p-3 text-right font-medium">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatMonth(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(new Date(transaction.createdAt))}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-success" />
                        <span className="font-bold text-success">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Adjustment Dialog */}
      <FormDialog
        open={showAdjustmentDialog}
        onOpenChange={setShowAdjustmentDialog}
        title="إضافة تسوية جديدة"
        maxWidth="sm:max-w-md"
      >
        <AdjustmentForm
          employeeId={employeeId}
          onSuccess={() => setShowAdjustmentDialog(false)}
        />
      </FormDialog>
    </div>
  );
}
