
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CostCenterService, type CostCenter } from '@/services/BusinessServices/CostCenterService';
import { toast } from 'sonner';
import { Loader, Save, X } from 'lucide-react';

interface CostCenterFormProps {
  costCenter?: CostCenter;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CostCenterForm: React.FC<CostCenterFormProps> = ({ 
  costCenter, 
  parentId,
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cost_center_code: costCenter?.cost_center_code || '',
    cost_center_name: costCenter?.cost_center_name || '',
    cost_center_type: costCenter?.cost_center_type || '',
    parent_cost_center_id: costCenter?.parent_cost_center_id || parentId || '',
    description: costCenter?.description || '',
    is_active: costCenter?.is_active ?? true,
    budget_amount: costCenter?.budget_amount || 0,
    manager_id: costCenter?.manager_id || '',
    department_id: costCenter?.department_id || '',
    location: costCenter?.location || '',
    approval_required: costCenter?.approval_required ?? false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const costCenterService = new CostCenterService();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!formData.cost_center_name.trim()) {
      newErrors.cost_center_name = 'اسم مركز التكلفة مطلوب';
    }

    if (!formData.cost_center_code.trim()) {
      newErrors.cost_center_code = 'رمز مركز التكلفة مطلوب';
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.cost_center_code)) {
      newErrors.cost_center_code = 'رمز مركز التكلفة يجب أن يحتوي على أحرف وأرقام فقط';
    }

    if (!formData.cost_center_type) {
      newErrors.cost_center_type = 'نوع مركز التكلفة مطلوب';
    }

    // Budget validation
    if (formData.budget_amount < 0) {
      newErrors.budget_amount = 'الميزانية لا يمكن أن تكون سالبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);
    
    try {
      // Clean up empty string values for UUID fields
      const cleanedData = {
        ...formData,
        parent_cost_center_id: formData.parent_cost_center_id || undefined,
        manager_id: formData.manager_id || undefined,
        department_id: formData.department_id || undefined,
        location: formData.location || undefined,
        description: formData.description || undefined
      };

      if (costCenter) {
        await costCenterService.updateCostCenter(costCenter.id, cleanedData);
        toast.success('تم تحديث مركز التكلفة بنجاح');
      } else {
        await costCenterService.createCostCenter(cleanedData);
        toast.success('تم إنشاء مركز التكلفة بنجاح');
      }

      onSuccess();
    } catch (error: any) {
      console.error('خطأ في حفظ مركز التكلفة:', error);
      toast.error(error.message || 'فشل في حفظ مركز التكلفة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold rtl-title">
            {costCenter ? 'تعديل مركز التكلفة' : 'إضافة مركز تكلفة جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl-title">البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_center_code" className="rtl-label">
                    رمز مركز التكلفة *
                  </Label>
                  <Input
                    id="cost_center_code"
                    value={formData.cost_center_code}
                    onChange={(e) => handleInputChange('cost_center_code', e.target.value)}
                    placeholder="CC001"
                    disabled={loading}
                    className={errors.cost_center_code ? 'border-red-500' : ''}
                  />
                  {errors.cost_center_code && (
                    <p className="text-sm text-red-500">{errors.cost_center_code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_center_name" className="rtl-label">
                    اسم مركز التكلفة *
                  </Label>
                  <Input
                    id="cost_center_name"
                    value={formData.cost_center_name}
                    onChange={(e) => handleInputChange('cost_center_name', e.target.value)}
                    placeholder="إدارة المبيعات"
                    disabled={loading}
                    className={errors.cost_center_name ? 'border-red-500' : ''}
                  />
                  {errors.cost_center_name && (
                    <p className="text-sm text-red-500">{errors.cost_center_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_center_type" className="rtl-label">
                  نوع مركز التكلفة *
                </Label>
                <Select 
                  value={formData.cost_center_type} 
                  onValueChange={(value) => handleInputChange('cost_center_type', value)}
                  disabled={loading}
                >
                  <SelectTrigger className={errors.cost_center_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر نوع مركز التكلفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">تشغيلي</SelectItem>
                    <SelectItem value="administrative">إداري</SelectItem>
                    <SelectItem value="support">دعم</SelectItem>
                    <SelectItem value="revenue">إيرادي</SelectItem>
                    <SelectItem value="project">مشروع</SelectItem>
                  </SelectContent>
                </Select>
                {errors.cost_center_type && (
                  <p className="text-sm text-red-500">{errors.cost_center_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="rtl-label">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف مركز التكلفة"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl-title">الإعدادات المالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget_amount" className="rtl-label">
                  الميزانية المخصصة (د.ك)
                </Label>
                <Input
                  id="budget_amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.budget_amount}
                  onChange={(e) => handleInputChange('budget_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  disabled={loading}
                  className={errors.budget_amount ? 'border-red-500' : ''}
                />
                {errors.budget_amount && (
                  <p className="text-sm text-red-500">{errors.budget_amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="rtl-label">الموقع</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="الطابق الأول - مبنى الإدارة"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl-title">الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rtl-flex">
                <Label htmlFor="is_active" className="rtl-label">مركز تكلفة نشط</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rtl-flex">
                <Label htmlFor="approval_required" className="rtl-label">
                  يتطلب موافقة للإنفاق
                </Label>
                <Switch
                  id="approval_required"
                  checked={formData.approval_required}
                  onCheckedChange={(checked) => handleInputChange('approval_required', checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="gap-2 rtl-flex"
            >
              <X className="h-4 w-4" />
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 rtl-flex min-w-[120px]"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'جاري الحفظ...' : (costCenter ? 'تحديث' : 'إنشاء')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CostCenterForm;
