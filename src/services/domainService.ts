import { supabase } from '@/integrations/supabase/client';

export interface DomainVerification {
  id: string;
  tenant_id: string;
  domain: string;
  verification_type: string;
  verification_value: string;
  verified: boolean;
  verified_at?: string;
  expires_at: string;
  dns_records?: any;
  last_checked_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SSLCertificate {
  id: string;
  tenant_id: string;
  domain: string;
  issued_at?: string;
  expires_at?: string;
  auto_renew: boolean;
  last_renewed_at?: string;
  status: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface DomainVerificationInstructions {
  id: string;
  domain: string;
  verification_type: string;
  verification_value: string;
  instructions: {
    type?: string;
    name?: string;
    value?: string;
    description: string;
  };
  expires_at: string;
}

export class DomainService {
  // إنشاء تحقق جديد من الدومين
  async initiateDomainVerification(
    tenantId: string, 
    domain: string, 
    verificationType: 'dns' | 'txt' | 'cname' = 'dns'
  ): Promise<DomainVerificationInstructions> {
    const { data, error } = await supabase.rpc('initiate_domain_verification', {
      p_tenant_id: tenantId,
      p_domain: domain,
      p_verification_type: verificationType
    });

    if (error) throw error;
    return data as unknown as DomainVerificationInstructions;
  }

  // التحقق من الدومين
  async verifyDomain(verificationId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_domain', {
      p_verification_id: verificationId
    });

    if (error) throw error;
    return data;
  }

  // الحصول على تحققات الدومين لمؤسسة
  async getDomainVerifications(tenantId: string): Promise<DomainVerification[]> {
    const { data, error } = await supabase
      .from('domain_verifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // الحصول على شهادات SSL لمؤسسة
  async getSSLCertificates(tenantId: string): Promise<SSLCertificate[]> {
    const { data, error } = await supabase
      .from('ssl_certificates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // حذف تحقق الدومين
  async deleteDomainVerification(verificationId: string): Promise<void> {
    const { error } = await supabase
      .from('domain_verifications')
      .delete()
      .eq('id', verificationId);

    if (error) throw error;
  }

  // تحديث الدومين في المؤسسة
  async updateTenantDomain(tenantId: string, domain: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ domain })
      .eq('id', tenantId);

    if (error) throw error;
  }

  // إزالة الدومين من المؤسسة
  async removeTenantDomain(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ domain: null })
      .eq('id', tenantId);

    if (error) throw error;
  }

  // التحقق من صحة الدومين
  static validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  // الحصول على حالة الدومين
  async getDomainStatus(tenantId: string, domain: string): Promise<{
    verification?: DomainVerification;
    ssl?: SSLCertificate;
    isActive: boolean;
  }> {
    const [verifications, certificates] = await Promise.all([
      this.getDomainVerifications(tenantId),
      this.getSSLCertificates(tenantId)
    ]);

    const verification = verifications.find(v => v.domain === domain);
    const ssl = certificates.find(c => c.domain === domain);
    const isActive = verification?.verified && ssl?.status === 'active';

    return {
      verification,
      ssl,
      isActive
    };
  }
}

export const domainService = new DomainService();