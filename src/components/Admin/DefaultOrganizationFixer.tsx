import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, AlertTriangle, CheckCircle, RefreshCw, Shield } from "lucide-react";

interface DefaultOrgInfo {
  id: string;
  name: string;
  status: string;
  accounts_count: number;
  users_count: number;
  contracts_count: number;
}

export const DefaultOrganizationFixer: React.FC = () => {
  const [defaultOrg, setDefaultOrg] = useState<DefaultOrgInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const { toast } = useToast();

  // تحميل معلومات المؤسسة الافتراضية
  const loadDefaultOrgInfo = async () => {
    try {
      setIsLoading(true);

      // البحث عن المؤسسة الافتراضية
      const { data: orgs, error: orgsError } = await supabase
        .from('tenants')
        .select('*')
        .or('name.eq.Default Organization,name.ilike.%default%')
        .limit(1);

      if (orgsError) throw orgsError;

      if (!orgs || orgs.length === 0) {
        setDefaultOrg(null);
        return;
      }

      const org = orgs[0];

      // جلب عدد الحسابات
      const { count: accountsCount } = await supabase
        .from('chart_of_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', org.id);

      // جلب عدد المستخدمين
      const { count: usersCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', org.id);

      // جلب عدد العقود
      const { count: contractsCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', org.id);

      setDefaultOrg({
        id: org.id,
        name: org.name,
        status: org.status,
        accounts_count: accountsCount || 0,
        users_count: usersCount || 0,
        contracts_count: contractsCount || 0,
      });

    } catch (error: any) {
      console.error('خطأ في تحميل معلومات المؤسسة الافتراضية:', error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // حذف المؤسسة الافتراضية باستخدام دالة SQL
  const deleteDefaultOrganization = async () => {
    if (!defaultOrg) return;

    try {
      setIsLoading(true);
      setFixResult(null);

      // استدعاء دالة الحذف النهائي للمؤسسة الافتراضية
      const { data, error } = await supabase
        .rpc('hard_delete_tenant', {
          tenant_id_param: defaultOrg.id,
          deletion_reason: 'حذف المؤسسة الافتراضية'
        });

      if (error) {
        // إذا فشلت الدالة، نحاول الحذف اليدوي
        await manualDeleteDefaultOrg();
        return;
      }

      setFixResult(data as string);
      
      toast({
        title: "تم بنجاح!",
        description: "تم حل مشكلة المؤسسة الافتراضية",
      });

      // إعادة تحميل البيانات
      await loadDefaultOrgInfo();

    } catch (error: any) {
      console.error('خطأ في حذف المؤسسة الافتراضية:', error);
      
      // محاولة الحذف اليدوي كحل بديل
      await manualDeleteDefaultOrg();
    } finally {
      setIsLoading(false);
    }
  };

  // الحذف اليدوي كحل بديل
  const manualDeleteDefaultOrg = async () => {
    if (!defaultOrg) return;

    try {
      // حذف البيانات المرتبطة تدريجياً
      
      // 1. حذف ارتباط المستخدمين
      await supabase
        .from('tenant_users')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      // 2. حذف دليل الحسابات
      await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      // 3. حذف البيانات الأساسية
      await supabase
        .from('contracts')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      await supabase
        .from('vehicles')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      await supabase
        .from('customers')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      await supabase
        .from('employees')
        .delete()
        .eq('tenant_id', defaultOrg.id);

      // 4. حذف المؤسسة نفسها
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', defaultOrg.id);

      if (deleteError) {
        // إذا فشل الحذف، نخفي المؤسسة
        await supabase
          .from('tenants')
          .update({ 
            status: 'deleted', 
            name: '[محذوفة] ' + defaultOrg.name 
          })
          .eq('id', defaultOrg.id);

        setFixResult('تم إخفاء المؤسسة الافتراضية من الواجهة (لم يتم الحذف الكامل)');
      } else {
        setFixResult('تم حذف المؤسسة الافتراضية بالكامل');
      }

      toast({
        title: "تم الحل!",
        description: "تم التعامل مع المؤسسة الافتراضية بنجاح",
      });

      // إعادة تحميل البيانات
      await loadDefaultOrgInfo();

    } catch (error: any) {
      console.error('خطأ في الحذف اليدوي:', error);
      setFixResult('فشل في حل المشكلة: ' + error.message);
      
      toast({
        title: "فشل في الحل",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadDefaultOrgInfo();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            حل مشكلة Default Organization
          </h2>
          <p className="text-muted-foreground mt-1">
            أداة لحذف أو إخفاء المؤسسة الافتراضية التي تسبب مشاكل في النظام
          </p>
        </div>
        <Button
          onClick={loadDefaultOrgInfo}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* معلومات المؤسسة الافتراضية */}
      {defaultOrg ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              تم العثور على مؤسسة افتراضية
            </CardTitle>
            <CardDescription>
              هذه المؤسسة قد تسبب مشاكل في النظام ويُنصح بحذفها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">اسم المؤسسة</div>
                <div className="font-medium">{defaultOrg.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">الحالة</div>
                <div className="font-medium">{defaultOrg.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">عدد الحسابات</div>
                <div className="font-medium">{defaultOrg.accounts_count}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">عدد المستخدمين</div>
                <div className="font-medium">{defaultOrg.users_count}</div>
              </div>
            </div>

            <Alert className="border-red-200">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>تحذير:</strong> هذه العملية ستحذف المؤسسة الافتراضية وجميع البيانات المرتبطة بها.
                تأكد من عدم وجود بيانات مهمة قبل المتابعة.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={deleteDefaultOrganization}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف المؤسسة الافتراضية
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              النظام نظيف
            </CardTitle>
            <CardDescription>
              لا توجد مؤسسة افتراضية في النظام - كل شيء يعمل بشكل صحيح
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* نتيجة الحل */}
      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              نتيجة العملية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                {fixResult}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* إرشادات */}
      <Card>
        <CardHeader>
          <CardTitle>إرشادات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            • المؤسسة الافتراضية قد تتكون من بيانات قديمة أو تجريبية
          </div>
          <div className="text-sm text-muted-foreground">
            • حذفها سيحل مشاكل النظام ويحسن الأداء
          </div>
          <div className="text-sm text-muted-foreground">
            • إذا فشل الحذف الكامل، ستُخفى المؤسسة من الواجهة
          </div>
          <div className="text-sm text-muted-foreground">
            • العملية آمنة ولا تؤثر على المؤسسات الأخرى
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 