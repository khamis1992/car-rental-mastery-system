import { accountingService } from './accountingService';
import { 
  ChartOfAccountsCSVData, 
  ChartOfAccountsImportResult,
  convertCSVToChartOfAccounts 
} from '@/lib/chartOfAccountsCsvImport';
import { ChartOfAccount } from '@/types/accounting';
import { supabase } from '@/integrations/supabase/client';

export interface ImportProgress {
  stage: 'validating' | 'checking_duplicates' | 'importing' | 'completed' | 'error';
  processed: number;
  total: number;
  message: string;
  errors: string[];
}

export interface ImportSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicates: number;
  warnings: string[];
  errors: string[];
  duration: number;
}

export const chartOfAccountsImportService = {
  async validateAndPreviewImport(csvContent: string): Promise<ChartOfAccountsImportResult> {
    return convertCSVToChartOfAccounts(csvContent);
  },

  async checkExistingAccounts(accountCodes: string[]): Promise<string[]> {
    try {
      const tenantId = await accountingService.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code')
        .eq('tenant_id', tenantId)
        .in('account_code', accountCodes);

      if (error) throw error;
      
      return data?.map(acc => acc.account_code) || [];
    } catch (error) {
      console.error('خطأ في التحقق من الحسابات الموجودة:', error);
      throw error;
    }
  },

  async importChartOfAccounts(
    csvData: ChartOfAccountsCSVData[],
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    } = {},
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    const summary: ImportSummary = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      warnings: [],
      errors: [],
      duration: 0
    };

    try {
      const tenantId = await accountingService.getCurrentTenantId();
      
      // المرحلة الأولى: التحقق من التكرارات
      onProgress?.({
        stage: 'checking_duplicates',
        processed: 0,
        total: csvData.length,
        message: 'جاري التحقق من الحسابات المكررة...',
        errors: []
      });

      const accountCodes = csvData.map(acc => acc.account_code);
      const existingCodes = await this.checkExistingAccounts(accountCodes);
      
      // ترتيب البيانات حسب التسلسل الهرمي (الحسابات الأب أولاً)
      const sortedData = this.sortAccountsByHierarchy(csvData);
      
      // المرحلة الثانية: الاستيراد
      onProgress?.({
        stage: 'importing',
        processed: 0,
        total: sortedData.length,
        message: 'جاري استيراد الحسابات...',
        errors: []
      });

      // إنشاء خريطة للحسابات المستوردة للربط مع الحسابات الأب
      const importedAccountsMap = new Map<string, string>();

      for (let i = 0; i < sortedData.length; i++) {
        const accountData = sortedData[i];
        summary.totalProcessed++;

        try {
          // التحقق من التكرار
          if (existingCodes.includes(accountData.account_code)) {
            if (options.skipDuplicates) {
              summary.duplicates++;
              summary.warnings.push(`تم تخطي الحساب المكرر: ${accountData.account_code}`);
              continue;
            } else if (options.updateExisting) {
              // تحديث الحساب الموجود
              await this.updateExistingAccount(accountData, tenantId);
              summary.successful++;
            } else {
              summary.duplicates++;
              summary.warnings.push(`الحساب موجود مسبقاً: ${accountData.account_code}`);
              continue;
            }
          } else {
            // إنشاء حساب جديد
            const newAccount = await this.createNewAccount(accountData, tenantId, importedAccountsMap);
            importedAccountsMap.set(accountData.account_code, newAccount.id);
            summary.successful++;
          }

          onProgress?.({
            stage: 'importing',
            processed: i + 1,
            total: sortedData.length,
            message: `تم معالجة ${i + 1} من ${sortedData.length} حساب`,
            errors: summary.errors
          });

        } catch (error) {
          summary.failed++;
          const errorMessage = `خطأ في الحساب ${accountData.account_code}: ${String(error)}`;
          summary.errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      // المرحلة الأخيرة: اكتمال العملية
      summary.duration = Date.now() - startTime;
      
      onProgress?.({
        stage: 'completed',
        processed: sortedData.length,
        total: sortedData.length,
        message: `تم الانتهاء من الاستيراد في ${(summary.duration / 1000).toFixed(2)} ثانية`,
        errors: summary.errors
      });

      return summary;

    } catch (error) {
      summary.duration = Date.now() - startTime;
      const errorMessage = `خطأ عام في عملية الاستيراد: ${String(error)}`;
      summary.errors.push(errorMessage);
      
      onProgress?.({
        stage: 'error',
        processed: summary.totalProcessed,
        total: csvData.length,
        message: errorMessage,
        errors: summary.errors
      });

      throw error;
    }
  },

  sortAccountsByHierarchy(accounts: ChartOfAccountsCSVData[]): ChartOfAccountsCSVData[] {
    const accountMap = new Map<string, ChartOfAccountsCSVData>();
    const rootAccounts: ChartOfAccountsCSVData[] = [];
    const sorted: ChartOfAccountsCSVData[] = [];

    // إنشاء خريطة للحسابات
    accounts.forEach(acc => accountMap.set(acc.account_code, acc));

    // العثور على الحسابات الجذر (بدون حساب أب)
    accounts.forEach(acc => {
      if (!acc.parent_account_code) {
        rootAccounts.push(acc);
      }
    });

    // ترتيب الحسابات هرمياً
    const addAccountAndChildren = (account: ChartOfAccountsCSVData) => {
      sorted.push(account);
      
      // البحث عن الحسابات الفرعية
      accounts
        .filter(acc => acc.parent_account_code === account.account_code)
        .sort((a, b) => a.account_code.localeCompare(b.account_code))
        .forEach(childAccount => {
          addAccountAndChildren(childAccount);
        });
    };

    // ترتيب الحسابات الجذر أولاً
    rootAccounts
      .sort((a, b) => a.account_code.localeCompare(b.account_code))
      .forEach(rootAccount => {
        addAccountAndChildren(rootAccount);
      });

    // إضافة أي حسابات لم يتم ترتيبها (في حالة وجود حسابات أب غير موجودة)
    accounts.forEach(acc => {
      if (!sorted.includes(acc)) {
        sorted.push(acc);
      }
    });

    return sorted;
  },

  async createNewAccount(
    accountData: ChartOfAccountsCSVData, 
    tenantId: string,
    importedAccountsMap: Map<string, string>
  ): Promise<ChartOfAccount> {
    let parent_account_id: string | undefined;
    
    // البحث عن معرف الحساب الأب
    if (accountData.parent_account_code) {
      // البحث في الحسابات المستوردة حديثاً أولاً
      parent_account_id = importedAccountsMap.get(accountData.parent_account_code);
      
      // إذا لم نجده، ابحث في قاعدة البيانات
      if (!parent_account_id) {
        const { data: parentAccount, error } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('account_code', accountData.parent_account_code)
          .single();

        if (error) {
          throw new Error(`لم يتم العثور على الحساب الأب: ${accountData.parent_account_code}`);
        }
        
        parent_account_id = parentAccount.id;
      }
    }

    // تحديد المستوى بناءً على وجود حساب أب
    const level = parent_account_id ? await this.getAccountLevel(parent_account_id) + 1 : 1;

    const newAccount = await accountingService.createAccount({
      account_code: accountData.account_code,
      account_name: accountData.account_name,
      account_name_en: accountData.account_name_en,
      account_type: accountData.account_type,
      account_category: accountData.account_category,
      parent_account_id,
      level,
      allow_posting: accountData.allow_posting,
      opening_balance: accountData.opening_balance,
      current_balance: accountData.opening_balance,
      is_active: true,
      notes: accountData.notes,
      tenant_id: tenantId
    } as any);

    // Transform account data to match interface
    const transformedAccount = {
      ...newAccount,
      account_type: newAccount.account_type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
      account_category: newAccount.account_category as 'current_asset' | 'fixed_asset' | 'current_liability' | 'long_term_liability' | 'capital' | 'operating_revenue' | 'other_revenue' | 'operating_expense' | 'other_expense'
    };
    
    return transformedAccount;
  },

  async updateExistingAccount(
    accountData: ChartOfAccountsCSVData, 
    tenantId: string
  ): Promise<void> {
    const { data: existingAccount, error: fetchError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('account_code', accountData.account_code)
      .single();

    if (fetchError || !existingAccount) {
      throw new Error(`لم يتم العثور على الحساب للتحديث: ${accountData.account_code}`);
    }

    await accountingService.updateAccount(existingAccount.id, {
      account_name: accountData.account_name,
      account_name_en: accountData.account_name_en,
      account_type: accountData.account_type,
      account_category: accountData.account_category,
      allow_posting: accountData.allow_posting,
      notes: accountData.notes
    } as any);
  },

  async getAccountLevel(parentAccountId: string): Promise<number> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('level')
      .eq('id', parentAccountId)
      .single();

    if (error || !data) {
      return 1; // افتراضي في حالة عدم وجود البيانات
    }

    return data.level;
  }
};