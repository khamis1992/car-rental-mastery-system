import React from 'react';
import { Car, Wrench, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

interface FleetStatsProps {
  vehicles: Vehicle[];
}

export const FleetStats: React.FC<FleetStatsProps> = ({ vehicles }) => {
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    needsMaintenance: vehicles.filter(v => 
      v.next_maintenance_due && new Date(v.next_maintenance_due) <= new Date()
    ).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.available}</p>
              <p className="text-sm text-muted-foreground">متاحة</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.maintenance}</p>
              <p className="text-sm text-muted-foreground">تحت الصيانة</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.needsMaintenance}</p>
              <p className="text-sm text-muted-foreground">تحتاج صيانة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};