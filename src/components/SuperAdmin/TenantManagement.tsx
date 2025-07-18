import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Activity,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2
} from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { Tenant } from "@/types/tenant";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TenantOnboarding } from "@/components/Tenants/TenantOnboarding";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const tenantService = new TenantService();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المؤسسات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">مميز</Badge>;
      case 'standard':
        return <Badge className="bg-blue-100 text-blue-800">عادي</Badge>;
      case 'basic':
        return <Badge variant="outline">أساسي</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المؤسسات</h2>
          <p className="text-muted-foreground">
            إدارة جميع المؤسسات المشتركة في النظام
          </p>
        </div>
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة مؤسسة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
              <DialogDescription>
                قم بإنشاء مؤسسة جديدة وإعداد الحساب الإداري
              </DialogDescription>
            </DialogHeader>
            <TenantOnboarding onComplete={() => {
              setShowOnboarding(false);
              loadTenants();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Building2 className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المؤسسات</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">المؤسسات النشطة</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.max_users, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Settings className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.max_vehicles, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المؤسسات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="mr-2">جاري تحميل المؤسسات...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المؤسسة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>خطة الاشتراك</TableHead>
                  <TableHead>الحد الأقصى للمستخدمين</TableHead>
                  <TableHead>الحد الأقصى للمركبات</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">لا توجد مؤسسات مسجلة في النظام</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(tenant.subscription_plan)}</TableCell>
                      <TableCell>{tenant.max_users}</TableCell>
                      <TableCell>{tenant.max_vehicles}</TableCell>
                      <TableCell>{tenant.currency}</TableCell>
                      <TableCell>{new Date(tenant.created_at).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantManagement;