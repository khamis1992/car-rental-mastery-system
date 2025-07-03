import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, AlertTriangle, Wrench, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MaintenanceStats {
  totalVehicles: number;
  scheduledMaintenance: number;
  overdueMaintenance: number;
  inProgressMaintenance: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
  averageCostPerService: number;
}

interface UpcomingMaintenance {
  id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  maintenance_type: string;
  scheduled_date: string;
  status: string;
}

export const MaintenanceOverview = () => {
  const [stats, setStats] = useState<MaintenanceStats>({
    totalVehicles: 0,
    scheduledMaintenance: 0,
    overdueMaintenance: 0,
    inProgressMaintenance: 0,
    completedThisMonth: 0,
    totalCostThisMonth: 0,
    averageCostPerService: 0,
  });
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<UpcomingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMaintenanceStats = async () => {
    try {
      // إحصائيات المركبات
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;

      // إحصائيات الصيانة
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .select('*');

      if (maintenanceError) throw maintenanceError;

      // حساب الإحصائيات
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const scheduled = maintenance?.filter(m => m.status === 'scheduled').length || 0;
      const overdue = maintenance?.filter(m => 
        m.status === 'scheduled' && 
        m.scheduled_date && 
        new Date(m.scheduled_date) < now
      ).length || 0;
      const inProgress = maintenance?.filter(m => m.status === 'in_progress').length || 0;
      const completedThisMonth = maintenance?.filter(m => 
        m.status === 'completed' && 
        m.completed_date && 
        new Date(m.completed_date) >= thisMonth
      ).length || 0;

      const thisMonthMaintenances = maintenance?.filter(m => 
        m.completed_date && new Date(m.completed_date) >= thisMonth
      ) || [];
      
      const totalCostThisMonth = thisMonthMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
      const completedMaintenances = maintenance?.filter(m => m.status === 'completed' && m.cost) || [];
      const averageCostPerService = completedMaintenances.length > 0 
        ? completedMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0) / completedMaintenances.length 
        : 0;

      setStats({
        totalVehicles: vehicles?.length || 0,
        scheduledMaintenance: scheduled,
        overdueMaintenance: overdue,
        inProgressMaintenance: inProgress,
        completedThisMonth,
        totalCostThisMonth,
        averageCostPerService,
      });

      // الصيانة القادمة
      const { data: upcoming, error: upcomingError } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_date', now.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(5);

      if (upcomingError) throw upcomingError;

      const formattedUpcoming = upcoming?.map(m => ({
        id: m.id,
        vehicle_number: m.vehicles?.vehicle_number || '',
        vehicle_make: m.vehicles?.make || '',
        vehicle_model: m.vehicles?.model || '',
        maintenance_type: m.maintenance_type,
        scheduled_date: m.scheduled_date,
        status: m.status,
      })) || [];

      setUpcomingMaintenance(formattedUpcoming);

    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل إحصائيات الصيانة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceStats();
  }, []);

  const getMaintenanceProgress = () => {
    const total = stats.scheduledMaintenance + stats.inProgressMaintenance + stats.overdueMaintenance;
    if (total === 0) return 100;
    return ((stats.scheduledMaintenance + stats.inProgressMaintenance) / total) * 100;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">مجدولة</Badge>;
      case 'in_progress':
        return <Badge variant="default">جاري التنفيذ</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">مكتملة</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جاري التنفيذ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressMaintenance}</div>
            <p className="text-xs text-muted-foreground">في المركز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صيانة متأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueMaintenance}</div>
            <p className="text-xs text-muted-foreground">تحتاج انتباه</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صيانة مجدولة</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduledMaintenance}</div>
            <p className="text-xs text-muted-foreground">عملية صيانة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المركبات</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">في الأسطول</p>
          </CardContent>
        </Card>
      </div>

      {/* تقدم الصيانة والتكاليف */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التكاليف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCostThisMonth.toFixed(2)} د.ك</div>
                <p className="text-xs text-muted-foreground">تكلفة هذا الشهر</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-semibold">{stats.averageCostPerService.toFixed(2)} د.ك</div>
                <p className="text-xs text-muted-foreground">متوسط التكلفة لكل خدمة</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.completedThisMonth} عملية صيانة مكتملة هذا الشهر
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقدم الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>الصيانة المكتملة والجارية</span>
                <span>{Math.round(getMaintenanceProgress())}%</span>
              </div>
              <Progress value={getMaintenanceProgress()} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.scheduledMaintenance + stats.inProgressMaintenance} من أصل {stats.scheduledMaintenance + stats.inProgressMaintenance + stats.overdueMaintenance} عملية صيانة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الصيانة القادمة */}
      <Card>
        <CardHeader>
          <CardTitle>الصيانة القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMaintenance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد صيانة مجدولة قادمة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMaintenance.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {maintenance.vehicle_number} - {maintenance.vehicle_make} {maintenance.vehicle_model}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {maintenance.maintenance_type}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(maintenance.scheduled_date), 'dd/MM/yyyy', { locale: ar })}
                    </div>
                    {getStatusBadge(maintenance.status)}
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