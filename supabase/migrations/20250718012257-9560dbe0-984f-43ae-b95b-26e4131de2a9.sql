-- تصحيح خطط الاشتراك لتطابق الكود
UPDATE public.subscription_plans 
SET 
    max_users_per_tenant = 10,
    max_vehicles = 50,
    max_contracts = 100,
    price_monthly = 29.999,
    price_yearly = 299.990
WHERE plan_code = 'basic';

UPDATE public.subscription_plans 
SET 
    max_users_per_tenant = 25,
    max_vehicles = 100,
    max_contracts = 250,
    price_monthly = 49.999,
    price_yearly = 499.990
WHERE plan_code = 'standard';

UPDATE public.subscription_plans 
SET 
    max_users_per_tenant = 50,
    max_vehicles = 200,
    max_contracts = 500,
    price_monthly = 79.999,
    price_yearly = 799.990
WHERE plan_code = 'premium';

UPDATE public.subscription_plans 
SET 
    max_users_per_tenant = 100,
    max_vehicles = 500,
    max_contracts = 1000,
    price_monthly = 149.999,
    price_yearly = 1499.990
WHERE plan_code = 'enterprise';