import { supabase } from '@/integrations/supabase/client';

export interface DailyReportData {
  date: string;
  totalRevenue: number;
  newContracts: number;
  completedContracts: number;
  activeContracts: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  newIncidents: number;
  newViolations: number;
  occupancyRate: number;
  averageDailyRate: number;
}

export const dailyReportService = {
  async getDailyReport(date?: string): Promise<DailyReportData> {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = `${reportDate}T00:00:00.000Z`;
    const endOfDay = `${reportDate}T23:59:59.999Z`;

    // New contracts today
    const { data: newContracts, error: newContractsError } = await supabase
      .from('contracts')
      .select('final_amount, daily_rate')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    // Completed contracts today
    const { data: completedContracts, error: completedError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('actual_end_date', reportDate)
      .lte('actual_end_date', reportDate);

    // Active contracts
    const { data: activeContracts, error: activeError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Vehicle status
    const { data: availableVehicles, error: availableError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    const { data: rentedVehicles, error: rentedError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented');

    const { data: maintenanceVehicles, error: maintenanceError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance');

    // Total vehicles
    const { data: totalVehicles, error: totalVehiclesError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });

    // New incidents today
    const { data: newIncidents, error: incidentsError } = await supabase
      .from('contract_incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    // New violations today
    const { data: newViolations, error: violationsError } = await supabase
      .from('traffic_violations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (newContractsError || completedError || activeError || availableError || 
        rentedError || maintenanceError || totalVehiclesError || incidentsError || violationsError) {
      throw newContractsError || completedError || activeError || availableError || 
            rentedError || maintenanceError || totalVehiclesError || incidentsError || violationsError;
    }

    const totalRevenue = newContracts?.reduce((sum, contract) => sum + (contract.final_amount || 0), 0) || 0;
    const averageDailyRate = newContracts?.length > 0 
      ? newContracts.reduce((sum, contract) => sum + (contract.daily_rate || 0), 0) / newContracts.length
      : 0;

    const totalVehiclesCount = totalVehicles?.length || 0;
    const rentedVehiclesCount = rentedVehicles?.length || 0;
    const occupancyRate = totalVehiclesCount > 0 ? (rentedVehiclesCount / totalVehiclesCount) * 100 : 0;

    return {
      date: reportDate,
      totalRevenue,
      newContracts: newContracts?.length || 0,
      completedContracts: completedContracts?.length || 0,
      activeContracts: activeContracts?.length || 0,
      availableVehicles: availableVehicles?.length || 0,
      rentedVehicles: rentedVehiclesCount,
      maintenanceVehicles: maintenanceVehicles?.length || 0,
      newIncidents: newIncidents?.length || 0,
      newViolations: newViolations?.length || 0,
      occupancyRate: Number(occupancyRate.toFixed(1)),
      averageDailyRate: Number(averageDailyRate.toFixed(2)),
    };
  },
};