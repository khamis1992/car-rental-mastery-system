import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const FleetOverview = () => {
  const fleetData = {
    totalCars: 0,
    availableCars: 0,
    rentedCars: 0,
    maintenanceCars: 0,
    occupancyRate: 0
  };

  const carsByType: any[] = [];

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
            <span className="text-sm font-bold text-primary">{fleetData.occupancyRate}%</span>
          </div>
          <Progress value={fleetData.occupancyRate} className="h-2" />
        </div>

        {/* إحصائيات السيارات */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success">{fleetData.availableCars}</div>
            <div className="text-sm text-muted-foreground">متاحة</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{fleetData.rentedCars}</div>
            <div className="text-sm text-muted-foreground">مؤجرة</div>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <div className="text-2xl font-bold text-warning">{fleetData.maintenanceCars}</div>
            <div className="text-sm text-muted-foreground">صيانة</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{fleetData.totalCars}</div>
            <div className="text-sm text-muted-foreground">إجمالي</div>
          </div>
        </div>

        {/* السيارات حسب النوع */}
        <div>
          <h4 className="font-medium mb-3 text-foreground">السيارات حسب النوع</h4>
          <div className="text-center py-4 text-muted-foreground">
            لا توجد بيانات أسطول متاحة
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetOverview;