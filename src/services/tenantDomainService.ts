import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TenantDomain = Database['public']['Tables']['tenant_domains']['Row'];
type TenantDomainInsert = Database['public']['Tables']['tenant_domains']['Insert'];
type TenantDomainUpdate = Database['public']['Tables']['tenant_domains']['Update'];

export interface DomainVerificationResult {
  success: boolean;
  status: 'pending' | 'verified' | 'failed';
  message: string;
  instructions?: {
    type: 'TXT' | 'CNAME' | 'A';
    name: string;
    value: string;
    ttl?: number;
  };
}

export const tenantDomainService = {
  // إضافة نطاق جديد
  async addDomain(domain: string, subdomain?: string, tenantId?: string): Promise<TenantDomain> {
    // التحقق من صحة النطاق
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // إنشاء رمز التحقق
    const verificationToken = this.generateVerificationToken();

    const { data, error } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: tenantId, // Will be set by RLS/trigger if not provided
        domain: domain.toLowerCase(),
        subdomain: subdomain?.toLowerCase(),
        verification_token: verificationToken,
        verification_status: 'pending',
        verification_method: 'dns',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding domain:', error);
      throw error;
    }

    return data;
  },

  // الحصول على جميع النطاقات للتينانت
  async getDomains(): Promise<TenantDomain[]> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      throw error;
    }

    return data || [];
  },

  // الحصول على النطاق الأساسي
  async getPrimaryDomain(): Promise<TenantDomain | null> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching primary domain:', error);
      throw error;
    }

    return data;
  },

  // التحقق من النطاق
  async verifyDomain(id: string): Promise<DomainVerificationResult> {
    // الحصول على معلومات النطاق
    const { data: domain, error: fetchError } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !domain) {
      throw new Error('Domain not found');
    }

    try {
      // محاكاة التحقق من DNS (في التطبيق الحقيقي، ستحتاج إلى خدمة خارجية)
      const verificationResult = await this.performDNSVerification(domain.domain, domain.verification_token!);
      
      if (verificationResult.success) {
        // تحديث حالة التحقق
        const { error: updateError } = await supabase
          .from('tenant_domains')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error updating verification status:', updateError);
          throw updateError;
        }

        return {
          success: true,
          status: 'verified',
          message: 'تم التحقق من النطاق بنجاح'
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'فشل في التحقق من النطاق. تأكد من إضافة سجل DNS الصحيح.',
          instructions: {
            type: 'TXT',
            name: '_verification',
            value: domain.verification_token!,
            ttl: 300
          }
        };
      }
    } catch (error) {
      console.error('Domain verification error:', error);
      
      // تحديث الحالة إلى فشل
      await supabase
        .from('tenant_domains')
        .update({ verification_status: 'failed' })
        .eq('id', id);

      return {
        success: false,
        status: 'failed',
        message: 'حدث خطأ أثناء التحقق من النطاق'
      };
    }
  },

  // تعيين نطاق كأساسي
  async setPrimaryDomain(id: string): Promise<void> {
    // التأكد من أن النطاق مُتحقق منه
    const { data: domain, error: fetchError } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !domain) {
      throw new Error('Domain not found');
    }

    if (domain.verification_status !== 'verified') {
      throw new Error('Cannot set unverified domain as primary');
    }

    // إزالة الأساسي من النطاقات الأخرى
    const { error: clearError } = await supabase
      .from('tenant_domains')
      .update({ is_primary: false })
      .neq('id', id);

    if (clearError) {
      console.error('Error clearing primary domains:', clearError);
      throw clearError;
    }

    // تعيين النطاق الجديد كأساسي
    const { error: setError } = await supabase
      .from('tenant_domains')
      .update({ is_primary: true })
      .eq('id', id);

    if (setError) {
      console.error('Error setting primary domain:', setError);
      throw setError;
    }
  },

  // حذف نطاق
  async deleteDomain(id: string): Promise<void> {
    // التأكد من أنه ليس النطاق الأساسي
    const { data: domain, error: fetchError } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !domain) {
      throw new Error('Domain not found');
    }

    if (domain.is_primary) {
      throw new Error('Cannot delete primary domain');
    }

    const { error } = await supabase
      .from('tenant_domains')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting domain:', error);
      throw error;
    }
  },

  // تحديث معلومات النطاق
  async updateDomain(id: string, updates: Partial<TenantDomainUpdate>): Promise<TenantDomain> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating domain:', error);
      throw error;
    }

    return data;
  },

  // التحقق من صحة النطاق
  isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  },

  // توليد رمز التحقق
  generateVerificationToken(): string {
    return 'saptco-verify-' + Math.random().toString(36).substring(2, 18);
  },

  // محاكاة التحقق من DNS
  async performDNSVerification(domain: string, token: string): Promise<{ success: boolean }> {
    // في التطبيق الحقيقي، ستحتاج إلى استخدام خدمة DNS للتحقق
    // هنا نقوم بمحاكاة العملية
    return new Promise((resolve) => {
      setTimeout(() => {
        // محاكاة نجاح عشوائي (في التطبيق الحقيقي، ستفحص سجلات DNS الفعلية)
        const success = Math.random() > 0.3;
        resolve({ success });
      }, 2000);
    });
  },

  // الحصول على تعليمات التحقق
  getVerificationInstructions(domain: TenantDomain): DomainVerificationResult['instructions'] {
    if (!domain.verification_token) {
      return undefined;
    }

    return {
      type: 'TXT',
      name: '_verification',
      value: domain.verification_token,
      ttl: 300
    };
  },

  // فحص حالة SSL
  async checkSSLStatus(id: string): Promise<{ status: string; expires_at?: string }> {
    const { data: domain, error } = await supabase
      .from('tenant_domains')
      .select('ssl_status, ssl_expires_at')
      .eq('id', id)
      .single();

    if (error || !domain) {
      throw new Error('Domain not found');
    }

    return {
      status: domain.ssl_status || 'pending',
      expires_at: domain.ssl_expires_at || undefined
    };
  },

  // تجديد شهادة SSL
  async renewSSL(id: string): Promise<void> {
    // في التطبيق الحقيقي، ستتصل بخدمة SSL
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const { error } = await supabase
      .from('tenant_domains')
      .update({
        ssl_status: 'active',
        ssl_expires_at: expiryDate.toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error renewing SSL:', error);
      throw error;
    }
  }
};