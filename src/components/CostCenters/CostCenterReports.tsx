import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, Download, FileText, AlertTriangle } from 'lucide-react';
import { CostCenterReport } from '@/services/BusinessServices/CostCenterService';

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

  const exportToHTML = () => {
    try {
      const element = document.getElementById('cost-center-report');
      if (!element) return;

      // إنشاء محتوى HTML للتقرير
      const reportHTML = element.innerHTML;
      
      // فتح نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      
      if (!printWindow) {
        alert('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.');
        return;
      }

      // كتابة محتوى HTML في النافذة الجديدة
      const today = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير مراكز التكلفة التفصيلي - ${today}</title>
          <style>
            /* إعدادات الطباعة */
            @media print {
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              
              body {
                margin: 0;
                padding: 0;
                font-size: 10px;
                line-height: 1.3;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-break {
                page-break-before: always;
              }
            }
            
            /* الخطوط والتنسيق العام */
            body {
              font-family: 'Cairo', 'Tahoma', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              background: white;
              color: #000;
              margin: 0;
              padding: 15px;
              line-height: 1.4;
            }
            
            /* العناوين */
            h1, h2, h3 {
              color: #1f2937;
              margin-bottom: 15px;
            }
            
            /* البطاقات */
            .space-y-6 > div {
              margin-bottom: 20px;
            }
            
            /* الجداول */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
            }
            
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 6px;
              text-align: right;
              vertical-align: top;
            }
            
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              font-size: 12px;
            }
            
            /* الإحصائيات */
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            
            .grid > div {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              background: #fafafa;
            }
            
            /* الشارات والمؤشرات */
            .progress {
              background: #e5e7eb;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
            }
            
            .progress > div {
              height: 100%;
              background: #3b82f6;
            }
            
            /* الألوان */
            .text-green-600 { color: #059669; }
            .text-red-600 { color: #dc2626; }
            .text-gray-600 { color: #4b5563; }
            .text-blue-600 { color: #2563eb; }
            .text-orange-600 { color: #ea580c; }
            
            /* أزرار التحكم */
            .print-controls {
              position: fixed;
              top: 10px;
              left: 10px;
              background: white;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            
            .print-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
              font-family: 'Tahoma', Arial, sans-serif;
            }
            
            .print-btn:hover {
              background: #2563eb;
            }
            
            /* إخفاء العناصر غير المرغوب فيها */
            [data-export-button] {
              display: none !important;
            }
            
            /* تحسين عرض العملة */
            .currency {
              font-weight: bold;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <!-- أزرار التحكم -->
          <div class="print-controls no-print">
            <button class="print-btn" onclick="window.print()">طباعة</button>
            <button class="print-btn" onclick="window.close()">إغلاق</button>
          </div>
          
          <!-- رأس التقرير -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1f2937; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin: 0;">تقرير مراكز التكلفة التفصيلي</h1>
            <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">تاريخ التقرير: ${today}</p>
          </div>
          
          <!-- محتوى التقرير -->
          <div>
            ${reportHTML}
          </div>
          
          <script>
            // طباعة تلقائية بعد تحميل المحتوى
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
            
            // إغلاق النافذة بعد الطباعة أو الإلغاء
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      
    } catch (error) {
      console.error('Error generating HTML report:', error);
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
              onClick={exportToHTML}
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