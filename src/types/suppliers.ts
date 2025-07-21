export interface Supplier {
  id: string;
  tenant_id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_name_en?: string;
  supplier_type: 'individual' | 'company';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  civil_id?: string;
  commercial_registration?: string;
  tax_number?: string;
  payment_terms?: number;
  credit_limit?: number;
  current_balance?: number;
  currency_code?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  swift_code?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CreateSupplierRequest {
  supplier_name: string;
  supplier_name_en?: string;
  supplier_type: 'individual' | 'company';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  civil_id?: string;
  commercial_registration?: string;
  tax_number?: string;
  payment_terms?: number;
  credit_limit?: number;
  currency_code?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  swift_code?: string;
  notes?: string;
}

export interface SupplierInvoice {
  id: string;
  tenant_id: string;
  supplier_id: string;
  invoice_number: string;
  supplier_invoice_number?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  invoice_type: 'purchase' | 'maintenance' | 'insurance' | 'utilities' | 'rent' | 'other';
  payment_terms?: number;
  description?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  supplier?: Supplier;
  items?: SupplierInvoiceItem[];
}

export interface SupplierInvoiceItem {
  id: string;
  supplier_invoice_id: string;
  description: string;
  item_type: 'service' | 'part' | 'maintenance' | 'insurance' | 'fuel' | 'other';
  quantity: number;
  unit_price: number;
  total_price: number;
  vehicle_id?: string;
  service_date?: string;
  created_at?: string;
}

export interface CreateSupplierInvoiceRequest {
  supplier_id: string;
  supplier_invoice_number?: string;
  invoice_date: string;
  due_date: string;
  invoice_type: 'purchase' | 'maintenance' | 'insurance' | 'utilities' | 'rent' | 'other';
  payment_terms?: number;
  description?: string;
  notes?: string;
  tax_amount?: number;
  discount_amount?: number;
  items: {
    description: string;
    item_type: 'service' | 'part' | 'maintenance' | 'insurance' | 'fuel' | 'other';
    quantity: number;
    unit_price: number;
    vehicle_id?: string;
    service_date?: string;
  }[];
}

export interface SupplierPayment {
  id: string;
  tenant_id: string;
  payment_number: string;
  supplier_invoice_id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'online';
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  receipt_url?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  supplier?: Supplier;
  supplier_invoice?: SupplierInvoice;
}

export interface CreateSupplierPaymentRequest {
  supplier_invoice_id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'online';
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  notes?: string;
}

export interface SupplierSubsidiaryLedger {
  id: string;
  tenant_id: string;
  supplier_id: string;
  journal_entry_id?: string;
  transaction_date: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_type: 'invoice' | 'payment' | 'adjustment' | 'opening_balance';
  reference_id?: string;
  invoice_number?: string;
  created_at?: string;
  created_by?: string;
}

export interface SupplierAgingAnalysis {
  id: string;
  tenant_id: string;
  supplier_id: string;
  analysis_date: string;
  current_amount: number;
  days_30_60: number;
  days_61_90: number;
  days_91_120: number;
  over_120_days: number;
  total_outstanding: number;
  oldest_invoice_date?: string;
  created_at?: string;
  created_by?: string;
  supplier?: Supplier;
}