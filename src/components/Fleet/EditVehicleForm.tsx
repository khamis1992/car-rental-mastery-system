import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';
import { serviceContainer } from '@/services/Container/ServiceContainer';

interface EditVehicleFormProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditVehicleForm: React.FC<EditVehicleFormProps> = ({
  vehicle,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const vehicleService = serviceContainer.getVehicleBusinessService();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vehicle_type: '',
    license_plate: '',
    vin_number: '',
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    engine_size: '',
    fuel_type: 'بنزين',
    transmission: 'أوتوماتيك',
    mileage: 0,
    status: 'available' as Vehicle['status'],
    insurance_company: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    registration_expiry: '',
    last_maintenance_date: '',
    next_maintenance_due: '',
    notes: '',
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        vehicle_type: vehicle.vehicle_type || '',
        license_plate: vehicle.license_plate || '',
        vin_number: vehicle.vin_number || '',
        daily_rate: vehicle.daily_rate || 0,
        weekly_rate: vehicle.weekly_rate || 0,
        monthly_rate: vehicle.monthly_rate || 0,
        engine_size: vehicle.engine_size || '',
        fuel_type: vehicle.fuel_type || 'بنزين',
        transmission: vehicle.transmission || 'أوتوماتيك',
        mileage: vehicle.mileage || 0,
        status: vehicle.status || 'available',
        insurance_company: vehicle.insurance_company || '',
        insurance_policy_number: vehicle.insurance_policy_number || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        registration_expiry: vehicle.registration_expiry || '',
        last_maintenance_date: vehicle.last_maintenance_date || '',
        next_maintenance_due: vehicle.next_maintenance_due || '',
        notes: vehicle.notes || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setLoading(true);
    try {
      await vehicleService.updateVehicle(vehicle.id, formData);
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات المركبة بنجاح',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث بيانات المركبة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            تعديل المركبة - {vehicle.vehicle_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="make">الماركة *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">الموديل *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="year">السنة *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">اللون *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicle_type">نوع المركبة *</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => {
                    console.log('EditVehicleForm: تغيير نوع المركبة:', value);
                    handleInputChange('vehicle_type', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">سيدان</SelectItem>
                    <SelectItem value="hatchback">هاتشباك</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="coupe">كوبيه</SelectItem>
                    <SelectItem value="pickup">شاحنة صغيرة</SelectItem>
                    <SelectItem value="van">فان</SelectItem>
                    <SelectItem value="luxury">فاخرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="license_plate">لوحة الترخيص *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange('license_plate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاحة</SelectItem>
                    <SelectItem value="rented">مؤجرة</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* المعلومات الفنية */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">المعلومات الفنية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vin_number">رقم الهيكل</Label>
                <Input
                  id="vin_number"
                  value={formData.vin_number}
                  onChange={(e) => handleInputChange('vin_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="engine_size">حجم المحرك</Label>
                <Input
                  id="engine_size"
                  value={formData.engine_size}
                  onChange={(e) => handleInputChange('engine_size', e.target.value)}
                  placeholder="مثال: 2.0L"
                />
              </div>
              <div>
                <Label htmlFor="fuel_type">نوع الوقود *</Label>
                <Select
                  value={formData.fuel_type}
                  onValueChange={(value) => handleInputChange('fuel_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="بنزين">بنزين</SelectItem>
                    <SelectItem value="ديزل">ديزل</SelectItem>
                    <SelectItem value="هجين">هجين</SelectItem>
                    <SelectItem value="كهربائي">كهربائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transmission">ناقل الحركة *</Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => handleInputChange('transmission', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                    <SelectItem value="يدوي">يدوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mileage">المسافة المقطوعة (كم) *</Label>
                <Input
                  id="mileage"
                  type="number"
                  min="0"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange('mileage', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>

          {/* أسعار الإيجار */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">أسعار الإيجار</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="daily_rate">السعر اليومي (د.ك) *</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.daily_rate}
                  onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weekly_rate">السعر الأسبوعي (د.ك)</Label>
                <Input
                  id="weekly_rate"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.weekly_rate}
                  onChange={(e) => handleInputChange('weekly_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="monthly_rate">السعر الشهري (د.ك)</Label>
                <Input
                  id="monthly_rate"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.monthly_rate}
                  onChange={(e) => handleInputChange('monthly_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* معلومات التأمين والترخيص */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">التأمين والترخيص</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insurance_company">شركة التأمين</Label>
                <Input
                  id="insurance_company"
                  value={formData.insurance_company}
                  onChange={(e) => handleInputChange('insurance_company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="insurance_policy_number">رقم وثيقة التأمين</Label>
                <Input
                  id="insurance_policy_number"
                  value={formData.insurance_policy_number}
                  onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="insurance_expiry">انتهاء التأمين</Label>
                <Input
                  id="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => handleInputChange('insurance_expiry', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="registration_expiry">انتهاء الترخيص</Label>
                <Input
                  id="registration_expiry"
                  type="date"
                  value={formData.registration_expiry}
                  onChange={(e) => handleInputChange('registration_expiry', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* معلومات الصيانة */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">معلومات الصيانة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last_maintenance_date">تاريخ آخر صيانة</Label>
                <Input
                  id="last_maintenance_date"
                  type="date"
                  value={formData.last_maintenance_date}
                  onChange={(e) => handleInputChange('last_maintenance_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="next_maintenance_due">موعد الصيانة القادمة</Label>
                <Input
                  id="next_maintenance_due"
                  type="date"
                  value={formData.next_maintenance_due}
                  onChange={(e) => handleInputChange('next_maintenance_due', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="أي ملاحظات إضافية عن المركبة..."
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};