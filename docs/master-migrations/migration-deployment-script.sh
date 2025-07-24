#!/bin/bash

# ===============================================
# Migration Consolidation Deployment Script
# سكريبت نشر دمج ملفات الهجرة
# ===============================================

echo "🚀 بدء عملية دمج ملفات الهجرة..."

# التحقق من وجود psql
if ! command -v psql &> /dev/null; then
    echo "❌ خطأ: psql غير مثبت. يرجى تثبيت PostgreSQL client."
    exit 1
fi

# قراءة متغيرات البيئة أو استخدام القيم الافتراضية
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:your-password@localhost:5432/your-database"}

echo "📋 التحقق من الاتصال بقاعدة البيانات..."
if ! psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
    echo "❌ خطأ: لا يمكن الاتصال بقاعدة البيانات"
    echo "تأكد من صحة DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo "✅ تم التحقق من الاتصال بقاعدة البيانات"

# النسخ الاحتياطي
echo "💾 إنشاء نسخة احتياطية..."
backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$backup_file"
echo "✅ تم إنشاء النسخة الاحتياطية: $backup_file"

# تطبيق ملفات الـ master بالترتيب
echo "📊 تطبيق Master Migration 001: Essential Indexes..."
if psql "$DATABASE_URL" -f "docs/master-migrations/master-001-create-essential-indexes.sql"; then
    echo "✅ تم تطبيق ملف الفهارس بنجاح"
else
    echo "❌ خطأ في تطبيق ملف الفهارس"
    exit 1
fi

echo "🔐 تطبيق Master Migration 002: Security Functions..."
if psql "$DATABASE_URL" -f "docs/master-migrations/master-002-security-functions.sql"; then
    echo "✅ تم تطبيق ملف الأمان بنجاح"
else
    echo "❌ خطأ في تطبيق ملف الأمان"
    exit 1
fi

echo "💰 تطبيق Master Migration 003: Accounting Functions..."
if psql "$DATABASE_URL" -f "docs/master-migrations/master-003-accounting-functions.sql"; then
    echo "✅ تم تطبيق ملف المحاسبة بنجاح"
else
    echo "❌ خطأ في تطبيق ملف المحاسبة"
    exit 1
fi

# التحقق من التطبيق
echo "🔍 التحقق من صحة التطبيق..."

echo "📊 التحقق من الفهارس..."
psql "$DATABASE_URL" -c "SELECT * FROM public.get_query_performance_stats() LIMIT 5;"

echo "🔐 التحقق من الأمان..."
psql "$DATABASE_URL" -c "SELECT * FROM public.security_audit_report();"

echo "💰 التحقق من الدوال المحاسبية..."
psql "$DATABASE_URL" -c "
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'log_transaction', 
    'generate_journal_entry_number',
    'create_contract_accounting_entry',
    'create_payment_accounting_entry'
);"

echo ""
echo "🎉 تم دمج ملفات الهجرة بنجاح!"
echo ""
echo "📈 الإحصائيات:"
echo "   ✅ 3 ملفات master تم تطبيقها"
echo "   ✅ تم إنشاء الفهارس الأساسية"
echo "   ✅ تم إعداد دوال الأمان"
echo "   ✅ تم إعداد الدوال المحاسبية"
echo ""
echo "⚠️  الخطوات التالية:"
echo "   1. راجع النتائج أعلاه للتأكد من عدم وجود أخطاء"
echo "   2. اختبر الوظائف الأساسية للنظام"
echo "   3. إذا كان كل شيء يعمل بشكل صحيح، يمكنك حذف ملفات الهجرة القديمة"
echo ""
echo "💾 النسخة الاحتياطية محفوظة في: $backup_file"