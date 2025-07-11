import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Users, MoreHorizontal, Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Settings, Eye, Edit, Trash2, UserPlus, Crown, Database, Activity, Globe } from "lucide-react";
import DomainManagement from "./DomainManagement";
import { supabase } from '@/integrations/supabase/client';
import { TenantService } from '@/services/tenantService';
import { Tenant } from '@/types/tenant';
import { useToast } from "@/hooks/use-toast";
import { EnhancedTenantOnboarding } from './TenantOnboarding/EnhancedTenantOnboarding';

// نوع محدث للمؤسسة مع الإحصائيات الحقيقية
interface TenantWithStats extends Tenant {
  actual_users?: number;
  actual_vehicles?: number;
  actual_contracts?: number;
}

const AdvancedTenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddTenantDialog, setShowAddTenantDialog] = useState(false);

  // تعريف الباقات المختلفة
  const subscriptionPlans = {
    basic: {
      name: 'أساسي',
      max_users: 10,
      max_vehicles: 50,
      max_contracts: 100,
      color: 'bg-gray-100 text-gray-800'
    },
    standard: {
      name: 'معياري',
      max_users: 25,
      max_vehicles: 100,
      max_contracts: 250,
      color: 'bg-blue-100 text-blue-800'
    },
    premium: {
      name: 'مميز',
      max_users: 50,
      max_vehicles: 200,
      max_contracts: 500,
      color: 'bg-purple-100 text-purple-800'
    },
    enterprise: {
      name: 'مؤسسي',
      max_users: 100,
      max_vehicles: 500,
      max_contracts: 1000,
      color: 'bg-gold-100 text-gold-800'
    }
  };

  const [newTenantData, setNewTenantData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    country: 'Kuwait',
    timezone: 'Asia/Kuwait',
    currency: 'KWD',
    subscription_plan: 'basic' as keyof typeof subscriptionPlans,
    max_users: subscriptionPlans.basic.max_users,
    max_vehicles: subscriptionPlans.basic.max_vehicles,
    max_contracts: subscriptionPlans.basic.max_contracts,
    admin_user: {
      email: '',
      password: '',
      full_name: ''
    }
  });

  const tenantService = new TenantService();
  const { toast } = useToast();
  useEffect(() => {
    loadTenants();
  }, []);
  // دالة جلب البيانات الحقيقية مع الإحصائيات
  const loadTenantsWithStats = async () => {
    try {
      // استعلام مبسط لجلب المؤسسات مع الإحصائيات
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (tenantsError) throw tenantsError;
      
      // جلب الإحصائيات لكل مؤسسة
      const tenantsWithStats = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // جلب عدد المستخدمين الفعلي
          const { count: usersCount } = await supabase
            .from('tenant_users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'active');
            
          // جلب عدد المركبات الفعلي
          const { count: vehiclesCount } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);
            
          // جلب عدد العقود الفعلي
          const { count: contractsCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);
            
          return {
            ...tenant,
            actual_users: usersCount || 0,
            actual_vehicles: vehiclesCount || 0,
            actual_contracts: contractsCount || 0
          } as TenantWithStats;
        })
      );
      
      setTenants(tenantsWithStats);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المؤسسات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = loadTenantsWithStats;
  const getStatusBadge = (status: string) => {
    const variants = {
      active: {
        variant: 'default' as const,
        text: 'نشط',
        color: 'bg-green-100 text-green-800'
      },
      trial: {
        variant: 'secondary' as const,
        text: 'تجريبي',
        color: 'bg-blue-100 text-blue-800'
      },
      suspended: {
        variant: 'destructive' as const,
        text: 'معلق',
        color: 'bg-red-100 text-red-800'
      },
      cancelled: {
        variant: 'outline' as const,
        text: 'ملغي',
        color: 'bg-gray-100 text-gray-800'
      }
    };
    const statusInfo = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={statusInfo.color}>
        {statusInfo.text}
      </Badge>;
  };
  const getSubscriptionBadge = (plan: string) => {
    const plans = {
      basic: {
        text: 'أساسي',
        color: 'bg-gray-100 text-gray-800'
      },
      standard: {
        text: 'معياري',
        color: 'bg-blue-100 text-blue-800'
      },
      premium: {
        text: 'مميز',
        color: 'bg-purple-100 text-purple-800'
      },
      enterprise: {
        text: 'مؤسسي',
        color: 'bg-gold-100 text-gold-800'
      }
    };
    const planInfo = plans[plan as keyof typeof plans] || plans.basic;
    return <Badge className={planInfo.color}>
        {planInfo.text}
      </Badge>;
  };
  const handleTenantAction = async (tenantId: string, action: string) => {
    try {
      switch (action) {
        case 'suspend':
          await tenantService.updateTenant(tenantId, {
            status: 'suspended'
          });
          toast({
            title: "تم بنجاح",
            description: "تم تعليق المؤسسة"
          });
          break;
        case 'activate':
          await tenantService.updateTenant(tenantId, {
            status: 'active'
          });
          toast({
            title: "تم بنجاح",
            description: "تم تفعيل المؤسسة"
          });
          break;
        case 'delete':
          // TODO: Add confirmation dialog
          break;
      }
      loadTenants();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تنفيذ العملية",
        variant: "destructive"
      });
    }
  };
  // معالج تغيير الباقة
  const handlePlanChange = (selectedPlan: keyof typeof subscriptionPlans) => {
    const plan = subscriptionPlans[selectedPlan];
    setNewTenantData(prev => ({
      ...prev,
      subscription_plan: selectedPlan,
      max_users: plan.max_users,
      max_vehicles: plan.max_vehicles,
      max_contracts: plan.max_contracts
    }));
  };

  const handleAddTenant = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!newTenantData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم المؤسسة مطلوب",
        variant: "destructive"
      });
      return;
    }

    if (!newTenantData.slug.trim()) {
      toast({
        title: "خطأ",
        description: "المعرف الفريد مطلوب",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await tenantService.createTenant(newTenantData);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المؤسسة الجديدة"
      });
      setShowAddTenantDialog(false);
      setNewTenantData({
        name: '',
        slug: '',
        contact_email: '',
        contact_phone: '',
        country: 'Kuwait',
        timezone: 'Asia/Kuwait',
        currency: 'KWD',
        subscription_plan: 'basic',
        max_users: subscriptionPlans.basic.max_users,
        max_vehicles: subscriptionPlans.basic.max_vehicles,
        max_contracts: subscriptionPlans.basic.max_contracts,
        admin_user: {
          email: '',
          password: '',
          full_name: ''
        }
      });
      loadTenants();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المؤسسة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // No longer needed - replaced with EnhancedTenantOnboarding component
  const TenantDetailsDialog = ({
    tenant
  }: {
    tenant: TenantWithStats;
  }) => <Dialog open={showTenantDetails} onOpenChange={setShowTenantDetails}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            تفاصيل المؤسسة - {tenant.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="domains">الدومين</TabsTrigger>
            <TabsTrigger value="usage">الاستخدام</TabsTrigger>
            <TabsTrigger value="billing">الفوترة</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">معلومات أساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم:</span>
                    <span>{tenant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المعرف:</span>
                    <span className="font-mono text-xs">{tenant.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة:</span>
                    {getStatusBadge(tenant.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الخطة:</span>
                    {getSubscriptionBadge(tenant.subscription_plan)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">إحصائيات الاستخدام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المستخدمون:</span>
                    <span>{tenant.actual_users || 0} / {tenant.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المركبات:</span>
                    <span>{tenant.actual_vehicles || 0} / {tenant.max_vehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العقود:</span>
                    <span>{tenant.actual_contracts || 0} / {tenant.max_contracts}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>إدارة المستخدمين</span>
                  <Button size="sm" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    إضافة مستخدم
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  سيتم تطوير إدارة المستخدمين قريباً
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains">
            <DomainManagement 
              tenantId={tenant.id}
              tenantName={tenant.name}
              currentDomain={tenant.domain}
            />
          </TabsContent>

          <TabsContent value="usage">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">استخدام التخزين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المستخدم</span>
                      <span>2.1 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{
                      width: '21%'
                    }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API المكالمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>هذا الشهر</span>
                      <span>15,234 / 50,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{
                      width: '30%'
                    }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الفوترة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  سيتم تطوير نظام الفوترة قريباً
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المؤسسة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  سيتم تطوير إعدادات المؤسسة قريباً
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>;
  if (loading) {
    return <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-right">إدارة المؤسسات المتقدمة</h2>
        <Button className="flex items-center gap-2" onClick={() => setShowAddTenantDialog(true)}>
          <Building2 className="w-4 h-4" />
          إضافة مؤسسة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Database className="w-5 h-5" />
            قائمة المؤسسات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المؤسسة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الخطة</TableHead>
                <TableHead className="text-right">المستخدمون</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(tenant => <TableRow key={tenant.id}>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell className="text-right">{getSubscriptionBadge(tenant.subscription_plan)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{tenant.actual_users || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(tenant.created_at).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                      setSelectedTenant(tenant);
                      setShowTenantDetails(true);
                    }}>
                          <Eye className="w-4 h-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 ml-2" />
                          تحرير
                        </DropdownMenuItem>
                        {tenant.status === 'active' ? <DropdownMenuItem onClick={() => handleTenantAction(tenant.id, 'suspend')}>
                            <Shield className="w-4 h-4 ml-2" />
                            تعليق
                          </DropdownMenuItem> : <DropdownMenuItem onClick={() => handleTenantAction(tenant.id, 'activate')}>
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تفعيل
                          </DropdownMenuItem>}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTenant && <TenantDetailsDialog tenant={selectedTenant} />}
      
      <EnhancedTenantOnboarding
        open={showAddTenantDialog}
        onOpenChange={setShowAddTenantDialog}
        onSuccess={loadTenants}
      />
    </div>;
};
export default AdvancedTenantManagement;