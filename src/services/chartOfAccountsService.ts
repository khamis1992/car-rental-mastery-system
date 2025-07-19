import { supabase } from '@/integrations/supabase/client';
import { 
  ChartOfAccountsSettings, 
  AccountTemplate, 
  ChartOfAccountNode, 
  AccountValidationResult, 
  AccountFormData,
  SmartAccountSuggestion,
  AccountAnalytics,
  BulkAccountOperation,
  AccountSearchFilters,
  AccountTreeViewConfig
} from '@/types/chartOfAccounts';

export class ChartOfAccountsService {
  
  // إعدادات دليل الحسابات
  async getAccountSettings(): Promise<ChartOfAccountsSettings | null> {
    const { data, error } = await supabase
      .from('chart_of_accounts_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data as ChartOfAccountsSettings;
  }

  async updateAccountSettings(settings: Partial<ChartOfAccountsSettings>): Promise<void> {
    const { error } = await supabase
      .from('chart_of_accounts_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true);
    
    if (error) throw error;
  }

  // قوالب الحسابات
  async getAccountTemplates(businessType?: string): Promise<AccountTemplate[]> {
    let query = supabase
      .from('account_templates')
      .select('*')
      .eq('is_active', true);
    
    if (businessType) {
      query = query.eq('business_type', businessType);
    }
    
    const { data, error } = await query.order('template_name');
    
    if (error) throw error;
    return (data || []) as AccountTemplate[];
  }

  async applyAccountTemplate(templateId: string): Promise<{ success: boolean; accounts_created: number }> {
    // تطبيق مبسط لقالب الحسابات
    const template = await supabase
      .from('account_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (template.error) throw template.error;
    
    // يمكن تطوير منطق تطبيق القالب هنا
    return { success: true, accounts_created: 0 };
  }

  // توليد رقم حساب تلقائي
  async generateAccountCode(parentAccountId?: string, accountType?: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_account_code', {
      p_tenant_id: null, // سيتم تحديده تلقائياً من السياق
      p_parent_account_id: parentAccountId || null,
      p_account_type: accountType || null
    });
    
    if (error) throw error;
    return data;
  }

  // التحقق من صحة هيكل الحساب
  async validateAccountStructure(
    accountCode: string, 
    parentAccountId?: string, 
    level: number = 1
  ): Promise<AccountValidationResult> {
    const { data, error } = await supabase.rpc('validate_account_structure', {
      p_tenant_id: null, // سيتم تحديده تلقائياً من السياق
      p_account_code: accountCode,
      p_parent_account_id: parentAccountId || null,
      p_level: level
    });
    
    if (error) throw error;
    return data as AccountValidationResult;
  }

  // الحصول على دليل الحسابات كشجرة
  async getAccountsTree(config?: AccountTreeViewConfig): Promise<ChartOfAccountNode[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select(`
        *,
        parent:parent_account_id(*)
      `)
      .order('account_code');
    
    if (error) throw error;
    
    // تحويل البيانات إلى هيكل شجري
    return this.buildAccountTree((data || []) as any[], config);
  }

  // بناء الهيكل الشجري
  private buildAccountTree(accounts: any[], config?: AccountTreeViewConfig): ChartOfAccountNode[] {
    const accountMap = new Map<string, ChartOfAccountNode>();
    const rootAccounts: ChartOfAccountNode[] = [];

    // إنشاء map للحسابات
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: [],
        isExpanded: config?.expand_all || false,
        hasChildren: false
      });
    });

    // بناء الشجرة
    accounts.forEach(account => {
      const node = accountMap.get(account.id)!;
      
      if (account.parent_account_id) {
        const parent = accountMap.get(account.parent_account_id);
        if (parent) {
          parent.children!.push(node);
          parent.hasChildren = true;
          node.parent = parent;
        }
      } else {
        rootAccounts.push(node);
      }
    });

    // تطبيق الفلاتر والتكوين
    return this.applyTreeConfig(rootAccounts, config);
  }

  private applyTreeConfig(accounts: ChartOfAccountNode[], config?: AccountTreeViewConfig): ChartOfAccountNode[] {
    if (!config) return accounts;

    return accounts.filter(account => {
      if (!config.show_inactive && !account.is_active) return false;
      return true;
    }).map(account => ({
      ...account,
      children: account.children ? this.applyTreeConfig(account.children, config) : []
    }));
  }

  // البحث المتقدم في الحسابات
  async searchAccounts(filters: AccountSearchFilters): Promise<ChartOfAccountNode[]> {
    let query = supabase
      .from('chart_of_accounts')
      .select('*');

    // تطبيق الفلاتر
    if (filters.search_term) {
      query = query.or(`account_name.ilike.%${filters.search_term}%,account_code.ilike.%${filters.search_term}%`);
    }

    if (filters.account_type) {
      query = query.eq('account_type', filters.account_type);
    }

    if (filters.account_category) {
      query = query.eq('account_category', filters.account_category);
    }

    if (filters.level) {
      query = query.eq('level', filters.level);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.allow_posting !== undefined) {
      query = query.eq('allow_posting', filters.allow_posting);
    }

    if (filters.parent_account_id) {
      query = query.eq('parent_account_id', filters.parent_account_id);
    }

    if (filters.has_balance) {
      query = query.neq('current_balance', 0);
    }

    if (filters.balance_range?.min !== undefined) {
      query = query.gte('current_balance', filters.balance_range.min);
    }

    if (filters.balance_range?.max !== undefined) {
      query = query.lte('current_balance', filters.balance_range.max);
    }

    if (filters.created_date_range?.start) {
      query = query.gte('created_at', filters.created_date_range.start);
    }

    if (filters.created_date_range?.end) {
      query = query.lte('created_at', filters.created_date_range.end);
    }

    const { data, error } = await query.order('account_code');
    
    if (error) throw error;
    return data || [];
  }

  // اقتراحات ذكية للحسابات
  async getSmartAccountSuggestions(
    accountName: string, 
    accountType: string
  ): Promise<SmartAccountSuggestion[]> {
    // يمكن تحسين هذا باستخدام AI في المستقبل
    const suggestions: SmartAccountSuggestion[] = [];
    
    // اقتراحات أساسية بناء على النوع والاسم
    const { data: similarAccounts } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('account_type', accountType)
      .ilike('account_name', `%${accountName.substring(0, 3)}%`)
      .limit(5);

    if (similarAccounts && similarAccounts.length > 0) {
      // توليد رقم حساب مقترح
      const suggestedCode = await this.generateAccountCode(undefined, accountType);
      
      suggestions.push({
        suggested_code: suggestedCode,
        suggested_name: accountName,
        suggested_category: this.inferAccountCategory(accountType, accountName),
        confidence_score: 0.8,
        reasoning: `بناء على الحسابات المشابهة الموجودة`,
        similar_accounts: similarAccounts.map(acc => acc.account_name)
      });
    }

    return suggestions;
  }

  private inferAccountCategory(accountType: string, accountName: string): string {
    const categoryMappings = {
      asset: {
        'نقد|صندوق|بنك': 'current_asset',
        'عملاء|مدين': 'current_asset',
        'مخزون|بضاعة': 'current_asset',
        'سيارات|مركبات|معدات|مباني': 'fixed_asset'
      },
      liability: {
        'موردين|دائن|مستحق': 'current_liability',
        'قرض|تمويل': 'long_term_liability'
      },
      equity: {
        'رأس|احتياطي|أرباح': 'capital'
      },
      revenue: {
        'تأجير|إيراد|مبيعات': 'operating_revenue',
        'أخرى|متنوعة': 'other_revenue'
      },
      expense: {
        'راتب|وقود|صيانة|إيجار': 'operating_expense',
        'أخرى|متنوعة': 'other_expense'
      }
    };

    const typeCategories = categoryMappings[accountType as keyof typeof categoryMappings];
    if (typeCategories) {
      for (const [pattern, category] of Object.entries(typeCategories)) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(accountName)) {
          return category;
        }
      }
    }

    // افتراضي
    return `${accountType === 'asset' ? 'current' : accountType === 'liability' ? 'current' : ''}${accountType === 'asset' || accountType === 'liability' ? '_' : ''}${accountType}`;
  }

  // تحليلات الحسابات
  async getAccountAnalytics(accountId: string): Promise<AccountAnalytics | null> {
    // تطبيق مبسط لتحليل الحسابات
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) return null;

    return {
      account_id: accountId,
      transaction_count: 0,
      total_debits: 0,
      total_credits: 0,
      average_transaction_amount: 0,
      trending_direction: 'stable',
      month_over_month_change: 0,
      is_inactive_account: !account.is_active
    } as AccountAnalytics;
  }

  // العمليات المجمعة
  async bulkCreateAccounts(accounts: AccountFormData[]): Promise<BulkAccountOperation> {
    const operation: BulkAccountOperation = {
      operation_type: 'create',
      accounts,
      validation_results: [],
      success_count: 0,
      error_count: 0,
      errors: []
    };

    for (const account of accounts) {
      try {
        // التحقق من صحة الحساب
        const validation = await this.validateAccountStructure(
          account.account_code || '',
          account.parent_account_id
        );
        
        operation.validation_results!.push(validation);

        if (validation.valid) {
          // إنشاء الحساب
          const { error } = await supabase
            .from('chart_of_accounts')
            .insert({
              ...account,
              level: account.parent_account_id ? 2 : 1, // سيتم حسابه تلقائياً
              is_active: true,
              current_balance: account.opening_balance
            });

          if (error) throw error;
          operation.success_count!++;
        } else {
          operation.error_count!++;
          operation.errors!.push({
            account: account.account_name,
            error: validation.errors.join(', ')
          });
        }
      } catch (error) {
        operation.error_count!++;
        operation.errors!.push({
          account: account.account_name,
          error: error instanceof Error ? error.message : 'خطأ غير معروف'
        });
      }
    }

    return operation;
  }

  // تصدير دليل الحسابات
  async exportAccounts(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<Blob> {
    const accounts = await this.getAccountsTree();
    
    // تحويل إلى تنسيق مسطح للتصدير
    const flatAccounts = this.flattenAccountTree(accounts);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(flatAccounts);
      case 'excel':
        return this.exportToExcel(flatAccounts);
      case 'pdf':
        return this.exportToPDF(flatAccounts);
      default:
        throw new Error('تنسيق غير مدعوم');
    }
  }

  private flattenAccountTree(accounts: ChartOfAccountNode[]): ChartOfAccountNode[] {
    const result: ChartOfAccountNode[] = [];
    
    function flatten(nodes: ChartOfAccountNode[]) {
      for (const node of nodes) {
        result.push(node);
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      }
    }
    
    flatten(accounts);
    return result;
  }

  private async exportToCSV(accounts: ChartOfAccountNode[]): Promise<Blob> {
    const headers = ['رقم الحساب', 'اسم الحساب', 'النوع', 'المستوى', 'الرصيد الحالي', 'نشط'];
    const rows = accounts.map(acc => [
      acc.account_code,
      acc.account_name,
      acc.account_type,
      acc.level.toString(),
      acc.current_balance.toString(),
      acc.is_active ? 'نعم' : 'لا'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private async exportToExcel(accounts: ChartOfAccountNode[]): Promise<Blob> {
    // تطبيق مبسط - يمكن تحسينه باستخدام مكتبة مثل xlsx
    return this.exportToCSV(accounts);
  }

  private async exportToPDF(accounts: ChartOfAccountNode[]): Promise<Blob> {
    // تطبيق مبسط - يمكن تحسينه باستخدام مكتبة مثل jsPDF
    const content = accounts.map(acc => 
      `${acc.account_code} - ${acc.account_name} (${acc.account_type})`
    ).join('\n');
    
    return new Blob([content], { type: 'text/plain' });
  }
}

export const chartOfAccountsService = new ChartOfAccountsService();