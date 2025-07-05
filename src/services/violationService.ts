import { supabase } from '@/integrations/supabase/client';
import { TrafficViolation, ViolationType, ViolationPayment, ViolationWithDetails, ViolationStats, ViolationReportData } from '@/types/violation';

export const violationService = {
  // خدمات أنواع المخالفات
  async getViolationTypes(): Promise<ViolationType[]> {
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('violation_name_ar', { ascending: true });

    if (error) throw error;
    return (data || []) as ViolationType[];
  },

  async createViolationType(violationType: Partial<ViolationType>): Promise<ViolationType> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('violation_types')
      .insert([{
        violation_code: violationType.violation_code!,
        violation_name_ar: violationType.violation_name_ar!,
        violation_name_en: violationType.violation_name_en,
        description: violationType.description,
        base_fine_amount: violationType.base_fine_amount!,
        points: violationType.points || 0,
        category: violationType.category!,
        severity_level: violationType.severity_level!,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ViolationType;
  },

  async updateViolationType(id: string, updates: Partial<ViolationType>): Promise<ViolationType> {
    const { data, error } = await supabase
      .from('violation_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ViolationType;
  },

  // خدمات المخالفات المرورية
  async getViolations(): Promise<ViolationWithDetails[]> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .select(`
        *,
        violation_types (
          id,
          violation_code,
          violation_name_ar,
          violation_name_en,
          base_fine_amount,
          points,
          category,
          severity_level,
          is_active,
          created_at,
          updated_at
        ),
        customers (
          name,
          phone,
          customer_number
        ),
        vehicles (
          license_plate,
          make,
          model,
          vehicle_number
        ),
        contracts (
          contract_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationWithDetails[];
  },

  async getViolationById(id: string): Promise<ViolationWithDetails | null> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .select(`
        *,
        violation_types (*),
        customers (*),
        vehicles (*),
        contracts (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ViolationWithDetails;
  },

  async createViolation(violation: Partial<TrafficViolation>): Promise<TrafficViolation> {
    try {
      const { data: violationNumber } = await supabase.rpc('generate_violation_number');
      
      // الحصول على معلومات المستخدم بشكل آمن
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('traffic_violations')
        .insert([{
          violation_number: violationNumber,
          violation_type_id: violation.violation_type_id!,
          violation_date: violation.violation_date!,
          location: violation.location,
          description: violation.description,
          vehicle_id: violation.vehicle_id!,
          contract_id: violation.contract_id,
          customer_id: violation.customer_id!,
          official_violation_number: violation.official_violation_number,
          issuing_authority: violation.issuing_authority,
          officer_name: violation.officer_name,
          fine_amount: violation.fine_amount!,
          processing_fee: violation.processing_fee || 0,
          total_amount: violation.total_amount!,
          notes: violation.notes,
          created_by: user?.id
        }])
        .select(`
          *,
          customers!inner (name),
          violation_types!inner (violation_name_ar)
        `)
        .single();

      if (error) throw error;

      // إنشاء قيد محاسبي للمديونية
      try {
        await supabase.rpc('create_violation_receivable_entry', {
          violation_id: data.id,
          violation_amount: data.total_amount,
          violation_date: data.violation_date,
          violation_number: data.violation_number,
          customer_name: data.customers?.name || 'غير محدد'
        });
      } catch (accountingError) {
        console.warn('Failed to create accounting entry for violation:', accountingError);
        // لا نفشل العملية بأكملها إذا فشل القيد المحاسبي
      }

      return data as TrafficViolation;
    } catch (error) {
      console.error('Error creating violation:', error);
      throw new Error('فشل في إنشاء المخالفة المرورية. يرجى المحاولة مرة أخرى.');
    }
  },

  async updateViolation(id: string, updates: Partial<TrafficViolation>): Promise<TrafficViolation> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrafficViolation;
  },

  async determineViolationLiability(
    id: string, 
    liability: 'customer' | 'company' | 'shared',
    percentage: number,
    reason?: string
  ): Promise<TrafficViolation> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('traffic_violations')
      .update({
        liability_determination: liability,
        liability_percentage: percentage,
        liability_reason: reason,
        liability_determined_by: user?.id,
        liability_determined_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrafficViolation;
  },

  // خدمات دفعات المخالفات
  async getViolationPayments(violationId: string): Promise<ViolationPayment[]> {
    const { data, error } = await supabase
      .from('violation_payments')
      .select('*')
      .eq('violation_id', violationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationPayment[];
  },

  async createViolationPayment(payment: Partial<ViolationPayment>): Promise<ViolationPayment> {
    try {
      // الحصول على معلومات المستخدم بشكل آمن
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!payment.violation_id) {
        throw new Error('معرف المخالفة مطلوب');
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new Error('مبلغ الدفعة يجب أن يكون أكبر من الصفر');
      }

      // إنشاء الدفعة بحالة مكتملة افتراضياً
      const { data, error } = await supabase
        .from('violation_payments')
        .insert([{
          violation_id: payment.violation_id,
          amount: payment.amount,
          payment_date: payment.payment_date!,
          payment_method: payment.payment_method!,
          transaction_reference: payment.transaction_reference,
          bank_name: payment.bank_name,
          check_number: payment.check_number,
          notes: payment.notes,
          status: 'completed', // تعيين الحالة كمكتملة افتراضياً
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error creating payment:', error);
        throw new Error('فشل في حفظ الدفعة في قاعدة البيانات');
      }

      return data as ViolationPayment;
    } catch (error) {
      console.error('Error creating violation payment:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('فشل في تسجيل دفعة المخالفة. يرجى المحاولة مرة أخرى.');
    }
  },

  // إحصائيات المخالفات
  async getViolationStats(): Promise<ViolationStats> {
    const { data: violations, error } = await supabase
      .from('traffic_violations')
      .select('status, payment_status, total_amount, paid_amount, liability_determination');

    if (error) throw error;

    const stats: ViolationStats = {
      total_violations: violations?.length || 0,
      pending_violations: violations?.filter(v => v.status === 'pending').length || 0,
      paid_violations: violations?.filter(v => v.payment_status === 'paid').length || 0,
      disputed_violations: violations?.filter(v => v.status === 'disputed').length || 0,
      total_fines_amount: violations?.reduce((sum, v) => sum + (v.total_amount || 0), 0) || 0,
      total_paid_amount: violations?.reduce((sum, v) => sum + (v.paid_amount || 0), 0) || 0,
      total_outstanding_amount: violations?.reduce((sum, v) => sum + ((v.total_amount || 0) - (v.paid_amount || 0)), 0) || 0,
      customer_liability_violations: violations?.filter(v => v.liability_determination === 'customer').length || 0,
      company_liability_violations: violations?.filter(v => v.liability_determination === 'company').length || 0
    };

    return stats;
  },

  // البحث عن المخالفات
  async searchViolations(filters: {
    status?: string;
    payment_status?: string;
    liability_determination?: string;
    vehicle_id?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ViolationWithDetails[]> {
    let query = supabase
      .from('traffic_violations')
      .select(`
        *,
        violation_types (
          id,
          violation_code,
          violation_name_ar,
          violation_name_en,
          base_fine_amount,
          points,
          category,
          severity_level,
          is_active,
          created_at,
          updated_at
        ),
        customers (
          name,
          phone,
          customer_number
        ),
        vehicles (
          license_plate,
          make,
          model,
          vehicle_number
        ),
        contracts (
          contract_number
        )
      `);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
    if (filters.liability_determination) query = query.eq('liability_determination', filters.liability_determination);
    if (filters.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
    if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
    if (filters.date_from) query = query.gte('violation_date', filters.date_from);
    if (filters.date_to) query = query.lte('violation_date', filters.date_to);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationWithDetails[];
  },

  // تحديث حالة الإشعار
  async markAsNotified(id: string): Promise<TrafficViolation> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .update({
        status: 'notified',
        customer_notified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrafficViolation;
  },

  // خدمات التقارير
  async generateViolationReport(filters: {
    date_from?: string;
    date_to?: string;
    status?: string;
    liability_determination?: string;
    customer_id?: string;
    vehicle_id?: string;
    violation_type_id?: string;
  }): Promise<ViolationReportData> {
    // استعلام أساسي للمخالفات
    let query = supabase
      .from('traffic_violations')
      .select(`
        *,
        violation_types (
          violation_name_ar,
          category,
          severity_level
        ),
        customers (
          name
        )
      `);

    // تطبيق الفلاتر
    if (filters.date_from) query = query.gte('violation_date', filters.date_from);
    if (filters.date_to) query = query.lte('violation_date', filters.date_to);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.liability_determination) query = query.eq('liability_determination', filters.liability_determination);
    if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
    if (filters.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
    if (filters.violation_type_id) query = query.eq('violation_type_id', filters.violation_type_id);

    const { data: violations, error } = await query;

    if (error) throw error;

    const violationsData = violations || [];

    // حساب الإحصائيات
    const totalViolations = violationsData.length;
    const totalAmount = violationsData.reduce((sum, v) => sum + (v.total_amount || 0), 0);
    const paidAmount = violationsData.reduce((sum, v) => sum + (v.paid_amount || 0), 0);
    const outstandingAmount = totalAmount - paidAmount;

    // تجميع حسب الحالة
    const statusAgg = violationsData.reduce((acc: any, v) => {
      const status = v.status || 'غير محدد';
      if (!acc[status]) {
        acc[status] = { status, count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += v.total_amount || 0;
      return acc;
    }, {});
    const violationsByStatus = Object.values(statusAgg) as Array<{
      status: string;
      count: number;
      amount: number;
    }>;

    // تجميع حسب نوع المخالفة
    const typeAgg = violationsData.reduce((acc: any, v) => {
      const typeName = v.violation_types?.violation_name_ar || 'غير محدد';
      if (!acc[typeName]) {
        acc[typeName] = { type_name: typeName, count: 0, amount: 0 };
      }
      acc[typeName].count++;
      acc[typeName].amount += v.total_amount || 0;
      return acc;
    }, {});
    const violationsByType = Object.values(typeAgg) as Array<{
      type_name: string;
      count: number;
      amount: number;
    }>;

    // تجميع حسب المسؤولية
    const liabilityAgg = violationsData.reduce((acc: any, v) => {
      const liability = v.liability_determination || 'معلقة';
      const liabilityLabel = liability === 'customer' ? 'العميل' : 
                            liability === 'company' ? 'الشركة' : 
                            liability === 'shared' ? 'مشتركة' : 'معلقة';
      if (!acc[liability]) {
        acc[liability] = { liability: liabilityLabel, count: 0, amount: 0 };
      }
      acc[liability].count++;
      acc[liability].amount += v.total_amount || 0;
      return acc;
    }, {});
    const violationsByLiability = Object.values(liabilityAgg) as Array<{
      liability: string;
      count: number;
      amount: number;
    }>;

    // الاتجاه الشهري (آخر 6 أشهر)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      const monthData = violationsData.filter(v => 
        v.violation_date && v.violation_date.startsWith(monthKey)
      );
      
      monthlyTrend.push({
        month: monthName,
        count: monthData.length,
        amount: monthData.reduce((sum, v) => sum + (v.total_amount || 0), 0)
      });
    }

    return {
      total_violations: totalViolations,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      violations_by_status: violationsByStatus,
      violations_by_type: violationsByType,
      violations_by_liability: violationsByLiability,
      monthly_trend: monthlyTrend
    };
  }
};