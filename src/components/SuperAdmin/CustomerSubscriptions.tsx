import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Search,
  RefreshCw,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  FileText,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSaasSubscriptions, useSaasInvoices, useTenantUsage } from '@/hooks/useSaasOperations';
import { enhancedSaasService } from '@/services/enhancedSaasService';
import { formatPrice } from '@/types/subscription-plans';
import type { SaasSubscription, SaasInvoice, TenantUsage } from '@/types/unified-saas';

interface CustomerSubscriptionsProps {
  tenantId?: string;
  readonly?: boolean;
}

const CustomerSubscriptions: React.FC<CustomerSubscriptionsProps> = ({ 
  tenantId: propTenantId, 
  readonly = false 
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(propTenantId || '');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // استخدام الـ hooks الجديدة
  const { 
    subscriptions, 
    loading: subsLoading, 
    error: subsError, 
    refresh: refreshSubs 
  } = useSaasSubscriptions(selectedTenantId);
  
  const { 
    invoices, 
    loading: invoicesLoading, 
    refresh: refreshInvoices 
  } = useSaasInvoices(selectedTenantId);
  
  const { 
    usage, 
    loading: usageLoading, 
    refresh: refreshUsage 
  } = useTenantUsage(selectedTenantId);
  
  const { toast } = useToast();

  // تحديث البيانات عند تغيير المؤسسة
  useEffect(() => {
    if (selectedTenantId) {
      refreshSubs();
      refreshInvoices();
      refreshUsage();
    }
  }, [selectedTenantId]);

  // البحث في الاشتراكات
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan?.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // البحث في الفواتير
  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // دوال المساعدة
  const getStatusBadge = (status: string, type: 'subscription' | 'invoice' = 'subscription') => {
    if (type === 'subscription') {
      const variants = {
        active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'نشط' },
        trialing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'تجريبي' },
        past_due: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'متأخر' },
        canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'ملغي' },
        unpaid: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'غير مدفوع' },
        paused: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'متوقف' },
      };
      const variant = variants[status as keyof typeof variants] || variants.active;
      const Icon = variant.icon;
      return (
        <Badge className={variant.color}>
          <Icon className="w-3 h-3 mr-1" />
          {variant.label}
        </Badge>
      );
    } else {
      const variants = {
        draft: { color: 'bg-gray-100 text-gray-800', label: 'مسودة' },
        sent: { color: 'bg-blue-100 text-blue-800', label: 'مرسلة' },
        paid: { color: 'bg-green-100 text-green-800', label: 'مدفوعة' },
        overdue: { color: 'bg-red-100 text-red-800', label: 'متأخرة' },
        canceled: { color: 'bg-gray-100 text-gray-800', label: 'ملغية' },
        void: { color: 'bg-gray-100 text-gray-800', label: 'باطلة' },
      };
      const variant = variants[status as keyof typeof variants] || variants.draft;
      return <Badge className={variant.color}>{variant.label}</Badge>;
    }
  };

  const getPlanBadge = (planName: string) => {
    const colors = {
      'أساسي': 'bg-gray-100 text-gray-800',
      'معياري': 'bg-blue-100 text-blue-800',
      'مميز': 'bg-purple-100 text-purple-800',
      'مؤسسي': 'bg-amber-100 text-amber-800',
    };
    const color = colors[planName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={color}>
        <Crown className="w-3 h-3 mr-1" />
        {planName}
      </Badge>
    );
  };

  // واجهة نظرة عامة على الاشتراك
  const SubscriptionOverview = () => {
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    
    if (!activeSubscription) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-muted-foreground">لا يوجد اشتراك نشط لهذه المؤسسة</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الخطة الحالية</p>
                <p className="text-lg font-bold">{activeSubscription.plan?.plan_name}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبلغ الشهري</p>
                <p className="text-lg font-bold">{formatPrice(activeSubscription.amount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الفوترة التالية</p>
                <p className="text-lg font-bold">{activeSubscription.next_billing_date}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <div className="mt-1">{getStatusBadge(activeSubscription.status)}</div>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // واجهة إحصائيات الاستخدام
  const UsageStats = () => {
    if (usageLoading) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل إحصائيات الاستخدام...</p>
          </CardContent>
        </Card>
      );
    }

    if (!usage) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد بيانات استخدام متاحة</p>
          </CardContent>
        </Card>
      );
    }

    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    const plan = activeSubscription?.plan;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">المستخدمين</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">{usage.users_count}</span>
                  <span className="text-sm text-muted-foreground">
                    / {plan?.max_users_per_tenant || '∞'}
                  </span>
                </div>
                {plan && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((usage.users_count / plan.max_users_per_tenant) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">المركبات</span>
                <Building2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">{usage.vehicles_count}</span>
                  <span className="text-sm text-muted-foreground">
                    / {plan?.max_vehicles || '∞'}
                  </span>
                </div>
                {plan && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((usage.vehicles_count / plan.max_vehicles) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">العقود</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">{usage.contracts_count}</span>
                  <span className="text-sm text-muted-foreground">
                    / {plan?.max_contracts || '∞'}
                  </span>
                </div>
                {plan && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((usage.contracts_count / plan.max_contracts) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">التخزين</span>
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">{usage.storage_used_gb.toFixed(1)}GB</span>
                  <span className="text-sm text-muted-foreground">
                    / {plan?.storage_limit_gb || '∞'}GB
                  </span>
                </div>
                {plan && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((usage.storage_used_gb / plan.storage_limit_gb) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* العنوان والإجراءات */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {propTenantId ? 'اشتراكاتي' : 'اشتراكات العملاء'}
          </h1>
          <p className="text-muted-foreground">
            {propTenantId ? 'عرض وإدارة اشتراكك الحالي' : 'عرض وإدارة اشتراكات جميع العملاء'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            refreshSubs();
            refreshInvoices();
            refreshUsage();
          }} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* أداة البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في الاشتراكات والفواتير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {selectedTenantId ? (
        <>
          {/* نظرة عامة على الاشتراك */}
          <SubscriptionOverview />

          {/* علامات التبويب */}
          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usage">الاستخدام</TabsTrigger>
              <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <UsageStats />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تاريخ الاشتراكات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الخطة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>تاريخ النهاية</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            {getPlanBadge(subscription.plan?.plan_name || 'غير محدد')}
                          </TableCell>
                          <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                          <TableCell className="font-mono">{formatPrice(subscription.amount)}</TableCell>
                          <TableCell>{subscription.current_period_start}</TableCell>
                          <TableCell>{subscription.current_period_end}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSelectedData(subscription);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>سجل الفواتير</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>تاريخ الإصدار</TableHead>
                        <TableHead>تاريخ الاستحقاق</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status, 'invoice')}</TableCell>
                          <TableCell className="font-mono">{formatPrice(invoice.total_amount)}</TableCell>
                          <TableCell>{new Date(invoice.created_at).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>{invoice.due_date}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSelectedData(invoice);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">اختر مؤسسة لعرض تفاصيل اشتراكها</p>
          </CardContent>
        </Card>
      )}

      {/* نافذة التفاصيل */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل {selectedData?.invoice_number ? 'الفاتورة' : 'الاشتراك'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedData && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSubscriptions; 