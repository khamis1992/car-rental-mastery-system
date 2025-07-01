import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceStats {
  dueThisWeek: number;
  overdue: number;
  upcomingThisMonth: number;
  totalPending: number;
}

export interface UpcomingMaintenance {
  id: string;
  vehicleInfo: string;
  maintenanceType: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export const maintenanceService = {
  async getMaintenanceStats(): Promise<MaintenanceStats> {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Vehicles due for maintenance this week
    const { data: dueThisWeek, error: weekError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .lte('next_maintenance_due', nextWeek)
      .gte('next_maintenance_due', today);

    // Overdue maintenance
    const { data: overdue, error: overdueError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .lt('next_maintenance_due', today);

    // Upcoming this month
    const { data: upcomingThisMonth, error: monthError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .lte('next_maintenance_due', nextMonth)
      .gte('next_maintenance_due', today);

    if (weekError || overdueError || monthError) {
      throw weekError || overdueError || monthError;
    }

    return {
      dueThisWeek: dueThisWeek?.length || 0,
      overdue: overdue?.length || 0,
      upcomingThisMonth: upcomingThisMonth?.length || 0,
      totalPending: (dueThisWeek?.length || 0) + (overdue?.length || 0),
    };
  },

  async getUpcomingMaintenance(limit: number = 5): Promise<UpcomingMaintenance[]> {
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, vehicle_number, next_maintenance_due, mileage')
      .lte('next_maintenance_due', nextMonth)
      .gte('next_maintenance_due', today)
      .order('next_maintenance_due', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data.map((vehicle: any) => {
      const daysUntilDue = Math.ceil((new Date(vehicle.next_maintenance_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: vehicle.id,
        vehicleInfo: `${vehicle.make} ${vehicle.model} - ${vehicle.vehicle_number}`,
        maintenanceType: 'صيانة دورية',
        dueDate: vehicle.next_maintenance_due,
        priority: daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low'
      };
    });
  },
};