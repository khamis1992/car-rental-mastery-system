
import { supabase } from "@/integrations/supabase/client";
import { tenantIsolationMiddleware } from "@/middleware/TenantIsolationMiddleware";

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  category_code: string;
  category_name_ar: string;
  category_name_en?: string;
  parent_category_id?: string;
  account_id?: string;
  is_active: boolean;
  requires_approval: boolean;
  approval_limit: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseVoucher {
  id: string;
  tenant_id: string;
  voucher_number: string;
  voucher_date: string;
  beneficiary_name: string;
  beneficiary_type: 'supplier' | 'employee' | 'other';
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'check';
  bank_account_id?: string;
  check_number?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  cost_center_id?: string;
  journal_entry_id?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ExpenseVoucherItem {
  id: string;
  expense_voucher_id: string;
  expense_category_id: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_rate: number;
  tax_amount: number;
  cost_center_id?: string;
  project_code?: string;
  notes?: string;
  created_at: string;
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
  items: {
    expense_category_id: string;
    account_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    cost_center_id?: string;
    project_code?: string;
    notes?: string;
  }[];
}

export const expenseVoucherService = {
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category_code');

      if (error) {
        console.error('خطأ في جلب فئات المصروفات:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getExpenseCategories:', error);
      return [];
    }
  },

  async createExpenseVoucher(data: CreateExpenseVoucherData): Promise<ExpenseVoucher> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      // حساب المجاميع
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
      const netAmount = totalAmount + taxAmount;

      // إنشاء رقم السند
      const voucherNumber = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // إنشاء السند
      const { data: voucher, error: voucherError } = await supabase
        .from('expense_vouchers')
        .insert({
          tenant_id: tenantId,
          voucher_number: voucherNumber,
          voucher_date: data.voucher_date,
          beneficiary_name: data.beneficiary_name,
          beneficiary_type: data.beneficiary_type,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          net_amount: netAmount,
          payment_method: data.payment_method,
          bank_account_id: data.bank_account_id,
          check_number: data.check_number,
          reference_number: data.reference_number,
          description: data.description,
          notes: data.notes,
          cost_center_id: data.cost_center_id,
          status: 'draft'
        })
        .select()
        .single();

      if (voucherError) {
        console.error('خطأ في إنشاء سند الصرف:', voucherError);
        throw voucherError;
      }

      // إنشاء بنود السند
      const items = data.items.map(item => ({
        expense_voucher_id: voucher.id,
        expense_category_id: item.expense_category_id,
        account_id: item.account_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.quantity * item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.quantity * item.unit_price * item.tax_rate / 100,
        cost_center_id: item.cost_center_id,
        project_code: item.project_code,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('expense_voucher_items')
        .insert(items);

      if (itemsError) {
        console.error('خطأ في إنشاء بنود السند:', itemsError);
        throw itemsError;
      }

      return voucher;
    } catch (error) {
      console.error('خطأ في createExpenseVoucher:', error);
      throw error;
    }
  },

  async getExpenseVouchers(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    beneficiary_name?: string;
  }): Promise<ExpenseVoucher[]> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      let query = supabase
        .from('expense_vouchers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('voucher_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('voucher_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('voucher_date', filters.date_to);
      }

      if (filters?.beneficiary_name) {
        query = query.ilike('beneficiary_name', `%${filters.beneficiary_name}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب سندات الصرف:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getExpenseVouchers:', error);
      return [];
    }
  },

  async getExpenseVoucherById(id: string): Promise<ExpenseVoucher | null> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('expense_vouchers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('خطأ في جلب سند الصرف:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('خطأ في getExpenseVoucherById:', error);
      return null;
    }
  },

  async getExpenseVoucherItems(voucherId: string): Promise<ExpenseVoucherItem[]> {
    try {
      const { data, error } = await supabase
        .from('expense_voucher_items')
        .select('*')
        .eq('expense_voucher_id', voucherId)
        .order('created_at');

      if (error) {
        console.error('خطأ في جلب بنود السند:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getExpenseVoucherItems:', error);
      return [];
    }
  },

  async updateExpenseVoucherStatus(
    id: string, 
    status: ExpenseVoucher['status'], 
    notes?: string
  ): Promise<ExpenseVoucher> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('expense_vouchers')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث حالة السند:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('خطأ في updateExpenseVoucherStatus:', error);
      throw error;
    }
  },

  async generateJournalEntry(voucherId: string): Promise<string> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase.rpc('create_expense_journal_entry', {
        voucher_id: voucherId
      });

      if (error) {
        console.error('خطأ في إنشاء القيد المحاسبي:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('خطأ في generateJournalEntry:', error);
      throw error;
    }
  }
};
