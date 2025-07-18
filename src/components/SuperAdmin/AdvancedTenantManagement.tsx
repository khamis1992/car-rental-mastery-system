import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, MoreHorizontal, Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Settings, Eye, Edit, Trash2, UserPlus, Crown, Database, Activity, Globe, Search, Filter, Plus, Download, Upload, RefreshCw } from "lucide-react";
import DomainManagement from "./DomainManagement";
import { supabase } from '@/integrations/supabase/client';
import { TenantService } from '@/services/tenantService';
import { Tenant } from '@/types/tenant';
import { useToast } from "@/hooks/use-toast";
import { EnhancedTenantOnboarding } from './TenantOnboarding/EnhancedTenantOnboarding';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode, PLAN_COLORS, PLAN_NAMES } from '@/types/subscription-plans';

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

// نوع محدث للمؤسسة مع الإحصائيات الحقيقية
interface TenantWithStats extends Tenant {
  actual_users?: number;
  actual_vehicles?: number;
  actual_contracts?: number;
}

const AdvancedTenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddTenantDialog, setShowAddTenantDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<TenantWithStats | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // حقول البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const tenantService = new TenantService();
  const { toast } = useToast();
  const { t, msg, formatNumber } = useTranslation();

  // تحميل البيانات
  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants();
      setTenants(data);
      setFilteredTenants(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // تعريف أعمدة الجدول
  const columns = [
    {
      key: 'name',
      title: t('organization'),
      sortable: true,
      render: (value: string, row: TenantWithStats) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: 'subscription_plan',
      title: 'الخطة',
      align: 'center' as const,
      render: (plan: string) => {
        const planInfo = SUBSCRIPTION_PLANS[plan as SubscriptionPlanCode];
        return (
          <Badge 
            className={`${PLAN_COLORS[plan as SubscriptionPlanCode] || 'bg-gray-100 text-gray-800'}`}
          >
            {PLAN_NAMES[plan as SubscriptionPlanCode] || plan}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      title: 'الحالة',
      align: 'center' as const,
      render: (status: string) => {
        const statusInfo = formatStatus(status);
        return (
          <Badge variant={statusInfo.variant as any}>
            {statusInfo.text}
          </Badge>
        );
      }
    },
    {
      key: 'actual_users',
      title: 'المستخدمين',
      align: 'center' as const,
      render: (users: number, row: TenantWithStats) => (
        <div className="text-center">
          <div className="font-medium">{formatNumber(users || 0)}</div>
          <div className="text-xs text-muted-foreground">
            من {formatNumber(row.max_users || 0)}
          </div>
        </div>
      )
    },
    {
      key: 'contact_email',
      title: 'البريد الإلكتروني',
      render: (email: string) => (
        <span className="text-sm text-muted-foreground">{email}</span>
      )
    }
  ];

  // تعريف الإجراءات
  const actions = [
    {
      label: 'عرض التفاصيل',
      icon: <Eye className="w-4 h-4" />,
      onClick: (tenant: TenantWithStats) => {
        setSelectedTenant(tenant);
        setShowTenantDetails(true);
      }
    },
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (tenant: TenantWithStats) => {
        // منطق التحرير
        toast({
          title: 'قريباً',
          description: 'ميزة التحرير ستكون متاحة قريباً'
        });
      }
    },
    {
      label: 'إدارة النطاقات',
      icon: <Globe className="w-4 h-4" />,
      onClick: (tenant: TenantWithStats) => {
        // منطق إدارة النطاقات
        toast({
          title: 'قريباً',
          description: 'ميزة إدارة النطاقات ستكون متاحة قريباً'
        });
      }
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (tenant: TenantWithStats) => {
        setTenantToDelete(tenant);
        setShowDeleteDialog(true);
      },
      variant: 'destructive' as const,
      separator: true
    }
  ];

  // معالج إنشاء مؤسسة جديدة
  const handleCreateTenant = async () => {
    setShowAddTenantDialog(false);
    await loadTenants();
  };

  // معالج حذف المؤسسة
  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      await tenantService.deleteTenant(tenantToDelete.id, deleteReason);
      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف المؤسسة ${tenantToDelete.name} بنجاح`
      });
      setShowDeleteDialog(false);
      setTenantToDelete(null);
      setDeleteReason('');
      await loadTenants();
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // إحصائيات سريعة
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('admin')} {t('organization')}</h2>
            <p className="text-muted-foreground">
              إدارة جميع المؤسسات المشتركة في النظام
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={loadTenants}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              {t('update')}
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName={t('organization')}
              onClick={() => setShowAddTenantDialog(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('add')} {t('organization')}
            </ActionButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">المجموع</p>
                  <p className="text-2xl font-bold text-right">{formatNumber(stats.total)}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">{t('active')}</p>
                  <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(stats.active)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">تجريبي</p>
                  <p className="text-2xl font-bold text-blue-600 text-right">{formatNumber(stats.trial)}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">{t('suspended')}</p>
                  <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(stats.suspended)}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <LoadingState
          loading={loading}
          error={error}
          isEmpty={tenants.length === 0}
          emptyMessage={msg('info', 'empty')}
          onRetry={loadTenants}
        >
          <EnhancedTable
            data={tenants}
            columns={columns}
            actions={actions}
            searchable
            searchPlaceholder={`${t('search')} ${t('organization')}...`}
            onRefresh={loadTenants}
            emptyMessage={msg('info', 'empty')}
            maxHeight="600px"
            stickyHeader
          />
        </LoadingState>

        {/* Create Tenant Dialog */}
        <EnhancedTenantOnboarding
          open={showAddTenantDialog}
          onOpenChange={setShowAddTenantDialog}
          onSuccess={handleCreateTenant}
        />

        {/* Tenant Details Dialog */}
        <EnhancedDialog
          open={showTenantDetails}
          onOpenChange={setShowTenantDetails}
          title={selectedTenant ? `تفاصيل ${selectedTenant.name}` : ''}
          description="عرض تفاصيل المؤسسة وإحصائياتها"
          size="lg"
          showCloseButton
        >
          {selectedTenant && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم المؤسسة</Label>
                  <div className="mt-1 text-sm">{selectedTenant.name}</div>
                </div>
                <div>
                  <Label>الرمز المختصر</Label>
                  <div className="mt-1 text-sm">{selectedTenant.slug}</div>
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <div className="mt-1 text-sm">{selectedTenant.contact_email}</div>
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <div className="mt-1 text-sm">{selectedTenant.contact_phone || 'غير محدد'}</div>
                </div>
              </div>

              {/* إحصائيات الاستخدام */}
              <div>
                <Label>إحصائيات الاستخدام</Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{selectedTenant.actual_users || 0}</div>
                    <div className="text-xs text-muted-foreground">المستخدمين</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{selectedTenant.actual_vehicles || 0}</div>
                    <div className="text-xs text-muted-foreground">المركبات</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{selectedTenant.actual_contracts || 0}</div>
                    <div className="text-xs text-muted-foreground">العقود</div>
                  </div>
                </div>
              </div>

              {/* إدارة النطاقات */}
              <div>
                <Label>إدارة النطاقات</Label>
                <DomainManagement 
                  tenantId={selectedTenant.id}
                  tenantName={selectedTenant.name}
                  currentDomain={selectedTenant.custom_domain}
                />
              </div>
            </div>
          )}
        </EnhancedDialog>

        {/* Delete Confirmation Dialog */}
        <EnhancedDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="تأكيد الحذف"
          description="هذا الإجراء لا يمكن التراجع عنه"
          size="md"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    تحذير: حذف نهائي
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    سيتم حذف جميع البيانات المرتبطة بهذه المؤسسة نهائياً
                  </p>
                </div>
              </div>
            </div>

            {tenantToDelete && (
              <div>
                <Label>المؤسسة المراد حذفها</Label>
                <div className="mt-1 font-medium">{tenantToDelete.name}</div>
              </div>
            )}

            <div>
              <Label htmlFor="delete-reason">سبب الحذف (اختياري)</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="اذكر سبب حذف هذه المؤسسة..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setTenantToDelete(null);
                  setDeleteReason('');
                }}
              >
                إلغاء
              </Button>
              <ActionButton
                action="delete"
                itemName="المؤسسة"
                onClick={handleDeleteTenant}
                variant="destructive"
              >
                حذف نهائي
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedTenantManagement;