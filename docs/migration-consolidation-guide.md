# دليل دمج ملفات الهجرة (Migration Consolidation Guide)

## نظرة عامة
تم دمج أكثر من 80 ملف migration إلى 3 ملفات رئيسية لتحسين إدارة قاعدة البيانات وتسهيل الصيانة.

## الملفات الرئيسية الجديدة

### 1. master-001-create-essential-indexes.sql
**الغرض:** جميع فهارس الأداء والاستعلامات المحسنة
**يحتوي على:**
- فهارس جدول العقود (contracts)
- فهارس جدول المدفوعات (payments) 
- فهارس جدول الفواتير (invoices)
- فهارس جدول المركبات (vehicles)
- فهارس جدول العملاء (customers)
- فهارس جدول الموظفين (employees)
- دالة مراقبة أداء الاستعلامات

### 2. master-002-security-functions.sql
**الغرض:** جميع دوال الأمان وإدارة الأدوار
**يحتوي على:**
- تعريف user_role enum
- جدول tenant_user_roles
- دوال الأمان الأساسية
- سياسات RLS للحماية
- دالة تدقيق الأمان

### 3. master-003-accounting-functions.sql
**الغرض:** جميع الدوال المحاسبية والمالية
**يحتوي على:**
- دالة log_transaction المدمجة
- دالة توليد أرقام القيود
- دالة قيود العقود
- دالة قيود المدفوعات
- دالة قيود الحضور

## الملفات الجديدة المدمجة

### 📂 مجلد الملفات المدمجة
تم إنشاء الملفات المدمجة في: `docs/master-migrations/`

### ✅ الملفات المتوفرة
- `master-001-create-essential-indexes.sql` - جميع الفهارس الأساسية
- `master-002-security-functions.sql` - دوال الأمان والأدوار
- `master-003-accounting-functions.sql` - الدوال المحاسبية الشاملة  
- `migration-deployment-script.sh` - سكريبت النشر الآلي

## الملفات المستبعدة

### ملفات الفهارس (تم دمجها في master-001)
```
20250723175747-321bf17b-b1ba-452a-91eb-eff3f6a7b0a2.sql
20250723175832-c17d9228-19ea-4027-a681-6abb6199c996.sql
20250723175900-84280388-2a02-4322-a227-5bc99d79ff4d.sql
```

### ملفات الأمان (تم دمجها في master-002)
```
20250723171734-99d2b36b-f933-4276-a50b-8de3da9e409f.sql
20250723172109-a9e0f2c5-8426-4065-bfb8-c877cfbff30d.sql
20250723172337-07be6437-676f-4ebd-a0ae-6da650d57de4.sql
20250723173244-c1d63833-7698-4c3a-a094-f49cc8f9a945.sql
20250723173456-dd678057-fb37-42b8-89c8-7efe70ed42ff.sql
```

### ملفات المحاسبة (تم دمجها في master-003)
```
20250707040113-d6984b4e-3145-42f4-b9c5-a4da8f1ef23e.sql
20250707042754-7da4e366-4b98-495b-a38f-e0c69c86f83c.sql
20250707050649-66db3223-bfbc-47d9-a59d-ca7373abd769.sql
20250706141041-24b5a44c-083c-4a4a-a1b2-341218826537.sql
20250706141259-2b5748a1-67ea-4d2d-8073-ac007ef01fd6.sql
20250706141556-c0518575-f33d-4130-ae2d-c15bdce9bc78.sql
```

## خطوات التطبيق

### 1. الطريقة الآلية (مستحسنة)
```bash
# تشغيل سكريبت النشر الآلي
chmod +x docs/master-migrations/migration-deployment-script.sh
DATABASE_URL="your_database_url" ./docs/master-migrations/migration-deployment-script.sh
```

### 2. الطريقة اليدوية
```bash
# النسخ الاحتياطي
pg_dump your_database > backup_before_consolidation.sql

# تطبيق ملفات الـ master بالترتيب
psql -d your_database -f docs/master-migrations/master-001-create-essential-indexes.sql
psql -d your_database -f docs/master-migrations/master-002-security-functions.sql
psql -d your_database -f docs/master-migrations/master-003-accounting-functions.sql
```

### 3. التحقق من التطبيق
```sql
-- التحقق من الفهارس
SELECT * FROM public.get_query_performance_stats();

-- التحقق من الأمان
SELECT * FROM public.security_audit_report();

-- التحقق من الدوال المحاسبية
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%accounting%';
```

### 4. حذف الملفات المستبعدة
```bash
# حذف الملفات القديمة (بعد التأكد من نجاح التطبيق)
rm supabase/migrations/20250723175747-*.sql
rm supabase/migrations/20250723175832-*.sql
# ... باقي الملفات
```

## الفوائد

### ✅ تحسينات الأداء
- تقليل من 80+ ملف إلى 3 ملفات رئيسية
- تسريع عملية النشر (deployment)
- تسهيل إدارة التبعيات

### ✅ تحسينات الصيانة
- كود أكثر تنظيماً
- سهولة التتبع والتصحيح
- إزالة التكرار

### ✅ تحسينات التطوير
- فهم أسرع للنظام
- تطوير أسهل للميزات الجديدة
- اختبار أبسط

## إرشادات المستقبل

### للملفات الجديدة
1. استخدم التصنيف الوظيفي (functional categorization)
2. ادمج الملفات المترابطة
3. تجنب التكرار
4. اكتب وثائق واضحة

### لإدارة الهجرة
1. راجع الملفات دورياً (كل 3 أشهر)
2. ادمج الملفات المتشابهة
3. احتفظ بسجل التغييرات
4. اختبر قبل النشر

## المساعدة والدعم
- للمشاكل التقنية: راجع سجلات قاعدة البيانات
- للاستفسارات: استخدم دالة security_audit_report()
- للمراقبة: استخدم دالة get_query_performance_stats()