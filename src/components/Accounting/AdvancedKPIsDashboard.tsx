import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, 
  BarChart3, Calculator, Gauge, Settings, Plus, RefreshCw,
  DollarSign, PieChart, LineChart, Activity
} from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { AdvancedKPI } from '@/types/accounting';
import { formatCurrencyKWD } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface KPICategory {
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

export const AdvancedKPIsDashboard = () => {
  const [kpis, setKpis] = useState<AdvancedKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month');
  const [newKPIDialogOpen, setNewKPIDialogOpen] = useState(false);
  const { toast } = useToast();

  const categories: KPICategory[] = [
    {
      name: 'profitability',
      description: 'مؤشرات الربحية',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      name: 'liquidity',
      description: 'مؤشرات السيولة',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      name: 'efficiency',
      description: 'مؤشرات الكفاءة',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Gauge className="w-4 h-4" />
    },
    {
      name: 'growth',
      description: 'مؤشرات النمو',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <BarChart3 className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    loadKPIs();
  }, [selectedCategory, selectedPeriod]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getAdvancedKPIs();
      // Transform the data to match TypeScript interface
      const transformedData = data.map((kpi: any) => ({
        ...kpi,
        category: kpi.category as 'profitability' | 'liquidity' | 'efficiency' | 'growth' | 'risk'
      }));
      setKpis(transformedData);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل مؤشرات الأداء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAllKPIs = async () => {
    try {
      setLoading(true);
      await accountingService.calculateAllKPIs();
      await loadKPIs();
      toast({
        title: "نجح",
        description: "تم حساب جميع مؤشرات الأداء بنجاح",
      });
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      toast({
        title: "خطأ",
        description: "فشل في حساب مؤشرات الأداء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getKPIStatus = (kpi: AdvancedKPI) => {
    if (!kpi.current_value || !kpi.target_value) return 'unknown';
    
    const percentage = (kpi.current_value / kpi.target_value) * 100;
    
    if (percentage >= 100) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'poor': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'warning': return 'تحذير';
      case 'poor': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  const filteredKPIs = kpis.filter(kpi => 
    selectedCategory === 'all' || kpi.category === selectedCategory
  );

  const KPICard = ({ kpi }: { kpi: AdvancedKPI }) => {
    const status = getKPIStatus(kpi);
    const statusColor = getStatusColor(status);
    const statusIcon = getStatusIcon(status);
    const progressValue = kpi.current_value && kpi.target_value 
      ? Math.min((kpi.current_value / kpi.target_value) * 100, 100) 
      : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{kpi.kpi_name_ar}</CardTitle>
              <p className="text-sm text-muted-foreground">{kpi.kpi_code}</p>
            </div>
            <Badge className={cn("border", statusColor)}>
              <div className="flex items-center gap-1">
                {statusIcon}
                {getStatusText(status)}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">القيمة الحالية</p>
              <p className="text-xl font-bold">
                {kpi.current_value ? kpi.current_value.toFixed(2) : 'غير محسوب'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الهدف</p>
              <p className="text-xl font-bold">
                {kpi.target_value ? kpi.target_value.toFixed(2) : 'غير محدد'}
              </p>
            </div>
          </div>

          {kpi.target_value && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم</span>
                <span>{progressValue.toFixed(0)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>فترة الحساب: {kpi.calculation_period}</p>
            {kpi.last_calculated_at && (
              <p>آخر حساب: {new Date(kpi.last_calculated_at).toLocaleDateString('ar-SA')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مؤشرات الأداء المالي المتقدمة</h2>
          <p className="text-muted-foreground">مراقبة وتحليل الأداء المالي للمؤسسة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadKPIs} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            تحديث
          </Button>
          <Button onClick={calculateAllKPIs} disabled={loading} className="btn-primary">
            <Calculator className="w-4 h-4 mr-2" />
            حساب جميع المؤشرات
          </Button>
          <Dialog open={newKPIDialogOpen} onOpenChange={setNewKPIDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                مؤشر جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مؤشر أداء جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kpi-name">اسم المؤشر</Label>
                  <Input id="kpi-name" placeholder="أدخل اسم المؤشر" />
                </div>
                <div>
                  <Label htmlFor="kpi-category">التصنيف</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setNewKPIDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button className="btn-primary">إضافة</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>التصنيف:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>الفترة:</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">الشهر الحالي</SelectItem>
              <SelectItem value="last_month">الشهر الماضي</SelectItem>
              <SelectItem value="current_quarter">الربع الحالي</SelectItem>
              <SelectItem value="current_year">السنة الحالية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const categoryKPIs = kpis.filter(kpi => kpi.category === category.name);
          const averagePerformance = categoryKPIs.length > 0 
            ? categoryKPIs.reduce((sum, kpi) => {
                if (!kpi.current_value || !kpi.target_value) return sum;
                return sum + Math.min((kpi.current_value / kpi.target_value) * 100, 100);
              }, 0) / categoryKPIs.length
            : 0;

          return (
            <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCategory(category.name)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{category.description}</h3>
                    <p className="text-sm text-muted-foreground">{categoryKPIs.length} مؤشر</p>
                    <div className="mt-2">
                      <Progress value={averagePerformance} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {averagePerformance.toFixed(0)}% متوسط الأداء
                      </p>
                    </div>
                  </div>
                  <div className={cn("p-2 rounded-lg", category.color)}>
                    {category.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* KPIs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredKPIs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مؤشرات أداء</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === 'all' 
                ? 'لم يتم إنشاء أي مؤشرات أداء بعد'
                : `لا توجد مؤشرات في تصنيف ${categories.find(c => c.name === selectedCategory)?.description}`
              }
            </p>
            <Button onClick={() => setNewKPIDialogOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              إضافة مؤشر أداء
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};