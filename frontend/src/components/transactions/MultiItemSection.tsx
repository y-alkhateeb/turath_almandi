/**
 * MultiItemSection Component
 * Component for adding multiple inventory items to a transaction
 *
 * Features:
 * - Add/remove multiple items
 * - Select inventory item from dropdown with search
 * - Enter quantity and unit price per item
 * - Optional item-level discount (percentage or amount)
 * - Calculate subtotals automatically
 * - Show total before transaction-level discount
 *
 * Used for categories: INVENTORY, INVENTORY_SALES, APP_PURCHASES
 */

import { useState } from 'react';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import { DiscountType, InventoryOperationType } from '@/types/enum';
import type { TransactionItemDto } from '@/api/services/transactionService';

interface MultiItemSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  items: TransactionItemDto[];
  onItemsChange: (items: TransactionItemDto[]) => void;
  operationType: InventoryOperationType;
  branchId?: string;
}

export const MultiItemSection: React.FC<MultiItemSectionProps> = ({
  items,
  onItemsChange,
  operationType,
  branchId,
}) => {
  const { data: inventoryData, isLoading } = useInventory({ branchId });
  const inventoryItems = inventoryData?.data || [];

  // Add new item
  const handleAddItem = () => {
    onItemsChange([
      ...items,
      {
        inventoryItemId: '',
        quantity: 1,
        unitPrice: 0,
        operationType,
        discountType: undefined,
        discountValue: undefined,
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  // Update item field
  const handleUpdateItem = (index: number, field: keyof TransactionItemDto, value: any) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  // Calculate item total (subtotal - discount)
  const calculateItemTotal = (item: TransactionItemDto): number => {
    const subtotal = item.quantity * item.unitPrice;

    if (!item.discountType || !item.discountValue) {
      return subtotal;
    }

    let discountAmount = 0;
    if (item.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return subtotal - discountAmount;
  };

  // Calculate total of all items
  const calculateTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>الأصناف</span>
          <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
            <Plus className="ml-2 h-4 w-4" />
            إضافة صنف
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لم يتم إضافة أصناف بعد. انقر على "إضافة صنف" للبدء.
          </div>
        )}

        {items.map((item, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Inventory Item Selector */}
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor={`item-${index}-inventory`}>الصنف *</Label>
                  <Select
                    value={item.inventoryItemId}
                    onValueChange={(value) => handleUpdateItem(index, 'inventoryItemId', value)}
                  >
                    <SelectTrigger id={`item-${index}-inventory`}>
                      <SelectValue placeholder="اختر صنف" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          جاري التحميل...
                        </SelectItem>
                      ) : (
                        inventoryItems?.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} - {invItem.quantity} {invItem.unit}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-quantity`}>الكمية *</Label>
                  <Input
                    id={`item-${index}-quantity`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-price`}>سعر الوحدة *</Label>
                  <Input
                    id={`item-${index}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Item Discount Type */}
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-discount-type`}>نوع الخصم (اختياري)</Label>
                  <Select
                    value={item.discountType || ''}
                    onValueChange={(value) =>
                      handleUpdateItem(
                        index,
                        'discountType',
                        value === '' ? undefined : (value as DiscountType)
                      )
                    }
                  >
                    <SelectTrigger id={`item-${index}-discount-type`}>
                      <SelectValue placeholder="بدون خصم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون خصم</SelectItem>
                      <SelectItem value={DiscountType.PERCENTAGE}>نسبة مئوية (%)</SelectItem>
                      <SelectItem value={DiscountType.AMOUNT}>مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Item Discount Value */}
                {item.discountType && (
                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-discount-value`}>
                      قيمة الخصم {item.discountType === DiscountType.PERCENTAGE ? '(%)' : ''}
                    </Label>
                    <Input
                      id={`item-${index}-discount-value`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discountValue || 0}
                      onChange={(e) =>
                        handleUpdateItem(index, 'discountValue', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Item Subtotal Display */}
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-muted-foreground">
                    المجموع الفرعي: {(item.quantity * item.unitPrice).toFixed(2)}
                  </Label>
                  {item.discountType && item.discountValue && (
                    <Label className="text-primary font-semibold">
                      بعد الخصم: {calculateItemTotal(item).toFixed(2)}
                    </Label>
                  )}
                </div>

                {/* Remove Button */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="w-full"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Total Amount */}
        {items.length > 0 && (
          <div className="flex justify-end items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">الإجمالي قبل الخصم الكلي:</span>
            <span className="text-2xl font-bold text-primary">
              {calculateTotalAmount().toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
