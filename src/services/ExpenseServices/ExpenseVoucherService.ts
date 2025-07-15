import { supabase } from "@/integrations/supabase/client";
import type { 
  CreateExpenseVoucherForm, 
  ExpenseVoucherFilters
} from "@/types/expense";

export class ExpenseVoucherService {
  // جلب جميع سندات الصرف
  static async getAll(
    filters: ExpenseVoucherFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: any[]; count: number }> {
    let query = supabase
      .from('expense_vouchers')
      .select('*', { count: 'exact' });

    // تطبيق الفلاتر
    if (filters.search) {
      query = query.or(`voucher_number.ilike.%${filters.search}%,beneficiary_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.date_from) {
      query = query.gte('voucher_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('voucher_date', filters.date_to);
    }

    // الترقيم
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('خطأ في جلب سندات الصرف:', error);
      throw new Error(`فشل في جلب سندات الصرف: ${error.message}`);
    }

    return { data: data || [], count: count || 0 };
  }

  // جلب سند صرف محدد
  static async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('expense_vouchers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('خطأ في جلب سند الصرف:', error);
      return null;
    }

    return data;
  }

  // إنشاء سند صرف جديد
  static async create(voucher: CreateExpenseVoucherForm & { tenant_id: string }): Promise<any> {
    // إنشاء رقم السند
    const voucherNumber = await this.generateVoucherNumber(voucher.tenant_id);

    // حساب المجاميع
    const totalAmount = voucher.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    
    const taxAmount = voucher.items.reduce((sum, item) => 
      sum + ((item.quantity * item.unit_price) * (item.tax_rate / 100)), 0);
    
    const netAmount = totalAmount + taxAmount - (voucher.discount_amount || 0);

    const voucherData = {
      tenant_id: voucher.tenant_id,
      voucher_number: voucherNumber,
      voucher_date: voucher.voucher_date,
      beneficiary_name: voucher.beneficiary_name,
      beneficiary_type: voucher.beneficiary_type,
      payment_method: voucher.payment_method,
      bank_account_id: voucher.bank_account_id,
      check_number: voucher.check_number,
      reference_number: voucher.reference_number,
      description: voucher.description,
      notes: voucher.notes,
      cost_center_id: voucher.cost_center_id,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      discount_amount: voucher.discount_amount || 0,
      net_amount: netAmount,
      status: 'draft' as const
    };

    const { data: voucherResult, error: voucherError } = await supabase
      .from('expense_vouchers')
      .insert(voucherData)
      .select()
      .single();

    if (voucherError) {
      console.error('خطأ في إنشاء سند الصرف:', voucherError);
      throw new Error(`فشل في إنشاء سند الصرف: ${voucherError.message}`);
    }

    // إدراج بنود السند
    const items = voucher.items.map(item => ({
      expense_voucher_id: voucherResult.id,
      expense_category_id: item.expense_category_id,
      account_id: item.account_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.quantity * item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: (item.quantity * item.unit_price) * (item.tax_rate / 100),
      cost_center_id: item.cost_center_id,
      project_code: item.project_code,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('expense_voucher_items')
      .insert(items);

    if (itemsError) {
      // حذف السند في حالة فشل إدراج البنود
      await supabase.from('expense_vouchers').delete().eq('id', voucherResult.id);
      console.error('خطأ في إدراج بنود السند:', itemsError);
      throw new Error(`فشل في إدراج بنود السند: ${itemsError.message}`);
    }

    return await this.getById(voucherResult.id);
  }

  // تحديث سند صرف
  static async update(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('expense_vouchers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث سند الصرف:', error);
      throw new Error(`فشل في تحديث سند الصرف: ${error.message}`);
    }

    return data;
  }

  // حذف سند صرف
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expense_vouchers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('خطأ في حذف سند الصرف:', error);
      throw new Error(`فشل في حذف سند الصرف: ${error.message}`);
    }
  }

  // إرسال للموافقة
  static async submitForApproval(id: string): Promise<any> {
    return await this.update(id, { status: 'pending_approval' });
  }

  // الموافقة على السند
  static async approve(id: string, approverId: string, comments?: string): Promise<any> {
    const updatedVoucher = await this.update(id, {
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString()
    });

    // إضافة سجل الموافقة
    await supabase.from('expense_approvals').insert([{
      expense_voucher_id: id,
      approver_id: approverId,
      approval_level: 1,
      status: 'approved',
      comments,
      approved_at: new Date().toISOString()
    }]);

    return updatedVoucher;
  }

  // رفض السند
  static async reject(id: string, approverId: string, comments: string): Promise<any> {
    const updatedVoucher = await this.update(id, { status: 'rejected' });

    // إضافة سجل الرفض
    await supabase.from('expense_approvals').insert([{
      expense_voucher_id: id,
      approver_id: approverId,
      approval_level: 1,
      status: 'rejected',
      comments
    }]);

    return updatedVoucher;
  }

  // توليد رقم السند
  private static async generateVoucherNumber(tenantId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EXP-${currentYear}-`;

    const { data, error } = await supabase
      .from('expense_vouchers')
      .select('voucher_number')
      .eq('tenant_id', tenantId)
      .like('voucher_number', `${prefix}%`)
      .order('voucher_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return `${prefix}001`;
    }

    const lastNumber = data[0].voucher_number;
    const numberPart = parseInt(lastNumber.split('-').pop() || '0');
    const newNumber = numberPart + 1;

    return `${prefix}${newNumber.toString().padStart(3, '0')}`;
  }
}