-- Step 1: Associate the current admin user with the existing tenant
DO $$
DECLARE
    admin_user_id UUID;
    existing_tenant_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com' 
    LIMIT 1;
    
    -- Get the first available tenant
    SELECT id INTO existing_tenant_id 
    FROM public.tenants 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Associate the admin user with the tenant if both exist
    IF admin_user_id IS NOT NULL AND existing_tenant_id IS NOT NULL THEN
        INSERT INTO public.tenant_users (
            tenant_id,
            user_id,
            role,
            status,
            joined_at
        ) VALUES (
            existing_tenant_id,
            admin_user_id,
            'super_admin',
            'active',
            now()
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET
            role = 'super_admin',
            status = 'active',
            updated_at = now();
            
        RAISE NOTICE 'Associated user % with tenant %', admin_user_id, existing_tenant_id;
    ELSE
        RAISE NOTICE 'Admin user or tenant not found';
    END IF;
END $$;

-- Step 2: Create function to automatically associate new users with default tenant
CREATE OR REPLACE FUNCTION public.handle_new_user_tenant_association()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get the first available tenant as default
    SELECT id INTO default_tenant_id 
    FROM public.tenants 
    WHERE status = 'active'
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If we have a default tenant, associate the new user
    IF default_tenant_id IS NOT NULL THEN
        INSERT INTO public.tenant_users (
            tenant_id,
            user_id,
            role,
            status,
            joined_at
        ) VALUES (
            default_tenant_id,
            NEW.id,
            'user', -- Default role for new users
            'active',
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically associate new users
DROP TRIGGER IF EXISTS on_auth_user_created_tenant_association ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant_association
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_tenant_association();