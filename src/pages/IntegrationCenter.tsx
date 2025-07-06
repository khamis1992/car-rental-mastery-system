import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, FileText, CheckCircle, AlertCircle, TrendingUp, Users, Database, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DepartmentIntegrationService } from '@/services/BusinessServices/DepartmentIntegrationService';
import { TransactionLogService } from '@/services/BusinessServices/TransactionLogService';
import { ApprovalsService } from '@/services/BusinessServices/ApprovalsService';
import { AdvancedKPIService } from '@/services/BusinessServices/AdvancedKPIService';
import { toast } from 'sonner';

const IntegrationCenter = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const departmentIntegrationService = new DepartmentIntegrationService();
  const transactionLogService = new TransactionLogService();
  const approvalsService = new ApprovalsService();
  const kpiService = new AdvancedKPIService();

  // جلب إحصائيات التكامل
  const { data: integrationMetrics, isLoading: loadingIntegrations } = useQuery({
    queryKey: ['integration-metrics'],
    queryFn: () => departmentIntegrationService.getIntegrationMetrics()
  });

  // جلب إحصائيات المعاملات
  const { data: transactionMetrics, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transaction-metrics'],
    queryFn: () => transactionLogService.getTransactionMetrics()
  });

  // جلب إحصائيات الموافقات
  const { data: approvalMetrics, isLoading: loadingApprovals } = useQuery({
    queryKey: ['approval-metrics'],
    queryFn: () => approvalsService.getApprovalMetrics()
  });

  // جلب المؤشرات المتقدمة
  const { data: kpiMetrics, isLoading: loadingKPIs } = useQuery({
    queryKey: ['kpi-metrics'],
    queryFn: () => kpiService.getKPIMetrics()
  });

  // جلب الموافقات المعلقة
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalsService.getPendingApprovals()
  });

  // جلب المعاملات الأخيرة
  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionLogService.getAllTransactions({}, 10)
  });

  const handleCalculateKPIs = async () => {
    try {
      toast.promise(
        kpiService.calculateAllKPIs(),
        {
          loading: 'جاري حساب جميع المؤشرات...',
          success: 'تم حساب المؤشرات بنجاح',
          error: 'فشل في حساب المؤشرات'
        }
      );
    } catch (error) {
      console.error('Error calculating KPIs:', error);
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, color = "blue" }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مركز التكامل</h1>
          <p className="text-muted-foreground">
            لوحة تحكم شاملة لإدارة التكامل بين الأقسام والمؤشرات المتقدمة
          </p>
        </div>
        <Button onClick={handleCalculateKPIs} className="gap-2">
          <TrendingUp className="h-4 w-4" />
          حساب المؤشرات
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="integrations">التكاملات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="approvals">الموافقات</TabsTrigger>
          <TabsTrigger value="kpis">المؤشرات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* إحصائيات سريعة */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="التكاملات النشطة"
              value={integrationMetrics?.active || 0}
              description={`من أصل ${integrationMetrics?.total || 0} تكامل`}
              icon={Database}
              color="green"
            />
            <StatCard
              title="المعاملات اليوم"
              value={transactionMetrics?.completed || 0}
              description={`${transactionMetrics?.pending || 0} معلقة`}
              icon={Activity}
              color="blue"
            />
            <StatCard
              title="الموافقات المعلقة"
              value={approvalMetrics?.pending || 0}
              description={`${approvalMetrics?.high_priority || 0} عالية الأولوية`}
              icon={CheckCircle}
              color="orange"
            />
            <StatCard
              title="تنبيهات المؤشرات"
              value={kpiMetrics?.alerts?.total_alerts || 0}
              description={`${kpiMetrics?.alerts?.high_alerts || 0} تنبيه عالي`}
              icon={AlertCircle}
              color="red"
            />
          </div>

          {/* الموافقات المعلقة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                الموافقات المعلقة
              </CardTitle>
              <CardDescription>
                الموافقات التي تحتاج إلى إجراء فوري
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals?.slice(0, 5).map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{approval.approval_type}</h4>
                      <p className="text-sm text-muted-foreground">
                        طلب موافقة: {approval.approval_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(approval.requested_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={approval.priority === 'high' ? 'destructive' : 'secondary'}>
                        {approval.priority}
                      </Badge>
                      {approval.amount > 0 && (
                        <Badge variant="outline">
                          {approval.amount.toLocaleString()} د.ك
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!pendingApprovals || pendingApprovals.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد موافقات معلقة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* المعاملات الأخيرة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                المعاملات الأخيرة
              </CardTitle>
              <CardDescription>
                آخر العمليات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions?.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{transaction.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        النوع: {transaction.transaction_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'failed' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {transaction.status}
                      </Badge>
                      {transaction.amount > 0 && (
                        <Badge variant="outline">
                          {transaction.amount.toLocaleString()} د.ك
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!recentTransactions || recentTransactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد معاملات حديثة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>إدارة التكاملات</CardTitle>
              <CardDescription>
                عرض وإدارة تكاملات الأقسام المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  سيتم إضافة واجهة إدارة التكاملات قريباً
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
              <CardDescription>
                عرض تفصيلي لجميع المعاملات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  سيتم إضافة واجهة سجل المعاملات قريباً
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الموافقات</CardTitle>
              <CardDescription>
                عرض وإدارة جميع طلبات الموافقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  سيتم إضافة واجهة إدارة الموافقات قريباً
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis">
          <Card>
            <CardHeader>
              <CardTitle>المؤشرات المتقدمة</CardTitle>
              <CardDescription>
                مؤشرات الأداء الرئيسية والتحليلات المتقدمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <StatCard
                  title="إجمالي المؤشرات"
                  value={kpiMetrics?.total_kpis || 0}
                  description={`${kpiMetrics?.automated_kpis || 0} آلي`}
                  icon={TrendingUp}
                  color="blue"
                />
                <StatCard
                  title="فوق الهدف"
                  value={kpiMetrics?.performance?.above_target || 0}
                  description="مؤشرات متفوقة"
                  icon={TrendingUp}
                  color="green"
                />
                <StatCard
                  title="تحت الهدف"
                  value={kpiMetrics?.performance?.below_target || 0}
                  description="تحتاج تحسين"
                  icon={AlertCircle}
                  color="red"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">المؤشرات حسب الفئة</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(kpiMetrics?.categories || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline">{count} مؤشر</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationCenter;