
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, ArrowRight, Loader2, Building, CreditCard, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financialReportsService } from '@/services/financialReportsService';
import { useToast } from '@/hooks/use-toast';

const BalanceSheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const loadBalanceSheet = async () => {
    try {
      setLoading(true);
      const data = await financialReportsService.generateBalanceSheet({ asOfDate });
      setBalanceData(data);
    } catch (error) {
      console.error('Error loading balance sheet:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الميزانية العمومية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceSheet();
  }, [asOfDate]);

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
          <span className="mr-2">جاري تحميل الميزانية العمومية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">الميزانية العمومية</h1>
          <p className="text-muted-foreground">عرض الأصول والخصوم وحقوق الملكية</p>
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
            تغيير التاريخ
          </Button>
          <Button onClick={exportReport} className="btn-primary rtl-flex">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {balanceData && (
        <div className="grid gap-6">
          {/* معلومات التقرير */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">معلومات التقرير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">كما في تاريخ</p>
                  <p className="font-medium">{asOfDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{new Date(balanceData.generated_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأصول */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 rtl-flex text-blue-600">
                  <Building className="w-5 h-5" />
                  الأصول
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">الأصول المتداولة</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(balanceData.assets.current_assets)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">الأصول غير المتداولة</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(balanceData.assets.non_current_assets)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border-2 border-blue-200">
                    <span className="font-bold text-lg">إجمالي الأصول</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(balanceData.assets.total_assets)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الخصوم وحقوق الملكية */}
            <div className="space-y-6">
              {/* الخصوم */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 rtl-flex text-red-600">
                    <CreditCard className="w-5 h-5" />
                    الخصوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">الخصوم المتداولة</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(balanceData.liabilities.current_liabilities)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">الخصوم غير المتداولة</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(balanceData.liabilities.non_current_liabilities)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-2 border-red-200">
                      <span className="font-bold">إجمالي الخصوم</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(balanceData.liabilities.total_liabilities)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* حقوق الملكية */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 rtl-flex text-green-600">
                    <Landmark className="w-5 h-5" />
                    حقوق الملكية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-200">
                    <span className="font-bold">إجمالي حقوق الملكية</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(balanceData.equity.total_equity)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* التوازن */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">التحقق من توازن الميزانية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                  <p className="font-bold text-blue-600 text-lg">
                    {formatCurrency(balanceData.assets.total_assets)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">=</p>
                  <p className="font-bold text-lg">متوازنة</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">الخصوم + حقوق الملكية</p>
                  <p className="font-bold text-purple-600 text-lg">
                    {formatCurrency(balanceData.total_liabilities_and_equity)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
