import { BaseRepository } from '../base/BaseRepository';
import { IBankTransactionRepository, BankTransaction, CreateBankTransactionData } from '../interfaces/IBankTransactionRepository';
import { supabase } from '@/integrations/supabase/client';

export class BankTransactionRepository extends BaseRepository<BankTransaction> implements IBankTransactionRepository {
  protected tableName = 'bank_transactions';

  async getByBankAccount(bankAccountId: string, limit: number = 50): Promise<BankTransaction[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('bank_account_id', bankAccountId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`خطأ في جلب معاملات الحساب البنكي: ${error.message}`);
    return (data || []) as BankTransaction[];
  }

  async getByDateRange(bankAccountId: string, startDate: string, endDate: string): Promise<BankTransaction[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('bank_account_id', bankAccountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) throw new Error(`خطأ في جلب المعاملات حسب الفترة: ${error.message}`);
    return (data || []) as BankTransaction[];
  }

  async createTransaction(data: CreateBankTransactionData): Promise<BankTransaction> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const transactionData = {
      ...data,
      tenant_id: tenantId,
      status: data.status || 'pending',
      balance_after: 0, // سيتم حسابه بواسطة trigger
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    const { data: result, error } = await supabase
      .from('bank_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) throw new Error(`خطأ في إنشاء المعاملة البنكية: ${error.message}`);
    return result as BankTransaction;
  }

  async updateTransactionStatus(transactionId: string, status: string): Promise<void> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { error } = await supabase
      .from('bank_transactions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(`خطأ في تحديث حالة المعاملة: ${error.message}`);
  }

  async getAccountBalance(bankAccountId: string): Promise<number> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    // جلب آخر معاملة للحصول على الرصيد الحالي
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('balance_after')
      .eq('tenant_id', tenantId)
      .eq('bank_account_id', bankAccountId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`خطأ في جلب رصيد الحساب: ${error.message}`);
    
    if (!data || data.length === 0) {
      // إذا لم توجد معاملات، جلب الرصيد الافتتاحي من جدول الحسابات البنكية
      const { data: accountData, error: accountError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', bankAccountId)
        .eq('tenant_id', tenantId)
        .single();

      if (accountError) throw new Error(`خطأ في جلب بيانات الحساب: ${accountError.message}`);
      return accountData?.current_balance || 0;
    }

    return data[0].balance_after || 0;
  }
}