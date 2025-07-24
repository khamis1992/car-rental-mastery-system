import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Wrench, Database, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RepairResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export const AuthRepairTool: React.FC = () => {
  const [repairResults, setRepairResults] = useState<RepairResult[]>([]);
  const [isRepairing, setIsRepairing] = useState(false);
  const { user } = useAuth();

  const addResult = (result: RepairResult) => {
    setRepairResults(prev => [...prev, result]);
  };

  const runAuthRepair = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsRepairing(true);
    setRepairResults([]);

    try {
      // Step 1: Test current user info
      addResult({ step: 'فحص معلومات المستخدم الحالي', success: false, message: 'جاري الفحص...' });
      
      try {
        const { data: userInfo, error: userInfoError } = await supabase.rpc('get_current_user_info');
        if (userInfoError) {
          addResult({ 
            step: 'فحص معلومات المستخدم الحالي', 
            success: false, 
            message: `خطأ: ${userInfoError.message}`,
            details: userInfoError
          });
        } else {
          addResult({ 
            step: 'فحص معلومات المستخدم الحالي', 
            success: true, 
            message: 'تم بنجاح',
            details: userInfo
          });
        }
      } catch (error) {
        addResult({ 
          step: 'فحص معلومات المستخدم الحالي', 
          success: false, 
          message: `خطأ في الاتصال: ${error}`,
          details: error
        });
      }

      // Step 2: Check tenant association
      addResult({ step: 'فحص ارتباط المستخدم بالمؤسسة', success: false, message: 'جاري الفحص...' });
      
      try {
        const { data: tenantUsers, error: tenantError } = await supabase
          .from('tenant_users')
          .select('*, tenants!inner(name, status)')
          .eq('user_id', user.id);

        if (tenantError) {
          addResult({ 
            step: 'فحص ارتباط المستخدم بالمؤسسة', 
            success: false, 
            message: `خطأ: ${tenantError.message}`,
            details: tenantError
          });
        } else {
          const activeTenants = tenantUsers?.filter(tu => tu.status === 'active') || [];
          addResult({ 
            step: 'فحص ارتباط المستخدم بالمؤسسة', 
            success: activeTenants.length > 0, 
            message: `تم العثور على ${activeTenants.length} مؤسسة نشطة`,
            details: activeTenants
          });

          // Step 3: Create test user if no association found
          if (activeTenants.length === 0) {
            addResult({ step: 'إنشاء ارتباط مستخدم اختبار', success: false, message: 'جاري الإنشاء...' });
            
            try {
              const { data: createResult, error: createError } = await supabase.rpc('create_default_test_user');
              
              if (createError) {
                addResult({ 
                  step: 'إنشاء ارتباط مستخدم اختبار', 
                  success: false, 
                  message: `خطأ: ${createError.message}`,
                  details: createError
                });
              } else {
                addResult({ 
                  step: 'إنشاء ارتباط مستخدم اختبار', 
                  success: true, 
                  message: 'تم إنشاء الارتباط بنجاح',
                  details: createResult
                });
              }
            } catch (error) {
              addResult({ 
                step: 'إنشاء ارتباط مستخدم اختبار', 
                success: false, 
                message: `خطأ في الإنشاء: ${error}`,
                details: error
              });
            }
          }
        }
      } catch (error) {
        addResult({ 
          step: 'فحص ارتباط المستخدم بالمؤسسة', 
          success: false, 
          message: `خطأ في الاتصال: ${error}`,
          details: error
        });
      }

      // Step 4: Test access to important tables
      addResult({ step: 'فحص الوصول للجداول المهمة', success: false, message: 'جاري الفحص...' });
      
      const tablesToTest = [
        { name: 'chart_of_accounts', label: 'دليل الحسابات' },
        { name: 'cost_centers', label: 'مراكز التكلفة' },
        { name: 'fixed_assets', label: 'الأصول الثابتة' },
        { name: 'journal_entries', label: 'القيود المحاسبية' }
      ];

      const accessResults: any[] = [];
      
      for (const table of tablesToTest) {
        try {
          const { data, error } = await supabase
            .from(table.name as any)
            .select('id')
            .limit(1);
            
          accessResults.push({
            table: table.label,
            success: !error,
            message: error ? error.message : 'تم الوصول بنجاح',
            count: data?.length || 0
          });
        } catch (error) {
          accessResults.push({
            table: table.label,
            success: false,
            message: `خطأ في الوصول: ${error}`,
            count: 0
          });
        }
      }

      const successfulAccess = accessResults.filter(r => r.success).length;
      addResult({ 
        step: 'فحص الوصول للجداول المهمة', 
        success: successfulAccess === tablesToTest.length, 
        message: `يمكن الوصول إلى ${successfulAccess} من ${tablesToTest.length} جداول`,
        details: accessResults
      });

      // Final summary
      const successfulSteps = repairResults.filter(r => r.success).length + 1; // +1 for this step
      const totalSteps = repairResults.length + 1;
      
      toast.success(`تم إنجاز الإصلاح: ${successfulSteps}/${totalSteps} خطوات نجحت`);

    } catch (error) {
      console.error('Auth repair error:', error);
      toast.error('خطأ في عملية الإصلاح');
      addResult({ 
        step: 'إصلاح عام', 
        success: false, 
        message: `خطأ عام: ${error}`,
        details: error
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const clearResults = () => {
    setRepairResults([]);
  };

  const getStepIcon = (success: boolean, message: string) => {
    if (message.includes('جاري')) {
      return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    return success ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <AlertCircle className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="rtl-flex">
        <CardTitle className="rtl-title flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          أداة إصلاح المصادقة
        </CardTitle>
        <CardDescription>
          إصلاح مشاكل المصادقة وارتباط المستخدم بالمؤسسة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runAuthRepair} 
            disabled={isRepairing || !user}
            className="rtl-flex"
          >
            {isRepairing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            تشغيل الإصلاح
          </Button>
          {repairResults.length > 0 && (
            <Button variant="outline" onClick={clearResults} disabled={isRepairing}>
              مسح النتائج
            </Button>
          )}
        </div>

        {!user && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">يجب تسجيل الدخول أولاً لاستخدام أداة الإصلاح</span>
            </div>
          </div>
        )}

        {/* Repair Results */}
        {repairResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span className="font-medium">نتائج الإصلاح</span>
            </div>
            
            {repairResults.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStepIcon(result.success, result.message)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.message}
                      </div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            عرض التفاصيل
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.success ? "secondary" : "destructive"}>
                    {result.success ? "نجح" : "فشل"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {repairResults.length === 0 && !isRepairing && (
          <div className="text-center py-8 text-muted-foreground">
            انقر على "تشغيل الإصلاح" لبدء إصلاح مشاكل المصادقة
          </div>
        )}
      </CardContent>
    </Card>
  );
};