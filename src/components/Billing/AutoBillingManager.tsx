
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { Settings, Play, Pause, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAutoBillingSettings, useUpdateAutoBillingSettings, useAutoBillingLogs } from '@/hooks/useCollectiveInvoices';
import { toast } from 'sonner';

const AutoBillingManager: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useAutoBillingSettings();
  const { data: logs = [], isLoading: logsLoading } = useAutoBillingLogs();
  const updateSettings = useUpdateAutoBillingSettings();

  const [formData, setFormData] = useState({
    enabled: settings?.enabled || false,
    billing_frequency: settings?.billing_frequency || 'monthly',
    billing_day: settings?.billing_day || 1,
    due_days: settings?.due_days || 30,
    auto_send_invoices: settings?.auto_send_invoices || false,
    auto_send_reminders: settings?.auto_send_reminders || false,
    reminder_days_before: settings?.reminder_days_before || 7,
    late_fee_enabled: settings?.late_fee_enabled || false,
    late_fee_amount: settings?.late_fee_amount || 0,
    late_fee_percentage: settings?.late_fee_percentage || 0,
    tax_rate: settings?.tax_rate || 0,
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled,
        billing_frequency: settings.billing_frequency,
        billing_day: settings.billing_day,
        due_days: settings.due_days,
        auto_send_invoices: settings.auto_send_invoices,
        auto_send_reminders: settings.auto_send_reminders,
        reminder_days_before: settings.reminder_days_before,
        late_fee_enabled: settings.late_fee_enabled,
        late_fee_amount: settings.late_fee_amount,
        late_fee_percentage: settings.late_fee_percentage,
        tax_rate: settings.tax_rate,
      });
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { label: 'نجح', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'فشل', variant: 'destructive' as const, icon: XCircle },
      partial: { label: 'جزئي', variant: 'secondary' as const, icon: AlertTriangle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.success;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const logsColumns = [
    {
      header: 'تاريخ التشغيل',
      accessorKey: 'created_at',
      cell: ({ row }: any) => {
        return new Date(row.getValue('created_at')).toLocaleDateString('ar-KW');
      },
    },
    {
      header: 'فترة الفوترة',
      accessorKey: 'billing_period',
      cell: ({ row }: any) => {
        const log = row.original;
        return `${log.billing_period_start} - ${log.billing_period_end}`;
      },
    },
    {
      header: 'عدد الفواتير',
      accessorKey: 'total_invoices_generated',
    },
    {
      header: 'المبلغ الإجمالي',
      accessorKey: 'total_amount',
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue('total_amount'));
        return new Intl.NumberFormat('ar-KW', {
          style: 'currency',
          currency: 'KWD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      },
    },
    {
      header: 'الحالة',
      accessorKey: 'execution_status',
      cell: ({ row }: any) => getStatusBadge(row.getValue('execution_status')),
    },
    {
      header: 'وقت التنفيذ',
      accessorKey: 'execution_time_ms',
      cell: ({ row }: any) => {
        const time = row.getValue('execution_time_ms');
        return time ? `${time} مللي ثانية` : '-';
      },
    },
  ];

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة الفوترة التلقائية</h2>
          <p className="text-muted-foreground">
            تكوين وإدارة نظام الفوترة التلقائية للعقود
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formData.enabled ? 'default' : 'secondary'}>
            {formData.enabled ? 'مفعل' : 'معطل'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            سجل التشغيل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">تفعيل الفوترة التلقائية</Label>
                  <p className="text-sm text-muted-foreground">
                    تشغيل أو إيقاف نظام الفوترة التلقائية
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_frequency">تكرار الفوترة</Label>
                  <Select 
                    value={formData.billing_frequency} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, billing_frequency: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التكرار" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_day">يوم الفوترة</Label>
                  <Input
                    id="billing_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.billing_day}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, billing_day: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_days">أيام الاستحقاق</Label>
                  <Input
                    id="due_days"
                    type="number"
                    min="1"
                    value={formData.due_days}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, due_days: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate">معدل الضريبة (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_send_invoices">إرسال تلقائي للفواتير</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال الفواتير تلقائياً عند الإنشاء
                    </p>
                  </div>
                  <Switch
                    id="auto_send_invoices"
                    checked={formData.auto_send_invoices}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, auto_send_invoices: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_send_reminders">إرسال تذكيرات تلقائية</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال تذكيرات قبل تاريخ الاستحقاق
                    </p>
                  </div>
                  <Switch
                    id="auto_send_reminders"
                    checked={formData.auto_send_reminders}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, auto_send_reminders: checked }))
                    }
                  />
                </div>

                {formData.auto_send_reminders && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder_days_before">أيام التذكير قبل الاستحقاق</Label>
                    <Input
                      id="reminder_days_before"
                      type="number"
                      min="1"
                      value={formData.reminder_days_before}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) }))
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="late_fee_enabled">تفعيل رسوم التأخير</Label>
                    <p className="text-sm text-muted-foreground">
                      فرض رسوم إضافية على الفواتير المتأخرة
                    </p>
                  </div>
                  <Switch
                    id="late_fee_enabled"
                    checked={formData.late_fee_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, late_fee_enabled: checked }))
                    }
                  />
                </div>

                {formData.late_fee_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="late_fee_amount">مبلغ رسوم التأخير (د.ك)</Label>
                      <Input
                        id="late_fee_amount"
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.late_fee_amount}
                        onChange={(e) => 
                          setFormData(prev => ({ ...prev, late_fee_amount: parseFloat(e.target.value) }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="late_fee_percentage">نسبة رسوم التأخير (%)</Label>
                      <Input
                        id="late_fee_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.late_fee_percentage}
                        onChange={(e) => 
                          setFormData(prev => ({ ...prev, late_fee_percentage: parseFloat(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                سجل تشغيل الفوترة التلقائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={logsColumns}
                data={logs}
                isLoading={logsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoBillingManager;
