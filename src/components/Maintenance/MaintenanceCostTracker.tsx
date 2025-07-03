import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface CostData {
  period: string;
  totalCost: number;
  maintenanceCount: number;
  averageCost: number;
}

interface MaintenanceCostByType {
  maintenance_type: string;
  totalCost: number;
  count: number;
  percentage: number;
}

interface VehicleCostSummary {
  vehicle_id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  totalCost: number;
  maintenanceCount: number;
  averageCost: number;
  lastMaintenance: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export const MaintenanceCostTracker = () => {
  const [periodFilter, setPeriodFilter] = useState('this_year');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [costTrends, setCostTrends] = useState<CostData[]>([]);
  const [costByType, setCostByType] = useState<MaintenanceCostByType[]>([]);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostSummary[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalCost: 0,
    totalMaintenance: 0,
    averageCost: 0,
    highestCost: 0,
    mostExpensiveType: '',
  });
  const { toast } = useToast();

  const fetchCostData = async () => {
    try {
      // جلب المركبات
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // حساب نطاق التاريخ
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (periodFilter) {
        case 'this_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last_month':
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case 'this_year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'all_time':
        default:
          startDate = new Date('2020-01-01');
          endDate = now;
      }

      // بناء الاستعلام
      let query = supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .eq('status', 'completed')
        .not('cost', 'is', null)
        .gte('completed_date', format(startDate, 'yyyy-MM-dd'))
        .lte('completed_date', format(endDate, 'yyyy-MM-dd'));

      if (vehicleFilter !== 'all') {
        query = query.eq('vehicle_id', vehicleFilter);
      }

      const { data: maintenanceData, error: maintenanceError } = await query
        .order('completed_date', { ascending: true });

      if (maintenanceError) throw maintenanceError;

      // معالجة البيانات لاتجاهات التكلفة
      const monthlyData: { [key: string]: { cost: number; count: number } } = {};
      
      maintenanceData?.forEach((maintenance) => {
        if (maintenance.completed_date && maintenance.cost) {
          const monthKey = format(new Date(maintenance.completed_date), 'yyyy-MM');
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { cost: 0, count: 0 };
          }
          monthlyData[monthKey].cost += maintenance.cost;
          monthlyData[monthKey].count += 1;
        }
      });

      const trendsData = Object.entries(monthlyData).map(([month, data]) => ({
        period: format(new Date(month + '-01'), 'MMM yyyy', { locale: ar }),
        totalCost: data.cost,
        maintenanceCount: data.count,
        averageCost: data.cost / data.count,
      }));

      setCostTrends(trendsData);

      // معالجة البيانات حسب نوع الصيانة
      const typeData: { [key: string]: { cost: number; count: number } } = {};
      
      maintenanceData?.forEach((maintenance) => {
        if (maintenance.cost && maintenance.maintenance_type) {
          if (!typeData[maintenance.maintenance_type]) {
            typeData[maintenance.maintenance_type] = { cost: 0, count: 0 };
          }
          typeData[maintenance.maintenance_type].cost += maintenance.cost;
          typeData[maintenance.maintenance_type].count += 1;
        }
      });

      const totalMaintenanceCost = Object.values(typeData).reduce((sum, data) => sum + data.cost, 0);
      
      const costsByType = Object.entries(typeData).map(([type, data]) => ({
        maintenance_type: type,
        totalCost: data.cost,
        count: data.count,
        percentage: totalMaintenanceCost > 0 ? (data.cost / totalMaintenanceCost) * 100 : 0,
      })).sort((a, b) => b.totalCost - a.totalCost);

      setCostByType(costsByType);

      // معالجة البيانات حسب المركبة
      const vehicleData: { [key: string]: { 
        cost: number; 
        count: number; 
        vehicle_number: string; 
        make: string; 
        model: string; 
        lastMaintenance: string;
      } } = {};
      
      maintenanceData?.forEach((maintenance) => {
        if (maintenance.cost && maintenance.vehicle_id) {
          if (!vehicleData[maintenance.vehicle_id]) {
            vehicleData[maintenance.vehicle_id] = {
              cost: 0,
              count: 0,
              vehicle_number: maintenance.vehicles?.vehicle_number || '',
              make: maintenance.vehicles?.make || '',
              model: maintenance.vehicles?.model || '',
              lastMaintenance: maintenance.completed_date || '',
            };
          }
          vehicleData[maintenance.vehicle_id].cost += maintenance.cost;
          vehicleData[maintenance.vehicle_id].count += 1;
          
          // تحديث تاريخ آخر صيانة
          if (maintenance.completed_date && 
              new Date(maintenance.completed_date) > new Date(vehicleData[maintenance.vehicle_id].lastMaintenance)) {
            vehicleData[maintenance.vehicle_id].lastMaintenance = maintenance.completed_date;
          }
        }
      });

      const vehicleCostData = Object.entries(vehicleData).map(([vehicleId, data]) => ({
        vehicle_id: vehicleId,
        vehicle_number: data.vehicle_number,
        vehicle_make: data.make,
        vehicle_model: data.model,
        totalCost: data.cost,
        maintenanceCount: data.count,
        averageCost: data.cost / data.count,
        lastMaintenance: data.lastMaintenance,
      })).sort((a, b) => b.totalCost - a.totalCost);

      setVehicleCosts(vehicleCostData);

      // حساب الإحصائيات الإجمالية
      const totalCost = maintenanceData?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
      const totalMaintenance = maintenanceData?.length || 0;
      const averageCost = totalMaintenance > 0 ? totalCost / totalMaintenance : 0;
      const highestCost = Math.max(...(maintenanceData?.map(m => m.cost || 0) || [0]));
      const mostExpensiveType = costsByType[0]?.maintenance_type || '';

      setTotalStats({
        totalCost,
        totalMaintenance,
        averageCost,
        highestCost,
        mostExpensiveType,
      });

    } catch (error) {
      console.error('Error fetching cost data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل بيانات التكاليف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, [periodFilter, vehicleFilter]);

  const exportReport = () => {
    const report = {
      period: periodFilter,
      vehicle: vehicleFilter === 'all' ? 'جميع المركبات' : vehicles.find(v => v.id === vehicleFilter)?.vehicle_number,
      generated_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      total_stats: totalStats,
      cost_trends: costTrends,
      cost_by_type: costByType,
      vehicle_costs: vehicleCosts,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_cost_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();

    toast({
      title: 'تم التصدير',
      description: 'تم تصدير تقرير التكاليف بنجاح',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
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
      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تتبع تكاليف الصيانة</CardTitle>
        </CardHeader>
        <CardContent className="text-right">
          <div className="flex flex-col md:flex-row-reverse gap-4 mb-6">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">هذا الشهر</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="this_year">هذا العام</SelectItem>
                <SelectItem value="all_time">كل الوقت</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب المركبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المركبات</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportReport} variant="outline" className="w-full md:w-auto">
              <Download className="h-4 w-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{totalStats.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي التكلفة (د.ك)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalStats.totalMaintenance}</div>
                <p className="text-xs text-muted-foreground">عدد الصيانات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{totalStats.averageCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">متوسط التكلفة (د.ك)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{totalStats.highestCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">أعلى تكلفة (د.ك)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <PieChart className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-lg font-bold truncate">{totalStats.mostExpensiveType}</div>
                <p className="text-xs text-muted-foreground">أغلى نوع صيانة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* اتجاه التكاليف */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اتجاه التكاليف الشهرية</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} د.ك`,
                      name === 'totalCost' ? 'إجمالي التكلفة' : 'متوسط التكلفة'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalCost" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="إجمالي التكلفة"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageCost" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="متوسط التكلفة"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* التكاليف حسب النوع */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">التكاليف حسب نوع الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={costByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalCost"
                    label={({ maintenance_type, percentage }) => 
                      `${maintenance_type}: ${percentage.toFixed(1)}%`
                    }
                  >
                    {costByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} د.ك`, 'التكلفة']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التكاليف حسب المركبة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">التكاليف حسب المركبة</CardTitle>
        </CardHeader>
        <CardContent className="text-right">
          {vehicleCosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات تكاليف للفترة المحددة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleCosts.map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-lg font-bold">
                        {vehicle.totalCost.toFixed(2)} د.ك
                      </div>
                      <Badge variant="outline">
                        متوسط: {vehicle.averageCost.toFixed(2)} د.ك
                      </Badge>
                    </div>
                    <div className="text-right flex-1 mr-4">
                      <div className="font-medium">
                        {vehicle.vehicle_number} - {vehicle.vehicle_make} {vehicle.vehicle_model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.maintenanceCount} عملية صيانة
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    آخر صيانة: {format(new Date(vehicle.lastMaintenance), 'dd/MM/yyyy', { locale: ar })}
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