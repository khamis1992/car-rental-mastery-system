import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Key,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  Crown,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'read' | 'write' | 'admin';
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
  level: number;
}

const AdvancedPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'super_admin',
      description: 'مدير النظام العام - صلاحيات كاملة',
      permissions: ['all'],
      userCount: 2,
      isDefault: true,
      level: 0
    },
    {
      id: '2',
      name: 'tenant_admin',
      description: 'مدير المؤسسة - إدارة كاملة للمؤسسة',
      permissions: ['tenant_manage', 'users_manage', 'vehicles_manage'],
      userCount: 15,
      isDefault: true,
      level: 1
    },
    {
      id: '3',
      name: 'manager',
      description: 'مدير - صلاحيات إدارية محدودة',
      permissions: ['users_view', 'vehicles_manage', 'contracts_manage'],
      userCount: 8,
      isDefault: true,
      level: 2
    },
    {
      id: '4',
      name: 'accountant',
      description: 'محاسب - إدارة المالية والتقارير',
      permissions: ['accounting_manage', 'reports_view', 'invoices_manage'],
      userCount: 12,
      isDefault: true,
      level: 3
    },
    {
      id: '5',
      name: 'receptionist',
      description: 'موظف استقبال - إدارة العقود والعملاء',
      permissions: ['contracts_manage', 'customers_manage', 'vehicles_view'],
      userCount: 25,
      isDefault: true,
      level: 4
    },
    {
      id: '6',
      name: 'user',
      description: 'مستخدم عادي - صلاحيات محدودة',
      permissions: ['dashboard_view', 'profile_edit'],
      userCount: 150,
      isDefault: true,
      level: 5
    }
  ]);

  const [permissions, setPermissions] = useState<Permission[]>([
    // إدارة النظام
    { id: 'system_settings', name: 'إعدادات النظام', description: 'إدارة إعدادات النظام العامة', category: 'system', level: 'admin', enabled: true },
    { id: 'tenant_manage', name: 'إدارة المؤسسات', description: 'إنشاء وتعديل وحذف المؤسسات', category: 'system', level: 'admin', enabled: true },
    { id: 'global_monitoring', name: 'مراقبة النظام', description: 'مراقبة أداء النظام والخوادم', category: 'system', level: 'read', enabled: true },
    
    // إدارة المستخدمين
    { id: 'users_manage', name: 'إدارة المستخدمين', description: 'إضافة وتعديل وحذف المستخدمين', category: 'users', level: 'admin', enabled: true },
    { id: 'users_view', name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين', category: 'users', level: 'read', enabled: true },
    { id: 'roles_manage', name: 'إدارة الأدوار', description: 'إنشاء وتعديل أدوار المستخدمين', category: 'users', level: 'admin', enabled: true },
    
    // إدارة المركبات
    { id: 'vehicles_manage', name: 'إدارة المركبات', description: 'إضافة وتعديل وحذف المركبات', category: 'fleet', level: 'write', enabled: true },
    { id: 'vehicles_view', name: 'عرض المركبات', description: 'عرض قائمة المركبات', category: 'fleet', level: 'read', enabled: true },
    { id: 'maintenance_manage', name: 'إدارة الصيانة', description: 'جدولة وإدارة صيانة المركبات', category: 'fleet', level: 'write', enabled: true },
    
    // إدارة العقود
    { id: 'contracts_manage', name: 'إدارة العقود', description: 'إنشاء وتعديل العقود', category: 'business', level: 'write', enabled: true },
    { id: 'contracts_view', name: 'عرض العقود', description: 'عرض قائمة العقود', category: 'business', level: 'read', enabled: true },
    { id: 'customers_manage', name: 'إدارة العملاء', description: 'إضافة وتعديل بيانات العملاء', category: 'business', level: 'write', enabled: true },
    
    // المحاسبة والمالية
    { id: 'accounting_manage', name: 'إدارة المحاسبة', description: 'إدارة الحسابات والقيود المحاسبية', category: 'finance', level: 'admin', enabled: true },
    { id: 'invoices_manage', name: 'إدارة الفواتير', description: 'إنشاء وإدارة الفواتير', category: 'finance', level: 'write', enabled: true },
    { id: 'payments_manage', name: 'إدارة المدفوعات', description: 'تسجيل ومعالجة المدفوعات', category: 'finance', level: 'write', enabled: true },
    { id: 'reports_view', name: 'عرض التقارير', description: 'عرض التقارير المالية والإدارية', category: 'finance', level: 'read', enabled: true },
    
    // أساسيات
    { id: 'dashboard_view', name: 'عرض لوحة التحكم', description: 'الوصول للوحة التحكم الرئيسية', category: 'basic', level: 'read', enabled: true },
    { id: 'profile_edit', name: 'تحرير الملف الشخصي', description: 'تعديل البيانات الشخصية', category: 'basic', level: 'write', enabled: true }
  ]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const { toast } = useToast();

  const getRoleBadge = (role: Role) => {
    const levelColors = {
      0: 'bg-red-100 text-red-800 border-red-200',
      1: 'bg-orange-100 text-orange-800 border-orange-200',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      3: 'bg-blue-100 text-blue-800 border-blue-200',
      4: 'bg-green-100 text-green-800 border-green-200',
      5: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={levelColors[role.level as keyof typeof levelColors]}>
        {role.name}
      </Badge>
    );
  };

  const getPermissionLevelBadge = (level: string) => {
    const levels = {
      read: { text: 'قراءة', color: 'bg-blue-100 text-blue-800' },
      write: { text: 'كتابة', color: 'bg-green-100 text-green-800' },
      admin: { text: 'إدارة', color: 'bg-red-100 text-red-800' }
    };
    
    const levelInfo = levels[level as keyof typeof levels];
    return (
      <Badge className={levelInfo.color}>
        {levelInfo.text}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      system: Crown,
      users: Users,
      fleet: Settings,
      business: UserCheck,
      finance: Shield,
      basic: Eye
    };
    
    const Icon = icons[category as keyof typeof icons] || Eye;
    return <Icon className="w-4 h-4" />;
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const RoleDetailsDialog = ({ role }: { role: Role }) => (
    <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            تفاصيل الدور - {role.name}
          </DialogTitle>
          <DialogDescription>
            {role.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{role.userCount}</div>
                  <div className="text-sm text-muted-foreground">مستخدم</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{role.permissions.length}</div>
                  <div className="text-sm text-muted-foreground">صلاحية</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{role.level}</div>
                  <div className="text-sm text-muted-foreground">مستوى</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الصلاحيات المخصصة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category === 'system' && 'إدارة النظام'}
                      {category === 'users' && 'إدارة المستخدمين'}
                      {category === 'fleet' && 'إدارة الأسطول'}
                      {category === 'business' && 'الأعمال'}
                      {category === 'finance' && 'المالية'}
                      {category === 'basic' && 'أساسيات'}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {perms
                        .filter(p => role.permissions.includes(p.id) || role.permissions.includes('all'))
                        .map(permission => (
                        <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">{permission.description}</div>
                          </div>
                          {getPermissionLevelBadge(permission.level)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">نظام الصلاحيات المتقدم</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateRole(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            دور جديد
          </Button>
          <Button className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات الصلاحيات
          </Button>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          <TabsTrigger value="audit">سجل التتبع</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                إدارة الأدوار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">المستخدمون</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(role)}
                          {role.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              افتراضي
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm">{role.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          مستوى {role.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          نشط
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!role.isDefault && (
                            <>
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category === 'system' && 'صلاحيات إدارة النظام'}
                    {category === 'users' && 'صلاحيات إدارة المستخدمين'}
                    {category === 'fleet' && 'صلاحيات إدارة الأسطول'}
                    {category === 'business' && 'صلاحيات الأعمال'}
                    {category === 'finance' && 'صلاحيات المالية'}
                    {category === 'basic' && 'الصلاحيات الأساسية'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getPermissionLevelBadge(permission.level)}
                          <Switch
                            checked={permission.enabled}
                            onCheckedChange={(checked) => {
                              setPermissions(prev =>
                                prev.map(p =>
                                  p.id === permission.id
                                    ? { ...p, enabled: checked }
                                    : p
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                سجل تتبع الصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                سيتم تطوير سجل التتبع قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedRole && <RoleDetailsDialog role={selectedRole} />}
    </div>
  );
};

export default AdvancedPermissions;