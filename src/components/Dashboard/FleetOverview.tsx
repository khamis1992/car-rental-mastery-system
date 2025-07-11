import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContractsOptimized } from "@/hooks/useContractsOptimized";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Car, Users, DollarSign, TrendingUp } from "lucide-react";
import { useMemo } from "react";

const FleetOverview = () => {
  const { vehicles, loading } = useContractsOptimized();
  
  const fleetData = useMemo(() => {
    if (!vehicles.length) {
      return {
        totalCars: 0,
        availableCars: 0,
        rentedCars: 0,
        maintenanceCars: 0,
        occupancyRate: 0
      };
    }

    const totalCars = vehicles.length;
    const availableCars = vehicles.filter(v => v.status === 'available').length;
    const rentedCars = vehicles.filter(v => v.status === 'rented').length;
    const maintenanceCars = vehicles.filter(v => v.status === 'maintenance').length;
    const occupancyRate = totalCars > 0 ? Math.round((rentedCars / totalCars) * 100) : 0;

    return {
      totalCars,
      availableCars,
      rentedCars,
      maintenanceCars,
      occupancyRate
    };
  }, [vehicles]);

  const carsByType = useMemo(() => {
    if (!vehicles.length) return [];
    
    const typeCount: Record<string, number> = {};
    vehicles.forEach(vehicle => {
      const make = vehicle.make || 'غير محدد';
      typeCount[make] = (typeCount[make] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([make, count]) => ({ make, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [vehicles]);

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          نظرة عامة على الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* معدل الإشغال */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">معدل الإشغال</span>
            <span className="text-sm font-bold text-primary">
              {loading ? "..." : `${fleetData.occupancyRate}%`}
            </span>
          </div>
          <Progress value={fleetData.occupancyRate} className="h-2" />
        </div>

        {/* إحصائيات السيارات */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success">
              {loading ? "..." : fleetData.availableCars}
            </div>
            <div className="text-sm text-muted-foreground">متاحة</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : fleetData.rentedCars}
            </div>
            <div className="text-sm text-muted-foreground">مؤجرة</div>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <div className="text-2xl font-bold text-warning">
              {loading ? "..." : fleetData.maintenanceCars}
            </div>
            <div className="text-sm text-muted-foreground">صيانة</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : fleetData.totalCars}
            </div>
            <div className="text-sm text-muted-foreground">إجمالي</div>
          </div>
        </div>

        {/* السيارات حسب النوع */}
        <div>
          <h4 className="font-medium mb-3 text-foreground">السيارات حسب النوع</h4>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              جاري تحميل بيانات الأسطول...
            </div>
          ) : carsByType.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد بيانات أسطول متاحة
            </div>
          ) : (
            <div className="space-y-2">
              {carsByType.map((type, index) => (
                <div key={type.make} className="flex items-center justify-between">
                  <span className="text-sm">{type.make}</span>
                  <Badge variant="outline">{type.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetOverview;