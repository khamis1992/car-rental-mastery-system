
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, ArrowRight, Loader2, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const CashFlowStatement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadCashFlowStatement = async () => {
    try {
      setLoading(true);
      // محاكاة بيانات قائمة التدفقات النقدية
      const mockData = {
        operating_activities: {
          net_income: 25000,
          depreciation: 5000,
          accounts_receivable_change: -3000,
          accounts_payable_change: 2000,
          total: 29000
        },
        investing_activities: {
          equipment_purchases: -15000,
          asset_sales: 2000,
          total: -13000
        },
        financing_activities: {
          loan_proceeds: 10000,
          loan_payments: -5000,
          dividends_paid: -8000,
          total: -3000
        },
        net_cash_flow: 13000,
        beginning_cash: 20000,
        ending_cash: 33000,
        generated_at: new Date().toISOString()
      };
      
      setCashFlowData(mockData);
      
      toast({
        title: "معلومة",
        description: "هذه بيانات تجريبية. سيتم ربطها بالنظام المحاسبي قريباً",
        variant: "default"
      });
    } catch (error) {
      console.error('Error loading cash flow statement:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة التدفقات النقدية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlowStatement();
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
          <span className="mr-2">جاري تحميل قائمة التدفقات النقدية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">قائمة التدفقات النقدية</h1>
          <p className="text-muted-foreground">عرض حركة النقد والنقد المعادل</p>
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

      {cashFlowData && (
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
                  <p className="font-medium">{new Date(cashFlowData.generated_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأنشطة التشغيлية */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex text-blue-600">
                <Activity className="w-5 h-5" />
                التدفقات النقدية من الأنشطة التشغيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">صافي الدخل</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(cashFlowData.operating_activities.net_income)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">الاستهلاك</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(cashFlowData.operating_activities.depreciation)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">تغيير المدينين</span>
                  <span className={`font-bold ${cashFlowData.operating_activities.accounts_receivable_change < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(cashFlowData.operating_activities.accounts_receivable_change)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">تغيير الدائنين</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(cashFlowData.operating_activities.accounts_payable_change)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border-2 border-blue-200">
                  <span className="font-bold text-lg">صافي النقد من العمليات</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(cashFlowData.operating_activities.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأنشطة الاستثمارية */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex text-purple-600">
                <TrendingUp className="w-5 h-5" />
                التدفقات النقدية من الأنشطة الاستثمارية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">شراء معدات</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(cashFlowData.investing_activities.equipment_purchases)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">بيع أصول</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(cashFlowData.investing_activities.asset_sales)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border-2 border-purple-200">
                  <span className="font-bold text-lg">صافي النقد من الاستثمار</span>
                  <span className={`font-bold text-lg ${cashFlowData.investing_activities.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(cashFlowData.investing_activities.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأنشطة التمويلية */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex text-orange-600">
                <DollarSign className="w-5 h-5" />
                التدفقات النقدية من الأنشطة التمويلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">حصيلة القروض</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(cashFlowData.financing_activities.loan_proceeds)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">سداد القروض</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(cashFlowData.financing_activities.loan_payments)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">توزيعات الأرباح</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(cashFlowData.financing_activities.dividends_paid)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border-2 border-orange-200">
                  <span className="font-bold text-lg">صافي النقد من التمويل</span>
                  <span className={`font-bold text-lg ${cashFlowData.financing_activities.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(cashFlowData.financing_activities.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملخص التدفقات النقدية */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">ملخص التدفقات النقدية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">النقد في بداية الفترة</span>
                  <span className="font-bold">
                    {formatCurrency(cashFlowData.beginning_cash)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">صافي التغير في النقد</span>
                  <span className={`font-bold ${cashFlowData.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlowData.net_cash_flow)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-200">
                  <span className="font-bold text-xl">النقد في نهاية الفترة</span>
                  <span className="font-bold text-xl text-green-600">
                    {formatCurrency(cashFlowData.ending_cash)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CashFlowStatement;
