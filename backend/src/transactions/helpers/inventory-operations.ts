import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getCurrentTimestamp } from '../../common/utils/date.utils';

/**
 * Input for inventory operation
 */
export interface InventoryOperationInput {
  itemId: string;
  subUnitId?: string;
  quantity: number;
  operationType: 'PURCHASE' | 'CONSUMPTION';
  unitPrice?: number;
  sellingPrice?: number;
  branchId: string;
  transactionId: string;
  userId: string;
}

/**
 * Processes inventory consumption - deducts quantity and records consumption.
 */
export async function processConsumption(
  input: InventoryOperationInput,
  prisma: any, // Prisma transaction client
): Promise<void> {
  // Get inventory item
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      id: input.itemId,
      branchId: input.branchId,
      deletedAt: null,
    },
  });

  if (!inventoryItem) {
    throw new NotFoundException(`صنف المخزون ${input.itemId} غير موجود في هذا الفرع`);
  }

  // Validate sufficient quantity
  if (Number(inventoryItem.quantity) < input.quantity) {
    throw new BadRequestException(
      `كمية غير كافية للصنف ${inventoryItem.name}. المتوفر: ${inventoryItem.quantity}, المطلوب: ${input.quantity}`,
    );
  }

  // Deduct from inventory
  await prisma.inventoryItem.update({
    where: { id: input.itemId },
    data: {
      quantity: { decrement: input.quantity },
      lastUpdated: getCurrentTimestamp(),
    },
  });

  // Record consumption
  await prisma.inventoryConsumption.create({
    data: {
      inventoryItemId: input.itemId,
      branchId: input.branchId,
      quantity: input.quantity,
      unit: inventoryItem.unit,
      reason: `معاملة: ${input.transactionId}`,
      consumedAt: getCurrentTimestamp(),
      recordedBy: input.userId,
    },
  });
}

/**
 * Processes inventory purchase - adds quantity using weighted average cost.
 */
export async function processPurchase(
  input: InventoryOperationInput,
  prisma: any, // Prisma transaction client
): Promise<void> {
  if (!input.unitPrice) {
    throw new BadRequestException('سعر الوحدة مطلوب لعمليات الشراء');
  }

  // Get inventory item
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      id: input.itemId,
      branchId: input.branchId,
      deletedAt: null,
    },
  });

  if (!inventoryItem) {
    throw new NotFoundException(`صنف المخزون ${input.itemId} غير موجود في هذا الفرع`);
  }

  // Calculate weighted average cost
  const currentQuantity = Number(inventoryItem.quantity);
  const currentCost = Number(inventoryItem.costPerUnit);
  const newQuantity = currentQuantity + input.quantity;
  const totalValue = currentQuantity * currentCost + input.quantity * input.unitPrice;
  const newCost = newQuantity > 0 ? totalValue / newQuantity : input.unitPrice;

  // Update inventory
  await prisma.inventoryItem.update({
    where: { id: input.itemId },
    data: {
      quantity: { increment: input.quantity },
      costPerUnit: newCost,
      ...(input.sellingPrice !== undefined && { sellingPrice: input.sellingPrice }),
      lastUpdated: getCurrentTimestamp(),
    },
  });
}

/**
 * Processes inventory operation (PURCHASE or CONSUMPTION) and creates transaction link.
 */
export async function processInventoryOperation(
  input: InventoryOperationInput,
  prisma: any, // Prisma transaction client
): Promise<void> {
  if (input.operationType === 'CONSUMPTION') {
    await processConsumption(input, prisma);
  } else if (input.operationType === 'PURCHASE') {
    await processPurchase(input, prisma);
  }

  // Create transaction-inventory link
  const itemSubtotal = input.quantity * (input.unitPrice || 0);
  await prisma.transactionInventoryItem.create({
    data: {
      transactionId: input.transactionId,
      inventoryItemId: input.itemId,
      quantity: input.quantity,
      operationType: input.operationType,
      unitPrice: input.unitPrice || 0,
      subtotal: itemSubtotal,
      total: itemSubtotal,
    },
  });
}
