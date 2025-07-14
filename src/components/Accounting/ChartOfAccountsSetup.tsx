import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Database, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SetupStatus {
  has_accounts: boolean;
  account_count: number;
  last_setup: string | null;
}

export const ChartOfAccountsSetup = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  
  // For now, hide super admin features - can be enabled based on user role checking
  const isSuperAdmin = false;

  // Query to check current setup status
  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['chart-setup-status'],
    queryFn: async (): Promise<SetupStatus> => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        has_accounts: (data?.length || 0) > 0,
        account_count: data?.length || 0,
        last_setup: data?.[0]?.created_at || null
      };
    }
  });

  // Mutation to setup comprehensive chart of accounts
  const setupMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Get current tenant ID from function
      const { data: currentTenant, error: tenantError } = await supabase.rpc('get_current_tenant_id');
      if (tenantError || !currentTenant) throw new Error('Cannot determine current tenant');

      // Call the comprehensive setup function
      const { data: assetsData, error: assetsError } = await supabase.rpc('setup_comprehensive_chart_of_accounts', {
        tenant_id_param: currentTenant
      });

      if (assetsError) throw assetsError;

      // Add remaining accounts
      const { data: otherData, error: otherError } = await supabase.rpc('complete_liabilities_equity_revenue_expenses', {
        tenant_id_param: currentTenant
      });

      if (otherError) throw otherError;
      
      return assetsData + otherData;
    },
    onSuccess: (totalAccounts) => {
      toast.success(`تم إنشاء دليل الحسابات الشامل بنجاح (${totalAccounts} حساب)`);
      queryClient.invalidateQueries({ queryKey: ['chart-setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في إعداد دليل الحسابات الشامل: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Mutation to apply comprehensive chart to all tenants (super admin only)
  const applyAllTenantsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('apply_comprehensive_default_chart');
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      toast.success(`تم تطبيق دليل الحسابات على جميع المؤسسات (${result.total_accounts_created} حساب)`);
      queryClient.invalidateQueries({ queryKey: ['chart-setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في تطبيق دليل الحسابات على جميع المؤسسات: ${error.message}`);
    }
  });

  // Mutation to migrate account balances
  const migrateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('migrate_account_balances');
      if (error) throw error;
      return data as any;
    },
    onSuccess: (result: any) => {
      toast.success(`تم تحديث ${result?.affected_accounts || 0} حساب بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في تحديث الأرصدة: ${error.message}`);
    }
  });

  // Mutation to validate trial balance
  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('validate_trial_balance');
      if (error) throw error;
      return data as any;
    },
    onSuccess: (result: any) => {
      if (result?.is_balanced) {
        toast.success('الميزانية متوازنة بنجاح');
      } else {
        toast.error(`الميزانية غير متوازنة - الفرق: ${result?.difference || 'غير محدد'}`);
      }
    },
    onError: (error: any) => {
      toast.error(`خطأ في التحقق من الميزانية: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin ml-2" />
          <span>جاري تحميل حالة الإعداد...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Database className="w-5 h-5" />
            إعداد دليل الحسابات الشامل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {setupStatus?.account_count || 0}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الحسابات</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Badge 
                variant={setupStatus?.has_accounts ? "default" : "secondary"}
                className="text-sm"
              >
                {setupStatus?.has_accounts ? "مُعد" : "غير مُعد"}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">حالة الإعداد</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium">
                {setupStatus?.last_setup 
                  ? new Date(setupStatus.last_setup).toLocaleDateString('ar-KW')
                  : 'لم يتم'
                }
              </div>
              <div className="text-sm text-muted-foreground">آخر إعداد</div>
            </div>
          </div>

          {/* Status Alert */}
          {!setupStatus?.has_accounts ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لم يتم إعداد دليل الحسابات بعد. يرجى تشغيل الإعداد المحسن لإنشاء هيكل محاسبي شامل.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                تم إعداد دليل الحسابات. يمكنك تحديث الأرصدة أو التحقق من توازن الميزانية.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={isProcessing || setupMutation.isPending}
              size="lg"
              className="btn-primary"
            >
              {(isProcessing || setupMutation.isPending) && (
                <RefreshCw className="w-4 h-4 animate-spin ml-2" />
              )}
              {setupStatus?.has_accounts ? 'إعادة إعداد دليل الحسابات' : 'إعداد دليل الحسابات المحسن'}
            </Button>

            {setupStatus?.has_accounts && (
              <>
                <Button
                  onClick={() => migrateMutation.mutate()}
                  disabled={migrateMutation.isPending}
                  variant="outline"
                >
                  {migrateMutation.isPending && (
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                  )}
                  تحديث أرصدة الحسابات
                </Button>

                <Button
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                  variant="outline"
                >
                  {validateMutation.isPending && (
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                  )}
                  التحقق من توازن الميزانية
                </Button>
              </>
            )}
          </div>

          {/* Features List */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-right">مميزات دليل الحسابات المحسن:</h4>
            <ul className="space-y-2 text-sm text-right">
              <li className="flex items-center gap-2 flex-row-reverse">
                <CheckCircle className="w-4 h-4 text-green-500" />
                هيكل محاسبي شامل ومتكامل
              </li>
              <li className="flex items-center gap-2 flex-row-reverse">
                <CheckCircle className="w-4 h-4 text-green-500" />
                حسابات مخصصة لشركات تأجير السيارات
              </li>
              <li className="flex items-center gap-2 flex-row-reverse">
                <CheckCircle className="w-4 h-4 text-green-500" />
                تصنيف دقيق للأصول والالتزامات والإيرادات
              </li>
              <li className="flex items-center gap-2 flex-row-reverse">
                <CheckCircle className="w-4 h-4 text-green-500" />
                إدارة محسنة للبنوك والصناديق
              </li>
              <li className="flex items-center gap-2 flex-row-reverse">
                <CheckCircle className="w-4 h-4 text-green-500" />
                حسابات تفصيلية للمصروفات التشغيلية والإدارية
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Section */}
      {isSuperAdmin && (
        <Card className="card-elegant border-destructive">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-destructive">
              <Users className="w-5 h-5" />
              إعدادات المدير العام - تطبيق على جميع المؤسسات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>تحذير:</strong> هذه العملية ستطبق دليل الحسابات الشامل على جميع المؤسسات في النظام.
                سيتم حذف جميع الحسابات الموجودة واستبدالها بالهيكل الجديد.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                onClick={() => applyAllTenantsMutation.mutate()}
                disabled={applyAllTenantsMutation.isPending}
                variant="destructive"
                size="lg"
              >
                {applyAllTenantsMutation.isPending && (
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                )}
                تطبيق دليل الحسابات على جميع المؤسسات
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-right">ما ستقوم به هذه العملية:</h4>
              <ul className="space-y-2 text-sm text-right">
                <li className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  تطبيق دليل الحسابات الشامل على جميع المؤسسات النشطة
                </li>
                <li className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  إنشاء أكثر من 80 حساب لكل مؤسسة
                </li>
                <li className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  ضمان التوافق مع المعايير المحاسبية الكويتية
                </li>
                <li className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  إعداد الحسابات تلقائياً للمؤسسات الجديدة
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};