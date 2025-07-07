import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface UpdateResults {
  balances?: {
    updated_accounts: number;
  };
  payments?: {
    processed_count: number;
    error_count: number;
  };
  metrics?: {
    monthly_revenue: number;
    cash_balance: number;
    total_expenses: number;
    net_profit: number;
  };
}

export const AccountingDataRefresh = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [updateResults, setUpdateResults] = useState<UpdateResults | null>(null);
  const { toast } = useToast();

  const refreshAccountingData = async () => {
    setIsUpdating(true);
    try {
      // تحديث أرصدة الحسابات
      const { data: balanceUpdate, error: balanceError } = await supabase
        .rpc('update_account_balances');

      if (balanceError) throw balanceError;

      // معالجة القيود المحاسبية المفقودة
      const { data: paymentUpdate, error: paymentError } = await supabase
        .rpc('reprocess_missing_payment_entries');

      if (paymentError) throw paymentError;

      // تحديث أرصدة الحسابات مرة أخرى بعد معالجة المدفوعات
      await supabase.rpc('update_account_balances');

      // حساب المؤشرات المالية
      const { data: metrics, error: metricsError } = await supabase
        .rpc('calculate_financial_metrics');

      if (metricsError) throw metricsError;

      setUpdateResults({
        balances: balanceUpdate as any,
        payments: paymentUpdate as any,
        metrics: metrics as any
      });

      setLastUpdate(new Date().toLocaleString('ar-KW'));
      
      const balanceCount = (balanceUpdate as any)?.updated_accounts || 0;
      const paymentCount = (paymentUpdate as any)?.processed_count || 0;
      
      toast({
        title: 'تم التحديث بنجاح',
        description: `تم تحديث ${balanceCount} حساب و ${paymentCount} دفعة`,
      });

      // إشعار الصفحة الرئيسية بالتحديث
      window.dispatchEvent(new CustomEvent('accounting-data-updated'));

    } catch (error) {
      console.error('Error refreshing accounting data:', error);
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث البيانات المحاسبية',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          تحديث البيانات المحاسبية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rtl-flex">
          <Button 
            onClick={refreshAccountingData} 
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'جاري التحديث...' : 'تحديث البيانات'}
          </Button>
          
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              آخر تحديث: {lastUpdate}
            </div>
          )}
        </div>

        {updateResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                {updateResults.balances?.updated_accounts || 0} حساب محدث
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                {updateResults.payments?.processed_count || 0} دفعة معالجة
              </span>
            </div>
            
            {updateResults.payments?.error_count > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm">
                  {updateResults.payments.error_count} خطأ
                </span>
              </div>
            )}
          </div>
        )}

        {updateResults?.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Badge variant="secondary" className="justify-center">
              إيرادات: {updateResults.metrics.monthly_revenue.toFixed(3)} د.ك
            </Badge>
            <Badge variant="secondary" className="justify-center">
              نقدية: {updateResults.metrics.cash_balance.toFixed(3)} د.ك
            </Badge>
            <Badge variant="secondary" className="justify-center">
              مصروفات: {updateResults.metrics.total_expenses.toFixed(3)} د.ك
            </Badge>
            <Badge variant={updateResults.metrics.net_profit >= 0 ? 'default' : 'destructive'} className="justify-center">
              ربح: {updateResults.metrics.net_profit.toFixed(3)} د.ك
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};