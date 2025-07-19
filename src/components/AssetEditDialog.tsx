
import React, { useState, useEffect } from 'react';
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

interface Asset {
  id: string;
  asset_name: string;
  asset_code: string;
  asset_category?: string;
  description?: string;
  purchase_cost: number;
  purchase_date: string;
  vendor?: string;
  warranty_expiry?: string;
  location_id?: string;
  assigned_employee_id?: string;
  status: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
}

interface AssetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSuccess?: () => void;
}

export const AssetEditDialog: React.FC<AssetEditDialogProps> = ({
  open,
  onOpenChange,
  asset,
  onSuccess
}) => {
  const { currentTenant } = useTenant();
  const { useSecureEmployees } = useSecureTenantData();
  
  // Use secure employees hook instead of direct query
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

  // Asset form state
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_code: '',
    asset_category: '',
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

  // Populate form when asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        asset_name: asset.asset_name || '',
        asset_code: asset.asset_code || '',
        asset_category: asset.asset_category || '',
        description: asset.description || '',
        purchase_cost: asset.purchase_cost?.toString() || '',
        purchase_date: asset.purchase_date || '',
        vendor: asset.vendor || '',
        warranty_expiry: asset.warranty_expiry || '',
        location_id: asset.location_id || '',
        assigned_to: asset.assigned_employee_id || '',
        status: asset.status || 'available',
        serial_number: asset.serial_number || '',
        model: asset.model || '',
        manufacturer: asset.manufacturer || ''
      });
    }
  }, [asset]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !currentTenant?.id) {
      toast.error('لا توجد بيانات أصل أو مؤسسة للتحديث');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const purchaseCost = parseFloat(formData.purchase_cost) || 0;
      
      const updateData = {
        asset_name: formData.asset_name,
        asset_code: formData.asset_code,
        asset_category: formData.asset_category || 'general',
        description: formData.description,
        purchase_cost: purchaseCost,
        purchase_date: formData.purchase_date,
        vendor: formData.vendor,
        warranty_expiry: formData.warranty_expiry,
        location_id: formData.location_id || null,
        assigned_employee_id: formData.assigned_to || null,
        status: formData.status,
        serial_number: formData.serial_number,
        model: formData.model,
        manufacturer: formData.manufacturer
      };

      const { error } = await supabase
        .from('fixed_assets')
        .update(updateData)
        .eq('id', asset.id)
        .eq('tenant_id', currentTenant.id); // Ensure tenant isolation

      if (error) throw error;

      toast.success('تم تحديث الأصل الثابت بنجاح');
      onSuccess?.();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('خطأ في تحديث الأصل:', error);
      toast.error(error.message || 'فشل في تحديث الأصل الثابت');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rtl-content">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold">
            تعديل الأصل الثابت
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_name" className="text-right block font-medium">
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
              <Label htmlFor="asset_code" className="text-right block font-medium">
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
              <Label htmlFor="asset_category" className="text-right block font-medium">
                الفئة
              </Label>
              <Select
                value={formData.asset_category}
                onValueChange={(value) => handleInputChange('asset_category', value)}
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
              <Label htmlFor="status" className="text-right block font-medium">
                الحالة
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                  <SelectItem value="maintenance">تحت الصيانة</SelectItem>
                  <SelectItem value="retired">خارج الخدمة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="text-right block font-medium">
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
              <Label htmlFor="model" className="text-right block font-medium">
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
              <Label htmlFor="serial_number" className="text-right block font-medium">
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
              <Label htmlFor="purchase_cost" className="text-right block font-medium">
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
              <Label htmlFor="purchase_date" className="text-right block font-medium">
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
              <Label htmlFor="vendor" className="text-right block font-medium">
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
              <Label htmlFor="warranty_expiry" className="text-right block font-medium">
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
              <Label htmlFor="location_id" className="text-right block font-medium">
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
              <Label htmlFor="assigned_to" className="text-right block font-medium">
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
            <Label htmlFor="description" className="text-right block font-medium">
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري التحديث...' : 'تحديث الأصل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
