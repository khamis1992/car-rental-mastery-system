
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Activity,
  Edit,
  Trash2,
  Eye,
  Loader2
} from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { Tenant } from "@/types/tenant";
import { toast } from "@/hooks/use-toast";

const AdvancedTenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantService = new TenantService();

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في تحميل البيانات",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'trial': return 'تجريبي';
      case 'suspended': return 'معلق';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل المؤسسات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadTenants} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المؤسسات المتقدمة</h2>
          <p className="text-muted-foreground">
            إدارة شاملة لجميع المؤسسات المشتركة في النظام
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTenants} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            إضافة مؤسسة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">إجمالي المؤسسات</p>
                <p className="text-2xl font-bold text-right">{tenants.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">نشطة</p>
                <p className="text-2xl font-bold text-green-600 text-right">
                  {tenants.filter(t => t.status === 'active').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">تجريبية</p>
                <p className="text-2xl font-bold text-blue-600 text-right">
                  {tenants.filter(t => t.status === 'trial').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">معلقة</p>
                <p className="text-2xl font-bold text-red-600 text-right">
                  {tenants.filter(t => t.status === 'suspended').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">قائمة المؤسسات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مؤسسات مسجلة
              </div>
            ) : (
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.contact_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-white ${getStatusColor(tenant.status)}`}>
                          {getStatusLabel(tenant.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {tenant.subscription_plan}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground text-left">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tenant.max_users}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTenantManagement;
