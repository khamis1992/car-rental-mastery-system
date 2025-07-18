
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
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Car
} from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { Tenant } from "@/types/tenant";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/enhanced-dialog";
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
import TenantUsersDialog from "./TenantUsersDialog";

// Extend Tenant type to include actual counts
type TenantWithCounts = Tenant & { 
  actual_users: number; 
  actual_vehicles: number; 
};

const AdvancedTenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<{id: string, name: string} | null>(null);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantService = new TenantService();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      const errorMessage = error.message || 'فشل في تحميل بيانات المؤسسات';
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsers = (tenant: TenantWithCounts) => {
    setSelectedTenant({ id: tenant.id, name: tenant.name });
    setShowUsersDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        icon: CheckCircle, 
        className: "bg-green-100 text-green-800 border-green-200", 
        label: "نشط" 
      },
      trial: { 
        icon: Clock, 
        className: "bg-blue-100 text-blue-800 border-blue-200", 
        label: "تجريبي" 
      },
      suspended: { 
        icon: AlertCircle, 
        className: "bg-red-100 text-red-800 border-red-200", 
        label: "معلق" 
      },
      cancelled: { 
        icon: AlertCircle, 
        className: "bg-gray-100 text-gray-800 border-gray-200", 
        label: "ملغي" 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled;
    const Icon = config.icon;

    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription: string) => {
    const subscriptionConfig = {
      premium: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "مميز" },
      standard: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "عادي" },
      basic: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "أساسي" },
      enterprise: { className: "bg-gold-100 text-gold-800 border-gold-200", label: "مؤسسي" }
    };

    const config = subscriptionConfig[subscription as keyof typeof subscriptionConfig] || subscriptionConfig.basic;
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUsersDisplayText = (actual: number, max: number) => {
    const isOverLimit = actual > max;
    return (
      <span className={isOverLimit ? "text-red-600 font-medium" : ""}>
        {actual} / {max}
        {isOverLimit && " ⚠️"}
      </span>
    );
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={loadTenants} variant="outline">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h2 className="text-2xl font-bold">إدارة المؤسسات المتقدمة</h2>
          <p className="text-muted-foreground">
            إدارة شاملة لجميع المؤسسات المشتركة في النظام مع إحصائيات تفصيلية
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
                قم بإنشاء مؤسسة جديدة وإعداد الحساب الإداري الخاص بها
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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إجمالي المؤسسات</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">المؤسسات النشطة</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.actual_users, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="bg-orange-100 p-3 rounded-lg mr-4">
              <Car className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.actual_vehicles, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              قائمة المؤسسات التفصيلية
            </CardTitle>
            <Button onClick={loadTenants} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              تحديث البيانات
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin ml-2" />
              <span>جاري تحميل المؤسسات...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المؤسسة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">خطة الاشتراك</TableHead>
                    <TableHead className="text-right">المستخدمين (فعلي/حد أقصى)</TableHead>
                    <TableHead className="text-right">المركبات (فعلي/حد أقصى)</TableHead>
                    <TableHead className="text-right">العملة</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا توجد مؤسسات مسجلة في النظام</p>
                        <Button 
                          onClick={() => setShowOnboarding(true)}
                          className="mt-4"
                          variant="outline"
                        >
                          إضافة أول مؤسسة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenants.map((tenant) => (
                      <TableRow key={tenant.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              {tenant.slug && (
                                <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>{getSubscriptionBadge(tenant.subscription_plan)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUsers(tenant)}
                            className="h-auto p-0 hover:bg-transparent"
                          >
                            {getUsersDisplayText(tenant.actual_users, tenant.max_users)}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {getUsersDisplayText(tenant.actual_vehicles, tenant.max_vehicles)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant.currency}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tenant.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUsers(tenant)}>
                                <UserCheck className="ml-2 h-4 w-4" />
                                إدارة المستخدمين ({tenant.actual_users})
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="ml-2 h-4 w-4" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل المؤسسة
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف المؤسسة
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Management Dialog */}
      {selectedTenant && (
        <TenantUsersDialog
          tenantId={selectedTenant.id}
          tenantName={selectedTenant.name}
          isOpen={showUsersDialog}
          onClose={() => {
            setShowUsersDialog(false);
            setSelectedTenant(null);
            loadTenants(); // Refresh data when dialog closes
          }}
        />
      )}
    </div>
  );
};

export default AdvancedTenantManagement;
