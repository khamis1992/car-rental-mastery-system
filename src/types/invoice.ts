export interface Invoice {
  id: string;
  invoice_number: string;
  contract_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  issue_date: string;
  
  // Amounts
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  
  // Status and type
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  invoice_type: 'rental' | 'additional' | 'penalty' | 'extension';
  
  // Payment terms
  payment_terms?: string;
  payment_method?: string;
  
  // Additional info
  notes?: string;
  terms_and_conditions?: string;
  
  // New fields for enhanced invoicing
  tax_rate?: number;
  discount_percentage?: number;
  invoice_category?: 'individual' | 'collective';
  billing_period_start?: string;
  billing_period_end?: string;
  auto_generated?: boolean;
  parent_invoice_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  sent_at?: string;
  paid_at?: string;
  
  // Relations
  contract?: any;
  customer?: any;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  item_type: 'rental' | 'fuel' | 'cleaning' | 'damage' | 'extension' | 'penalty' | 'insurance' | 'other';
  quantity: number;
  unit_price: number;
  total_price: number;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  contract_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // New fields for enhanced payment tracking
  payment_category?: string;
  collected_by?: string;
  collection_location?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface AdditionalCharge {
  id: string;
  contract_id: string;
  customer_id: string;
  charge_type: 'fuel' | 'cleaning' | 'damage' | 'penalty' | 'extension' | 'insurance' | 'other';
  description: string;
  amount: number;
  status: 'pending' | 'invoiced' | 'paid';
  invoice_id?: string;
  photos?: string[];
  documents?: string[];
  charge_date: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
}

export interface InvoiceWithDetails extends Invoice {
  customer_name: string;
  customer_phone: string;
  contract_number: string;
  vehicle_info: string;
}

export interface InvoiceFormData {
  contract_id: string;
  customer_id: string;
  due_date: string;
  invoice_type: 'rental' | 'additional' | 'penalty' | 'extension';
  tax_amount?: number;
  discount_amount?: number;
  payment_terms?: string;
  notes?: string;
  terms_and_conditions?: string;
  items: {
    description: string;
    item_type: 'rental' | 'fuel' | 'cleaning' | 'damage' | 'extension' | 'penalty' | 'insurance' | 'other';
    quantity: number;
    unit_price: number;
    start_date?: string;
    end_date?: string;
    daily_rate?: number;
  }[];
}

export interface PaymentFormData {
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  notes?: string;
  payment_category?: string;
  collection_location?: string;
}

// Collective Invoice Types
export interface CollectiveInvoice {
  id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_contracts: number;
  total_amount: number;
  tax_amount: number;
  net_amount: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
  notes?: string;
  auto_generated?: boolean;
  
  // Relations
  items?: CollectiveInvoiceItem[];
  payments?: CollectiveInvoicePayment[];
}

export interface CollectiveInvoiceItem {
  id: string;
  collective_invoice_id: string;
  contract_id: string;
  customer_id: string;
  individual_invoice_id?: string;
  rental_amount: number;
  additional_charges: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  rental_days: number;
  created_at: string;
  tenant_id: string;
  
  // Relations
  contract?: any;
  customer?: any;
  individual_invoice?: Invoice;
}

export interface CollectiveInvoicePayment {
  id: string;
  collective_invoice_id: string;
  payment_id: string;
  allocation_amount: number;
  created_at: string;
  tenant_id: string;
  
  // Relations
  payment?: Payment;
}

export interface CollectionRecord {
  id: string;
  payment_id: string;
  collection_type: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'online';
  collection_date: string;
  collection_amount: number;
  collector_id: string;
  collection_location?: string;
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  reference_number?: string;
  collection_notes?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  
  // Relations
  payment?: Payment;
}

export interface AutoBillingSettings {
  id: string;
  tenant_id: string;
  enabled: boolean;
  billing_frequency: 'weekly' | 'monthly' | 'quarterly';
  billing_day: number;
  due_days: number;
  auto_send_invoices: boolean;
  auto_send_reminders: boolean;
  reminder_days_before: number;
  late_fee_enabled: boolean;
  late_fee_amount: number;
  late_fee_percentage: number;
  tax_rate: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AutoBillingLog {
  id: string;
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  total_invoices_generated: number;
  total_amount: number;
  execution_status: 'success' | 'failed' | 'partial';
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  created_by?: string;
}

// Form Data Types
export interface CollectiveInvoiceFormData {
  billing_period_start: string;
  billing_period_end: string;
  due_days?: number;
  notes?: string;
}

export interface CollectionRecordFormData {
  payment_id: string;
  collection_type: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'online';
  collection_date: string;
  collection_amount: number;
  collection_location?: string;
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  reference_number?: string;
  collection_notes?: string;
}