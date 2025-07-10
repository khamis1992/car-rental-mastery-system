# 🧪 قائمة الاختبار الشاملة - نظام SaaS المحسن

## 📋 نظرة عامة

هذه قائمة فحص شاملة للتأكد من أن جميع مكونات نظام SaaS تعمل بشكل صحيح بعد التحسينات الجديدة.

---

## ✅ المرحلة الأولى: اختبار قاعدة البيانات

### 1. 🗄️ التحقق من البنية الجديدة

#### الجداول الرئيسية:
- [ ] `subscription_plans` - تم إنشاؤها بنجاح
- [ ] `saas_subscriptions` - تم إنشاؤها بنجاح  
- [ ] `saas_invoices` - تم إنشاؤها بنجاح
- [ ] `saas_payments` - تم إنشاؤها بنجاح
- [ ] `tenant_usage` - تم إنشاؤها بنجاح
- [ ] `saas_invoice_items` - تم إنشاؤها بنجاح

#### التحقق من الجداول:
```sql
-- فحص وجود الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'saas_%' 
  OR table_name IN ('subscription_plans', 'tenant_usage');
```

### 2. 🔗 التحقق من العلاقات

#### Foreign Keys:
- [ ] `saas_subscriptions.tenant_id` → `tenants.id`
- [ ] `saas_subscriptions.plan_id` → `subscription_plans.id`
- [ ] `saas_invoices.subscription_id` → `saas_subscriptions.id`
- [ ] `saas_invoices.tenant_id` → `tenants.id`
- [ ] `saas_payments.invoice_id` → `saas_invoices.id`
- [ ] `saas_invoice_items.invoice_id` → `saas_invoices.id`

```sql
-- فحص العلاقات
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name LIKE 'saas_%';
```

### 3. 📊 التحقق من الفهارس

#### الفهارس المطلوبة:
- [ ] `idx_subscription_plans_active`
- [ ] `idx_saas_subscriptions_tenant`
- [ ] `idx_saas_subscriptions_billing_date`
- [ ] `idx_saas_invoices_subscription`
- [ ] `idx_saas_invoices_due_date`
- [ ] `idx_saas_payments_invoice`
- [ ] `idx_tenant_usage_tenant_date`

```sql
-- فحص الفهارس
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (tablename LIKE 'saas_%' OR tablename IN ('subscription_plans', 'tenant_usage'))
ORDER BY tablename, indexname;
```

### 4. 🔒 التحقق من الأمان (RLS)

#### Row Level Security:
- [ ] `subscription_plans` - RLS مفعل
- [ ] `saas_subscriptions` - RLS مفعل
- [ ] `saas_invoices` - RLS مفعل
- [ ] `saas_payments` - RLS مفعل
- [ ] `tenant_usage` - RLS مفعل

```sql
-- فحص RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE 'saas_%' OR tablename IN ('subscription_plans', 'tenant_usage'));
```

### 5. ⚙️ التحقق من الدوال

#### الدوال المطلوبة:
- [ ] `generate_saas_invoice_number()`
- [ ] `get_optimized_billing_stats()`
- [ ] `get_upcoming_renewals()`
- [ ] `get_overdue_invoices_detailed()`
- [ ] `calculate_churn_rate()`
- [ ] `get_plan_analytics()`
- [ ] `calculate_tenant_usage()`
- [ ] `update_tenant_usage_stats()`

```sql
-- فحص الدوال
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%saas%' 
  OR routine_name LIKE '%billing%'
  OR routine_name LIKE '%churn%'
  OR routine_name LIKE '%tenant_usage%';
```

---

## ✅ المرحلة الثانية: اختبار الخدمات

### 1. 🔧 اختبار EnhancedSaasService

#### خطط الاشتراك:
```typescript
// اختبار جلب الخطط
const plans = await enhancedSaasService.getSubscriptionPlans();
console.log('✅ جلب خطط الاشتراك:', plans.length > 0);

// اختبار إنشاء خطة
const newPlan = await enhancedSaasService.createSubscriptionPlan({
  plan_name: 'خطة الاختبار',
  plan_code: 'TEST_PLAN',
  price_monthly: 50.00,
  price_yearly: 500.00,
  max_users_per_tenant: 10,
  max_vehicles: 25,
  max_contracts: 100,
  storage_limit_gb: 5,
  features: ['اختبار الميزات']
});
console.log('✅ إنشاء خطة اشتراك:', newPlan.id !== undefined);
```

#### قائمة فحص خطط الاشتراك:
- [ ] جلب جميع الخطط النشطة
- [ ] جلب خطة محددة بالمعرف
- [ ] إنشاء خطة جديدة
- [ ] تحديث خطة موجودة
- [ ] حذف خطة (التعطيل)
- [ ] التحقق من عدم تكرار الكود

#### الاشتراكات:
```typescript
// اختبار إنشاء اشتراك
const subscription = await enhancedSaasService.createSubscription({
  tenant_id: 'test-tenant-id',
  plan_id: newPlan.id,
  billing_cycle: 'monthly',
  trial_days: 14,
  discount_percentage: 0,
  auto_renew: true
});
console.log('✅ إنشاء اشتراك:', subscription.id !== undefined);

// اختبار تحديث الاشتراك
await enhancedSaasService.updateSubscription(subscription.id, {
  status: 'active'
});
console.log('✅ تحديث حالة الاشتراك');
```

#### قائمة فحص الاشتراكات:
- [ ] إنشاء اشتراك جديد
- [ ] جلب اشتراكات المؤسسة
- [ ] تحديث حالة الاشتراك
- [ ] إيقاف الاشتراك مؤقتاً
- [ ] استئناف الاشتراك
- [ ] إلغاء الاشتراك
- [ ] حساب التواريخ بشكل صحيح

### 2. 💰 اختبار الفواتير

```typescript
// اختبار إنشاء فاتورة
const invoice = await enhancedSaasService.createInvoice({
  subscription_id: subscription.id,
  tenant_id: 'test-tenant-id',
  subtotal: 50.00,
  tax_amount: 2.50,
  total_amount: 52.50,
  currency: 'KWD',
  billing_period_start: '2025-01-01',
  billing_period_end: '2025-01-31',
  due_date: '2025-02-15'
});
console.log('✅ إنشاء فاتورة:', invoice.invoice_number.startsWith('SAAS-'));
```

#### قائمة فحص الفواتير:
- [ ] إنشاء فاتورة جديدة
- [ ] توليد رقم فاتورة تلقائي
- [ ] حساب المبالغ بشكل صحيح
- [ ] إضافة عناصر الفاتورة
- [ ] تحديث حالة الفاتورة
- [ ] جلب فواتير المؤسسة

### 3. 💳 اختبار المدفوعات

```typescript
// اختبار إنشاء مدفوعة
const payment = await enhancedSaasService.createPayment({
  invoice_id: invoice.id,
  subscription_id: subscription.id,
  tenant_id: 'test-tenant-id',
  amount: 52.50,
  currency: 'KWD',
  payment_method: 'credit_card',
  payment_gateway: 'stripe'
});
console.log('✅ إنشاء مدفوعة:', payment.id !== undefined);

// اختبار تحديث حالة المدفوعة
await enhancedSaasService.updatePaymentStatus(payment.id, 'succeeded');
console.log('✅ تحديث حالة المدفوعة');
```

#### قائمة فحص المدفوعات:
- [ ] إنشاء مدفوعة جديدة
- [ ] تحديث حالة المدفوعة
- [ ] دعم طرق الدفع المختلفة
- [ ] تسجيل تفاصيل الدفع الخارجي
- [ ] ربط المدفوعة بالفاتورة والاشتراك

### 4. 📊 اختبار التقارير والإحصائيات

```typescript
// اختبار الإحصائيات
const stats = await enhancedSaasService.getBillingStats();
console.log('✅ إحصائيات الفوترة:', stats.total_revenue >= 0);

// اختبار التجديدات القادمة
const renewals = await enhancedSaasService.getUpcomingRenewals(7);
console.log('✅ التجديدات القادمة:', Array.isArray(renewals));

// اختبار الفواتير المتأخرة
const overdueInvoices = await enhancedSaasService.getOverdueInvoices();
console.log('✅ الفواتير المتأخرة:', Array.isArray(overdueInvoices));
```

#### قائمة فحص التقارير:
- [ ] إحصائيات الفوترة الشاملة
- [ ] التجديدات القادمة
- [ ] الفواتير المتأخرة
- [ ] استخدام المؤسسات
- [ ] تحليل الخطط
- [ ] معدل الإلغاء

---

## ✅ المرحلة الثالثة: اختبار المراقبة والتنبيهات

### 1. 🔔 اختبار نظام التنبيهات

```typescript
// اختبار إنشاء تنبيه
const alert = await saasMonitoringService.createAlert({
  type: 'billing_overdue',
  severity: 'medium',
  title: 'تنبيه اختبار',
  description: 'هذا تنبيه لأغراض الاختبار',
  tenant_id: 'test-tenant-id',
  status: 'active',
  metadata: { test: true }
});
console.log('✅ إنشاء تنبيه:', alert.id !== undefined);

// اختبار جلب التنبيهات النشطة
const activeAlerts = await saasMonitoringService.getActiveAlerts();
console.log('✅ جلب التنبيهات النشطة:', Array.isArray(activeAlerts));
```

#### قائمة فحص التنبيهات:
- [ ] إنشاء تنبيه جديد
- [ ] جلب التنبيهات النشطة
- [ ] تأكيد التنبيه
- [ ] حل التنبيه
- [ ] رفض التنبيه
- [ ] منع التنبيهات المكررة

### 2. 🕵️ اختبار المراقبة التلقائية

```typescript
// اختبار فحص الفواتير المتأخرة
await saasMonitoringService.checkOverdueInvoices();
console.log('✅ فحص الفواتير المتأخرة');

// اختبار فحص الاشتراكات المنتهية
await saasMonitoringService.checkExpiringSubscriptions();
console.log('✅ فحص الاشتراكات المنتهية');

// اختبار فحص المدفوعات الفاشلة
await saasMonitoringService.checkFailedPayments();
console.log('✅ فحص المدفوعات الفاشلة');
```

#### قائمة فحص المراقبة:
- [ ] مراقبة الفواتير المتأخرة
- [ ] مراقبة الاشتراكات المنتهية
- [ ] مراقبة المدفوعات الفاشلة
- [ ] مراقبة تجاوز حدود الاستخدام
- [ ] مراقبة أداء النظام
- [ ] مراقبة انخفاض الإيرادات
- [ ] مراقبة معدل الإلغاء

### 3. 📈 اختبار مقاييس الأداء

```typescript
// اختبار مقاييس المراقبة
const metrics = await saasMonitoringService.getMonitoringMetrics();
console.log('✅ مقاييس المراقبة:', metrics.calculated_at !== undefined);

// اختبار إحصائيات التنبيهات
const alertStats = await saasMonitoringService.getAlertStats(30);
console.log('✅ إحصائيات التنبيهات:', alertStats.total_alerts >= 0);
```

---

## ✅ المرحلة الرابعة: اختبار الواجهة والـ Hooks

### 1. 🔗 اختبار React Hooks

```typescript
// اختبار useSubscriptionPlans
const { data: plans, isLoading, error } = useSubscriptionPlans();
console.log('✅ Hook خطط الاشتراك:', !error && Array.isArray(data));

// اختبار useTenantSubscriptions
const { data: subscriptions } = useTenantSubscriptions('tenant-id');
console.log('✅ Hook اشتراكات المؤسسة:', Array.isArray(subscriptions));

// اختبار useBillingStats
const { data: stats } = useBillingStats();
console.log('✅ Hook إحصائيات الفوترة:', stats?.total_revenue >= 0);
```

#### قائمة فحص Hooks:
- [ ] `useSubscriptionPlans` - يعمل بشكل صحيح
- [ ] `useTenantSubscriptions` - يعمل بشكل صحيح
- [ ] `useSaasInvoices` - يعمل بشكل صحيح
- [ ] `useSaasPayments` - يعمل بشكل صحيح
- [ ] `useBillingStats` - يعمل بشكل صحيح
- [ ] `useCreateSubscription` - يعمل بشكل صحيح
- [ ] `useUpdateSubscription` - يعمل بشكل صحيح

### 2. 📱 اختبار مكونات الواجهة

#### مكونات الفوترة:
- [ ] قائمة خطط الاشتراك تعرض بشكل صحيح
- [ ] نموذج إنشاء خطة يعمل
- [ ] قائمة الاشتراكات تعرض بيانات صحيحة
- [ ] لوحة إحصائيات الفوترة تعمل
- [ ] قائمة الفواتير تعرض بشكل صحيح
- [ ] نموذج الدفع يعمل مع SADAD

---

## ✅ المرحلة الخامسة: اختبار الأداء

### 1. ⚡ اختبار سرعة الاستعلامات

```sql
-- اختبار الاستعلامات المحسنة
EXPLAIN ANALYZE 
SELECT * FROM active_subscriptions_view 
WHERE tenant_id = 'test-tenant-id';

-- يجب أن يكون وقت التنفيذ < 10ms
```

#### قائمة فحص الأداء:
- [ ] استعلامات الاشتراكات سريعة (< 10ms)
- [ ] استعلامات الفواتير سريعة (< 20ms)
- [ ] استعلامات الإحصائيات سريعة (< 100ms)
- [ ] Views تعمل بكفاءة
- [ ] الفهارس تستخدم بشكل صحيح

### 2. 🧠 اختبار نظام Cache

```typescript
// اختبار Cache
const startTime = Date.now();
const cachedPlans = await enhancedSaasService.getSubscriptionPlans(true);
const cacheTime = Date.now() - startTime;

const startTime2 = Date.now();
const cachedPlans2 = await enhancedSaasService.getSubscriptionPlans(true);
const cacheTime2 = Date.now() - startTime2;

console.log('✅ Cache يعمل:', cacheTime2 < cacheTime / 10);
```

#### قائمة فحص Cache:
- [ ] Cache الخطط يعمل بكفاءة
- [ ] Cache الاشتراكات يعمل
- [ ] Cache الإحصائيات يعمل
- [ ] تنظيف Cache يعمل بشكل صحيح
- [ ] TTL مختلف حسب نوع البيانات

---

## ✅ المرحلة السادسة: اختبار التكامل

### 1. 💳 اختبار SADAD

```typescript
// اختبار إنشاء دفعة SADAD
const sadadPayment = await enhancedSaasService.createSadadPayment({
  invoice_id: 'test-invoice-id',
  subscription_id: 'test-subscription-id',
  tenant_id: 'test-tenant-id',
  amount: 100.00,
  currency: 'KWD',
  customer_mobile: '+96512345678',
  bill_description: 'اختبار دفع SADAD'
});
console.log('✅ تكامل SADAD:', sadadPayment.success !== undefined);
```

#### قائمة فحص SADAD:
- [ ] إنشاء فاتورة SADAD
- [ ] استلام رد SADAD
- [ ] معالجة Webhook
- [ ] تحديث حالة المدفوعة
- [ ] معالجة الأخطاء

### 2. 🔄 اختبار الفوترة التلقائية

```typescript
// اختبار الفوترة التلقائية
const billingResult = await enhancedSaasService.processAutomaticBilling();
console.log('✅ الفوترة التلقائية:', billingResult.success !== undefined);
```

#### قائمة فحص الفوترة التلقائية:
- [ ] اكتشاف الاشتراكات المستحقة
- [ ] إنشاء فواتير تلقائية
- [ ] معالجة المدفوعات
- [ ] إرسال الإشعارات
- [ ] تحديث حالات الاشتراكات
- [ ] معالجة الأخطاء

---

## ✅ المرحلة السابعة: اختبار الأمان

### 1. 🔒 اختبار صلاحيات المستخدمين

```sql
-- اختبار RLS للمؤسسة
SET role authenticated;
SET request.jwt.claims TO '{"sub": "user-id", "role": "authenticated"}';

-- يجب أن ترجع فقط بيانات المؤسسة المرتبطة بالمستخدم
SELECT * FROM saas_subscriptions;
```

#### قائمة فحص الأمان:
- [ ] RLS تعمل للاشتراكات
- [ ] RLS تعمل للفواتير
- [ ] RLS تعمل للمدفوعات
- [ ] المسؤول العام يرى جميع البيانات
- [ ] المؤسسة ترى بياناتها فقط
- [ ] الأدوار محددة بشكل صحيح

### 2. 🛡️ اختبار تشفير البيانات

#### قائمة فحص التشفير:
- [ ] البيانات الحساسة مشفرة
- [ ] كلمات المرور محمية
- [ ] اتصالات HTTPS فقط
- [ ] Tokens آمنة
- [ ] Session management آمن

---

## ✅ المرحلة الثامنة: اختبار سيناريوهات كاملة

### 1. 🎯 سيناريو: دورة حياة كاملة للاشتراك

```typescript
// 1. إنشاء خطة
const plan = await enhancedSaasService.createSubscriptionPlan({...});

// 2. إنشاء اشتراك تجريبي
const subscription = await enhancedSaasService.createSubscription({
  plan_id: plan.id,
  trial_days: 14
});

// 3. تحويل إلى نشط
await enhancedSaasService.updateSubscription(subscription.id, {
  status: 'active'
});

// 4. إنشاء فاتورة شهرية
const invoice = await enhancedSaasService.createInvoice({...});

// 5. معالجة الدفع
const payment = await enhancedSaasService.createPayment({...});

// 6. تحديث حالة الدفع
await enhancedSaasService.updatePaymentStatus(payment.id, 'succeeded');

// 7. تحديث حالة الفاتورة
await enhancedSaasService.updateInvoiceStatus(invoice.id, 'paid');

console.log('✅ دورة حياة كاملة للاشتراك');
```

### 2. 🚨 سيناريو: معالجة التنبيهات

```typescript
// 1. إنشاء فاتورة متأخرة
await createOverdueInvoice();

// 2. تشغيل المراقبة
await saasMonitoringService.checkOverdueInvoices();

// 3. التحقق من التنبيه
const alerts = await saasMonitoringService.getActiveAlerts();
const overdueAlert = alerts.find(a => a.type === 'billing_overdue');

// 4. تأكيد التنبيه
await saasMonitoringService.acknowledgeAlert(overdueAlert.id, 'admin-id');

// 5. حل المشكلة
await processPayment();

// 6. حل التنبيه
await saasMonitoringService.resolveAlert(overdueAlert.id);

console.log('✅ معالجة التنبيهات');
```

---

## 📊 تقرير نتائج الاختبار

### ✅ خلاصة الفحص

| المجال | العناصر المطلوبة | العناصر المكتملة | النسبة |
|---------|------------------|-------------------|--------|
| قاعدة البيانات | 25 | ⬜ | ⬜% |
| الخدمات | 20 | ⬜ | ⬜% |
| المراقبة | 15 | ⬜ | ⬜% |
| الواجهة | 10 | ⬜ | ⬜% |
| الأداء | 8 | ⬜ | ⬜% |
| التكامل | 12 | ⬜ | ⬜% |
| الأمان | 10 | ⬜ | ⬜% |
| السيناريوهات | 5 | ⬜ | ⬜% |

### 🎯 النتيجة الإجمالية

**إجمالي العناصر**: 105  
**العناصر المكتملة**: ⬜  
**نسبة النجاح**: ⬜%

---

## 🚀 الخطوات التالية

### إذا كانت النسبة > 95%:
✅ النظام جاهز للإنتاج  
✅ يمكن نشر التحديثات  
✅ تفعيل المراقبة التلقائية  

### إذا كانت النسبة 85-95%:
⚠️ مراجعة العناصر الناقصة  
⚠️ إصلاح المشاكل البسيطة  
⚠️ إعادة الاختبار  

### إذا كانت النسبة < 85%:
❌ مراجعة شاملة مطلوبة  
❌ إصلاح المشاكل الأساسية  
❌ اختبار مرحلي قبل الكامل  

---

## 📞 الدعم الفني

للمساعدة في الاختبار أو حل المشاكل:

1. **📚 راجع الدليل الفني** أولاً
2. **🔍 تحقق من Logs** النظام
3. **📊 فحص مقاييس الأداء**
4. **🛠️ استخدم أدوات التشخيص**

---

*آخر تحديث: 15 يناير 2025*  
*الإصدار: 2.0 (محسن)* 