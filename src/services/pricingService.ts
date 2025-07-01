import { supabase } from '@/integrations/supabase/client';

export interface CustomerDiscountInfo {
  id: string;
  name: string;
  rating: number;
  total_contracts: number;
  discount_percentage: number;
  discount_reason: string;
}

export interface PricingCalculation {
  baseAmount: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  additionalFees: number;
  finalAmount: number;
  dailyRate: number;
  rentalDays: number;
}

export const pricingService = {
  // حساب خصم العميل المميز
  calculateCustomerDiscount(customer: CustomerDiscountInfo): { percentage: number; reason: string } {
    let discountPercentage = 0;
    let reason = '';

    // خصم للعملاء بناءً على التقييم
    if (customer.rating >= 5) {
      discountPercentage += 10;
      reason += 'عميل ممتاز (تقييم 5 نجوم): 10%';
    } else if (customer.rating >= 4) {
      discountPercentage += 5;
      reason += 'عميل جيد (تقييم 4+ نجوم): 5%';
    }

    // خصم للعملاء المتكررين
    if (customer.total_contracts >= 10) {
      discountPercentage += 15;
      reason += reason ? ' + عميل دائم (10+ عقود): 15%' : 'عميل دائم (10+ عقود): 15%';
    } else if (customer.total_contracts >= 5) {
      discountPercentage += 10;
      reason += reason ? ' + عميل متكرر (5+ عقود): 10%' : 'عميل متكرر (5+ عقود): 10%';
    } else if (customer.total_contracts >= 2) {
      discountPercentage += 5;
      reason += reason ? ' + عميل سابق: 5%' : 'عميل سابق: 5%';
    }

    // الحد الأقصى للخصم 25%
    discountPercentage = Math.min(discountPercentage, 25);

    return {
      percentage: discountPercentage,
      reason: reason || 'لا يوجد خصم متاح'
    };
  },

  // حساب السعر بناءً على نوع الإيجار
  calculateRateByType(
    dailyRate: number, 
    weeklyRate: number | null, 
    monthlyRate: number | null, 
    rentalDays: number
  ): { rate: number; type: string; savings: number } {
    const dailyTotal = dailyRate * rentalDays;
    
    // إذا كان أسبوع أو أكثر وهناك سعر أسبوعي
    if (rentalDays >= 7 && weeklyRate) {
      const weeks = Math.floor(rentalDays / 7);
      const extraDays = rentalDays % 7;
      const weeklyTotal = (weeks * weeklyRate) + (extraDays * dailyRate);
      
      if (weeklyTotal < dailyTotal) {
        return {
          rate: weeklyTotal / rentalDays,
          type: 'أسبوعي',
          savings: dailyTotal - weeklyTotal
        };
      }
    }

    // إذا كان شهر أو أكثر وهناك سعر شهري
    if (rentalDays >= 30 && monthlyRate) {
      const months = Math.floor(rentalDays / 30);
      const extraDays = rentalDays % 30;
      const monthlyTotal = (months * monthlyRate) + (extraDays * dailyRate);
      
      if (monthlyTotal < dailyTotal) {
        return {
          rate: monthlyTotal / rentalDays,
          type: 'شهري',
          savings: dailyTotal - monthlyTotal
        };
      }
    }

    return {
      rate: dailyRate,
      type: 'يومي',
      savings: 0
    };
  },

  // حساب الضرائب والرسوم
  calculateTaxesAndFees(baseAmount: number): { taxAmount: number; additionalFees: number; breakdown: any[] } {
    const breakdown = [];
    let taxAmount = 0;
    let additionalFees = 0;

    // ضريبة القيمة المضافة (حسب قوانين الكويت)
    const vatRate = 0.05; // 5%
    const vatAmount = baseAmount * vatRate;
    taxAmount += vatAmount;
    breakdown.push({
      name: 'ضريبة القيمة المضافة',
      rate: '5%',
      amount: vatAmount
    });

    // رسوم التأمين الإجبارية (2% من قيمة العقد)
    const insuranceFee = baseAmount * 0.02;
    additionalFees += insuranceFee;
    breakdown.push({
      name: 'رسوم التأمين الإجبارية',
      rate: '2%',
      amount: insuranceFee
    });

    // رسوم الخدمة (1.5% من قيمة العقد)
    const serviceFee = baseAmount * 0.015;
    additionalFees += serviceFee;
    breakdown.push({
      name: 'رسوم الخدمة',
      rate: '1.5%',
      amount: serviceFee
    });

    return {
      taxAmount,
      additionalFees,
      breakdown
    };
  },

  // حساب شامل للأسعار
  calculateFullPricing(
    dailyRate: number,
    weeklyRate: number | null,
    monthlyRate: number | null,
    rentalDays: number,
    customer: CustomerDiscountInfo,
    customDiscountAmount: number = 0
  ): PricingCalculation & { 
    rateInfo: any; 
    discountInfo: any; 
    taxBreakdown: any[]; 
    summary: string[] 
  } {
    // 1. حساب أفضل سعر حسب نوع الإيجار
    const rateInfo = this.calculateRateByType(dailyRate, weeklyRate, monthlyRate, rentalDays);
    const effectiveDailyRate = rateInfo.rate;
    const baseAmount = effectiveDailyRate * rentalDays;

    // 2. حساب خصم العميل المميز
    const customerDiscountInfo = this.calculateCustomerDiscount(customer);
    const customerDiscountAmount = (baseAmount * customerDiscountInfo.percentage) / 100;

    // 3. إجمالي الخصم
    const totalDiscountAmount = customerDiscountAmount + customDiscountAmount;
    const discountPercentage = (totalDiscountAmount / baseAmount) * 100;

    // 4. المبلغ بعد الخصم
    const amountAfterDiscount = baseAmount - totalDiscountAmount;

    // 5. حساب الضرائب والرسوم
    const { taxAmount, additionalFees, breakdown: taxBreakdown } = this.calculateTaxesAndFees(amountAfterDiscount);

    // 6. المبلغ النهائي
    const finalAmount = amountAfterDiscount + taxAmount + additionalFees;

    // 7. ملخص التوفير والمعلومات
    const summary = [];
    if (rateInfo.savings > 0) {
      summary.push(`توفير ${rateInfo.savings.toFixed(3)} د.ك باستخدام السعر ${rateInfo.type}`);
    }
    if (customerDiscountInfo.percentage > 0) {
      summary.push(`خصم العميل المميز: ${customerDiscountInfo.percentage}% (${customerDiscountAmount.toFixed(3)} د.ك)`);
    }
    if (customDiscountAmount > 0) {
      summary.push(`خصم إضافي: ${customDiscountAmount.toFixed(3)} د.ك`);
    }

    return {
      baseAmount,
      discountAmount: totalDiscountAmount,
      discountPercentage,
      taxAmount,
      taxPercentage: (taxAmount / amountAfterDiscount) * 100,
      additionalFees,
      finalAmount,
      dailyRate: effectiveDailyRate,
      rentalDays,
      rateInfo,
      discountInfo: {
        customer: customerDiscountInfo,
        customerAmount: customerDiscountAmount,
        customAmount: customDiscountAmount,
        total: totalDiscountAmount
      },
      taxBreakdown,
      summary
    };
  },

  // الحصول على معلومات العميل للخصومات
  async getCustomerDiscountInfo(customerId: string): Promise<CustomerDiscountInfo> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, rating, total_contracts')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    return {
      ...data,
      discount_percentage: 0,
      discount_reason: ''
    };
  }
};