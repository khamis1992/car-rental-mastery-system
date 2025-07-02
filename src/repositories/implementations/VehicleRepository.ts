import { BaseRepository } from '../base/BaseRepository';
import { IVehicleRepository, Vehicle } from '../interfaces/IVehicleRepository';
import { supabase } from '@/integrations/supabase/client';

export class VehicleRepository extends BaseRepository<Vehicle> implements IVehicleRepository {
  protected tableName = 'vehicles';

  async getAvailableVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Vehicle[];
  }

  async getByStatus(status: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', status as any)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Vehicle[];
  }

  async getByVehicleNumber(vehicleNumber: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vehicle_number', vehicleNumber)
      .maybeSingle();

    if (error) throw error;
    return data as Vehicle | null;
  }

  async getByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .maybeSingle();

    if (error) throw error;
    return data as Vehicle | null;
  }

  async generateVehicleNumber(): Promise<string> {
    try {
      console.log('VehicleRepository: استدعاء دالة توليد رقم المركبة');
      const { data, error } = await supabase.rpc('generate_vehicle_number');
      
      if (error) {
        console.error('VehicleRepository: خطأ في استدعاء دالة توليد رقم المركبة:', error);
        throw new Error(`فشل في توليد رقم المركبة: ${error.message}`);
      }
      
      if (!data) {
        console.error('VehicleRepository: لم يتم إرجاع رقم مركبة من الدالة');
        throw new Error('فشل في توليد رقم المركبة: لم يتم إرجاع قيمة');
      }
      
      const vehicleNumber = data as string;
      console.log('VehicleRepository: تم الحصول على رقم المركبة:', vehicleNumber);
      
      // التحقق من صحة تنسيق رقم المركبة
      if (!vehicleNumber.match(/^VEH\d{4}$/)) {
        console.error('VehicleRepository: تنسيق رقم المركبة غير صحيح:', vehicleNumber);
        throw new Error('فشل في توليد رقم المركبة: التنسيق غير صحيح');
      }
      
      return vehicleNumber;
    } catch (error) {
      console.error('VehicleRepository: خطأ في توليد رقم المركبة:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطأ غير متوقع في توليد رقم المركبة');
    }
  }
}