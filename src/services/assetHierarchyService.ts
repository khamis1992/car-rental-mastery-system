import { supabase } from '@/integrations/supabase/client';

export interface AssetHierarchy {
  id: string;
  code: string;
  name_ar: string;
  name_en?: string;
  parent_code?: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetHierarchyPath {
  code: string;
  name: string;
  level: number;
}

export class AssetHierarchyService {
  /**
   * الحصول على جميع عناصر التسلسل الهرمي للأصول
   */
  async getAllHierarchy(): Promise<AssetHierarchy[]> {
    const { data, error } = await supabase
      .from('asset_code_hierarchy')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`فشل في تحميل التسلسل الهرمي للأصول: ${error.message}`);
    }

    return data || [];
  }

  /**
   * الحصول على التسلسل الهرمي حسب المستوى
   */
  async getHierarchyByLevel(level: number): Promise<AssetHierarchy[]> {
    const { data, error } = await supabase
      .from('asset_code_hierarchy')
      .select('*')
      .eq('level', level)
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`فشل في تحميل المستوى ${level}: ${error.message}`);
    }

    return data || [];
  }

  /**
   * الحصول على العناصر الفرعية لرمز معين
   */
  async getChildrenByCode(parentCode: string): Promise<AssetHierarchy[]> {
    const { data, error } = await supabase
      .from('asset_code_hierarchy')
      .select('*')
      .eq('parent_code', parentCode)
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`فشل في تحميل العناصر الفرعية: ${error.message}`);
    }

    return data || [];
  }

  /**
   * الحصول على مسار التسلسل الهرمي الكامل لرمز معين
   */
  async getHierarchyPath(code: string): Promise<AssetHierarchyPath[]> {
    const path: AssetHierarchyPath[] = [];
    let currentCode = code;

    while (currentCode) {
      const { data, error } = await supabase
        .from('asset_code_hierarchy')
        .select('code, name_ar, parent_code, level')
        .eq('code', currentCode)
        .single();

      if (error || !data) {
        break;
      }

      path.unshift({
        code: data.code,
        name: data.name_ar,
        level: data.level
      });

      currentCode = data.parent_code;
    }

    return path;
  }

  /**
   * الحصول على الرقم التسلسلي التالي لنوع مركبة معين
   */
  async getNextSequenceNumber(hierarchyCode: string): Promise<number> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('asset_sequence_number')
      .eq('asset_code_hierarchy', hierarchyCode)
      .order('asset_sequence_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`فشل في الحصول على الرقم التسلسلي: ${error.message}`);
    }

    return data && data.length > 0 ? (data[0].asset_sequence_number || 0) + 1 : 1;
  }

  /**
   * توليد رمز الأصل الكامل
   */
  async generateAssetCode(vehicleType: string): Promise<string> {
    const hierarchyCode = this.getHierarchyCodeByVehicleType(vehicleType);
    const sequenceNumber = await this.getNextSequenceNumber(hierarchyCode);
    return `${hierarchyCode}-${String(sequenceNumber).padStart(4, '0')}`;
  }

  /**
   * تحديد رمز التسلسل الهرمي بناءً على نوع المركبة
   */
  private getHierarchyCodeByVehicleType(vehicleType: string): string {
    const mapping: Record<string, string> = {
      'sedan': '111',
      'suv': '112',
      'hatchback': '113',
      'van': '121',
      'pickup': '122',
      'coupe': '131',
      'luxury': '132'
    };

    return mapping[vehicleType] || '111'; // افتراضي: سيدان
  }

  /**
   * الحصول على اسم التصنيف بناءً على الرمز
   */
  async getHierarchyName(code: string): Promise<string> {
    const { data, error } = await supabase
      .from('asset_code_hierarchy')
      .select('name_ar')
      .eq('code', code)
      .single();

    if (error || !data) {
      return '';
    }

    return data.name_ar;
  }
}

// إنشاء مثيل مشترك للخدمة
export const assetHierarchyService = new AssetHierarchyService();