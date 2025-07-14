import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Percent, DollarSign, TrendingUp } from 'lucide-react';
import { pricingCalculatorService } from '@/services/newFeaturesService';

interface PricingCalculatorProps {
  vehicleCategory?: string;
  onPriceCalculated?: (price: number) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  vehicleCategory,
  onPriceCalculated
}) => {
  const [formData, setFormData] = useState({
    vehicle_category: vehicleCategory || '',
    rental_days: 1,
    start_date: '',
    customer_type: 'individual' as 'individual' | 'corporate'
  });
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicleCategory) {
      setFormData(prev => ({ ...prev, vehicle_category: vehicleCategory }));
    }
  }, [vehicleCategory]);

  const calculatePrice = async () => {
    if (!formData.vehicle_category || !formData.rental_days) return;

    setLoading(true);
    try {
      const { data, error } = await pricingCalculatorService.calculatePrice(
        formData.vehicle_category,
        formData.rental_days,
        formData.start_date,
        formData.customer_type
      );

      if (error) {
        console.error('خطأ في حساب السعر:', error);
        return;
      }

      setPricingResult(data);
      onPriceCalculated?.(data?.final_price || 0);
    } catch (error) {
      console.error('خطأ في حساب السعر:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.vehicle_category && formData.rental_days > 0) {
      calculatePrice();
    }
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          حاسبة التسعير التلقائية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicle_category" className="text-xs">فئة المركبة</Label>
            <Select
              value={formData.vehicle_category}
              onValueChange={(value) => handleInputChange('vehicle_category', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">اقتصادية</SelectItem>
                <SelectItem value="compact">مدمجة</SelectItem>
                <SelectItem value="standard">عادية</SelectItem>
                <SelectItem value="luxury">فاخرة</SelectItem>
                <SelectItem value="suv">دفع رباعي</SelectItem>
                <SelectItem value="bus">حافلة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rental_days" className="text-xs">عدد الأيام</Label>
            <Input
              id="rental_days"
              type="number"
              min="1"
              value={formData.rental_days}
              onChange={(e) => handleInputChange('rental_days', parseInt(e.target.value) || 1)}
              className="h-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date" className="text-xs">تاريخ البداية</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor="customer_type" className="text-xs">نوع العميل</Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value) => handleInputChange('customer_type', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">فرد</SelectItem>
                <SelectItem value="corporate">شركة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">جاري حساب السعر...</p>
          </div>
        )}

        {pricingResult && !loading && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">السعر الأساسي:</span>
              <span className="text-sm font-medium">د.ك {pricingResult.base_price.toFixed(3)}</span>
            </div>

            {pricingResult.discount_applied > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span className="text-xs flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  خصم مطبق:
                </span>
                <span className="text-sm font-medium">-د.ك {pricingResult.discount_applied.toFixed(3)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-semibold flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                السعر النهائي:
              </span>
              <Badge variant="default" className="text-sm">
                د.ك {pricingResult.final_price.toFixed(3)}
              </Badge>
            </div>

            {formData.rental_days > 1 && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground">
                  السعر اليومي: د.ك {(pricingResult.final_price / formData.rental_days).toFixed(3)}
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={calculatePrice}
          disabled={loading || !formData.vehicle_category}
          size="sm"
          className="w-full"
        >
          <TrendingUp className="w-3 h-3 mr-2" />
          إعادة حساب السعر
        </Button>
      </CardContent>
    </Card>
  );
};