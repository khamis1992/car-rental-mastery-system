import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { incidentService, IncidentStats, ViolationStats } from "@/services/incidentService";

const IncidentsViolationsCard = () => {
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);
  const [violationStats, setViolationStats] = useState<ViolationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [incidents, violations] = await Promise.all([
          incidentService.getIncidentStats(),
          incidentService.getViolationStats()
        ]);
        setIncidentStats(incidents);
        setViolationStats(violations);
      } catch (error) {
        console.error('Error fetching incident/violation stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            الحوادث والمخالفات
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          الحوادث والمخالفات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Incidents Section */}
        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-orange-800 dark:text-orange-200">الحوادث</h4>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع:</span>
              <Badge variant="outline">{incidentStats?.total || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">معلقة:</span>
              <Badge variant="destructive">{incidentStats?.pending || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">محلولة:</span>
              <Badge variant="default">{incidentStats?.resolved || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">هذا الشهر:</span>
              <div className="flex items-center gap-1">
                {(incidentStats?.thisMonth || 0) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span>{incidentStats?.thisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Violations Section */}
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-red-800 dark:text-red-200">المخالفات</h4>
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع:</span>
              <Badge variant="outline">{violationStats?.total || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">غير مدفوعة:</span>
              <Badge variant="destructive">{violationStats?.unpaid || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">مدفوعة:</span>
              <Badge variant="default">{violationStats?.paid || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">هذا الشهر:</span>
              <div className="flex items-center gap-1">
                {(violationStats?.thisMonth || 0) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span>{violationStats?.thisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentsViolationsCard;