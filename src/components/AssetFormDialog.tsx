import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSecureTenantData } from '@/hooks/useSecureTenantData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { currentTenant } = useTenant();
  const { useSecureEmployees } = useSecureTenantData();
  
  // استخدام الـ hook الآمن لجلب الموظفين
  const { data: employees = [], isLoading: employeesLoading } = useSecureEmployees();
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['asset-categories', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant?.id,
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['asset-locations', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('asset_locations')
        .select('*')
        .eq('is_active', true)
        .order('location_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant?.id,
  });

  const [formData, setFormData] = useState({
    asset_name: '',
    asset_code: '',
    category_id: '',
    description: '',
    purchase_cost: '',
    purchase_date: '',
    vendor: '',
    warranty_expiry: '',
    location_id: '',
    assigned_to: '',
    status: 'available',
    serial_number: '',
    model: '',
    manufacturer: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTenant?.id) {
      toast.error('لا توجد مؤسسة محددة');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const purchaseCost = parseFloat(formData.purchase_cost) || 0;
      
      const assetData = {
        tenant_id: currentTenant.id,
        asset_name: formData.asset_name,
        asset_code: formData.asset_code,
        asset_category: formData.category_id || 'general', // Required field with default
        description: formData.description,
        purchase_cost: purchaseCost,
        current_value: purchaseCost, // Set current value to purchase cost initially
        book_value: purchaseCost, // Required field
        purchase_date: formData.purchase_date,
        vendor: formData.vendor,
        warranty_expiry: formData.warranty_expiry,
        location_id: formData.location_id || null,
        assigned_employee_id: formData.assigned_to || null, // Use correct field name
        status: formData.status,
        serial_number: formData.serial_number,
        model: formData.model,
        manufacturer: formData.manufacturer,
        useful_life_years: 5, // Default useful life (required field)
        depreciation_method: 'straight_line', // Default depreciation method
        accumulated_depreciation: 0, // Start with zero accumulated depreciation
        residual_value: purchaseCost * 0.1, // Default 10% residual value
        is_active: true
      };

      const { error } = await supabase
        .from('fixed_assets')
        .insert([assetData]);

      if (error) throw error;

      toast.success('تم إضافة الأصل الثابت بنجاح');
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        asset_name: '',
        asset_code: '',
        category_id: '',
        description: '',
        purchase_cost: '',
        purchase_date: '',
        vendor: '',
        warranty_expiry: '',
        location_id: '',
        assigned_to: '',
        status: 'available',
        serial_number: '',
        model: '',
        manufacturer: ''
      });
      
    } catch (error: any) {
      console.error('خطأ في إضافة الأصل:', error);
      toast.error(error.message || 'فشل في إضافة الأصل الثابت');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rtl-content">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold rtl-title">
            إضافة أصل ثابت جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_name" className="text-right block font-medium rtl-label">
                اسم الأصل *
              </Label>
              <Input
                id="asset_name"
                value={formData.asset_name}
                onChange={(e) => handleInputChange('asset_name', e.target.value)}
                className="text-right"
                placeholder="أدخل اسم الأصل"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_code" className="text-right block font-medium rtl-label">
                رمز الأصل *
              </Label>
              <Input
                id="asset_code"
                value={formData.asset_code}
                onChange={(e) => handleInputChange('asset_code', e.target.value)}
                className="text-right"
                placeholder="أدخل رمز الأصل"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-right block font-medium rtl-label">
                الفئة
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleInputChange('category_id', value)}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.category_name}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="text-right block font-medium rtl-label">
                الشركة المصنعة
              </Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                className="text-right"
                placeholder="أدخل اسم الشركة المصنعة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-right block font-medium rtl-label">
                الموديل
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="text-right"
                placeholder="أدخل الموديل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number" className="text-right block font-medium rtl-label">
                الرقم التسلسلي
              </Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                className="text-right"
                placeholder="أدخل الرقم التسلسلي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost" className="text-right block font-medium rtl-label">
                تكلفة الشراء (د.ك) *
              </Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.001"
                min="0"
                value={formData.purchase_cost}
                onChange={(e) => handleInputChange('purchase_cost', e.target.value)}
                className="text-right"
                placeholder="0.000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date" className="text-right block font-medium rtl-label">
                تاريخ الشراء *
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-right block font-medium rtl-label">
                المورد
              </Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                className="text-right"
                placeholder="أدخل اسم المورد"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry" className="text-right block font-medium rtl-label">
                انتهاء الضمان
              </Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => handleInputChange('warranty_expiry', e.target.value)}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_id" className="text-right block font-medium rtl-label">
                الموقع
              </Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => handleInputChange('location_id', value)}
                disabled={locationsLoading}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-right block font-medium rtl-label">
                مُخصص لـ
              </Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => handleInputChange('assigned_to', value)}
                disabled={employeesLoading}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.employee_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-right block font-medium rtl-label">
              الوصف
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="text-right"
              placeholder="أدخل وصف الأصل"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 rtl-flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الأصل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
