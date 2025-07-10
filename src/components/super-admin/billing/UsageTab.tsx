import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Users,
  Car,
  FileText,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Building2,
  Activity
} from 'lucide-react';
import { useTenantUsage } from '@/hooks/useSaasData';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function UsageTab() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: usageData = [], isLoading } = useTenantUsage();

  const filteredUsage = usageData.filter(usage => {
    return !searchQuery || 
      usage.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (!limit || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-600', status: 'critical' };
    if (percentage >= 75) return { color: 'text-orange-600', status: 'warning' };
    if (percentage >= 50) return { color: 'text-yellow-600', status: 'moderate' };
    return { color: 'text-green-600', status: 'good' };
  };

  // Mock data for demonstration
  const mockUsageData = [
    {
      id: '1',
      tenant: { name: 'شركة الخليج للتجارة', email: 'info@gulf-trading.com' },
      plan: { plan_name: 'الخطة المتقدمة', max_users_per_tenant: 50, max_vehicles: 100, max_contracts: 200, storage_limit_gb: 10 },
      users_count: 35,
      vehicles_count: 78,
      contracts_count: 145,
      storage_used_gb: 7.2,
      last_updated: new Date().toISOString()
    },
    {
      id: '2',
      tenant: { name: 'مؤسسة النقل الحديث', email: 'info@modern-transport.com' },
      plan: { plan_name: 'خطة المؤسسات', max_users_per_tenant: 100, max_vehicles: 300, max_contracts: 500, storage_limit_gb: 25 },
      users_count: 25,
      vehicles_count: 67,
      contracts_count: 89,
      storage_used_gb: 4.8,
      last_updated: new Date().toISOString()
    },
    {
      id: '3',
      tenant: { name: 'شركة البشائر الخليجية', email: 'info@bushaer-gulf.com' },
      plan: { plan_name: 'الخطة الأساسية', max_users_per_tenant: 20, max_vehicles: 50, max_contracts: 100, storage_limit_gb: 5 },
      users_count: 18,
      vehicles_count: 47,
      contracts_count: 92,
      storage_used_gb: 4.1,
      last_updated: new Date().toISOString()
    }
  ];

  const displayData = filteredUsage.length > 0 ? filteredUsage : mockUsageData;

  // Calculate overall statistics
  const stats = {
    totalTenants: displayData.length,
    highUsageTenants: displayData.filter(t => {
      const plan = (t as any).plan;
      const userPercentage = calculateUsagePercentage(t.users_count, plan?.max_users_per_tenant || 0);
      const vehiclePercentage = calculateUsagePercentage(t.vehicles_count, plan?.max_vehicles || 0);
      const contractPercentage = calculateUsagePercentage(t.contracts_count, plan?.max_contracts || 0);
      const storagePercentage = calculateUsagePercentage(t.storage_used_gb, plan?.storage_limit_gb || 0);
      
      return Math.max(userPercentage, vehiclePercentage, contractPercentage, storagePercentage) >= 75;
    }).length,
    totalUsers: displayData.reduce((sum, t) => sum + t.users_count, 0),
    totalVehicles: displayData.reduce((sum, t) => sum + t.vehicles_count, 0),
    totalContracts: displayData.reduce((sum, t) => sum + t.contracts_count, 0),
    totalStorage: displayData.reduce((sum, t) => sum + t.storage_used_gb, 0)
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">استخدام المؤسسات</h2>
          <p className="text-muted-foreground">مراقبة استخدام الموارد لكل مؤسسة</p>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المؤسسات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 w-64"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              إجمالي المؤسسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              استخدام عالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highUsageTenants}</div>
            <p className="text-xs text-muted-foreground">أكثر من 75%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              إجمالي المركبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              التخزين المستخدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStorage.toFixed(1)} جيجا</div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الاستخدام</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المؤسسة</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>المستخدمون</TableHead>
                <TableHead>المركبات</TableHead>
                <TableHead>العقود</TableHead>
                <TableHead>التخزين</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((usage) => {
                const plan = (usage as any).plan;
                const userPercentage = calculateUsagePercentage(usage.users_count, plan?.max_users_per_tenant || 0);
                const vehiclePercentage = calculateUsagePercentage(usage.vehicles_count, plan?.max_vehicles || 0);
                const contractPercentage = calculateUsagePercentage(usage.contracts_count, plan?.max_contracts || 0);
                const storagePercentage = calculateUsagePercentage(usage.storage_used_gb, plan?.storage_limit_gb || 0);

                const maxPercentage = Math.max(userPercentage, vehiclePercentage, contractPercentage, storagePercentage);
                const overallStatus = getUsageStatus(maxPercentage);

                return (
                  <TableRow key={usage.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.tenant?.name}</div>
                        <div className="text-sm text-muted-foreground">{usage.tenant?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{(usage as any).plan?.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {usage.users_count} / {(usage as any).plan?.max_users_per_tenant || '∞'}
                          </span>
                          <Users className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Progress value={userPercentage} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {usage.vehicles_count} / {(usage as any).plan?.max_vehicles || '∞'}
                          </span>
                          <Car className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Progress value={vehiclePercentage} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {usage.contracts_count} / {(usage as any).plan?.max_contracts || '∞'}
                          </span>
                          <FileText className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Progress value={contractPercentage} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {usage.storage_used_gb.toFixed(1)} / {(usage as any).plan?.storage_limit_gb || '∞'} جيجا
                          </span>
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Progress value={storagePercentage} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(usage.last_updated), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className={`h-4 w-4 ${overallStatus.color}`} />
                        <span className={`text-sm font-medium ${overallStatus.color}`}>
                          {overallStatus.status === 'critical' && 'حرج'}
                          {overallStatus.status === 'warning' && 'تحذير'}
                          {overallStatus.status === 'moderate' && 'متوسط'}
                          {overallStatus.status === 'good' && 'جيد'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {displayData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد بيانات استخدام متاحة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}