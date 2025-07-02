import React from 'react';
import { Car, Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VehicleCard } from '@/components/Fleet/VehicleCard';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

interface VehicleListProps {
  vehicles: Vehicle[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onViewVehicle: (vehicle: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  searchTerm,
  onSearchChange,
  loading,
  onAddVehicle,
  onEditVehicle,
  onViewVehicle
}) => {
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>قائمة المركبات</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في المركبات..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">جاري التحميل...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? 'لم يتم العثور على مركبات' : 'لا توجد مركبات'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'جرب تغيير مصطلح البحث' : 'ابدأ بإضافة مركبات للأسطول'}
            </p>
            {!searchTerm && (
              <Button 
                className="btn-primary"
                onClick={onAddVehicle}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة أول مركبة
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={onEditVehicle}
                onView={onViewVehicle}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};