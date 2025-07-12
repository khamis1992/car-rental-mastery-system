UPDATE landing_page_content 
SET content_value = '{"ar": "ابدأ الآن", "en": "Get Started"}'::jsonb,
    updated_at = now(),
    updated_by = auth.uid()
WHERE section_name = 'hero' AND content_key = 'cta_text';