
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Save, TestTube, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { advancedAutomationService, AdvancedAutomationRule } from '@/services/AdvancedAutomationService';
import { accountingService } from '@/services/accountingService';

interface RuleBuilderProps {
  rule?: AdvancedAutomationRule;
  onSave?: (rule: AdvancedAutomationRule) => void;
  onCancel?: () => void;
}

export const AutomationRuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    trigger_event: '',
    conditions: {},
    account_mappings: {
      debit_account_id: '',
      credit_account_id: '',
      description_template: ''
    },
    template_description: '',
    is_active: true,
    schedule_type: '',
    schedule_config: {}
  });

  const [accounts, setAccounts] = useState([]);
  const [conditions, setConditions] = useState([{ field: '', operator: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadAccounts();
    if (rule) {
      setFormData({
        rule_name: rule.rule_name,
        rule_description: rule.rule_description || '',
        trigger_event: rule.trigger_event,
        conditions: rule.conditions,
        account_mappings: rule.account_mappings,
        template_description: rule.template_description || '',
        is_active: rule.is_active,
        schedule_type: rule.schedule_type || '',
        schedule_config: rule.schedule_config
      });
    }
  }, [rule]);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountingService.getChartOfAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('خطأ في تحميل الحسابات:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccountMappingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      account_mappings: {
        ...prev.account_mappings,
        [field]: value
      }
    }));
  };

  const addCondition = () => {
    setConditions(prev => [...prev, { field: '', operator: '', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setConditions(prev => prev.map((cond, i) => 
      i === index ? { ...cond, [field]: value } : cond
    ));
  };

  const handleSave = async () => {
    if (!formData.rule_name || !formData.trigger_event || !formData.account_mappings.debit_account_id || !formData.account_mappings.credit_account_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      // تحويل الشروط إلى كائن
      const conditionsObj = conditions.reduce((acc, cond) => {
        if (cond.field && cond.operator && cond.value) {
          acc[cond.field] = {
            operator: cond.operator,
            value: cond.value
          };
        }
        return acc;
      }, {});

      const ruleData = {
        ...formData,
        conditions: conditionsObj
      };

      let savedRule;
      if (rule) {
        savedRule = await advancedAutomationService.updateAutomationRule(rule.id, ruleData);
      } else {
        savedRule = await advancedAutomationService.createAutomationRule(ruleData);
      }

      toast.success(rule ? 'تم تحديث القاعدة بنجاح' : 'تم إنشاء القاعدة بنجاح');
      onSave?.(savedRule);
    } catch (error) {
      console.error('خطأ في حفظ القاعدة:', error);
      toast.error('حدث خطأ في حفظ القاعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!rule?.id) {
      toast.error('يجب حفظ القاعدة أولاً لاختبارها');
      return;
    }

    setTesting(true);
    try {
      await advancedAutomationService.executeAutomationRule(rule.id, {
        test_mode: true,
        test_data: { amount: 1000, description: 'اختبار القاعدة' }
      });
      toast.success('تم اختبار القاعدة بنجاح');
    } catch (error) {
      console.error('خطأ في اختبار القاعدة:', error);
      toast.error('فشل في اختبار القاعدة');
    } finally {
      setTesting(false);
    }
  };

  const triggerEvents = [
    { value: 'contract_created', label: 'إنشاء عقد' },
    { value: 'contract_completed', label: 'إتمام عقد' },
    { value: 'payment_received', label: 'استلام دفعة' },
    { value: 'vehicle_maintenance', label: 'صيانة مركبة' },
    { value: 'fuel_purchase', label: 'شراء وقود' },
    { value: 'invoice_generated', label: 'إنشاء فاتورة' },
    { value: 'scheduled', label: 'مجدول' },
    { value: 'manual_trigger', label: 'يدوي' },
    { value: 'period_end', label: 'نهاية فترة' }
  ];

  const scheduleTypes = [
    { value: '', label: 'غير مجدول' },
    { value: 'once', label: 'مرة واحدة' },
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'quarterly', label: 'ربع سنوي' },
    { value: 'yearly', label: 'سنوي' }
  ];

  const operators = [
    { value: 'equals', label: 'يساوي' },
    { value: 'not_equals', label: 'لا يساوي' },
    { value: 'greater_than', label: 'أكبر من' },
    { value: 'less_than', label: 'أقل من' },
    { value: 'contains', label: 'يحتوي على' },
    { value: 'starts_with', label: 'يبدأ بـ' },
    { value: 'ends_with', label: 'ينتهي بـ' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {rule ? 'تعديل قاعدة الأتمتة' : 'إنشاء قاعدة أتمتة جديدة'}
        </h2>
        <div className="flex gap-2">
          {rule && (
            <Button variant="outline" onClick={handleTest} disabled={testing} className="rtl-flex">
              <TestTube className="w-4 h-4" />
              {testing ? 'جاري الاختبار...' : 'اختبار'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading} className="rtl-flex">
            <Save className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المعلومات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rule_name">اسم القاعدة *</Label>
              <Input
                id="rule_name"
                value={formData.rule_name}
                onChange={(e) => handleInputChange('rule_name', e.target.value)}
                placeholder="أدخل اسم القاعدة"
              />
            </div>

            <div>
              <Label htmlFor="rule_description">الوصف</Label>
              <Textarea
                id="rule_description"
                value={formData.rule_description}
                onChange={(e) => handleInputChange('rule_description', e.target.value)}
                placeholder="وصف القاعدة وطريقة عملها"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="trigger_event">الحدث المحفز *</Label>
              <Select 
                value={formData.trigger_event} 
                onValueChange={(value) => handleInputChange('trigger_event', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحدث المحفز" />
                </SelectTrigger>
                <SelectContent>
                  {triggerEvents.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="schedule_type">نوع الجدولة</Label>
              <Select 
                value={formData.schedule_type} 
                onValueChange={(value) => handleInputChange('schedule_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الجدولة" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">قاعدة نشطة</Label>
            </div>
          </CardContent>
        </Card>

        {/* ربط الحسابات */}
        <Card>
          <CardHeader>
            <CardTitle>ربط الحسابات المحاسبية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="debit_account">الحساب المدين *</Label>
              <Select 
                value={formData.account_mappings.debit_account_id} 
                onValueChange={(value) => handleAccountMappingChange('debit_account_id', value)}
              >
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
              <Label htmlFor="credit_account">الحساب الدائن *</Label>
              <Select 
                value={formData.account_mappings.credit_account_id} 
                onValueChange={(value) => handleAccountMappingChange('credit_account_id', value)}
              >
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

            <div>
              <Label htmlFor="description_template">قالب الوصف</Label>
              <Textarea
                id="description_template"
                value={formData.account_mappings.description_template}
                onChange={(e) => handleAccountMappingChange('description_template', e.target.value)}
                placeholder="قالب وصف القيد المحاسبي (يمكن استخدام متغيرات مثل {{amount}}, {{date}})"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الشروط */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-flex">
            <Settings className="w-5 h-5" />
            شروط التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>الحقل</Label>
                  <Input
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    placeholder="اسم الحقل"
                  />
                </div>
                <div className="flex-1">
                  <Label>المشغل</Label>
                  <Select 
                    value={condition.operator} 
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشغل" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>القيمة</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="القيمة المطلوبة"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  disabled={conditions.length === 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button variant="outline" onClick={addCondition} className="rtl-flex">
              <Plus className="w-4 h-4" />
              إضافة شرط
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
