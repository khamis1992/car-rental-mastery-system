import { supabase } from '@/integrations/supabase/client';
import { TrafficViolation, ViolationType, ViolationPayment, ViolationWithDetails, ViolationStats } from '@/types/violation';

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
    const { data, error } = await supabase
      .from('violation_types')
      .insert([{
        ...violationType,
        created_by: (await supabase.auth.getUser()).data.user?.id
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
          violation_code,
          violation_name_ar,
          category,
          severity_level
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
    const { data: violationNumber } = await supabase.rpc('generate_violation_number');
    
    const { data, error } = await supabase
      .from('traffic_violations')
      .insert([{
        ...violation,
        violation_number: violationNumber,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateViolation(id: string, updates: Partial<TrafficViolation>): Promise<TrafficViolation> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async determineViolationLiability(
    id: string, 
    liability: 'customer' | 'company' | 'shared',
    percentage: number,
    reason?: string
  ): Promise<TrafficViolation> {
    const { data, error } = await supabase
      .from('traffic_violations')
      .update({
        liability_determination: liability,
        liability_percentage: percentage,
        liability_reason: reason,
        liability_determined_by: (await supabase.auth.getUser()).data.user?.id,
        liability_determined_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // خدمات دفعات المخالفات
  async getViolationPayments(violationId: string): Promise<ViolationPayment[]> {
    const { data, error } = await supabase
      .from('violation_payments')
      .select('*')
      .eq('violation_id', violationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createViolationPayment(payment: Partial<ViolationPayment>): Promise<ViolationPayment> {
    const { data: paymentNumber } = await supabase.rpc('generate_violation_payment_number');
    
    const { data, error } = await supabase
      .from('violation_payments')
      .insert([{
        ...payment,
        payment_number: paymentNumber,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
          violation_code,
          violation_name_ar,
          category,
          severity_level
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
    return data || [];
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
    return data;
  }
};