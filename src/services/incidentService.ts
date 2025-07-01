import { supabase } from '@/integrations/supabase/client';

export interface IncidentStats {
  total: number;
  pending: number;
  resolved: number;
  thisMonth: number;
}

export interface ViolationStats {
  total: number;
  unpaid: number;
  paid: number;
  thisMonth: number;
}

export const incidentService = {
  async getIncidentStats(): Promise<IncidentStats> {
    const { data: total, error: totalError } = await supabase
      .from('contract_incidents')
      .select('*', { count: 'exact', head: true });

    const { data: pending, error: pendingError } = await supabase
      .from('contract_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: resolved, error: resolvedError } = await supabase
      .from('contract_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    // This month's incidents
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: thisMonth, error: monthError } = await supabase
      .from('contract_incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (totalError || pendingError || resolvedError || monthError) {
      throw totalError || pendingError || resolvedError || monthError;
    }

    return {
      total: total?.length || 0,
      pending: pending?.length || 0,
      resolved: resolved?.length || 0,
      thisMonth: thisMonth?.length || 0,
    };
  },

  async getViolationStats(): Promise<ViolationStats> {
    const { data: total, error: totalError } = await supabase
      .from('traffic_violations')
      .select('*', { count: 'exact', head: true });

    const { data: unpaid, error: unpaidError } = await supabase
      .from('traffic_violations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'unpaid');

    const { data: paid, error: paidError } = await supabase
      .from('traffic_violations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'paid');

    // This month's violations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: thisMonth, error: monthError } = await supabase
      .from('traffic_violations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (totalError || unpaidError || paidError || monthError) {
      throw totalError || unpaidError || paidError || monthError;
    }

    return {
      total: total?.length || 0,
      unpaid: unpaid?.length || 0,
      paid: paid?.length || 0,
      thisMonth: thisMonth?.length || 0,
    };
  },
};