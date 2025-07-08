export interface PaymentReceipt {
  receipt_number: string;
  payment_date: string;
  customer_name: string;
  customer_phone?: string;
  contract_number: string;
  vehicle_info: string;
  payment_amount: number;
  payment_method: string;
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  invoice_number: string;
  total_invoice_amount: number;
  remaining_amount: number;
  notes?: string;
  company_info: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface PaymentReceiptPDFOptions {
  includeWatermark?: boolean;
  language?: 'ar' | 'en';
  printDateTime?: boolean;
}