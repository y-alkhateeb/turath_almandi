import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Shield,
  UserCog,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
  RotateCcw,
  Building2,
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
import { useUsers, useDeleteUser } from '@/hooks/api/useUsers';
import { useBranches } from '@/hooks/api/useBranches';
import { useAuth } from '@/hooks/api/useAuth';
import { formatDate } from '@/utils/format';
import { UserRole } from '#/enum';
import type { UserWithBranch } from '#/entity';
import userService from '@/api/services/userService';
import { toast } from 'sonner';

import { UserForm } from './components/UserForm';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithBranch | undefined>(undefined);

  // Queries
  const { data: users = [], isLoading, error } = useUsers();
  const { data: branches = [] } = useBranches({ enabled: true });
  const deleteMutation = useDeleteUser();

  // Filter users client-side
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((user) => user.username.toLowerCase().includes(searchLower));
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => !user.isDeleted);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((user) => user.isDeleted);
    }

    return filtered;
  }, [users, search, roleFilter, statusFilter]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === UserRole.ADMIN).length;
    const accountants = users.filter((u) => u.role === UserRole.ACCOUNTANT).length;
    const active = users.filter((u) => !u.isDeleted).length;
    const inactive = total - active;
    return { total, admins, accountants, active, inactive };
  }, [users]);

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (user: UserWithBranch) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setUserToEdit(undefined);
    setIsFormOpen(true);
  };

  const handleReactivate = async (id: string) => {
    try {
      await userService.reactivate(id);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تفعيل المستخدم بنجاح');
    } catch {
      // Error handled by global interceptor
    }
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all';

  // Helper for role badge
  const getRoleBadge = (role: UserRole) => {
    return role === UserRole.ADMIN ? (
      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
        مدير
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
        محاسب
      </Badge>
    );
  };

  // Helper for status badge
  const getStatusBadge = (isDeleted: boolean) => {
    return !isDeleted ? (
      <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
        نشط
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
        غير نشط
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المستخدمين</h1>
          <p className="text-muted-foreground">إدارة مستخدمي النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">جميع المستخدمين المسجلين</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديرين</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.admins}</div>
            <p className="text-xs text-muted-foreground">مديرين</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المحاسبين</CardTitle>
            <UserCog className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.accountants}</div>
            <p className="text-xs text-muted-foreground">محاسبين</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active}</div>
            <p className="text-xs text-muted-foreground">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين غير النشطين</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.inactive}</div>
            <p className="text-xs text-muted-foreground">غير نشط</p>
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
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم المستخدم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value={UserRole.ADMIN}>مدير</SelectItem>
                <SelectItem value={UserRole.ACCOUNTANT}>محاسب</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="w-[150px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.branch ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {user.branch.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.isDeleted)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.isDeleted ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReactivate(user.id)}
                            title="تفعيل"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(user)}
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(user.id)}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين'}
              </p>
              {!hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مستخدم جديد
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <UserForm open={isFormOpen} onOpenChange={setIsFormOpen} userToEdit={userToEdit} branches={branches} />
    </div>
  );
}

