import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  PenTool, 
  Truck, 
  CreditCard, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface CompletedContractTimelineProps {
  contract: any;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  status: 'completed' | 'warning' | 'info';
}

export const CompletedContractTimeline: React.FC<CompletedContractTimelineProps> = ({
  contract
}) => {
  const getTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // إنشاء العقد
    events.push({
      id: 'created',
      title: 'إنشاء العقد',
      description: `تم إنشاء العقد رقم ${contract.contract_number}`,
      timestamp: contract.created_at,
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    });

    // التوقيع
    if (contract.customer_signed_at) {
      events.push({
        id: 'customer_signed',
        title: 'توقيع العميل',
        description: 'تم توقيع العقد من قبل العميل',
        timestamp: contract.customer_signed_at,
        icon: <PenTool className="w-4 h-4" />,
        status: 'completed'
      });
    }

    if (contract.company_signed_at) {
      events.push({
        id: 'company_signed',
        title: 'توقيع الشركة',
        description: 'تم توقيع العقد من قبل الشركة',
        timestamp: contract.company_signed_at,
        icon: <PenTool className="w-4 h-4" />,
        status: 'completed'
      });
    }

    // التسليم
    if (contract.delivery_completed_at) {
      events.push({
        id: 'delivered',
        title: 'تسليم المركبة',
        description: 'تم تسليم المركبة للعميل',
        timestamp: contract.delivery_completed_at,
        icon: <Truck className="w-4 h-4" />,
        status: 'completed'
      });
    }

    // تسجيل الدفع
    if (contract.payment_registered_at) {
      events.push({
        id: 'payment',
        title: 'تسجيل الدفع',
        description: 'تم تسجيل دفع العقد',
        timestamp: contract.payment_registered_at,
        icon: <CreditCard className="w-4 h-4" />,
        status: 'completed'
      });
    }

    // الاستلام النهائي
    if (contract.actual_end_date) {
      events.push({
        id: 'returned',
        title: 'استلام المركبة',
        description: 'تم استلام المركبة وإنهاء العقد',
        timestamp: contract.actual_end_date,
        icon: <CheckCircle2 className="w-4 h-4" />,
        status: 'completed'
      });
    }

    // ترتيب الأحداث حسب التاريخ
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = getTimelineEvents();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'info':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          الجدول الزمني للعقد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* الخط الزمني */}
          <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border"></div>
          
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* النقطة على الخط الزمني */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-background ${getStatusColor(event.status)}`}>
                  {event.icon}
                </div>
                
                {/* محتوى الحدث */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {event.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {formatDateTime(event.timestamp)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ملخص المدة الزمنية */}
        {contract.created_at && contract.actual_end_date && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المدة الإجمالية للعقد:</span>
              <span className="font-medium">
                {Math.ceil(
                  (new Date(contract.actual_end_date).getTime() - new Date(contract.created_at).getTime()) 
                  / (1000 * 60 * 60 * 24)
                )} يوم
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};