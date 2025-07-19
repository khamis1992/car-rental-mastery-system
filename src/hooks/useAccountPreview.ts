
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChartOfAccount } from '@/types/accounting';
import { previewNextAccountCode, AccountNumberPattern } from '@/utils/accountNumberGenerator';

interface AccountPreview {
  nextCode: string | null;
  pattern: AccountNumberPattern | null;
  loading: boolean;
  error: string | null;
}

export const useAccountPreview = (parentAccount: ChartOfAccount | null) => {
  const [preview, setPreview] = useState<AccountPreview>({
    nextCode: null,
    pattern: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!parentAccount) {
      setPreview({
        nextCode: null,
        pattern: null,
        loading: false,
        error: null
      });
      return;
    }

    const fetchPreview = async () => {
      setPreview(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Get existing sub-account codes
        const { data: existingSubAccounts, error } = await supabase
          .from('chart_of_accounts')
          .select('account_code')
          .eq('parent_account_id', parentAccount.id)
          .order('account_code');

        if (error) {
          throw new Error('فشل في جلب الحسابات الموجودة');
        }

        const existingCodes = existingSubAccounts?.map(acc => acc.account_code) || [];
        
        // Generate preview
        const { code, pattern } = previewNextAccountCode(parentAccount, existingCodes);
        
        setPreview({
          nextCode: code,
          pattern,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('خطأ في معاينة رقم الحساب:', error);
        setPreview({
          nextCode: null,
          pattern: null,
          loading: false,
          error: error instanceof Error ? error.message : 'خطأ غير معروف'
        });
      }
    };

    fetchPreview();
  }, [parentAccount]);

  return preview;
};
