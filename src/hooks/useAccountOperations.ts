
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChartOfAccount } from '@/types/accounting';
import { generateNextSubAccountCode, validateAccountCode } from '@/utils/accountNumberGenerator';
import { useUnifiedErrorHandling } from './useUnifiedErrorHandling';

export const useAccountOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const { execute, handleError } = useUnifiedErrorHandling({
    context: 'عمليات الحسابات المحاسبية',
    showToast: true,
    loadingKey: 'account-operations'
  });

  // Helper function to get existing sub-account codes
  const getExistingSubAccountCodes = async (parentAccount: ChartOfAccount): Promise<string[]> => {
    console.log('🔍 جلب الحسابات الفرعية الموجودة للحساب الأب:', parentAccount.account_code);
    
    const { data: existingSubAccounts, error } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .eq('parent_account_id', parentAccount.id)
      .order('account_code');

    if (error) {
      console.error('❌ خطأ في جلب الحسابات الفرعية الموجودة:', error);
      throw new Error('فشل في جلب الحسابات الفرعية الموجودة');
    }

    const codes = existingSubAccounts?.map(acc => acc.account_code) || [];
    console.log('📊 الحسابات الفرعية الموجودة:', codes);
    return codes;
  };

  // Enhanced validation function
  const validateAccountData = (accountData: Partial<ChartOfAccount>, parentAccount: ChartOfAccount, existingCodes: string[]) => {
    const errors: string[] = [];

    if (!accountData.account_name?.trim()) {
      errors.push('اسم الحساب مطلوب');
    }

    if (!accountData.account_type) {
      errors.push('نوع الحساب مطلوب');
    }

    // Validate account code if provided
    if (accountData.account_code) {
      const validation = validateAccountCode(accountData.account_code, parentAccount, existingCodes);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  };

  const createSubAccount = async (accountData: Partial<ChartOfAccount>) => {
    // Basic validation
    if (!accountData.parent_account_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب اختيار الحساب الأب",
        variant: "destructive",
      });
      return;
    }

    return await execute(async () => {
      console.log('🚀 بدء عملية إنشاء الحساب الفرعي:', accountData);

      // Get parent account details
      const { data: parentAccount, error: parentError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', accountData.parent_account_id)
        .single();

      if (parentError || !parentAccount) {
        console.error('❌ خطأ في جلب بيانات الحساب الأب:', parentError);
        throw new Error('الحساب الأب غير موجود أو غير صحيح');
      }

      console.log('📋 بيانات الحساب الأب:', parentAccount);

      // Get existing sub-account codes
      const existingCodes = await getExistingSubAccountCodes(parentAccount as ChartOfAccount);

      // Always generate account code automatically (no manual input)
      const accountCode = generateNextSubAccountCode(parentAccount as ChartOfAccount, existingCodes);
      console.log('🔢 تم توليد رقم الحساب تلقائياً:', accountCode);

      // Validate account data (without account_code since it's auto-generated)
      const validatedData = { 
        ...accountData, 
        account_code: accountCode,
        account_type: accountData.account_type as ChartOfAccount['account_type']
      };
      validateAccountData(validatedData as ChartOfAccount, parentAccount as ChartOfAccount, existingCodes);

      // Check for duplicate account code in database (double-check)
      const { data: existingAccount, error: checkError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_code', accountCode)
        .eq('tenant_id', parentAccount.tenant_id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ خطأ في التحقق من وجود الحساب:', checkError);
        throw new Error('خطأ في التحقق من رقم الحساب');
      }

      if (existingAccount) {
        throw new Error(`رقم الحساب ${accountCode} موجود بالفعل`);
      }

      // Prepare data for insertion
      const insertData = {
        account_code: accountCode,
        account_name: accountData.account_name!.trim(),
        account_name_en: accountData.account_name_en?.trim() || null,
        account_type: accountData.account_type as ChartOfAccount['account_type'],
        account_category: accountData.account_category || parentAccount.account_category,
        parent_account_id: parentAccount.id,
        level: parentAccount.level + 1,
        is_active: accountData.is_active ?? true,
        allow_posting: accountData.allow_posting ?? true,
        opening_balance: accountData.opening_balance || 0,
        current_balance: accountData.current_balance || accountData.opening_balance || 0,
        notes: accountData.notes?.trim() || null,
        tenant_id: parentAccount.tenant_id,
        created_by: null, // Will be set by database trigger
      };

      console.log('📝 بيانات الإدراج النهائية:', insertData);

      // Insert the new account
      const { data: newAccount, error: insertError } = await supabase
        .from('chart_of_accounts')
        .insert([insertData])
        .select('*')
        .single();

      if (insertError) {
        console.error('❌ خطأ في إدراج الحساب:', insertError);
        
        // Enhanced error handling
        if (insertError.code === '23505') {
          throw new Error('رقم الحساب موجود بالفعل');
        } else if (insertError.code === '23503') {
          throw new Error('الحساب الأب المحدد غير صحيح');
        } else if (insertError.message.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لإنشاء الحسابات في هذه المؤسسة');
        } else if (insertError.message.includes('tenant_id')) {
          throw new Error('خطأ في معرف المؤسسة - يرجى إعادة تسجيل الدخول');
        } else {
          throw new Error(`فشل في حفظ البيانات: ${insertError.message}`);
        }
      }

      if (!newAccount) {
        throw new Error('لم يتم إنشاء الحساب بنجاح - البيانات المُرجعة فارغة');
      }

      console.log('✅ تم إنشاء الحساب بنجاح:', newAccount);

      toast({
        title: "تم الإنشاء بنجاح",
        description: `تم إنشاء الحساب "${newAccount.account_name}" برقم ${newAccount.account_code}`,
      });

      return newAccount;
    });
  };

  const updateAccount = async (accountId: string, updates: Partial<ChartOfAccount>) => {
    setLoading(true);
    
    try {
      console.log('🔄 بدء عملية تحديث الحساب:', accountId, updates);

      const { data: updatedAccount, error } = await supabase
        .from('chart_of_accounts')
        .update(updates)
        .eq('id', accountId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ خطأ في تحديث الحساب:', error);
        throw new Error('فشل في تحديث الحساب: ' + error.message);
      }

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث الحساب "${updatedAccount.account_name}"`,
      });

      return updatedAccount;

    } catch (error) {
      console.error('💥 خطأ في تحديث الحساب:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      
      toast({
        title: "خطأ في التحديث",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    setLoading(true);
    
    try {
      console.log('🗑️ بدء عملية حذف الحساب:', accountId);

      // Get account details before deletion for better error messages
      const { data: accountToDelete, error: fetchError } = await supabase
        .from('chart_of_accounts')
        .select('account_name, account_code, id')
        .eq('id', accountId)
        .single();

      if (fetchError || !accountToDelete) {
        console.error('❌ خطأ في جلب بيانات الحساب:', fetchError);
        throw new Error('الحساب غير موجود');
      }

      console.log('📋 بيانات الحساب المراد حذفه:', accountToDelete);

      // Check for sub-accounts
      const { data: childAccounts, error: childError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_code')
        .eq('parent_account_id', accountId);

      if (childError) {
        console.error('❌ خطأ في التحقق من الحسابات الفرعية:', childError);
        throw new Error('خطأ في التحقق من الحسابات الفرعية');
      }

      if (childAccounts && childAccounts.length > 0) {
        console.log('⚠️ يوجد حسابات فرعية:', childAccounts);
        throw new Error(`لا يمكن حذف الحساب "${accountToDelete.account_name}" لوجود ${childAccounts.length} حساب فرعي`);
      }

      // Check for journal entries
      const { data: journalEntryLines, error: journalError } = await supabase
        .from('journal_entry_lines')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);

      if (journalError) {
        console.error('❌ خطأ في التحقق من القيود المحاسبية:', journalError);
        throw new Error('خطأ في التحقق من القيود المحاسبية');
      }

      if (journalEntryLines && journalEntryLines.length > 0) {
        throw new Error(`لا يمكن حذف الحساب "${accountToDelete.account_name}" لوجود قيود محاسبية مرتبطة به`);
      }

      console.log('✅ التحقق من الشروط مكتمل، يمكن حذف الحساب');

      // Delete the account - the trigger should handle the audit log correctly now
      const { error: deleteError } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) {
        console.error('❌ خطأ في حذف الحساب:', deleteError);
        
        // Enhanced error handling
        if (deleteError.code === '23503') {
          throw new Error('لا يمكن حذف الحساب لوجود بيانات مرتبطة به');
        } else if (deleteError.message.includes('violates foreign key constraint')) {
          throw new Error('لا يمكن حذف الحساب لوجود بيانات مرتبطة به في النظام');
        } else {
          throw new Error(`فشل في حذف الحساب: ${deleteError.message}`);
        }
      }

      console.log('✅ تم حذف الحساب بنجاح');

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الحساب "${accountToDelete.account_name}" (${accountToDelete.account_code}) بنجاح`,
      });

    } catch (error) {
      console.error('💥 خطأ في حذف الحساب:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      
      toast({
        title: "خطأ في الحذف",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubAccount,
    updateAccount,
    deleteAccount,
    loading
  };
};
