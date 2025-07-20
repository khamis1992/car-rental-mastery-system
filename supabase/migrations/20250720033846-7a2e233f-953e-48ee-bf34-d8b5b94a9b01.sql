
-- إضافة حقول مرجعية محسنة لربط القيود بالوحدات المختلفة
ALTER TABLE journal_entry_lines 
ADD COLUMN IF NOT EXISTS reference_id uuid,
ADD COLUMN IF NOT EXISTS reference_type text;

-- إضافة حقول للوصف التفصيلي والمتابعة
ALTER TABLE journal_entry_lines
ADD COLUMN IF NOT EXISTS detailed_description text,
ADD COLUMN IF NOT EXISTS contract_reference text,
ADD COLUMN IF NOT EXISTS invoice_reference text,
ADD COLUMN IF NOT EXISTS asset_reference text;

-- إنشاء جدول للروابط المتقدمة بين الوحدات
CREATE TABLE IF NOT EXISTS module_cross_references (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    source_module text NOT NULL,
    source_id uuid NOT NULL,
    target_module text NOT NULL,
    target_id uuid NOT NULL,
    relationship_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    notes text,
    is_active boolean DEFAULT true
);

-- إضافة RLS للجدول الجديد
ALTER TABLE module_cross_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_module_cross_references" ON module_cross_references
FOR ALL USING (tenant_id = get_current_tenant_id());

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_reference 
ON journal_entry_lines (reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_module_cross_references_source 
ON module_cross_references (source_module, source_id);

CREATE INDEX IF NOT EXISTS idx_module_cross_references_target 
ON module_cross_references (target_module, target_id);

-- إضافة دالة للحصول على المراجع المرتبطة
CREATE OR REPLACE FUNCTION get_related_modules(
    module_name text,
    entity_id uuid
) RETURNS TABLE(
    related_module text,
    related_id uuid,
    relationship_type text,
    notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mcr.target_module,
        mcr.target_id,
        mcr.relationship_type,
        mcr.notes
    FROM module_cross_references mcr
    WHERE mcr.source_module = module_name 
    AND mcr.source_id = entity_id
    AND mcr.is_active = true
    AND mcr.tenant_id = get_current_tenant_id()
    
    UNION
    
    SELECT 
        mcr.source_module,
        mcr.source_id,
        mcr.relationship_type,
        mcr.notes
    FROM module_cross_references mcr
    WHERE mcr.target_module = module_name 
    AND mcr.target_id = entity_id
    AND mcr.is_active = true
    AND mcr.tenant_id = get_current_tenant_id();
END;
$$;
