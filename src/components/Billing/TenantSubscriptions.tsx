import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2,
  Calendar,
  DollarSign,
  Users,
  Edit,
  RefreshCw,
  Plus,
  Download,
  Pause,
  Play,
  X
} from "lucide-react";
import { 
  useSubscriptionPlans, 
  useTenantSubscriptions, 
  useCreateSubscription,
  useUpdateSubscription,
  useCancelSubscription,
  useBillingStats
} from "@/hooks/useSaasData";
import CreateSubscriptionDialog from "./CreateSubscriptionDialog";
import TenantUsageCard from "./TenantUsageCard";

const TenantSubscriptions: React.FC = () => {
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscriptions, isLoading: subscriptionsLoading, refetch } = useTenantSubscriptions();
  const { data: stats } = useBillingStats();
  const updateSubscriptionMutation = useUpdateSubscription();
  const cancelSubscriptionMutation = useCancelSubscription();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'trialing':
        return 'bg-info';
      case 'past_due':
      case 'unpaid':
        return 'bg-destructive';
      case 'canceled':
        return 'bg-muted';
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
      case 'trialing':
        return 'فترة تجريبية';
      case 'past_due':
        return 'متأخر';
      case 'unpaid':
        return 'غير مدفوع';
      case 'canceled':
        return 'ملغي';
      case 'paused':
        return 'معلق';
      default:
        return status;
    }
  };

  const handlePauseSubscription = async (subscription: any) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        updates: { status: 'paused', pause_collection: { behavior: 'void' } }
      });
      toast({
        title: 'تم إيقاف الاشتراك مؤقتاً',
        description: 'تم إيقاف اشتراك المؤسسة مؤقتاً',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إيقاف الاشتراك',
        variant: 'destructive',
      });
    }
  };

  const handleResumeSubscription = async (subscription: any) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        updates: { status: 'active', pause_collection: null }
      });
      toast({
        title: 'تم استئناف الاشتراك',
        description: 'تم استئناف اشتراك المؤسسة بنجاح',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء استئناف الاشتراك',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSubscription = async (subscription: any) => {
    try {
      await cancelSubscriptionMutation.mutateAsync(subscription.id);
      toast({
        title: 'تم إلغاء الاشتراك',
        description: 'تم إلغاء اشتراك المؤسسة بنجاح',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إلغاء الاشتراك',
        variant: 'destructive',
      });
    }
  };

  if (plansLoading || subscriptionsLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الاشتراكات</p>
                  <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</p>
                  <p className="text-2xl font-bold">{stats.monthly_revenue} د.ك</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">فترة تجريبية</p>
                  <p className="text-2xl font-bold">{stats.trial_subscriptions}</p>
                </div>
                <Calendar className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">فواتير متأخرة</p>
                  <p className="text-2xl font-bold">{stats.overdue_invoices}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Plans */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>خطط الاشتراك المتاحة</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              اشتراك جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <Card key={plan.id} className="border-muted">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                    <div className="text-2xl font-bold text-primary">
                      {plan.price_monthly} د.ك/شهر
                    </div>
                    <p className="text-sm text-muted-foreground">
                      حتى {plan.max_users_per_tenant} مستخدم
                    </p>
                    <ul className="space-y-2 text-sm">
                      {plan.features?.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>الاشتراكات النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions?.map((subscription) => (
              <Card key={subscription.id} className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary p-3 rounded-xl">
                        <Building2 className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{subscription.tenant?.name || 'مؤسسة'}</h3>
                        <p className="text-sm text-muted-foreground">{subscription.plan?.plan_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>المبلغ</span>
                        </div>
                        <p className="font-semibold">{subscription.amount} د.ك</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>الفترة التالية</span>
                        </div>
                        <p className="font-semibold">
                          {new Date(subscription.current_period_end).toLocaleDateString('ar-KW')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </Badge>
                        <div className="flex gap-1">
                          {subscription.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePauseSubscription(subscription)}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {subscription.status === 'paused' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleResumeSubscription(subscription)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSubscription(subscription)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {subscription.status !== 'canceled' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCancelSubscription(subscription)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Usage Tracking */}
      <TenantUsageCard />

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateSubscriptionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            setShowCreateDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default TenantSubscriptions;