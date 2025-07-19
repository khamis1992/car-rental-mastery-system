
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CostCenterService, type CostCenter, type CreateCostCenterData } from '@/services/BusinessServices/CostCenterService';
import { useSecureTenantData } from '@/hooks/useSecureTenantData';
import { useTenant } from '@/contexts/TenantContext';

interface CostCenterFormProps {
  costCenter?: CostCenter;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CostCenterForm = ({ costCenter, parentId, onClose, onSuccess }: CostCenterFormProps) => {
  const [formData, setFormData] = useState<CreateCostCenterData>({
    cost_center_code: '',
    cost_center_name: '',
    description: '',
    cost_center_type: 'operational',
    cost_center_category: '',
    manager_id: '',
    budget_amount: 0,
    department_id: '',
    parent_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const costCenterService = new CostCenterService();
  const { currentTenant } = useTenant();
  const { useSecureEmployees, useSecureDepartments } = useSecureTenantData();

  // جلب الأقسام بشكل آمن
  const { data: departments, isLoading: loadingDepartments } = useSecureDepartments();

  // جلب الموظفين بشكل آمن
  const { data: employees, isLoading: loadingEmployees } = useSecureEmployees();

  // جلب مراكز التكلفة للمراكز الأب
  const { data: parentCostCenters } = useQuery({
    queryKey: ['parent-cost-centers', currentTenant?.id],
    queryFn: () => costCenterService.getAllCostCenters(),
    enabled: !!currentTenant?.id
  });

  useEffect(() => {
    if (costCenter) {
      setFormData({
        cost_center_code: costCenter.cost_center_code,
        cost_center_name: costCenter.cost_center_name,
        description: costCenter.description || '',
        cost_center_type: costCenter.cost_center_type as 'operational' | 'administrative' | 'revenue' | 'support',
        cost_center_category: costCenter.cost_center_category || '',
        manager_id: costCenter.manager_id || '',
        budget_amount: costCenter.budget_amount,
        department_id: costCenter.department_id || '',
        parent_id: costCenter.parent_id || ''
      });
    } else if (parentId) {
      setFormData(prev => ({
        ...prev,
        parent_id: parentId
      }));
    }
  }, [costCenter, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 CostCenterForm: بدء عملية الحفظ');
    console.log('📋 CostCenterForm: بيانات النموذج:', formData);
    console.log('🏢 CostCenterForm: المؤسسة الحالية:', currentTenant);
    
    if (!currentTenant?.id) {
      console.error('❌ CostCenterForm: لا توجد مؤسسة نشطة');
      toast.error('خطأ: لا توجد مؤسسة نشطة - يرجى إعادة تسجيل الدخول');
      return;
    }

    // التحقق من البيانات الأساسية
    if (!formData.cost_center_code?.trim()) {
      toast.error('كود مركز التكلفة مطلوب');
      return;
    }

    if (!formData.cost_center_name?.trim()) {
      toast.error('اسم مركز التكلفة مطلوب');
      return;
    }

    setIsSubmitting(true);

    try {
      // طباعة معلومات التشخيص قبل الحفظ
      const { data: debugInfo } = await supabase.rpc('debug_user_tenant_status');
      console.log('🔧 CostCenterForm: معلومات التشخيص قبل الحفظ:', debugInfo);

      if (costCenter) {
        console.log('✏️ CostCenterForm: تحديث مركز التكلفة:', costCenter.id);
        await costCenterService.updateCostCenter(costCenter.id, formData);
        toast.success('تم تحديث مركز التكلفة بنجاح');
      } else {
        console.log('➕ CostCenterForm: إنشاء مركز تكلفة جديد');
        const result = await costCenterService.createCostCenter(formData);
        console.log('✅ CostCenterForm: تم إنشاء مركز التكلفة:', result);
        toast.success('تم إنشاء مركز التكلفة بنجاح');
      }
      onSuccess();
    } catch (error: any) {
      console.error('❌ CostCenterForm: خطأ في حفظ مركز التكلفة:', error);
      
      // معالجة أخطاء محددة
      if (error.message?.includes('tenant_id')) {
        toast.error('خطأ في تحديد المؤسسة - يرجى إعادة تسجيل الدخول');
      } else if (error.message?.includes('duplicate')) {
        toast.error('كود مركز التكلفة مستخدم بالفعل');
      } else if (error.message?.includes('foreign key')) {
        toast.error('خطأ في الربط - تأكد من صحة البيانات المرجعية');
      } else {
        toast.error(error.message || 'حدث خطأ أثناء حفظ مركز التكلفة');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateCostCenterData, value: any) => {
    const processedValue = value === 'none' ? '' : value;
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // عرض رسالة تحميل إذا لم تكن هناك مؤسسة حالية
  if (!currentTenant?.id) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="rtl-title">خطأ في التحميل</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>لا يمكن تحميل النموذج - لا توجد مؤسسة نشطة</p>
            <Button onClick={onClose} className="mt-4">إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

          <div className="grid grid-cols-3 gap-4">
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
              <Label className="rtl-label">فئة مركز التكلفة</Label>
              <Select 
                value={formData.cost_center_category || ''} 
                onValueChange={(value) => handleInputChange('cost_center_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="management">إدارة عامة</SelectItem>
                  <SelectItem value="operations">عمليات</SelectItem>
                  <SelectItem value="sales">مبيعات</SelectItem>
                  <SelectItem value="hr">موارد بشرية</SelectItem>
                  <SelectItem value="fleet">أسطول</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="insurance">تأمين</SelectItem>
                  <SelectItem value="fuel">وقود</SelectItem>
                  <SelectItem value="customer_service">خدمة عملاء</SelectItem>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="contracts">عقود</SelectItem>
                  <SelectItem value="accounting">محاسبة</SelectItem>
                  <SelectItem value="audit">مراجعة</SelectItem>
                  <SelectItem value="treasury">خزينة</SelectItem>
                  <SelectItem value="reporting">تقارير</SelectItem>
                  <SelectItem value="it">تقنية معلومات</SelectItem>
                  <SelectItem value="it_support">دعم فني</SelectItem>
                  <SelectItem value="development">تطوير</SelectItem>
                  <SelectItem value="security">أمن</SelectItem>
                  <SelectItem value="daily_ops">عمليات يومية</SelectItem>
                  <SelectItem value="warehouse">مخازن</SelectItem>
                  <SelectItem value="delivery">توصيل</SelectItem>
                  <SelectItem value="quality">جودة</SelectItem>
                  <SelectItem value="general">خدمات عامة</SelectItem>
                  <SelectItem value="facilities">مرافق</SelectItem>
                  <SelectItem value="legal">قانونية</SelectItem>
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
                disabled={loadingDepartments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingDepartments ? "جاري التحميل..." : "اختر القسم"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قسم</SelectItem>
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
                disabled={loadingEmployees}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingEmployees ? "جاري التحميل..." : "اختر المدير"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مدير</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
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
                <SelectItem value="none">مركز تكلفة رئيسي</SelectItem>
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
