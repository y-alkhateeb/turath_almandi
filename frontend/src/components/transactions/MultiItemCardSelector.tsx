/**
 * MultiItemCardSelector Component
 * Card-based inventory item selection for multi-item transactions
 *
 * Features:
 * - Card/grid based item selection (replaces dropdowns)
 * - Search and filter by item name
 * - Visual stock level indicators
 * - Quantity and price inputs per item
 * - Item-level discount support
 * - Real-time stock validation
 * - Responsive grid layout
 */

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import type { TransactionItemDto, InventoryItem } from '#/entity';
import { useQuery } from '@tanstack/react-query';
import inventoryService from '@/api/services/inventoryService';

// ============================================
// TYPES
// ============================================

interface SelectedItem extends TransactionItemDto {
  inventoryItem?: InventoryItem; // For displaying item details
}

interface MultiItemCardSelectorProps {
  branchId: string;
  operationType: 'PURCHASE' | 'CONSUMPTION';
  selectedItems: TransactionItemDto[];
  onItemsChange: (items: TransactionItemDto[]) => void;
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export default function MultiItemCardSelector({
  branchId,
  operationType,
  selectedItems,
  onItemsChange,
  disabled = false,
}: MultiItemCardSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ['inventory', 'list', branchId],
    queryFn: () => inventoryService.getAll({ branchId, limit: 1000 }),
    enabled: !!branchId,
  });

  const inventoryItems = inventoryResponse?.data || [];

  // ============================================
  // SEARCH FILTERING
  // ============================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;

    const query = searchQuery.toLowerCase().trim();
    return inventoryItems.filter((item) =>
      item.itemName.toLowerCase().includes(query)
    );
  }, [inventoryItems, searchQuery]);

  // ============================================
  // SELECTED ITEMS MANAGEMENT
  // ============================================

  const selectedItemsMap = useMemo(() => {
    const map = new Map<string, SelectedItem>();
    selectedItems.forEach((item) => {
      const inventoryItem = inventoryItems.find((i) => i.id === item.inventoryItemId);
      map.set(item.inventoryItemId, {
        ...item,
        inventoryItem,
      });
    });
    return map;
  }, [selectedItems, inventoryItems]);

  // ============================================
  // ITEM SELECTION HANDLERS
  // ============================================

  const handleItemClick = (item: InventoryItem) => {
    if (disabled) return;

    // Toggle selection
    if (selectedItemsMap.has(item.id)) {
      // Remove item
      const newItems = selectedItems.filter((i) => i.inventoryItemId !== item.id);
      onItemsChange(newItems);
      setEditingItemId(null);
    } else {
      // Add item with default values
      const newItem: TransactionItemDto = {
        inventoryItemId: item.id,
        quantity: 1,
        unitPrice: item.unitPrice,
        operationType,
        discountType: undefined,
        discountValue: undefined,
      };
      onItemsChange([...selectedItems, newItem]);
      setEditingItemId(item.id); // Auto-expand for editing
    }
  };

  const handleItemUpdate = (itemId: string, updates: Partial<TransactionItemDto>) => {
    const newItems = selectedItems.map((item) =>
      item.inventoryItemId === itemId ? { ...item, ...updates } : item
    );
    onItemsChange(newItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = selectedItems.filter((i) => i.inventoryItemId !== itemId);
    onItemsChange(newItems);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  // ============================================
  // STOCK VALIDATION
  // ============================================

  const getStockStatus = (item: InventoryItem, selectedQuantity?: number) => {
    const quantity = selectedQuantity || 0;

    if (operationType === 'PURCHASE') {
      return { valid: true, message: '' };
    }

    // CONSUMPTION validation
    if (quantity > item.quantity) {
      return {
        valid: false,
        message: `الكمية المتوفرة: ${item.quantity}`,
      };
    }

    if (item.quantity === 0) {
      return {
        valid: false,
        message: 'غير متوفر',
      };
    }

    if (item.quantity < 10) {
      return {
        valid: true,
        message: `متبقي ${item.quantity} فقط`,
      };
    }

    return { valid: true, message: '' };
  };

  // ============================================
  // CALCULATIONS
  // ============================================

  const calculateItemTotal = (item: SelectedItem): number => {
    const subtotal = item.quantity * item.unitPrice;

    if (!item.discountType || !item.discountValue) {
      return subtotal;
    }

    if (item.discountType === 'PERCENTAGE') {
      return subtotal - (subtotal * item.discountValue) / 100;
    }

    return subtotal - item.discountValue;
  };

  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const selectedItem = selectedItemsMap.get(item.inventoryItemId);
      return sum + (selectedItem ? calculateItemTotal(selectedItem) : 0);
    }, 0);
  }, [selectedItems, selectedItemsMap]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Icon
          icon="solar:magnifer-linear"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-5 h-5"
        />
        <Input
          type="text"
          placeholder="ابحث عن صنف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pr-10"
        />
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:bag-2-bold-duotone" className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-[var(--text-primary)]">
                  الأصناف المحددة ({selectedItems.length})
                </span>
              </div>
              <div className="text-lg font-bold text-primary-600">
                {totalAmount.toFixed(2)} د.ع
              </div>
            </div>

            <div className="space-y-2">
              {Array.from(selectedItemsMap.values()).map((item) => (
                <SelectedItemRow
                  key={item.inventoryItemId}
                  item={item}
                  isEditing={editingItemId === item.inventoryItemId}
                  onToggleEdit={(id) =>
                    setEditingItemId(editingItemId === id ? null : id)
                  }
                  onUpdate={handleItemUpdate}
                  onRemove={handleRemoveItem}
                  operationType={operationType}
                  disabled={disabled}
                  getStockStatus={getStockStatus}
                  calculateTotal={calculateItemTotal}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Items Grid */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          الأصناف المتاحة
        </h4>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              icon="solar:box-minimalistic-bold-duotone"
              className="w-16 h-16 mx-auto text-gray-300 mb-3"
            />
            <p className="text-[var(--text-secondary)]">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد أصناف متاحة'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItemsMap.has(item.id);
              const stockStatus = getStockStatus(item);

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    isSelected && 'ring-2 ring-primary-500 bg-primary-50',
                    !stockStatus.valid && operationType === 'CONSUMPTION' && 'opacity-50',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-[var(--text-primary)] flex-1">
                        {item.itemName}
                      </h5>
                      {isSelected && (
                        <Icon
                          icon="solar:check-circle-bold"
                          className="w-5 h-5 text-primary-600 flex-shrink-0"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.quantity > 10 ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          <Icon icon="solar:box-bold" className="w-3 h-3 ml-1" />
                          {item.quantity}
                        </Badge>
                        {stockStatus.message && (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {stockStatus.message}
                          </span>
                        )}
                      </div>

                      <span className="font-semibold text-primary-600">
                        {item.unitPrice.toFixed(2)} د.ع
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SELECTED ITEM ROW COMPONENT
// ============================================

interface SelectedItemRowProps {
  item: SelectedItem;
  isEditing: boolean;
  onToggleEdit: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TransactionItemDto>) => void;
  onRemove: (id: string) => void;
  operationType: 'PURCHASE' | 'CONSUMPTION';
  disabled: boolean;
  getStockStatus: (item: InventoryItem, quantity?: number) => { valid: boolean; message: string };
  calculateTotal: (item: SelectedItem) => number;
}

function SelectedItemRow({
  item,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
  operationType,
  disabled,
  getStockStatus,
  calculateTotal,
}: SelectedItemRowProps) {
  const stockStatus = item.inventoryItem
    ? getStockStatus(item.inventoryItem, item.quantity)
    : { valid: true, message: '' };

  const itemTotal = calculateTotal(item);

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      {/* Item Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h6 className="font-semibold text-[var(--text-primary)]">
            {item.inventoryItem?.itemName || 'Unknown Item'}
          </h6>
          {!stockStatus.valid && (
            <p className="text-xs text-red-600">{stockStatus.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleEdit(item.inventoryItemId)}
            disabled={disabled}
          >
            <Icon
              icon={isEditing ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
              className="w-4 h-4"
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.inventoryItemId)}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            <Icon icon="solar:trash-bin-minimalistic-bold" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Summary (when collapsed) */}
      {!isEditing && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            {item.quantity} × {item.unitPrice.toFixed(2)} د.ع
          </span>
          <span className="font-semibold text-primary-600">
            {itemTotal.toFixed(2)} د.ع
          </span>
        </div>
      )}

      {/* Editing Fields (when expanded) */}
      {isEditing && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          {/* Quantity */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">
              الكمية
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={item.quantity}
              onChange={(e) =>
                onUpdate(item.inventoryItemId, {
                  quantity: parseFloat(e.target.value) || 0,
                })
              }
              disabled={disabled}
              className={cn(!stockStatus.valid && 'border-red-500')}
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">
              السعر
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) =>
                onUpdate(item.inventoryItemId, {
                  unitPrice: parseFloat(e.target.value) || 0,
                })
              }
              disabled={disabled}
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">
              نوع الخصم
            </label>
            <select
              value={item.discountType || ''}
              onChange={(e) =>
                onUpdate(item.inventoryItemId, {
                  discountType: e.target.value ? (e.target.value as 'PERCENTAGE' | 'FIXED') : undefined,
                  discountValue: e.target.value ? item.discountValue : undefined,
                })
              }
              disabled={disabled}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">بدون خصم</option>
              <option value="PERCENTAGE">نسبة مئوية</option>
              <option value="FIXED">مبلغ ثابت</option>
            </select>
          </div>

          {/* Discount Value */}
          {item.discountType && (
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                قيمة الخصم {item.discountType === 'PERCENTAGE' ? '(%)' : '(د.ع)'}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.discountValue || 0}
                onChange={(e) =>
                  onUpdate(item.inventoryItemId, {
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={disabled}
              />
            </div>
          )}

          {/* Total */}
          <div className="col-span-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">المجموع:</span>
              <span className="text-lg font-bold text-primary-600">
                {itemTotal.toFixed(2)} د.ع
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
