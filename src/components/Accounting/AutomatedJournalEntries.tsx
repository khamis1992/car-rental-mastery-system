import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Settings, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutomatedRule {
  id: string;
  rule_name: string;
  trigger_event: string;
  conditions: any;
  account_mappings: any;
  is_active: boolean;
  execution_count: number;
  last_executed: string;
  success_rate: number;
}

export const AutomatedJournalEntries = () => {
  const [rules, setRules] = useState<AutomatedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRuleDialogOpen, setNewRuleDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAutomatedRules();
  }, []);

  const loadAutomatedRules = async () => {
    try {
      // Mock data for demonstration - replace with actual service call
      setRules([
        {
          id: '1',
          rule_name: 'قيود إيراد التأجير التلقائية',
          trigger_event: 'invoice_generated',
          conditions: { invoice_type: 'rental' },
          account_mappings: { debit: '1110101', credit: '4110101' },
          is_active: true,
          execution_count: 45,
          last_executed: '2024-01-15T08:30:00Z',
          success_rate: 98.5
        },
        {
          id: '2',
          rule_name: 'قيود المدفوعات النقدية',
          trigger_event: 'payment_received',
          conditions: { payment_method: 'cash' },
          account_mappings: { debit: '1110101', credit: '11201' },
          is_active: true,
          execution_count: 128,
          last_executed: '2024-01-15T10:15:00Z',
          success_rate: 99.2
        },
        {
          id: '3',
          rule_name: 'قيود مصروفات الوقود',
          trigger_event: 'expense_recorded',
          conditions: { expense_category: 'fuel' },
          account_mappings: { debit: '5101', credit: '1110201' },
          is_active: false,
          execution_count: 23,
          last_executed: '2024-01-10T14:20:00Z',
          success_rate: 95.8
        }
      ]);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قواعد القيود التلقائية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      // Update rule status
      setRules(rules.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));
      
      toast({
        title: 'تم بنجاح',
        description: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} القاعدة بنجاح`,
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة القاعدة',
        variant: 'destructive',
      });
    }
  };

  const createNewRule = async () => {
    // This would open a dialog to create new automated rules
    toast({
      title: 'قريباً',
      description: 'سيتم إضافة إنشاء قواعد جديدة قريباً',
    });
  };

  const getStatusIcon = (isActive: boolean, successRate: number) => {
    if (!isActive) return <X className="h-4 w-4 text-gray-400" />;
    if (successRate >= 95) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'نشط' : 'معطل'}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button onClick={createNewRule}>
            <Zap className="w-4 h-4 ml-2" />
            إضافة قاعدة جديدة
          </Button>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Zap className="w-5 h-5" />
            القيود المحاسبية التلقائية
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">القواعد النشطة</p>
                    <p className="text-2xl font-bold text-green-600">
                      {rules.filter(r => r.is_active).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي التنفيذات</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {rules.reduce((sum, r) => sum + r.execution_count, 0)}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط النجاح</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(rules.reduce((sum, r) => sum + r.success_rate, 0) / rules.length).toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* جدول القواعد */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">معدل النجاح</TableHead>
                <TableHead className="text-right">آخر تنفيذ</TableHead>
                <TableHead className="text-right">مرات التنفيذ</TableHead>
                <TableHead className="text-right">الحدث المحفز</TableHead>
                <TableHead className="text-right">اسم القاعدة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-right">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {getStatusIcon(rule.is_active, rule.success_rate)}
                      <span className={`font-medium ${
                        rule.success_rate >= 95 ? 'text-green-600' : 
                        rule.success_rate >= 85 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {rule.success_rate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDateTime(rule.last_executed)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {rule.execution_count} مرة
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {rule.trigger_event === 'invoice_generated' && 'إنشاء فاتورة'}
                      {rule.trigger_event === 'payment_received' && 'استلام دفعة'}
                      {rule.trigger_event === 'expense_recorded' && 'تسجيل مصروف'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {rule.rule_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(rule.is_active)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قواعد تلقائية محددة
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};