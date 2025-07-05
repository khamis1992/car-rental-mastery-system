// Invoice calculation utilities to ensure consistency across the system
export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; unit_price: number }>,
  taxAmount: number = 0,
  discountAmount: number = 0
) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalAmount = subtotal + taxAmount - discountAmount;
  
  return {
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    outstandingAmount: totalAmount // Initially equals total amount
  };
};

export const validateInvoiceAmounts = (
  subtotal: number,
  taxAmount: number,
  discountAmount: number,
  totalAmount: number
): boolean => {
  const calculatedTotal = subtotal + taxAmount - discountAmount;
  return Math.abs(calculatedTotal - totalAmount) < 0.01; // Allow for small rounding differences
};