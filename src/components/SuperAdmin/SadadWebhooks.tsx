import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Webhook, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import { useUnprocessedWebhookEvents } from '@/hooks/useSadadData';

const SadadWebhooks: React.FC = () => {
  const { data: unprocessedEvents, isLoading, refetch } = useUnprocessedWebhookEvents();

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'payment.completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'payment.failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'payment.expired':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'payment.cancelled':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Webhook className="w-4 h-4 text-primary" />;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    const variants = {
      'payment.completed': 'bg-success text-success-foreground',
      'payment.failed': 'bg-destructive text-destructive-foreground',
      'payment.expired': 'bg-warning text-warning-foreground',
      'payment.cancelled': 'bg-muted text-muted-foreground'
    };

    const labels = {
      'payment.completed': 'دفع مكتمل',
      'payment.failed': 'دفع فاشل',
      'payment.expired': 'دفع منتهي الصلاحية',
      'payment.cancelled': 'دفع ملغي'
    };

    return (
      <Badge className={variants[eventType as keyof typeof variants] || 'bg-primary text-primary-foreground'}>
        {labels[eventType as keyof typeof labels] || eventType}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل أحداث Webhook...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-primary" />
              إدارة Webhooks
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                إعدادات Webhook
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <Webhook className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-medium">URL الـ Webhook</p>
              <p className="text-sm text-muted-foreground mt-1">
                https://your-domain.com/api/sadad/webhook
              </p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-medium">الحالة</p>
              <Badge className="bg-success text-success-foreground mt-1">نشط</Badge>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="font-medium">الأحداث غير المعالجة</p>
              <p className="text-2xl font-bold text-warning mt-1">
                {unprocessedEvents?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unprocessed Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            الأحداث غير المعالجة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unprocessedEvents && unprocessedEvents.length > 0 ? (
            <div className="space-y-4">
              {unprocessedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getEventTypeIcon(event.event_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{event.event_type}</p>
                          {getEventTypeBadge(event.event_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          معرف المعاملة: {event.sadad_transaction_id || 'غير محدد'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('ar')}
                      </p>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {event.event_data && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-xs font-mono">
                        {JSON.stringify(event.event_data, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium">جميع الأحداث معالجة</p>
              <p className="text-muted-foreground">
                لا توجد أحداث webhook في انتظار المعالجة
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            تكوين Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">الأحداث المدعومة</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant="outline">payment.completed</Badge>
                <Badge variant="outline">payment.failed</Badge>
                <Badge variant="outline">payment.expired</Badge>
                <Badge variant="outline">payment.cancelled</Badge>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">بيانات الحدث</h4>
              <p className="text-sm text-muted-foreground">
                يتم إرسال بيانات الحدث بصيغة JSON تحتوي على معلومات المعاملة والحالة الجديدة
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">الأمان</h4>
              <p className="text-sm text-muted-foreground">
                يتم توقيع جميع طلبات Webhook باستخدام HMAC-SHA256 للتحقق من صحة البيانات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SadadWebhooks;