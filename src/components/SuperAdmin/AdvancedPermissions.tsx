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
  CheckCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useRoles,
  usePermissionsByCategory,
  usePermissionCategories,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  useAuditLogs,
  usePermissionSystemStats
} from '@/hooks/usePermissions';
import { useTenant } from '@/contexts/TenantContext';
import type { Role, Permission, PermissionCategory } from '@/services/permissionsService';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const AdvancedPermissions: React.FC = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  
  // State management
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetching data using real hooks
  const { 
    data: roles = [], 
    isLoading: rolesLoading, 
    error: rolesError,
    refetch: refetchRoles 
  } = useRoles(currentTenant?.id);
  
  const { 
    data: permissionsByCategory = {}, 
    isLoading: permissionsLoading,
    error: permissionsError 
  } = usePermissionsByCategory();
  
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = usePermissionCategories();
  
  const { 
    data: auditLogs = [], 
    isLoading: auditLoading 
  } = useAuditLogs(currentTenant?.id, undefined, 50);
  
  const { 
    data: systemStats, 
    isLoading: statsLoading 
  } = usePermissionSystemStats();
  
  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updateRolePermissionsMutation = useUpdateRolePermissions();

  // Check if there are any critical errors indicating missing tables
  const hasCriticalErrors = rolesError || permissionsError || categoriesError;
  const isUsingMockData = roles.length > 0 && roles[0].id === '1'; // Check if using mock data

  // New role form state
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    level: 100,
    tenant_id: currentTenant?.id
  });

  const getRoleBadge = (role: Role) => {
    const levelColors = {
      0: 'bg-red-100 text-red-800 border-red-200',
      10: 'bg-orange-100 text-orange-800 border-orange-200',
      20: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      30: 'bg-blue-100 text-blue-800 border-blue-200',
      40: 'bg-green-100 text-green-800 border-green-200',
      50: 'bg-green-100 text-green-800 border-green-200'
    };
    
    const colorKey = role.level <= 0 ? 0 : 
                    role.level <= 10 ? 10 :
                    role.level <= 20 ? 20 :
                    role.level <= 30 ? 30 :
                    role.level <= 40 ? 40 : 50;
    
    return (
      <Badge className={levelColors[colorKey]} variant="outline">
        {role.display_name}
      </Badge>
    );
  };

  const createNewRole = async () => {
    try {
      await createRoleMutation.mutateAsync(newRoleForm);
      setShowCreateRole(false);
      setNewRoleForm({
        name: '',
        display_name: '',
        description: '',
        level: 100,
        tenant_id: currentTenant?.id
      });
    } catch (error: any) {
      if (error.message.includes('غير متاح حالياً')) {
        toast({
          title: 'تنبيه',
          description: 'نظام الصلاحيات غير مُكتمل الإعداد. يرجى تطبيق migrations أولاً.',
          variant: 'destructive',
        });
      }
    }
  };

  const updateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      await updateRoleMutation.mutateAsync({ id: roleId, updates });
      setSelectedRole(null);
      setShowRoleDialog(false);
    } catch (error: any) {
      if (error.message.includes('غير متاح حالياً')) {
        toast({
          title: 'تنبيه',
          description: 'هذه الميزة غير متاحة حالياً في الوضع التجريبي.',
          variant: 'destructive',
        });
      }
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      setSelectedRole(null);
      setShowRoleDialog(false);
    } catch (error: any) {
      if (error.message.includes('غير متاح حالياً')) {
        toast({
          title: 'تنبيه',
          description: 'هذه الميزة غير متاحة حالياً في الوضع التجريبي.',
          variant: 'destructive',
        });
      }
    }
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await updateRolePermissionsMutation.mutateAsync({ roleId, permissionIds });
      setSelectedRole(null);
      setShowRoleDialog(false);
    } catch (error: any) {
      if (error.message.includes('غير متاح حالياً')) {
        toast({
          title: 'تنبيه',
          description: 'هذه الميزة غير متاحة حالياً في الوضع التجريبي.',
          variant: 'destructive',
        });
      }
    }
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter permissions based on category
  const filteredPermissions = selectedCategory === 'all' 
    ? Object.values(permissionsByCategory).flat()
    : permissionsByCategory[selectedCategory] || [];

  // Create role dialog component
  const CreateRoleDialog = () => (
    <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء دور جديد</DialogTitle>
          <DialogDescription>
            قم بإنشاء دور جديد مع تحديد مستوى الصلاحيات
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name">اسم الدور (بالإنجليزية)</Label>
            <Input
              id="role-name"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              placeholder="مثال: department_manager"
            />
          </div>
          
          <div>
            <Label htmlFor="role-display">الاسم المعروض</Label>
            <Input
              id="role-display"
              value={newRoleForm.display_name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, display_name: e.target.value })}
              placeholder="مثال: مدير القسم"
            />
          </div>
          
          <div>
            <Label htmlFor="role-desc">الوصف</Label>
            <Input
              id="role-desc"
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              placeholder="وصف مختصر لصلاحيات هذا الدور"
            />
          </div>
          
          <div>
            <Label htmlFor="role-level">مستوى الصلاحية (0-100)</Label>
            <Input
              id="role-level"
              type="number"
              min="0"
              max="100"
              value={newRoleForm.level}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, level: parseInt(e.target.value) || 100 })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              أقل رقم = صلاحيات أكثر (0 = مدير النظام، 100 = مستخدم عادي)
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={createNewRole}
              disabled={!newRoleForm.name || !newRoleForm.display_name || createRoleMutation.isPending}
              className="flex-1"
            >
              {createRoleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  إنشاء...
                </>
              ) : (
                'إنشاء الدور'
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateRole(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Role details dialog component  
  const RoleDetailsDialog = () => {
    if (!selectedRole) return null;

    const rolePermissions = selectedRole.permissions || [];

    return (
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {selectedRole.display_name}
            </DialogTitle>
            <DialogDescription>
              إدارة صلاحيات دور: {selectedRole.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>مستوى الصلاحية</Label>
                <div className="text-lg font-semibold">{selectedRole.level}</div>
              </div>
              <div>
                <Label>عدد المستخدمين</Label>
                <div className="text-lg font-semibold">{selectedRole.user_count || 0}</div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-base font-semibold">الصلاحيات المُخصصة</Label>
              <div className="mt-2 space-y-2">
                {rolePermissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rolePermissions.map((permission: Permission) => (
                      <div key={permission.id} className="flex items-center space-x-2 p-2 border rounded">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">{permission.display_name}</div>
                          <div className="text-sm text-muted-foreground">{permission.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    لا توجد صلاحيات مُخصصة لهذا الدور
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                إغلاق
              </Button>
              {isUsingMockData && (
                <Badge variant="secondary" className="ml-2">
                  <Info className="w-3 h-3 mr-1" />
                  معاينة فقط
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (rolesLoading || permissionsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* تحذير إذا كان النظام يستخدم بيانات وهمية */}
      {isUsingMockData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>وضع العرض التجريبي</AlertTitle>
          <AlertDescription>
            يعرض النظام حالياً بيانات تجريبية. لتفعيل الميزات الكاملة، يرجى تطبيق إعدادات قاعدة البيانات.
            {' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal"
              onClick={() => window.open('docs/fix-permissions-error.md', '_blank')}
            >
              دليل الإعداد
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-right">نظام الصلاحيات المتقدم</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateRole(true)}
            className="flex items-center gap-2"
            disabled={isUsingMockData}
          >
            <Plus className="w-4 h-4" />
            دور جديد
          </Button>
          <Button 
            variant="outline"
            onClick={() => refetchRoles()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {systemStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{systemStats.total_roles}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأدوار</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <Key className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{systemStats.total_permissions}</div>
                <div className="text-sm text-muted-foreground">إجمالي الصلاحيات</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{systemStats.total_categories}</div>
                <div className="text-sm text-muted-foreground">فئات الصلاحيات</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <UserCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{systemStats.active_users_with_roles}</div>
                <div className="text-sm text-muted-foreground">مستخدمين نشطين</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الأدوار
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            الفئات
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            سجل الأنشطة
          </TabsTrigger>
        </TabsList>

        {/* الأدوار */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="البحث في الأدوار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                أدوار النظام ({filteredRoles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الدور</TableHead>
                    <TableHead>المستوى</TableHead>
                    <TableHead>عدد المستخدمين</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.display_name}</div>
                          <div className="text-sm text-muted-foreground">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground mt-1">{role.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(role)}
                        <div className="text-sm text-muted-foreground mt-1">
                          مستوى {role.level}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold">{role.user_count || 0}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                        {role.is_system && (
                          <Badge variant="outline" className="ml-2">
                            نظام
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!role.is_system && !isUsingMockData && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRole(role.id)}
                              disabled={deleteRoleMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        {/* الصلاحيات */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                صلاحيات النظام ({filteredPermissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصلاحية</TableHead>
                    <TableHead>المستوى</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.display_name}</div>
                          <div className="text-sm text-muted-foreground">{permission.name}</div>
                          {permission.description && (
                            <div className="text-sm text-muted-foreground mt-1">{permission.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            permission.level === 'admin' ? 'destructive' :
                            permission.level === 'write' ? 'default' : 'secondary'
                          }
                        >
                          {permission.level === 'admin' ? 'إدارة' :
                           permission.level === 'write' ? 'كتابة' : 'قراءة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {permission.category?.display_name || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.is_active ? "default" : "secondary"}>
                          {permission.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                        {permission.is_system && (
                          <Badge variant="outline" className="ml-2">
                            نظام
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الفئات */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                فئات الصلاحيات ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const categoryPermissions = permissionsByCategory[category.name] || [];
                  return (
                    <Card key={category.id}>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            {category.icon === 'Crown' && <Crown className="w-6 h-6" />}
                            {category.icon === 'Users' && <Users className="w-6 h-6" />}
                            {category.icon === 'Settings' && <Settings className="w-6 h-6" />}
                            {category.icon === 'UserCheck' && <UserCheck className="w-6 h-6" />}
                            {category.icon === 'Shield' && <Shield className="w-6 h-6" />}
                            {category.icon === 'Eye' && <Eye className="w-6 h-6" />}
                          </div>
                          <h3 className="font-semibold">{category.display_name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          <div className="mt-3">
                            <Badge variant="outline">
                              {categoryPermissions.length} صلاحية
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* سجل الأنشطة */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                سجل الأنشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النشاط</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.user_id}</TableCell>
                        <TableCell>
                          {log.details && (
                            <div className="text-sm text-muted-foreground">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أنشطة مسجلة</p>
                  {isUsingMockData && (
                    <p className="text-sm mt-2">سيتم عرض الأنشطة بعد تفعيل النظام الكامل</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRoleDialog />
      <RoleDetailsDialog />
    </div>
  );
};

export default AdvancedPermissions;