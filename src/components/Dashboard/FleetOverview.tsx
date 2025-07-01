import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const FleetOverview = () => {
  const fleetData = {
    totalCars: 45,
    availableCars: 18,
    rentedCars: 22,
    maintenanceCars: 5,
    occupancyRate: 78
  };

  const carsByType = [
    { type: "سيدان", count: 20, color: "bg-primary" },
    { type: "دفع رباعي", count: 15, color: "bg-accent" },
    { type: "هاتشباك", count: 7, color: "bg-success" },
    { type: "ميني باص", count: 3, color: "bg-warning" }
  ];

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
          <div className="space-y-2">
            {carsByType.map((car) => (
              <div key={car.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${car.color}`}></div>
                  <span className="text-sm text-foreground">{car.type}</span>
                </div>
                <Badge variant="secondary">{car.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetOverview;