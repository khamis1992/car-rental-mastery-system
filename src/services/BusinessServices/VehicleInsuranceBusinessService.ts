import { IVehicleInsuranceRepository, VehicleInsurance } from '@/repositories/interfaces/IVehicleInsuranceRepository';

export class VehicleInsuranceBusinessService {
  constructor(private vehicleInsuranceRepository: IVehicleInsuranceRepository) {}

  async getVehicleInsurances(vehicleId: string): Promise<VehicleInsurance[]> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء تحميل تأمينات المركبة:', vehicleId);
      const insurances = await this.vehicleInsuranceRepository.getByVehicleId(vehicleId);
      console.log('VehicleInsuranceBusinessService: تم تحميل', insurances.length, 'تأمين');
      return insurances;
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في تحميل التأمينات:', error);
      throw new Error(`فشل في تحميل تأمينات المركبة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async getActiveVehicleInsurances(vehicleId: string): Promise<VehicleInsurance[]> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء تحميل التأمينات النشطة للمركبة:', vehicleId);
      const insurances = await this.vehicleInsuranceRepository.getActiveByVehicleId(vehicleId);
      console.log('VehicleInsuranceBusinessService: تم تحميل', insurances.length, 'تأمين نشط');
      return insurances;
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في تحميل التأمينات النشطة:', error);
      throw new Error(`فشل في تحميل التأمينات النشطة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async createInsurance(insuranceData: Omit<VehicleInsurance, 'id' | 'created_at' | 'updated_at'>): Promise<VehicleInsurance> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء إنشاء تأمين جديد:', insuranceData);
      
      // التحقق من صحة البيانات
      this.validateInsuranceData(insuranceData);
      
      const result = await this.vehicleInsuranceRepository.create(insuranceData);
      console.log('VehicleInsuranceBusinessService: تم إنشاء التأمين بنجاح:', result);
      return result;
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في إنشاء التأمين:', error);
      throw new Error(`فشل في إنشاء التأمين: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async updateInsurance(id: string, updates: Partial<VehicleInsurance>): Promise<VehicleInsurance> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء تحديث التأمين:', { id, updates });
      
      if (!id || id.trim() === '') {
        throw new Error('معرف التأمين مطلوب');
      }

      // التحقق من وجود التأمين أولاً
      const existingInsurance = await this.vehicleInsuranceRepository.getById(id);
      if (!existingInsurance) {
        throw new Error('التأمين غير موجود');
      }

      // التحقق من صحة البيانات المحدثة
      if (updates.insurance_type || updates.vehicle_id || updates.expiry_date || updates.start_date) {
        this.validateInsuranceUpdateData(updates);
      }
      
      const result = await this.vehicleInsuranceRepository.update(id, updates);
      console.log('VehicleInsuranceBusinessService: تم تحديث التأمين بنجاح:', result);
      return result;
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في تحديث التأمين:', error);
      throw new Error(`فشل في تحديث التأمين: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async deleteInsurance(id: string): Promise<void> {
    return this.vehicleInsuranceRepository.delete(id);
  }

  async deactivateInsurance(id: string): Promise<void> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء إلغاء تفعيل التأمين:', id);
      await this.vehicleInsuranceRepository.deactivateInsurance(id);
      console.log('VehicleInsuranceBusinessService: تم إلغاء تفعيل التأمين بنجاح');
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في إلغاء تفعيل التأمين:', error);
      throw new Error(`فشل في إلغاء تفعيل التأمين: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async activateInsurance(id: string): Promise<void> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء تفعيل التأمين:', id);
      await this.vehicleInsuranceRepository.activateInsurance(id);
      console.log('VehicleInsuranceBusinessService: تم تفعيل التأمين بنجاح');
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في تفعيل التأمين:', error);
      throw new Error(`فشل في تفعيل التأمين: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  async getExpiringInsurances(days: number = 30): Promise<VehicleInsurance[]> {
    try {
      console.log('VehicleInsuranceBusinessService: بدء تحميل التأمينات المنتهية خلال', days, 'يوم');
      const expiring = await this.vehicleInsuranceRepository.getExpiringInsurance(days);
      console.log('VehicleInsuranceBusinessService: تم العثور على', expiring.length, 'تأمين منتهي');
      return expiring;
    } catch (error) {
      console.error('VehicleInsuranceBusinessService: خطأ في تحميل التأمينات المنتهية:', error);
      throw new Error(`فشل في تحميل التأمينات المنتهية: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
    }
  }

  // وظائف التحقق من صحة البيانات
  private validateInsuranceData(insuranceData: Omit<VehicleInsurance, 'id' | 'created_at' | 'updated_at'>): void {
    const errors: string[] = [];

    if (!insuranceData.vehicle_id || insuranceData.vehicle_id.trim() === '') {
      errors.push('معرف المركبة مطلوب');
    }

    if (!insuranceData.insurance_type || insuranceData.insurance_type.trim() === '') {
      errors.push('نوع التأمين مطلوب');
    }

    const validTypes = ['comprehensive', 'third_party', 'basic', 'collision', 'theft', 'fire', 'natural_disasters'];
    if (insuranceData.insurance_type && !validTypes.includes(insuranceData.insurance_type)) {
      errors.push('نوع التأمين غير صحيح');
    }

    if (insuranceData.start_date && insuranceData.expiry_date) {
      const startDate = new Date(insuranceData.start_date);
      const expiryDate = new Date(insuranceData.expiry_date);
      if (startDate >= expiryDate) {
        errors.push('تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء');
      }
    }

    if (insuranceData.premium_amount !== undefined && insuranceData.premium_amount < 0) {
      errors.push('مبلغ القسط لا يمكن أن يكون سالباً');
    }

    if (insuranceData.coverage_amount !== undefined && insuranceData.coverage_amount < 0) {
      errors.push('مبلغ التغطية لا يمكن أن يكون سالباً');
    }

    if (errors.length > 0) {
      throw new Error(`أخطاء في بيانات التأمين: ${errors.join(', ')}`);
    }
  }

  private validateInsuranceUpdateData(updates: Partial<VehicleInsurance>): void {
    const errors: string[] = [];

    if (updates.insurance_type !== undefined) {
      const validTypes = ['comprehensive', 'third_party', 'basic', 'collision', 'theft', 'fire', 'natural_disasters'];
      if (!validTypes.includes(updates.insurance_type)) {
        errors.push('نوع التأمين غير صحيح');
      }
    }

    if (updates.start_date && updates.expiry_date) {
      const startDate = new Date(updates.start_date);
      const expiryDate = new Date(updates.expiry_date);
      if (startDate >= expiryDate) {
        errors.push('تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء');
      }
    }

    if (updates.premium_amount !== undefined && updates.premium_amount < 0) {
      errors.push('مبلغ القسط لا يمكن أن يكون سالباً');
    }

    if (updates.coverage_amount !== undefined && updates.coverage_amount < 0) {
      errors.push('مبلغ التغطية لا يمكن أن يكون سالباً');
    }

    if (errors.length > 0) {
      throw new Error(`أخطاء في تحديث بيانات التأمين: ${errors.join(', ')}`);
    }
  }
}