import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Car, FileText, HardDrive, AlertTriangle } from 'lucide-react';

export function UsageTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const usageData = [
    {
      id: '1',
      tenant_name: 'شركة التميز للتجارة',
      plan_name: 'الخطة المتقدمة',
      users_count: 18,
      max_users: 25,
      vehicles_count: 35,
      max_vehicles: 50,
      contracts_count: 145,
      max_contracts: 200,
      storage_used_gb: 3.2,
      storage_limit_gb: 5,
      usage_date: '2024-01-20'
    },
    {
      id: '2',
      tenant_name: 'مؤسسة الخليج للاستثمار',
      plan_name: 'خطة المؤسسات',
      users_count: 120,
      max_users: 999999,
      vehicles_count: 250,
      max_vehicles: 999999,
      contracts_count: 890,
      max_contracts: 999999,
      storage_used_gb: 45.8,
      storage_limit_gb: 100,
      usage_date: '2024-01-20'
    },
    {
      id: '3',
      tenant_name: 'شركة النور للتطوير',
      plan_name: 'الخطة الأساسية',
      users_count: 5,
      max_users: 5,
      vehicles_count: 9,
      max_vehicles: 10,
      contracts_count: 48,
      max_contracts: 50,
      storage_used_gb: 0.8,
      storage_limit_gb: 1,
      usage_date: '2024-01-20'
    }
  ];

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 999999) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-600', bgColor: 'bg-red-100', status: 'خطر' };
    if (percentage >= 75) return { color: 'text-orange-600', bgColor: 'bg-orange-100', status: 'تحذير' };
    return { color: 'text-green-600', bgColor: 'bg-green-100', status: 'طبيعي' };
  };

  const filteredUsage = usageData.filter(usage =>
    usage.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مراقبة الاستخدام</h2>
          <p className="text-muted-foreground">متابعة استخدام الموارد لكل مستأجر</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="البحث في المستأجرين..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>استخدام الموارد</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستأجر</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>المستخدمين</TableHead>
                <TableHead>المركبات</TableHead>
                <TableHead>العقود</TableHead>
                <TableHead>التخزين</TableHead>
                <TableHead>آخر تحديث</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsage.map((usage) => {
                const usersPercentage = getUsagePercentage(usage.users_count, usage.max_users);
                const vehiclesPercentage = getUsagePercentage(usage.vehicles_count, usage.max_vehicles);
                const contractsPercentage = getUsagePercentage(usage.contracts_count, usage.max_contracts);
                const storagePercentage = getUsagePercentage(usage.storage_used_gb, usage.storage_limit_gb);

                const usersStatus = getUsageStatus(usersPercentage);
                const vehiclesStatus = getUsageStatus(vehiclesPercentage);
                const contractsStatus = getUsageStatus(contractsPercentage);
                const storageStatus = getUsageStatus(storagePercentage);

                return (
                  <TableRow key={usage.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usage.tenant_name}</p>
                        <p className="text-sm text-muted-foreground">{usage.plan_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{usage.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{usage.users_count}/{usage.max_users === 999999 ? '∞' : usage.max_users}</span>
                          {usersPercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        {usage.max_users !== 999999 && (
                          <Progress value={usersPercentage} className="h-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{usage.vehicles_count}/{usage.max_vehicles === 999999 ? '∞' : usage.max_vehicles}</span>
                          {vehiclesPercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        {usage.max_vehicles !== 999999 && (
                          <Progress value={vehiclesPercentage} className="h-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{usage.contracts_count}/{usage.max_contracts === 999999 ? '∞' : usage.max_contracts}</span>
                          {contractsPercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        {usage.max_contracts !== 999999 && (
                          <Progress value={contractsPercentage} className="h-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{usage.storage_used_gb.toFixed(1)}GB/{usage.storage_limit_gb}GB</span>
                          {storagePercentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <Progress value={storagePercentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{new Date(usage.usage_date).toLocaleDateString('ar-SA')}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}