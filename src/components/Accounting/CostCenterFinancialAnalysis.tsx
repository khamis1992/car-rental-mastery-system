import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { CostCenterService, CostCenter } from '@/services/BusinessServices/CostCenterService';
import { formatCurrencyKWD } from '@/lib/currency';

interface CostCenterFinancialAnalysisProps {
  costCenterId: string;
}

export const CostCenterFinancialAnalysis: React.FC<CostCenterFinancialAnalysisProps> = ({ costCenterId }) => {
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const costCenterService = new CostCenterService();

  useEffect(() => {
    loadCostCenterData();
  }, [costCenterId]);

  const loadCostCenterData = async () => {
    try {
      setLoading(true);
      const [costCenterData, allocationData] = await Promise.all([
        costCenterService.getCostCenterById(costCenterId),
        costCenterService.getAllocationsByCostCenter(costCenterId)
      ]);
      
      setCostCenter(costCenterData);
      setAllocations(allocationData);
    } catch (error) {
      console.error('Error loading cost center data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل البيانات...</div>;
  }

  if (!costCenter) {
    return <div className="text-center py-8 text-muted-foreground">لم يتم العثور على مركز التكلفة</div>;
  }

  const utilization = costCenter.budget_amount > 0 ? (costCenter.actual_spent / costCenter.budget_amount) * 100 : 0;
  const variance = costCenter.budget_amount - costCenter.actual_spent;
  const isOverBudget = costCenter.actual_spent > costCenter.budget_amount;

  return (
    <div className="space-y-6">
      {/* ملخص مركز التكلفة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg rtl-title">{costCenter.cost_center_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{costCenter.cost_center_code}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">الميزانية:</span>
                <span className="font-medium">{formatCurrencyKWD(costCenter.budget_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">المصروف:</span>
                <span className="font-medium">{formatCurrencyKWD(costCenter.actual_spent)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs">نسبة الاستخدام</span>
                  <span className="text-xs font-medium">{utilization.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(utilization, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 rtl-flex">
              {variance >= 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              الانحراف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyKWD(Math.abs(variance))}
              </div>
              <div className="text-sm text-muted-foreground">
                {variance >= 0 ? 'توفير في الميزانية' : 'تجاوز للميزانية'}
              </div>
              <Badge variant={variance >= 0 ? 'default' : 'destructive'} className="mt-2">
                {variance >= 0 ? 'ضمن الميزانية' : 'تجاوز الميزانية'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg rtl-title">الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">حالة الميزانية:</span>
                <Badge variant={isOverBudget ? 'destructive' : 'default'}>
                  {isOverBudget ? 'تجاوز' : 'جيد'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الاتجاه:</span>
                <div className="flex items-center gap-1">
                  {variance >= 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {variance >= 0 ? 'توفير' : 'إنفاق زائد'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* توزيعات التكلفة */}
      {allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">توزيعات التكلفة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="rtl-title">نوع المرجع</TableHead>
                  <TableHead className="rtl-title">المبلغ</TableHead>
                  <TableHead className="rtl-title">النسبة</TableHead>
                  <TableHead className="rtl-title">التاريخ</TableHead>
                  <TableHead className="rtl-title">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {allocation.reference_type === 'contract' ? 'عقد' : 
                         allocation.reference_type === 'employee' ? 'موظف' : 
                         allocation.reference_type === 'vehicle' ? 'مركبة' : 
                         allocation.reference_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrencyKWD(allocation.allocation_amount)}
                    </TableCell>
                    <TableCell>
                      {allocation.allocation_percentage}%
                    </TableCell>
                    <TableCell>
                      {new Date(allocation.allocation_date).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {allocation.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface AllCostCentersOverviewProps {
  costCenters: CostCenter[];
}

export const AllCostCentersOverview: React.FC<AllCostCentersOverviewProps> = ({ costCenters }) => {
  const totalBudget = costCenters.reduce((sum, cc) => sum + cc.budget_amount, 0);
  const totalSpent = costCenters.reduce((sum, cc) => sum + cc.actual_spent, 0);
  const overBudgetCount = costCenters.filter(cc => cc.actual_spent > cc.budget_amount).length;
  
  // تجميع حسب النوع
  const byType: Record<string, { count: number; budget: number; spent: number }> = {};
  costCenters.forEach(cc => {
    if (!byType[cc.cost_center_type]) {
      byType[cc.cost_center_type] = { count: 0, budget: 0, spent: 0 };
    }
    byType[cc.cost_center_type].count++;
    byType[cc.cost_center_type].budget += cc.budget_amount;
    byType[cc.cost_center_type].spent += cc.actual_spent;
  });

  const getCostCenterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      operational: 'تشغيلي',
      administrative: 'إداري',
      revenue: 'إيرادات',
      support: 'دعم'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{costCenters.length}</div>
              <div className="text-sm text-muted-foreground">مركز تكلفة</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrencyKWD(totalBudget)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الميزانية</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrencyKWD(totalSpent)}</div>
              <div className="text-sm text-muted-foreground">إجمالي المصروف</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overBudgetCount}</div>
              <div className="text-sm text-muted-foreground">تجاوز الميزانية</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحليل حسب النوع */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">تحليل حسب نوع مركز التكلفة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(byType).map(([type, data]) => {
              const utilization = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
              return (
                <Card key={type} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg rtl-title">
                      {getCostCenterTypeLabel(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">عدد المراكز:</span>
                        <Badge variant="outline">{data.count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">الميزانية:</span>
                        <span className="font-medium">{formatCurrencyKWD(data.budget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">المصروف:</span>
                        <span className="font-medium">{formatCurrencyKWD(data.spent)}</span>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">نسبة الاستخدام</span>
                          <span className="text-xs font-medium">{utilization.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(utilization, 100)} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};