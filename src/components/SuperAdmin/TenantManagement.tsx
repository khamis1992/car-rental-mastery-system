import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TenantOnboarding } from "@/components/Tenants/TenantOnboarding";
import { toast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const tenantService = new TenantService();
  const { t, msg, formatNumber } = useTranslation();

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants();
      setTenants(data);
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
      render: (value: string, row: Tenant) => (
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
      key: 'contact_email',
      title: 'البريد الإلكتروني',
      render: (email: string) => (
        <span className="text-sm text-muted-foreground">{email}</span>
      )
    },
    {
      key: 'user_count',
      title: 'المستخدمين',
      align: 'center' as const,
      render: (count: number) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="w-4 h-4" />
          <span>{formatNumber(count || 0)}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'تاريخ الإنشاء',
      render: (date: string) => (
        new Date(date).toLocaleDateString('ar-SA')
      )
    }
  ];

  // تعريف إجراءات الجدول
  const actions = [
    {
      label: 'عرض التفاصيل',
      icon: <Eye className="w-4 h-4" />,
      onClick: (tenant: Tenant) => {
        setSelectedTenant(tenant);
      }
    },
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (tenant: Tenant) => {
        // تحرير المؤسسة
        console.log('Edit tenant:', tenant);
      }
    },
    {
      label: 'الإعدادات',
      icon: <Settings className="w-4 h-4" />,
      onClick: (tenant: Tenant) => {
        // إعدادات المؤسسة
        console.log('Settings for:', tenant);
      },
      separator: true
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (tenant: Tenant) => handleDeleteTenant(tenant),
      variant: 'destructive' as const,
      disabled: (tenant: Tenant) => tenant.status === 'active'
    }
  ];

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      await tenantService.deleteTenant(tenant.id);
      await loadTenants();
      toast({
        title: msg('success', 'deleted', t('organization')),
        description: `تم حذف ${tenant.name} بنجاح`
      });
    } catch (error: any) {
      toast({
        title: msg('error', 'failed', t('delete')),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateTenant = async () => {
    setShowOnboarding(false);
    await loadTenants();
  };

  // إحصائيات سريعة
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    pending: tenants.filter(t => t.status === 'pending').length,
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
              icon={<Activity className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              {t('update')}
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName={t('organization')}
              onClick={() => setShowOnboarding(true)}
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
                  <p className="text-sm font-medium text-muted-foreground text-right">{t('total')}</p>
                  <p className="text-2xl font-bold text-right">{formatNumber(stats.total)}</p>
                </div>
                <Building2 className="w-8 h-8 text-muted-foreground" />
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
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">{t('pending')}</p>
                  <p className="text-2xl font-bold text-yellow-600 text-right">{formatNumber(stats.pending)}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
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
        <EnhancedDialog
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          title={`${t('add')} ${t('organization')}`}
          description="قم بإنشاء مؤسسة جديدة وإعداد الحساب الإداري"
          size="xl"
          showCloseButton
        >
          <TenantOnboarding onComplete={handleCreateTenant} />
        </EnhancedDialog>

        {/* Tenant Details Dialog */}
        {selectedTenant && (
          <EnhancedDialog
            open={!!selectedTenant}
            onOpenChange={() => setSelectedTenant(null)}
            title={`تفاصيل ${selectedTenant.name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">اسم المؤسسة</label>
                  <p className="font-medium">{selectedTenant.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المعرف</label>
                  <p className="font-mono text-sm">{selectedTenant.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div className="mt-1">
                    {(() => {
                      const statusInfo = formatStatus(selectedTenant.status);
                      return (
                        <Badge variant={statusInfo.variant as any}>
                          {statusInfo.text}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                  <p>{selectedTenant.contact_email}</p>
                </div>
              </div>
              
              {selectedTenant.contact_phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                  <p>{selectedTenant.contact_phone}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                <p>{new Date(selectedTenant.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </EnhancedDialog>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TenantManagement;