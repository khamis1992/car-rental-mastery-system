import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Save, 
  Download,
  BarChart3,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { financialComparisonService, VarianceData } from '@/services/financialComparisonService';

interface DateRange {
  from?: Date;
  to?: Date;
}

const FinancialComparison = () => {
  const [comparisonName, setComparisonName] = useState('');
  const [basePeriod, setBasePeriod] = useState<DateRange>({});
  const [comparisonPeriod, setComparisonPeriod] = useState<DateRange>({});
  const [varianceData, setVarianceData] = useState<VarianceData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCalculateVariance = async () => {
    if (!basePeriod.from || !basePeriod.to || !comparisonPeriod.from || !comparisonPeriod.to) {
      toast.error('يرجى تحديد الفترات المطلوبة للمقارنة');
      return;
    }

    setIsCalculating(true);
    try {
      const result = await financialComparisonService.calculateFinancialVariance(
        basePeriod.from.toISOString().split('T')[0],
        basePeriod.to.toISOString().split('T')[0],
        comparisonPeriod.from.toISOString().split('T')[0],
        comparisonPeriod.to.toISOString().split('T')[0]
      );
      
      setVarianceData(result);
      toast.success('تم حساب التباين المالي بنجاح');
    } catch (error) {
      console.error('Error calculating variance:', error);
      toast.error('حدث خطأ في حساب التباين المالي');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveComparison = async () => {
    if (!comparisonName.trim()) {
      toast.error('يرجى إدخال اسم المقارنة');
      return;
    }

    if (!basePeriod.from || !basePeriod.to || !comparisonPeriod.from || !comparisonPeriod.to) {
      toast.error('يرجى تحديد الفترات المطلوبة');
      return;
    }

    setIsSaving(true);
    try {
      await financialComparisonService.saveFinancialComparison(
        comparisonName,
        basePeriod.from.toISOString().split('T')[0],
        basePeriod.to.toISOString().split('T')[0],
        comparisonPeriod.from.toISOString().split('T')[0],
        comparisonPeriod.to.toISOString().split('T')[0]
      );
      
      toast.success('تم حفظ المقارنة المالية بنجاح');
      setComparisonName('');
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast.error('حدث خطأ في حفظ المقارنة');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const calculatePercentageChange = (baseValue: number, comparisonValue: number) => {
    if (baseValue === 0) return 0;
    return ((comparisonValue - baseValue) / Math.abs(baseValue)) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-title">
            <BarChart3 className="w-5 h-5" />
            المقارنة والتباين المالي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">اسم المقارنة</Label>
              <Input
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
                placeholder="أدخل اسم المقارنة"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="rtl-label">نوع المقارنة</Label>
              <Select defaultValue="period_comparison">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="period_comparison">مقارنة فترات</SelectItem>
                  <SelectItem value="year_over_year">سنة بسنة</SelectItem>
                  <SelectItem value="quarter_comparison">مقارنة أرباع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 rtl-title">الفترة الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs rtl-label">من تاريخ</Label>
                  <Input
                    type="date"
                    value={basePeriod.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setBasePeriod(prev => ({ ...prev, from: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs rtl-label">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={basePeriod.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setBasePeriod(prev => ({ ...prev, to: new Date(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 rtl-title">فترة المقارنة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs rtl-label">من تاريخ</Label>
                  <Input
                    type="date"
                    value={comparisonPeriod.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setComparisonPeriod(prev => ({ ...prev, from: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs rtl-label">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={comparisonPeriod.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setComparisonPeriod(prev => ({ ...prev, to: new Date(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button 
              onClick={handleCalculateVariance}
              disabled={isCalculating}
              className="rtl-flex"
            >
              <Calculator className="w-4 h-4" />
              {isCalculating ? 'جاري الحساب...' : 'حساب التباين'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleSaveComparison}
              disabled={isSaving || !varianceData}
              className="rtl-flex"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ المقارنة'}
            </Button>
            <Button 
              variant="outline"
              disabled={!varianceData}
              className="rtl-flex"
            >
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variance Results */}
      {varianceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 rtl-title">
              <FileText className="w-5 h-5" />
              نتائج التباين المالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue Variance */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-700 rtl-title">الإيرادات</h4>
                    {getVarianceIcon(varianceData.variance.revenue)}
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xs text-muted-foreground">
                      الفترة الأساسية: {formatCurrency(varianceData.base_period.data.revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      فترة المقارنة: {formatCurrency(varianceData.comparison_period.data.revenue)}
                    </div>
                    <div className={`text-sm font-medium ${getVarianceColor(varianceData.variance.revenue)}`}>
                      التباين: {formatCurrency(varianceData.variance.revenue)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getVarianceColor(varianceData.variance.revenue)}
                    >
                      {calculatePercentageChange(
                        varianceData.base_period.data.revenue,
                        varianceData.comparison_period.data.revenue
                      ).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Variance */}
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-red-700 rtl-title">المصروفات</h4>
                    {getVarianceIcon(varianceData.variance.expenses)}
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xs text-muted-foreground">
                      الفترة الأساسية: {formatCurrency(varianceData.base_period.data.expenses)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      فترة المقارنة: {formatCurrency(varianceData.comparison_period.data.expenses)}
                    </div>
                    <div className={`text-sm font-medium ${getVarianceColor(varianceData.variance.expenses)}`}>
                      التباين: {formatCurrency(varianceData.variance.expenses)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getVarianceColor(varianceData.variance.expenses)}
                    >
                      {calculatePercentageChange(
                        varianceData.base_period.data.expenses,
                        varianceData.comparison_period.data.expenses
                      ).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Assets Variance */}
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-green-700 rtl-title">الأصول</h4>
                    {getVarianceIcon(varianceData.variance.assets)}
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xs text-muted-foreground">
                      الفترة الأساسية: {formatCurrency(varianceData.base_period.data.assets)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      فترة المقارنة: {formatCurrency(varianceData.comparison_period.data.assets)}
                    </div>
                    <div className={`text-sm font-medium ${getVarianceColor(varianceData.variance.assets)}`}>
                      التباين: {formatCurrency(varianceData.variance.assets)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getVarianceColor(varianceData.variance.assets)}
                    >
                      {calculatePercentageChange(
                        varianceData.base_period.data.assets,
                        varianceData.comparison_period.data.assets
                      ).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities Variance */}
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-purple-700 rtl-title">الخصوم</h4>
                    {getVarianceIcon(varianceData.variance.liabilities)}
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="text-xs text-muted-foreground">
                      الفترة الأساسية: {formatCurrency(varianceData.base_period.data.liabilities)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      فترة المقارنة: {formatCurrency(varianceData.comparison_period.data.liabilities)}
                    </div>
                    <div className={`text-sm font-medium ${getVarianceColor(varianceData.variance.liabilities)}`}>
                      التباين: {formatCurrency(varianceData.variance.liabilities)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getVarianceColor(varianceData.variance.liabilities)}
                    >
                      {calculatePercentageChange(
                        varianceData.base_period.data.liabilities,
                        varianceData.comparison_period.data.liabilities
                      ).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialComparison;