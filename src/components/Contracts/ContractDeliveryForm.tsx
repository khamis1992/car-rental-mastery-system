import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleConditionDiagramSection } from './VehicleDiagram/VehicleConditionDiagramSection';
import type { DamageArea } from './VehicleDiagram/VehicleDiagramInteractive';
import { MapPin, Gauge, Fuel, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContractDeliveryFormProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ContractDeliveryForm: React.FC<ContractDeliveryFormProps> = ({
  contract,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    actual_start_date: new Date().toISOString().split('T')[0],
    pickup_location: contract?.pickup_location || '',
    pickup_mileage: '',
    fuel_level_pickup: 'Full',
    pickup_photos: [] as string[],
    pickup_condition_notes: '',
    pickup_damages: [] as DamageArea[]
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          ...deliveryData,
          pickup_mileage: deliveryData.pickup_mileage ? parseInt(deliveryData.pickup_mileage) : null,
          delivery_completed_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      // Update vehicle status to rented
      await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', contract.vehicle_id);

      toast({
        title: "تم بنجاح",
        description: "تم تسليم المركبة بنجاح. يجب تسجيل الدفع لتفعيل العقد.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error delivering vehicle:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسليم المركبة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryData = (field: string, value: any) => {
    setDeliveryData(prev => ({ ...prev, [field]: value }));
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            تسليم المركبة - العقد {contract.contract_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                معلومات التسليم
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actual_start_date">تاريخ التسليم الفعلي</Label>
                <Input
                  id="actual_start_date"
                  type="date"
                  value={deliveryData.actual_start_date}
                  onChange={(e) => updateDeliveryData('actual_start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup_location">مكان التسليم</Label>
                <Input
                  id="pickup_location"
                  value={deliveryData.pickup_location}
                  onChange={(e) => updateDeliveryData('pickup_location', e.target.value)}
                  placeholder="أدخل مكان التسليم"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Condition at Pickup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                حالة المركبة عند التسليم
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_mileage">قراءة العداد</Label>
                <Input
                  id="pickup_mileage"
                  type="number"
                  value={deliveryData.pickup_mileage}
                  onChange={(e) => updateDeliveryData('pickup_mileage', e.target.value)}
                  placeholder="أدخل قراءة العداد بالكيلومتر"
                />
              </div>
              <div>
                <Label htmlFor="fuel_level_pickup">مستوى الوقود</Label>
                <Select
                  value={deliveryData.fuel_level_pickup}
                  onValueChange={(value) => updateDeliveryData('fuel_level_pickup', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Empty">فارغ</SelectItem>
                    <SelectItem value="1/4">ربع</SelectItem>
                    <SelectItem value="1/2">نصف</SelectItem>
                    <SelectItem value="3/4">ثلاثة أرباع</SelectItem>
                    <SelectItem value="Full">ممتلئ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Condition with Interactive Diagram */}
          <VehicleConditionDiagramSection
            contractId={contract.id}
            vehicleInfo={`${contract.vehicles?.make} ${contract.vehicles?.model} - ${contract.vehicles?.license_plate}`}
            type="pickup"
            damages={deliveryData.pickup_damages}
            onDamagesChange={(damages) => updateDeliveryData('pickup_damages', damages)}
            photos={deliveryData.pickup_photos}
            notes={deliveryData.pickup_condition_notes}
            onPhotosChange={(photos) => updateDeliveryData('pickup_photos', photos)}
            onNotesChange={(notes) => updateDeliveryData('pickup_condition_notes', notes)}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري التسليم...' : 'تأكيد التسليم'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};