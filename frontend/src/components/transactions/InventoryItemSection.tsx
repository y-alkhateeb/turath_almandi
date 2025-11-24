/**
 * InventoryItemSection Component
 * Section for selecting a single inventory item with purchase/consumption operation
 * Auto-calculates total amount based on quantity × unit price
 */

import { useState, useEffect } from 'react';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormInput } from '@/components/form/FormInput';
import type { SingleInventoryItem } from '@/types/inventoryOperation.types';
import type { InventoryItem } from '@/types/inventory.types';
import inventoryService from '@/api/services/inventoryService';
import { CurrencyAmountCompact } from '@/components/currency';

interface InventoryItemSectionProps {
  branchId: string | null;
  operationType: 'PURCHASE' | 'CONSUMPTION'; // Passed from parent based on transaction type
  selectedItem: SingleInventoryItem | null;
  onItemChange: (item: SingleInventoryItem | null) => void;
  onTotalChange: (total: number) => void; // Callback for auto-calculated total
  disabled?: boolean;
}

interface InventoryItemWithDetails extends InventoryItem {
  availableQuantity: number;
}

export const InventoryItemSection: React.FC<InventoryItemSectionProps> = ({
  branchId,
  operationType,
  selectedItem,
  onItemChange,
  onTotalChange,
  disabled = false,
}) => {
  const [availableItems, setAvailableItems] = useState<InventoryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<string>(selectedItem?.quantity.toString() || '');
  const [unitPrice, setUnitPrice] = useState<string>(selectedItem?.unitPrice.toString() || '');

  // Fetch available inventory items for selected branch
  useEffect(() => {
    if (!branchId) {
      setAvailableItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await inventoryService.getAll({ branchId });
        const itemsWithQuantity = response.data.map((item) => ({
          ...item,
          availableQuantity: Number(item.quantity),
        }));
        setAvailableItems(itemsWithQuantity);
      } catch (error) {
        console.error('Failed to fetch inventory items:', error);
        setAvailableItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [branchId]);

  // Auto-calculate total when quantity or unit price changes
  useEffect(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const total = qty * price;
    onTotalChange(total);
  }, [quantity, unitPrice, onTotalChange]);

  // Update unit price when operationType changes and item is selected
  // Unit price is always readonly and fetched from inventory
  useEffect(() => {
    if (selectedItem) {
      // Find the item in available items to get fresh cost per unit
      const item = availableItems.find((i) => i.id === selectedItem.itemId);
      if (item) {
        const costPerUnit = Number(item.costPerUnit) || 0;
        setUnitPrice(costPerUnit.toFixed(2));

        // Update selected item with new unit price
        const newItem: SingleInventoryItem = {
          ...selectedItem,
          unitPrice: costPerUnit,
        };
        onItemChange(newItem);
      }
    }
  }, [operationType]); // Only depend on operationType

  // When item is selected, auto-fill unit price from inventory (for both PURCHASE and CONSUMPTION)
  const handleItemSelect = (itemId: string) => {
    if (!itemId) {
      onItemChange(null);
      setQuantity('');
      setUnitPrice('');
      return;
    }

    const item = availableItems.find((i) => i.id === itemId);
    if (!item) return;

    // Always set unit price from inventory (readonly for both operations)
    const costPerUnit = Number(item.costPerUnit) || 0;
    setUnitPrice(costPerUnit.toFixed(2));

    // Update selected item
    const newItem: SingleInventoryItem = {
      itemId: item.id,
      itemName: item.name,
      quantity: Number(quantity) || 0,
      unitPrice: costPerUnit,
      unit: item.unit,
    };

    onItemChange(newItem);
  };

  // Handle quantity change
  const handleQuantityChange = (value: string) => {
    setQuantity(value);

    if (selectedItem) {
      const newItem: SingleInventoryItem = {
        ...selectedItem,
        quantity: Number(value) || 0,
      };
      onItemChange(newItem);
    }
  };

  // Handle unit price change (for PURCHASE only)
  const handleUnitPriceChange = (value: string) => {
    setUnitPrice(value);

    if (selectedItem) {
      const newItem: SingleInventoryItem = {
        ...selectedItem,
        unitPrice: Number(value) || 0,
      };
      onItemChange(newItem);
    }
  };

  const inventoryOptions: SelectOption[] = availableItems.map((item) => ({
    label: `${item.name} (متوفر: ${item.availableQuantity} ${item.unit})`,
    value: item.id,
  }));

  // Calculate total for display
  const calculatedTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  // Get max quantity for CONSUMPTION
  const getMaxQuantity = () => {
    if (operationType === 'CONSUMPTION' && selectedItem) {
      const item = availableItems.find((i) => i.id === selectedItem.itemId);
      return item ? item.availableQuantity : undefined;
    }
    return undefined;
  };

  if (!branchId) {
    return (
      <div className="p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
        <p className="text-[var(--text-secondary)] text-center">الرجاء اختيار الفرع أولاً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">صنف المخزون</h3>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          operationType === 'PURCHASE'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
        }`}>
          {operationType === 'PURCHASE' ? '📦 شراء وإضافة' : '📤 صرف واستهلاك'}
        </span>
      </div>

      {loading ? (
        <p className="text-[var(--text-secondary)]">جاري تحميل المخزون...</p>
      ) : availableItems.length === 0 ? (
        <p className="text-[var(--text-secondary)]">لا توجد أصناف متوفرة في هذا الفرع</p>
      ) : (
        <div className="space-y-4">
          {/* Item Selection */}
          <FormSelect
            label="الصنف"
            options={inventoryOptions}
            value={selectedItem?.itemId || ''}
            onChange={(e) => handleItemSelect(e.target.value)}
            placeholder="اختر صنفاً"
            required
            disabled={disabled}
          />

          {selectedItem && (
            <>
              {/* Quantity Input */}
              <div>
                <FormInput
                  label="الكمية"
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="أدخل الكمية"
                  min="0.001"
                  step="0.001"
                  max={getMaxQuantity()}
                  required
                  disabled={disabled}
                />
                {selectedItem.unit && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    الوحدة: {selectedItem.unit}
                  </p>
                )}
              </div>

              {/* Unit Price Input - Always readonly */}
              <div>
                <FormInput
                  label="سعر الوحدة"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  placeholder="سعر الوحدة"
                  min="0.01"
                  step="0.01"
                  required
                  disabled={true}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  يتم جلب السعر تلقائياً من المخزون
                </p>
              </div>

              {/* Calculated Total Display */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    المبلغ الإجمالي المحسوب:
                  </span>
                  <CurrencyAmountCompact
                    amount={calculatedTotal}
                    decimals={2}
                    className="text-lg font-bold text-amber-800 dark:text-amber-400"
                  />
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {quantity || '0'} {selectedItem.unit} × {unitPrice || '0'} = {calculatedTotal.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
