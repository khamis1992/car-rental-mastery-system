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
}