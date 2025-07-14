import { supabase } from '@/integrations/supabase/client';

// الميزة الأولى: تنبيهات انتهاكات العملاء
export interface CustomerViolation {
  id: string;
  customer_id: string;
  violation_type: string;
  violation_date: string;
  description?: string;
  amount?: number;
  status: 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
}

export const violationAlertsService = {
  // جلب انتهاكات العميل - استخدام الجداول الموجودة مؤقتاً
  async getCustomerViolations(customerId: string) {
    try {
      // استخدام جدول additional_charges كبديل مؤقت
      const { data, error } = await supabase
        .from('additional_charges')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'pending')
        .order('charge_date', { ascending: false });

      if (error) throw error;
      
      // تحويل البيانات لتنسيق CustomerViolation
      const violations = data?.map(charge => ({
        id: charge.id,
        customer_id: charge.customer_id,
        violation_type: charge.charge_type,
        violation_date: charge.charge_date,
        description: charge.description,
        amount: charge.amount,
        status: 'active' as const,
        severity: charge.amount > 100 ? 'high' as const : 'medium' as const,
        notes: charge.notes,
        created_at: charge.created_at
      })) || [];

      return { data: violations, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // إنشاء تنبيه انتهاك جديد
  async createViolationAlert(violationData: Omit<CustomerViolation, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('customer_violations')
        .insert([{
          customer_id: violationData.customer_id,
          violation_type: violationData.violation_type,
          violation_date: violationData.violation_date,
          description: violationData.description || '',
          amount: violationData.amount || 0,
          status: violationData.status || 'active',
          severity: violationData.severity || 'medium',
          notes: violationData.notes,
          tenant_id: 'current' // سيتم ضبطه تلقائياً بواسطة RLS
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};

// الميزة الثانية: فحص توفر المركبات
export interface VehicleAvailabilityStatus {
  id: string;
  vehicle_id: string;
  is_available: boolean;
  availability_date: string;
  reason?: string;
  maintenance_scheduled_start?: string;
  maintenance_scheduled_end?: string;
  estimated_availability?: string;
  priority: 'low' | 'normal' | 'high';
}

export const vehicleAvailabilityService = {
  // فحص توفر المركبة
  async checkVehicleAvailability(vehicleId: string, startDate: string, endDate: string) {
    try {
      // فحص حالة المركبة
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate, status')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;

      // فحص العقود الحالية
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['active', 'draft'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (contractsError) throw contractsError;

      const isAvailable = !contracts?.length && vehicle.status === 'available';

      return {
        data: {
          vehicle,
          is_available: isAvailable,
          conflicts: {
            contracts: contracts || [],
            maintenance: []
          }
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // تحديث حالة توفر المركبة - استخدام جدول vehicles مؤقتاً
  async updateVehicleAvailability(vehicleId: string, availabilityData: Partial<VehicleAvailabilityStatus>) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          status: availabilityData.is_available ? 'available' : 'maintenance'
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};

// الميزة الثالثة: حاسبة التسعير الآلية
export interface PricingTemplate {
  id: string;
  template_name: string;
  vehicle_category: string;
  base_price: number;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  seasonal_multiplier: number;
  discount_rules: any[];
  surge_pricing_rules: any[];
  is_active: boolean;
}

export const pricingCalculatorService = {
  // حساب السعر التلقائي - استخدام قيم افتراضية
  async calculatePrice(vehicleCategory: string, rentalDays: number, startDate: string, customerType: 'individual' | 'corporate' = 'individual') {
    try {
      // قيم افتراضية للتسعير حسب فئة المركبة
      const defaultPricing: Record<string, PricingTemplate> = {
        economy: {
          id: '1',
          template_name: 'اقتصادية',
          vehicle_category: 'economy',
          base_price: 15,
          daily_rate: 15,
          weekly_rate: 90,
          monthly_rate: 350,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        },
        compact: {
          id: '2',
          template_name: 'مدمجة',
          vehicle_category: 'compact',
          base_price: 20,
          daily_rate: 20,
          weekly_rate: 120,
          monthly_rate: 450,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        },
        standard: {
          id: '3',
          template_name: 'عادية',
          vehicle_category: 'standard',
          base_price: 25,
          daily_rate: 25,
          weekly_rate: 150,
          monthly_rate: 550,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        },
        luxury: {
          id: '4',
          template_name: 'فاخرة',
          vehicle_category: 'luxury',
          base_price: 50,
          daily_rate: 50,
          weekly_rate: 300,
          monthly_rate: 1200,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        },
        suv: {
          id: '5',
          template_name: 'دفع رباعي',
          vehicle_category: 'suv',
          base_price: 35,
          daily_rate: 35,
          weekly_rate: 210,
          monthly_rate: 800,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        },
        bus: {
          id: '6',
          template_name: 'حافلة',
          vehicle_category: 'bus',
          base_price: 80,
          daily_rate: 80,
          weekly_rate: 500,
          monthly_rate: 2000,
          seasonal_multiplier: 1.0,
          discount_rules: [],
          surge_pricing_rules: [],
          is_active: true
        }
      };

      const template = defaultPricing[vehicleCategory] || defaultPricing.economy;

      let basePrice = template.daily_rate * rentalDays;

      // تطبيق أسعار الأسبوعية/الشهرية إذا كانت متوفرة
      if (rentalDays >= 30 && template.monthly_rate) {
        const months = Math.floor(rentalDays / 30);
        const remainingDays = rentalDays % 30;
        basePrice = (months * template.monthly_rate) + (remainingDays * template.daily_rate);
      } else if (rentalDays >= 7 && template.weekly_rate) {
        const weeks = Math.floor(rentalDays / 7);
        const remainingDays = rentalDays % 7;
        basePrice = (weeks * template.weekly_rate) + (remainingDays * template.daily_rate);
      }

      // تطبيق المضاعف الموسمي
      basePrice *= template.seasonal_multiplier;

      // خصم للشركات
      let finalPrice = basePrice;
      if (customerType === 'corporate' && rentalDays >= 7) {
        finalPrice = basePrice * 0.9; // خصم 10% للشركات
      }

      return {
        data: {
          base_price: basePrice,
          final_price: finalPrice,
          discount_applied: basePrice - finalPrice,
          template_used: template
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  shouldApplyDiscount(rule: any, rentalDays: number, customerType: string): boolean {
    if (rule.min_days && rentalDays < rule.min_days) return false;
    if (rule.customer_type && rule.customer_type !== customerType) return false;
    return true;
  },

  applyDiscount(price: number, rule: any): number {
    if (rule.type === 'percentage') {
      return price * (1 - rule.value / 100);
    } else if (rule.type === 'fixed') {
      return Math.max(0, price - rule.value);
    }
    return price;
  },

  shouldApplySurge(rule: any, startDate: string): boolean {
    const date = new Date(startDate);
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    if (rule.weekends && (dayOfWeek === 5 || dayOfWeek === 6)) return true;
    if (rule.peak_months && rule.peak_months.includes(month)) return true;
    
    return false;
  },

  applySurge(price: number, rule: any): number {
    return price * (1 + rule.multiplier);
  }
};