import { BaseRepository } from '../base/BaseRepository';
import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';

export class EmployeeRepository extends BaseRepository<Employee> implements IEmployeeRepository {
  protected tableName = 'employees';

  async getByDepartment(department: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        office_locations!work_location_id (
          name,
          address
        )
      `)
      .eq('department', department)
      .eq('status', 'active')
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data || []) as Employee[];
  }

  async getByStatus(status: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        office_locations!work_location_id (
          name,
          address
        )
      `)
      .eq('status', status)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data || []) as Employee[];
  }

  async getByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        office_locations!work_location_id (
          name,
          address
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Employee | null;
  }

  async getByEmployeeNumber(employeeNumber: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        office_locations!work_location_id (
          name,
          address
        )
      `)
      .eq('employee_number', employeeNumber)
      .maybeSingle();

    if (error) throw error;
    return data as Employee | null;
  }
}