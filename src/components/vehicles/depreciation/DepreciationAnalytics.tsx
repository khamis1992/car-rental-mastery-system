import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  PieChart, 
  Calendar,
  FileBarChart,
  AlertTriangle,
  CheckCircle,
  Download
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface AnalyticsData {
  monthlyTrend: Array<{
    month: string;
    depreciation: number;
    vehicles: number;
    avgDepreciation: number;
  }>;
  vehicleDistribution: Array<{
    vehicle: string;
    totalDepreciation: number;
    percentage: number;
  }>;
  costTypeAnalysis: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  performanceMetrics: {
    totalDepreciation: number;
    averageMonthly: number;
    totalVehicles: number;
    processingRate: number;
  };
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function DepreciationAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("6");
  const [analysisType, setAnalysisType] = useState("monthly");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["depreciation-analytics", selectedPeriod, analysisType],
    queryFn: async () => {
      const periodMonths = parseInt(selectedPeriod);
      const startDate = startOfMonth(subMonths(new Date(), periodMonths - 1));
      const endDate = endOfMonth(new Date());

      // Fetch depreciation schedule data
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("vehicle_depreciation_schedule")
        .select(`
          *,
          vehicles:vehicle_id (
            id,
            license_plate,
            make,
            model,
            year
          )
        `)
        .gte("depreciation_date", format(startDate, "yyyy-MM-dd"))
        .lte("depreciation_date", format(endDate, "yyyy-MM-dd"))
        .order("depreciation_date");

      if (scheduleError) throw scheduleError;

      // Fetch vehicle costs data
      const { data: costsData, error: costsError } = await supabase
        .from("vehicle_costs")
        .select("*")
        .gte("cost_date", format(startDate, "yyyy-MM-dd"))
        .lte("cost_date", format(endDate, "yyyy-MM-dd"));

      if (costsError) throw costsError;

      // Process monthly trend
      const monthlyGroups = scheduleData.reduce((acc, item) => {
        const month = format(new Date(item.depreciation_date), "yyyy-MM");
        if (!acc[month]) {
          acc[month] = {
            depreciation: 0,
            vehicles: new Set(),
            items: []
          };
        }
        acc[month].depreciation += item.monthly_depreciation;
        acc[month].vehicles.add(item.vehicle_id);
        acc[month].items.push(item);
        return acc;
      }, {} as Record<string, any>);

      const monthlyTrend = Object.entries(monthlyGroups).map(([month, data]) => ({
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: ar }),
        depreciation: data.depreciation,
        vehicles: data.vehicles.size,
        avgDepreciation: data.depreciation / data.vehicles.size || 0
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Process vehicle distribution
      const vehicleGroups = scheduleData.reduce((acc, item) => {
        const vehicleKey = `${item.vehicles?.license_plate} - ${item.vehicles?.make} ${item.vehicles?.model}`;
        if (!acc[vehicleKey]) {
          acc[vehicleKey] = 0;
        }
        acc[vehicleKey] += item.monthly_depreciation;
        return acc;
      }, {} as Record<string, number>);

      const totalDepreciation = Object.values(vehicleGroups).reduce((sum, val) => sum + val, 0);
      const vehicleDistribution = Object.entries(vehicleGroups)
        .map(([vehicle, amount]) => ({
          vehicle,
          totalDepreciation: amount,
          percentage: (amount / totalDepreciation) * 100
        }))
        .sort((a, b) => b.totalDepreciation - a.totalDepreciation)
        .slice(0, 10); // Top 10 vehicles

      // Process cost type analysis
      const costTypeGroups = costsData.reduce((acc, item) => {
        if (!acc[item.cost_type]) {
          acc[item.cost_type] = {
            amount: 0,
            count: 0
          };
        }
        acc[item.cost_type].amount += item.amount;
        acc[item.cost_type].count += 1;
        return acc;
      }, {} as Record<string, any>);

      const costTypeAnalysis = Object.entries(costTypeGroups).map(([type, data]) => ({
        type,
        amount: data.amount,
        count: data.count
      }));

      // Calculate performance metrics
      const processedItems = scheduleData.filter(item => item.is_processed);
      const processingRate = scheduleData.length > 0 ? (processedItems.length / scheduleData.length) * 100 : 0;

      const performanceMetrics = {
        totalDepreciation,
        averageMonthly: totalDepreciation / periodMonths,
        totalVehicles: new Set(scheduleData.map(item => item.vehicle_id)).size,
        processingRate
      };

      return {
        monthlyTrend,
        vehicleDistribution,
        costTypeAnalysis,
        performanceMetrics
      } as AnalyticsData;
    },
  });

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const dataToExport = {
      period: `${selectedPeriod} أشهر`,
      generated_at: new Date().toISOString(),
      performance_metrics: analyticsData.performanceMetrics,
      monthly_trend: analyticsData.monthlyTrend,
      vehicle_distribution: analyticsData.vehicleDistribution,
      cost_analysis: analyticsData.costTypeAnalysis
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تحليلات_الاستهلاك_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جارٍ تحليل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">تحليلات الاستهلاك المتقدمة</h3>
          <p className="text-sm text-muted-foreground">
            رؤى شاملة حول أداء استهلاك المركبات والتكاليف
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 أشهر</SelectItem>
              <SelectItem value="6">6 أشهر</SelectItem>
              <SelectItem value="12">12 شهر</SelectItem>
              <SelectItem value="24">24 شهر</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            تصدير التحليلات
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              إجمالي الاستهلاك
            </CardDescription>
            <CardTitle className="text-2xl">
              {analyticsData?.performanceMetrics.totalDepreciation.toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              متوسط شهري
            </CardDescription>
            <CardTitle className="text-2xl">
              {analyticsData?.performanceMetrics.averageMonthly.toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              إجمالي المركبات
            </CardDescription>
            <CardTitle className="text-2xl">
              {analyticsData?.performanceMetrics.totalVehicles}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              {analyticsData?.performanceMetrics.processingRate >= 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              معدل المعالجة
            </CardDescription>
            <CardTitle className="text-2xl">
              {analyticsData?.performanceMetrics.processingRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              اتجاه الاستهلاك الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `الشهر: ${label}`}
                  formatter={(value, name) => [
                    `${value.toLocaleString()} د.ك`, 
                    name === 'depreciation' ? 'الاستهلاك' : 'المركبات'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="depreciation" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              توزيع الاستهلاك بالمركبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analyticsData?.vehicleDistribution.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="totalDepreciation"
                  nameKey="vehicle"
                >
                  {analyticsData?.vehicleDistribution.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} د.ك`, 'الاستهلاك']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            أداء المركبات - أعلى استهلاك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData?.vehicleDistribution.slice(0, 8).map((vehicle, index) => (
              <div key={vehicle.vehicle} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{vehicle.vehicle}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.percentage.toFixed(1)}% من إجمالي الاستهلاك
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-medium">
                    {vehicle.totalDepreciation.toLocaleString()} د.ك
                  </div>
                  <div className="w-20 bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${vehicle.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      {analyticsData?.costTypeAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              تحليل التكاليف بالنوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.costTypeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} د.ك`, 'المبلغ']}
                />
                <Bar dataKey="amount" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}