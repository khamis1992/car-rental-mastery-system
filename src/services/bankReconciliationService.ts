import { supabase } from '@/integrations/supabase/client';
import type { 
  BankReconciliationImport, 
  ImportedBankTransaction, 
  BankReconciliationMatch,
  BankReconciliationReport,
  ImportFileData,
  MatchSuggestion
} from '@/types/bankReconciliation';

export class BankReconciliationService {
  // استيراد المعاملات البنكية
  static async importBankTransactions(
    bankAccountId: string,
    fileData: ImportFileData,
    fileName: string,
    fileSize: number
  ): Promise<BankReconciliationImport> {
    // إنشاء سجل الاستيراد
    const { data: importRecord, error: importError } = await supabase
      .from('bank_reconciliation_imports')
      .insert({
        bank_account_id: bankAccountId,
        file_name: fileName,
        file_size: fileSize,
        total_transactions: fileData.transactions.length,
        import_status: 'processing',
        tenant_id: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();

    if (importError) throw new Error(`خطأ في إنشاء سجل الاستيراد: ${importError.message}`);

    try {
      // إدراج المعاملات
      const transactionsToInsert = fileData.transactions.map(transaction => ({
        import_id: importRecord.id,
        bank_account_id: bankAccountId,
        transaction_date: transaction.date,
        description: transaction.description,
        reference_number: transaction.reference,
        debit_amount: transaction.debit,
        credit_amount: transaction.credit,
        balance_after: transaction.balance,
        tenant_id: importRecord.tenant_id
      }));

      const { error: transactionsError } = await supabase
        .from('imported_bank_transactions')
        .insert(transactionsToInsert);

      if (transactionsError) throw transactionsError;

      // تحديث حالة الاستيراد
      const { data: updatedImport, error: updateError } = await supabase
        .from('bank_reconciliation_imports')
        .update({ 
          import_status: 'completed',
          unmatched_transactions: fileData.transactions.length
        })
        .eq('id', importRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedImport as BankReconciliationImport;
    } catch (error) {
      // في حالة الخطأ، تحديث حالة الاستيراد
      await supabase
        .from('bank_reconciliation_imports')
        .update({ import_status: 'failed' })
        .eq('id', importRecord.id);
      
      throw error;
    }
  }

  // جلب المعاملات المستوردة
  static async getImportedTransactions(importId: string): Promise<ImportedBankTransaction[]> {
    const { data, error } = await supabase
      .from('imported_bank_transactions')
      .select('*')
      .eq('import_id', importId)
      .order('transaction_date', { ascending: false });

    if (error) throw new Error(`خطأ في جلب المعاملات المستوردة: ${error.message}`);
    return (data || []) as ImportedBankTransaction[];
  }

  // البحث عن مطابقات محتملة
  static async findPotentialMatches(transactionId: string): Promise<MatchSuggestion[]> {
    // جلب تفاصيل المعاملة
    const { data: transaction, error: transactionError } = await supabase
      .from('imported_bank_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError) throw transactionError;

    // البحث في القيود المحاسبية عن مطابقات محتملة
    const amount = transaction.debit_amount || transaction.credit_amount;
    const { data: journalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select(`
        id,
        total_debit,
        total_credit,
        description,
        entry_date,
        reference_id
      `)
      .gte('entry_date', new Date(new Date(transaction.transaction_date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('entry_date', new Date(new Date(transaction.transaction_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('status', 'posted');

    if (journalError) throw journalError;

    // حساب المطابقات بناءً على المبلغ والتاريخ والوصف
    const suggestions: MatchSuggestion[] = [{
      imported_transaction: transaction as ImportedBankTransaction,
      suggested_matches: (journalEntries || []).map(entry => {
        let confidence = 0;
        const reasons: string[] = [];

        // مطابقة المبلغ
        const entryAmount = entry.total_debit || entry.total_credit;
        if (Math.abs(entryAmount - amount) < 0.01) {
          confidence += 0.6;
          reasons.push('مطابقة المبلغ بدقة');
        } else if (Math.abs(entryAmount - amount) / amount < 0.05) {
          confidence += 0.3;
          reasons.push('مطابقة المبلغ تقريبياً');
        }

        // مطابقة الوصف
        const transactionDesc = transaction.description.toLowerCase();
        const entryDesc = entry.description.toLowerCase();
        
        if (transactionDesc.includes(entryDesc) || entryDesc.includes(transactionDesc)) {
          confidence += 0.3;
          reasons.push('مطابقة الوصف');
        }

        // مطابقة المرجع
        if (transaction.reference_number && entry.reference_id && 
            transaction.reference_number === entry.reference_id) {
          confidence += 0.1;
          reasons.push('مطابقة المرجع');
        }

        return {
          journal_entry_id: entry.id,
          confidence: Math.min(confidence, 1),
          reasons
        };
      }).filter(match => match.confidence > 0.2)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
    }];

    return suggestions;
  }

  // إنشاء مطابقة يدوية
  static async createManualMatch(
    importedTransactionId: string,
    journalEntryId: string,
    matchAmount: number,
    notes?: string
  ): Promise<BankReconciliationMatch> {
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('bank_reconciliation_matches')
      .insert({
        imported_transaction_id: importedTransactionId,
        journal_entry_id: journalEntryId,
        match_amount: matchAmount,
        match_type: 'manual',
        matched_by: user.user?.id || '',
        tenant_id: user.user?.id || '',
        notes
      })
      .select()
      .single();

    if (error) throw new Error(`خطأ في إنشاء المطابقة: ${error.message}`);

    // تحديث حالة المعاملة المستوردة
    await supabase
      .from('imported_bank_transactions')
      .update({ 
        is_matched: true,
        matched_journal_entry_id: journalEntryId,
        match_type: 'manual',
        matched_at: new Date().toISOString()
      })
      .eq('id', importedTransactionId);

    return data as BankReconciliationMatch;
  }

  // إزالة المطابقة
  static async removeMatch(matchId: string): Promise<void> {
    // جلب تفاصيل المطابقة
    const { data: match, error: matchError } = await supabase
      .from('bank_reconciliation_matches')
      .select('imported_transaction_id')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    // حذف المطابقة
    const { error: deleteError } = await supabase
      .from('bank_reconciliation_matches')
      .delete()
      .eq('id', matchId);

    if (deleteError) throw deleteError;

    // تحديث حالة المعاملة المستوردة
    await supabase
      .from('imported_bank_transactions')
      .update({ 
        is_matched: false,
        matched_journal_entry_id: null,
        match_type: null,
        matched_at: null
      })
      .eq('id', match.imported_transaction_id);
  }

  // إنشاء تقرير المطابقة البنكية
  static async createReconciliationReport(
    bankAccountId: string,
    reconciliationDate: string,
    reportData: Partial<BankReconciliationReport>
  ): Promise<BankReconciliationReport> {
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('bank_reconciliation_reports')
      .insert({
        bank_account_id: bankAccountId,
        reconciliation_date: reconciliationDate,
        prepared_by: user.user?.id || '',
        tenant_id: user.user?.id || '',
        ...reportData
      })
      .select()
      .single();

    if (error) throw new Error(`خطأ في إنشاء تقرير المطابقة: ${error.message}`);
    return data as BankReconciliationReport;
  }

  // جلب تقارير المطابقة
  static async getReconciliationReports(bankAccountId?: string): Promise<BankReconciliationReport[]> {
    let query = supabase
      .from('bank_reconciliation_reports')
      .select('*')
      .order('reconciliation_date', { ascending: false });

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`خطأ في جلب تقارير المطابقة: ${error.message}`);
    return (data || []) as BankReconciliationReport[];
  }

  // جلب إحصائيات المطابقة
  static async getReconciliationStatistics(bankAccountId: string): Promise<any> {
    // جلب آخر استيراد
    const { data: lastImport } = await supabase
      .from('bank_reconciliation_imports')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastImport) {
      return {
        total_imported: 0,
        total_matched: 0,
        total_unmatched: 0,
        matching_percentage: 0,
        total_variance: 0
      };
    }

    // جلب إحصائيات المطابقة
    const { data: matchedCount } = await supabase
      .from('imported_bank_transactions')
      .select('id', { count: 'exact' })
      .eq('import_id', lastImport.id)
      .eq('is_matched', true);

    const { data: unmatchedCount } = await supabase
      .from('imported_bank_transactions')
      .select('id', { count: 'exact' })
      .eq('import_id', lastImport.id)
      .eq('is_matched', false);

    const totalMatched = matchedCount?.length || 0;
    const totalUnmatched = unmatchedCount?.length || 0;
    const totalImported = totalMatched + totalUnmatched;

    return {
      total_imported: totalImported,
      total_matched: totalMatched,
      total_unmatched: totalUnmatched,
      matching_percentage: totalImported > 0 ? (totalMatched / totalImported) * 100 : 0,
      total_variance: 0, // يمكن حسابه من التقارير
      last_reconciliation_date: lastImport.created_at
    };
  }

  // تحليل ملف CSV
  static parseCSVFile(file: File): Promise<ImportFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          const transactions = [];

          // تخطي الصف الأول (العناوين)
          for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            if (columns.length >= 4) {
              transactions.push({
                date: columns[0]?.trim(),
                description: columns[1]?.trim(),
                reference: columns[2]?.trim(),
                debit: parseFloat(columns[3]?.trim()) || 0,
                credit: parseFloat(columns[4]?.trim()) || 0,
                balance: parseFloat(columns[5]?.trim()) || undefined
              });
            }
          }

          resolve({ transactions });
        } catch (error) {
          reject(new Error('خطأ في تحليل ملف CSV'));
        }
      };
      reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
      reader.readAsText(file);
    });
  }
}