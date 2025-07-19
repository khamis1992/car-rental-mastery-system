import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useFixedAssets, useAssetMaintenance, useAssetMovements } from '@/hooks/useFixedAssets';

interface AssetDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
  categories: any[];
  locations: any[];
}

const AssetDetailsDialog: React.FC<AssetDetailsDialogProps> = ({
  open,
  onOpenChange,
  asset,
  categories,
  locations
}) => {
  const { updateAsset } = useFixedAssets();
  const { maintenanceRecords } = useAssetMaintenance(asset?.id);
  const { movements } = useAssetMovements(asset?.id);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  React.useEffect(() => {
    if (asset) {
      Object.keys(asset).forEach(key => {
        setValue(key, asset[key]);
      });
    }
  }, [asset, setValue]);

  const onSubmit = async (data: any) => {
    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        ...data,
        purchase_cost: parseFloat(data.purchase_cost) || 0,
        useful_life_years: parseInt(data.useful_life_years) || 1,
        residual_value: parseFloat(data.residual_value) || 0,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount?.toFixed(3)} د.ك`;
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل الأصل: {asset.asset_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">التفاصيل الأساسية</TabsTrigger>
            <TabsTrigger value="financial">البيانات المالية</TabsTrigger>
            <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
            <TabsTrigger value="movements">تاريخ الحركة</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset_code" className="text-right block">رمز الأصل</Label>
                  <Input
                    id="asset_code"
                    {...register('asset_code')}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_name" className="text-right block">اسم الأصل</Label>
                  <Input
                    id="asset_name"
                    {...register('asset_name')}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_category" className="text-right block">فئة الأصل</Label>
                  <Select onValueChange={(value) => setValue('asset_category', value)} value={watch('asset_category')}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Select onValueChange={(value) => setValue('status', value)} value={watch('status')}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Select onValueChange={(value) => setValue('condition', value)} value={watch('condition')}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Select onValueChange={(value) => setValue('current_location', value)} value={watch('current_location')}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="serial_number" className="text-right block">الرقم التسلسلي</Label>
                  <Input
                    id="serial_number"
                    {...register('serial_number')}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-right block">الموديل</Label>
                  <Input
                    id="model"
                    {...register('model')}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-right block">ملاحظات</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  className="text-right"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateAsset.isPending}>
                  {updateAsset.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">معلومات الشراء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">تاريخ الشراء:</span>
                    <span>{asset.purchase_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">تكلفة الشراء:</span>
                    <span>{formatCurrency(asset.purchase_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">المورد:</span>
                    <span>{asset.supplier_name || 'غير محدد'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">معلومات الإهلاك</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">العمر الافتراضي:</span>
                    <span>{asset.useful_life_years} سنوات</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">طريقة الإهلاك:</span>
                    <span>{asset.depreciation_method === 'straight_line' ? 'القسط الثابت' : 'الرصيد المتناقص'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">القيمة المتبقية:</span>
                    <span>{formatCurrency(asset.residual_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">الإهلاك المتراكم:</span>
                    <span>{formatCurrency(asset.accumulated_depreciation || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">القيمة الدفترية الحالية:</span>
                    <span className="font-bold">{formatCurrency(asset.current_book_value || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">سجل الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceRecords && maintenanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {maintenanceRecords.map((record) => (
                      <div key={record.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{record.maintenance_type}</h4>
                            <p className="text-sm text-muted-foreground">{record.description}</p>
                            <div className="text-sm">
                              <span>التكلفة: {formatCurrency(record.cost)}</span>
                              <span className="mx-2">|</span>
                              <span>المزود: {record.service_provider || 'غير محدد'}</span>
                            </div>
                          </div>
                          <Badge variant={
                            record.status === 'completed' ? 'default' :
                            record.status === 'in_progress' ? 'secondary' :
                            record.status === 'pending' ? 'outline' : 'destructive'
                          }>
                            {record.status === 'completed' ? 'مكتمل' :
                             record.status === 'in_progress' ? 'قيد التنفيذ' :
                             record.status === 'pending' ? 'في الانتظار' : 'ملغي'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد سجلات صيانة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">تاريخ حركة الأصل</CardTitle>
              </CardHeader>
              <CardContent>
                {movements && movements.length > 0 ? (
                  <div className="space-y-3">
                    {movements.map((movement) => (
                      <div key={movement.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">من:</span>
                            <span>{movement.from_location_id || 'غير محدد'}</span>
                              <span>إلى:</span>
                              <span>{movement.to_location_id || 'غير محدد'}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{movement.movement_reason}</p>
                            <p className="text-sm">تاريخ النقل: {movement.movement_date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد حركات مسجلة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AssetDetailsDialog;