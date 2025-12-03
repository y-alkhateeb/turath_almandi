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
  ArrowDownCircle,
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
import { useReceivables, useReceivablesSummary, useDeleteReceivable } from '@/hooks/api/useReceivables';
import { DebtStatus } from '@/types/enum';
import type { AccountReceivable, QueryReceivablesDto } from '@/types/receivables.types';

import { ReceivableForm } from './components/ReceivableForm';
import { ReceivableCollectDialog } from './components/ReceivableCollectDialog';

export default function ReceivablesPage() {
  const queryClient = useQueryClient();
  // const isAdmin = userInfo?.role === 'ADMIN'; // Not strictly needed if filters are handled by hook

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<AccountReceivable | null>(null);
  const [receivableToEdit, setReceivableToEdit] = useState<AccountReceivable | undefined>(undefined);

  // Queries
  const filters: QueryReceivablesDto = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as DebtStatus) : undefined,
  };

  const { data: receivablesData, isLoading, error } = useReceivables(filters);
  const { data: summary } = useReceivablesSummary();
  const deleteMutation = useDeleteReceivable();

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الذمة المدينة؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (receivable: AccountReceivable) => {
    setReceivableToEdit(receivable);
    setIsFormOpen(true);
  };

  const handleCollect = (receivable: AccountReceivable) => {
    setSelectedReceivable(receivable);
    setIsCollectOpen(true);
  };

  const handleCreate = () => {
    setReceivableToEdit(undefined);
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
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">مستلم</Badge>;
      case DebtStatus.PARTIAL:
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">جزئي</Badge>;
      default:
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">غير مستلم</Badge>;
    }
  };



  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الذمم المدينة</h1>
          <p className="text-muted-foreground">إدارة الديون المستحقة من العملاء</p>
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
              <CardTitle className="text-sm font-medium">إجمالي الديون لنا</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">إجمالي المبالغ المستحقة من العملاء</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الديون النشطة</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byStatus.active}</div>
              <p className="text-xs text-muted-foreground">فواتير غير محصلة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الديون المحصلة</CardTitle>
              <Receipt className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byStatus.paid}</div>
              <p className="text-xs text-muted-foreground">فواتير تم تحصيلها بالكامل</p>
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
                placeholder="بحث باسم العميل، رقم الفاتورة..."
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
                <SelectItem value={DebtStatus.ACTIVE}>غير محصل</SelectItem>
                <SelectItem value={DebtStatus.PARTIAL}>محصل جزئياً</SelectItem>
                <SelectItem value={DebtStatus.PAID}>محصل</SelectItem>
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['receivables'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : receivablesData?.data && receivablesData.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المبلغ الأصلي</TableHead>
                    <TableHead>المحصل</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead className="w-[120px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivablesData.data.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-medium">
                        {formatDate(receivable.date)}
                      </TableCell>
                      <TableCell>{receivable.contact?.name}</TableCell>
                      <TableCell>{receivable.invoiceNumber || '-'}</TableCell>
                      <TableCell>{formatCurrency(receivable.originalAmount)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(receivable.originalAmount - receivable.remainingAmount)}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold">
                        {formatCurrency(receivable.remainingAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                      <TableCell>
                        {receivable.dueDate ? formatDate(receivable.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {receivable.status !== DebtStatus.PAID && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleCollect(receivable)}
                              title="تسجيل تحصيل"
                            >
                              <ArrowDownCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(receivable)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(receivable.id)}
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

              {receivablesData.meta && (
                <div className="border-t border-border px-4 py-4">
                  <Pagination
                    page={receivablesData.meta.page}
                    totalPages={receivablesData.meta.totalPages}
                    total={receivablesData.meta.total}
                    limit={receivablesData.meta.limit}
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
              <p className="text-muted-foreground">لا توجد ذمم مدينة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ReceivableForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        receivableToEdit={receivableToEdit}
      />

      <ReceivableCollectDialog
        open={isCollectOpen}
        onOpenChange={setIsCollectOpen}
        receivable={selectedReceivable}
      />
    </div>
  );
}
