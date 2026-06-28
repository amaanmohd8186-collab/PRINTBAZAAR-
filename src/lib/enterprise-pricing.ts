import { QuantitySlab, Size, Material } from '../types';

export interface PricingBreakdown {
  printingCost: number;
  paperCost: number;
  subtotal: number;
  gst: number;
  shipping: number;
  packaging: number;
  profitMargin: number;
  discount: number;
  total: number;
  gstPercent: number;
}

export const calculateEnterprisePrice = (
  baseQuantity: number,
  slabs: QuantitySlab[],
  selectedSize: Size,
  selectedMaterial: Material,
  options: {
    isExpress?: boolean;
    isBulkDiscountEnabled?: boolean;
    shippingBase?: number;
    packagingBase?: number;
    marginPercent?: number;
    taxPercent?: number;
  } = {}
): PricingBreakdown => {
  const {
    isExpress = false,
    isBulkDiscountEnabled = true,
    shippingBase = 150,
    packagingBase = 40,
    marginPercent = 25,
    taxPercent = 18,
  } = options;

  // 1. Find base unit price from slabs
  const slab = slabs.sort((a, b) => b.quantity - a.quantity).find(s => baseQuantity >= s.quantity) || slabs[0];
  let unitPrice = slab?.unitPrice || 10;

  // 2. Apply multipliers
  unitPrice = unitPrice * (selectedSize.priceMultiplier || 1);
  unitPrice = unitPrice * (selectedMaterial.priceMultiplier || 1);

  // 3. Calculate Printing & Paper (simplified split for reporting)
  const totalRawCost = unitPrice * baseQuantity;
  const printingCost = totalRawCost * 0.4;
  const paperCost = totalRawCost * 0.6;

  // 4. Margin
  const profitMargin = totalRawCost * (marginPercent / 100);
  
  // 5. Bulk Discount
  let discount = 0;
  if (isBulkDiscountEnabled && baseQuantity >= 500) {
    discount = totalRawCost * 0.05; // 5% for bulk
  }

  // 6. Express Surcharge
  const expressSurcharge = isExpress ? (totalRawCost * 0.15) : 0;

  const subtotal = totalRawCost + profitMargin + expressSurcharge - discount;

  // 7. Shipping & Packaging
  const shipping = baseQuantity > 1000 ? shippingBase * 2 : shippingBase;
  const packaging = packagingBase;

  // 8. Tax
  const taxableAmount = subtotal + shipping + packaging;
  const gst = taxableAmount * (taxPercent / 100);

  const total = taxableAmount + gst;

  return {
    printingCost,
    paperCost,
    subtotal,
    gst,
    shipping,
    packaging,
    profitMargin,
    discount,
    total,
    gstPercent: taxPercent,
  };
};
