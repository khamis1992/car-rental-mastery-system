import React from 'react';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { FinancialBreadcrumb } from '@/components/Financial/FinancialBreadcrumb';
import { LazyFinancialChart } from '@/components/Financial/LazyFinancialChart';
import { FinancialPerformanceMonitor } from '@/components/Financial/FinancialPerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  Calendar, 
  TrendingUp, 
  FileText, 
  BarChart3,
  PieChart,
  DollarSign,
  Building,
  Eye,
  Settings,
  Filter
} from 'lucide-react';
import { useFinancialCache } from '@/hooks/useFinancialCache';

const FinancialReports = () => {
  // Use cached data for better performance
  const { data: reportsData, loading, refetch } = useFinancialCache(
    'financial-reports',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalReports: 24,
        exported: 1247,
        scheduled: 12,
        templates: 5
      };
    }
  );

  const reportCategories = [
    {
      title: "التقارير الأساسية",
      description: "التقارير المالية الأساسية والمطلوبة",
      reports: [
        {
          title: "قائمة الدخل",
          description: "تقرير الإيرادات والمصروفات",
          icon: TrendingUp,
          color: "bg-green-500",
          status: "ready",
          lastGenerated: "2024-01-15",
          chartData: [
            { name: 'يناير', value: 4000 },
            { name: 'فبراير', value: 3000 },
            { name: 'مارس', value: 5000 }
          ]
        },
        {
          title: "الميزانية العمومية",
          description: "الأصول والخصوم وحقوق الملكية",
          icon: BarChart3,
          color: "bg-blue-500",
          status: "ready",
          lastGenerated: "2024-01-15",
          chartData: [
            { name: 'أصول', value: 6000 },
            { name: 'خصوم', value: 4000 },
            { name: 'حقوق الملكية', value: 2000 }
          ]
        },
        {
          title: "قائمة التدفقات النقدية",
          description: "حركة النقد والنقد المعادل",
          icon: DollarSign,
          color: "bg-purple-500",
          status: "ready",
          lastGenerated: "2024-01-14",
          chartData: [
            { name: 'التشغيل', value: 2500 },
            { name: 'الاستثمار', value: -1500 },
            { name: 'التمويل', value: 500 }
          ]
        }
      ]
    },
    {
      title: "التقارير التحليلية",
      description: "تقارير متقدمة للتحليل المالي",
      reports: [
        {
          title: "التحليل التقليدي",
          description: "تقرير شامل بالأرصدة الافتتاحية والختامية",
          icon: PieChart,
          color: "bg-indigo-500",
          status: "ready",
          lastGenerated: "2024-01-15",
          chartData: [
            { name: 'افتتاحي', value: 5000 },
            { name: 'ختامي', value: 5500 }
          ]
        },
        {
          title: "ميزان المراجعة المحسن",
          description: "ميزان شامل بحركة الفترة والأرصدة",
          icon: FileText,
          color: "bg-teal-500",
          status: "processing",
          lastGenerated: "2024-01-12",
          chartData: [
            { name: 'مدين', value: 12000 },
            { name: 'دائن', value: 12000 }
          ]
        },
        {
          title: "تحليل الربحية",
          description: "تحليل الربحية بالمراكز والخدمات",
          icon: TrendingUp,
          color: "bg-orange-500",
          status: "ready",
          lastGenerated: "2024-01-15",
          chartData: [
            { name: 'مركز 1', value: 3000 },
            { name: 'مركز 2', value: 2500 }
          ]
        }
      ]
    },
    {
      title: "تقارير الإدارة",
      description: "تقارير خاصة بالإدارة والتخطيط",
      reports: [
        {
          title: "تقرير الأداء المالي",
          description: "مؤشرات الأداء المالي الرئيسية",
          icon: Building,
          color: "bg-red-500",
          status: "ready",
          lastGenerated: "2024-01-15",
          chartData: [
            { name: 'نمو الإيرادات', value: 15 },
            { name: 'هامش الربح', value: 20 }
          ]
        },
        {
          title: "تحليل المخاطر المالية",
          description: "تحليل المخاطر والنسب المالية",
          icon: BarChart3,
          color: "bg-yellow-500",
          status: "scheduled",
          lastGenerated: "2024-01-10",
          chartData: [
            { name: 'سيولة', value: 1.2 },
            { name: 'رافعة مالية', value: 0.8 }
          ]
        },
        {
          title: "تقرير التوقعات",
          description: "التوقعات المالية والموازنات",
          icon: TrendingUp,
          color: "bg-pink-500",
          status: "ready",
          lastGenerated: "2024-01-14",
          chartData: [
            { name: 'الإيرادات المتوقعة', value: 5500 },
            { name: 'المصروفات المتوقعة', value: 4500 }
          ]
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { label: "جاهز", variant: "default" as const, color: "bg-green-50 text-green-700" },
      processing: { label: "قيد المعالجة", variant: "secondary" as const, color: "bg-yellow-50 text-yellow-700" },
      scheduled: { label: "مجدول", variant: "outline" as const, color: "bg-blue-50 text-blue-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Navigation */}
      <FinancialBreadcrumb />
      
      {/* Modern Header with Performance Monitor */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            التقارير المالية
          </h1>
          <p className="text-muted-foreground mt-2">إنشاء وعرض التقارير المالية والمحاسبية بطريقة حديثة ومتقدمة</p>
        </div>
        
        <div className="flex items-center gap-4">
          <FinancialPerformanceMonitor componentName="FinancialReports" showDetails />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rtl-flex">
              <Filter className="w-4 h-4" />
              تصفية
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Calendar className="w-4 h-4" />
              تخصيص الفترة
            </Button>
            <Button variant="outline" onClick={refetch} className="rtl-flex">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button className="btn-primary rtl-flex">
              <Download className="w-4 h-4" />
              تصدير جميع التقارير
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats with Loading State */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : reportsData?.totalReports || 24}
                </p>
                <p className="text-sm text-muted-foreground">تقارير متاحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : reportsData?.exported || 1247}
                </p>
                <p className="text-sm text-muted-foreground">تم تصديرها</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : reportsData?.scheduled || 12}
                </p>
                <p className="text-sm text-muted-foreground">تقارير دورية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Settings className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : reportsData?.templates || 5}
                </p>
                <p className="text-sm text-muted-foreground">قوالب مخصصة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Chart with Lazy Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyFinancialChart
          title="الإيرادات الشهرية"
          data={[
            { name: 'يناير', value: 4000 },
            { name: 'فبراير', value: 3000 },
            { name: 'مارس', value: 5000 },
            { name: 'أبريل', value: 4500 }
          ]}
          type="bar"
          height={300}
        />
        
        <LazyFinancialChart
          title="توزيع المصروفات"
          data={[
            { name: 'الرواتب', value: 35 },
            { name: 'الإيجار', value: 25 },
            { name: 'الصيانة', value: 20 },
            { name: 'أخرى', value: 20 }
          ]}
          type="pie"
          height={300}
        />
      </div>

      {/* Reports Categories */}
      <div className="space-y-8">
        {reportCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map((report, reportIndex) => {
                const IconComponent = report.icon;
                
                return (
                  <Card key={reportIndex} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${report.color}`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {report.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          آخر إنشاء: {report.lastGenerated}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Eye className="w-4 h-4 ml-2" />
                          عرض
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legacy Component */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>واجهة التقارير التقليدية</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialReportsTab />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialReports;
