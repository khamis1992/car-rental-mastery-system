-- Phase 1: White-label Database Schema Enhancement

-- Add tenant_id to company_branding table
ALTER TABLE public.company_branding 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_company_branding_tenant_id ON public.company_branding(tenant_id);

-- Create tenant_themes table for UI customization
CREATE TABLE IF NOT EXISTS public.tenant_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL DEFAULT 'default',
  
  -- Color scheme
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#64748b', 
  accent_color TEXT DEFAULT '#f59e0b',
  background_color TEXT DEFAULT '#ffffff',
  surface_color TEXT DEFAULT '#f8fafc',
  text_primary TEXT DEFAULT '#1e293b',
  text_secondary TEXT DEFAULT '#64748b',
  
  -- Brand colors
  success_color TEXT DEFAULT '#10b981',
  warning_color TEXT DEFAULT '#f59e0b',
  error_color TEXT DEFAULT '#ef4444',
  info_color TEXT DEFAULT '#3b82f6',
  
  -- Typography
  font_family TEXT DEFAULT 'Inter',
  font_size_base TEXT DEFAULT '16px',
  font_weight_base TEXT DEFAULT '400',
  
  -- Layout
  border_radius TEXT DEFAULT '8px',
  spacing_unit TEXT DEFAULT '4px',
  
  -- Custom CSS variables
  custom_css JSONB DEFAULT '{}',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(tenant_id, theme_name)
);

-- Create tenant_domains table for custom domain management
CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  subdomain TEXT,
  
  -- Domain verification
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT,
  verification_method TEXT DEFAULT 'dns' CHECK (verification_method IN ('dns', 'file', 'cname')),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- SSL configuration  
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  ssl_certificate_id TEXT,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Domain settings
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  redirect_to_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create tenant_assets table for file management
CREATE TABLE IF NOT EXISTS public.tenant_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Asset information
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'header_image', 'footer_image', 'background', 'email_template', 'pdf_template', 'custom')),
  asset_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Asset metadata
  alt_text TEXT,
  description TEXT,
  usage_context JSONB DEFAULT '{}', -- Where this asset is used
  
  -- Versioning
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  parent_asset_id UUID REFERENCES public.tenant_assets(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(tenant_id, asset_type, asset_name, version)
);

-- Create tenant_customizations table for advanced UI/UX settings
CREATE TABLE IF NOT EXISTS public.tenant_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Navigation customization
  navigation_style TEXT DEFAULT 'sidebar' CHECK (navigation_style IN ('sidebar', 'topbar', 'hybrid')),
  navigation_collapsed BOOLEAN DEFAULT false,
  navigation_items JSONB DEFAULT '[]',
  
  -- Dashboard layout
  dashboard_layout TEXT DEFAULT 'grid' CHECK (dashboard_layout IN ('grid', 'list', 'cards')),
  dashboard_widgets JSONB DEFAULT '[]',
  
  -- Features toggle
  enabled_features JSONB DEFAULT '{}',
  disabled_features JSONB DEFAULT '{}',
  
  -- Custom pages
  custom_pages JSONB DEFAULT '[]',
  
  -- Email templates
  email_templates JSONB DEFAULT '{}',
  
  -- Language & localization
  default_language TEXT DEFAULT 'ar',
  supported_languages JSONB DEFAULT '["ar", "en"]',
  rtl_enabled BOOLEAN DEFAULT true,
  
  -- Custom scripts and styles
  custom_head_scripts TEXT,
  custom_body_scripts TEXT,
  custom_css TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure one customization per tenant
  UNIQUE(tenant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_themes_tenant_id ON public.tenant_themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_themes_active ON public.tenant_themes(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON public.tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_assets_tenant_id ON public.tenant_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_assets_type ON public.tenant_assets(tenant_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_tenant_customizations_tenant_id ON public.tenant_customizations(tenant_id);

-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for tenant_themes
ALTER TABLE public.tenant_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view themes in their tenant"
ON public.tenant_themes FOR SELECT
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage themes"
ON public.tenant_themes FOR ALL
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Create RLS policies for tenant_domains  
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view domains in their tenant"
ON public.tenant_domains FOR SELECT
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage domains"
ON public.tenant_domains FOR ALL
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Create RLS policies for tenant_assets
ALTER TABLE public.tenant_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets in their tenant"
ON public.tenant_assets FOR SELECT
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage assets"
ON public.tenant_assets FOR ALL
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Create RLS policies for tenant_customizations
ALTER TABLE public.tenant_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customizations in their tenant"
ON public.tenant_customizations FOR SELECT
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage customizations"
ON public.tenant_customizations FOR ALL
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Create storage policies for tenant assets
CREATE POLICY "Tenant users can view their assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets' AND (storage.foldername(name))[1] = get_current_tenant_id()::text);

CREATE POLICY "Tenant admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tenant-assets' AND (storage.foldername(name))[1] = get_current_tenant_id()::text AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "Tenant admins can update assets" 
ON storage.objects FOR UPDATE
USING (bucket_id = 'tenant-assets' AND (storage.foldername(name))[1] = get_current_tenant_id()::text AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "Tenant admins can delete assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'tenant-assets' AND (storage.foldername(name))[1] = get_current_tenant_id()::text AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Update company_branding RLS policies to be tenant-aware
DROP POLICY IF EXISTS "Everyone can view company branding" ON public.company_branding;
DROP POLICY IF EXISTS "Admins and managers can manage company branding" ON public.company_branding;

CREATE POLICY "Users can view branding in their tenant"
ON public.company_branding FOR SELECT
USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage branding"
ON public.company_branding FOR ALL
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Create trigger to auto-set tenant_id
CREATE OR REPLACE FUNCTION public.set_tenant_id_for_branding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := get_current_tenant_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenant_id_branding_trigger
  BEFORE INSERT ON public.company_branding
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_for_branding();

-- Create functions for theme management
CREATE OR REPLACE FUNCTION public.get_tenant_theme(p_tenant_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_uuid UUID;
  theme_data JSONB;
BEGIN
  tenant_uuid := COALESCE(p_tenant_id, get_current_tenant_id());
  
  SELECT row_to_json(t)::jsonb INTO theme_data
  FROM public.tenant_themes t
  WHERE t.tenant_id = tenant_uuid 
  AND t.is_active = true
  ORDER BY t.is_default DESC, t.created_at DESC
  LIMIT 1;
  
  -- Return default theme if none found
  IF theme_data IS NULL THEN
    theme_data := jsonb_build_object(
      'primary_color', '#2563eb',
      'secondary_color', '#64748b',
      'accent_color', '#f59e0b',
      'background_color', '#ffffff',
      'surface_color', '#f8fafc',
      'text_primary', '#1e293b',
      'text_secondary', '#64748b'
    );
  END IF;
  
  RETURN theme_data;
END;
$$;