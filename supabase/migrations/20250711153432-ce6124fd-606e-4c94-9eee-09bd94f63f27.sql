-- Add domain verification and SSL management tables
CREATE TABLE IF NOT EXISTS public.domain_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_type TEXT NOT NULL DEFAULT 'dns', -- 'dns', 'txt', 'cname'
  verification_value TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  dns_records JSONB,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

CREATE TABLE IF NOT EXISTS public.ssl_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  certificate_data TEXT,
  private_key_data TEXT,
  chain_data TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  last_renewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'failed'
  provider TEXT NOT NULL DEFAULT 'letsencrypt',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

-- Enable RLS
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssl_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for domain_verifications
CREATE POLICY "Super admins can manage domain verifications"
ON public.domain_verifications
FOR ALL
TO authenticated
USING (has_any_tenant_role(ARRAY['super_admin'::text]));

CREATE POLICY "Tenant admins can manage their domain verifications"
ON public.domain_verifications
FOR ALL
TO authenticated
USING (tenant_id IN (
  SELECT tenant_id FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND role IN ('tenant_admin', 'manager')
  AND status = 'active'
));

-- Create RLS policies for ssl_certificates
CREATE POLICY "Super admins can manage SSL certificates"
ON public.ssl_certificates
FOR ALL
TO authenticated
USING (has_any_tenant_role(ARRAY['super_admin'::text]));

CREATE POLICY "Tenant admins can view their SSL certificates"
ON public.ssl_certificates
FOR SELECT
TO authenticated
USING (tenant_id IN (
  SELECT tenant_id FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND role IN ('tenant_admin', 'manager')
  AND status = 'active'
));

-- Function to generate domain verification token
CREATE OR REPLACE FUNCTION public.generate_domain_verification_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'saptco-verify-' || substr(md5(random()::text), 1, 16);
END;
$$;

-- Function to initiate domain verification
CREATE OR REPLACE FUNCTION public.initiate_domain_verification(
  p_tenant_id UUID,
  p_domain TEXT,
  p_verification_type TEXT DEFAULT 'dns'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_token TEXT;
  verification_record RECORD;
BEGIN
  -- Generate verification token
  verification_token := public.generate_domain_verification_token();
  
  -- Insert or update domain verification
  INSERT INTO public.domain_verifications (
    tenant_id,
    domain,
    verification_type,
    verification_value,
    expires_at
  ) VALUES (
    p_tenant_id,
    p_domain,
    p_verification_type,
    verification_token,
    now() + interval '30 days'
  )
  ON CONFLICT (tenant_id, domain)
  DO UPDATE SET
    verification_type = EXCLUDED.verification_type,
    verification_value = EXCLUDED.verification_value,
    verified = false,
    verified_at = NULL,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING * INTO verification_record;
  
  -- Return verification instructions
  RETURN json_build_object(
    'id', verification_record.id,
    'domain', verification_record.domain,
    'verification_type', verification_record.verification_type,
    'verification_value', verification_record.verification_value,
    'instructions', CASE 
      WHEN p_verification_type = 'dns' THEN 
        json_build_object(
          'type', 'TXT',
          'name', '_saptco-verification',
          'value', verification_record.verification_value,
          'description', 'إضافة سجل TXT في إعدادات DNS الخاص بالدومين'
        )
      WHEN p_verification_type = 'cname' THEN
        json_build_object(
          'type', 'CNAME',
          'name', 'www',
          'value', 'app.saptcogulf.com',
          'description', 'إضافة سجل CNAME في إعدادات DNS الخاص بالدومين'
        )
      ELSE
        json_build_object(
          'description', 'تحقق يدوي من الدومين'
        )
    END,
    'expires_at', verification_record.expires_at
  );
END;
$$;

-- Function to verify domain
CREATE OR REPLACE FUNCTION public.verify_domain(p_verification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  is_verified BOOLEAN := false;
BEGIN
  -- Get verification record
  SELECT * INTO verification_record
  FROM public.domain_verifications
  WHERE id = p_verification_id
  AND expires_at > now();
  
  IF verification_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- For now, mark as verified (in production, this would check DNS)
  -- In a real implementation, you'd make DNS queries here
  is_verified := true;
  
  IF is_verified THEN
    -- Update verification status
    UPDATE public.domain_verifications
    SET 
      verified = true,
      verified_at = now(),
      last_checked_at = now(),
      updated_at = now()
    WHERE id = p_verification_id;
    
    -- Update tenant domain
    UPDATE public.tenants
    SET 
      domain = verification_record.domain,
      updated_at = now()
    WHERE id = verification_record.tenant_id;
    
    -- Initialize SSL certificate provisioning
    INSERT INTO public.ssl_certificates (
      tenant_id,
      domain,
      status
    ) VALUES (
      verification_record.tenant_id,
      verification_record.domain,
      'pending'
    )
    ON CONFLICT (tenant_id, domain) 
    DO UPDATE SET 
      status = 'pending',
      updated_at = now();
  END IF;
  
  RETURN is_verified;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_verifications_tenant_domain 
ON public.domain_verifications(tenant_id, domain);

CREATE INDEX IF NOT EXISTS idx_domain_verifications_expires_at 
ON public.domain_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_ssl_certificates_tenant_domain 
ON public.ssl_certificates(tenant_id, domain);

CREATE INDEX IF NOT EXISTS idx_ssl_certificates_expires_at 
ON public.ssl_certificates(expires_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domain_verifications_updated_at
  BEFORE UPDATE ON public.domain_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ssl_certificates_updated_at
  BEFORE UPDATE ON public.ssl_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();