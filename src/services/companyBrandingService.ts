import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CompanyBranding = Database['public']['Tables']['company_branding']['Row'];
type CompanyBrandingInsert = Database['public']['Tables']['company_branding']['Insert'];
type CompanyBrandingUpdate = Database['public']['Tables']['company_branding']['Update'];

export const companyBrandingService = {
  // الحصول على بيانات العلامة التجارية الحالية
  async getCompanyBranding(): Promise<CompanyBranding | null> {
    const { data, error } = await supabase
      .from('company_branding')
      .select('*')
      .eq('is_active', true)
      .single();

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

  // رفع صورة الرأس
  async uploadHeaderImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `header-${Date.now()}.${fileExt}`;
    const filePath = `headers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-branding')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading header image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('company-branding')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // رفع صورة التذييل
  async uploadFooterImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `footer-${Date.now()}.${fileExt}`;
    const filePath = `footers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-branding')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading footer image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('company-branding')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // رفع الشعار
  async uploadLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-branding')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('company-branding')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // حذف ملف من التخزين
  async deleteFile(url: string): Promise<void> {
    if (!url) return;

    try {
      // استخراج المسار من الـ URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'company-branding');
      if (bucketIndex === -1) return;
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('company-branding')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
      }
    } catch (error) {
      console.error('Error parsing file path for deletion:', error);
    }
  }
};