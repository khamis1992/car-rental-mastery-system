import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useFixedAssets } from '@/hooks/useFixedAssets';

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: any[];
  locations: any[];
}

const AddAssetDialog: React.FC<AddAssetDialogProps> = ({
  open,
  onOpenChange,
  categories,
  locations
}) => {
  const { createAsset } = useFixedAssets();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await createAsset.mutateAsync({
        ...data,
        purchase_cost: parseFloat(data.purchase_cost) || 0,
        useful_life_years: parseInt(data.useful_life_years) || 1,
        residual_value: parseFloat(data.residual_value) || 0,
        current_book_value: parseFloat(data.purchase_cost) || 0,
        accumulated_depreciation: 0
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة أصل ثابت جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_code" className="text-right block">رمز الأصل *</Label>
              <Input
                id="asset_code"
                {...register('asset_code', { required: true })}
                placeholder="مثال: AST-001"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_name" className="text-right block">اسم الأصل *</Label>
              <Input
                id="asset_name"
                {...register('asset_name', { required: true })}
                placeholder="اسم الأصل"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_category" className="text-right block">فئة الأصل *</Label>
              <Select onValueChange={(value) => setValue('asset_category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة الأصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="building">مباني</SelectItem>
                  <SelectItem value="equipment">معدات</SelectItem>
                  <SelectItem value="vehicle">مركبات</SelectItem>
                  <SelectItem value="furniture">أثاث</SelectItem>
                  <SelectItem value="computer">أجهزة كمبيوتر</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-right block">حالة الأصل</Label>
              <Select onValueChange={(value) => setValue('status', value)} defaultValue="active">
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الأصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="under_maintenance">تحت الصيانة</SelectItem>
                  <SelectItem value="disposed">مستبعد</SelectItem>
                  <SelectItem value="retired">متقاعد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition" className="text-right block">الحالة الفيزيائية</Label>
              <Select onValueChange={(value) => setValue('condition', value)} defaultValue="excellent">
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة الفيزيائية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">ممتاز</SelectItem>
                  <SelectItem value="good">جيد</SelectItem>
                  <SelectItem value="fair">مقبول</SelectItem>
                  <SelectItem value="poor">ضعيف</SelectItem>
                  <SelectItem value="damaged">تالف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_location" className="text-right block">الموقع الحالي</Label>
              <Select onValueChange={(value) => setValue('current_location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.location_name}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date" className="text-right block">تاريخ الشراء *</Label>
              <Input
                id="purchase_date"
                type="date"
                {...register('purchase_date', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost" className="text-right block">تكلفة الشراء (د.ك) *</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.001"
                {...register('purchase_cost', { required: true })}
                placeholder="0.000"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="useful_life_years" className="text-right block">العمر الافتراضي (سنوات) *</Label>
              <Input
                id="useful_life_years"
                type="number"
                {...register('useful_life_years', { required: true })}
                placeholder="5"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residual_value" className="text-right block">القيمة المتبقية (د.ك)</Label>
              <Input
                id="residual_value"
                type="number"
                step="0.001"
                {...register('residual_value')}
                placeholder="0.000"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciation_method" className="text-right block">طريقة الإهلاك</Label>
              <Select onValueChange={(value) => setValue('depreciation_method', value)} defaultValue="straight_line">
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الإهلاك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">القسط الثابت</SelectItem>
                  <SelectItem value="declining_balance">الرصيد المتناقص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_name" className="text-right block">اسم المورد</Label>
              <Input
                id="supplier_name"
                {...register('supplier_name')}
                placeholder="اسم المورد"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number" className="text-right block">الرقم التسلسلي</Label>
              <Input
                id="serial_number"
                {...register('serial_number')}
                placeholder="الرقم التسلسلي"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-right block">الموديل</Label>
              <Input
                id="model"
                {...register('model')}
                placeholder="الموديل"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="text-right block">الشركة المصنعة</Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="الشركة المصنعة"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry" className="text-right block">انتهاء الضمان</Label>
              <Input
                id="warranty_expiry"
                type="date"
                {...register('warranty_expiry')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block">ملاحظات</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="ملاحظات إضافية..."
              className="text-right"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createAsset.isPending}>
              {createAsset.isPending ? 'جاري الحفظ...' : 'حفظ الأصل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;