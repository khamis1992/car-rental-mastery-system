import { BaseRepository } from '../base/BaseRepository';
import { IViolationRepository } from '../interfaces/IViolationRepository';
import { TrafficViolation, ViolationWithDetails } from '@/types/violation';
import { supabase } from '@/integrations/supabase/client';

export class ViolationRepository extends BaseRepository<TrafficViolation> implements IViolationRepository {
  protected tableName = 'traffic_violations';

  async getViolationsWithDetails(): Promise<ViolationWithDetails[]> {
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
  }

  async getByCustomerId(customerId: string): Promise<ViolationWithDetails[]> {
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
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationWithDetails[];
  }

  async getByVehicleId(vehicleId: string): Promise<ViolationWithDetails[]> {
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
        contracts (
          contract_number
        )
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationWithDetails[];
  }

  async getByStatus(status: string): Promise<ViolationWithDetails[]> {
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
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ViolationWithDetails[];
  }

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
    return (data || []) as ViolationWithDetails[];
  }
}