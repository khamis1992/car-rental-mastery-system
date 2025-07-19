import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  Settings,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { useState } from "react";

interface ForecastData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  predicted_revenue: number;
  predicted_expenses: number;
  predicted_profit: number;
  confidence: number;
}

interface ScenarioAnalysis {
  scenario: string;
  probability: number;
  revenue_impact: number;
  profit_impact: number;
  recommendations: string[];
}

export const FinancialForecasting = () => {
  const [forecastPeriod, setForecastPeriod] = useState("6");
  const [includeSeasonality, setIncludeSeasonality] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState([85]);
  const [selectedScenario, setSelectedScenario] = useState("base");

  // بيانات وهمية للتوقعات المالية
  const forecastData: ForecastData[] = [
    {
      month: "يناير",
      revenue: 45000,
      expenses: 28000,
      profit: 17000,
      predicted_revenue: 48000,
      predicted_expenses: 26000,
      predicted_profit: 22000,
      confidence: 89
    },
    {
      month: "فبراير", 
      revenue: 42000,
      expenses: 29000,
      profit: 13000,
      predicted_revenue: 50000,
      predicted_expenses: 27000,
      predicted_profit: 23000,
      confidence: 87
    },
    {
      month: "مارس",
      revenue: 52000,
      expenses: 31000,
      profit: 21000,
      predicted_revenue: 55000,
      predicted_expenses: 28000,
      predicted_profit: 27000,
      confidence: 91
    },
    {
      month: "أبريل",
      revenue: 0,
      expenses: 0,
      profit: 0,
      predicted_revenue: 58000,
      predicted_expenses: 29000,
      predicted_profit: 29000,
      confidence: 85
    },
    {
      month: "مايو",
      revenue: 0,
      expenses: 0, 
      profit: 0,
      predicted_revenue: 61000,
      predicted_expenses: 30000,
      predicted_profit: 31000,
      confidence: 82
    },
    {
      month: "يونيو",
      revenue: 0,
      expenses: 0,
      profit: 0,
      predicted_revenue: 65000,
      predicted_expenses: 31000,
      predicted_profit: 34000,
      confidence: 79
    }
  ];

  const scenarioAnalysis: ScenarioAnalysis[] = [
    {
      scenario: "متحفظ",
      probability: 30,
      revenue_impact: -15,
      profit_impact: -25,
      recommendations: [
        "تقليل المصروفات التشغيلية بنسبة 10%",
        "تأجيل الاستثمارات غير الأساسية",
        "زيادة التركيز على العملاء المربحين"
      ]
    },
    {
      scenario: "أساسي",
      probability: 50,
      revenue_impact: 0,
      profit_impact: 0,
      recommendations: [
        "الاستمرار في الاستراتيجية الحالية",
        "مراقبة مؤشرات الأداء بانتظام",
        "التحضير لسيناريوهات بديلة"
      ]
    },
    {
      scenario: "متفائل",
      probability: 20,
      revenue_impact: 25,
      profit_impact: 40,
      recommendations: [
        "زيادة الاستثمار في التوسع",
        "توظيف المزيد من الموظفين",
        "شراء مركبات إضافية"
      ]
    }
  ];

  const kpiData = [
    { name: "معدل النمو الشهري", value: 8, target: 10, unit: "%" },
    { name: "هامش الربح", value: 35, target: 40, unit: "%" },
    { name: "معدل استخدام الأسطول", value: 75, target: 85, unit: "%" },
    { name: "متوسط الإيراد لكل مركبة", value: 1200, target: 1500, unit: "د.ك" }
  ];

  const pieData = [
    { name: "إيرادات السيارات", value: 65, color: "#8884d8" },
    { name: "إيرادات الحافلات", value: 25, color: "#82ca9d" },
    { name: "خدمات إضافية", value: 10, color: "#ffc658" }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات التنبؤ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>فترة التنبؤ</Label>
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 أشهر</SelectItem>
                  <SelectItem value="6">6 أشهر</SelectItem>
                  <SelectItem value="12">12 شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مستوى الثقة: {confidenceLevel[0]}%</Label>
              <Slider
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
                max={95}
                min={70}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="seasonality"
                checked={includeSeasonality}
                onCheckedChange={setIncludeSeasonality}
              />
              <Label htmlFor="seasonality">تضمين الموسمية</Label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">التنبؤات المالية</TabsTrigger>
          <TabsTrigger value="scenarios">تحليل السيناريوهات</TabsTrigger>
          <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
          <TabsTrigger value="breakdown">التفصيل</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          {/* Revenue & Profit Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                توقعات الإيرادات والأرباح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} د.ك`, '']}
                      labelFormatter={(label) => `الشهر: ${label}`}
                    />
                    
                    {/* Actual Data */}
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="الإيرادات الفعلية"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="الأرباح الفعلية"
                      connectNulls={false}
                    />
                    
                    {/* Predicted Data */}
                    <Line 
                      type="monotone" 
                      dataKey="predicted_revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="الإيرادات المتوقعة"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_profit" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="الأرباح المتوقعة"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Confidence Intervals */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">مؤشرات الثقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecastData.slice(3).map((data, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{data.month}</span>
                      <Badge variant={data.confidence > 85 ? "default" : "secondary"}>
                        {data.confidence}% ثقة
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>إيرادات متوقعة:</span>
                        <span className="font-medium">{data.predicted_revenue.toLocaleString()} د.ك</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أرباح متوقعة:</span>
                        <span className="font-medium">{data.predicted_profit.toLocaleString()} د.ك</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scenarioAnalysis.map((scenario, index) => (
              <Card key={index} className={selectedScenario === scenario.scenario.toLowerCase() ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="rtl-title flex items-center justify-between">
                    <span>السيناريو {scenario.scenario}</span>
                    <Badge variant="outline">{scenario.probability}% احتمال</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">تأثير الإيرادات</p>
                      <p className={`font-bold ${scenario.revenue_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scenario.revenue_impact > 0 ? '+' : ''}{scenario.revenue_impact}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تأثير الأرباح</p>
                      <p className={`font-bold ${scenario.profit_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scenario.profit_impact > 0 ? '+' : ''}{scenario.profit_impact}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">التوصيات:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {scenario.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    variant={selectedScenario === scenario.scenario.toLowerCase() ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedScenario(scenario.scenario.toLowerCase())}
                  >
                    {selectedScenario === scenario.scenario.toLowerCase() ? 'مُحدد' : 'اختيار'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpiData.map((kpi, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="rtl-title text-base">{kpi.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {kpi.value}{kpi.unit}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">الهدف</p>
                        <p className="font-medium">{kpi.target}{kpi.unit}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التقدم نحو الهدف</span>
                        <span>{Math.round((kpi.value / kpi.target) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {kpi.value >= kpi.target ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={kpi.value >= kpi.target ? "text-green-600" : "text-orange-600"}>
                        {kpi.value >= kpi.target ? "تم تحقيق الهدف" : `يحتاج ${kpi.target - kpi.value}${kpi.unit} للوصول للهدف`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  تفصيل الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مقارنة شهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData.slice(0, 3)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} د.ك`, '']}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" name="الإيرادات" />
                      <Bar dataKey="expenses" fill="#82ca9d" name="المصروفات" />
                      <Bar dataKey="profit" fill="#ffc658" name="الأرباح" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};