import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Car, 
  Users, 
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { contractService } from '@/services/contractService';

interface ContractAlert {
  id: string;
  type: 'ending_soon' | 'overdue' | 'maintenance_due' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  contractId?: string;
  dueDate?: Date;
  actionRequired?: boolean;
}

interface ContractMonitoringProps {
  onAlertClick?: (alert: ContractAlert) => void;
}

export const ContractMonitoring: React.FC<ContractMonitoringProps> = ({ onAlertClick }) => {
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);
  const [summary, setSummary] = useState({
    totalActive: 0,
    endingIn3Days: 0,
    overdue: 0,
    maintenanceDue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const contracts = await contractService.getContractsWithDetails();
      const newAlerts: ContractAlert[] = [];
      const today = new Date();

      let totalActive = 0;
      let endingIn3Days = 0;
      let overdue = 0;
      let maintenanceDue = 0;

      contracts.forEach(contract => {
        const endDate = new Date(contract.end_date);
        const daysUntilEnd = differenceInDays(endDate, today);

        if (contract.status === 'active') {
          totalActive++;

          // Contract ending soon (within 3 days)
          if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
            endingIn3Days++;
            newAlerts.push({
              id: `ending_${contract.id}`,
              type: 'ending_soon',
              priority: daysUntilEnd <= 1 ? 'high' : 'medium',
              title: 'عقد ينتهي قريباً',
              description: `عقد ${contract.contract_number} للعميل ${contract.customer_name} ينتهي في ${daysUntilEnd === 0 ? 'اليوم' : `${daysUntilEnd} أيام`}`,
              contractId: contract.id,
              dueDate: endDate,
              actionRequired: true,
            });
          }

          // Overdue contracts
          if (daysUntilEnd < 0) {
            overdue++;
            newAlerts.push({
              id: `overdue_${contract.id}`,
              type: 'overdue',
              priority: 'critical',
              title: 'عقد متأخر',
              description: `عقد ${contract.contract_number} للعميل ${contract.customer_name} متأخر بـ ${Math.abs(daysUntilEnd)} أيام`,
              contractId: contract.id,
              dueDate: endDate,
              actionRequired: true,
            });
          }
        }
      });

      // Add general alerts
      if (endingIn3Days > 0) {
        newAlerts.push({
          id: 'summary_ending',
          type: 'ending_soon',
          priority: 'medium',
          title: 'عقود تنتهي قريباً',
          description: `${endingIn3Days} عقد ينتهي خلال 3 أيام`,
          actionRequired: false,
        });
      }

      if (overdue > 0) {
        newAlerts.push({
          id: 'summary_overdue',
          type: 'overdue',
          priority: 'critical',
          title: 'عقود متأخرة',
          description: `${overdue} عقد متأخر عن موعد الانتهاء`,
          actionRequired: true,
        });
      }

      setAlerts(newAlerts);
      setSummary({
        totalActive,
        endingIn3Days,
        overdue,
        maintenanceDue,
      });
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ending_soon': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance_due': return <Car className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalActive}</p>
                <p className="text-sm text-muted-foreground">عقود نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{summary.endingIn3Days}</p>
                <p className="text-sm text-muted-foreground">تنتهي خلال 3 أيام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{summary.overdue}</p>
                <p className="text-sm text-muted-foreground">عقود متأخرة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.maintenanceDue}</p>
                <p className="text-sm text-muted-foreground">صيانة مستحقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            التنبيهات والتحذيرات ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد تنبيهات
              </h3>
              <p className="text-sm text-muted-foreground">
                جميع العقود تسير بشكل طبيعي
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert 
                  key={alert.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    alert.priority === 'critical' ? 'border-red-500' :
                    alert.priority === 'high' ? 'border-orange-500' :
                    alert.priority === 'medium' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge className={getPriorityColor(alert.priority)}>
                          {alert.priority === 'critical' ? 'حرج' :
                           alert.priority === 'high' ? 'عالي' :
                           alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        {alert.actionRequired && (
                          <Badge variant="outline">يتطلب إجراء</Badge>
                        )}
                      </div>
                      <AlertDescription>
                        {alert.description}
                        {alert.dueDate && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            التاريخ المستهدف: {format(alert.dueDate, 'PPP', { locale: ar })}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};