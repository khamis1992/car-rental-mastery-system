import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { violationAlertsService, CustomerViolation } from '@/services/newFeaturesService';
import { useToast } from '@/hooks/use-toast';

interface ViolationAlertsWidgetProps {
  customerId: string;
}

export const ViolationAlertsWidget: React.FC<ViolationAlertsWidgetProps> = ({ customerId }) => {
  const [violations, setViolations] = useState<CustomerViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (customerId) {
      loadViolations();
    }
  }, [customerId]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const { data, error } = await violationAlertsService.getCustomerViolations(customerId);
      if (error) {
        console.error('خطأ في تحميل الانتهاكات:', error);
        return;
      }
      setViolations(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الانتهاكات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">تنبيهات الانتهاكات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!violations.length) {
    return null;
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-4 h-4" />
          تنبيهات الانتهاكات ({violations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {violations.slice(0, 3).map((violation) => (
          <Alert key={violation.id} className="p-3">
            <div className="flex items-start gap-3">
              {getSeverityIcon(violation.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getSeverityColor(violation.severity) as any} className="text-xs">
                    {violation.violation_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(violation.violation_date).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                <AlertDescription className="text-xs">
                  {violation.description}
                </AlertDescription>
                {violation.amount && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    المبلغ: د.ك {violation.amount.toFixed(3)}
                  </p>
                )}
              </div>
            </div>
          </Alert>
        ))}
        
        {violations.length > 3 && (
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="w-3 h-3 mr-2" />
            عرض جميع الانتهاكات ({violations.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};