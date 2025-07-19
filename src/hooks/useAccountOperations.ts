
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChartOfAccount } from '@/types/accounting';
import { generateNextSubAccountCode, validateAccountCode } from '@/utils/accountNumberGenerator';

export const useAccountOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    setLoading(true);
    
    try {
      console.log('🚀 بدء عملية إنشاء الحساب الفرعي:', accountData);

      // Basic validation
      if (!accountData.parent_account_id) {
        throw new Error('يجب اختيار الحساب الأب');
      }

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

      // Generate account code if not provided
      let accountCode = accountData.account_code?.trim();
      if (!accountCode) {
        accountCode = generateNextSubAccountCode(parentAccount as ChartOfAccount, existingCodes);
        console.log('🔢 تم توليد رقم الحساب تلقائياً:', accountCode);
      }

      // Validate account data
      const validatedData = { 
        ...accountData, 
        account_code: accountCode,
        account_type: accountData.account_type as ChartOfAccount['account_type']
      };
      validateAccountData(validatedData as ChartOfAccount, parentAccount as ChartOfAccount, existingCodes);

      // Check for duplicate account code in database
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

    } catch (error) {
      console.error('💥 خطأ في إنشاء الحساب الفرعي:', error);
      
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "خطأ في الإنشاء",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
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

      // Check for sub-accounts
      const { data: childAccounts, error: childError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('parent_account_id', accountId);

      if (childError) {
        console.error('❌ خطأ في التحقق من الحسابات الفرعية:', childError);
        throw new Error('خطأ في التحقق من الحسابات الفرعية');
      }

      if (childAccounts && childAccounts.length > 0) {
        throw new Error('لا يمكن حذف الحساب لوجود حسابات فرعية');
      }

      // Delete the account
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('❌ خطأ في حذف الحساب:', error);
        throw new Error('فشل في حذف الحساب: ' + error.message);
      }

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الحساب بنجاح",
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
