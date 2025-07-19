
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChartOfAccount } from '@/types/accounting';

export const useAccountOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSubAccount = async (accountData: Partial<ChartOfAccount>) => {
    setLoading(true);
    
    try {
      console.log('بدء عملية إنشاء الحساب الفرعي:', accountData);

      // التحقق من البيانات المطلوبة
      if (!accountData.account_code?.trim()) {
        throw new Error('رقم الحساب مطلوب');
      }

      if (!accountData.account_name?.trim()) {
        throw new Error('اسم الحساب مطلوب');
      }

      if (!accountData.parent_account_id) {
        throw new Error('يجب اختيار الحساب الأب');
      }

      if (!accountData.account_type) {
        throw new Error('نوع الحساب مطلوب');
      }

      // التحقق من عدم وجود رقم الحساب مسبقاً
      const { data: existingAccount, error: checkError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_code', accountData.account_code.trim())
        .maybeSingle();

      if (checkError) {
        console.error('خطأ في التحقق من وجود الحساب:', checkError);
        throw new Error('خطأ في التحقق من رقم الحساب');
      }

      if (existingAccount) {
        throw new Error('رقم الحساب موجود بالفعل');
      }

      // التحقق من وجود الحساب الأب
      const { data: parentAccount, error: parentError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', accountData.parent_account_id)
        .single();

      if (parentError || !parentAccount) {
        console.error('خطأ في جلب بيانات الحساب الأب:', parentError);
        throw new Error('الحساب الأب غير موجود');
      }

      // إعداد البيانات للإدراج
      const insertData = {
        account_code: accountData.account_code.trim(),
        account_name: accountData.account_name.trim(),
        account_name_en: accountData.account_name_en || null,
        account_type: accountData.account_type,
        account_category: accountData.account_category || parentAccount.account_category,
        parent_account_id: accountData.parent_account_id,
        level: accountData.level || (parentAccount.level + 1),
        is_active: accountData.is_active ?? true,
        allow_posting: accountData.allow_posting ?? true,
        opening_balance: accountData.opening_balance || 0,
        current_balance: accountData.current_balance || accountData.opening_balance || 0,
        notes: accountData.notes?.trim() || null,
      };

      console.log('بيانات الإدراج:', insertData);

      // إدراج الحساب الجديد
      const { data: newAccount, error: insertError } = await supabase
        .from('chart_of_accounts')
        .insert([insertData])
        .select('*')
        .single();

      if (insertError) {
        console.error('خطأ في إدراج الحساب:', insertError);
        
        // معالجة أخطاء معينة
        if (insertError.code === '23505') {
          throw new Error('رقم الحساب موجود بالفعل');
        } else if (insertError.code === '23503') {
          throw new Error('الحساب الأب المحدد غير صحيح');
        } else if (insertError.message.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لإنشاء الحسابات');
        } else {
          throw new Error('فشل في حفظ البيانات: ' + insertError.message);
        }
      }

      if (!newAccount) {
        throw new Error('لم يتم إنشاء الحساب بنجاح');
      }

      console.log('تم إنشاء الحساب بنجاح:', newAccount);

      toast({
        title: "تم الإنشاء بنجاح",
        description: `تم إنشاء الحساب "${newAccount.account_name}" برقم ${newAccount.account_code}`,
      });

      return newAccount;

    } catch (error) {
      console.error('خطأ في إنشاء الحساب الفرعي:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      
      toast({
        title: "خطأ في الإنشاء",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (accountId: string, updates: Partial<ChartOfAccount>) => {
    setLoading(true);
    
    try {
      console.log('بدء عملية تحديث الحساب:', accountId, updates);

      const { data: updatedAccount, error } = await supabase
        .from('chart_of_accounts')
        .update(updates)
        .eq('id', accountId)
        .select('*')
        .single();

      if (error) {
        console.error('خطأ في تحديث الحساب:', error);
        throw new Error('فشل في تحديث الحساب: ' + error.message);
      }

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث الحساب "${updatedAccount.account_name}"`,
      });

      return updatedAccount;

    } catch (error) {
      console.error('خطأ في تحديث الحساب:', error);
      
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
      console.log('بدء عملية حذف الحساب:', accountId);

      // التحقق من وجود حسابات فرعية
      const { data: childAccounts, error: childError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('parent_account_id', accountId);

      if (childError) {
        console.error('خطأ في التحقق من الحسابات الفرعية:', childError);
        throw new Error('خطأ في التحقق من الحسابات الفرعية');
      }

      if (childAccounts && childAccounts.length > 0) {
        throw new Error('لا يمكن حذف الحساب لوجود حسابات فرعية');
      }

      // حذف الحساب
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('خطأ في حذف الحساب:', error);
        throw new Error('فشل في حذف الحساب: ' + error.message);
      }

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الحساب بنجاح",
      });

    } catch (error) {
      console.error('خطأ في حذف الحساب:', error);
      
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
