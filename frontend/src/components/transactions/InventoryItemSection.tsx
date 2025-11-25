/**
 * InventoryItemSection Component
 * Section for selecting a single inventory item with purchase/consumption operation
 *
 * Features:
 * - PURCHASE (شراء): Unit price is editable
 * - CONSUMPTION (بيع): Unit price is editable with profit display
 * - Shows available quantity prominently
 * - Auto-calculates total amount based on quantity × unit price
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
  operationType: 'PURCHASE' | 'CONSUMPTION';
  selectedItem: SingleInventoryItem | null;
  onItemChange: (item: SingleInventoryItem | null) => void;
  onTotalChange: (total: number) => void;
  disabled?: boolean;
}

interface InventoryItemWithDetails extends InventoryItem {
  availableQuantity: number;
  costPerUnit: number;
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
  const [originalCostPerUnit, setOriginalCostPerUnit] = useState<number>(0);

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
          costPerUnit: Number(item.costPerUnit) || 0,
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

  // When item is selected, auto-fill unit price from inventory
  const handleItemSelect = (itemId: string) => {
    if (!itemId) {
      onItemChange(null);
      setQuantity('');
      setUnitPrice('');
      setOriginalCostPerUnit(0);
      return;
    }

    const item = availableItems.find((i) => i.id === itemId);
    if (!item) return;

    const costPerUnit = item.costPerUnit;
    setOriginalCostPerUnit(costPerUnit);
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

  // Handle unit price change (editable for both PURCHASE and CONSUMPTION)
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

  // Calculate profit for CONSUMPTION (selling)
  const calculateProfit = () => {
    if (operationType !== 'CONSUMPTION') return null;
    const qty = Number(quantity) || 0;
    const sellingPrice = Number(unitPrice) || 0;
    const profitPerUnit = sellingPrice - originalCostPerUnit;
    const totalProfit = profitPerUnit * qty;
    return {
      profitPerUnit,
      totalProfit,
      isProfit: profitPerUnit >= 0,
    };
  };

  const profitInfo = calculateProfit();

  // Get max quantity for CONSUMPTION
  const getMaxQuantity = () => {
    if (operationType === 'CONSUMPTION' && selectedItem) {
      const item = availableItems.find((i) => i.id === selectedItem.itemId);
      return item ? item.availableQuantity : undefined;
    }
    return undefined;
  };

  // Get selected item details for display
  const getSelectedItemDetails = () => {
    if (!selectedItem) return null;
    return availableItems.find((i) => i.id === selectedItem.itemId);
  };

  const selectedItemDetails = getSelectedItemDetails();

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
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        }`}>
          {operationType === 'PURCHASE' ? '📦 شراء وإضافة' : '💰 بيع من المخزون'}
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

          {selectedItem && selectedItemDetails && (
            <>
              {/* Available Quantity Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    الكمية المتوفرة في المخزون:
                  </span>
                  <span className="text-lg font-bold text-blue-800 dark:text-blue-400">
                    {selectedItemDetails.availableQuantity} {selectedItem.unit}
                  </span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <FormInput
                  label={operationType === 'PURCHASE' ? 'الكمية المشتراة' : 'الكمية المباعة'}
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
                {operationType === 'CONSUMPTION' && getMaxQuantity() && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    الحد الأقصى: {getMaxQuantity()} {selectedItem.unit}
                  </p>
                )}
              </div>

              {/* Unit Price Input - Editable for both operations */}
              <div>
                <FormInput
                  label={operationType === 'PURCHASE' ? 'سعر الشراء للوحدة' : 'سعر البيع للوحدة'}
                  type="number"
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  placeholder="أدخل السعر"
                  min="0.01"
                  step="0.01"
                  required
                  disabled={disabled}
                />
                {/* Show original cost per unit for reference */}
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  سعر التكلفة الأصلي: <CurrencyAmountCompact amount={originalCostPerUnit} decimals={2} />
                </p>
              </div>

              {/* Profit Display for CONSUMPTION (selling) */}
              {operationType === 'CONSUMPTION' && profitInfo && Number(quantity) > 0 && (
                <div className={`p-3 rounded-lg border ${
                  profitInfo.isProfit
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    profitInfo.isProfit
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-red-900 dark:text-red-300'
                  }`}>
                    {profitInfo.isProfit ? '📈 الربح المتوقع' : '📉 الخسارة المتوقعة'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">الربح للوحدة:</span>
                      <span className={`mr-2 font-bold ${
                        profitInfo.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        <CurrencyAmountCompact amount={Math.abs(profitInfo.profitPerUnit)} decimals={2} />
                        {!profitInfo.isProfit && ' -'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">إجمالي الربح:</span>
                      <span className={`mr-2 font-bold ${
                        profitInfo.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        <CurrencyAmountCompact amount={Math.abs(profitInfo.totalProfit)} decimals={2} />
                        {!profitInfo.isProfit && ' -'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    ({quantity} × ({unitPrice} - {originalCostPerUnit.toFixed(2)}) = {profitInfo.totalProfit.toFixed(2)})
                  </p>
                </div>
              )}

              {/* Calculated Total Display */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    المبلغ الإجمالي:
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
