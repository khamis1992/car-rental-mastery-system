import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Car, 
  FileText, 
  HardDrive, 
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { saasService } from '@/services/saasService';

const TenantUsageCard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const { data: usage, refetch } = useQuery({
    queryKey: ['tenant-usage'],
    queryFn: () => saasService.getTenantUsage(),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Mock data for demonstration
  const mockUsage = [
    {
      id: '1',
      tenant: { name: 'شركة البشائر الخليجية' },
      users_count: 45,
      vehicles_count: 120,
      contracts_count: 85,
      storage_used_gb: 2.3,
      plan_limits: {
        max_users: 100,
        max_vehicles: 150,
        max_contracts: 100,
        storage_limit_gb: 5
      }
    },
    {
      id: '2',
      tenant: { name: 'مؤسسة النقل الحديث' },
      users_count: 28,
      vehicles_count: 65,
      contracts_count: 42,
      storage_used_gb: 1.8,
      plan_limits: {
        max_users: 50,
        max_vehicles: 75,
        max_contracts: 50,
        storage_limit_gb: 3
      }
    }
  ];

  const usageData = usage?.length ? usage : mockUsage;

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'destructive', text: 'تجاوز الحد' };
    if (percentage >= 75) return { color: 'warning', text: 'قريب من الحد' };
    return { color: 'success', text: 'ضمن الحد' };
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            تتبع استخدام المؤسسات
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usageData.map((tenant) => (
            <Card key={tenant.id} className="border-muted">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{tenant.tenant?.name}</h4>
                    <Badge variant="outline">استخدام شهري</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Users Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>المستخدمين</span>
                        </div>
                        <span>{tenant.users_count}/{tenant.plan_limits?.max_users}</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(tenant.users_count, tenant.plan_limits?.max_users || 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={getUsageStatus(getUsagePercentage(tenant.users_count, tenant.plan_limits?.max_users || 100)).color as any}
                          className="text-xs"
                        >
                          {getUsageStatus(getUsagePercentage(tenant.users_count, tenant.plan_limits?.max_users || 100)).text}
                        </Badge>
                        <span>{Math.round(getUsagePercentage(tenant.users_count, tenant.plan_limits?.max_users || 100))}%</span>
                      </div>
                    </div>

                    {/* Vehicles Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          <span>المركبات</span>
                        </div>
                        <span>{tenant.vehicles_count}/{tenant.plan_limits?.max_vehicles}</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(tenant.vehicles_count, tenant.plan_limits?.max_vehicles || 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={getUsageStatus(getUsagePercentage(tenant.vehicles_count, tenant.plan_limits?.max_vehicles || 100)).color as any}
                          className="text-xs"
                        >
                          {getUsageStatus(getUsagePercentage(tenant.vehicles_count, tenant.plan_limits?.max_vehicles || 100)).text}
                        </Badge>
                        <span>{Math.round(getUsagePercentage(tenant.vehicles_count, tenant.plan_limits?.max_vehicles || 100))}%</span>
                      </div>
                    </div>

                    {/* Contracts Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>العقود</span>
                        </div>
                        <span>{tenant.contracts_count}/{tenant.plan_limits?.max_contracts}</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(tenant.contracts_count, tenant.plan_limits?.max_contracts || 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={getUsageStatus(getUsagePercentage(tenant.contracts_count, tenant.plan_limits?.max_contracts || 100)).color as any}
                          className="text-xs"
                        >
                          {getUsageStatus(getUsagePercentage(tenant.contracts_count, tenant.plan_limits?.max_contracts || 100)).text}
                        </Badge>
                        <span>{Math.round(getUsagePercentage(tenant.contracts_count, tenant.plan_limits?.max_contracts || 100))}%</span>
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-4 h-4" />
                          <span>التخزين</span>
                        </div>
                        <span>{tenant.storage_used_gb} GB/{tenant.plan_limits?.storage_limit_gb} GB</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(tenant.storage_used_gb, tenant.plan_limits?.storage_limit_gb || 5)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={getUsageStatus(getUsagePercentage(tenant.storage_used_gb, tenant.plan_limits?.storage_limit_gb || 5)).color as any}
                          className="text-xs"
                        >
                          {getUsageStatus(getUsagePercentage(tenant.storage_used_gb, tenant.plan_limits?.storage_limit_gb || 5)).text}
                        </Badge>
                        <span>{Math.round(getUsagePercentage(tenant.storage_used_gb, tenant.plan_limits?.storage_limit_gb || 5))}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning for high usage */}
                  {(getUsagePercentage(tenant.users_count, tenant.plan_limits?.max_users || 100) >= 90 ||
                    getUsagePercentage(tenant.vehicles_count, tenant.plan_limits?.max_vehicles || 100) >= 90 ||
                    getUsagePercentage(tenant.contracts_count, tenant.plan_limits?.max_contracts || 100) >= 90 ||
                    getUsagePercentage(tenant.storage_used_gb, tenant.plan_limits?.storage_limit_gb || 5) >= 90) && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive">
                        تحذير: هذه المؤسسة تقترب من تجاوز حدود خطتها. قد تحتاج لترقية الخطة.
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantUsageCard;