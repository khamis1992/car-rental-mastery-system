import { supabase } from '@/integrations/supabase/client';

export interface CompanyBranding {
  id: string;
  logo_url?: string;
  header_image_url?: string;
  footer_image_url?: string;
  company_name_ar: string;
  company_name_en: string;
  address_ar: string;
  address_en: string;
  phone: string;
  email: string;
  website: string;
  tax_number?: string;
  commercial_registration?: string;
  show_header: boolean;
  show_footer: boolean;
  header_height: number;
  footer_height: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class CompanyBrandingService {
  // الحصول على إعدادات الشركة الحالية
  static async getCompanyBranding(): Promise<CompanyBranding | null> {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching company branding:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompanyBranding:', error);
      return null;
    }
  }

  // تحديث إعدادات الشركة
  static async updateCompanyBranding(updates: Partial<CompanyBranding>): Promise<CompanyBranding | null> {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('Error updating company branding:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCompanyBranding:', error);
      throw error;
    }
  }

  // رفع صورة إلى التخزين
  static async uploadImage(file: File, type: 'logo' | 'header' | 'footer'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-branding')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('company-branding')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }

  // حذف صورة من التخزين
  static async deleteImage(url: string): Promise<void> {
    try {
      // استخراج مسار الملف من الرابط
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('company-branding')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw error;
    }
  }

  // رفع الشعار وتحديث البيانات
  static async uploadLogo(file: File): Promise<string> {
    const logoUrl = await this.uploadImage(file, 'logo');
    await this.updateCompanyBranding({ logo_url: logoUrl });
    return logoUrl;
  }

  // رفع صورة الرأسية وتحديث البيانات
  static async uploadHeaderImage(file: File): Promise<string> {
    const headerUrl = await this.uploadImage(file, 'header');
    await this.updateCompanyBranding({ header_image_url: headerUrl });
    return headerUrl;
  }

  // رفع صورة التذييل وتحديث البيانات
  static async uploadFooterImage(file: File): Promise<string> {
    const footerUrl = await this.uploadImage(file, 'footer');
    await this.updateCompanyBranding({ footer_image_url: footerUrl });
    return footerUrl;
  }
}