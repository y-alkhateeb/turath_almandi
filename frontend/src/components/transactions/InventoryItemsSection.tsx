/**
 * InventoryItemsSection Component
 * Section for selecting inventory items with purchase/consumption operations
 */

import { useState, useEffect } from 'react';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormInput } from '@/components/form/FormInput';
import { FormRadioGroup, type RadioOption } from '@/components/form/FormRadioGroup';
import { InventoryOperationType, type InventoryItemOperation } from '@/types/inventoryOperation.types';
import type { InventoryItem } from '@/types/inventory.types';
import inventoryService from '@/api/services/inventoryService';
import { CurrencyAmountCompact } from '@/components/currency';

interface InventoryItemsSectionProps {
  branchId: string | null;
  items: InventoryItemOperation[];
  onItemsChange: (items: InventoryItemOperation[]) => void;
  errors?: Record<string, string>;
}

interface InventoryItemWithDetails extends InventoryItem {
  availableQuantity: number;
}

export const InventoryItemsSection: React.FC<InventoryItemsSectionProps> = ({
  branchId,
  items,
  onItemsChange,
  errors = {},
}) => {
  const [availableItems, setAvailableItems] = useState<InventoryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [operationType, setOperationType] = useState<InventoryOperationType>(
    InventoryOperationType.PURCHASE
  );
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');

  const operationTypeOptions: RadioOption[] = [
    { label: 'شراء وإضافة', value: InventoryOperationType.PURCHASE },
    { label: 'صرف واستهلاك', value: InventoryOperationType.CONSUMPTION },
  ];

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

  const inventoryOptions: SelectOption[] = availableItems.map((item) => ({
    label: `${item.name} (متوفر: ${item.availableQuantity} ${item.unit})`,
    value: item.id,
  }));

  const handleAddItem = () => {
    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      return;
    }

    const selectedItem = availableItems.find((i) => i.id === selectedItemId);
    if (!selectedItem) return;

    // Validate quantity for consumption
    if (
      operationType === InventoryOperationType.CONSUMPTION &&
      Number(quantity) > selectedItem.availableQuantity
    ) {
      alert(`الكمية المطلوبة تتجاوز المتوفر (${selectedItem.availableQuantity} ${selectedItem.unit})`);
      return;
    }

    // Validate unit price for purchase
    if (operationType === InventoryOperationType.PURCHASE && (!unitPrice || Number(unitPrice) <= 0)) {
      alert('سعر الوحدة مطلوب لعمليات الشراء');
      return;
    }

    const newItem: InventoryItemOperation = {
      itemId: selectedItemId,
      quantity: Number(quantity),
      operationType,
      ...(operationType === InventoryOperationType.PURCHASE && {
        unitPrice: Number(unitPrice),
      }),
    };

    onItemsChange([...items, newItem]);

    // Reset form
    setSelectedItemId('');
    setQuantity('');
    setUnitPrice('');
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const getItemName = (itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId);
    return item ? item.name : itemId;
  };

  const getItemUnit = (itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId);
    return item ? item.unit : '';
  };

  if (!branchId) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-center">الرجاء اختيار الفرع أولاً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">أصناف المخزون</h3>

      {/* Operation Type Selection */}
      <FormRadioGroup
        label="نوع العملية"
        options={operationTypeOptions}
        value={operationType}
        onChange={(value) => setOperationType(value as InventoryOperationType)}
      />

      {loading ? (
        <p className="text-gray-600">جاري تحميل المخزون...</p>
      ) : availableItems.length === 0 ? (
        <p className="text-gray-600">لا توجد أصناف متوفرة في هذا الفرع</p>
      ) : (
        <div className="space-y-4">
          {/* Item Selection Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <FormSelect
                label="الصنف"
                options={inventoryOptions}
                value={selectedItemId}
                onChange={setSelectedItemId}
                placeholder="اختر صنفاً"
              />
            </div>

            <FormInput
              label="الكمية"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="أدخل الكمية"
              min="0.001"
              step="0.001"
            />

            {operationType === InventoryOperationType.PURCHASE && (
              <FormInput
                label="سعر الوحدة"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="أدخل سعر الوحدة"
                min="0.01"
                step="0.01"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedItemId || !quantity || Number(quantity) <= 0}
          >
            إضافة
          </button>

          {/* Added Items List */}
          {items.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-2">الأصناف المضافة:</h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-300"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getItemName(item.itemId)}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {getItemUnit(item.itemId)}
                        {item.operationType === InventoryOperationType.PURCHASE && item.unitPrice && (
                          <>
                            {' × '}
                            <CurrencyAmountCompact amount={item.unitPrice} decimals={2} as="span" />
                            {' = '}
                            <CurrencyAmountCompact
                              amount={item.quantity * item.unitPrice}
                              decimals={2}
                              as="span"
                            />
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.operationType === InventoryOperationType.PURCHASE
                          ? '🔵 شراء'
                          : '🔴 صرف'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
