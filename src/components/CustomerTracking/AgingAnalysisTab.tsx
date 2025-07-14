import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Calculator, Download, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { CustomerAgingAnalysis, AgingAnalysisFormData } from '@/types/customerTracking';
import { customerTrackingService } from '@/services/customerTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgingAnalysisTabProps {
  onRefresh?: () => void;
}

export const AgingAnalysisTab = ({ onRefresh }: AgingAnalysisTabProps) => {
  const [analyses, setAnalyses] = useState<CustomerAgingAnalysis[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AgingAnalysisFormData>({
    analysis_date: new Date().toISOString().split('T')[0],
    customer_ids: undefined,
    include_zero_balances: false,
    group_by_customer_type: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
    loadAnalyses();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_type')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('خطأ في تحميل العملاء:', error);
    }
  };

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = await customerTrackingService.getCustomerAgingAnalysis();
      setAnalyses(data);
    } catch (error) {
      console.error('خطأ في تحميل تحليل أعمار الديون:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تحليل أعمار الديون',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setLoading(true);
      const newAnalyses = await customerTrackingService.generateAgingAnalysis(formData);
      
      toast({
        title: 'تم بنجاح',
        description: `تم إنشاء تحليل أعمار الديون لـ ${newAnalyses.length} عميل`,
      });

      setIsDialogOpen(false);
      setFormData({
        analysis_date: new Date().toISOString().split('T')[0],
        customer_ids: undefined,
        include_zero_balances: false,
        group_by_customer_type: false
      });
      
      await loadAnalyses();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('خطأ في إنشاء تحليل أعمار الديون:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء تحليل أعمار الديون',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getRiskLevel = (analysis: CustomerAgingAnalysis) => {
    const overdue = analysis.days_30_60 + analysis.days_61_90 + analysis.days_91_120 + analysis.over_120_days;
    const total = analysis.total_outstanding;
    
    if (total === 0) return { level: 'safe', color: 'text-green-600', label: 'آمن' };
    
    const overduePercentage = (overdue / total) * 100;
    
    if (analysis.over_120_days > 0) return { level: 'critical', color: 'text-red-600', label: 'حرج' };
    if (overduePercentage > 50) return { level: 'high', color: 'text-orange-600', label: 'عالي' };
    if (overduePercentage > 25) return { level: 'medium', color: 'text-yellow-600', label: 'متوسط' };
    return { level: 'low', color: 'text-blue-600', label: 'منخفض' };
  };

  const getProgressPercentage = (amount: number, total: number) => {
    return total > 0 ? (amount / total) * 100 : 0;
  };

  const exportToCSV = () => {
    if (analyses.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد بيانات للتصدير',
        variant: 'destructive',
      });
      return;
    }

    const csvHeaders = [
      'العميل', 'تاريخ التحليل', 'المبلغ الحالي', '30-60 يوم', '61-90 يوم', 
      '91-120 يوم', 'أكثر من 120 يوم', 'إجمالي المستحقات', 'مستوى المخاطر'
    ];
    
    const csvData = analyses.map(analysis => [
      (analysis as any).customers?.name || 'غير محدد',
      new Date(analysis.analysis_date).toLocaleDateString('ar-KW'),
      analysis.current_amount.toFixed(3),
      analysis.days_30_60.toFixed(3),
      analysis.days_61_90.toFixed(3),
      analysis.days_91_120.toFixed(3),
      analysis.over_120_days.toFixed(3),
      analysis.total_outstanding.toFixed(3),
      getRiskLevel(analysis).label
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aging_analysis_${formData.analysis_date}.csv`;
    link.click();
  };

  const totalOutstanding = analyses.reduce((sum, analysis) => sum + analysis.total_outstanding, 0);
  const totalCurrent = analyses.reduce((sum, analysis) => sum + analysis.current_amount, 0);
  const totalOverdue = analyses.reduce((sum, analysis) => 
    sum + analysis.days_30_60 + analysis.days_61_90 + analysis.days_91_120 + analysis.over_120_days, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ملخص إجمالي */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحقات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalOutstanding)}</div>
            <Progress value={100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ الحالية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(totalCurrent)}</div>
            <Progress 
              value={getProgressPercentage(totalCurrent, totalOutstanding)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المتأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatAmount(totalOverdue)}</div>
            <Progress 
              value={getProgressPercentage(totalOverdue, totalOutstanding)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة التأخير</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOutstanding > 0 ? ((totalOverdue / totalOutstanding) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">من إجمالي المستحقات</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-center rtl-flex">
            <CardTitle className="rtl-title">تحليل أعمار الديون</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={analyses.length === 0}>
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Calculator className="w-4 h-4 ml-2" />
                    تحليل جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إنشاء تحليل أعمار ديون جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="analysis_date">تاريخ التحليل</Label>
                      <Input
                        id="analysis_date"
                        type="date"
                        value={formData.analysis_date}
                        onChange={(e) => setFormData({...formData, analysis_date: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 rtl-flex">
                        <Checkbox
                          id="include_zero_balances"
                          checked={formData.include_zero_balances}
                          onCheckedChange={(checked) => setFormData({...formData, include_zero_balances: !!checked})}
                        />
                        <Label htmlFor="include_zero_balances">تضمين العملاء بدون أرصدة</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl-flex">
                        <Checkbox
                          id="group_by_customer_type"
                          checked={formData.group_by_customer_type}
                          onCheckedChange={(checked) => setFormData({...formData, group_by_customer_type: !!checked})}
                        />
                        <Label htmlFor="group_by_customer_type">تجميع حسب نوع العميل</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={generateAnalysis} disabled={loading}>
                        {loading ? 'جاري الإنشاء...' : 'إنشاء التحليل'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && analyses.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>جاري تحميل تحليل أعمار الديون...</p>
            </div>
          ) : analyses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">تاريخ التحليل</TableHead>
                    <TableHead className="text-right">حالي (0-30)</TableHead>
                    <TableHead className="text-right">30-60 يوم</TableHead>
                    <TableHead className="text-right">61-90 يوم</TableHead>
                    <TableHead className="text-right">91-120 يوم</TableHead>
                    <TableHead className="text-right">+120 يوم</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">المخاطر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => {
                    const risk = getRiskLevel(analysis);
                    return (
                      <TableRow key={analysis.id}>
                        <TableCell className="text-right font-medium">
                          {(analysis as any).customers?.name || 'غير محدد'}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(analysis.analysis_date).toLocaleDateString('ar-KW')}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatAmount(analysis.current_amount)}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {formatAmount(analysis.days_30_60)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatAmount(analysis.days_61_90)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatAmount(analysis.days_91_120)}
                        </TableCell>
                        <TableCell className="text-right text-red-700 font-bold">
                          {formatAmount(analysis.over_120_days)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatAmount(analysis.total_outstanding)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={risk.level === 'critical' ? 'destructive' : 'secondary'}>
                            <span className={risk.color}>{risk.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا يوجد تحليل أعمار ديون</h3>
                <p className="text-sm">ابدأ بإنشاء أول تحليل أعمار الديون</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};