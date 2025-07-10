import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Pause, Play, XCircle, Calendar } from 'lucide-react';

export function SubscriptionsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const subscriptions = [
    {
      id: '1',
      tenant_name: 'شركة التميز للتجارة',
      plan_name: 'الخطة المتقدمة',
      status: 'active',
      billing_cycle: 'monthly',
      amount: 59.99,
      currency: 'USD',
      current_period_start: '2024-01-01',
      current_period_end: '2024-02-01',
      trial_end: null,
      created_at: '2024-01-01'
    },
    {
      id: '2',
      tenant_name: 'مؤسسة الخليج للاستثمار',
      plan_name: 'خطة المؤسسات',
      status: 'trialing',
      billing_cycle: 'yearly',
      amount: 1499.99,
      currency: 'USD',
      current_period_start: '2024-01-15',
      current_period_end: '2025-01-15',
      trial_end: '2024-01-29',
      created_at: '2024-01-15'
    },
    {
      id: '3',
      tenant_name: 'شركة النور للتطوير',
      plan_name: 'الخطة الأساسية',
      status: 'past_due',
      billing_cycle: 'monthly',
      amount: 29.99,
      currency: 'USD',
      current_period_start: '2024-01-01',
      current_period_end: '2024-02-01',
      trial_end: null,
      created_at: '2023-12-15'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      trialing: { label: 'تجريبي', variant: 'secondary' as const },
      past_due: { label: 'متأخر', variant: 'destructive' as const },
      canceled: { label: 'ملغى', variant: 'outline' as const },
      paused: { label: 'متوقف', variant: 'secondary' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAction = (action: string, subscriptionId: string) => {
    toast({
      title: `تم ${action} الاشتراك`,
      description: `تم تنفيذ العملية بنجاح`,
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الاشتراكات</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع اشتراكات العملاء</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في الاشتراكات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الاشتراكات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستأجر</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>دورة الفوترة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>فترة الاشتراك</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        منذ {new Date(subscription.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{subscription.plan_name}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${subscription.amount}</p>
                      <p className="text-sm text-muted-foreground">{subscription.currency}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>من: {new Date(subscription.current_period_start).toLocaleDateString('ar-SA')}</p>
                      <p>إلى: {new Date(subscription.current_period_end).toLocaleDateString('ar-SA')}</p>
                      {subscription.trial_end && (
                        <p className="text-orange-600">
                          ينتهي التجريبي: {new Date(subscription.trial_end).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('عرض', subscription.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {subscription.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('إيقاف', subscription.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {subscription.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('تفعيل', subscription.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction('إلغاء', subscription.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}