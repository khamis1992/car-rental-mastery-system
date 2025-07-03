import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VehicleConditionDiagramSection } from './VehicleDiagram/VehicleConditionDiagramSection';
import type { DamageArea } from './VehicleDiagram/VehicleDiagramInteractive';
import { useContractDamageAutoSave } from '@/hooks/useContractDamageAutoSave';
import { MapPin, Gauge, Clock, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContractReturnFormProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ContractReturnForm: React.FC<ContractReturnFormProps> = ({
  contract,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [returnData, setReturnData] = useState({
    actual_end_date: new Date().toISOString().split('T')[0],
    return_location: contract?.return_location || contract?.pickup_location || '',
    return_mileage: '',
    fuel_level_return: 'Full',
    return_photos: [] as string[],
    return_condition_notes: '',
    return_damages: [] as DamageArea[]
  });

  // Enhanced data loading with auto-save support
  const autoSave = useContractDamageAutoSave({
    contractId: contract?.id || '',
    type: 'return',
    enabled: !!contract && !loading
  });

  // Load existing data from contract when form opens
  React.useEffect(() => {
    const loadContractData = async () => {
      if (!contract?.id || loading) return;
      
      console.log('📋 ContractReturnForm: Loading existing contract data');
      
      try {
        // Load damages from database using auto-save hook
        const savedDamages = await autoSave.loadDamages();
        
        setReturnData(prev => ({
          ...prev,
          actual_end_date: contract.actual_end_date 
            ? new Date(contract.actual_end_date).toISOString().split('T')[0]
            : prev.actual_end_date,
          return_location: contract.return_location || contract.pickup_location || prev.return_location,
          return_mileage: contract.return_mileage ? contract.return_mileage.toString() : '',
          fuel_level_return: contract.fuel_level_return || 'Full',
          return_photos: Array.isArray(contract.return_photos) ? contract.return_photos : [],
          return_condition_notes: contract.return_condition_notes || '',
          return_damages: savedDamages.length > 0 ? savedDamages : (
            Array.isArray(contract.return_damages) 
              ? contract.return_damages.map((damage: any) => ({
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
      } catch (error) {
        console.error('Error loading contract data:', error);
        // Don't throw error, just log it and continue with existing data
      }
    };

    // Only load once when contract is available and form is open
    if (open && contract?.id && !loading) {
      loadContractData();
    }
  }, [contract?.id, open, loading]); // Removed autoSave from dependencies to prevent loops
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          ...returnData,
          return_mileage: returnData.return_mileage ? parseInt(returnData.return_mileage) : null,
          return_damages: JSON.parse(JSON.stringify(returnData.return_damages)), // Convert to Json
          status: 'completed'
        })
        .eq('id', contract.id);

      if (error) throw error;

      // Update vehicle status to available
      await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', contract.vehicle_id);

      toast({
        title: "تم بنجاح",
        description: "تم استلام المركبة وإنهاء العقد بنجاح",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error returning vehicle:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استلام المركبة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReturnData = (field: string, value: any) => {
    console.log('🔄 ContractReturnForm: Updating', field, 'with value:', value);
    
    if (field === 'return_damages') {
      console.log('⚠️ return_damages being updated with:', value?.length, 'damages');
      // Note: Auto-save is now handled within VehicleConditionDiagramSection
    }
    
    setReturnData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate mileage difference
  const mileageDiff = returnData.return_mileage && contract.pickup_mileage 
    ? parseInt(returnData.return_mileage) - contract.pickup_mileage
    : 0;

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            استلام المركبة - العقد {contract.contract_number}
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
          
          {/* Basic Return Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                معلومات الاستلام
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actual_end_date">تاريخ الاستلام الفعلي</Label>
                <Input
                  id="actual_end_date"
                  type="date"
                  value={returnData.actual_end_date}
                  onChange={(e) => updateReturnData('actual_end_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="return_location">مكان الاستلام</Label>
                <Input
                  id="return_location"
                  value={returnData.return_location}
                  onChange={(e) => updateReturnData('return_location', e.target.value)}
                  placeholder="أدخل مكان الاستلام"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Condition at Return */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                حالة المركبة عند الاستلام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="return_mileage">قراءة العداد</Label>
                  <Input
                    id="return_mileage"
                    type="number"
                    value={returnData.return_mileage}
                    onChange={(e) => updateReturnData('return_mileage', e.target.value)}
                    placeholder="أدخل قراءة العداد بالكيلومتر"
                  />
                  {contract.pickup_mileage && (
                    <p className="text-sm text-muted-foreground mt-1">
                      قراءة العداد عند التسليم: {contract.pickup_mileage} كم
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fuel_level_return">مستوى الوقود</Label>
                  <Select
                    value={returnData.fuel_level_return}
                    onValueChange={(value) => updateReturnData('fuel_level_return', value)}
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
                  {contract.fuel_level_pickup && (
                    <p className="text-sm text-muted-foreground mt-1">
                      مستوى الوقود عند التسليم: {contract.fuel_level_pickup}
                    </p>
                  )}
                </div>
              </div>

              {/* Mileage Difference Alert */}
              {mileageDiff > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    المسافة المقطوعة: {mileageDiff.toLocaleString()} كم
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Condition with Interactive Diagram */}
          <VehicleConditionDiagramSection
            contractId={contract.id}
            vehicleInfo={`${contract.vehicles?.make} ${contract.vehicles?.model} - ${contract.vehicles?.license_plate}`}
            type="return"
            damages={returnData.return_damages}
            onDamagesChange={(damages) => updateReturnData('return_damages', damages)}
            photos={returnData.return_photos}
            notes={returnData.return_condition_notes}
            onPhotosChange={(photos) => updateReturnData('return_photos', photos)}
            onNotesChange={(notes) => updateReturnData('return_condition_notes', notes)}
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
              {loading ? 'جاري الاستلام...' : 'تأكيد الاستلام وإنهاء العقد'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};