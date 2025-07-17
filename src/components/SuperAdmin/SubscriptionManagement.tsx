import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSaasSubscriptions, useSubscriptionPlans, useBillingStats } from '@/hooks/useSaasOperations';
import { enhancedSaasService } from '@/services/enhancedSaasService';
import { SUBSCRIPTION_PLANS, formatPrice, calculateYearlySavings } from '@/types/subscription-plans';
import type { SaasSubscription, SubscriptionPlan } from '@/types/unified-saas';

interface SubscriptionManagementProps {
  tenantId?: string; // إذا تم تمريره، سيعرض اشتراكات مؤسسة محددة
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ tenantId }) => {
  const [selectedSubscription, setSelectedSubscription] = useState<SaasSubscription | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // استخدام الـ hooks الجديدة
  const { subscriptions, loading: subsLoading, error: subsError, refresh: refreshSubs } = useSaasSubscriptions(tenantId);
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { stats, loading: statsLoading } = useBillingStats();
  const { toast } = useToast();

  // البيانات المفلترة
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesPlan = planFilter === 'all' || subscription.plan_id === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // دوال المعالجة
  const handleStatusChange = async (subscriptionId: string, newStatus: SaasSubscription['status']) => {
    try {
      await enhancedSaasService.updateSubscriptionStatus(subscriptionId, newStatus);
      refreshSubs();
      toast({
        title: 'تم تحديث حالة الاشتراك',
        description: `تم تغيير الحالة إلى: ${getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديث الاشتراك',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateInvoice = async (subscriptionId: string) => {
    try {
      await enhancedSaasService.createInvoiceForSubscription(subscriptionId);
      toast({
        title: 'تم إنشاء الفاتورة',
        description: 'تم إنشاء فاتورة جديدة للاشتراك',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء الفاتورة',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // دوال المساعدة
  const getStatusBadge = (status: SaasSubscription['status']) => {
    const variants = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'نشط' },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'تجريبي' },
      past_due: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'متأخر الدفع' },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'ملغي' },
      unpaid: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'غير مدفوع' },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'متوقف' },
    };
    
    const variant = variants[status] || variants.active;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: SaasSubscription['status']) => {
    const labels = {
      active: 'نشط',
      trialing: 'تجريبي',
      past_due: 'متأخر الدفع',
      canceled: 'ملغي',
      unpaid: 'غير مدفوع',
      paused: 'متوقف',
    };
    return labels[status] || status;
  };

  const getPlanBadge = (plan: SubscriptionPlan | undefined) => {
    if (!plan) return <Badge variant="outline">غير محدد</Badge>;
    
    const planInfo = SUBSCRIPTION_PLANS[plan.plan_code as keyof typeof SUBSCRIPTION_PLANS];
    if (!planInfo) return <Badge variant="outline">{plan.plan_name}</Badge>;
    
    return (
      <Badge className={planInfo.color}>
        <Crown className="w-3 h-3 mr-1" />
        {plan.plan_name}
      </Badge>
    );
  };

  // واجهة الإحصائيات
  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الاشتراكات النشطة</p>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : stats?.active_subscriptions || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الاشتراكات التجريبية</p>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? '...' : stats?.trial_subscriptions || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-purple-600">
                {statsLoading ? '...' : formatPrice(stats?.total_revenue || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">متوسط قيمة الاشتراك</p>
              <p className="text-2xl font-bold text-orange-600">
                {statsLoading ? '...' : formatPrice(stats?.average_subscription_value || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // واجهة تفاصيل الاشتراك
  const SubscriptionDetailsDialog = () => (
    <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            تفاصيل الاشتراك
          </DialogTitle>
          <DialogDescription>
            معلومات شاملة عن اشتراك {selectedSubscription?.tenant?.name}
          </DialogDescription>
        </DialogHeader>

        {selectedSubscription && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="billing">الفوترة</TabsTrigger>
              <TabsTrigger value="usage">الاستخدام</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات أساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المؤسسة:</span>
                      <span>{selectedSubscription.tenant?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحالة:</span>
                      {getStatusBadge(selectedSubscription.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الخطة:</span>
                      {getPlanBadge(selectedSubscription.plan)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">دورة الفوترة:</span>
                      <span>{selectedSubscription.billing_cycle === 'monthly' ? 'شهرية' : 'سنوية'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">التواريخ المهمة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">بداية الفترة:</span>
                      <span>{selectedSubscription.current_period_start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نهاية الفترة:</span>
                      <span>{selectedSubscription.current_period_end}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الفوترة التالية:</span>
                      <span>{selectedSubscription.next_billing_date}</span>
                    </div>
                    {selectedSubscription.trial_ends_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">انتهاء التجربة:</span>
                        <span>{selectedSubscription.trial_ends_at}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleCreateInvoice(selectedSubscription.id)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      إنشاء فاتورة
                    </Button>

                    <Select onValueChange={(value) => handleStatusChange(selectedSubscription.id, value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="تغيير الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="paused">متوقف</SelectItem>
                        <SelectItem value="canceled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الفوترة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">المبلغ</p>
                        <p className="text-xl font-bold">{formatPrice(selectedSubscription.amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">الخصم</p>
                        <p className="text-xl font-bold">{selectedSubscription.discount_percentage}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">التجديد التلقائي</p>
                        <p className="text-xl font-bold">{selectedSubscription.auto_renew ? 'مفعل' : 'معطل'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    سيتم عرض إحصائيات الاستخدام هنا
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );

  if (subsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (subsError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">خطأ في تحميل الاشتراكات: {subsError}</p>
          <Button onClick={refreshSubs} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      {!tenantId && <StatsSection />}

      {/* عنوان الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {tenantId ? 'اشتراكات المؤسسة' : 'إدارة الاشتراكات'}
          </h1>
          <p className="text-muted-foreground">
            {tenantId ? 'عرض وإدارة اشتراكات هذه المؤسسة' : 'عرض وإدارة جميع اشتراكات النظام'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshSubs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          {!tenantId && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              اشتراك جديد
            </Button>
          )}
        </div>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في الاشتراكات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="trialing">تجريبي</SelectItem>
                <SelectItem value="past_due">متأخر الدفع</SelectItem>
                <SelectItem value="canceled">ملغي</SelectItem>
                <SelectItem value="paused">متوقف</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الخطة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الخطط</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.plan_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول الاشتراكات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الاشتراكات ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المؤسسة</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>دورة الفوترة</TableHead>
                <TableHead>الفوترة التالية</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{subscription.tenant?.name}</p>
                        <p className="text-sm text-muted-foreground">{subscription.tenant?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell className="font-mono">{formatPrice(subscription.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {subscription.billing_cycle === 'monthly' ? 'شهرية' : 'سنوية'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {subscription.next_billing_date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setShowSubscriptionDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCreateInvoice(subscription.id)}
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد اشتراكات مطابقة لمعايير البحث
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تفاصيل الاشتراك */}
      <SubscriptionDetailsDialog />
    </div>
  );
};

export default SubscriptionManagement; 