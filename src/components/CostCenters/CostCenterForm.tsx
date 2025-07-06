import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CostCenterService, type CostCenter, type CreateCostCenterData } from '@/services/BusinessServices/CostCenterService';
import { supabase } from '@/integrations/supabase/client';

interface CostCenterFormProps {
  costCenter?: CostCenter;
  onClose: () => void;
  onSuccess: () => void;
}

const CostCenterForm = ({ costCenter, onClose, onSuccess }: CostCenterFormProps) => {
  const [formData, setFormData] = useState<CreateCostCenterData>({
    cost_center_code: '',
    cost_center_name: '',
    description: '',
    cost_center_type: 'operational',
    manager_id: '',
    budget_amount: 0,
    department_id: '',
    parent_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const costCenterService = new CostCenterService();

  // جلب الأقسام
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('is_active', true)
        .order('department_name');
      
      if (error) throw error;
      return data;
    }
  });

  // جلب الموظفين
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  // جلب مراكز التكلفة للمراكز الأب
  const { data: parentCostCenters } = useQuery({
    queryKey: ['parent-cost-centers'],
    queryFn: () => costCenterService.getAllCostCenters()
  });

  useEffect(() => {
    if (costCenter) {
      setFormData({
        cost_center_code: costCenter.cost_center_code,
        cost_center_name: costCenter.cost_center_name,
        description: costCenter.description || '',
        cost_center_type: costCenter.cost_center_type as 'operational' | 'administrative' | 'revenue' | 'support',
        manager_id: costCenter.manager_id || '',
        budget_amount: costCenter.budget_amount,
        department_id: costCenter.department_id || '',
        parent_id: costCenter.parent_id || ''
      });
    }
  }, [costCenter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (costCenter) {
        await costCenterService.updateCostCenter(costCenter.id, formData);
        toast.success('تم تحديث مركز التكلفة بنجاح');
      } else {
        await costCenterService.createCostCenter(formData);
        toast.success('تم إنشاء مركز التكلفة بنجاح');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving cost center:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ مركز التكلفة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateCostCenterData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="rtl-title">
            {costCenter ? 'تعديل مركز التكلفة' : 'إضافة مركز تكلفة جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_center_code" className="rtl-label">كود مركز التكلفة *</Label>
              <Input
                id="cost_center_code"
                value={formData.cost_center_code}
                onChange={(e) => handleInputChange('cost_center_code', e.target.value)}
                placeholder="مثل: CC-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_center_name" className="rtl-label">اسم مركز التكلفة *</Label>
              <Input
                id="cost_center_name"
                value={formData.cost_center_name}
                onChange={(e) => handleInputChange('cost_center_name', e.target.value)}
                placeholder="اسم مركز التكلفة"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">نوع مركز التكلفة</Label>
              <Select 
                value={formData.cost_center_type} 
                onValueChange={(value) => handleInputChange('cost_center_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">تشغيلي</SelectItem>
                  <SelectItem value="administrative">إداري</SelectItem>
                  <SelectItem value="revenue">إيرادات</SelectItem>
                  <SelectItem value="support">دعم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">الميزانية المخصصة</Label>
              <Input
                type="number"
                value={formData.budget_amount}
                onChange={(e) => handleInputChange('budget_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.000"
                min="0"
                step="0.001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">القسم</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={(value) => handleInputChange('department_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون قسم</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">المدير المسؤول</Label>
              <Select 
                value={formData.manager_id} 
                onValueChange={(value) => handleInputChange('manager_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون مدير</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="rtl-label">مركز التكلفة الأب</Label>
            <Select 
              value={formData.parent_id} 
              onValueChange={(value) => handleInputChange('parent_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مركز التكلفة الأب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">مركز تكلفة رئيسي</SelectItem>
                {parentCostCenters?.filter(cc => cc.id !== costCenter?.id).map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.cost_center_name} ({cc.cost_center_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="rtl-label">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="وصف مركز التكلفة..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 rtl-flex">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : (costCenter ? 'تحديث' : 'إضافة')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CostCenterForm;