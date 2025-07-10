import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Car, FileText } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

interface TenantLimits {
  users: { current: number; max: number };
  vehicles: { current: number; max: number };
  contracts: { current: number; max: number };
}

const TenantLimitChecker: React.FC = () => {
  const { currentTenant } = useTenant();
  const [limits, setLimits] = useState<TenantLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      loadTenantLimits();
    }
  }, [currentTenant]);

  const loadTenantLimits = async () => {
    if (!currentTenant) return;

    try {
      setLoading(true);

      // Get current counts
      const [usersResult, vehiclesResult, contractsResult] = await Promise.all([
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
      ]);

      setLimits({
        users: {
          current: usersResult.count || 0,
          max: currentTenant.max_users || 0
        },
        vehicles: {
          current: vehiclesResult.count || 0,
          max: currentTenant.max_vehicles || 0
        },
        contracts: {
          current: contractsResult.count || 0,
          max: currentTenant.max_contracts || 0
        }
      });
    } catch (error) {
      console.error('Error loading tenant limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0;
  };

  const getUsageStatus = (current: number, max: number) => {
    const percentage = getUsagePercentage(current, max);
    if (percentage >= 90) return { color: 'bg-red-500', status: 'critical' };
    if (percentage >= 75) return { color: 'bg-yellow-500', status: 'warning' };
    return { color: 'bg-green-500', status: 'good' };
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
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          حدود الاستخدام
        </CardTitle>
        <CardDescription>
          استخدام الموارد الحالي مقارنة بالحد الأقصى
        </CardDescription>
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
                    {item.current} / {item.max}
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
                </div>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TenantLimitChecker;