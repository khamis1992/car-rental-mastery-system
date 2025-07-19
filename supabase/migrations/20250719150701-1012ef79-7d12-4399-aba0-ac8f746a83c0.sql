
-- إعادة تنشيط جميع مراكز التكلفة
UPDATE public.cost_centers 
SET is_active = true, 
    updated_at = now() 
WHERE is_active = false;
