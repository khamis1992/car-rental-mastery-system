-- إضافة قيمة super_admin لنوع user_role فقط
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';