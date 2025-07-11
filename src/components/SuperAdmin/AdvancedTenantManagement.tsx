import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Users, 
  MoreHorizontal,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Database,
  Activity
} from "lucide-react";
import { TenantService } from '@/services/tenantService';
import { Tenant } from '@/types/tenant';
import { useToast } from "@/hooks/use-toast";

const AdvancedTenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const tenantService = new TenantService();
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المؤسسات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, text: 'نشط', color: 'bg-green-100 text-green-800' },
      trial: { variant: 'secondary' as const, text: 'تجريبي', color: 'bg-blue-100 text-blue-800' },
      suspended: { variant: 'destructive' as const, text: 'معلق', color: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'outline' as const, text: 'ملغي', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.active;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.text}
      </Badge>
    );
  };

  const getSubscriptionBadge = (plan: string) => {
    const plans = {
      basic: { text: 'أساسي', color: 'bg-gray-100 text-gray-800' },
      standard: { text: 'معياري', color: 'bg-blue-100 text-blue-800' },
      premium: { text: 'مميز', color: 'bg-purple-100 text-purple-800' },
      enterprise: { text: 'مؤسسي', color: 'bg-gold-100 text-gold-800' }
    };
    
    const planInfo = plans[plan as keyof typeof plans] || plans.basic;
    return (
      <Badge className={planInfo.color}>
        {planInfo.text}
      </Badge>
    );
  };

  const handleTenantAction = async (tenantId: string, action: string) => {
    try {
      switch (action) {
        case 'suspend':
          await tenantService.updateTenant(tenantId, { status: 'suspended' });
          toast({ title: "تم بنجاح", description: "تم تعليق المؤسسة" });
          break;
        case 'activate':
          await tenantService.updateTenant(tenantId, { status: 'active' });
          toast({ title: "تم بنجاح", description: "تم تفعيل المؤسسة" });
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
        variant: "destructive",
      });
    }
  };

  const TenantDetailsDialog = ({ tenant }: { tenant: Tenant }) => (
    <Dialog open={showTenantDetails} onOpenChange={setShowTenantDetails}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            تفاصيل المؤسسة - {tenant.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
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
                    <span>{Math.floor(Math.random() * 50)} / {tenant.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المركبات:</span>
                    <span>{Math.floor(Math.random() * 100)} / {tenant.max_vehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العقود:</span>
                    <span>{Math.floor(Math.random() * 200)} / {tenant.max_contracts}</span>
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
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '21%' }}></div>
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
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
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
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-right">إدارة المؤسسات المتقدمة</h2>
        <Button className="flex items-center gap-2">
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
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
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
                      <span>{Math.floor(Math.random() * 50)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowTenantDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 ml-2" />
                          تحرير
                        </DropdownMenuItem>
                        {tenant.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleTenantAction(tenant.id, 'suspend')}>
                            <Shield className="w-4 h-4 ml-2" />
                            تعليق
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleTenantAction(tenant.id, 'activate')}>
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تفعيل
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTenant && <TenantDetailsDialog tenant={selectedTenant} />}
    </div>
  );
};

export default AdvancedTenantManagement;