import { IVehicleRepository, Vehicle } from '@/repositories/interfaces/IVehicleRepository';

export class VehicleBusinessService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      console.log('VehicleBusinessService: بدء تحميل جميع المركبات');
      const vehicles = await this.vehicleRepository.getAll();
      console.log('VehicleBusinessService: تم تحميل', vehicles.length, 'مركبة');
      return vehicles;
    } catch (error) {
      console.error('VehicleBusinessService: خطأ في تحميل المركبات:', error);
      throw new Error(`فشل في تحميل المركبات: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      console.log('VehicleBusinessService: بدء تحميل المركبة بالمعرف:', id);
      
      if (!id || id.trim() === '') {
        throw new Error('معرف المركبة مطلوب');
      }

      const vehicle = await this.vehicleRepository.getById(id);
      console.log('VehicleBusinessService: نتيجة تحميل المركبة:', vehicle ? 'وجدت' : 'لم توجد');
      return vehicle;
    } catch (error) {
      console.error('VehicleBusinessService: خطأ في تحميل المركبة:', error);
      throw new Error(`فشل في تحميل المركبة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    try {
      console.log('VehicleBusinessService: بدء إنشاء المركبة:', vehicleData);
      
      // التحقق من صحة البيانات
      this.validateVehicleData(vehicleData);
      
      const result = await this.vehicleRepository.create(vehicleData);
      console.log('VehicleBusinessService: تم إنشاء المركبة بنجاح:', result);
      
      // إذا كانت المركبة ملك الشركة وتحتوي على بيانات الأصل، قم بإنشاء أصل ثابت
      if (vehicleData.owner_type === 'company' && vehicleData.purchase_date && vehicleData.purchase_cost) {
        try {
          console.log('VehicleBusinessService: إنشاء أصل ثابت للمركبة');
          const { data: assetFunction, error: functionError } = await (this.vehicleRepository as any).supabase
            .rpc('create_vehicle_asset', {
              vehicle_id: result.id,
              vehicle_data: JSON.stringify({
                make: vehicleData.make,
                model: vehicleData.model,
                license_plate: vehicleData.license_plate,
                vehicle_number: vehicleData.vehicle_number,
                purchase_date: vehicleData.purchase_date,
                purchase_cost: vehicleData.purchase_cost,
                useful_life_years: vehicleData.useful_life_years || 5,
                residual_value: vehicleData.residual_value || 0,
                depreciation_method: vehicleData.depreciation_method || 'straight_line'
              })
            });
          
          if (functionError) {
            console.error('VehicleBusinessService: خطأ في إنشاء الأصل الثابت:', functionError);
            // لا نرمي خطأ هنا لأن المركبة تم إنشاؤها بنجاح
          } else {
            console.log('VehicleBusinessService: تم إنشاء الأصل الثابت بنجاح:', assetFunction);
          }
        } catch (assetError) {
          console.error('VehicleBusinessService: خطأ في إنشاء الأصل الثابت:', assetError);
          // لا نرمي خطأ هنا لأن المركبة تم إنشاؤها بنجاح
        }
      }
      
      return result;
    } catch (error) {
      console.error('VehicleBusinessService: خطأ في إنشاء المركبة:', error);
      throw new Error(`فشل في إنشاء المركبة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      console.log('VehicleBusinessService: بدء تحديث المركبة:', { id, updates });
      
      if (!id || id.trim() === '') {
        throw new Error('معرف المركبة مطلوب');
      }

      // التحقق من وجود المركبة أولاً
      const existingVehicle = await this.vehicleRepository.getById(id);
      if (!existingVehicle) {
        throw new Error('المركبة غير موجودة');
      }

      // التحقق من صحة البيانات المحدثة
      this.validateVehicleUpdateData(updates);
      
      const result = await this.vehicleRepository.update(id, updates);
      console.log('VehicleBusinessService: تم تحديث المركبة بنجاح:', result);
      return result;
    } catch (error) {
      console.error('VehicleBusinessService: خطأ في تحديث المركبة:', error);
      throw new Error(`فشل في تحديث المركبة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.vehicleRepository.delete(id);
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.getAvailableVehicles();
  }

  async getVehiclesByStatus(status: string): Promise<Vehicle[]> {
    return this.vehicleRepository.getByStatus(status);
  }

  async getVehicleByNumber(vehicleNumber: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getByVehicleNumber(vehicleNumber);
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getByLicensePlate(licensePlate);
  }

  async generateVehicleNumber(): Promise<string> {
    try {
      console.log('VehicleBusinessService: بدء توليد رقم المركبة');
      const result = await this.vehicleRepository.generateVehicleNumber();
      console.log('VehicleBusinessService: تم توليد رقم المركبة:', result);
      
      // التحقق مرة أخيرة من صحة الرقم المولد
      if (!result || typeof result !== 'string') {
        throw new Error('رقم المركبة المولد غير صالح');
      }
      
      return result;
    } catch (error) {
      console.error('VehicleBusinessService: خطأ في توليد رقم المركبة:', error);
      if (error instanceof Error) {
        throw new Error(`فشل في خدمة توليد رقم المركبة: ${error.message}`);
      }
      throw new Error('خطأ غير متوقع في خدمة توليد رقم المركبة');
    }
  }

  async updateVehicleStatus(id: string, status: 'available' | 'rented' | 'maintenance' | 'out_of_service'): Promise<Vehicle> {
    return this.vehicleRepository.update(id, { status });
  }

  // وظائف التحقق من صحة البيانات
  private validateVehicleData(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): void {
    const errors: string[] = [];

    // التحقق من الحقول المطلوبة
    if (!vehicleData.make || vehicleData.make.trim() === '') {
      errors.push('الماركة مطلوبة');
    }

    if (!vehicleData.model || vehicleData.model.trim() === '') {
      errors.push('الموديل مطلوب');
    }

    if (!vehicleData.year || vehicleData.year < 1900 || vehicleData.year > new Date().getFullYear() + 1) {
      errors.push('سنة الصنع غير صحيحة');
    }

    if (!vehicleData.color || vehicleData.color.trim() === '') {
      errors.push('اللون مطلوب');
    }

    if (!vehicleData.vehicle_type || vehicleData.vehicle_type.trim() === '') {
      errors.push('نوع المركبة مطلوب');
    }

    if (!vehicleData.license_plate || vehicleData.license_plate.trim() === '') {
      errors.push('رقم اللوحة مطلوب');
    }

    if (!vehicleData.daily_rate || vehicleData.daily_rate <= 0) {
      errors.push('السعر اليومي مطلوب ويجب أن يكون أكبر من صفر');
    }

    if (!vehicleData.fuel_type || vehicleData.fuel_type.trim() === '') {
      errors.push('نوع الوقود مطلوب');
    }

    if (!vehicleData.transmission || vehicleData.transmission.trim() === '') {
      errors.push('نوع ناقل الحركة مطلوب');
    }

    if (vehicleData.mileage < 0) {
      errors.push('المسافة المقطوعة لا يمكن أن تكون سالبة');
    }

    // التحقق من صحة حالة المركبة
    const validStatuses = ['available', 'rented', 'maintenance', 'out_of_service'];
    if (!validStatuses.includes(vehicleData.status)) {
      errors.push('حالة المركبة غير صحيحة');
    }

    if (errors.length > 0) {
      throw new Error(`أخطاء في بيانات المركبة: ${errors.join(', ')}`);
    }
  }

  private validateVehicleUpdateData(updates: Partial<Vehicle>): void {
    const errors: string[] = [];

    console.log('VehicleBusinessService: بيانات التحديث المستلمة:', updates);

    // التحقق من الحقول المحدثة فقط - ولكن بطريقة أكثر مرونة
    if (updates.make !== undefined && (!updates.make || updates.make.trim() === '')) {
      errors.push('الماركة لا يمكن أن تكون فارغة');
    }

    if (updates.model !== undefined && (!updates.model || updates.model.trim() === '')) {
      errors.push('الموديل لا يمكن أن يكون فارغاً');
    }

    if (updates.year !== undefined && (updates.year < 1900 || updates.year > new Date().getFullYear() + 1)) {
      errors.push('سنة الصنع غير صحيحة');
    }

    if (updates.color !== undefined && (!updates.color || updates.color.trim() === '')) {
      errors.push('اللون لا يمكن أن يكون فارغاً');
    }

    // تعديل التحقق من نوع المركبة ليكون أكثر مرونة
    if (updates.vehicle_type !== undefined) {
      if (!updates.vehicle_type || updates.vehicle_type.trim() === '') {
        console.log('VehicleBusinessService: نوع المركبة فارغ:', updates.vehicle_type);
        errors.push('نوع المركبة لا يمكن أن يكون فارغاً');
      }
    }

    if (updates.license_plate !== undefined && (!updates.license_plate || updates.license_plate.trim() === '')) {
      errors.push('رقم اللوحة لا يمكن أن يكون فارغاً');
    }

    if (updates.daily_rate !== undefined && updates.daily_rate <= 0) {
      errors.push('السعر اليومي يجب أن يكون أكبر من صفر');
    }

    if (updates.fuel_type !== undefined && (!updates.fuel_type || updates.fuel_type.trim() === '')) {
      errors.push('نوع الوقود لا يمكن أن يكون فارغاً');
    }

    if (updates.transmission !== undefined && (!updates.transmission || updates.transmission.trim() === '')) {
      errors.push('نوع ناقل الحركة لا يمكن أن يكون فارغاً');
    }

    if (updates.mileage !== undefined && updates.mileage < 0) {
      errors.push('المسافة المقطوعة لا يمكن أن تكون سالبة');
    }

    // التحقق من صحة حالة المركبة
    if (updates.status !== undefined) {
      const validStatuses = ['available', 'rented', 'maintenance', 'out_of_service'];
      if (!validStatuses.includes(updates.status)) {
        errors.push('حالة المركبة غير صحيحة');
      }
    }

    console.log('VehicleBusinessService: أخطاء التحقق:', errors);

    if (errors.length > 0) {
      throw new Error(`أخطاء في تحديث بيانات المركبة: ${errors.join(', ')}`);
    }
  }
}