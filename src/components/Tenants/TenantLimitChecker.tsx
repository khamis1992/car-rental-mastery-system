
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Car, FileText, RefreshCw, Info } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { handleError } from '@/utils/errorHandling';

interface TenantLimits {
  users: { current: number; max: number };
  vehicles: { current: number; max: number };
  contracts: { current: number; max: number };
}

const TenantLimitChecker: React.FC = () => {
  const { currentTenant } = useTenant();
  const [limits, setLimits] = useState<TenantLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadTenantLimits();
    }
  }, [currentTenant]);

  const loadTenantLimits = async () => {
    if (!currentTenant) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 تحميل حدود المؤسسة:', currentTenant.name);

      // التحقق من اتصال قاعدة البيانات أولاً
      const { error: connectionError } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', currentTenant.id)
        .limit(1);

      if (connectionError) {
        throw new Error(`خطأ في الاتصال: ${connectionError.message}`);
      }

      // Get current counts with error handling for each query
      const queries = [
        supabase
          .from('tenant_users')
          .select('id', { count: 'exact' })
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'active'),
        supabase
          .from('vehicles')
          .select('id', { count: 'exact' })
          .eq('tenant_id', currentTenant.id),
        supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('tenant_id', currentTenant.id)
      ];

      const results = await Promise.allSettled(queries);

      // معالجة النتائج مع التعامل مع الأخطاء
      const [usersResult, vehiclesResult, contractsResult] = results;

      const usersCount = usersResult.status === 'fulfilled' 
        ? usersResult.value.count || 0 
        : 0;
      
      const vehiclesCount = vehiclesResult.status === 'fulfilled' 
        ? vehiclesResult.value.count || 0 
        : 0;
      
      const contractsCount = contractsResult.status === 'fulfilled' 
        ? contractsResult.value.count || 0 
        : 0;

      // تسجيل أي أخطاء في الاستعلامات
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const tableNames = ['tenant_users', 'vehicles', 'contracts'];
          console.warn(`⚠️ خطأ في تحميل بيانات ${tableNames[index]}:`, result.reason);
        }
      });

      setLimits({
        users: {
          current: usersCount,
          max: currentTenant.max_users || 0
        },
        vehicles: {
          current: vehiclesCount,
          max: currentTenant.max_vehicles || 0
        },
        contracts: {
          current: contractsCount,
          max: currentTenant.max_contracts || 0
        }
      });

      setLastUpdated(new Date());
      console.log('✅ تم تحميل حدود المؤسسة بنجاح');

    } catch (error: any) {
      console.error('❌ خطأ في تحميل حدود المؤسسة:', error);
      const errorResult = handleError(error, 'loadTenantLimits');
      
      if (errorResult.shouldLog) {
        setError(errorResult.message || 'فشل في تحميل حدود الاستخدام');
      }
      
      // إعداد قيم افتراضية في حالة الخطأ
      if (currentTenant) {
        setLimits({
          users: { current: 0, max: currentTenant.max_users || 0 },
          vehicles: { current: 0, max: currentTenant.max_vehicles || 0 },
          contracts: { current: 0, max: currentTenant.max_contracts || 0 }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadTenantLimits();
      toast({
        title: "تم التحديث",
        description: "تم تحديث حدود الاستخدام بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? Math.min((current / max) * 100, 100) : 0;
  };

  const getUsageStatus = (current: number, max: number) => {
    const percentage = getUsagePercentage(current, max);
    if (percentage >= 90) return { color: 'bg-red-500', status: 'critical', textColor: 'text-red-600' };
    if (percentage >= 75) return { color: 'bg-yellow-500', status: 'warning', textColor: 'text-yellow-600' };
    return { color: 'bg-green-500', status: 'good', textColor: 'text-green-600' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            حدود الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            خطأ في تحميل الحدود
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} size="sm" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!limits || !currentTenant) {
    return null;
  }

  const limitItems = [
    {
      icon: Users,
      label: 'المستخدمين',
      current: limits.users.current,
      max: limits.users.max,
      color: 'text-blue-500'
    },
    {
      icon: Car,
      label: 'المركبات',
      current: limits.vehicles.current,
      max: limits.vehicles.max,
      color: 'text-green-500'
    },
    {
      icon: FileText,
      label: 'العقود',
      current: limits.contracts.current,
      max: limits.contracts.max,
      color: 'text-purple-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            حدود الاستخدام
          </CardTitle>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="ghost"
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <CardDescription>
          استخدام الموارد الحالي مقارنة بالحد الأقصى
        </CardDescription>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {limitItems.map((item) => {
          const percentage = getUsagePercentage(item.current, item.max);
          const status = getUsageStatus(item.current, item.max);
          const Icon = item.icon;

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <span className={status.textColor}>{item.current}</span> / {item.max}
                  </span>
                  {status.status === 'critical' && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      تحذير
                    </Badge>
                  )}
                  {status.status === 'warning' && (
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                      تنبيه
                    </Badge>
                  )}
                  {status.status === 'good' && item.current > 0 && (
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      طبيعي
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% مستخدم</span>
                  <span>{item.max - item.current} متاح</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TenantLimitChecker;
