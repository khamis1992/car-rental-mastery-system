-- Fix create_tenant_with_admin function to properly link super_admin to new tenant
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  tenant_data jsonb, 
  admin_user_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id UUID;
  current_user_id UUID;
  tenant_record RECORD;
BEGIN
  -- Get current user
  current_user_id := COALESCE(admin_user_id, auth.uid());
  
  -- Validate required fields
  IF NOT (tenant_data ? 'name') OR (tenant_data->>'name') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'اسم المؤسسة مطلوب');
  END IF;
  
  IF NOT (tenant_data ? 'slug') OR (tenant_data->>'slug') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'المعرف الفريد مطلوب');
  END IF;
  
  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_data->>'slug') THEN
    RETURN jsonb_build_object('success', false, 'error', 'هذا المعرف مستخدم بالفعل');
  END IF;
  
  -- Create the tenant
  INSERT INTO public.tenants (
    name,
    slug,
    contact_email,
    contact_phone,
    address,
    city,
    country,
    timezone,
    currency,
    subscription_plan,
    status,
    max_users,
    max_vehicles,
    max_contracts
  ) VALUES (
    tenant_data->>'name',
    tenant_data->>'slug',
    tenant_data->>'contact_email',
    tenant_data->>'contact_phone',
    tenant_data->>'address',
    tenant_data->>'city',
    COALESCE(tenant_data->>'country', 'Kuwait'),
    COALESCE(tenant_data->>'timezone', 'Asia/Kuwait'),
    COALESCE(tenant_data->>'currency', 'KWD'),
    COALESCE(tenant_data->>'subscription_plan', 'standard'),
    COALESCE(tenant_data->>'status', 'trial'),
    COALESCE((tenant_data->>'max_users')::integer, 25),
    COALESCE((tenant_data->>'max_vehicles')::integer, 100),
    COALESCE((tenant_data->>'max_contracts')::integer, 250)
  ) RETURNING id INTO new_tenant_id;
  
  -- If current user is super_admin, link them to the new tenant
  IF EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = current_user_id 
    AND role = 'super_admin' 
    AND status = 'active'
  ) THEN
    -- Link super_admin to new tenant with super_admin role
    INSERT INTO public.tenant_users (
      tenant_id,
      user_id,
      role,
      status,
      joined_at
    ) VALUES (
      new_tenant_id,
      current_user_id,
      'super_admin',
      'active',
      now()
    );
  ELSE
    -- Create tenant_admin relationship for regular users
    INSERT INTO public.tenant_users (
      tenant_id,
      user_id,
      role,
      status,
      joined_at
    ) VALUES (
      new_tenant_id,
      current_user_id,
      'tenant_admin',
      'active',
      now()
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'tenant_id', new_tenant_id,
    'message', 'تم إنشاء المؤسسة بنجاح'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM,
    'debug_info', jsonb_build_object(
      'current_user', current_user_id,
      'tenant_data', tenant_data
    )
  );
END;
$$;