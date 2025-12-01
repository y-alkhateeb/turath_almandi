import { DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface DiscountCalculation {
  subtotal: Decimal;
  discountAmount: Decimal;
  total: Decimal;
}

/**
 * Calculate discount for a given subtotal
 */
export function calculateDiscount(
  subtotal: number | Decimal,
  discountType?: DiscountType,
  discountValue?: number | Decimal,
): DiscountCalculation {
  const subtotalDecimal = new Decimal(subtotal);

  if (!discountType || !discountValue) {
    return {
      subtotal: subtotalDecimal,
      discountAmount: new Decimal(0),
      total: subtotalDecimal,
    };
  }

  const valueDecimal = new Decimal(discountValue);
  let discountAmount: Decimal;

  if (discountType === 'PERCENTAGE') {
    // Percentage discount: subtotal * (discountValue / 100)
    discountAmount = subtotalDecimal.mul(valueDecimal).div(100);
  } else {
    // Fixed amount discount
    discountAmount = valueDecimal;
  }

  // Ensure discount doesn't exceed subtotal
  if (discountAmount.gt(subtotalDecimal)) {
    discountAmount = subtotalDecimal;
  }

  const total = subtotalDecimal.sub(discountAmount);

  return {
    subtotal: subtotalDecimal,
    discountAmount,
    total,
  };
}

/**
 * Calculate item totals (quantity * unitPrice, apply discount)
 */
export function calculateItemTotal(
  quantity: number,
  unitPrice: number | Decimal,
  discountType?: DiscountType,
  discountValue?: number | Decimal,
): DiscountCalculation {
  const quantityDecimal = new Decimal(quantity);
  const priceDecimal = new Decimal(unitPrice);
  const subtotal = quantityDecimal.mul(priceDecimal);

  return calculateDiscount(subtotal, discountType, discountValue);
}
