import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, TrendingUp, DollarSign, Car, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { dailyReportService, DailyReportData } from "@/services/dailyReportService";

const DailyReportCard = () => {
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await dailyReportService.getDailyReport(selectedDate);
        setReportData(data);
      } catch (error) {
        console.error('Error fetching daily report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedDate]);

  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            التقرير اليومي
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
          <FileText className="w-5 h-5" />
          التقرير اليومي
        </CardTitle>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          />
          <Button variant="outline" size="sm">
            تصدير
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Section */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-800 dark:text-green-200">الإيرادات</h4>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {reportData?.totalRevenue.toFixed(2) || 0} د.ك
          </div>
          <div className="text-sm text-muted-foreground">
            متوسط السعر اليومي: {reportData?.averageDailyRate.toFixed(2) || 0} د.ك
          </div>
        </div>

        {/* Contracts Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">{reportData?.newContracts || 0}</div>
            <div className="text-xs text-muted-foreground">عقود جديدة</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">{reportData?.completedContracts || 0}</div>
            <div className="text-xs text-muted-foreground">عقود منتهية</div>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="space-y-3">
          <h5 className="font-medium text-sm flex items-center gap-2">
            <Car className="w-4 h-4" />
            حالة الأسطول
          </h5>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="font-bold text-green-600">{reportData?.availableVehicles || 0}</div>
              <div className="text-xs text-muted-foreground">متاحة</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
              <div className="font-bold text-blue-600">{reportData?.rentedVehicles || 0}</div>
              <div className="text-xs text-muted-foreground">مؤجرة</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
              <div className="font-bold text-yellow-600">{reportData?.maintenanceVehicles || 0}</div>
              <div className="text-xs text-muted-foreground">صيانة</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">معدل الإشغال</span>
            <Badge variant="outline">{reportData?.occupancyRate || 0}%</Badge>
          </div>
        </div>

        {/* Incidents & Violations */}
        <div className="space-y-2">
          <h5 className="font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            الحوادث والمخالفات اليوم
          </h5>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">حوادث:</span>
                <Badge variant={reportData?.newIncidents && reportData.newIncidents > 0 ? "destructive" : "outline"}>
                  {reportData?.newIncidents || 0}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">مخالفات:</span>
                <Badge variant={reportData?.newViolations && reportData.newViolations > 0 ? "destructive" : "outline"}>
                  {reportData?.newViolations || 0}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">العقود النشطة</span>
            <Badge variant="default">{reportData?.activeContracts || 0}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyReportCard;