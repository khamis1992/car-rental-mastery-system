import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Car, 
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CostCenterService, type CostCenter, type CostCenterReport } from '@/services/BusinessServices/CostCenterService';
import { toast } from 'sonner';
import CostCenterForm from '@/components/CostCenters/CostCenterForm';
import CostCenterList from '@/components/CostCenters/CostCenterList';
import CostCenterTreeView from '@/components/CostCenters/CostCenterTreeView';
import CostCenterReports from '@/components/CostCenters/CostCenterReports';
import CostCenterAllocations from '@/components/CostCenters/CostCenterAllocations';
import CostCenterSettings from '@/components/CostCenters/CostCenterSettings';

const CostCenters = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const costCenterService = new CostCenterService();

  // جلب مراكز التكلفة
  const { data: costCenters, isLoading: loadingCostCenters, refetch: refetchCostCenters } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => costCenterService.getAllCostCenters()
  });

  // جلب تقرير مراكز التكلفة
  const { data: costCenterReport, isLoading: loadingReport } = useQuery({
    queryKey: ['cost-center-report'],
    queryFn: () => costCenterService.getCostCenterReport()
  });

  // جلب الإحصائيات
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['cost-center-metrics'],
    queryFn: () => costCenterService.getCostCenterMetrics()
  });

  const handleUpdateCosts = async () => {
    try {
      toast.promise(
        costCenterService.updateAllCostCenterCosts(),
        {
          loading: 'جاري تحديث تكاليف مراكز التكلفة...',
          success: 'تم تحديث التكاليف بنجاح',
          error: 'فشل في تحديث التكاليف'
        }
      );
    } catch (error) {
      console.error('Error updating costs:', error);
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, color = "blue", trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium rtl-title">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold rtl-title">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 rtl-flex">
          {trend && (
            trend > 0 ? 
              <TrendingUp className="h-3 w-3 text-green-600" /> : 
              <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between rtl-flex">
        <div className="flex gap-2 rtl-flex">
          <Button onClick={handleUpdateCosts} variant="outline" className="gap-2 rtl-flex">
            <TrendingUp className="h-4 w-4" />
            تحديث التكاليف
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="gap-2 rtl-flex">
            <Plus className="h-4 w-4" />
            إضافة مركز تكلفة
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold rtl-title">مراكز التكلفة</h1>
          <p className="text-muted-foreground">
            إدارة شاملة لمراكز التكلفة والميزانيات
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي مراكز التكلفة"
          value={metrics?.total_cost_centers || 0}
          description="مركز تكلفة نشط"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="إجمالي الميزانية"
          value={`${(metrics?.total_budget || 0).toLocaleString()} د.ك`}
          description="الميزانية المخصصة"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="إجمالي المصروف"
          value={`${(metrics?.total_spent || 0).toLocaleString()} د.ك`}
          description="التكلفة الفعلية"
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="تجاوز الميزانية"
          value={metrics?.over_budget_count || 0}
          description="مركز تجاوز الميزانية"
          icon={TrendingDown}
          color="red"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="allocations">توزيع التكاليف</TabsTrigger>
          <TabsTrigger value="tree">العرض الشجري</TabsTrigger>
          <TabsTrigger value="centers">إدارة المراكز</TabsTrigger>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* أداء مراكز التكلفة */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* أفضل الأداء */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 rtl-flex">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  أعلى المراكز إنفاقاً
                </CardTitle>
                <CardDescription>
                  مراكز التكلفة الأكثر استهلاكاً للميزانية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.top_spending?.slice(0, 5).map((cc: any) => (
                    <div key={cc.id} className="flex items-center justify-between p-3 border rounded-lg rtl-flex">
                      <div className="flex-1">
                        <h4 className="font-medium rtl-title">{cc.cost_center_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cc.cost_center_type}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-orange-600">
                          {cc.actual_spent.toLocaleString()} د.ك
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cc.budget_utilization_percentage.toFixed(1)}% من الميزانية
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* أسوأ الانحرافات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 rtl-flex">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  أسوأ الانحرافات
                </CardTitle>
                <CardDescription>
                  مراكز التكلفة التي تجاوزت الميزانية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.worst_variance?.slice(0, 5).map((cc: any) => (
                    <div key={cc.id} className="flex items-center justify-between p-3 border rounded-lg rtl-flex">
                      <div className="flex-1">
                        <h4 className="font-medium rtl-title">{cc.cost_center_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cc.cost_center_type}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-red-600">
                          {Math.abs(cc.variance).toLocaleString()} د.ك
                        </p>
                        <p className="text-xs text-muted-foreground">
                          تجاوز في الميزانية
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* التوزيع حسب النوع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex">
                <BarChart3 className="h-5 w-5" />
                التوزيع حسب نوع مركز التكلفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(metrics?.by_type || {}).map(([type, data]: [string, any]) => (
                  <div key={type} className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 rtl-title">{type}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm rtl-flex">
                        <span>العدد:</span>
                        <span className="font-medium">{data.count}</span>
                      </div>
                      <div className="flex justify-between text-sm rtl-flex">
                        <span>الميزانية:</span>
                        <span className="font-medium">{data.budget.toLocaleString()} د.ك</span>
                      </div>
                      <div className="flex justify-between text-sm rtl-flex">
                        <span>المصروف:</span>
                        <span className="font-medium">{data.spent.toLocaleString()} د.ك</span>
                      </div>
                      <Progress 
                        value={data.budget > 0 ? (data.spent / data.budget) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centers">
          <CostCenterList 
            costCenters={costCenters || []}
            onRefresh={refetchCostCenters}
            isLoading={loadingCostCenters}
          />
        </TabsContent>

        <TabsContent value="tree">
          <CostCenterTreeView 
            costCenters={costCenters || []}
            onRefresh={refetchCostCenters}
            isLoading={loadingCostCenters}
          />
        </TabsContent>

        <TabsContent value="allocations">
          <CostCenterAllocations />
        </TabsContent>

        <TabsContent value="reports">
          <CostCenterReports 
            report={costCenterReport || []}
            isLoading={loadingReport}
          />
        </TabsContent>

        <TabsContent value="settings">
          <CostCenterSettings />
        </TabsContent>
      </Tabs>

      {/* نموذج إضافة مركز تكلفة */}
      {showAddForm && (
        <CostCenterForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            refetchCostCenters();
          }}
        />
      )}
    </div>
  );
};

export default CostCenters;