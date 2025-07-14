import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Calendar, TrendingUp, BarChart3, 
  PieChart, Settings, RefreshCw, Filter, ArrowRight,
  Building2, DollarSign, Target, Activity
} from 'lucide-react';
import { AdvancedKPIsDashboard } from '@/components/Accounting/AdvancedKPIsDashboard';
import { AIFinancialAnalytics } from '@/components/Accounting/AIFinancialAnalytics';
import { CashFlowManagement } from '@/components/Accounting/CashFlowManagement';
import { cn } from '@/lib/utils';

const AdvancedFinancialReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedFormat, setSelectedFormat] = useState('detailed');
  const [activeTab, setActiveTab] = useState('kpis');

  const reportCategories = [
    {
      id: 'kpis',
      title: 'مؤشرات الأداء المالي',
      description: 'تحليل شامل لمؤشرات الأداء الرئيسية',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      id: 'ai_analytics',
      title: 'التحليلات الذكية',
      description: 'رؤى مدعومة بالذكاء الاصطناعي',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      id: 'cash_flow',
      title: 'إدارة التدفق النقدي',
      description: 'تحليل التدفقات النقدية والسيولة',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'comprehensive',
      title: 'التقارير الشاملة',
      description: 'تقارير مالية متكاملة ومفصلة',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    }
  ];

  const predefinedReports = [
    {
      name: 'تقرير الأداء المالي الشامل',
      description: 'تحليل شامل للأداء المالي مع المؤشرات والاتجاهات',
      type: 'comprehensive',
      frequency: 'monthly'
    },
    {
      name: 'تقرير مؤشرات الربحية',
      description: 'تحليل مفصل لمؤشرات الربحية والكفاءة التشغيلية',
      type: 'profitability',
      frequency: 'weekly'
    },
    {
      name: 'تقرير السيولة والتدفق النقدي',
      description: 'تحليل السيولة والتدفقات النقدية المتوقعة',
      type: 'liquidity',
      frequency: 'daily'
    },
    {
      name: 'تقرير التحليلات التنبؤية',
      description: 'توقعات مالية باستخدام الذكاء الاصطناعي',
      type: 'predictive',
      frequency: 'monthly'
    },
    {
      name: 'تقرير مراكز التكلفة',
      description: 'تحليل أداء مراكز التكلفة والميزانيات',
      type: 'cost_centers',
      frequency: 'monthly'
    },
    {
      name: 'تقرير المخاطر المالية',
      description: 'تقييم المخاطر المالية والتوصيات',
      type: 'risk_analysis',
      frequency: 'quarterly'
    }
  ];

  const getFrequencyBadge = (frequency: string) => {
    const variants = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800'
    };

    const text = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      quarterly: 'ربع سنوي'
    };

    return (
      <Badge className={variants[frequency as keyof typeof variants]}>
        {text[frequency as keyof typeof text]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقارير المالية المتقدمة</h1>
          <p className="text-muted-foreground">تحليلات ومؤشرات أداء شاملة للنظام المالي</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">الشهر الحالي</SelectItem>
              <SelectItem value="last_month">الشهر الماضي</SelectItem>
              <SelectItem value="current_quarter">الربع الحالي</SelectItem>
              <SelectItem value="current_year">السنة الحالية</SelectItem>
              <SelectItem value="custom">فترة مخصصة</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">ملخص</SelectItem>
              <SelectItem value="detailed">مفصل</SelectItem>
              <SelectItem value="analytical">تحليلي</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات التقارير
          </Button>
          
          <Button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير جميع التقارير
          </Button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCategories.map((category) => (
          <Card 
            key={category.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md", 
              category.color,
              activeTab === category.id && "ring-2 ring-primary"
            )}
            onClick={() => setActiveTab(category.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {category.icon}
                <div>
                  <h3 className="font-medium">{category.title}</h3>
                  <p className="text-sm opacity-80">{category.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predefined Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            التقارير المحددة مسبقاً
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedReports.map((report, index) => (
              <Card key={index} className="border hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium mb-1">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    {getFrequencyBadge(report.frequency)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      عرض
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
          <TabsTrigger value="ai_analytics">التحليلات الذكية</TabsTrigger>
          <TabsTrigger value="cash_flow">التدفق النقدي</TabsTrigger>
          <TabsTrigger value="comprehensive">التقارير الشاملة</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <AdvancedKPIsDashboard />
        </TabsContent>

        <TabsContent value="ai_analytics" className="space-y-4">
          <AIFinancialAnalytics />
        </TabsContent>

        <TabsContent value="cash_flow" className="space-y-4">
          <CashFlowManagement />
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقارير المالية الشاملة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Income Statement */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">قائمة الدخل</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      تحليل شامل للإيرادات والمصروفات
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>

                {/* Balance Sheet */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <PieChart className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">الميزانية العمومية</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      عرض الأصول والخصوم وحقوق الملكية
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>

                {/* Cash Flow Statement */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">قائمة التدفق النقدي</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      تحليل التدفقات النقدية التشغيلية والاستثمارية
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>

                {/* Trial Balance */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">ميزان المراجعة</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      عرض أرصدة جميع الحسابات
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>

                {/* Cost Centers Report */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">تقرير مراكز التكلفة</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      تحليل أداء مراكز التكلفة والميزانيات
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>

                {/* Financial Ratios */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <Activity className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">النسب المالية</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      تحليل السيولة والربحية والكفاءة
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      عرض التقرير
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFinancialReports;