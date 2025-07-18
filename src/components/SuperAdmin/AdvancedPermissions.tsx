import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  useRoles,
  usePermissionsByCategory,
  usePermissionCategories,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAuditLogs,
  usePermissionSystemStats
} from '@/hooks/useRoleBasedAccess';
import { useTenant } from '@/contexts/TenantContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// تعريف أنواع البيانات
interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
  is_active: boolean;
  is_system: boolean;
  is_default: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

// نوع للإحصائيات
interface SystemStats {
  total_users: number;
  active_roles: number;
  total_permissions: number;
  recent_logins: number;
}

const AdvancedPermissions: React.FC = () => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  
  // States
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
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

  // Check if there are any critical errors indicating missing tables
  const hasCriticalErrors = rolesError || permissionsError || categoriesError;
  const isUsingMockData = roles.length > 0 && roles[0].id === '1';

  // New role form state - إضافة الخصائص المفقودة
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    level: 100,
    is_active: true,
    is_system: false,
    is_default: false,
    tenant_id: currentTenant?.id
  });

  // Reset form
  const resetNewRoleForm = () => {
    setNewRoleForm({
      name: '',
      display_name: '',
      description: '',
      level: 100,
      is_active: true,
      is_system: false,
      is_default: false,
      tenant_id: currentTenant?.id
    });
  };

  // تعريف أعمدة جدول الأدوار
  const roleColumns = [
    {
      key: 'display_name',
      label: 'اسم الدور',
      sortable: true,
      render: (role: Role) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Crown className={`w-4 h-4 ${role.is_system ? 'text-yellow-500' : 'text-gray-400'}`} />
          <span className="font-medium">{role.display_name}</span>
          {role.is_default && <Badge variant="secondary" className="text-xs">افتراضي</Badge>}
        </div>
      )
    },
    {
      key: 'description',
      label: 'الوصف',
      sortable: false,
      render: (role: Role) => (
        <span className="text-gray-600 text-sm">{role.description || 'لا يوجد وصف'}</span>
      )
    },
    {
      key: 'level',
      label: 'المستوى',
      sortable: true,
      render: (role: Role) => (
        <Badge variant={role.level >= 900 ? 'destructive' : role.level >= 500 ? 'default' : 'secondary'}>
          {role.level}
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'الحالة',
      sortable: true,
      render: (role: Role) => (
        <Badge variant={role.is_active ? 'default' : 'secondary'}>
          {role.is_active ? 'نشط' : 'غير نشط'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      sortable: false,
      render: (role: Role) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole(role);
              setNewRoleForm({
                name: role.name,
                display_name: role.display_name,
                description: role.description,
                level: role.level,
                is_active: role.is_active,
                is_system: role.is_system,
                is_default: role.is_default,
                tenant_id: role.tenant_id
              });
              setShowCreateRole(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRoleToDelete(role)}
            disabled={role.is_system}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  // معالج إنشاء/تحديث الدور - إصلاح mutation calls
  const handleCreateRole = async () => {
    try {
      if (selectedRole) {
        // تحديث دور موجود - إصلاح تمرير البيانات
        await updateRoleMutation.mutateAsync({
          id: selectedRole.id,
          updates: {
            name: newRoleForm.name,
            display_name: newRoleForm.display_name,
            description: newRoleForm.description,
            level: newRoleForm.level,
            is_active: newRoleForm.is_active,
            is_system: newRoleForm.is_system,
            is_default: newRoleForm.is_default
          }
        });
        toast({
          title: 'تم التحديث بنجاح',
          description: `تم تحديث الدور ${newRoleForm.display_name} بنجاح`
        });
      } else {
        // إنشاء دور جديد - إضافة الخصائص المطلوبة
        await createRoleMutation.mutateAsync({
          ...newRoleForm,
          tenant_id: currentTenant?.id
        });
        toast({
          title: 'تم الإنشاء بنجاح',
          description: `تم إنشاء الدور ${newRoleForm.display_name} بنجاح`
        });
      }
      
      setShowCreateRole(false);
      setSelectedRole(null);
      resetNewRoleForm();
      await refetchRoles(); // إضافة await
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    }
  };

  // معالج حذف الدور
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRoleMutation.mutateAsync(roleToDelete.id);
      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف الدور ${roleToDelete.display_name} بنجاح`
      });
      setRoleToDelete(null);
      await refetchRoles(); // إضافة await
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'لا يمكن حذف هذا الدور',
        variant: 'destructive'
      });
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('ar-SA');
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // إصلاح معالج الأحداث - تجنب استخدام refetch مباشرة
  const handleRefreshRoles = async () => {
    try {
      await refetchRoles();
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث قائمة الأدوار بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث البيانات',
        variant: 'destructive'
      });
    }
  };

  if (hasCriticalErrors) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">خطأ في النظام</AlertTitle>
          <AlertDescription className="text-red-700">
            حدث خطأ في تحميل بيانات الأدوار والصلاحيات. قد تكون الجداول غير موجودة أو هناك مشكلة في الاتصال.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshRoles}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأدوار والصلاحيات المتقدمة</h1>
          <p className="text-gray-600 mt-2">إدارة شاملة لأدوار المستخدمين وصلاحياتهم في النظام</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button
            onClick={handleRefreshRoles}
            variant="outline"
            disabled={rolesLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${rolesLoading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button
            onClick={() => {
              resetNewRoleForm();
              setSelectedRole(null);
              setShowCreateRole(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            دور جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات النظام - إصلاح active_users */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-purple-600 text-right">
                  {formatNumber(systemStats?.total_users || 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">الأدوار النشطة</p>
                <p className="text-2xl font-bold text-blue-600 text-right">
                  {formatNumber(systemStats?.active_roles || 0)}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">إجمالي الصلاحيات</p>
                <p className="text-2xl font-bold text-green-600 text-right">
                  {formatNumber(systemStats?.total_permissions || 0)}
                </p>
              </div>
              <Key className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">دخول حديث</p>
                <p className="text-2xl font-bold text-orange-600 text-right">
                  {formatNumber(systemStats?.recent_logins || 0)}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          <TabsTrigger value="matrix">مصفوفة الصلاحيات</TabsTrigger>
          <TabsTrigger value="audit">سجل المراجعة</TabsTrigger>
        </TabsList>

        {/* تبويب الأدوار */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Shield className="w-5 h-5" />
                  <span>إدارة الأدوار</span>
                </CardTitle>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="البحث في الأدوار..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="mr-2">جاري تحميل الأدوار...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRoles.length > 0 ? (
                    <div className="grid gap-4">
                      {filteredRoles.map((role) => (
                        <div key={role.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <Crown className={`w-6 h-6 ${role.is_system ? 'text-yellow-500' : 'text-gray-400'}`} />
                            <div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <h3 className="font-semibold">{role.display_name}</h3>
                                {role.is_default && <Badge variant="secondary" className="text-xs">افتراضي</Badge>}
                                {role.is_system && <Badge variant="outline" className="text-xs">نظام</Badge>}
                              </div>
                              <p className="text-sm text-gray-600">{role.description || 'لا يوجد وصف'}</p>
                              <div className="flex items-center space-x-4 space-x-reverse mt-2">
                                <span className="text-xs text-gray-500">المستوى: {role.level}</span>
                                <Badge variant={role.is_active ? 'default' : 'secondary'} className="text-xs">
                                  {role.is_active ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRole(role);
                                setNewRoleForm({
                                  name: role.name,
                                  display_name: role.display_name,
                                  description: role.description,
                                  level: role.level,
                                  is_active: role.is_active,
                                  is_system: role.is_system,
                                  is_default: role.is_default,
                                  tenant_id: role.tenant_id
                                });
                                setShowCreateRole(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRoleToDelete(role)}
                              disabled={role.is_system}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">لا توجد أدوار متاحة</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* باقي التبويبات - مُبسطة لتجنب الأخطاء */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">قريباً: إدارة الصلاحيات</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>مصفوفة الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">قريباً: مصفوفة الصلاحيات</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>سجل المراجعة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">قريباً: سجل المراجعة</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog إنشاء/تعديل الدور */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'تعديل الدور' : 'إنشاء دور جديد'}
            </DialogTitle>
            <DialogDescription>
              {selectedRole ? 'تعديل معلومات الدور الحالي' : 'إضافة دور جديد للنظام'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4" dir="rtl">
            <div>
              <Label htmlFor="role-name">اسم الدور (بالإنجليزية)</Label>
              <Input
                id="role-name"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثل: manager أو accountant"
              />
            </div>
            
            <div>
              <Label htmlFor="role-display-name">اسم الدور المعروض</Label>
              <Input
                id="role-display-name"
                value={newRoleForm.display_name}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="مثل: مدير أو محاسب"
              />
            </div>
            
            <div>
              <Label htmlFor="role-level">مستوى الدور</Label>
              <Select
                value={newRoleForm.level.toString()}
                onValueChange={(value) => setNewRoleForm(prev => ({ ...prev, level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 - مستخدم عادي</SelectItem>
                  <SelectItem value="200">200 - موظف</SelectItem>
                  <SelectItem value="300">300 - مشرف</SelectItem>
                  <SelectItem value="500">500 - مدير</SelectItem>
                  <SelectItem value="800">800 - مدير عام</SelectItem>
                  <SelectItem value="900">900 - مدير النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="role-description">وصف الدور</Label>
              <Textarea
                id="role-description"
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر لمهام ومسؤوليات هذا الدور"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateRole(false);
                  setSelectedRole(null);
                  resetNewRoleForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateRole}
                loading={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {createRoleMutation.isPending || updateRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedRole ? 'جاري التحديث...' : 'جاري الإنشاء...'}
                  </>
                ) : (
                  selectedRole ? 'تحديث الدور' : 'إنشاء الدور'
                )}
              </Button>
            </div>
          </div>
          
        </DialogContent>
      </Dialog>

      {/* AlertDialog حذف الدور */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الدور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الدور "{roleToDelete?.display_name}"؟ 
              هذا الإجراء لا يمكن التراجع عنه وقد يؤثر على المستخدمين المرتبطين بهذا الدور.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-2 space-x-reverse">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف الدور'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdvancedPermissions;