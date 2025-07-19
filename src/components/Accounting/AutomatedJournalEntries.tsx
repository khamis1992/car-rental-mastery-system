import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Settings, TrendingUp, AlertCircle, CheckCircle, X, Plus, Play, History, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AutomatedJournalEntryService, AutomationRule, AutomationExecution } from '@/services/AutomatedJournalEntryService';
import { accountingService } from '@/services/accountingService';
import { ChartOfAccount } from '@/types/accounting';

export const AutomatedJournalEntries = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRuleDialogOpen, setNewRuleDialogOpen] = useState(false);
  const [executionHistoryOpen, setExecutionHistoryOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const { toast } = useToast();

  const automationService = new AutomatedJournalEntryService();

  // Form state for new rule
  const [formData, setFormData] = useState({
    rule_name: '',
    trigger_event: 'invoice_generated' as AutomationRule['trigger_event'],
    conditions: {},
    account_mappings: {
      debit_account_id: '',
      credit_account_id: '',
      description_template: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, accountsData, executionsData] = await Promise.all([
        automationService.getAutomationRules(),
        accountingService.getChartOfAccounts(),
        automationService.getExecutionHistory()
      ]);

      setRules(rulesData);
      setAccounts(accountsData.filter(acc => acc.allow_posting));
      setExecutions(executionsData);

      // إنشاء قواعد افتراضية إذا لم توجد قواعد
      if (rulesData.length === 0) {
        try {
          await automationService.createDefaultRules();
          await loadData(); // إعادة تحميل البيانات
        } catch (error) {
          console.log('تم إنشاء قواعد افتراضية من قبل');
        }
      }
    } catch (error: any) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحميل قواعد القيود التلقائية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await automationService.toggleRuleStatus(ruleId, isActive);
      setRules(rules.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));
      
      toast({
        title: 'تم بنجاح',
        description: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} القاعدة بنجاح`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث حالة القاعدة',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRule = async () => {
    try {
      if (!formData.rule_name || !formData.account_mappings.debit_account_id || !formData.account_mappings.credit_account_id) {
        toast({
          title: 'خطأ',
          description: 'جميع الحقول مطلوبة',
          variant: 'destructive',
        });
        return;
      }

      const newRule = await automationService.createAutomationRule({
        rule_name: formData.rule_name,
        trigger_event: formData.trigger_event,
        conditions: formData.conditions,
        account_mappings: {
          debit_account_id: formData.account_mappings.debit_account_id,
          credit_account_id: formData.account_mappings.credit_account_id,
          description_template: formData.account_mappings.description_template || 'قيد تلقائي - {{reference_id}}'
        },
        is_active: true,
        tenant_id: '', // سيتم تعيينه في الخدمة
        created_by: '' // سيتم تعيينه في الخدمة
      });

      setRules([...rules, newRule]);
      setNewRuleDialogOpen(false);
      resetForm();
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء القاعدة بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء القاعدة',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      trigger_event: 'invoice_generated',
      conditions: {},
      account_mappings: {
        debit_account_id: '',
        credit_account_id: '',
        description_template: ''
      }
    });
  };

  const runRuleManually = async (ruleId: string) => {
    try {
      // في الواقع هذا سيتطلب بيانات فعلية لتنفيذ القاعدة
      // هذا مثال للتوضيح فقط
      toast({
        title: 'قيد التطوير',
        description: 'تشغيل القواعد يدوياً سيتم إضافته قريباً',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تشغيل القاعدة',
        variant: 'destructive',
      });
    }
  };

  const showExecutionHistory = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setExecutionHistoryOpen(true);
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
          <Button onClick={() => setNewRuleDialogOpen(true)}>
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

      {/* Dialog for creating new rules */}
      <Dialog open={newRuleDialogOpen} onOpenChange={setNewRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="rtl-title">إنشاء قاعدة أتمتة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule_name" className="rtl-label">اسم القاعدة</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="اسم القاعدة"
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="trigger_event" className="rtl-label">الحدث المحفز</Label>
              <Select value={formData.trigger_event} onValueChange={(value) => setFormData({ ...formData, trigger_event: value as AutomationRule['trigger_event'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice_generated">إنشاء فاتورة</SelectItem>
                  <SelectItem value="payment_received">استلام دفعة</SelectItem>
                  <SelectItem value="expense_recorded">تسجيل مصروف</SelectItem>
                  <SelectItem value="contract_signed">توقيع عقد</SelectItem>
                  <SelectItem value="rental_completed">إكمال إيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit_account" className="rtl-label">الحساب المدين</Label>
                <Select value={formData.account_mappings.debit_account_id} onValueChange={(value) => setFormData({ ...formData, account_mappings: { ...formData.account_mappings, debit_account_id: value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب المدين" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="credit_account" className="rtl-label">الحساب الدائن</Label>
                <Select value={formData.account_mappings.credit_account_id} onValueChange={(value) => setFormData({ ...formData, account_mappings: { ...formData.account_mappings, credit_account_id: value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب الدائن" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description_template" className="rtl-label">قالب الوصف</Label>
              <Textarea
                id="description_template"
                value={formData.account_mappings.description_template}
                onChange={(e) => setFormData({ ...formData, account_mappings: { ...formData.account_mappings, description_template: e.target.value } })}
                placeholder="قيد تلقائي - {{reference_id}} - {{amount}} د.ك"
                className="text-right"
              />
              <p className="text-sm text-muted-foreground mt-1">
                يمكنك استخدام: {`{{reference_id}}, {{amount}}, {{description}}, {{date}}`}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewRuleDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateRule}>
                إنشاء القاعدة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};