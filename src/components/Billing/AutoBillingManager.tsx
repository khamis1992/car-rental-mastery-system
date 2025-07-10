import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Settings,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BillingCycle {
  id: string;
  subscription_id: string;
  tenant_name: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string;
  amount: number;
  auto_billing_enabled: boolean;
  retry_count: number;
  last_attempt?: string;
  status: 'active' | 'failed' | 'paused';
}

const AutoBillingManager: React.FC = () => {
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([
    {
      id: '1',
      subscription_id: 'sub_1',
      tenant_name: 'شركة البشائر الخليجية',
      plan_name: 'خطة المؤسسة',
      billing_cycle: 'monthly',
      next_billing_date: '2024-02-15',
      amount: 500,
      auto_billing_enabled: true,
      retry_count: 0,
      status: 'active'
    },
    {
      id: '2',
      subscription_id: 'sub_2',
      tenant_name: 'مؤسسة النقل الحديث',
      plan_name: 'خطة المتقدمة',
      billing_cycle: 'monthly',
      next_billing_date: '2024-02-20',
      amount: 300,
      auto_billing_enabled: true,
      retry_count: 2,
      last_attempt: '2024-01-20',
      status: 'failed'
    },
    {
      id: '3',
      subscription_id: 'sub_3',
      tenant_name: 'شركة التوصيل السريع',
      plan_name: 'خطة الأساسية',
      billing_cycle: 'yearly',
      next_billing_date: '2024-12-10',
      amount: 1800,
      auto_billing_enabled: false,
      retry_count: 0,
      status: 'paused'
    }
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'failed':
        return 'bg-destructive';
      case 'paused':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'failed':
        return 'فشل';
      case 'paused':
        return 'معلق';
      default:
        return status;
    }
  };

  const toggleAutoBilling = async (cycleId: string, enabled: boolean) => {
    try {
      setBillingCycles(prev => 
        prev.map(cycle => 
          cycle.id === cycleId 
            ? { ...cycle, auto_billing_enabled: enabled, status: enabled ? 'active' : 'paused' }
            : cycle
        )
      );
      
      toast({
        title: enabled ? 'تم تفعيل الفوترة التلقائية' : 'تم إيقاف الفوترة التلقائية',
        description: `تم ${enabled ? 'تفعيل' : 'إيقاف'} الفوترة التلقائية للاشتراك`,
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تغيير إعدادات الفوترة',
        variant: 'destructive',
      });
    }
  };

  const retryBilling = async (cycleId: string) => {
    try {
      setRefreshing(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBillingCycles(prev => 
        prev.map(cycle => 
          cycle.id === cycleId 
            ? { ...cycle, status: 'active', retry_count: 0, last_attempt: new Date().toISOString() }
            : cycle
        )
      );
      
      toast({
        title: 'تم إعادة المحاولة',
        description: 'تم إعادة محاولة الفوترة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشلت إعادة محاولة الفوترة',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const processUpcomingBilling = async () => {
    try {
      setRefreshing(true);
      
      // Simulate processing upcoming billing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: 'تم معالجة الفوترة',
        description: 'تم معالجة جميع الفواتير المقرر استحقاقها اليوم',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء معالجة الفوترة',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const upcomingBilling = billingCycles.filter(cycle => {
    const nextBilling = new Date(cycle.next_billing_date);
    const today = new Date();
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });

  const failedBilling = billingCycles.filter(cycle => cycle.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">دورات الفوترة النشطة</p>
                <p className="text-2xl font-bold">
                  {billingCycles.filter(c => c.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">فوترة قادمة (7 أيام)</p>
                <p className="text-2xl font-bold">{upcomingBilling.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">فوترة فاشلة</p>
                <p className="text-2xl font-bold">{failedBilling.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إجراءات سريعة
            </CardTitle>
            <Button 
              onClick={processUpcomingBilling}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Play className="w-4 h-4 ml-2" />
              )}
              معالجة الفوترة اليوم
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">الفوترة القادمة</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {upcomingBilling.length} اشتراك مقرر فوترته خلال الأسبوع القادم
              </p>
              <div className="space-y-2">
                {upcomingBilling.slice(0, 3).map(cycle => (
                  <div key={cycle.id} className="flex justify-between text-sm">
                    <span>{cycle.tenant_name}</span>
                    <span>{new Date(cycle.next_billing_date).toLocaleDateString('ar-KW')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">الفوترة الفاشلة</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {failedBilling.length} اشتراك يحتاج إعادة محاولة
              </p>
              <div className="space-y-2">
                {failedBilling.slice(0, 3).map(cycle => (
                  <div key={cycle.id} className="flex justify-between text-sm">
                    <span>{cycle.tenant_name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryBilling(cycle.id)}
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycles Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            إدارة دورات الفوترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingCycles.map((cycle) => (
              <Card key={cycle.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{cycle.tenant_name}</h4>
                        <p className="text-sm text-muted-foreground">{cycle.plan_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>المبلغ</span>
                        </div>
                        <p className="font-semibold">{cycle.amount} د.ك</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>الفوترة التالية</span>
                        </div>
                        <p className="font-semibold">
                          {new Date(cycle.next_billing_date).toLocaleDateString('ar-KW')}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>الدورة</span>
                        </div>
                        <p className="font-semibold">
                          {cycle.billing_cycle === 'monthly' ? 'شهرية' : 'سنوية'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className={`text-white ${getStatusColor(cycle.status)}`}>
                          {getStatusText(cycle.status)}
                        </Badge>

                        {cycle.retry_count > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">محاولات</p>
                            <p className="text-sm font-semibold">{cycle.retry_count}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={cycle.auto_billing_enabled}
                            onCheckedChange={(checked) => toggleAutoBilling(cycle.id, checked)}
                          />
                          <Label className="text-sm">تلقائي</Label>
                        </div>

                        {cycle.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryBilling(cycle.id)}
                            disabled={refreshing}
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {cycle.last_attempt && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        آخر محاولة: {new Date(cycle.last_attempt).toLocaleString('ar-KW')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoBillingManager;