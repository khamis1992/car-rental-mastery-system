import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Building2, CheckCircle, XCircle, RefreshCw, Database, Shield, Users } from "lucide-react";

interface TenantInfo {
  id: string;
  name: string;
  accounts_count: number;
  status: string;
  created_at: string;
}

interface AccountStats {
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
  total: number;
}

export const TenantAccountsIsolationTest: React.FC = () => {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenantStats, setCurrentTenantStats] = useState<AccountStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  // تحميل بيانات المؤسسات والحسابات
  const loadTenantsData = async () => {
    try {
      setIsLoading(true);

      // جلب بيانات المؤسسات مع عدد الحسابات
      const { data: tenantsData, error: tenantsError } = await supabase
        .rpc('get_tenants_with_accounts_count');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // جلب إحصائيات الحسابات للمؤسسة الحالية
      if (currentTenant?.id) {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_tenant_accounts_stats', { tenant_id_param: currentTenant.id });

        if (statsError) throw statsError;
        // تحويل المصفوفة إلى كائن واحد أو أخذ العنصر الأول
        if (Array.isArray(statsData) && statsData.length > 0) {
          setCurrentTenantStats(statsData[0] as AccountStats);
        } else if (statsData && !Array.isArray(statsData)) {
          setCurrentTenantStats(statsData as AccountStats);
        }
      }

    } catch (error: any) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحميل بيانات المؤسسات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // اختبار إضافة الحسابات الافتراضية للمؤسسة الحالية
  const testAddDefaultAccounts = async () => {
    if (!currentTenant?.id) {
      toast({
        title: "خطأ",
        description: "لا توجد مؤسسة محددة حالياً",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('setup_tenant_default_accounts', { tenant_id_param: currentTenant.id });

      if (error) throw error;

      setTestResults(data);
      
      toast({
        title: "نجح الاختبار!",
        description: `تم إضافة ${(data as any)?.total_accounts_added || 0} حساب افتراضي`,
      });

      // إعادة تحميل البيانات
      await loadTenantsData();

    } catch (error: any) {
      console.error('خطأ في اختبار إضافة الحسابات:', error);
      toast({
        title: "فشل الاختبار",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // اختبار عزل البيانات بين المؤسسات
  const testDataIsolation = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .rpc('test_tenant_data_isolation');

      if (error) throw error;

      setTestResults(data);
      
      toast({
        title: "اكتمل اختبار العزل",
        description: `تم اختبار ${(data as any)?.tenants_tested || 0} مؤسسة`,
      });

    } catch (error: any) {
      console.error('خطأ في اختبار العزل:', error);
      toast({
        title: "فشل اختبار العزل",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantsData();
  }, [currentTenant]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            اختبار عزل المؤسسات ونظام الحسابات الافتراضية
          </h2>
          <p className="text-muted-foreground mt-1">
            التحقق من عمل نظام العزل بين المؤسسات والحسابات الافتراضية
          </p>
        </div>
        <Button
          onClick={loadTenantsData}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* المؤسسة الحالية */}
      {currentTenant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              المؤسسة الحالية
            </CardTitle>
            <CardDescription>
              {currentTenant.name} - ID: {currentTenant.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTenantStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentTenantStats.assets}</div>
                  <div className="text-sm text-muted-foreground">الأصول</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentTenantStats.liabilities}</div>
                  <div className="text-sm text-muted-foreground">الالتزامات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentTenantStats.equity}</div>
                  <div className="text-sm text-muted-foreground">حقوق الملكية</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentTenantStats.revenue}</div>
                  <div className="text-sm text-muted-foreground">الإيرادات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentTenantStats.expenses}</div>
                  <div className="text-sm text-muted-foreground">المصروفات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{currentTenantStats.total}</div>
                  <div className="text-sm text-muted-foreground">المجموع</div>
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex gap-2">
              <Button
                onClick={testAddDefaultAccounts}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                اختبار إضافة الحسابات الافتراضية
              </Button>
              
              <Button
                onClick={testDataIsolation}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                اختبار عزل البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جميع المؤسسات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            جميع المؤسسات في النظام
          </CardTitle>
          <CardDescription>
            عرض جميع المؤسسات وعدد الحسابات لكل منها للتحقق من العزل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`p-4 border rounded-lg ${
                  tenant.id === currentTenant?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {tenant.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      تم الإنشاء: {new Date(tenant.created_at).toLocaleDateString('ar-KW')}
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                    >
                      {tenant.status === 'active' ? 'نشط' : tenant.status}
                    </Badge>
                    <div className="text-sm mt-1">
                      <span className="font-bold text-blue-600">{tenant.accounts_count}</span> حساب
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* نتائج الاختبار */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              نتائج الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* معلومات النظام */}
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          <strong>نظام العزل النشط:</strong> كل مؤسسة معزولة تماماً عن الأخرى. 
          الحسابات الافتراضية تُطبق تلقائياً عند إنشاء مؤسسة جديدة، 
          وأي تعديل في مؤسسة لا يؤثر على المؤسسات الأخرى.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 