
import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  FileText,
  Download,
  Calendar,
  PieChart,
  DollarSign,
  Calculator
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FinancialReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reportTypes = [
    {
      title: "قائمة الدخل",
      description: "الإيرادات والمصاريف للفترة المحددة",
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      lastGenerated: "2024-01-20",
      status: "محدث"
    },
    {
      title: "قائمة المركز المالي",
      description: "الأصول والخصوم وحقوق الملكية",
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      lastGenerated: "2024-01-20",
      status: "محدث"
    },
    {
      title: "قائمة التدفقات النقدية",
      description: "حركة النقدية خلال الفترة",
      icon: <DollarSign className="w-6 h-6 text-purple-500" />,
      lastGenerated: "2024-01-19",
      status: "يحتاج تحديث"
    },
    {
      title: "تقرير الأرباح والخسائر",
      description: "تحليل مفصل للربحية",
      icon: <PieChart className="w-6 h-6 text-orange-500" />,
      lastGenerated: "2024-01-20",
      status: "محدث"
    }
  ];

  const quickStats = [
    {
      title: "إجمالي الإيرادات",
      value: "45,000 د.ك",
      change: "+12.5%",
      period: "هذا الشهر"
    },
    {
      title: "إجمالي المصاريف", 
      value: "28,500 د.ك",
      change: "+8.2%",
      period: "هذا الشهر"
    },
    {
      title: "صافي الربح",
      value: "16,500 د.ك",
      change: "+18.7%",
      period: "هذا الشهر"
    },
    {
      title: "هامش الربح",
      value: "36.7%",
      change: "+2.1%",
      period: "مقارنة بالشهر السابق"
    }
  ];

  const incomeStatementData = [
    { category: "الإيرادات", items: [
      { name: "إيرادات الإيجار", amount: "40,000.000" },
      { name: "إيرادات أخرى", amount: "5,000.000" },
      { name: "إجمالي الإيرادات", amount: "45,000.000", isTotal: true }
    ]},
    { category: "المصاريف", items: [
      { name: "مصاريف الصيانة", amount: "12,000.000" },
      { name: "مصاريف الوقود", amount: "8,500.000" },
      { name: "رواتب الموظفين", amount: "6,000.000" },
      { name: "مصاريف إدارية", amount: "2,000.000" },
      { name: "إجمالي المصاريف", amount: "28,500.000", isTotal: true }
    ]},
    { category: "النتيجة", items: [
      { name: "صافي الربح", amount: "16,500.000", isProfit: true }
    ]}
  ];

  const balanceSheetData = [
    { category: "الأصول المتداولة", items: [
      { name: "النقدية في البنك", amount: "250,000.000" },
      { name: "النقدية في الصندوق", amount: "15,000.000" },
      { name: "العملاء والذمم المدينة", amount: "85,000.000" },
      { name: "إجمالي الأصول المتداولة", amount: "350,000.000", isTotal: true }
    ]},
    { category: "الأصول الثابتة", items: [
      { name: "أسطول السيارات", amount: "500,000.000" },
      { name: "معدات مكتبية", amount: "25,000.000" },
      { name: "إجمالي الأصول الثابتة", amount: "525,000.000", isTotal: true }
    ]},
    { category: "إجمالي الأصول", items: [
      { name: "إجمالي الأصول", amount: "875,000.000", isGrandTotal: true }
    ]}
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">التقارير المالية</h1>
            <p className="text-muted-foreground">عرض وتحليل التقارير المالية الأساسية</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button className="btn-primary rtl-flex">
              <FileText className="w-4 h-4" />
              إنشاء تقرير
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Calendar className="w-4 h-4" />
              اختر الفترة
            </Button>
          </div>
        </div>

        {/* Quick Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{stat.period}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        آخر تحديث: {report.lastGenerated}
                      </div>
                      <Badge 
                        variant={report.status === 'محدث' ? 'default' : 'secondary'}
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4 flex-row-reverse">
                      <Button size="sm" className="rtl-flex">
                        <FileText className="w-3 h-3" />
                        عرض
                      </Button>
                      <Button variant="outline" size="sm" className="rtl-flex">
                        <Download className="w-3 h-3" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="income-statement" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
            <TabsTrigger value="balance-sheet">قائمة المركز المالي</TabsTrigger>
            <TabsTrigger value="cash-flow">التدفقات النقدية</TabsTrigger>
          </TabsList>

          <TabsContent value="income-statement" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
                  <Calculator className="w-5 h-5" />
                  قائمة الدخل - يناير 2024
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {incomeStatementData.map((section, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-lg mb-3 text-primary">
                        {section.category}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex} 
                            className={`flex justify-between items-center py-2 px-4 rounded ${
                              item.isTotal ? 'bg-muted font-semibold border-t' :
                              item.isProfit ? 'bg-green-50 text-green-700 font-bold text-lg' :
                              'hover:bg-muted/50'
                            }`}
                          >
                            <span>{item.name}</span>
                            <span className="font-mono">
                              {item.amount} د.ك
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
                  <BarChart3 className="w-5 h-5" />
                  قائمة المركز المالي - يناير 2024
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {balanceSheetData.map((section, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-lg mb-3 text-primary">
                        {section.category}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <div 
                            key={itemIndex} 
                            className={`flex justify-between items-center py-2 px-4 rounded ${
                              item.isGrandTotal ? 'bg-primary text-primary-foreground font-bold text-lg' :
                              item.isTotal ? 'bg-muted font-semibold border-t' :
                              'hover:bg-muted/50'
                            }`}
                          >
                            <span>{item.name}</span>
                            <span className="font-mono">
                              {item.amount} د.ك
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash-flow" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">قائمة التدفقات النقدية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">قيد التطوير</h3>
                  <p className="text-muted-foreground">
                    تقرير التدفقات النقدية سيكون متاحاً قريباً
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FinancialReports;
