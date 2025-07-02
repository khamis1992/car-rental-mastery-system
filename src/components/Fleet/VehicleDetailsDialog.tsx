import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';
import { formatDate } from '@/lib/utils';

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleDetailsDialog: React.FC<VehicleDetailsDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
}) => {
  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_service':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'متاحة';
      case 'rented':
        return 'مؤجرة';
      case 'maintenance':
        return 'صيانة';
      case 'out_of_service':
        return 'خارج الخدمة';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">
            تفاصيل المركبة - {vehicle.vehicle_number}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* معلومات أساسية */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات الأساسية</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">رقم المركبة:</span>
                  <span>{vehicle.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">الماركة:</span>
                  <span>{vehicle.make}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">الموديل:</span>
                  <span>{vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">السنة:</span>
                  <span>{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">اللون:</span>
                  <span>{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">نوع المركبة:</span>
                  <span>{vehicle.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">لوحة الترخيص:</span>
                  <span>{vehicle.license_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">الحالة:</span>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات فنية */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات الفنية</h3>
              <div className="space-y-3">
                {vehicle.vin_number && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">رقم الهيكل:</span>
                    <span className="text-sm">{vehicle.vin_number}</span>
                  </div>
                )}
                {vehicle.engine_size && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">حجم المحرك:</span>
                    <span>{vehicle.engine_size}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">نوع الوقود:</span>
                  <span>{vehicle.fuel_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">ناقل الحركة:</span>
                  <span>{vehicle.transmission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">المسافة المقطوعة:</span>
                  <span>{vehicle.mileage.toLocaleString()} كم</span>
                </div>
              </div>
            </div>
          </div>

          {/* أسعار الإيجار */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">أسعار الإيجار</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">السعر اليومي:</span>
                  <span className="font-bold text-green-600">{vehicle.daily_rate} د.ك</span>
                </div>
                {vehicle.weekly_rate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">السعر الأسبوعي:</span>
                    <span className="font-bold text-green-600">{vehicle.weekly_rate} د.ك</span>
                  </div>
                )}
                {vehicle.monthly_rate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">السعر الشهري:</span>
                    <span className="font-bold text-green-600">{vehicle.monthly_rate} د.ك</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* معلومات التأمين والترخيص */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">التأمين والترخيص</h3>
              <div className="space-y-3">
                {vehicle.insurance_company && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">شركة التأمين:</span>
                    <span>{vehicle.insurance_company}</span>
                  </div>
                )}
                {vehicle.insurance_policy_number && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">رقم وثيقة التأمين:</span>
                    <span>{vehicle.insurance_policy_number}</span>
                  </div>
                )}
                {vehicle.insurance_expiry && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">انتهاء التأمين:</span>
                    <span>{formatDate(vehicle.insurance_expiry)}</span>
                  </div>
                )}
                {vehicle.registration_expiry && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">انتهاء الترخيص:</span>
                    <span>{formatDate(vehicle.registration_expiry)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* معلومات الصيانة */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">معلومات الصيانة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicle.last_maintenance_date && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">آخر صيانة:</span>
                    <span>{formatDate(vehicle.last_maintenance_date)}</span>
                  </div>
                )}
                {vehicle.next_maintenance_due && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">موعد الصيانة القادمة:</span>
                    <span>{formatDate(vehicle.next_maintenance_due)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          {vehicle.notes && (
            <div className="space-y-4 md:col-span-2">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">ملاحظات</h3>
                <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                  {vehicle.notes}
                </p>
              </div>
            </div>
          )}

          {/* معلومات النظام */}
          <div className="space-y-4 md:col-span-2 border-t pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">معلومات النظام</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>تاريخ الإنشاء:</span>
                  <span>{formatDate(vehicle.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>آخر تحديث:</span>
                  <span>{formatDate(vehicle.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};