import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  Receipt,
  AlertCircle,
  Wallet,
  Pencil,
  Trash2,
  CreditCard,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
  Badge,
} from '@/components/ui';
import { usePayables, usePayablesSummary, useDeletePayable } from '@/hooks/api/usePayables';
import { DebtStatus } from '@/types/enum';
import type { AccountPayable, QueryPayablesDto } from '@/types/payables.types';

import { PayableForm } from './components/PayableForm';
import { PayablePaymentDialog } from './components/PayablePaymentDialog';

export default function PayablesPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);
  const [payableToEdit, setPayableToEdit] = useState<AccountPayable | undefined>(undefined);

  // Queries
  const filters: QueryPayablesDto = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as DebtStatus) : undefined,
  };

  const { data: payablesData, isLoading, error } = usePayables(filters);
  const { data: summary } = usePayablesSummary();
  const deleteMutation = useDeletePayable();

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الذمة الدائنة؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (payable: AccountPayable) => {
    setPayableToEdit(payable);
    setIsFormOpen(true);
  };

  const handlePay = (payable: AccountPayable) => {
    setSelectedPayable(payable);
    setIsPaymentOpen(true);
  };

  const handleCreate = () => {
    setPayableToEdit(undefined);
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all';

  // Helper for status badge
  const getStatusBadge = (status: DebtStatus) => {
    switch (status) {
      case DebtStatus.PAID:
        return <Badge variant="default" className="bg-secondary/10 text-secondary hover:bg-secondary/20">مدفوع</Badge>;
      case DebtStatus.PARTIAL:
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">جزئي</Badge>;
      default:
        return <Badge variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20">غير مدفوع</Badge>;
    }
  };



  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الذمم الدائنة</h1>
          <p className="text-muted-foreground">إدارة الديون المستحقة للموردين</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة ذمة جديدة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">إجمالي المبالغ المستحقة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الديون النشطة</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byStatus.active}</div>
              <p className="text-xs text-muted-foreground">فواتير غير مدفوعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الديون المدفوعة</CardTitle>
              <Receipt className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byStatus.paid}</div>
              <p className="text-xs text-muted-foreground">فواتير مكتملة الدفع</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              الفلاتر والبحث
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 ml-1" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم المورد، رقم الفاتورة..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value={DebtStatus.ACTIVE}>غير مدفوع</SelectItem>
                <SelectItem value={DebtStatus.PARTIAL}>مدفوع جزئياً</SelectItem>
                <SelectItem value={DebtStatus.PAID}>مدفوع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground">حدث خطأ أثناء تحميل البيانات</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['payables'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : payablesData?.data && payablesData.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المبلغ الأصلي</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead className="w-[120px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payablesData.data.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">
                        {formatDate(payable.date)}
                      </TableCell>
                      <TableCell>{payable.contact?.name}</TableCell>
                      <TableCell>{payable.invoiceNumber || '-'}</TableCell>
                      <TableCell>{formatCurrency(payable.originalAmount)}</TableCell>
                      <TableCell className="text-secondary">
                        {formatCurrency(payable.originalAmount - payable.remainingAmount)}
                      </TableCell>
                      <TableCell className="text-destructive font-bold">
                        {formatCurrency(payable.remainingAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payable.status)}</TableCell>
                      <TableCell>
                        {payable.dueDate ? formatDate(payable.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {payable.status !== DebtStatus.PAID && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-secondary hover:text-secondary/80 hover:bg-secondary/10"
                              onClick={() => handlePay(payable)}
                              title="تسجيل دفعة"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(payable)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(payable.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {payablesData.meta && (
                <div className="border-t border-border px-4 py-4">
                  <Pagination
                    page={payablesData.meta.page}
                    totalPages={payablesData.meta.totalPages}
                    total={payablesData.meta.total}
                    limit={payablesData.meta.limit}
                    onPageChange={setPage}
                    onLimitChange={(l) => {
                      setLimit(l);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد ذمم دائنة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PayableForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        payableToEdit={payableToEdit}
      />

      <PayablePaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        payable={selectedPayable}
      />
    </div>
  );
}
