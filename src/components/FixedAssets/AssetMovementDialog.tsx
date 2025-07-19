import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAssetMovements } from '@/hooks/useFixedAssets';
import { Move3D, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AssetMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
  locations: any[];
}

const AssetMovementDialog: React.FC<AssetMovementDialogProps> = ({
  open,
  onOpenChange,
  asset,
  locations
}) => {
  const queryClient = useQueryClient();
  const { movements } = useAssetMovements(asset?.id);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const createMovement = useMutation({
    mutationFn: async (movement: any) => {
      const { data, error } = await supabase
        .from('asset_movement_history')
        .insert(movement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-movements'] });
      toast.success('تم تسجيل حركة الأصل بنجاح');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('خطأ في تسجيل حركة الأصل: ' + error.message);
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await createMovement.mutateAsync({
        asset_id: asset.id,
        ...data
      });
    } catch (error) {
      console.error('Error creating movement:', error);
    }
  };

  const getCurrentLocation = () => {
    return locations.find(loc => loc.location_name === asset?.current_location);
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Move3D className="h-5 w-5" />
            نقل الأصل: {asset.asset_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-sm">الموقع الحالي للأصل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-row-reverse">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {asset.current_location || 'غير محدد'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                رمز الأصل: {asset.asset_code}
              </div>
            </CardContent>
          </Card>

          {/* New Movement Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <Calendar className="h-4 w-4" />
                تسجيل حركة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_location_id" className="text-right block">من الموقع</Label>
                    <Select onValueChange={(value) => setValue('from_location_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموقع الحالي" />
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
                    <Label htmlFor="to_location_id" className="text-right block">إلى الموقع *</Label>
                    <Select onValueChange={(value) => setValue('to_location_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموقع الجديد" />
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
                    <Label htmlFor="movement_date" className="text-right block">تاريخ النقل *</Label>
                    <Input
                      id="movement_date"
                      type="date"
                      {...register('movement_date', { required: true })}
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approved_by" className="text-right block">معتمد من قبل</Label>
                    <Input
                      id="approved_by"
                      {...register('approved_by')}
                      placeholder="اسم الشخص المعتمد"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="movement_reason" className="text-right block">سبب النقل</Label>
                  <Select onValueChange={(value) => setValue('movement_reason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر سبب النقل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="تغيير القسم">تغيير القسم</SelectItem>
                      <SelectItem value="إعادة تنظيم">إعادة تنظيم</SelectItem>
                      <SelectItem value="صيانة">صيانة</SelectItem>
                      <SelectItem value="تطوير">تطوير</SelectItem>
                      <SelectItem value="نقل للمخزن">نقل للمخزن</SelectItem>
                      <SelectItem value="استبدال">استبدال</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right block">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="ملاحظات إضافية حول عملية النقل..."
                    className="text-right"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMovement.isPending}>
                    {createMovement.isPending ? 'جاري الحفظ...' : 'تسجيل الحركة'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Movement History */}
          {movements && movements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right">تاريخ حركات الأصل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {movements.slice(0, 10).map((movement) => (
                    <div key={movement.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">من:</span>
                            <span>{movement.from_location_id || 'غير محدد'}</span>
                            <span>←</span>
                            <span className="font-medium">إلى:</span>
                            <span>{movement.to_location_id || 'غير محدد'}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>التاريخ: {movement.movement_date}</span>
                            {movement.movement_reason && (
                              <>
                                <span className="mx-2">|</span>
                                <span>السبب: {movement.movement_reason}</span>
                              </>
                            )}
                          </div>
                          {movement.notes && (
                            <p className="text-sm text-muted-foreground">{movement.notes}</p>
                          )}
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

export default AssetMovementDialog;