import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useAssetMaintenance } from '@/hooks/useFixedAssets';
import { Calendar, Wrench, DollarSign } from 'lucide-react';

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
}

const MaintenanceScheduleDialog: React.FC<MaintenanceScheduleDialogProps> = ({
  open,
  onOpenChange,
  asset
}) => {
  const { createMaintenance, maintenanceCategories, maintenanceRecords } = useAssetMaintenance(asset?.id);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await createMaintenance.mutateAsync({
        vehicle_id: asset.id,
        ...data,
        cost: parseFloat(data.cost) || 0,
        mileage_at_service: parseInt(data.mileage_at_service) || null
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating maintenance record:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount?.toFixed(3)} د.ك`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'outline' as const },
      in_progress: { label: 'قيد التنفيذ', variant: 'secondary' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant}>{config?.label || status}</Badge>;
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Wrench className="h-5 w-5" />
            جدولة صيانة للأصل: {asset.asset_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-sm">معلومات الأصل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">رمز الأصل:</span>
                  <span>{asset.asset_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الموقع الحالي:</span>
                  <span>{asset.current_location || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">حالة الأصل:</span>
                  <span>{asset.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">آخر صيانة:</span>
                  <span>
                    {maintenanceRecords && maintenanceRecords.length > 0
                      ? maintenanceRecords[0].completed_date || maintenanceRecords[0].scheduled_date
                      : 'لا توجد سجلات'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Maintenance Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <Calendar className="h-4 w-4" />
                جدولة صيانة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_type" className="text-right block">نوع الصيانة *</Label>
                    <Select onValueChange={(value) => setValue('maintenance_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الصيانة" />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.category_name}>
                            {category.category_name}
                          </SelectItem>
                        ))}
                        <SelectItem value="صيانة وقائية">صيانة وقائية</SelectItem>
                        <SelectItem value="صيانة إصلاحية">صيانة إصلاحية</SelectItem>
                        <SelectItem value="صيانة طارئة">صيانة طارئة</SelectItem>
                        <SelectItem value="فحص دوري">فحص دوري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-right block">حالة الصيانة</Label>
                    <Select onValueChange={(value) => setValue('status', value)} defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الصيانة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date" className="text-right block">تاريخ الجدولة *</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      {...register('scheduled_date', { required: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completed_date" className="text-right block">تاريخ الإنجاز</Label>
                    <Input
                      id="completed_date"
                      type="date"
                      {...register('completed_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="next_service_date" className="text-right block">موعد الصيانة القادمة</Label>
                    <Input
                      id="next_service_date"
                      type="date"
                      {...register('next_service_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-right block">التكلفة المقدرة (د.ك)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.001"
                      {...register('cost')}
                      placeholder="0.000"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_provider" className="text-right block">مزود الخدمة</Label>
                    <Input
                      id="service_provider"
                      {...register('service_provider')}
                      placeholder="اسم الشركة أو الفني"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_number" className="text-right block">رقم الفاتورة</Label>
                    <Input
                      id="invoice_number"
                      {...register('invoice_number')}
                      placeholder="رقم الفاتورة"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right block">وصف الصيانة *</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: true })}
                    placeholder="اكتب وصفاً تفصيلياً للصيانة المطلوبة..."
                    className="text-right"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right block">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="ملاحظات أو تعليمات خاصة..."
                    className="text-right"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMaintenance.isPending}>
                    {createMaintenance.isPending ? 'جاري الحفظ...' : 'حفظ جدولة الصيانة'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Maintenance History */}
          {maintenanceRecords && maintenanceRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <DollarSign className="h-4 w-4" />
                  سجل الصيانة الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {maintenanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <h4 className="font-medium">{record.maintenance_type}</h4>
                            {getStatusBadge(record.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{record.description}</p>
                          <div className="text-sm text-muted-foreground">
                            <span>تاريخ الجدولة: {record.scheduled_date}</span>
                            {record.completed_date && (
                              <>
                                <span className="mx-2">|</span>
                                <span>تاريخ الإنجاز: {record.completed_date}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm">
                            <span>التكلفة: {formatCurrency(record.cost)}</span>
                            {record.service_provider && (
                              <>
                                <span className="mx-2">|</span>
                                <span>المزود: {record.service_provider}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceScheduleDialog;