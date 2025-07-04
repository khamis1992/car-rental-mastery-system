import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VehicleConditionDiagramSection } from './VehicleDiagram/VehicleConditionDiagramSection';
import type { DamageArea } from './VehicleDiagram/VehicleDiagramInteractive';
import { useContractDamageAutoSave } from '@/hooks/useContractDamageAutoSave';
import { MapPin, Gauge, Fuel, Clock, Info } from 'lucide-react';
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

  // Enhanced data loading with auto-save support
  const autoSave = useContractDamageAutoSave({
    contractId: contract?.id || '',
    type: 'pickup',
    enabled: !!contract && !loading
  });

  // Load existing data from contract when form opens
  React.useEffect(() => {
    const loadContractData = async () => {
      if (!contract) return;
      
      console.log('📋 ContractDeliveryForm: Loading existing contract data');
      
      // Load damages from database using auto-save hook
      const savedDamages = await autoSave.loadDamages();
      
      setDeliveryData(prev => ({
        ...prev,
        actual_start_date: contract.actual_start_date 
          ? new Date(contract.actual_start_date).toISOString().split('T')[0]
          : prev.actual_start_date,
        pickup_location: contract.pickup_location || prev.pickup_location,
        pickup_mileage: contract.pickup_mileage ? contract.pickup_mileage.toString() : '',
        fuel_level_pickup: contract.fuel_level_pickup || 'Full',
        pickup_photos: Array.isArray(contract.pickup_photos) ? contract.pickup_photos : [],
        pickup_condition_notes: contract.pickup_condition_notes || '',
        pickup_damages: savedDamages.length > 0 ? savedDamages : (
          Array.isArray(contract.pickup_damages) 
            ? contract.pickup_damages.map((damage: any) => ({
                id: damage.id,
                x: Number(damage.x) || 0,
                y: Number(damage.y) || 0,
                severity: damage.severity || 'minor',
                description: damage.description || '',
                photos: Array.isArray(damage.photos) ? damage.photos : [],
                timestamp: damage.timestamp || new Date().toISOString()
              }))
            : []
        )
      }));
    };

    loadContractData();
  }, [contract?.id]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🚚 ContractDeliveryForm: Starting delivery submission for contract:', contract.id);
      console.log('🚚 ContractDeliveryForm: Delivery data to save:', {
        ...deliveryData,
        delivery_completed_at: new Date().toISOString(),
        pickup_mileage: deliveryData.pickup_mileage ? parseInt(deliveryData.pickup_mileage) : null,
        pickup_damages: deliveryData.pickup_damages?.length || 0
      });

      // Update contract with delivery information
      const { data: updatedContract, error } = await supabase
        .from('contracts')
        .update({
          ...deliveryData,
          pickup_mileage: deliveryData.pickup_mileage ? parseInt(deliveryData.pickup_mileage) : null,
          pickup_damages: JSON.parse(JSON.stringify(deliveryData.pickup_damages)), // Convert to Json
          delivery_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id)
        .select()
        .single();

      if (error) {
        console.error('🚚 ContractDeliveryForm: Error updating contract:', error);
        throw error;
      }

      console.log('✅ ContractDeliveryForm: Contract updated successfully:', {
        id: updatedContract?.id,
        delivery_completed_at: updatedContract?.delivery_completed_at,
        status: updatedContract?.status
      });

      // Update vehicle status to rented
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', contract.vehicle_id);

      if (vehicleError) {
        console.error('Error updating vehicle status:', vehicleError);
        // Don't fail the entire operation for vehicle status update
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسليم المركبة بنجاح. الآن يمكن الانتقال لمرحلة الدفع.",
      });

      // Close dialog first
      onOpenChange(false);
      
      // Call onSuccess to trigger parent updates
      if (onSuccess) {
        console.log('🚚 ContractDeliveryForm: Calling onSuccess callback');
        onSuccess();
      }
      
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
    console.log('🔄 ContractDeliveryForm: Updating', field, 'with value:', value);
    
    if (field === 'pickup_damages') {
      console.log('⚠️ pickup_damages being updated with:', value?.length, 'damages');
      // Note: Auto-save is now handled within VehicleConditionDiagramSection
    }
    
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
          {/* Auto-save status info */}
          {autoSave.error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {autoSave.error} - ستتم محاولة الحفظ مرة أخرى عند إجراء تغييرات.
              </AlertDescription>
            </Alert>
          )}
          
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