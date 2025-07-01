import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, User } from "lucide-react";

const QuickAttendance = () => {
  const currentTime = new Date().toLocaleTimeString('ar-KW', { 
    timeZone: 'Asia/Kuwait',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const todayStats = {
    present: 8,
    late: 2,
    absent: 1,
    total: 11
  };

  const getAttendancePercentage = () => {
    return Math.round((todayStats.present / todayStats.total) * 100);
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          الحضور السريع
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {currentTime}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نسبة الحضور اليوم */}
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground mb-1">
            {getAttendancePercentage()}%
          </div>
          <p className="text-sm text-muted-foreground">نسبة الحضور اليوم</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div className="text-sm font-medium">{todayStats.present}</div>
            <div className="text-xs text-muted-foreground">حاضر</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <div className="text-sm font-medium">{todayStats.late}</div>
            <div className="text-xs text-muted-foreground">متأخر</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-danger" />
            </div>
            <div className="text-sm font-medium">{todayStats.absent}</div>
            <div className="text-xs text-muted-foreground">غائب</div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs hover-scale"
          >
            تسجيل دخول
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs hover-scale"
          >
            تسجيل خروج
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAttendance;