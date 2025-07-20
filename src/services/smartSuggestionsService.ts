
interface SmartSuggestion {
  accountId: string;
  confidence: number;
  reason: string;
}

interface TransactionContext {
  description: string;
  amount: number;
  transactionType: 'debit' | 'credit';
  counterAccountId?: string;
  previousEntries?: any[];
}

export class SmartSuggestionsService {
  private static instance: SmartSuggestionsService;
  private suggestionRules: Map<string, SmartSuggestion[]> = new Map();
  private commonPatterns: Map<string, string[]> = new Map();

  static getInstance(): SmartSuggestionsService {
    if (!SmartSuggestionsService.instance) {
      SmartSuggestionsService.instance = new SmartSuggestionsService();
    }
    return SmartSuggestionsService.instance;
  }

  constructor() {
    this.initializeCommonPatterns();
  }

  private initializeCommonPatterns() {
    // أنماط شائعة للاقتراحات
    this.commonPatterns.set('راتب', ['51101', '21201']); // مصروفات رواتب، رواتب مستحقة
    this.commonPatterns.set('إيجار', ['52101', '11101']); // مصروف إيجار، نقدية
    this.commonPatterns.set('كهرباء', ['52301', '21101']); // مصروف كهرباء، موردين
    this.commonPatterns.set('بنزين', ['52401', '11101']); // مصروف وقود، نقدية
    this.commonPatterns.set('صيانة', ['52501', '21101']); // مصروف صيانة، موردين
    this.commonPatterns.set('أتعاب', ['53101', '21101']); // أتعاب مهنية، موردين
    this.commonPatterns.set('تأمين', ['52601', '22101']); // مصروف تأمين، تأمين مدفوع مقدماً
    this.commonPatterns.set('عمولة', ['53201', '11101']); // عمولات، نقدية
    this.commonPatterns.set('مبيعات', ['41101', '11301']); // إيرادات مبيعات، عملاء
    this.commonPatterns.set('فوائد', ['43101', '11101']); // إيرادات فوائد، نقدية
  }

  /**
   * توليد اقتراحات ذكية بناءً على السياق
   */
  generateSuggestions(
    context: TransactionContext,
    accounts: any[],
    recentEntries: any[] = []
  ): string[] {
    const suggestions: SmartSuggestion[] = [];

    // 1. اقتراحات بناءً على الوصف
    const descriptionSuggestions = this.getDescriptionBasedSuggestions(context.description, accounts);
    suggestions.push(...descriptionSuggestions);

    // 2. اقتراحات بناءً على المبلغ والنمط
    const patternSuggestions = this.getPatternBasedSuggestions(context, recentEntries, accounts);
    suggestions.push(...patternSuggestions);

    // 3. اقتراحات بناءً على الحساب المقابل
    if (context.counterAccountId) {
      const counterSuggestions = this.getCounterAccountSuggestions(context.counterAccountId, accounts);
      suggestions.push(...counterSuggestions);
    }

    // 4. اقتراحات بناءً على القيود السابقة المشابهة
    const historySuggestions = this.getHistoryBasedSuggestions(context, recentEntries, accounts);
    suggestions.push(...historySuggestions);

    // ترتيب الاقتراحات حسب الثقة وإزالة المكررات
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.accountId, s])).values()
    );

    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(s => s.accountId);
  }

  private getDescriptionBasedSuggestions(description: string, accounts: any[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const lowerDescription = description.toLowerCase();

    // البحث في الأنماط المعرفة مسبقاً
    for (const [pattern, accountCodes] of this.commonPatterns.entries()) {
      if (lowerDescription.includes(pattern)) {
        accountCodes.forEach(code => {
          const account = accounts.find(acc => acc.account_code === code);
          if (account) {
            suggestions.push({
              accountId: account.id,
              confidence: 0.8,
              reason: `مطابقة نمط: ${pattern}`
            });
          }
        });
      }
    }

    // البحث بالكلمات المفتاحية في أسماء الحسابات
    const keywords = lowerDescription.split(' ').filter(word => word.length > 2);
    keywords.forEach(keyword => {
      const matchingAccounts = accounts.filter(acc => 
        acc.account_name.toLowerCase().includes(keyword)
      );
      
      matchingAccounts.forEach(account => {
        suggestions.push({
          accountId: account.id,
          confidence: 0.6,
          reason: `مطابقة كلمة مفتاحية: ${keyword}`
        });
      });
    });

    return suggestions;
  }

  private getPatternBasedSuggestions(
    context: TransactionContext, 
    recentEntries: any[], 
    accounts: any[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // اقتراحات بناءً على المبلغ المتشابه
    const similarAmountEntries = recentEntries.filter(entry => 
      Math.abs(entry.amount - context.amount) < context.amount * 0.1 // ضمن 10% من المبلغ
    );

    similarAmountEntries.forEach(entry => {
      if (entry.account_id) {
        suggestions.push({
          accountId: entry.account_id,
          confidence: 0.5,
          reason: 'مبلغ مشابه لقيود سابقة'
        });
      }
    });

    // اقتراحات بناءً على التوقيت (نفس الشهر من العام الماضي)
    const currentMonth = new Date().getMonth();
    const lastYearEntries = recentEntries.filter(entry => {
      const entryDate = new Date(entry.entry_date);
      return entryDate.getMonth() === currentMonth;
    });

    lastYearEntries.forEach(entry => {
      if (entry.account_id) {
        suggestions.push({
          accountId: entry.account_id,
          confidence: 0.4,
          reason: 'نمط شهري متكرر'
        });
      }
    });

    return suggestions;
  }

  private getCounterAccountSuggestions(counterAccountId: string, accounts: any[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const counterAccount = accounts.find(acc => acc.id === counterAccountId);
    
    if (!counterAccount) return suggestions;

    // اقتراحات بناءً على نوع الحساب المقابل
    switch (counterAccount.account_type) {
      case 'asset':
        if (counterAccount.account_code.startsWith('111')) { // نقدية
          // اقتراح حسابات المصروفات والموردين
          const expenseAccounts = accounts.filter(acc => acc.account_type === 'expense');
          const liabilityAccounts = accounts.filter(acc => acc.account_type === 'liability');
          
          [...expenseAccounts.slice(0, 3), ...liabilityAccounts.slice(0, 2)].forEach(acc => {
            suggestions.push({
              accountId: acc.id,
              confidence: 0.6,
              reason: 'حساب مناسب للمعاملات النقدية'
            });
          });
        }
        break;
        
      case 'liability':
        if (counterAccount.account_code.startsWith('211')) { // موردين
          // اقتراح حسابات المصروفات والأصول
          const expenseAccounts = accounts.filter(acc => acc.account_type === 'expense');
          const assetAccounts = accounts.filter(acc => acc.account_type === 'asset');
          
          [...expenseAccounts.slice(0, 3), ...assetAccounts.slice(0, 2)].forEach(acc => {
            suggestions.push({
              accountId: acc.id,
              confidence: 0.6,
              reason: 'حساب مناسب لمعاملات الموردين'
            });
          });
        }
        break;
    }

    return suggestions;
  }

  private getHistoryBasedSuggestions(
    context: TransactionContext, 
    recentEntries: any[], 
    accounts: any[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // البحث عن قيود مشابهة في الوصف
    const similarEntries = recentEntries.filter(entry => {
      const similarity = this.calculateStringSimilarity(
        context.description.toLowerCase(), 
        entry.description?.toLowerCase() || ''
      );
      return similarity > 0.6;
    });

    similarEntries.forEach(entry => {
      if (entry.account_id) {
        suggestions.push({
          accountId: entry.account_id,
          confidence: 0.7,
          reason: 'مطابقة وصف مشابه'
        });
      }
    });

    return suggestions;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // خوارزمية بسيطة لحساب التشابه بين النصوص
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let commonWords = 0;
    words1.forEach(word => {
      if (words2.includes(word) && word.length > 2) {
        commonWords++;
      }
    });

    return commonWords / Math.max(words1.length, words2.length);
  }

  /**
   * تعلم من القيود الجديدة لتحسين الاقتراحات
   */
  learnFromEntry(description: string, accountId: string, amount: number) {
    const key = this.extractKeyFromDescription(description);
    if (key) {
      const existing = this.suggestionRules.get(key) || [];
      const suggestion: SmartSuggestion = {
        accountId,
        confidence: 0.7,
        reason: 'تعلم من قيود سابقة'
      };
      
      existing.push(suggestion);
      this.suggestionRules.set(key, existing);
    }
  }

  private extractKeyFromDescription(description: string): string | null {
    // استخراج كلمات مفتاحية من الوصف
    const words = description.toLowerCase().split(' ');
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !['من', 'إلى', 'في', 'على', 'مع', 'بعد', 'قبل', 'هذا', 'هذه', 'ذلك', 'تلك'].includes(word)
    );
    
    return meaningfulWords.length > 0 ? meaningfulWords[0] : null;
  }

  /**
   * الحصول على إحصائيات الاستخدام للحسابات
   */
  getAccountUsageStats(recentEntries: any[]): Map<string, number> {
    const usageMap = new Map<string, number>();
    
    recentEntries.forEach(entry => {
      if (entry.account_id) {
        const current = usageMap.get(entry.account_id) || 0;
        usageMap.set(entry.account_id, current + 1);
      }
    });
    
    return usageMap;
  }
}

export const smartSuggestionsService = SmartSuggestionsService.getInstance();
