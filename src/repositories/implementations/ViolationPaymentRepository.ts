import { BaseRepository } from '../base/BaseRepository';
import { IViolationPaymentRepository } from '../interfaces/IViolationPaymentRepository';
import { ViolationPayment } from '@/types/violation';
import { supabase } from '@/integrations/supabase/client';

export class ViolationPaymentRepository extends BaseRepository<ViolationPayment> implements IViolationPaymentRepository {
  protected tableName = 'violation_payments';

  async getByViolationId(violationId: string): Promise<ViolationPayment[]> {
    const { data, error } = await supabase
      .from('violation_payments')
      .select('*')
      .eq('violation_id', violationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationPayment[];
  }

  async getByStatus(status: string): Promise<ViolationPayment[]> {
    const { data, error } = await supabase
      .from('violation_payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationPayment[];
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ViolationPayment[]> {
    const { data, error } = await supabase
      .from('violation_payments')
      .select('*')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationPayment[];
  }
}