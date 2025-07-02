-- إضافة أعمدة تخزين بيانات الأضرار للمركبات
ALTER TABLE contracts 
ADD COLUMN pickup_damages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN return_damages JSONB DEFAULT '[]'::jsonb;

-- إضافة تعليق على الأعمدة الجديدة
COMMENT ON COLUMN contracts.pickup_damages IS 'أضرار المركبة عند التسليم بصيغة JSON';
COMMENT ON COLUMN contracts.return_damages IS 'أضرار المركبة عند الاستلام بصيغة JSON';