import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  Users,
  Truck,
  User,
  AlertCircle,
  Pencil,
  Trash2,
  Phone,
  Mail,
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
import { useContacts, useContactsSummary, useDeleteContact } from '@/hooks/api/useContacts';
import { ContactType } from '@/types/enum';
import { getContactTypeLabel, getContactTypeOptions } from '@/components/shared/ContactTypeSelect';
import type { Contact } from '@/types/contacts.types';
import { CONTACT_TYPE_BADGE_COLORS } from '@/constants/contact-type-badges';

import { ContactForm } from './components/ContactForm';

export default function ContactsPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | undefined>(undefined);

  // Queries
  const filters = {
    page,
    limit,
    search: search || undefined,
    type: typeFilter !== 'all' ? (typeFilter as ContactType) : undefined,
  };

  const { data: contactsData, isLoading, error } = useContacts(filters);
  const { data: summary } = useContactsSummary();
  const deleteMutation = useDeleteContact();

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (contact: Contact) => {
    setContactToEdit(contact);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setContactToEdit(undefined);
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setPage(1);
  };

  const hasActiveFilters = search || typeFilter !== 'all';

  // Helper for type badge
  const getTypeBadge = (type: ContactType) => {
    switch (type) {
      case ContactType.SUPPLIER:
        return <Badge variant="secondary" className={CONTACT_TYPE_BADGE_COLORS.supplier}>{getContactTypeLabel(type)}</Badge>;
      case ContactType.CUSTOMER:
        return <Badge variant="secondary" className={CONTACT_TYPE_BADGE_COLORS.customer}>{getContactTypeLabel(type)}</Badge>;
      case ContactType.BOTH:
        return <Badge variant="secondary" className={CONTACT_TYPE_BADGE_COLORS.both}>{getContactTypeLabel(type)}</Badge>;
      default:
        return <Badge variant="secondary">{getContactTypeLabel(type)}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">جهات الاتصال</h1>
          <p className="text-muted-foreground">إدارة الموردين والعملاء</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة جهة اتصال
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي جهات الاتصال</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">جميع جهات الاتصال المسجلة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الموردين</CardTitle>
              <Truck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byType.suppliers}</div>
              <p className="text-xs text-muted-foreground">موردين مسجلين</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العملاء</CardTitle>
              <User className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byType.customers}</div>
              <p className="text-xs text-muted-foreground">عملاء مسجلين</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مورد وعميل</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byType.both}</div>
              <p className="text-xs text-muted-foreground">جهات مزدوجة</p>
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
            <div className="relative sm:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الهاتف، البريد..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع جهة الاتصال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {getContactTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : contactsData?.data && contactsData.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead className="w-[100px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsData.data.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{getTypeBadge(contact.type)}</TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {contact.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {contact.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.address || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(contact)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(contact.id)}
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

              {contactsData.meta && (
                <div className="border-t border-border px-4 py-4">
                  <Pagination
                    page={contactsData.meta.page}
                    totalPages={contactsData.meta.totalPages}
                    total={contactsData.meta.total}
                    limit={contactsData.meta.limit}
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
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد جهات اتصال</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة جهة اتصال
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <ContactForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contactToEdit={contactToEdit}
      />
    </div>
  );
}
