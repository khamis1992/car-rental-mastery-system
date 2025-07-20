
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, ArrowRight, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financialReportsService } from '@/services/financialReportsService';
import { useToast } from '@/hooks/use-toast';

const IncomeStatement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadIncomeStatement = async () => {
    try {
      setLoading(true);
      const data = await financialReportsService.generateIncomeStatement(dateRange);
      setIncomeData(data);
    } catch (error) {
      console.error('Error loading income statement:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الدخل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomeStatement();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const exportReport = () => {
    toast({
      title: "تصدير التقرير",
      description: "سيتم إضافة وظيفة التصدير قريباً"
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="mr-2">جاري تحميل قائمة الدخل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">قائمة الدخل</h1>
          <p className="text-muted-foreground">عرض الإيرادات والمصروفات وصافي الدخل</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            onClick={() => navigate('/financial-reports')}
            className="rtl-flex"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للتقارير
          </Button>
          <Button variant="outline" className="rtl-flex">
            <Calendar className="w-4 h-4" />
            تغيير الفترة
          </Button>
          <Button onClick={exportReport} className="btn-primary rtl-flex">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {incomeData && (
        <div className="grid gap-6">
          {/* معلومات الفترة */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">معلومات التقرير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">من تاريخ</p>
                  <p className="font-medium">{dateRange.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إلى تاريخ</p>
                  <p className="font-medium">{dateRange.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{new Date(incomeData.generated_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الإيرادات */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex text-green-600">
                <TrendingUp className="w-5 h-5" />
                الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">الإيرادات التشغيلية</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(incomeData.revenue.operating_revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">الإيرادات الأخرى</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(incomeData.revenue.other_revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-200">
                  <span className="font-bold text-lg">إجمالي الإيرادات</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(incomeData.revenue.total_revenue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المصروفات */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex text-red-600">
                <TrendingDown className="w-5 h-5" />
                المصروفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">المصروفات التشغيلية</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(incomeData.expenses.operating_expense)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">المصروفات الأخرى</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(incomeData.expenses.other_expense)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-2 border-red-200">
                  <span className="font-bold text-lg">إجمالي المصروفات</span>
                  <span className="font-bold text-lg text-red-600">
                    {formatCurrency(incomeData.expenses.total_expense)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* صافي الدخل */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">النتيجة النهائية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                incomeData.net_income >= 0 
                  ? 'bg-green-100 border-green-200 text-green-800' 
                  : 'bg-red-100 border-red-200 text-red-800'
              }`}>
                <span className="font-bold text-xl">صافي الدخل</span>
                <span className="font-bold text-2xl">
                  {formatCurrency(incomeData.net_income)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IncomeStatement;
