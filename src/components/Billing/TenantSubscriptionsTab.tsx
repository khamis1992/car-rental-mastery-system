import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { Plus, Search, Edit, Trash2, Pause, Play, RefreshCw } from "lucide-react";
import { useTenantSubscriptions, useCancelSubscription, useUpdateSubscription } from "@/hooks/useSaasData";
import CreateSubscriptionDialog from "./CreateSubscriptionDialog";
import { useToast } from "@/hooks/use-toast";
import { SaasSubscription } from "@/types/unified-saas";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const TenantSubscriptionsTab: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { 
    data: subscriptions = [], 
    isLoading, 
    refetch 
  } = useTenantSubscriptions();
  
  const cancelSubscriptionMutation = useCancelSubscription();
  const updateSubscriptionMutation = useUpdateSubscription();

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (confirm("هل أنت متأكد من إلغاء هذا الاشتراك؟")) {
      try {
        await cancelSubscriptionMutation.mutateAsync({ subscriptionId });
      } catch (error) {
        toast({
          title: "خطأ في إلغاء الاشتراك",
          description: "حدث خطأ أثناء إلغاء الاشتراك",
          variant: "destructive",
        });
      }
    }
  };

  const handlePauseResume = async (subscription: SaasSubscription) => {
    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    try {
      await updateSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        updates: { status: newStatus }
      });
    } catch (error) {
      toast({
        title: "خطأ في تحديث الاشتراك",
        description: "حدث خطأ أثناء تحديث حالة الاشتراك",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "نشط", variant: "default" as const },
      paused: { label: "متوقف", variant: "secondary" as const },
      canceled: { label: "ملغي", variant: "destructive" as const },
      expired: { label: "منتهي", variant: "outline" as const },
      trialing: { label: "تجريبي", variant: "default" as const },
      past_due: { label: "متأخر", variant: "destructive" as const },
      unpaid: { label: "غير مدفوع", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subscription.plan?.plan_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      accessorKey: "tenant.name",
      header: "اسم المؤسسة",
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.tenant?.name}</span>
          <span className="text-sm text-muted-foreground">{row.original.tenant?.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "plan.plan_name",
      header: "خطة الاشتراك",
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.plan?.plan_name}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {row.original.amount} {row.original.currency}
        </span>
      ),
    },
    {
      accessorKey: "current_period_end",
      header: "تاريخ الانتهاء",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.current_period_end), 'dd MMM yyyy', { locale: ar })}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: ar })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }: { row: any }) => {
        const subscription = row.original as SaasSubscription;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePauseResume(subscription)}
              disabled={subscription.status === 'canceled'}
            >
              {subscription.status === 'active' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelSubscription(subscription.id)}
              disabled={subscription.status === 'canceled'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">اشتراكات المؤسسات</h2>
          <p className="text-muted-foreground">
            إدارة اشتراكات جميع المؤسسات
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            إنشاء اشتراك جديد
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في الاشتراكات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الاشتراكات</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
              <Badge variant="default">المجموع</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الاشتراكات النشطة</p>
                <p className="text-2xl font-bold text-green-600">
                  {subscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Badge variant="default">نشط</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الاشتراكات التجريبية</p>
                <p className="text-2xl font-bold text-blue-600">
                  {subscriptions.filter(s => s.status === 'trialing').length}
                </p>
              </div>
              <Badge variant="secondary">تجريبي</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الاشتراكات الملغية</p>
                <p className="text-2xl font-bold text-red-600">
                  {subscriptions.filter(s => s.status === 'canceled').length}
                </p>
              </div>
              <Badge variant="destructive">ملغي</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الاشتراكات */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الاشتراكات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSubscriptions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* نموذج إنشاء اشتراك جديد */}
      <CreateSubscriptionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </div>
  );
};

export default TenantSubscriptionsTab;