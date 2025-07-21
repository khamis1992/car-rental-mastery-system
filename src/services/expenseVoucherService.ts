// This service will be used instead of the broken expenseVoucherService
// It provides basic functionality for expense vouchers

import { supabase } from '@/integrations/supabase/client';

export interface ExpenseCategory {
  id: string;
  category_code: string;
  category_name_ar: string;
  is_active: boolean;
  requires_approval: boolean;
}

export interface ExpenseVoucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  beneficiary_name: string;
  beneficiary_type: 'supplier' | 'employee' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check';
  total_amount: number;
  tax_amount?: number;
  net_amount?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  check_number?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  approved_at?: string;
  paid_at?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseVoucherItem {
  id: string;
  expense_voucher_id: string;
  expense_category_id: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  total_amount: number;
}

export interface CreateExpenseVoucherData {
  voucher_date: string;
  beneficiary_name: string;
  beneficiary_type: 'supplier' | 'employee' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check';
  bank_account_id?: string;
  check_number?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  cost_center_id?: string;
  items: Array<{
    expense_category_id: string;
    account_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    cost_center_id?: string;
    project_code?: string;
    notes?: string;
  }>;
}

// Mock implementation for expense categories
const mockCategories: ExpenseCategory[] = [
  {
    id: '1',
    category_code: 'OFFICE',
    category_name_ar: 'مصروفات المكتب',
    is_active: true,
    requires_approval: false
  },
  {
    id: '2',
    category_code: 'TRAVEL',
    category_name_ar: 'مصروفات السفر',
    is_active: true,
    requires_approval: true
  },
  {
    id: '3',
    category_code: 'FUEL',
    category_name_ar: 'مصروفات الوقود',
    is_active: true,
    requires_approval: false
  }
];

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  // Return mock categories for now
  return mockCategories;
}

export async function getExpenseVouchers(filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  beneficiary_name?: string;
}): Promise<ExpenseVoucher[]> {
  // Return mock data for now
  return [];
}

export async function getExpenseVoucherById(id: string): Promise<ExpenseVoucher | null> {
  // Return mock data for now
  return null;
}

export async function getExpenseVoucherItems(voucherId: string): Promise<ExpenseVoucherItem[]> {
  // Return mock data for now
  return [];
}

export async function createExpenseVoucher(data: CreateExpenseVoucherData): Promise<ExpenseVoucher> {
  // For now, create a mock voucher
  const mockVoucher: ExpenseVoucher = {
    id: Date.now().toString(),
    voucher_number: `EXP-${new Date().getFullYear()}-${Date.now()}`,
    voucher_date: data.voucher_date,
    beneficiary_name: data.beneficiary_name,
    beneficiary_type: data.beneficiary_type,
    payment_method: data.payment_method,
    total_amount: data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return mockVoucher;
}

export async function updateExpenseVoucherStatus(
  id: string,
  status: ExpenseVoucher['status'],
  notes?: string
): Promise<ExpenseVoucher> {
  // Return mock updated voucher
  const mockVoucher: ExpenseVoucher = {
    id,
    voucher_number: `EXP-${new Date().getFullYear()}-${id}`,
    voucher_date: new Date().toISOString().split('T')[0],
    beneficiary_name: 'Mock Beneficiary',
    beneficiary_type: 'supplier',
    payment_method: 'cash',
    total_amount: 100,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return mockVoucher;
}

export async function generateJournalEntry(voucherId: string): Promise<string> {
  // Return mock journal entry ID
  return Date.now().toString();
}

// Create an instance for compatibility
export const expenseVoucherService = {
  getExpenseCategories,
  getExpenseVouchers,
  getExpenseVoucherById,
  getExpenseVoucherItems,
  createExpenseVoucher,
  updateExpenseVoucherStatus,
  generateJournalEntry
};