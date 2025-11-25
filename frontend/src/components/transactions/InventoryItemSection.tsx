/**
 * InventoryItemSection - قسم اختيار صنف المخزون
 *
 * الميزات:
 * - شراء (PURCHASE): سعر الوحدة قابل للتعديل
 * - بيع (CONSUMPTION): سعر الوحدة قابل للتعديل مع عرض الربح
 * - عرض الكمية المتوفرة
 * - حساب المبلغ الإجمالي تلقائياً
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
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [originalCostPerUnit, setOriginalCostPerUnit] = useState<number>(0);

  // جلب أصناف المخزون
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

  // حساب المبلغ الإجمالي
  useEffect(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    onTotalChange(qty * price);
  }, [quantity, unitPrice, onTotalChange]);

  // عند اختيار صنف
  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;

    if (!itemId) {
      onItemChange(null);
      setQuantity('');
      setUnitPrice('');
      setOriginalCostPerUnit(0);
      return;
    }

    const item = availableItems.find((i) => i.id === itemId);
    if (!item) return;

    const cost = item.costPerUnit;
    setOriginalCostPerUnit(cost);
    setUnitPrice(cost.toFixed(2));
    setQuantity('');

    onItemChange({
      itemId: item.id,
      itemName: item.name,
      quantity: 0,
      unitPrice: cost,
      unit: item.unit,
    });
  };

  // تغيير الكمية
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value);

    if (selectedItem) {
      onItemChange({
        ...selectedItem,
        quantity: Number(value) || 0,
      });
    }
  };

  // تغيير السعر
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUnitPrice(value);

    if (selectedItem) {
      onItemChange({
        ...selectedItem,
        unitPrice: Number(value) || 0,
      });
    }
  };

  // الحصول على تفاصيل الصنف المختار
  const getSelectedItemDetails = () => {
    if (!selectedItem) return null;
    return availableItems.find((i) => i.id === selectedItem.itemId);
  };

  // حساب الربح للبيع
  const calculateProfit = () => {
    if (operationType !== 'CONSUMPTION') return null;

    const qty = Number(quantity) || 0;
    const sellPrice = Number(unitPrice) || 0;
    const profitPerUnit = sellPrice - originalCostPerUnit;
    const totalProfit = profitPerUnit * qty;

    return {
      profitPerUnit,
      totalProfit,
      isProfit: profitPerUnit >= 0,
    };
  };

  const selectedItemDetails = getSelectedItemDetails();
  const profit = calculateProfit();
  const calculatedTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const maxQuantity = operationType === 'CONSUMPTION' && selectedItemDetails
    ? selectedItemDetails.availableQuantity
    : undefined;

  // إذا لم يتم اختيار فرع
  if (!branchId) {
    return (
      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
        <p className="text-center text-[var(--text-secondary)]">
          الرجاء اختيار الفرع أولاً
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          صنف المخزون
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          operationType === 'PURCHASE'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        }`}>
          {operationType === 'PURCHASE' ? 'شراء وإضافة للمخزون' : 'بيع من المخزون'}
        </span>
      </div>

      {loading ? (
        <p className="text-[var(--text-secondary)]">جاري تحميل المخزون...</p>
      ) : availableItems.length === 0 ? (
        <p className="text-[var(--text-secondary)]">لا توجد أصناف في هذا الفرع</p>
      ) : (
        <div className="space-y-4">
          {/* اختيار الصنف */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              الصنف <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedItem?.itemId || ''}
              onChange={handleItemSelect}
              disabled={disabled}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              <option value="">-- اختر صنفاً --</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (متوفر: {item.availableQuantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && selectedItemDetails && (
            <>
              {/* الكمية المتوفرة */}
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    الكمية المتوفرة في المخزون:
                  </span>
                  <span className="text-lg font-bold text-blue-800 dark:text-blue-300">
                    {selectedItemDetails.availableQuantity} {selectedItem.unit}
                  </span>
                </div>
              </div>

              {/* الكمية */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {operationType === 'PURCHASE' ? 'الكمية المشتراة' : 'الكمية المباعة'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="0.001"
                  step="0.001"
                  max={maxQuantity}
                  placeholder="أدخل الكمية"
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                />
                {operationType === 'CONSUMPTION' && maxQuantity && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    الحد الأقصى: {maxQuantity} {selectedItem.unit}
                  </p>
                )}
              </div>

              {/* سعر الوحدة */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {operationType === 'PURCHASE' ? 'سعر الشراء للوحدة' : 'سعر البيع للوحدة'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={handlePriceChange}
                  min="0.01"
                  step="0.01"
                  placeholder="أدخل السعر"
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  سعر التكلفة الأصلي: <CurrencyAmountCompact amount={originalCostPerUnit} decimals={2} />
                </p>
              </div>

              {/* عرض الربح للبيع */}
              {operationType === 'CONSUMPTION' && profit && Number(quantity) > 0 && (
                <div className={`p-3 rounded-lg border ${
                  profit.isProfit
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    profit.isProfit
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {profit.isProfit ? 'الربح المتوقع' : 'الخسارة المتوقعة'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">الربح للوحدة: </span>
                      <span className={`font-bold ${
                        profit.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {profit.isProfit ? '+' : '-'}
                        <CurrencyAmountCompact amount={Math.abs(profit.profitPerUnit)} decimals={2} />
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">إجمالي الربح: </span>
                      <span className={`font-bold ${
                        profit.isProfit ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {profit.isProfit ? '+' : '-'}
                        <CurrencyAmountCompact amount={Math.abs(profit.totalProfit)} decimals={2} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* المبلغ الإجمالي */}
              <div className="p-3 bg-brand-gold-50 dark:bg-brand-gold-900/20 rounded-lg border border-brand-gold-200 dark:border-brand-gold-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-gold-800 dark:text-brand-gold-300">
                    المبلغ الإجمالي:
                  </span>
                  <CurrencyAmountCompact
                    amount={calculatedTotal}
                    decimals={2}
                    className="text-lg font-bold text-brand-gold-800 dark:text-brand-gold-300"
                  />
                </div>
                <p className="text-xs text-brand-gold-600 dark:text-brand-gold-400 mt-1">
                  {quantity || '0'} × {unitPrice || '0'} = {calculatedTotal.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default InventoryItemSection;
