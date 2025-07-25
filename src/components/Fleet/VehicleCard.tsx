
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Calendar, Wrench, AlertTriangle, Edit, Eye, Package, Trash2 } from 'lucide-react';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'rented':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'maintenance':
      return 'bg-orange-500/10 text-orange-700 border-orange-200';
    case 'out_of_service':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusText = (status: string) => {
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

const getVehicleTypeText = (type: string) => {
  switch (type) {
    case 'sedan':
      return 'سيدان';
    case 'suv':
      return 'دفع رباعي';
    case 'hatchback':
      return 'هاتشباك';
    case 'coupe':
      return 'كوبيه';
    case 'pickup':
      return 'بيك أب';
    case 'van':
      return 'فان';
    case 'luxury':
      return 'فاخرة';
    default:
      return type;
  }
};

const getOwnerTypeText = (ownerType: string | undefined) => {
  switch (ownerType) {
    case 'customer':
      return 'غير مملوكة للشركة';
    case 'company':
      return 'مملوكة للشركة';
    default:
      return 'غير محدد';
  }
};

const getOwnerTypeColor = (ownerType: string | undefined) => {
  switch (ownerType) {
    case 'customer':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'company':
      return 'bg-green-500/10 text-green-700 border-green-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, onView, onDelete }) => {
  const isInsuranceExpiring = vehicle.insurance_expiry && 
    new Date(vehicle.insurance_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const isRegistrationExpiring = vehicle.registration_expiry && 
    new Date(vehicle.registration_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 rtl-flex">
            <Car className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground rtl-title">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.year} • {vehicle.color}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={`${getStatusColor(vehicle.status)} justify-center`}>
              {getStatusText(vehicle.status)}
            </Badge>
            <Badge className={`text-xs ${getOwnerTypeColor(vehicle.owner_type)}`}>
              {getOwnerTypeText(vehicle.owner_type)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground rtl-label">رقم المركبة:</span>
            <span className="font-medium">{vehicle.vehicle_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground rtl-label">رقم اللوحة:</span>
            <span className="font-medium">{vehicle.license_plate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground rtl-label">النوع:</span>
            <span className="font-medium">{getVehicleTypeText(vehicle.vehicle_type)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground rtl-label">السعر اليومي:</span>
            <span className="font-medium">{vehicle.daily_rate} دينار</span>
          </div>
          {vehicle.mileage && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground rtl-label">عداد المسافة:</span>
              <span className="font-medium">{vehicle.mileage.toLocaleString()} كم</span>
            </div>
          )}
          {vehicle.asset_code_hierarchy && vehicle.asset_sequence_number && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1 rtl-label">
                <Package className="w-3 h-3" />
                رمز الأصل:
              </span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {vehicle.asset_code_hierarchy}-{String(vehicle.asset_sequence_number).padStart(4, '0')}
              </span>
            </div>
          )}
        </div>

        {(isInsuranceExpiring || isRegistrationExpiring) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {isInsuranceExpiring && (
              <Badge variant="destructive" className="text-xs rtl-flex">
                <AlertTriangle className="w-3 h-3" />
                التأمين ينتهي قريباً
              </Badge>
            )}
            {isRegistrationExpiring && (
              <Badge variant="destructive" className="text-xs rtl-flex">
                <Calendar className="w-3 h-3" />
                الترخيص ينتهي قريباً
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rtl-flex"
            onClick={() => onView(vehicle)}
          >
            <Eye className="w-4 h-4" />
            عرض
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rtl-flex"
            onClick={() => onEdit(vehicle)}
          >
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive rtl-flex"
            onClick={() => onDelete(vehicle)}
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
