/**
 * Transactions Page
 * Lists all transactions with filtering, pagination, and actions
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, toInputDate } from '@/utils/format';
import type { DateRange } from 'react-day-picker';
import {
  Plus,
  Download,
  Search,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Loader2,
  Receipt,
  AlertCircle,
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
  DateRangePicker,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import transactionService from '@/api/services/transactionService';
import branchService from '@/api/services/branchService';
import { useUserInfo } from '@/store/userStore';
import { TransactionType } from '@/types/enum';
import { getPaymentMethodLabel, getPaymentMethodOptions } from '@/components/shared/PaymentMethodSelect';

// ============================================
// HELPERS
// ============================================



function getTransactionTypeLabel(type: TransactionType): string {
  return type === TransactionType.INCOME ? 'إيراد' : 'مصروف';
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userInfo = useUserInfo();
  const isAdmin = userInfo?.role === 'ADMIN';

  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      page: String(page),
      limit: String(limit),
    };

    if (search) params.search = search;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter;
    if (isAdmin && branchFilter !== 'all') params.branchId = branchFilter;
    if (dateRange?.from) params.startDate = toInputDate(dateRange.from);
    if (dateRange?.to) params.endDate = toInputDate(dateRange.to);

    return params;
  }, [page, limit, search, typeFilter, paymentMethodFilter, branchFilter, dateRange, isAdmin]);

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: () => transactionService.getAll(queryParams),
  });

  // Fetch branches (admin only)
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllActive(),
    enabled: isAdmin,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      deleteMutation.mutate(id);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setPaymentMethodFilter('all');
    setBranchFilter('all');
    setDateRange(undefined);
    setPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters =
    search ||
    typeFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    branchFilter !== 'all' ||
    dateRange?.from;

  // Handle page size change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/transactions/create/income')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة إيراد
          </Button>
          <Button variant="outline" onClick={() => navigate('/transactions/create/expense')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مصروف
          </Button>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير
        </Button>
      </div>

      {/* Filters Card */}
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
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'إخفاء' : 'إظهار'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn('space-y-4', !showFilters && 'hidden sm:block')}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالوصف، الفئة، الملاحظات..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">نوع المعاملة</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>إيراد</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>مصروف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">طريقة الدفع</label>
              <Select
                value={paymentMethodFilter}
                onValueChange={(value) => {
                  setPaymentMethodFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {getPaymentMethodOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter (Admin only) */}
            {isAdmin && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">الفرع</label>
                <Select
                  value={branchFilter}
                  onValueChange={(value) => {
                    setBranchFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="كل الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفروع</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">نطاق التاريخ</label>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
                placeholder="اختر التاريخ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : transactionsData?.data && transactionsData.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    {isAdmin && <TableHead>الفرع</TableHead>}
                    <TableHead className="w-[100px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData.data.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            transaction.type === TransactionType.INCOME
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.employeeVendorName || transaction.notes || '-'}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-semibold',
                            transaction.type === TransactionType.INCOME
                              ? 'text-secondary'
                              : 'text-destructive'
                          )}
                        >
                          {transaction.type === TransactionType.INCOME ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-muted-foreground">
                          {transaction.branch?.name || '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/transactions/${transaction.id}`)}
                            title="عرض"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={deleteMutation.isPending}
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

              {/* Pagination */}
              {transactionsData.meta && (
                <div className="border-t border-border px-4">
                  <Pagination
                    page={transactionsData.meta.page}
                    totalPages={transactionsData.meta.totalPages}
                    total={transactionsData.meta.total}
                    limit={transactionsData.meta.limit}
                    onPageChange={setPage}
                    onLimitChange={handleLimitChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد معاملات</p>
              {hasActiveFilters && (
                <Button variant="link" className="mt-2" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
