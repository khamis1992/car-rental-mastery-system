import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { maintenanceService, MaintenanceStats, UpcomingMaintenance } from "@/services/maintenanceService";

const UpcomingMaintenanceCard = () => {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [upcomingList, setUpcomingList] = useState<UpcomingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [maintenanceStats, upcoming] = await Promise.all([
          maintenanceService.getMaintenanceStats(),
          maintenanceService.getUpcomingMaintenance(3)
        ]);
        setStats(maintenanceStats);
        setUpcomingList(upcoming);
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'عادي';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            الصيانة القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          الصيانة القادمة
        </CardTitle>
        <Button variant="outline" size="sm">
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
            <div className="text-xs text-muted-foreground">متأخرة</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats?.dueThisWeek || 0}</div>
            <div className="text-xs text-muted-foreground">هذا الأسبوع</div>
          </div>
        </div>

        {/* Upcoming Maintenance List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">القادمة قريباً</h4>
          {upcomingList.length > 0 ? (
            upcomingList.map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Wrench className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{maintenance.vehicleInfo}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(maintenance.dueDate).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getPriorityColor(maintenance.priority)}>
                    {getPriorityLabel(maintenance.priority)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">لا توجد صيانة مجدولة</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">إجمالي هذا الشهر:</span>
            <Badge variant="outline">{stats?.upcomingThisMonth || 0}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMaintenanceCard;