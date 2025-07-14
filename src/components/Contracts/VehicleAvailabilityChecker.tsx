import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Clock, RefreshCw, Wrench } from 'lucide-react';
import { vehicleAvailabilityService } from '@/services/newFeaturesService';

interface VehicleAvailabilityCheckerProps {
  vehicleId?: string;
  startDate: string;
  endDate: string;
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

export const VehicleAvailabilityChecker: React.FC<VehicleAvailabilityCheckerProps> = ({
  vehicleId,
  startDate,
  endDate,
  onAvailabilityChange
}) => {
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAvailability = async () => {
    if (!vehicleId || !startDate || !endDate) return;

    setLoading(true);
    try {
      const { data, error } = await vehicleAvailabilityService.checkVehicleAvailability(
        vehicleId, 
        startDate, 
        endDate
      );
      
      if (error) {
        console.error('خطأ في فحص التوفر:', error);
        return;
      }

      setAvailabilityData(data);
      onAvailabilityChange?.(data?.is_available || false);
    } catch (error) {
      console.error('خطأ في فحص التوفر:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (vehicleId && startDate && endDate) {
      checkAvailability();
    }
  }, [vehicleId, startDate, endDate]);

  if (!vehicleId) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">اختر مركبة للتحقق من التوفر</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p className="text-sm">جاري فحص التوفر...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availabilityData) return null;

  const { vehicle, is_available, conflicts } = availabilityData;

  return (
    <Card className={`mb-4 ${is_available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm flex items-center gap-2 ${is_available ? 'text-green-800' : 'text-red-800'}`}>
          {is_available ? (
            <>
              <CheckCircle className="w-4 h-4" />
              المركبة متاحة
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              المركبة غير متاحة
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">لوحة المركبة:</span>
          <Badge variant="outline">{vehicle.plate_number}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">حالة المركبة:</span>
          <Badge variant={vehicle.status === 'active' ? 'default' : 'destructive'}>
            {vehicle.status === 'active' ? 'نشطة' : 'غير نشطة'}
          </Badge>
        </div>

        {vehicle.maintenance_status && vehicle.maintenance_status !== 'good' && (
          <Alert className="p-3">
            <Wrench className="w-4 h-4" />
            <AlertDescription className="text-xs">
              حالة الصيانة: {vehicle.maintenance_status}
            </AlertDescription>
          </Alert>
        )}

        {!is_available && (
          <div className="space-y-2">
            {conflicts.contracts.length > 0 && (
              <Alert className="p-3">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  توجد عقود متداخلة: {conflicts.contracts.length} عقد
                </AlertDescription>
              </Alert>
            )}
            
            {conflicts.maintenance.length > 0 && (
              <Alert className="p-3">
                <Wrench className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  صيانة مجدولة: {conflicts.maintenance.length} جلسة صيانة
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={checkAvailability}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
          إعادة فحص التوفر
        </Button>
      </CardContent>
    </Card>
  );
};