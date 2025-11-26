/**
 * InventoryItemSection - قسم اختيار صنف المخزون
 *
 * الميزات:
 * - شراء (PURCHASE): سعر الوحدة قابل للتعديل
 * - استهلاك (CONSUMPTION): سعر الوحدة من المخزون (غير قابل للتعديل)
 */

import { useState, useEffect } from 'react';
import type { InventoryItem } from '@/types/inventory.types';
import inventoryService from '@/api/services/inventoryService';
import { CurrencyAmountCompact } from '@/components/currency';

export interface SelectedInventoryItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface InventoryItemSectionProps {
  branchId: string | null;
  operationType: 'PURCHASE' | 'CONSUMPTION';
  selectedItem: SelectedInventoryItem | null;
  onItemChange: (item: SelectedInventoryItem | null) => void;
  onTotalChange: (total: number) => void;
  disabled?: boolean;
}

interface InventoryItemWithDetails extends InventoryItem {
  availableQuantity: number;
  costPerUnit: number;
}

export function InventoryItemSection({
  branchId,
  operationType,
  selectedItem,
  onItemChange,
  onTotalChange,
  disabled = false,
}: InventoryItemSectionProps) {
  const [availableItems, setAvailableItems] = useState<InventoryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');

  // Fetch inventory items for branch
  useEffect(() => {
    if (!branchId) {
      setAvailableItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await inventoryService.getAll({ branchId });
        const items = response.data.map((item) => ({
          ...item,
          availableQuantity: Number(item.quantity) || 0,
          costPerUnit: Number(item.costPerUnit) || 0,
        }));
        setAvailableItems(items);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        setAvailableItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [branchId]);

  // Reset form when operationType or branchId changes
  useEffect(() => {
    setSelectedItemId('');
    setQuantity('');
    setUnitPrice('');
    onItemChange(null);
    onTotalChange(0);
  }, [operationType, branchId]);

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);

    const item = availableItems.find((i) => i.id === itemId);
    if (!item) {
      setUnitPrice('');
      return;
    }

    // For CONSUMPTION: auto-fill unit price from inventory (readonly)
    if (operationType === 'CONSUMPTION') {
      setUnitPrice(item.costPerUnit.toString());
    } else {
      // For PURCHASE: clear unit price for user input
      setUnitPrice('');
    }
  };

  // Calculate total when quantity or unitPrice changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const total = qty * price;
    onTotalChange(total);

    // Update selected item
    if (selectedItemId && qty > 0 && price > 0) {
      const item = availableItems.find((i) => i.id === selectedItemId);
      if (item) {
        onItemChange({
          itemId: selectedItemId,
          itemName: item.name,
          quantity: qty,
          unitPrice: price,
          unit: item.unit,
        });
      }
    } else {
      onItemChange(null);
    }
  }, [selectedItemId, quantity, unitPrice, availableItems]);

  // Validate quantity for CONSUMPTION
  const getMaxQuantity = (): number | undefined => {
    if (operationType !== 'CONSUMPTION') return undefined;
    const item = availableItems.find((i) => i.id === selectedItemId);
    return item?.availableQuantity;
  };

  const selectedItemDetails = availableItems.find((i) => i.id === selectedItemId);
  const calculatedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  if (!branchId) {
    return (
      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
        <p className="text-[var(--text-secondary)] text-center">الرجاء اختيار الفرع أولاً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {operationType === 'PURCHASE' ? 'شراء وإضافة للمخزون' : 'بيع من المخزون'}
      </h3>

      {loading ? (
        <p className="text-[var(--text-secondary)]">جاري تحميل المخزون...</p>
      ) : availableItems.length === 0 ? (
        <p className="text-[var(--text-secondary)]">لا توجد أصناف في هذا الفرع</p>
      ) : (
        <div className="space-y-4">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              الصنف <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500"
            >
              <option value="">اختر صنفاً</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (متوفر: {item.availableQuantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                الكمية <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.001"
                max={getMaxQuantity()}
                step="0.001"
                placeholder="أدخل الكمية"
                disabled={disabled || !selectedItemId}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              />
              {operationType === 'CONSUMPTION' && selectedItemDetails && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  الحد الأقصى: {selectedItemDetails.availableQuantity} {selectedItemDetails.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                سعر الوحدة <span className="text-red-500">*</span>
                {operationType === 'CONSUMPTION' && (
                  <span className="text-xs text-[var(--text-secondary)] mr-2">(من المخزون)</span>
                )}
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder={operationType === 'PURCHASE' ? 'أدخل سعر الوحدة' : 'سعر الوحدة'}
                disabled={disabled || !selectedItemId || operationType === 'CONSUMPTION'}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:bg-[var(--bg-tertiary)]"
              />
            </div>
          </div>

          {/* Calculated Total */}
          {calculatedTotal > 0 && (
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  المبلغ الإجمالي:
                </span>
                <CurrencyAmountCompact
                  amount={calculatedTotal}
                  decimals={2}
                  className="text-lg font-bold text-[var(--text-primary)]"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {quantity} × {unitPrice} = {calculatedTotal.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
