
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Save, X } from 'lucide-react';

interface AutomationRuleBuilderProps {
  onSave: () => void;
  onCancel: () => void;
}

interface BasicRule {
  rule_name: string;
  rule_description: string;
  trigger_event: string;
  debit_account_id: string;
  credit_account_id: string;
  description_template: string;
  is_active: boolean;
}

export const AutomationRuleBuilder: React.FC<AutomationRuleBuilderProps> = ({
  onSave,
  onCancel
}) => {
  const [rule, setRule] = useState<BasicRule>({
    rule_name: '',
    rule_description: '',
    trigger_event: 'invoice_generated',
    debit_account_id: '',
    credit_account_id: '',
    description_template: '',
    is_active: true
  });

  const [currentStep, setCurrentStep] = useState(1);

  const triggerEvents = [
    { value: 'invoice_generated', label: 'إنشاء فاتورة' },
    { value: 'payment_received', label: 'استلام دفعة' },
    { value: 'contract_created', label: 'إنشاء عقد' },
    { value: 'vehicle_maintenance', label: 'صيانة مركبة' },
    { value: 'fuel_purchase', label: 'شراء وقود' }
  ];

  const handleSave = () => {
    console.log('Saving automation rule:', rule);
    onSave();
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rule_name" className="rtl-label">اسم القاعدة</Label>
        <Input
          id="rule_name"
          value={rule.rule_name}
          onChange={(e) => setRule(prev => ({ ...prev, rule_name: e.target.value }))}
          placeholder="أدخل اسم القاعدة"
          className="rtl-input"
        />
      </div>

      <div>
        <Label htmlFor="rule_description" className="rtl-label">وصف القاعدة</Label>
        <Textarea
          id="rule_description"
          value={rule.rule_description}
          onChange={(e) => setRule(prev => ({ ...prev, rule_description: e.target.value }))}
          placeholder="أدخل وصف القاعدة"
          className="rtl-input"
        />
      </div>

      <div>
        <Label htmlFor="trigger_event" className="rtl-label">الحدث المحفز</Label>
        <Select
          value={rule.trigger_event}
          onValueChange={(value) => setRule(prev => ({ ...prev, trigger_event: value }))}
        >
          <SelectTrigger className="rtl-input">
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="description_template" className="rtl-label">قالب الوصف</Label>
        <Input
          id="description_template"
          value={rule.description_template}
          onChange={(e) => setRule(prev => ({ ...prev, description_template: e.target.value }))}
          placeholder="قيد تلقائي - {{reference_id}}"
          className="rtl-input"
        />
      </div>

      <div>
        <Label htmlFor="debit_account" className="rtl-label">الحساب المدين</Label>
        <Input
          id="debit_account"
          value={rule.debit_account_id}
          onChange={(e) => setRule(prev => ({ ...prev, debit_account_id: e.target.value }))}
          placeholder="معرف الحساب المدين"
          className="rtl-input"
        />
      </div>

      <div>
        <Label htmlFor="credit_account" className="rtl-label">الحساب الدائن</Label>
        <Input
          id="credit_account"
          value={rule.credit_account_id}
          onChange={(e) => setRule(prev => ({ ...prev, credit_account_id: e.target.value }))}
          placeholder="معرف الحساب الدائن"
          className="rtl-input"
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch
          id="is_active"
          checked={rule.is_active}
          onCheckedChange={(checked) => setRule(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active" className="rtl-label">القاعدة نشطة</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold rtl-title">بناء قاعدة أتمتة جديدة</h2>
          <p className="text-muted-foreground">
            إنشاء قاعدة لتوليد القيود المحاسبية تلقائياً
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="rtl-flex">
            <X className="w-4 h-4" />
            إلغاء
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">
              الخطوة {currentStep} من 2
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {currentStep === 1 ? 'معلومات أساسية' : 'تكوين الحسابات'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 ? renderStep1() : renderStep2()}

          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="rtl-flex"
              >
                السابق
              </Button>
            )}
            
            <div className="flex gap-2 mr-auto">
              {currentStep < 2 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!rule.rule_name || !rule.trigger_event}
                  className="rtl-flex"
                >
                  التالي
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!rule.debit_account_id || !rule.credit_account_id || !rule.description_template}
                  className="rtl-flex"
                >
                  <Save className="w-4 h-4" />
                  حفظ القاعدة
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
