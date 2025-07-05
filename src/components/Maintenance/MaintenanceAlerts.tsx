import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, Calendar, Wrench, Bell, CheckCircle, X } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MaintenanceAlert {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  alert_type: 'overdue' | 'due_soon' | 'scheduled_today' | 'insurance_expiry' | 'registration_expiry';
  title: string;
  description: string;
  scheduled_date?: string;
  days_overdue?: number;
  days_until_due?: number;
  priority: 'high' | 'medium' | 'low';
  maintenance_id?: string;
}

interface VehicleInfo {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  insurance_expiry: string;
  registration_expiry: string;
  last_maintenance_date: string;
  next_maintenance_due: string;
}

export const MaintenanceAlerts = () => {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const generateAlerts = async () => {
    try {
      const now = new Date();
      const generatedAlerts: MaintenanceAlert[] = [];

      // جلب المركبات ومعلومات انتهاء التأمين والتسجيل
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;

      // جلب الصيانة المجدولة
      const { data: maintenanceScheduled, error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .in('status', ['scheduled', 'in_progress']);

      if (maintenanceError) throw maintenanceError;

      // تحليل الصيانة المتأخرة والقادمة
      maintenanceScheduled?.forEach((maintenance) => {
        if (!maintenance.scheduled_date) return;

        const scheduledDate = new Date(maintenance.scheduled_date);
        const daysDifference = differenceInDays(now, scheduledDate);

        if (maintenance.status === 'scheduled') {
          if (daysDifference > 0) {
            // صيانة متأخرة
            generatedAlerts.push({
              id: `overdue-${maintenance.id}`,
              vehicle_id: maintenance.vehicle_id,
              vehicle_number: maintenance.vehicles?.vehicle_number || '',
              vehicle_make: maintenance.vehicles?.make || '',
              vehicle_model: maintenance.vehicles?.model || '',
              alert_type: 'overdue',
              title: 'صيانة متأخرة',
              description: `${maintenance.maintenance_type} - متأخرة ${daysDifference} يوم`,
              scheduled_date: maintenance.scheduled_date,
              days_overdue: daysDifference,
              priority: daysDifference > 7 ? 'high' : 'medium',
              maintenance_id: maintenance.id,
            });
          } else if (daysDifference === 0) {
            // صيانة مجدولة اليوم
            generatedAlerts.push({
              id: `today-${maintenance.id}`,
              vehicle_id: maintenance.vehicle_id,
              vehicle_number: maintenance.vehicles?.vehicle_number || '',
              vehicle_make: maintenance.vehicles?.make || '',
              vehicle_model: maintenance.vehicles?.model || '',
              alert_type: 'scheduled_today',
              title: 'صيانة مجدولة اليوم',
              description: `${maintenance.maintenance_type} - مجدولة اليوم`,
              scheduled_date: maintenance.scheduled_date,
              priority: 'high',
              maintenance_id: maintenance.id,
            });
          } else if (daysDifference >= -7) {
            // صيانة قادمة خلال أسبوع
            generatedAlerts.push({
              id: `due-soon-${maintenance.id}`,
              vehicle_id: maintenance.vehicle_id,
              vehicle_number: maintenance.vehicles?.vehicle_number || '',
              vehicle_make: maintenance.vehicles?.make || '',
              vehicle_model: maintenance.vehicles?.model || '',
              alert_type: 'due_soon',
              title: 'صيانة قادمة',
              description: `${maintenance.maintenance_type} - خلال ${Math.abs(daysDifference)} يوم`,
              scheduled_date: maintenance.scheduled_date,
              days_until_due: Math.abs(daysDifference),
              priority: Math.abs(daysDifference) <= 3 ? 'medium' : 'low',
              maintenance_id: maintenance.id,
            });
          }
        }
      });

      // تحليل انتهاء صلاحية التأمين والتسجيل
      vehicles?.forEach((vehicle: VehicleInfo) => {
        // فحص انتهاء التأمين
        if (vehicle.insurance_expiry) {
          const insuranceExpiry = new Date(vehicle.insurance_expiry);
          const daysUntilInsuranceExpiry = differenceInDays(insuranceExpiry, now);

          if (daysUntilInsuranceExpiry <= 30 && daysUntilInsuranceExpiry >= 0) {
            generatedAlerts.push({
              id: `insurance-${vehicle.id}`,
              vehicle_id: vehicle.id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model,
              alert_type: 'insurance_expiry',
              title: 'انتهاء صلاحية التأمين',
              description: `ينتهي التأمين خلال ${daysUntilInsuranceExpiry} يوم`,
              scheduled_date: vehicle.insurance_expiry,
              days_until_due: daysUntilInsuranceExpiry,
              priority: daysUntilInsuranceExpiry <= 7 ? 'high' : 'medium',
            });
          } else if (daysUntilInsuranceExpiry < 0) {
            generatedAlerts.push({
              id: `insurance-expired-${vehicle.id}`,
              vehicle_id: vehicle.id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model,
              alert_type: 'insurance_expiry',
              title: 'انتهت صلاحية التأمين',
              description: `انتهت صلاحية التأمين منذ ${Math.abs(daysUntilInsuranceExpiry)} يوم`,
              scheduled_date: vehicle.insurance_expiry,
              days_overdue: Math.abs(daysUntilInsuranceExpiry),
              priority: 'high',
            });
          }
        }

        // فحص انتهاء التسجيل
        if (vehicle.registration_expiry) {
          const registrationExpiry = new Date(vehicle.registration_expiry);
          const daysUntilRegistrationExpiry = differenceInDays(registrationExpiry, now);

          if (daysUntilRegistrationExpiry <= 30 && daysUntilRegistrationExpiry >= 0) {
            generatedAlerts.push({
              id: `registration-${vehicle.id}`,
              vehicle_id: vehicle.id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model,
              alert_type: 'registration_expiry',
              title: 'انتهاء صلاحية التسجيل',
              description: `ينتهي التسجيل خلال ${daysUntilRegistrationExpiry} يوم`,
              scheduled_date: vehicle.registration_expiry,
              days_until_due: daysUntilRegistrationExpiry,
              priority: daysUntilRegistrationExpiry <= 7 ? 'high' : 'medium',
            });
          } else if (daysUntilRegistrationExpiry < 0) {
            generatedAlerts.push({
              id: `registration-expired-${vehicle.id}`,
              vehicle_id: vehicle.id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_make: vehicle.make,
              vehicle_model: vehicle.model,
              alert_type: 'registration_expiry',
              title: 'انتهت صلاحية التسجيل',
              description: `انتهت صلاحية التسجيل منذ ${Math.abs(daysUntilRegistrationExpiry)} يوم`,
              scheduled_date: vehicle.registration_expiry,
              days_overdue: Math.abs(daysUntilRegistrationExpiry),
              priority: 'high',
            });
          }
        }
      });

      // ترتيب التنبيهات حسب الأولوية
      const sortedAlerts = generatedAlerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      setAlerts(sortedAlerts);

    } catch (error) {
      console.error('Error generating alerts:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل التنبيهات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAlerts();
    
    // تحديث التنبيهات كل 5 دقائق
    const interval = setInterval(generateAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'scheduled_today':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'due_soon':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'insurance_expiry':
      case 'registration_expiry':
        return <Bell className="h-5 w-5 text-orange-600" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">عالية</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-600">متوسطة</Badge>;
      case 'low':
        return <Badge variant="secondary">منخفضة</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleMarkAsResolved = async (alert: MaintenanceAlert) => {
    if (alert.maintenance_id) {
      try {
        const { error } = await supabase
          .from('vehicle_maintenance')
          .update({ status: 'completed', completed_date: format(new Date(), 'yyyy-MM-dd') })
          .eq('id', alert.maintenance_id);

        if (error) throw error;

        toast({
          title: 'تم التحديث',
          description: 'تم وضع علامة مكتمل على الصيانة',
        });

        generateAlerts(); // إعادة تحميل التنبيهات
      } catch (error) {
        console.error('Error updating maintenance:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تحديث الصيانة',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    toast({
      title: 'تم الإخفاء',
      description: 'تم إخفاء التنبيه',
    });
  };

  const getAlertStats = () => {
    const high = alerts.filter(a => a.priority === 'high').length;
    const medium = alerts.filter(a => a.priority === 'medium').length;
    const low = alerts.filter(a => a.priority === 'low').length;
    return { high, medium, low };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getAlertStats();

  return (
    <div className="space-y-6">
      {/* إحصائيات التنبيهات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <p className="text-xs text-muted-foreground">إجمالي التنبيهات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.high}</div>
                <p className="text-xs text-muted-foreground">أولوية عالية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                <p className="text-xs text-muted-foreground">أولوية متوسطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
                <p className="text-xs text-muted-foreground">أولوية منخفضة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة التنبيهات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تنبيهات الصيانة</CardTitle>
        </CardHeader>
        <CardContent className="text-right">
          {alerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ممتاز! لا توجد تنبيهات صيانة في الوقت الحالي.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    {/* المحتوى الرئيسي على اليمين */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* زر الإخفاء */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissAlert(alert.id)}
                            className="h-8 px-3 text-gray-600 hover:text-gray-700 border-gray-300"
                          >
                            <X className="h-4 w-4 ml-1" />
                            إخفاء
                          </Button>
                          
                          {/* شارة الأولوية */}
                          {alert.priority === 'high' && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              عالية
                            </span>
                          )}
                          {alert.priority === 'medium' && (
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              متوسطة
                            </span>
                          )}
                          {alert.priority === 'low' && (
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              منخفضة
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {alert.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-1">
                            {alert.vehicle_number} - {alert.vehicle_make} {alert.vehicle_model}
                          </p>
                          <p className="text-gray-800 text-sm mb-1">
                            {alert.description}
                          </p>
                          {alert.scheduled_date && (
                            <p className="text-gray-500 text-xs">
                              التاريخ: {format(new Date(alert.scheduled_date), 'dd/MM/yyyy', { locale: ar })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};