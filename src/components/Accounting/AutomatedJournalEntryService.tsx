import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Play, Pause, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  source: string;
  enabled: boolean;
  lastRun: string | null;
  status: 'running' | 'stopped' | 'error';
  description: string;
  generatedCount: number;
}

export const AutomatedJournalEntryService: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    // Mock data for demonstration
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'قيود العقود اليومية',
        source: 'contracts',
        enabled: true,
        lastRun: '2024-01-15T10:30:00Z',
        status: 'running',
        description: 'توليد قيود محاسبية تلقائية للعقود الجديدة والمحدثة',
        generatedCount: 45
      },
      {
        id: '2',
        name: 'قيود الإيجار الشهرية',
        source: 'rental_invoices',
        enabled: true,
        lastRun: '2024-01-15T09:15:00Z',
        status: 'running',
        description: 'توليد قيود إيرادات الإيجار الشهرية تلقائياً',
        generatedCount: 128
      },
      {
        id: '3',
        name: 'قيود الإهلاك',
        source: 'depreciation',
        enabled: false,
        lastRun: '2024-01-10T08:00:00Z',
        status: 'stopped',
        description: 'حساب وتسجيل قيود الإهلاك الشهرية للأصول الثابتة',
        generatedCount: 24
      },
      {
        id: '4',
        name: 'قيود المصروفات التشغيلية',
        source: 'expenses',
        enabled: true,
        lastRun: '2024-01-15T11:45:00Z',
        status: 'error',
        description: 'توليد قيود المصروفات التشغيلية من سندات المصروفات',
        generatedCount: 67
      }
    ];

    setRules(mockRules);
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setLoading(true);
    try {
      // Update rule status
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled, status: enabled ? 'running' : 'stopped' }
          : rule
      ));

      toast.success(enabled ? 'تم تفعيل القاعدة' : 'تم إيقاف القاعدة');
    } catch (error) {
      toast.error('حدث خطأ في تحديث القاعدة');
    } finally {
      setLoading(false);
    }
  };

  const runRule = async (ruleId: string) => {
    setLoading(true);
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      // Simulate running the rule
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update rule status
      setRules(prev => prev.map(r => 
        r.id === ruleId 
          ? { 
              ...r, 
              lastRun: new Date().toISOString(),
              status: 'running',
              generatedCount: r.generatedCount + Math.floor(Math.random() * 5) + 1
            }
          : r
      ));

      toast.success('تم تشغيل القاعدة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في تشغيل القاعدة');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'stopped':
        return <Pause className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'نشط';
      case 'stopped':
        return 'متوقف';
      case 'error':
        return 'خطأ';
      default:
        return 'غير معروف';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">خدمة القيود التلقائية</h2>
          <p className="text-muted-foreground">إدارة ومراقبة قواعد توليد القيود المحاسبية التلقائية</p>
        </div>
        <Button variant="outline" className="rtl-flex">
          <Settings className="w-4 h-4" />
          إعدادات متقدمة
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(rule.status)}
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(rule.status)}>
                    {getStatusLabel(rule.status)}
                  </Badge>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">المصدر</Label>
                  <p className="text-sm font-medium">{rule.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">آخر تشغيل</Label>
                  <p className="text-sm font-medium">
                    {rule.lastRun 
                      ? new Date(rule.lastRun).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'لم يتم التشغيل'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">القيود المُولدة</Label>
                  <p className="text-sm font-medium">{rule.generatedCount}</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runRule(rule.id)}
                    disabled={loading || !rule.enabled}
                    className="rtl-flex"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    تشغيل الآن
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الخدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {rules.filter(r => r.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">قواعد نشطة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rules.reduce((sum, r) => sum + r.generatedCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي القيود المُولدة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {rules.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">قواعد بها أخطاء</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {rules.filter(r => r.status === 'running').length}
              </div>
              <div className="text-sm text-muted-foreground">قواعد قيد التشغيل</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};