import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TenantAsset = Database['public']['Tables']['tenant_assets']['Row'];
type TenantAssetInsert = Database['public']['Tables']['tenant_assets']['Insert'];
type TenantAssetUpdate = Database['public']['Tables']['tenant_assets']['Update'];

export type AssetType = 'logo' | 'favicon' | 'header_image' | 'footer_image' | 'background' | 'email_template' | 'pdf_template' | 'custom';

export interface AssetUploadOptions {
  tenantId: string;
  assetType: AssetType;
  assetName: string;
  file: File;
  altText?: string;
  description?: string;
  usageContext?: Record<string, any>;
}

export const tenantAssetService = {
  // رفع أصل جديد
  async uploadAsset(options: AssetUploadOptions): Promise<TenantAsset> {
    const { tenantId, assetType, assetName, file, altText, description, usageContext } = options;
    
    // إنشاء مسار الملف
    const fileExt = file.name.split('.').pop();
    const fileName = `${assetType}-${assetName}-${Date.now()}.${fileExt}`;
    const filePath = `${tenantId}/${assetType}/${fileName}`;
    
    // رفع الملف إلى التخزين
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading asset:', uploadError);
      throw uploadError;
    }

    // الحصول على الـ URL العام
    const { data: urlData } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(filePath);

    // إلغاء تفعيل الأصول السابقة من نفس النوع والاسم
    await this.deactivatePreviousVersions(tenantId, assetType, assetName);

    // حفظ معلومات الأصل في قاعدة البيانات
    const { data: assetData, error: dbError } = await supabase
      .from('tenant_assets')
      .insert({
        tenant_id: tenantId,
        asset_type: assetType,
        asset_name: assetName,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        alt_text: altText,
        description: description,
        usage_context: usageContext || {},
        is_current: true,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      // حذف الملف من التخزين في حالة فشل قاعدة البيانات
      await supabase.storage
        .from('tenant-assets')
        .remove([filePath]);
      
      console.error('Error saving asset to database:', dbError);
      throw dbError;
    }

    return assetData;
  },

  // الحصول على الأصول حسب النوع
  async getAssetsByType(assetType: AssetType): Promise<TenantAsset[]> {
    const { data, error } = await supabase
      .from('tenant_assets')
      .select('*')
      .eq('asset_type', assetType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }

    return data || [];
  },

  // الحصول على الأصل الحالي حسب النوع والاسم
  async getCurrentAsset(assetType: AssetType, assetName: string): Promise<TenantAsset | null> {
    const { data, error } = await supabase
      .from('tenant_assets')
      .select('*')
      .eq('asset_type', assetType)
      .eq('asset_name', assetName)
      .eq('is_current', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current asset:', error);
      throw error;
    }

    return data;
  },

  // الحصول على جميع الأصول للتينانت
  async getAllAssets(): Promise<TenantAsset[]> {
    const { data, error } = await supabase
      .from('tenant_assets')
      .select('*')
      .eq('is_active', true)
      .order('asset_type')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all assets:', error);
      throw error;
    }

    return data || [];
  },

  // حذف أصل
  async deleteAsset(id: string): Promise<void> {
    // الحصول على معلومات الأصل أولاً
    const { data: asset, error: fetchError } = await supabase
      .from('tenant_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching asset for deletion:', fetchError);
      throw fetchError;
    }

    if (!asset) {
      throw new Error('Asset not found');
    }

    // حذف الملف من التخزين
    const { error: storageError } = await supabase.storage
      .from('tenant-assets')
      .remove([asset.file_path]);

    if (storageError) {
      console.error('Error deleting asset from storage:', storageError);
      // نستمر في الحذف من قاعدة البيانات حتى لو فشل حذف الملف
    }

    // حذف السجل من قاعدة البيانات
    const { error: dbError } = await supabase
      .from('tenant_assets')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting asset from database:', dbError);
      throw dbError;
    }
  },

  // تحديث معلومات الأصل
  async updateAsset(id: string, updates: Partial<TenantAssetUpdate>): Promise<TenantAsset> {
    const { data, error } = await supabase
      .from('tenant_assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating asset:', error);
      throw error;
    }

    return data;
  },

  // إلغاء تفعيل الإصدارات السابقة
  async deactivatePreviousVersions(tenantId: string, assetType: AssetType, assetName: string): Promise<void> {
    const { error } = await supabase
      .from('tenant_assets')
      .update({ is_current: false })
      .eq('tenant_id', tenantId)
      .eq('asset_type', assetType)
      .eq('asset_name', assetName)
      .eq('is_current', true);

    if (error) {
      console.error('Error deactivating previous versions:', error);
      throw error;
    }
  },

  // الحصول على URL للأصل
  getAssetUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // إنشاء مجموعة أصول افتراضية للتينانت الجديد
  async createDefaultAssets(tenantId: string): Promise<void> {
    // يمكن إضافة أصول افتراضية هنا إذا لزم الأمر
    // مثل شعار افتراضي أو أيقونات افتراضية
    console.log(`Default assets setup completed for tenant: ${tenantId}`);
  },

  // البحث في الأصول
  async searchAssets(query: string, assetType?: AssetType): Promise<TenantAsset[]> {
    let queryBuilder = supabase
      .from('tenant_assets')
      .select('*')
      .eq('is_active', true);

    if (assetType) {
      queryBuilder = queryBuilder.eq('asset_type', assetType);
    }

    queryBuilder = queryBuilder.or(`asset_name.ilike.%${query}%,description.ilike.%${query}%,alt_text.ilike.%${query}%`);

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching assets:', error);
      throw error;
    }

    return data || [];
  },

  // تحديد أصل كحالي
  async setCurrentAsset(id: string): Promise<void> {
    // الحصول على معلومات الأصل
    const { data: asset, error: fetchError } = await supabase
      .from('tenant_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !asset) {
      console.error('Error fetching asset:', fetchError);
      throw fetchError || new Error('Asset not found');
    }

    // إلغاء تفعيل الإصدارات الأخرى
    await this.deactivatePreviousVersions(asset.tenant_id, asset.asset_type as AssetType, asset.asset_name);

    // تفعيل الأصل المحدد
    const { error: updateError } = await supabase
      .from('tenant_assets')
      .update({ is_current: true })
      .eq('id', id);

    if (updateError) {
      console.error('Error setting current asset:', updateError);
      throw updateError;
    }
  }
};