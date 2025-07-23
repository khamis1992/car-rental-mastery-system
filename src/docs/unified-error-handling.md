# نظام معالجة الأخطاء الموحد

## نظرة عامة

تم إنشاء نظام معالجة أخطاء موحد وشامل لضمان التعامل المتسق مع الأخطاء عبر التطبيق بأكمله.

## المكونات الرئيسية

### 1. `useUnifiedErrorHandling` Hook

Hook رئيسي يدمج جميع ميزات معالجة الأخطاء:

```tsx
import { useUnifiedErrorHandling } from '@/hooks/useUnifiedErrorHandling';

const { execute, executeWithRetry, handleError, isRetrying, isLoading } = useUnifiedErrorHandling({
  context: 'اسم_السياق',
  showToast: true,
  enableRetry: true,
  maxRetries: 3,
  loadingKey: 'عملية_التحميل',
  successMessage: 'رسالة النجاح',
  errorMessage: 'رسالة الخطأ المخصصة'
});
```

#### الوظائف:
- `execute()`: تنفيذ العملية مع معالجة الأخطاء
- `executeWithRetry()`: تنفيذ العملية مع إعادة المحاولة
- `handleError()`: معالجة الأخطاء يدوياً
- `isRetrying`: حالة إعادة المحاولة
- `isLoading`: حالة التحميل

### 2. `UnifiedErrorDisplay` Component

مكون موحد لعرض الأخطاء مع الميزات التالية:

```tsx
import { UnifiedErrorDisplay } from '@/components/common/UnifiedErrorDisplay';

<UnifiedErrorDisplay
  error={error}
  title="عنوان الخطأ"
  onRetry={() => retryFunction()}
  showRetry={true}
  showDetails={true}
  showHome={false}
  context="السياق"
  retryCount={retryCount}
  maxRetries={3}
/>
```

#### الميزات:
- عرض رسائل خطأ واضحة بالعربية
- اقتراحات حلول مخصصة حسب السياق
- أزرار إعادة المحاولة والانتقال للصفحة الرئيسية
- تفاصيل الخطأ القابلة للطي

### 3. `UnifiedErrorBoundary` Component

حاجز خطأ موحد يلتقط الأخطاء على مستوى المكونات:

```tsx
import { UnifiedErrorBoundary } from '@/components/common/UnifiedErrorBoundary';

<UnifiedErrorBoundary 
  context="اسم_المكون"
  showDetails={false}
  showHome={true}
  onError={(error, errorInfo) => console.log(error)}
>
  <YourComponent />
</UnifiedErrorBoundary>
```

## استراتيجيات معالجة الأخطاء

### 1. الأخطاء حسب السياق

#### الموظفين (`employees`):
- اقتراحات مخصصة لمشاكل الوصول والصلاحيات
- رسائل واضحة لأخطاء البيانات المفقودة

#### الفواتير (`invoicing`):
- معالجة خاصة لأخطاء الدفع
- اقتراحات لمشاكل البيانات المالية
- إعادة محاولة تلقائية للعمليات المالية الحرجة

### 2. أنواع الأخطاء المدعومة

- `Failed to fetch`: أخطاء الشبكة
- `ValidationError`: أخطاء التحقق من البيانات
- `PermissionError`: أخطاء الصلاحيات
- `NotFoundError`: البيانات غير موجودة
- `TimeoutError`: انتهاء مهلة الاتصال

### 3. آلية إعادة المحاولة

- إعادة محاولة تلقائية مع تأخير متصاعد
- حد أقصى للمحاولات (افتراضي: 3)
- إيقاف إعادة المحاولة للأخطاء النهائية (4xx)

## أفضل الممارسات

### 1. استخدام Hook في المكونات

```tsx
const MyComponent = () => {
  const { execute } = useUnifiedErrorHandling({
    context: 'my-component',
    showToast: true
  });

  const handleAction = async () => {
    await execute(async () => {
      // العملية التي قد تفشل
      await someAPICall();
    });
  };

  return <Button onClick={handleAction}>تنفيذ</Button>;
};
```

### 2. معالجة الأخطاء في الصفحات

```tsx
const MyPage = () => {
  const { data, error, refetch } = useQuery(['data'], fetchData);

  if (error) {
    return (
      <UnifiedErrorDisplay
        error={error}
        title="خطأ في تحميل البيانات"
        onRetry={() => refetch()}
        context="my-page"
      />
    );
  }

  return <div>{/* محتوى الصفحة */}</div>;
};
```

### 3. استخدام Error Boundary

```tsx
const App = () => (
  <UnifiedErrorBoundary context="application">
    <MyApp />
  </UnifiedErrorBoundary>
);
```

## التكامل مع النظام الحالي

### 1. تسجيل الأخطاء
- يتكامل مع `useErrorTracking` للتسجيل التفصيلي
- دعم لإرسال الأخطاء لخدمات التتبع الخارجية

### 2. إدارة التحميل
- يتكامل مع `GlobalLoadingContext`
- إدارة حالات التحميل المتقدمة

### 3. Toast Notifications
- يستخدم نظام Toast المحدث
- رسائل باللغة العربية مع اتجاه RTL

## الترقيات المستقبلية

1. **تتبع الأخطاء المتقدم**: دمج مع Sentry أو خدمات مشابهة
2. **تقارير الأخطاء**: لوحة تحكم لمراقبة الأخطاء
3. **الذكاء الاصطناعي**: اقتراحات حلول ذكية
4. **إعادة المحاولة التكيفية**: تعديل استراتيجية إعادة المحاولة حسب نوع الخطأ