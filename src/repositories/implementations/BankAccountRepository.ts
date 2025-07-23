import { BaseRepository } from '../base/BaseRepository';
import { IBankAccountRepository, BankAccount } from '../interfaces/IBankAccountRepository';
import { supabase } from '@/integrations/supabase/client';

export class BankAccountRepository extends BaseRepository<BankAccount> implements IBankAccountRepository {
  protected tableName = 'bank_accounts';

  async getActiveBankAccounts(): Promise<BankAccount[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('account_name');

    if (error) throw new Error(`خطأ في جلب الحسابات البنكية النشطة: ${error.message}`);
    return (data || []) as BankAccount[];
  }

  async updateBalance(accountId: string, newBalance: number): Promise<void> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { error } = await supabase
      .from('bank_accounts')
      .update({ 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(`خطأ في تحديث رصيد الحساب: ${error.message}`);
  }

  async getByAccountNumber(accountNumber: string): Promise<BankAccount | null> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) throw new Error('لا يمكن تحديد هوية المؤسسة');

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('account_number', accountNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // لا يوجد سجل
      throw new Error(`خطأ في البحث عن الحساب: ${error.message}`);
    }

    return data as BankAccount;
  }
}