# 🔐 دليل نظام الصلاحيات المتقدم

## نظرة عامة

تم تطوير نظام صلاحيات متقدم ومرن لإدارة الوصول والتحكم في النظام بناءً على الأدوار والصلاحيات. النظام يدعم:

- **إدارة الأدوار (Roles)**: تعريف أدوار مختلفة بمستويات متدرجة
- **إدارة الصلاحيات (Permissions)**: صلاحيات مفصلة لكل وظيفة في النظام
- **فئات الصلاحيات (Categories)**: تجميع الصلاحيات في فئات منطقية
- **سجل التتبع (Audit Log)**: تسجيل جميع تغييرات الصلاحيات
- **حماية المكونات**: حماية المكونات والصفحات بناءً على الصلاحيات

## هيكل قاعدة البيانات

### الجداول الأساسية

```sql
-- فئات الصلاحيات
permission_categories (id, name, display_name, description, icon, sort_order)

-- الصلاحيات
permissions (id, name, display_name, description, category_id, level, is_system)

-- الأدوار
roles (id, name, display_name, description, level, is_system, tenant_id)

-- ربط الأدوار بالصلاحيات
role_permissions (role_id, permission_id, granted_by, granted_at)

-- سجل التتبع
permission_audit_log (action, user_id, tenant_id, role_id, details, created_at)
```

### الأدوار الافتراضية

| الدور | المستوى | الوصف |
|-------|---------|-------|
| `super_admin` | 0 | مدير النظام العام - صلاحيات كاملة |
| `tenant_admin` | 10 | مدير المؤسسة - إدارة كاملة للمؤسسة |
| `manager` | 20 | مدير - صلاحيات إدارية محدودة |
| `accountant` | 30 | محاسب - إدارة المالية والتقارير |
| `technician` | 40 | فني - صيانة المركبات |
| `receptionist` | 50 | موظف استقبال - إدارة العقود والعملاء |
| `user` | 100 | مستخدم عادي - صلاحيات محدودة |

### فئات الصلاحيات

1. **system** - إدارة النظام
2. **users** - إدارة المستخدمين
3. **fleet** - إدارة الأسطول
4. **business** - الأعمال
5. **finance** - المالية
6. **basic** - أساسيات

## استخدام النظام

### 1. Hooks للتحقق من الصلاحيات

```typescript
import { useCanAccess, useCurrentRole, useCommonPermissions } from '@/hooks/usePermissionGuard';

// التحقق من صلاحية واحدة
const { canAccess, isLoading } = useCanAccess('users.manage');

// التحقق من الدور الحالي
const { isSuperAdmin, canManageSystem, level } = useCurrentRole();

// الصلاحيات الشائعة
const { canManageUsers, canManageVehicles } = useCommonPermissions();
```

### 2. مكونات الحماية

#### PermissionGuard - حماية بناءً على الصلاحيات

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

// حماية مكون بصلاحية واحدة
<PermissionGuard permissions="users.manage">
  <AddUserButton />
</PermissionGuard>

// حماية بعدة صلاحيات (يتطلب جميع الصلاحيات)
<PermissionGuard 
  permissions={['users.manage', 'users.view']}
  checkType="all"
>
  <UserManagementPanel />
</PermissionGuard>

// حماية بصلاحية واحدة من عدة (يتطلب أي صلاحية)
<PermissionGuard 
  permissions={['users.manage', 'users.view']}
  checkType="any"
>
  <UserListComponent />
</PermissionGuard>

// إخفاء المكون بدلاً من عرض رسالة خطأ
<PermissionGuard 
  permissions="system.settings"
  hideOnNoAccess
>
  <SystemSettingsButton />
</PermissionGuard>

// رسالة خطأ مخصصة
<PermissionGuard 
  permissions="finance.reports.view"
  accessDeniedMessage="هذا التقرير متاح للمحاسبين فقط"
>
  <FinancialReport />
</PermissionGuard>
```

#### AdminOnly - حماية للإداريين

```tsx
import { AdminOnly } from '@/components/PermissionGuard';

// للمشرفين العامين فقط
<AdminOnly level="super">
  <GlobalSettingsPanel />
</AdminOnly>

// لمدراء المؤسسات وأعلى
<AdminOnly level="tenant">
  <TenantManagementPanel />
</AdminOnly>

// للمدراء وأعلى
<AdminOnly level="manager">
  <ManagerDashboard />
</AdminOnly>
```

#### RoleGuard - حماية بناءً على الأدوار

```tsx
import { RoleGuard } from '@/components/PermissionGuard';

<RoleGuard allowedRoles={['super_admin', 'tenant_admin']}>
  <AdminPanel />
</RoleGuard>
```

### 3. HOCs للصفحات

```tsx
import { withPermissionGuard, withAdminOnly } from '@/components/PermissionGuard';

// حماية صفحة بصلاحية
const ProtectedPage = withPermissionGuard(
  MyComponent,
  'users.manage'
);

// حماية صفحة للإداريين فقط
const AdminPage = withAdminOnly(
  MyComponent,
  'super'
);
```

### 4. Middleware للخدمات

```typescript
import PermissionsMiddleware from '@/middleware/PermissionsMiddleware';

// في خدمة
class UserService {
  @PermissionsMiddleware.requirePermission('users.manage')
  async createUser(userData: any) {
    // منطق إنشاء المستخدم
  }

  @PermissionsMiddleware.requireRoleLevel(20)
  async deleteUser(userId: string) {
    // منطق حذف المستخدم
  }
}

// التحقق اليدوي
const context = await PermissionsMiddleware.getCurrentUserContext();
const hasAccess = await PermissionsMiddleware.checkPermission(
  context,
  'users.manage'
);
```

### 5. التحقق الشامل

```typescript
const authResult = await PermissionsMiddleware.authorize(context, {
  permissions: ['users.manage', 'users.view'],
  requireAllPermissions: true,
  minRoleLevel: 20,
  allowedRoles: ['manager', 'tenant_admin'],
});

if (!authResult.authorized) {
  console.log('السبب:', authResult.reason);
  console.log('التفاصيل:', authResult.details);
}
```

## إدارة النظام

### إضافة صلاحية جديدة

```sql
INSERT INTO permissions (name, display_name, description, category_id, level)
VALUES (
  'inventory.manage',
  'إدارة المخزون',
  'إضافة وتعديل وحذف عناصر المخزون',
  (SELECT id FROM permission_categories WHERE name = 'business'),
  'write'
);
```

### إنشاء دور جديد

```typescript
import { permissionsService } from '@/services/permissionsService';

const newRole = await permissionsService.createRole({
  name: 'warehouse_manager',
  display_name: 'مدير المخزون',
  description: 'مسؤول عن إدارة المخزون والمشتريات',
  level: 25,
  tenant_id: tenantId
});

// تخصيص الصلاحيات
await permissionsService.updateRolePermissions(newRole.id, [
  'inventory.manage',
  'fleet.vehicles.view',
  'basic.dashboard.view'
]);
```

### مراقبة النشاط

```typescript
// عرض سجل التتبع
const auditLogs = await permissionsService.getAuditLogs(tenantId);

// تسجيل نشاط مخصص
await permissionsService.logPermissionActivity(
  'custom_action',
  roleId,
  permissionId,
  { custom_data: 'value' }
);
```

## الصلاحيات المتاحة

### صلاحيات النظام (system)
- `system.settings` - إعدادات النظام
- `system.monitoring` - مراقبة النظام
- `system.tenants.manage` - إدارة المؤسسات
- `system.backup` - النسخ الاحتياطي

### صلاحيات المستخدمين (users)
- `users.manage` - إدارة المستخدمين
- `users.view` - عرض المستخدمين
- `users.roles.manage` - إدارة الأدوار
- `users.permissions.manage` - إدارة الصلاحيات

### صلاحيات الأسطول (fleet)
- `fleet.vehicles.manage` - إدارة المركبات
- `fleet.vehicles.view` - عرض المركبات
- `fleet.maintenance.manage` - إدارة الصيانة
- `fleet.insurance.manage` - إدارة التأمين

### صلاحيات الأعمال (business)
- `business.contracts.manage` - إدارة العقود
- `business.contracts.view` - عرض العقود
- `business.customers.manage` - إدارة العملاء
- `business.customers.view` - عرض العملاء

### صلاحيات المالية (finance)
- `finance.accounting.manage` - إدارة المحاسبة
- `finance.invoices.manage` - إدارة الفواتير
- `finance.payments.manage` - إدارة المدفوعات
- `finance.reports.view` - عرض التقارير

### الصلاحيات الأساسية (basic)
- `basic.dashboard.view` - عرض لوحة التحكم
- `basic.profile.edit` - تحرير الملف الشخصي

## أمثلة متقدمة

### حماية مشروطة معقدة

```tsx
<PermissionGuard 
  permissions={['finance.reports.view']}
  minRoleLevel={30}
  fallback={
    <Card>
      <CardContent>
        <p>هذا التقرير متاح للمحاسبين وأعلى فقط</p>
      </CardContent>
    </Card>
  }
>
  <DetailedFinancialReport />
</PermissionGuard>
```

### تخصيص الواجهة بناءً على الصلاحيات

```tsx
function UserManagementPanel() {
  const { canManageUsers, canViewUsers } = useCommonPermissions();
  const { isTenantAdmin } = useCurrentRole();

  return (
    <div>
      {canViewUsers && <UserList />}
      {canManageUsers && <AddUserButton />}
      {isTenantAdmin && <BulkUserActions />}
    </div>
  );
}
```

### إدارة ديناميكية للتبويبات

```tsx
function AdminTabs() {
  const permissions = useCommonPermissions();
  
  const tabs = [
    { id: 'users', label: 'المستخدمين', permission: permissions.canManageUsers },
    { id: 'vehicles', label: 'المركبات', permission: permissions.canManageVehicles },
    { id: 'accounting', label: 'المحاسبة', permission: permissions.canManageAccounting },
  ].filter(tab => tab.permission);

  return (
    <Tabs>
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* TabsContent components */}
    </Tabs>
  );
}
```

## أفضل الممارسات

1. **استخدم أقل صلاحية مطلوبة**: لا تطلب صلاحيات أكثر من اللازم
2. **حماية متعددة المستويات**: احمِ في الواجهة والخلفية
3. **رسائل خطأ واضحة**: اشرح سبب عدم الوصول
4. **سجل الأنشطة**: سجل التغييرات المهمة
5. **اختبر الصلاحيات**: تأكد من عمل النظام مع أدوار مختلفة

## استكشاف الأخطاء

### مشاكل شائعة

1. **لا تعمل الصلاحيات**: تأكد من تطبيق migration
2. **المستخدم ليس له دور**: تحقق من جدول `tenant_users`
3. **الصلاحية غير مخصصة**: تحقق من جدول `role_permissions`

### أدوات التشخيص

```typescript
// فحص صلاحيات المستخدم
const permissions = await permissionsService.getUserPermissions(userId, tenantId);
console.log('صلاحيات المستخدم:', permissions);

// فحص دور المستخدم
const role = await permissionsService.getUserRole(userId, tenantId);
console.log('دور المستخدم:', role);
``` 