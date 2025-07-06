import { BaseRepository } from '../base/BaseRepository';
import { IVehicleInsuranceRepository, VehicleInsurance } from '../interfaces/IVehicleInsuranceRepository';
import { supabase } from '@/integrations/supabase/client';

export class VehicleInsuranceRepository extends BaseRepository<VehicleInsurance> implements IVehicleInsuranceRepository {
  protected tableName = 'vehicle_insurance';

  async getByVehicleId(vehicleId: string): Promise<VehicleInsurance[]> {
    const { data, error } = await supabase
      .from('vehicle_insurance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VehicleInsurance[];
  }

  async getActiveByVehicleId(vehicleId: string): Promise<VehicleInsurance[]> {
    const { data, error } = await supabase
      .from('vehicle_insurance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VehicleInsurance[];
  }

  async getExpiringInsurance(days: number = 30): Promise<VehicleInsurance[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const { data, error } = await supabase
      .from('vehicle_insurance')
      .select(`
        *,
        vehicles:vehicle_id (
          vehicle_number,
          make,
          model
        )
      `)
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', expiryDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return (data || []) as VehicleInsurance[];
  }

  async deactivateInsurance(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_insurance')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async activateInsurance(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_insurance')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}