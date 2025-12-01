/**
 * Contacts List Page - Container Component
 * Manages contacts (suppliers and customers) with filters and CRUD operations
 *
 * Architecture:
 * - Business logic in hooks (useContacts, useContactFilters)
 * - Presentational components (ContactList, Dialog for ContactForm)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Contacts list with filters (type, branch)
 * - Create/edit contact modals
 * - Branch filter (admin only)
 * - Type filter (supplier/customer/all)
 * - Add contact button
 * - Edit contact dialog
 * - Pagination controls
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useContacts,
  useContactFilters,
  useCreateContact,
  useUpdateContact,
  useContact,
} from '@/hooks/useContacts';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { ContactList } from '@/components/contacts/ContactList';
import { ContactForm } from '@/components/contacts/ContactForm';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import type { CreateContactInput, UpdateContactInput } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function ContactsListPage() {
  const { isAdmin } = useAuth();

  // ============================================
  // DIALOG STATE
  // ============================================

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // ============================================
  // FILTERS & PAGINATION STATE
  // ============================================

  const { filters, setFilter, setPage, resetFilters } = useContactFilters({
    page: 1,
    limit: 20,
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  const {
    data: contactsData,
    isLoading: isLoadingContacts,
    error: contactsError,
    refetch: refetchContacts,
  } = useContacts(filters);

  const { data: branches = [] } = useBranches();

  const { data: selectedContact } = useContact(selectedContactId || '', {
    enabled: !!selectedContactId && isEditDialogOpen,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  // ============================================
  // HANDLERS
  // ============================================

  const handleFiltersChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilter(key as keyof typeof filters, value);
      setPage(1);
    },
    [setFilter, setPage]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage]
  );

  const handleEdit = useCallback((id: string) => {
    setSelectedContactId(id);
    setIsEditDialogOpen(true);
  }, []);

  const handleView = useCallback((id: string) => {
    // For now, open edit dialog. Can create separate view dialog later
    setSelectedContactId(id);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedContactId(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleRetry = useCallback(() => {
    refetchContacts();
  }, [refetchContacts]);

  const handleCreateSubmit = useCallback(
    async (data: CreateContactInput) => {
      await createContact.mutateAsync(data);
      handleCloseCreateDialog();
    },
    [createContact, handleCloseCreateDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (data: UpdateContactInput) => {
      if (!selectedContactId) return;
      await updateContact.mutateAsync({ id: selectedContactId, data });
      handleCloseEditDialog();
    },
    [selectedContactId, updateContact, handleCloseEditDialog]
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const contacts = contactsData?.data || [];
  const currentPage = contactsData?.meta.currentPage || 1;
  const totalPages = contactsData?.meta.totalPages || 0;
  const total = contactsData?.meta.total || 0;

  const hasNoContactsAtAll = !isLoadingContacts && total === 0 && Object.keys(filters).length <= 3;

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoadingContacts && !contactsData) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
        <div className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={10} variant="default" />
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (contactsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة جهات الاتصال</h1>
            <p className="text-[var(--text-secondary)] mt-1">إدارة الموردين والعملاء</p>
          </div>
        </div>
        <ErrorState error={contactsError} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - NO CONTACTS AT ALL
  // ============================================

  if (hasNoContactsAtAll) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة جهات الاتصال</h1>
            <p className="text-[var(--text-secondary)] mt-1">إدارة الموردين والعملاء</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة جهة اتصال
          </button>
        </div>

        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد جهات اتصال مسجلة"
          description="ابدأ بإضافة موردين أو عملاء لإدارة العلاقات التجارية."
          action={{
            label: 'إضافة جهة اتصال جديدة',
            onClick: handleAddNew,
          }}
        />
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة جهات الاتصال</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            إدارة الموردين والعملاء ({total} جهة اتصال)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة جهة اتصال
        </button>
      </div>

      {/* Filters */}
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4"
        dir="rtl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              النوع
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFiltersChange('type', e.target.value || undefined)}
              dir="rtl"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="SUPPLIER">موردين</option>
              <option value="CUSTOMER">عملاء</option>
            </select>
          </div>

          {/* Branch Filter - Admin Only */}
          {isAdmin && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الفرع
              </label>
              <select
                value={filters.branchId || ''}
                onChange={(e) => handleFiltersChange('branchId', e.target.value || undefined)}
                dir="rtl"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">جميع الفروع</option>
                {branches
                  .filter((branch) => !branch.deletedAt)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState
            title="لا توجد نتائج"
            description="لم يتم العثور على جهات اتصال تطابق الفلاتر المحددة. حاول تعديل الفلاتر أو مسحها."
            action={{
              label: 'مسح جميع الفلاتر',
              onClick: () => resetFilters(),
            }}
          />
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            <ContactList
              contacts={contacts}
              isLoading={isLoadingContacts && !!contactsData}
              onEdit={handleEdit}
              onView={handleView}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-sm text-[var(--text-secondary)]">
                عرض الصفحة {currentPage} من {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
                showFirstLast
              />
            </div>
          )}
        </>
      )}

      {/* Create Contact Dialog */}
      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        title="إضافة جهة اتصال جديدة"
        size="large"
      >
        <ContactForm
          mode="create"
          onSubmit={handleCreateSubmit}
          onCancel={handleCloseCreateDialog}
          isSubmitting={createContact.isPending}
        />
      </Dialog>

      {/* Edit Contact Dialog */}
      {selectedContact && (
        <Dialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          title="تعديل جهة الاتصال"
          size="large"
        >
          <ContactForm
            mode="edit"
            initialData={selectedContact}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCloseEditDialog}
            isSubmitting={updateContact.isPending}
          />
        </Dialog>
      )}
    </div>
  );
}
