-- Clean up admin@admin.com tenant associations - more specific approach
-- First, let's see what we're working with
DO $$
DECLARE
    admin_user_id uuid;
    bashayer_tenant_id uuid;
    stars_tenant_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com';
    
    -- Get the البشائر الخليجية tenant ID (the one that's not default)
    SELECT id INTO bashayer_tenant_id 
    FROM public.tenants 
    WHERE name = 'البشائر الخليجية' 
    AND id != '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid
    LIMIT 1;
    
    -- Remove association with البشائر الخليجية if exists
    IF bashayer_tenant_id IS NOT NULL THEN
        DELETE FROM public.tenant_users 
        WHERE user_id = admin_user_id
        AND tenant_id = bashayer_tenant_id;
        
        RAISE NOTICE 'Removed association with البشائر الخليجية';
    END IF;
    
    -- Get شركة النجوم tenant ID
    SELECT id INTO stars_tenant_id 
    FROM public.tenants 
    WHERE name = 'شركة النجوم'
    LIMIT 1;
    
    -- Clean up duplicate associations with شركة النجوم (keep only super_admin)
    IF stars_tenant_id IS NOT NULL THEN
        DELETE FROM public.tenant_users 
        WHERE user_id = admin_user_id
        AND tenant_id = stars_tenant_id
        AND role != 'super_admin';
        
        -- Ensure admin has super_admin role with شركة النجوم
        UPDATE public.tenant_users 
        SET role = 'super_admin', status = 'active'
        WHERE user_id = admin_user_id
        AND tenant_id = stars_tenant_id;
        
        RAISE NOTICE 'Cleaned up شركة النجوم associations';
    END IF;
    
    -- Ensure admin@admin.com has super_admin role with default tenant
    INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
    VALUES (admin_user_id, '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid, 'super_admin', 'active', now())
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET role = 'super_admin', status = 'active';
    
    RAISE NOTICE 'Ensured super_admin role with default tenant';
END;
$$;