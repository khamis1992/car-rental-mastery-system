import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, Download, FileText, AlertTriangle } from 'lucide-react';
import { CostCenterReport } from '@/services/BusinessServices/CostCenterService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CostCenterReportsProps {
  report: CostCenterReport[];
  isLoading: boolean;
}

const CostCenterReports = ({ report, isLoading }: CostCenterReportsProps) => {

  const getCostCenterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      operational: 'تشغيلي',
      administrative: 'إداري',
      revenue: 'إيرادات',
      support: 'دعم'
    };
    return types[type] || type;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // حساب الإحصائيات العامة
  const totalBudget = report.reduce((sum, item) => sum + item.budget_amount, 0);
  const totalSpent = report.reduce((sum, item) => sum + item.actual_spent, 0);
  const totalVariance = totalBudget - totalSpent;
  const overBudgetCount = report.filter(item => item.actual_spent > item.budget_amount).length;

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('cost-center-report');
      if (!element) return;

      // إخفاء زر التصدير مؤقتاً
      const exportButton = document.querySelector('[data-export-button]') as HTMLElement;
      if (exportButton) {
        exportButton.style.display = 'none';
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // إظهار زر التصدير مرة أخرى
      if (exportButton) {
        exportButton.style.display = '';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 20;

      // إضافة العنوان
      pdf.setFontSize(16);
      pdf.text('تقرير مراكز التكلفة التفصيلي', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // حفظ الملف
      const today = new Date().toISOString().split('T')[0];
      pdf.save(`تقرير-مراكز-التكلفة-${today}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    }
  };

  return (
    <div id="cost-center-report" className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">إجمالي الميزانية</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold rtl-title">
              {totalBudget.toLocaleString()} د.ك
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">إجمالي المصروف</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold rtl-title">
              {totalSpent.toLocaleString()} د.ك
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">الانحراف الإجمالي</CardTitle>
            <TrendingDown className={`h-4 w-4 ${getVarianceColor(totalVariance)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold rtl-title ${getVarianceColor(totalVariance)}`}>
              {Math.abs(totalVariance).toLocaleString()} د.ك
            </div>
            <p className="text-xs text-muted-foreground">
              {totalVariance > 0 ? 'توفير' : 'تجاوز'} في الميزانية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">تجاوز الميزانية</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 rtl-title">
              {overBudgetCount}
            </div>
            <p className="text-xs text-muted-foreground">
              مركز تكلفة تجاوز الميزانية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تقرير تفصيلي */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between rtl-flex">
            <CardTitle className="flex items-center gap-2 rtl-flex">
              <FileText className="h-5 w-5" />
              تقرير مراكز التكلفة التفصيلي
            </CardTitle>
            <Button 
              variant="outline" 
              className="gap-2 rtl-flex"
              onClick={exportToPDF}
              data-export-button
            >
              <Download className="h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="table-header-horizontal">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاستخدام</TableHead>
                  <TableHead className="text-right">الانحراف</TableHead>
                  <TableHead className="text-right">المصروف</TableHead>
                  <TableHead className="text-right">الميزانية</TableHead>
                  <TableHead className="text-right">العقود</TableHead>
                  <TableHead className="text-right">الموظفين</TableHead>
                  <TableHead className="text-right">المدير</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">مركز التكلفة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      جاري تحميل التقرير...
                    </TableCell>
                  </TableRow>
                ) : report.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات للعرض
                    </TableCell>
                  </TableRow>
                ) : (
                  report.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(item.budget_utilization_percentage, 100)}
                            className="h-2"
                          />
                          <div className="text-xs text-center">
                            <span className={
                              item.budget_utilization_percentage > 100 ? 'text-red-600 font-medium' : ''
                            }>
                            {item.budget_utilization_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getVarianceColor(item.variance)}`}>
                          {Math.abs(item.variance).toLocaleString()} د.ك
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.variance > 0 ? 'توفير' : 'تجاوز'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.actual_spent.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.budget_amount.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {item.contract_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {item.employee_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.manager_name || '-'}
                      </TableCell>
                      <TableCell>
                        {item.department_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getCostCenterTypeLabel(item.cost_center_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium rtl-title">
                            {item.cost_center_name}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {item.cost_center_code}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            المستوى {item.level}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCenterReports;