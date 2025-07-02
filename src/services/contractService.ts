import { supabase } from '@/integrations/supabase/client';

export interface ContractWithDetails {
  id: string;
  contract_number: string;
  customer_name: string;
  customer_phone: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  rental_days: number;
  contract_type: string;
  daily_rate: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  security_deposit: number;
  insurance_amount: number;
  final_amount: number;
  status: string;
  pickup_location?: string;
  return_location?: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  notes?: string;
  created_at: string;
  customer_id: string;
  vehicle_id: string;
  quotation_id?: string;
}

export const contractService = {
  async getContractsWithDetails(): Promise<ContractWithDetails[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        contracts.id,
        contracts.contract_number,
        contracts.customer_id,
        contracts.vehicle_id,
        contracts.quotation_id,
        contracts.start_date,
        contracts.end_date,
        contracts.actual_start_date,
        contracts.actual_end_date,
        contracts.rental_days,
        contracts.contract_type,
        contracts.daily_rate,
        contracts.total_amount,
        contracts.discount_amount,
        contracts.tax_amount,
        contracts.security_deposit,
        contracts.insurance_amount,
        contracts.final_amount,
        contracts.status,
        contracts.pickup_location,
        contracts.return_location,
        contracts.special_conditions,
        contracts.terms_and_conditions,
        contracts.notes,
        contracts.created_at,
        customers!inner(name, phone),
        vehicles!inner(make, model, vehicle_number)
      `)
      .order('contracts.created_at', { ascending: false });

    if (error) throw error;

    return data.map((contract: any) => ({
      id: contract.id,
      contract_number: contract.contract_number,
      customer_name: contract.customers.name,
      customer_phone: contract.customers.phone,
      vehicle_info: `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}`,
      start_date: contract.start_date,
      end_date: contract.end_date,
      actual_start_date: contract.actual_start_date,
      actual_end_date: contract.actual_end_date,
      rental_days: contract.rental_days,
      contract_type: contract.contract_type,
      daily_rate: contract.daily_rate,
      total_amount: contract.total_amount,
      discount_amount: contract.discount_amount || 0,
      tax_amount: contract.tax_amount || 0,
      security_deposit: contract.security_deposit || 0,
      insurance_amount: contract.insurance_amount || 0,
      final_amount: contract.final_amount,
      status: contract.status,
      pickup_location: contract.pickup_location,
      return_location: contract.return_location,
      special_conditions: contract.special_conditions,
      terms_and_conditions: contract.terms_and_conditions,
      notes: contract.notes,
      created_at: contract.created_at,
      customer_id: contract.customer_id,
      vehicle_id: contract.vehicle_id,
      quotation_id: contract.quotation_id,
    }));
  },

  async getContractById(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        customer_id,
        vehicle_id,
        quotation_id,
        start_date,
        end_date,
        actual_start_date,
        actual_end_date,
        rental_days,
        contract_type,
        daily_rate,
        total_amount,
        discount_amount,
        tax_amount,
        security_deposit,
        insurance_amount,
        final_amount,
        status,
        pickup_location,
        return_location,
        pickup_mileage,
        return_mileage,
        fuel_level_pickup,
        fuel_level_return,
        pickup_photos,
        return_photos,
        pickup_condition_notes,
        return_condition_notes,
        special_conditions,
        terms_and_conditions,
        notes,
        customer_signature,
        company_signature,
        customer_signed_at,
        company_signed_at,
        sales_person_id,
        created_by,
        created_at,
        updated_at,
        customers(name, phone, email, address, national_id),
        vehicles(make, model, year, license_plate, vehicle_number, color),
        quotations(quotation_number)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async activateContract(id: string, actualStartDate: string, pickupMileage?: number) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ 
        status: 'active',
        actual_start_date: actualStartDate,
        pickup_mileage: pickupMileage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  async completeContract(id: string, actualEndDate: string, returnMileage?: number, fuelLevelReturn?: string) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ 
        status: 'completed',
        actual_end_date: actualEndDate,
        return_mileage: returnMileage,
        fuel_level_return: fuelLevelReturn,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  async updateContractStatus(id: string, status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('contracts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  async getContractStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    const { data: activeCount, error: activeError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { data: endingToday, error: endingError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('end_date', new Date().toISOString().split('T')[0])
      .eq('status', 'active');

    // Calculate this month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyRevenue, error: revenueError } = await supabase
      .from('contracts')
      .select('final_amount')
      .gte('created_at', startOfMonth.toISOString())
      .in('status', ['active', 'completed']);

    if (totalError || activeError || endingError || revenueError) {
      throw totalError || activeError || endingError || revenueError;
    }

    const totalRevenue = monthlyRevenue?.reduce((sum, contract) => sum + (contract.final_amount || 0), 0) || 0;

    return {
      total: totalCount?.length || 0,
      active: activeCount?.length || 0,
      endingToday: endingToday?.length || 0,
      monthlyRevenue: totalRevenue,
    };
  },

  async getRecentContracts(limit: number = 5) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        contracts.id,
        contracts.contract_number,
        contracts.final_amount,
        contracts.status,
        contracts.created_at,
        customers(name),
        vehicles(make, model, vehicle_number)
      `)
      .order('contracts.created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((contract: any) => ({
      id: contract.id,
      contract_number: contract.contract_number,
      customer_name: contract.customers?.name,
      vehicle_info: contract.vehicles ? `${contract.vehicles.make} ${contract.vehicles.model}` : '',
      final_amount: contract.final_amount,
      status: contract.status,
      created_at: contract.created_at,
    }));
  },
};