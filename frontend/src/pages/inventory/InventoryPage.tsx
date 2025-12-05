import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserInfo } from '@/store/userStore';
import { UserRole } from '@/types/enum';
import inventoryService from '@/api/services/inventoryService';
import { useBranchList } from '@/hooks/api/useBranches';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput, RecordConsumptionInput, ConsumptionHistoryItem } from '@/types/entity';

import InventoryStats from './components/InventoryStats';
import InventoryFilters, { type InventoryFiltersState } from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import InventoryCard from './components/InventoryCard';
import AddEditItemDialog from './components/AddEditItemDialog';
import RecordConsumptionDialog from './components/RecordConsumptionDialog';
import ConsumptionHistoryDialog from './components/ConsumptionHistoryDialog';

const LOW_STOCK_THRESHOLD = 10;

const initialFilters: InventoryFiltersState = {
  search: '',
  unit: 'all',
  branchId: 'all',
  stockStatus: 'all',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const user = useUserInfo();
  const isAdmin = user?.role === UserRole.ADMIN;

  // Filters
  const [filters, setFilters] = useState<InventoryFiltersState>(initialFilters);

  // Dialogs
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [consumptionItem, setConsumptionItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  // Error states
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};

    if (filters.search) params.search = filters.search;
    if (filters.unit !== 'all') params.unit = filters.unit;
    if (filters.branchId !== 'all') params.branchId = filters.branchId;

    return params;
  }, [filters]);

  // Fetch inventory items
  const {
    data: inventoryItems = [],
    isLoading: isLoadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: () => inventoryService.getAll(queryParams),
  });

  // Fetch branches for admin
  const { data: branches = [] } = useBranchList({ enabled: isAdmin });

  // Filter items by stock status (client-side)
  const filteredItems = useMemo(() => {
    let items = inventoryItems;

    if (filters.stockStatus !== 'all') {
      items = items.filter((item) => {
        switch (filters.stockStatus) {
          case 'available':
            return item.quantity > 0;
          case 'low':
            return item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD;
          case 'out':
            return item.quantity === 0;
          default:
            return true;
        }
      });
    }

    return items;
  }, [inventoryItems, filters.stockStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const items = inventoryItems;
    return {
      total: items.length,
      available: items.filter((i) => i.quantity > 0).length,
      low: items.filter((i) => i.quantity > 0 && i.quantity < LOW_STOCK_THRESHOLD).length,
      outOfStock: items.filter((i) => i.quantity === 0).length,
    };
  }, [inventoryItems]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryInput) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم إضافة الصنف بنجاح');
      setIsAddEditDialogOpen(false);
      setDialogError(null);
    },
    onError: (error: Error) => {
      setDialogError(error.message || 'حدث خطأ أثناء إضافة الصنف');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryInput }) =>
      inventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم تحديث الصنف بنجاح');
      setIsAddEditDialogOpen(false);
      setEditingItem(null);
      setDialogError(null);
    },
    onError: (error: Error) => {
      setDialogError(error.message || 'حدث خطأ أثناء تحديث الصنف');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم حذف الصنف بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الصنف');
    },
  });

  // Consumption
  const [consumptionError, setConsumptionError] = useState<string | null>(null);

  const consumptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordConsumptionInput }) =>
      inventoryService.recordConsumption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم تسجيل الاستهلاك بنجاح');
      setConsumptionItem(null);
      setConsumptionError(null);
    },
    onError: (error: Error) => {
      setConsumptionError(error.message || 'حدث خطأ أثناء تسجيل الاستهلاك');
    },
  });

  // Consumption history
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchConsumptionHistory = useCallback(
    async (startDate?: string, endDate?: string) => {
      if (!historyItem) return;

      setIsLoadingHistory(true);
      try {
        const data = await inventoryService.getConsumptionHistory(
          historyItem.id,
          startDate,
          endDate
        );
        setConsumptionHistory(data);
      } catch {
        toast.error('حدث خطأ أثناء تحميل السجل');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [historyItem]
  );

  const navigate = useNavigate();

  const handleFilterChange = (newFilters: InventoryFiltersState) => {
    setFilters(newFilters);
  };

  const handleAddItem = () => {
    navigate('/inventory/create');
  };

  const handleEditItem = (item: InventoryItem) => {
    navigate(`/inventory/${item.id}/edit`);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    deleteMutation.mutate(item.id);
  };

  const handleSaveItem = (data: CreateInventoryInput | UpdateInventoryInput, isEdit: boolean) => {
    if (isEdit && editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: data as UpdateInventoryInput });
    } else {
      createMutation.mutate(data as CreateInventoryInput);
    }
  };

  const handleRecordConsumption = (item: InventoryItem) => {
    setConsumptionItem(item);
    setConsumptionError(null);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setHistoryItem(item);
    setConsumptionHistory([]);
  };

  const handleSubmitConsumption = (data: RecordConsumptionInput) => {
    if (consumptionItem) {
      consumptionMutation.mutate({ id: consumptionItem.id, data });
    }
  };

  // Error state
  if (inventoryError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">حدث خطأ أثناء تحميل المخزون</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">المخزون</h1>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة صنف جديد
        </Button>
      </div>

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        branches={branches}
        isAdmin={isAdmin}
        isLoading={isLoadingInventory}
      />

      {/* Stats */}
      <InventoryStats
        totalItems={stats.total}
        availableItems={stats.available}
        lowStockItems={stats.low}
        outOfStockItems={stats.outOfStock}
        isLoading={isLoadingInventory}
      />

      {/* Table (Desktop) */}
      <div className="hidden md:block">
        <InventoryTable
          items={filteredItems}
          isLoading={isLoadingInventory}
          isAdmin={isAdmin}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onRecordConsumption={handleRecordConsumption}
          onViewHistory={handleViewHistory}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {isLoadingInventory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد أصناف
          </div>
        ) : (
          filteredItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onRecordConsumption={handleRecordConsumption}
              onViewHistory={handleViewHistory}
            />
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddEditItemDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        item={editingItem}
        isAdmin={isAdmin}
        userBranchId={user?.branchId || null}
        onSave={handleSaveItem}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={dialogError}
      />

      {/* Sub-Units Dialog */}
      {/* Record Consumption Dialog */}
      <RecordConsumptionDialog
        open={!!consumptionItem}
        onOpenChange={(open) => !open && setConsumptionItem(null)}
        item={consumptionItem}
        onSubmit={handleSubmitConsumption}
        isSaving={consumptionMutation.isPending}
        error={consumptionError}
      />

      {/* Consumption History Dialog */}
      <ConsumptionHistoryDialog
        open={!!historyItem}
        onOpenChange={(open) => !open && setHistoryItem(null)}
        item={historyItem}
        history={consumptionHistory}
        isLoading={isLoadingHistory}
        onFetchHistory={fetchConsumptionHistory}
      />
    </div>
  );
}
