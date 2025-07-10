import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Building2,
  FileText
} from "lucide-react";
import { saasService } from '@/services/saasService';
import { supabase } from '@/integrations/supabase/client';

interface BillingJob {
  id: string;
  type: 'monthly' | 'yearly' | 'usage_based';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduled_for: string;
  executed_at?: string;
  tenant_count: number;
  processed_count: number;
  error_message?: string;
}

const AutomatedBilling: React.FC = () => {
  const [jobs, setJobs] = useState<BillingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBillingJobs();
    loadBillingSettings();
  }, []);

  const loadBillingJobs = async () => {
    try {
      // محاكاة بيانات المهام - في الواقع ستأتي من قاعدة البيانات
      const mockJobs: BillingJob[] = [
        {
          id: '1',
          type: 'monthly',
          status: 'completed',
          scheduled_for: new Date().toISOString(),
          executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tenant_count: 25,
          processed_count: 25
        },
        {
          id: '2',
          type: 'yearly',
          status: 'pending',
          scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tenant_count: 5,
          processed_count: 0
        },
        {
          id: '3',
          type: 'usage_based',
          status: 'failed',
          scheduled_for: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          executed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          tenant_count: 10,
          processed_count: 7,
          error_message: 'فشل في الاتصال بنظام الدفع'
        }
      ];
      setJobs(mockJobs);
    } catch (error) {
      console.error('Error loading billing jobs:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل مهام الفوترة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBillingSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'automated_billing_enabled')
        .single();

      if (data) {
        setBillingEnabled(data.setting_value as boolean);
      }
    } catch (error) {
      console.error('Error loading billing settings:', error);
    }
  };

  const toggleBillingEnabled = async (enabled: boolean) => {
    try {
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'automated_billing_enabled',
          setting_value: enabled,
          setting_type: 'billing',
          description: 'تمكين الفوترة التلقائية'
        });

      setBillingEnabled(enabled);
      toast({
        title: "نجح",
        description: enabled ? "تم تمكين الفوترة التلقائية" : "تم إيقاف الفوترة التلقائية",
      });
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات الفوترة",
        variant: "destructive",
      });
    }
  };

  const runBillingJob = async (type: 'monthly' | 'yearly' | 'usage_based') => {
    try {
      // استدعاء Edge Function للفوترة التلقائية
      const { data, error } = await supabase.functions.invoke('automatic-billing', {
        body: { billing_type: type }
      });

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم بدء عملية الفوترة التلقائية",
      });
      
      loadBillingJobs();
    } catch (error) {
      console.error('Error running billing job:', error);
      toast({
        title: "خطأ",
        description: "فشل في تشغيل عملية الفوترة",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'مكتملة', variant: 'default' as const },
      failed: { label: 'فاشلة', variant: 'destructive' as const },
      running: { label: 'قيد التشغيل', variant: 'secondary' as const },
      pending: { label: 'في الانتظار', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getJobTypeLabel = (type: string) => {
    const typeLabels = {
      monthly: 'فوترة شهرية',
      yearly: 'فوترة سنوية',
      usage_based: 'فوترة بحسب الاستخدام'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-KW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            إعدادات الفوترة التلقائية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="billing-enabled">تمكين الفوترة التلقائية</Label>
              <p className="text-sm text-muted-foreground">
                عند التمكين، سيتم إنشاء الفواتير تلقائياً حسب دورة الفوترة المحددة
              </p>
            </div>
            <Switch
              id="billing-enabled"
              checked={billingEnabled}
              onCheckedChange={toggleBillingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              عمليات الفوترة
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBillingJob('monthly')}
                disabled={!billingEnabled}
              >
                فوترة شهرية
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBillingJob('yearly')}
                disabled={!billingEnabled}
              >
                فوترة سنوية
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBillingJob('usage_based')}
                disabled={!billingEnabled}
              >
                فوترة بالاستخدام
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium">{getJobTypeLabel(job.type)}</div>
                    <div className="text-sm text-muted-foreground">
                      مجدولة لـ: {formatDate(job.scheduled_for)}
                    </div>
                    {job.executed_at && (
                      <div className="text-sm text-muted-foreground">
                        تم التنفيذ في: {formatDate(job.executed_at)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">{job.processed_count}/{job.tenant_count}</div>
                    <div className="text-xs text-muted-foreground">مؤسسة</div>
                  </div>
                  
                  {getStatusBadge(job.status)}
                  
                  {job.error_message && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">{job.error_message}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {jobs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد عمليات فوترة مجدولة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمليات المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              آخر 30 يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمليات الفاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              آخر 30 يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمليات المجدولة</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              في الانتظار
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutomatedBilling;