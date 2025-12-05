import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  Building2,
  MapPin,
  User,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
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
  Badge,
} from '@/components/ui';
import { useBranches, useDeleteBranch } from '@/hooks/api/useBranches';
import { useAuth } from '@/hooks/api/useAuth';
import { formatDate } from '@/utils/format';
import type { Branch } from '#/entity';
import type { BranchQueryFilters } from '#/api';
import { ACTIVITY_STATUS_COLORS } from '@/constants/status-colors';

import { BranchForm } from './components/BranchForm';

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | undefined>(undefined);

  // Build query filters
  const filters: BranchQueryFilters = useMemo(() => {
    const f: BranchQueryFilters = {};

    if (search.trim()) f.search = search;
    if (statusFilter === 'active') f.includeInactive = false;
    else if (statusFilter === 'inactive') f.includeInactive = true;
    else f.includeInactive = isAdmin; // Admins see all by default

    return f;
  }, [search, statusFilter, isAdmin]);

  // Queries
  const { data: branches = [], isLoading, error } = useBranches(filters);
  const deleteMutation = useDeleteBranch();

  // Calculate summary stats from all branches
  const summary = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => !b.isDeleted).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [branches]);

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (branch: Branch) => {
    setBranchToEdit(branch);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setBranchToEdit(undefined);
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const hasActiveFilters = search || statusFilter !== 'all';

  // Helper for status badge
  const getStatusBadge = (isDeleted: boolean) => {
    return !isDeleted ? (
      <Badge variant="secondary" className={ACTIVITY_STATUS_COLORS.active}>
        نشط
      </Badge>
    ) : (
      <Badge variant="secondary" className={ACTIVITY_STATUS_COLORS.inactive}>
        غير نشط
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفروع</h1>
          <p className="text-muted-foreground">إدارة فروع الشركة</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة فرع جديد
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفروع</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">جميع الفروع المسجلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفروع النشطة</CardTitle>
            <Building2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active}</div>
            <p className="text-xs text-muted-foreground">فروع نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفروع غير النشطة</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.inactive}</div>
            <p className="text-xs text-muted-foreground">فروع غير نشطة</p>
          </CardContent>
        </Card>
      </div>

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
            <div className="relative sm:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط فقط</SelectItem>
                <SelectItem value="inactive">غير نشط فقط</SelectItem>
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['branches', 'list'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : branches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>اسم المدير</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {branch.location}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {branch.managerName}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(branch.isDeleted)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(branch.createdAt)}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(branch)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(branch.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'لا توجد نتائج للبحث' : 'لا توجد فروع'}
              </p>
              {isAdmin && !hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فرع جديد
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      {isAdmin && (
        <BranchForm open={isFormOpen} onOpenChange={setIsFormOpen} branchToEdit={branchToEdit} />
      )}
    </div>
  );
}
