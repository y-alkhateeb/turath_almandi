/**
 * useContacts Hooks
 * React Query hooks for contact management (customers and suppliers)
 *
 * Features:
 * - Paginated contacts query with comprehensive filters
 * - Create/Update/Delete/Reactivate mutations with optimistic updates
 * - Auto-invalidation of contacts cache
 * - Filter state management hook
 * - Arabic toast messages
 * - Full error handling and strict typing
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import contactService from '@/api/services/contactService';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAuth } from './useAuth';
import type { Contact, ContactsSummary, CreateContactDto as CreateContactInput, UpdateContactDto as UpdateContactInput } from '#/contacts.types';
import type { PaginatedResponse, ContactQueryFilters } from '#/api';
import { ApiError } from '@/api/apiClient';
import { ContactType } from '#/enum';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useContacts Hook
 * Query paginated contacts with filters
 * Auto-filters for accountants to show only their branch's contacts
 *
 * @param filters - Optional ContactQueryFilters (type, branchId, page, limit)
 * @returns Query result with paginated contacts
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useContacts({
 *   type: 'SUPPLIER',
 *   page: 1,
 *   limit: 20,
 * });
 * const contacts = data?.data || [];
 * const totalPages = data?.meta.totalPages || 0;
 * ```
 */
export const useContacts = (filters?: ContactQueryFilters) => {
  const { user, isAccountant } = useAuth();

  // Auto-filter accountants to their branch
  const appliedFilters: ContactQueryFilters = {
    ...filters,
    branchId: isAccountant && user?.branchId ? user.branchId : filters?.branchId,
  };

  return useQuery<PaginatedResponse<Contact>, ApiError>({
    queryKey: queryKeys.contacts.list(appliedFilters),
    queryFn: () => contactService.getAll(appliedFilters),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

/**
 * useContact Hook
 * Query single contact by ID
 *
 * @param id - Contact UUID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with contact data
 *
 * @example
 * ```tsx
 * const { data: contact, isLoading } = useContact(contactId);
 * if (contact) {
 *   console.log(contact.name, contact.type);
 * }
 * ```
 */
export const useContact = (
  id: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery<Contact, ApiError>({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => contactService.getById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: options?.enabled ?? !!id,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateContact Hook
 * Mutation to create new contact with optimistic update
 * Invalidates contacts cache
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const createContact = useCreateContact();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createContact.mutateAsync({
 *       name: 'محمد علي',
 *       type: 'SUPPLIER',
 *       phone: '+964 770 123 4567',
 *     });
 *   } catch (error) {
 *     // Error already handled with toast
 *   }
 * };
 * ```
 */
export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Contact,
    ApiError,
    CreateContactInput,
    { previousContacts?: [any, PaginatedResponse<Contact> | undefined][] }
  >({
    mutationFn: contactService.create,

    // Optimistic update
    onMutate: async (newContact) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });

      // Snapshot current data
      const previousContacts = queryClient.getQueriesData<PaginatedResponse<Contact>>({
        queryKey: queryKeys.contacts.all,
      });

      // Optimistically update all contact lists
      queryClient.setQueriesData<PaginatedResponse<Contact>>(
        { queryKey: queryKeys.contacts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          // Create temporary contact with optimistic ID
          const tempContact: Contact = {
            id: `temp-${Date.now()}`,
            name: newContact.name,
            type: newContact.type,
            phone: newContact.phone || null,
            email: newContact.email || null,
            address: newContact.address || null,
            creditLimit: newContact.creditLimit || null,
            notes: newContact.notes || null,
            branchId: newContact.branchId || null,
            createdBy: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            deletedBy: null,
            isDeleted: false,
          };

          return {
            ...old,
            data: [tempContact, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousContacts };
    },

    onError: (_err, _newContact, context) => {
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },   // Note: Error toast shown by global API interceptor

    onSuccess: (_data, variables) => {
      // Invalidate contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });

      // Show success toast
      const typeLabel = variables.type === 'SUPPLIER' ? 'مورد' : 'عميل';
      toast.success(`تم إضافة ${typeLabel} "${variables.name}" بنجاح`);
    },
  });
};

/**
 * useUpdateContact Hook
 * Mutation to update existing contact with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const updateContact = useUpdateContact();
 *
 * const handleUpdate = async () => {
 *   await updateContact.mutateAsync({
 *     id: contactId,
 *     data: { phone: '+964 770 999 8888' },
 *   });
 * };
 * ```
 */
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Contact,
    ApiError,
    { id: string; data: UpdateContactInput },
    { previousContacts?: [any, PaginatedResponse<Contact> | undefined][]; previousContact?: Contact }
  >({
    mutationFn: ({ id, data }) => contactService.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.detail(id) });

      // Snapshot current data
      const previousContact = queryClient.getQueryData<Contact>(queryKeys.contacts.detail(id));
      const previousContacts = queryClient.getQueriesData<PaginatedResponse<Contact>>({
        queryKey: queryKeys.contacts.all,
      });

      // Optimistically update contact detail
      queryClient.setQueryData<Contact>(queryKeys.contacts.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Optimistically update contact in all lists
      queryClient.setQueriesData<PaginatedResponse<Contact>>(
        { queryKey: queryKeys.contacts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.map((contact) =>
              contact.id === id ? { ...contact, ...data, updatedAt: new Date().toISOString() } : contact
            ),
          };
        }
      );

      return { previousContact, previousContacts };
    },

    onError: (_err, _newContact, context) => {
      if (context?.previousContact) {
        queryClient.setQueryData(
          queryKeys.contacts.detail(context.previousContact.id),
          context.previousContact
        );
      }
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },   // Note: Error toast shown by global API interceptor

    onSuccess: (updatedContact) => {
      // Invalidate contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.detail(updatedContact.id),
      });

      // Show success toast
      toast.success('تم تحديث جهة الاتصال بنجاح');
    },
  });
};

/**
 * useDeleteContact Hook
 * Mutation to delete (soft delete) contact with optimistic update
 *
 * @returns Mutation object with mutate/mutateAsync
 *
 * @example
 * ```tsx
 * const deleteContact = useDeleteContact();
 *
 * const handleDelete = async () => {
 *   if (confirm('هل أنت متأكد من حذف هذه جهة الاتصال؟')) {
 *     await deleteContact.mutateAsync(contactId);
 *   }
 * };
 * ```
 */
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    string,
    { previousContacts?: [any, PaginatedResponse<Contact> | undefined][]; previousContact?: Contact }
  >({
    mutationFn: contactService.remove,

    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });

      // Snapshot current data
      const previousContacts = queryClient.getQueriesData<PaginatedResponse<Contact>>({
        queryKey: queryKeys.contacts.all,
      });

      // Optimistically remove contact from all lists
      queryClient.setQueriesData<PaginatedResponse<Contact>>(
        { queryKey: queryKeys.contacts.all },
        (old) => {
          // Only update if we have a valid PaginatedResponse with data array
          if (!old || !old.data || !Array.isArray(old.data)) return old;

          return {
            ...old,
            data: old.data.filter((contact) => contact.id !== deletedId),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove contact detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.contacts.detail(deletedId),
      });

      return { previousContacts };
    },

    onError: (_error, _deletedId, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Note: Error toast shown by global API interceptor
    },

    onSuccess: () => {
      // Invalidate contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });

      // Show success toast
      toast.success('تم حذف جهة الاتصال بنجاح');
    },
  });
};

// Note: useReactivateContact hook removed - reactivate endpoint not implemented in backend

// ============================================
// FILTER MANAGEMENT HOOK
// ============================================

/**
 * useContactFilters Hook
 * Custom hook for managing contact filter state
 *
 * @param initialFilters - Optional initial filter values
 * @returns Filter state and update functions
 *
 * @example
 * ```tsx
 * const {
 *   filters,
 *   setFilters,
 *   setFilter,
 *   resetFilters,
 *   setPage,
 * } = useContactFilters();
 *
 * // Update single filter
 * setFilter('type', 'SUPPLIER');
 *
 * // Update multiple filters
 * setFilters({ type: 'CUSTOMER' });
 *
 * // Change page
 * setPage(2);
 *
 * // Reset all filters
 * resetFilters();
 *
 * // Use filters in query
 * const { data } = useContacts(filters);
 * ```
 */
export const useContactFilters = (initialFilters?: Partial<ContactQueryFilters>) => {
  const [filters, setFiltersState] = useState<ContactQueryFilters>(initialFilters || {});

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: Partial<ContactQueryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter
   */
  const setFilter = useCallback(
    <K extends keyof ContactQueryFilters>(key: K, value: ContactQueryFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters || {});
  }, [initialFilters]);

  /**
   * Set page number
   */
  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Set limit (items per page)
   */
  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit, page: 1 })); // Reset to page 1 when changing limit
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    setPage,
    setLimit,
  };
};

// ============================================
// SUMMARY HOOK
// ============================================

/**
 * useContactsSummary Hook
 * Query contacts summary statistics
 *
 * @param branchId - Optional branch UUID for admins
 * @returns Query result with contacts summary
 *
 * @example
 * ```tsx
 * const { data: summary, isLoading } = useContactsSummary();
 * if (summary) {
 *   console.log(summary.total, summary.byType.suppliers);
 * }
 * ```
 */
export const useContactsSummary = (branchId?: string) => {
  return useQuery<ContactsSummary, ApiError>({
    queryKey: queryKeys.contacts.summary(branchId),
    queryFn: () => contactService.getSummary(branchId),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// HELPER HOOKS
// ============================================

/**
 * useSuppliers Hook
 * Query only suppliers (type = SUPPLIER)
 *
 * @param filters - Optional additional filters
 * @returns Query result with suppliers
 */
export const useSuppliers = (filters?: Omit<ContactQueryFilters, 'type'>) => {
  return useContacts({ ...filters, type: ContactType.SUPPLIER });
};

/**
 * useCustomers Hook
 * Query only customers (type = CUSTOMER)
 *
 * @param filters - Optional additional filters
 * @returns Query result with customers
 */
export const useCustomers = (filters?: Omit<ContactQueryFilters, 'type'>) => {
  return useContacts({ ...filters, type: ContactType.CUSTOMER });
};
