import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CompanyBranding = Database['public']['Tables']['company_branding']['Row'];
type CompanyBrandingInsert = Database['public']['Tables']['company_branding']['Insert'];
type CompanyBrandingUpdate = Database['public']['Tables']['company_branding']['Update'];

export const companyBrandingService = {
  // الحصول على بيانات العلامة التجارية الحالية للتينانت
  async getCompanyBranding(tenantId?: string): Promise<CompanyBranding | null> {
    let query = supabase
      .from('company_branding')
      .select('*')
      .eq('is_active', true);

    // إذا لم يتم تحديد tenant_id، استخدم التينانت الحالي
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching company branding:', error);
      throw error;
    }

    return data;
  },

  // إنشاء أو تحديث بيانات العلامة التجارية
  async upsertCompanyBranding(data: Partial<CompanyBrandingUpdate>): Promise<CompanyBranding> {
    // البحث عن السجل الحالي
    const existing = await this.getCompanyBranding();

    if (existing) {
      // تحديث السجل الموجود
      const { data: updated, error } = await supabase
        .from('company_branding')
        .update(data)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company branding:', error);
        throw error;
      }

      return updated;
    } else {
      // إنشاء سجل جديد
      const { data: created, error } = await supabase
        .from('company_branding')
        .insert({ ...data, is_active: true } as CompanyBrandingInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating company branding:', error);
        throw error;
      }

      return created;
    }
  },

  // رفع صورة الرأس (استخدام الخدمة الجديدة)
  async uploadHeaderImage(file: File, tenantId?: string): Promise<string> {
    return this.uploadAsset(file, 'header_image', 'default', tenantId);
  },

  // رفع صورة التذييل (استخدام الخدمة الجديدة)
  async uploadFooterImage(file: File, tenantId?: string): Promise<string> {
    return this.uploadAsset(file, 'footer_image', 'default', tenantId);
  },

  // رفع الشعار (استخدام الخدمة الجديدة)
  async uploadLogo(file: File, tenantId?: string): Promise<string> {
    return this.uploadAsset(file, 'logo', 'default', tenantId);
  },

  // دالة مساعدة لرفع الأصول
  async uploadAsset(file: File, assetType: 'logo' | 'header_image' | 'footer_image', assetName: string = 'default', tenantId?: string): Promise<string> {
    // الحصول على معرف التينانت من السياق إذا لم يتم تمريره
    const currentTenantId = tenantId; // يمكن الحصول عليه من السياق

    const fileExt = file.name.split('.').pop();
    const fileName = `${assetType}-${assetName}-${Date.now()}.${fileExt}`;
    const filePath = `${currentTenantId || 'default'}/${assetType}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Error uploading ${assetType}:`, uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // حذف ملف من التخزين
  async deleteFile(url: string): Promise<void> {
    if (!url) return;

    try {
      // استخراج المسار من الـ URL
      const urlParts = url.split('/');
      
      // دعم كل من النظام القديم والجديد
      let bucketIndex = urlParts.findIndex(part => part === 'tenant-assets');
      let bucketName = 'tenant-assets';
      
      if (bucketIndex === -1) {
        bucketIndex = urlParts.findIndex(part => part === 'company-branding');
        bucketName = 'company-branding';
      }
      
      if (bucketIndex === -1) return;
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
      }
    } catch (error) {
      console.error('Error parsing file path for deletion:', error);
    }
  }
};