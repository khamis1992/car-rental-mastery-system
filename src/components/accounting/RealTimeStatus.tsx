import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useRealTimeAccounting } from "@/hooks/useRealTimeAccounting";
import { ScrollArea } from "@/components/ui/scroll-area";

export const RealTimeStatus = () => {
  const { events, isConnected, triggerSync } = useRealTimeAccounting();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">مكتمل</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">فشل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">قيد المعالجة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: { [key: string]: string } = {
      'contract_created': 'إنشاء عقد',
      'invoice_generated': 'إنشاء فاتورة',
      'payment_received': 'استلام دفعة',
      'sync_vehicle': 'مزامنة مركبة',
      'sync_contract': 'مزامنة عقد',
      'maintenance_completed': 'صيانة مكتملة'
    };
    return labels[eventType] || eventType;
  };

  return (
    <Card className="rtl-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            الحالة المباشرة للمحاسبة
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerSync('manual', 'system')}
            className="rtl-button"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            مزامنة يدوية
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            الاتصال: 
          </span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "متصل" : "غير متصل"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                لا توجد أحداث محاسبية حديثة
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('ar-KW')}
                    </p>
                    {event.error_message && (
                      <p className="text-sm text-red-600 mt-1">
                        {event.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};