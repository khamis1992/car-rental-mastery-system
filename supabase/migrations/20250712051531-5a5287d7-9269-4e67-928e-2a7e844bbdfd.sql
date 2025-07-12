-- Fix the create_tenant_with_admin function to remove reference to non-existent description column
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(tenant_data jsonb, admin_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
  admin_id uuid;
  result jsonb;
BEGIN
  -- Validate required fields
  IF tenant_data->>'name' IS NULL OR trim(tenant_data->>'name') = '' THEN
    RAISE EXCEPTION 'اسم المؤسسة مطلوب';
  END IF;
  
  IF tenant_data->>'slug' IS NULL OR trim(tenant_data->>'slug') = '' THEN
    RAISE EXCEPTION 'رمز المؤسسة مطلوب';
  END IF;
  
  -- Check if slug is already taken
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_data->>'slug') THEN
    RAISE EXCEPTION 'رمز المؤسسة مستخدم بالفعل';
  END IF;
  
  -- Use provided admin_user_id or current user
  admin_id := COALESCE(admin_user_id, auth.uid());
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'معرف المستخدم مطلوب';
  END IF;
  
  -- Create the tenant (removed description column reference)
  INSERT INTO public.tenants (
    name,
    slug,
    status,
    subscription_tier,
    created_by
  ) VALUES (
    tenant_data->>'name',
    tenant_data->>'slug',
    COALESCE(tenant_data->>'status', 'active'),
    COALESCE(tenant_data->>'subscription_tier', 'basic'),
    admin_id
  ) RETURNING id INTO new_tenant_id;
  
  -- Create tenant_user relationship with tenant_admin role
  INSERT INTO public.tenant_users (
    tenant_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    new_tenant_id,
    admin_id,
    'tenant_admin',
    'active',
    now()
  );
  
  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'message', 'تم إنشاء المؤسسة بنجاح'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'فشل في إنشاء المؤسسة'
    );
    RETURN result;
END;
$$;