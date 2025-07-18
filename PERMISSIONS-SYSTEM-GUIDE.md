# دليل نظام الصلاحيات والتحكم بالوصول

## نظرة عامة

تم إنشاء نظام شامل للتحكم بالوصول القائم على الأدوار (RBAC) لحل جميع المشاكل المحددة في التقييم:

### المشاكل التي تم حلها ✅

1. **إصلاح الأزرار المعطلة** - تم إصلاح جميع الأزرار غير المستجيبة
2. **تحسين قابلية استخدام المودالات** - جميع النماذج تظهر أزرار الحفظ والإجراءات
3. **معالجة الأخطاء السليمة** - رسائل خطأ واضحة ومفيدة
4. **الوصول المحمي للوحدات الحرجة** - فقط Super Admin يمكنه الوصول للأدوات الحساسة
5. **اختبار الصلاحيات عبر الأدوار** - نظام اختبار شامل للتحقق من الصلاحيات
6. **انتحال الهوية والمراقبة** - إمكانية عرض النظام من منظور المستخدمين الآخرين

---

## مكونات النظام

### 1. مدير الصلاحيات الأساسي
**الملف:** `src/hooks/useRoleBasedAccess.ts`

#### الصلاحيات المدعومة:
```typescript
// إدارة النظام
SYSTEM_ADMIN, SYSTEM_MAINTENANCE, SYSTEM_BACKUP, SYSTEM_LOGS, SYSTEM_SETTINGS

// إدارة المؤسسات  
TENANT_VIEW, TENANT_CREATE, TENANT_EDIT, TENANT_DELETE, TENANT_IMPERSONATE

// إدارة المستخدمين
USER_VIEW, USER_CREATE, USER_EDIT, USER_DELETE

// إدارة الأدوار والصلاحيات
ROLE_VIEW, ROLE_CREATE, ROLE_EDIT, ROLE_DELETE, PERMISSION_MANAGE

// الدعم الفني
SUPPORT_VIEW, SUPPORT_CREATE, SUPPORT_MANAGE, SUPPORT_ADMIN

// محرر الصفحات
LANDING_VIEW, LANDING_CREATE, LANDING_EDIT, LANDING_PUBLISH, LANDING_DELETE

// المالية والفوترة
BILLING_VIEW, BILLING_MANAGE, INVOICE_CREATE, PAYMENT_PROCESS

// التقارير والتحليلات
REPORTS_VIEW, REPORTS_EXPORT, ANALYTICS_VIEW
```

#### الأدوار وصلاحياتها:
- **Super Admin**: جميع الصلاحيات
- **Tenant Admin**: إدارة المؤسسة والمستخدمين والدعم والفوترة والتقارير
- **Manager**: إدارة المستخدمين والدعم والتقارير والفوترة
- **Accountant**: الفوترة والتقارير والفواتير
- **Support**: الدعم الفني وعرض المستخدمين
- **User**: عرض وإنشاء طلبات الدعم فقط

### 2. مكون انتحال الهوية
**الملف:** `src/components/SuperAdmin/UserImpersonation.tsx`

#### الميزات:
- **عرض قائمة المستخدمين** مع فلترة حسب الدور والحالة
- **انتحال الهوية الآمن** مع تسجيل جميع الإجراءات
- **منع انتحال هويات Super Admin** من قبل مستخدمين آخرين
- **تسجيل مفصل للجلسات** مع الوقت والإجراءات المنفذة
- **إيقاف فوري للانتحال** مع تحديث السجلات

#### التحكم الأمني:
```typescript
// فقط Super Admin يمكنه انتحال الهويات
hasPermission(PERMISSIONS.TENANT_IMPERSONATE)

// منع انتحال هوية نفس المستخدم أو Super Admin آخر
user.id === currentUser?.id || 
(user.role === 'super-admin' && currentUser?.role !== 'super-admin')
```

### 3. لوحة التحكم المحمية
**الملف:** `src/components/SuperAdmin/ProtectedSuperAdminDashboard.tsx`

#### الميزات:
- **عرض حالة انتحال الهوية** في الجزء العلوي
- **إخفاء الوحدات غير المصرح بها** تلقائياً
- **إحصائيات مخصصة حسب الصلاحيات** - فقط البيانات المصرح بها
- **تبديل سريع بين الأدوار** للاختبار والدعم

#### الوحدات المحمية:
```typescript
// مثال: وحدة أدوات الصيانة
{
  id: 'maintenance-tools',
  title: 'أدوات الصيانة',
  requiredPermissions: [PERMISSIONS.SYSTEM_MAINTENANCE],
  isCritical: true // وصول محدود
}
```

### 4. مختبر الصلاحيات
**الملف:** `src/components/SuperAdmin/RolePermissionTester.tsx`

#### الاختبارات:
- **اختبارات حرجة**: أدوات الصيانة، النسخ الاحتياطي، انتحال الهوية، نشر الصفحات، إدارة الصلاحيات
- **اختبارات عادية**: إدارة المؤسسات، المستخدمين، الفوترة
- **اختبارات أساسية**: الدعم الفني، التقارير

#### النتائج:
- اختبار كل دور مع كل صلاحية
- مقارنة النتائج المتوقعة مع الفعلية
- تقرير شامل بمعدل النجاح والفشل

---

## كيفية الاستخدام

### 1. التكامل في التطبيق

```tsx
import { RoleBasedAccessProvider } from '@/hooks/useRoleBasedAccess';

function App() {
  const currentUser = getCurrentUser(); // من نظام المصادقة
  
  return (
    <RoleBasedAccessProvider currentUser={currentUser}>
      <AppContent />
    </RoleBasedAccessProvider>
  );
}
```

### 2. حماية المكونات

```tsx
import { ProtectedComponent, PERMISSIONS } from '@/hooks/useRoleBasedAccess';

// حماية مكون واحد
<ProtectedComponent permission={PERMISSIONS.SYSTEM_MAINTENANCE}>
  <MaintenanceTools />
</ProtectedComponent>

// حماية بصلاحيات متعددة
<ProtectedComponent 
  permissions={[PERMISSIONS.USER_VIEW, PERMISSIONS.USER_EDIT]}
  requireAll={false} // يحتاج أي صلاحية من القائمة
>
  <UserManagement />
</ProtectedComponent>

// حماية وحدة كاملة
<ProtectedComponent module="maintenance-tools">
  <MaintenanceModule />
</ProtectedComponent>
```

### 3. فحص الصلاحيات في الكود

```tsx
import { useRoleBasedAccess, usePermissions } from '@/hooks/useRoleBasedAccess';

function MyComponent() {
  const { hasPermission, canAccessModule } = useRoleBasedAccess();
  const { canCreate, canDelete, checkCriticalAccess } = usePermissions();
  
  if (!hasPermission(PERMISSIONS.USER_VIEW)) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      {canCreate('user') && <CreateUserButton />}
      {canDelete('user') && <DeleteUserButton />}
      {checkCriticalAccess('backup-system') && <BackupButton />}
    </div>
  );
}
```

### 4. انتحال الهوية

```tsx
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';

function AdminPanel() {
  const { 
    isImpersonating, 
    impersonatedUser, 
    startImpersonation, 
    stopImpersonation 
  } = useRoleBasedAccess();
  
  const handleImpersonate = (user) => {
    startImpersonation(user); // يتم التحقق من الصلاحيات تلقائياً
  };
  
  return (
    <div>
      {isImpersonating && (
        <div className="impersonation-banner">
          أنت تتصفح بهوية: {impersonatedUser.name}
          <button onClick={stopImpersonation}>إيقاف</button>
        </div>
      )}
    </div>
  );
}
```

---

## التحقق من التطبيق

### 1. اختبار الصلاحيات
1. افتح `RolePermissionTester`
2. حدد فئة الاختبارات (حرجة/عادية/أساسية)  
3. اضغط "تشغيل الاختبارات"
4. راجع النتائج للتأكد من عمل النظام بشكل صحيح

### 2. اختبار انتحال الهوية
1. افتح `UserImpersonation` 
2. اختر مستخدماً من القائمة
3. اضغط "انتحال الهوية"
4. تأكد من تغير الصلاحيات والوصول للوحدات
5. اضغط "إيقاف انتحال الهوية" للعودة

### 3. اختبار الوصول عبر الأدوار
قم بإنشاء مستخدمين اختبار بأدوار مختلفة:

```tsx
const testUsers = {
  superAdmin: { role: 'super-admin' }, // جميع الوحدات
  tenantAdmin: { role: 'tenant-admin' }, // وحدات المؤسسة
  manager: { role: 'manager' }, // وحدات محدودة
  user: { role: 'user' } // الأساسيات فقط
};
```

---

## الميزات الأمنية

### 1. الحماية من التلاعب
- **فحص صلاحيات مزدوج**: في الواجهة والخادم
- **تشفير معرفات الجلسات**: منع انتحال الهوية غير المصرح به
- **تسجيل شامل للأنشطة**: مراقبة جميع الإجراءات الحساسة

### 2. منع التصعيد غير المصرح به
- **منع انتحال هوية Super Admin**: إلا من قبل Super Admin آخر
- **عزل صلاحيات المؤسسات**: كل مؤسسة معزولة عن الأخرى
- **فحص dependency للصلاحيات**: الصلاحيات المترابطة تُفحص معاً

### 3. مراقبة الأمان
```typescript
// تسجيل كل عملية انتحال هوية
const impersonationLog = {
  adminUserId: currentUser.id,
  targetUserId: impersonatedUser.id,
  startTime: new Date(),
  actions: [], // يتم تسجيل كل إجراء
  ipAddress: getClientIP()
};
```

---

## التحديثات المستقبلية

### 1. ميزات إضافية مقترحة
- **صلاحيات مؤقتة**: منح صلاحيات لفترة محددة
- **صلاحيات مشروطة**: صلاحيات تعتمد على معايير ديناميكية
- **مراجعة دورية للصلاحيات**: تذكير بمراجعة الصلاحيات
- **تقارير أمنية متقدمة**: تحليل أنماط الوصول

### 2. التكامل مع خدمات خارجية
- **Active Directory**: مزامنة الأدوار والمجموعات
- **OAuth providers**: دعم الصلاحيات من مقدمي الخدمة الخارجيين
- **Audit services**: إرسال سجلات الأمان لخدمات المراجعة

---

## الخلاصة

✅ **تم إنجاز جميع المتطلبات:**
- نظام صلاحيات شامل ومرن
- انتحال هوية آمن ومراقب
- حماية الوحدات الحرجة
- اختبار شامل للصلاحيات
- واجهة مستخدم محسنة وسهلة الاستخدام

**النظام جاهز للإنتاج** ويوفر مستوى أمان عالي مع مرونة في الإدارة والصيانة. 