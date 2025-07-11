import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Edit2, 
  Pause, 
  Play, 
  X,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useTenantSubscriptions, useUpdateSubscription } from '@/hooks/useSaasData';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SaasSubscription } from '@/types/unified-saas';

export function SubscriptionsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { data: subscriptions = [], isLoading } = useTenantSubscriptions();
  const updateSubscriptionMutation = useUpdateSubscription();

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery || 
      sub.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan?.plan_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (subscriptionId: string, newStatus: SaasSubscription['status']) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        subscriptionId: subscriptionId,
        updates: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      paused: { label: 'متوقف', variant: 'secondary' as const },
      canceled: { label: 'ملغي', variant: 'destructive' as const },
      expired: { label: 'منتهي', variant: 'destructive' as const },
      trialing: { label: 'تجريبي', variant: 'outline' as const },
      past_due: { label: 'متأخر', variant: 'destructive' as const },
      unpaid: { label: 'غير مدفوع', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const warningDate = addDays(today, 7);
    return isAfter(end, today) && isBefore(end, warningDate);
  };

  const isExpired = (endDate: string) => {
    return isBefore(new Date(endDate), new Date());
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">اشتراكات المؤسسات</h2>
          <p className="text-muted-foreground">إدارة اشتراكات جميع المؤسسات</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المؤسسات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 w-64"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="paused">متوقف</option>
            <option value="trialing">تجريبي</option>
            <option value="canceled">ملغي</option>
            <option value="expired">منتهي</option>
            <option value="past_due">متأخر</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              الاشتراكات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تنتهي قريباً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {subscriptions.filter(s => isExpiringSoon(s.current_period_end)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              منتهية الصلاحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {subscriptions.filter(s => isExpired(s.current_period_end)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.status === 'active').reduce((total, s) => total + s.amount, 0).toFixed(3)} د.ك
            </div>
          </CardContent>
        </Card>
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
                <TableHead>المؤسسة</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>دورة الفوترة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>بداية الفترة</TableHead>
                <TableHead>نهاية الفترة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.tenant?.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.tenant?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscription.plan?.plan_name}</Badge>
                  </TableCell>
                  <TableCell>
                    {subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{subscription.amount} {subscription.currency}</div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ar })}
                      {isExpiringSoon(subscription.current_period_end) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      {isExpired(subscription.current_period_end) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(subscription.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      {subscription.status === 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(subscription.id, 'paused')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {subscription.status === 'paused' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(subscription.id, 'active')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {['active', 'paused'].includes(subscription.status) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(subscription.id, 'canceled')}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد اشتراكات تطابق معايير البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}