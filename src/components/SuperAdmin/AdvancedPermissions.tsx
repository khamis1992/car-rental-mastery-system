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
  useUpdateRolePermissions,
  useAuditLogs,
  usePermissionSystemStats
} from '@/hooks/usePermissions';
import { useTenant } from '@/contexts/TenantContext';
import type { Role, Permission, PermissionCategory } from '@/services/permissionsService';

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

const AdvancedPermissions: React.FC = () => {
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const { t, msg, formatNumber } = useTranslation();
  
  // State management
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showDeleteRole, setShowDeleteRole] = useState(false);
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

  // Reset form
  const resetNewRoleForm = () => {
    setNewRoleForm({
      name: '',
      display_name: '',
      description: '',
      level: 100,
      tenant_id: currentTenant?.id
    });
  };

  // تعريف أعمدة جدول الأدوار
  const roleColumns = [
    {
      key: 'display_name',
      title: 'اسم الدور',
      sortable: true,
      render: (value: string, row: Role) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            row.is_system ? 'bg-primary/10' : 'bg-muted'
          }`}>
            {row.is_system ? <Crown className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.name}</div>
          </div>
        </div>
      )
    },
    {
      key: 'level',
      title: 'المستوى',
      align: 'center' as const,
      render: (level: number) => (
        <Badge variant={level <= 10 ? 'default' : level <= 50 ? 'secondary' : 'outline'}>
          {level}
        </Badge>
      )
    },
    {
      key: 'user_count',
      title: 'المستخدمين',
      align: 'center' as const,
      render: (count: number) => (
        <span className="font-medium">{formatNumber(count || 0)}</span>
      )
    },
    {
      key: 'description',
      title: 'الوصف',
      render: (description: string) => (
        <span className="text-sm text-muted-foreground">
          {description || 'لا يوجد وصف'}
        </span>
      )
    }
  ];

  // تعريف إجراءات الأدوار
  const roleActions = [
    {
      label: 'عرض الصلاحيات',
      icon: <Eye className="w-4 h-4" />,
      onClick: (role: Role) => {
        setSelectedRole(role);
        setShowRoleDialog(true);
      }
    },
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (role: Role) => {
        if (role.is_system) {
          toast({
            title: 'غير مسموح',
            description: 'لا يمكن تحرير أدوار النظام',
            variant: 'destructive'
          });
          return;
        }
        setSelectedRole(role);
        setNewRoleForm({
          name: role.name,
          display_name: role.display_name,
          description: role.description,
          level: role.level,
          tenant_id: role.tenant_id
        });
        setShowCreateRole(true);
      },
      disabled: (role: Role) => role.is_system
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (role: Role) => {
        if (role.is_system) {
          toast({
            title: 'غير مسموح',
            description: 'لا يمكن حذف أدوار النظام',
            variant: 'destructive'
          });
          return;
        }
        setRoleToDelete(role);
        setShowDeleteRole(true);
      },
      variant: 'destructive' as const,
      separator: true,
      disabled: (role: Role) => role.is_system
    }
  ];

  // معالج إنشاء/تحديث الدور
  const handleCreateRole = async () => {
    try {
      if (selectedRole) {
        // تحديث دور موجود
        await updateRoleMutation.mutateAsync({
          id: selectedRole.id,
          updates: {
            name: newRoleForm.name,
            display_name: newRoleForm.display_name,
            description: newRoleForm.description,
            level: newRoleForm.level
          }
        });
        toast({
          title: 'تم التحديث بنجاح',
          description: `تم تحديث الدور ${newRoleForm.display_name} بنجاح`
        });
      } else {
        // إنشاء دور جديد
        await createRoleMutation.mutateAsync({
          ...newRoleForm,
          is_active: true,
          is_system: false,
          is_default: false
        });
        toast({
          title: 'تم الإنشاء بنجاح',
          description: `تم إنشاء الدور ${newRoleForm.display_name} بنجاح`
        });
      }
      
      setShowCreateRole(false);
      setSelectedRole(null);
      resetNewRoleForm();
      refetchRoles();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء العملية',
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
      setShowDeleteRole(false);
      setRoleToDelete(null);
      refetchRoles();
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء الحذف',
        variant: 'destructive'
      });
    }
  };

  // If there are critical errors, show fallback
  if (hasCriticalErrors && !isUsingMockData) {
    return (
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Shield className="w-5 h-5" />
              نظام الصلاحيات المتقدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">خطأ في تحميل نظام الصلاحيات</AlertTitle>
              <AlertDescription className="text-red-700">
                {msg('error', 'database')} يرجى التحقق من إعدادات قاعدة البيانات أو التواصل مع المطور.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">نظام الصلاحيات المتقدم</h2>
            <p className="text-muted-foreground">
              إدارة الأدوار والصلاحيات للمستخدمين
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={() => refetchRoles()}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              تحديث
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName="دور جديد"
              onClick={() => {
                setSelectedRole(null);
                resetNewRoleForm();
                setShowCreateRole(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              دور جديد
            </ActionButton>
          </div>
        </div>

        {/* System Stats */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">الأدوار</p>
                    <p className="text-2xl font-bold text-right">{formatNumber(systemStats.total_roles)}</p>
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
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">الصلاحيات</p>
                    <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(systemStats.total_permissions)}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">المستخدمين النشطين</p>
                    <p className="text-2xl font-bold text-purple-600 text-right">{formatNumber(systemStats.active_users_with_roles)}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">آخر تحديث</p>
                    <p className="text-2xl font-bold text-orange-600 text-right">اليوم</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles">الأدوار</TabsTrigger>
            <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
            <TabsTrigger value="audit">سجل التتبع</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <LoadingState
              loading={rolesLoading}
              error={rolesError?.message}
              isEmpty={roles.length === 0}
              emptyMessage="لا توجد أدوار مُعرّفة"
              onRetry={refetchRoles}
            >
              <EnhancedTable
                data={roles}
                columns={roleColumns}
                actions={roleActions}
                searchable
                searchPlaceholder="البحث في الأدوار..."
                onRefresh={refetchRoles}
                emptyMessage="لا توجد أدوار مُعرّفة"
                maxHeight="600px"
                stickyHeader
              />
            </LoadingState>
          </TabsContent>

          <TabsContent value="permissions">
            <LoadingState
              loading={permissionsLoading}
              error={permissionsError?.message}
              isEmpty={Object.keys(permissionsByCategory).length === 0}
              emptyMessage="لا توجد صلاحيات مُعرّفة"
            >
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([categoryName, permissions]) => (
                  <Card key={categoryName}>
                    <CardHeader>
                      <CardTitle className="text-lg">{categoryName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(permissions as Permission[]).map((permission: Permission) => (
                          <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{permission.display_name}</div>
                              <div className="text-xs text-muted-foreground">{permission.name}</div>
                            </div>
                            <Badge variant={permission.level === 'admin' ? 'destructive' : 
                                          permission.level === 'write' ? 'default' : 'secondary'}>
                              {permission.level}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </LoadingState>
          </TabsContent>

          <TabsContent value="audit">
            <LoadingState
              loading={auditLoading}
              isEmpty={auditLogs.length === 0}
              emptyMessage="لا توجد سجلات تتبع"
            >
              <Card>
                <CardHeader>
                  <CardTitle>سجل تتبع الصلاحيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{log.action}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </div>
                        </div>
                        <Badge>{log.details?.role_name || 'غير محدد'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </LoadingState>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Role Dialog */}
        <EnhancedDialog
          open={showCreateRole}
          onOpenChange={setShowCreateRole}
          title={selectedRole ? 'تحرير الدور' : 'إنشاء دور جديد'}
          description={selectedRole ? 'تحديث معلومات الدور' : 'إنشاء دور جديد مع تحديد الصلاحيات'}
          size="md"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name">اسم الدور (بالإنجليزية)</Label>
                <Input
                  id="role-name"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="manager"
                />
              </div>
              <div>
                <Label htmlFor="role-display-name">الاسم المعروض</Label>
                <Input
                  id="role-display-name"
                  value={newRoleForm.display_name}
                  onChange={(e) => setNewRoleForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="مدير"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role-level">مستوى الدور</Label>
              <Select
                value={newRoleForm.level.toString()}
                onValueChange={(value) => setNewRoleForm(prev => ({ ...prev, level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستوى الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 - مدير المؤسسة</SelectItem>
                  <SelectItem value="20">20 - مدير</SelectItem>
                  <SelectItem value="30">30 - محاسب</SelectItem>
                  <SelectItem value="40">40 - فني</SelectItem>
                  <SelectItem value="50">50 - موظف استقبال</SelectItem>
                  <SelectItem value="100">100 - مستخدم عادي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role-description">الوصف</Label>
              <Textarea
                id="role-description"
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر لدور المستخدم..."
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
              <ActionButton
                action={selectedRole ? "edit" : "create"}
                itemName="الدور"
                onClick={handleCreateRole}
                loading={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {selectedRole ? 'تحديث' : 'إنشاء'}
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Role Details Dialog */}
        <EnhancedDialog
          open={showRoleDialog}
          onOpenChange={setShowRoleDialog}
          title={selectedRole ? `صلاحيات ${selectedRole.display_name}` : ''}
          description="عرض وإدارة صلاحيات الدور"
          size="lg"
          showCloseButton
        >
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم الدور</Label>
                  <div className="mt-1 text-sm">{selectedRole.display_name}</div>
                </div>
                <div>
                  <Label>المستوى</Label>
                  <div className="mt-1 text-sm">{selectedRole.level}</div>
                </div>
              </div>
              
              <div>
                <Label>الوصف</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedRole.description || 'لا يوجد وصف'}
                </div>
              </div>

              <div>
                <Label>الصلاحيات</Label>
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRole.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{permission.display_name}</span>
                          <Badge variant="outline">{permission.level}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center border rounded">
                      لا توجد صلاحيات محددة لهذا الدور
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </EnhancedDialog>

        {/* Delete Role Dialog */}
        <EnhancedDialog
          open={showDeleteRole}
          onOpenChange={setShowDeleteRole}
          title="تأكيد حذف الدور"
          description="هذا الإجراء لا يمكن التراجع عنه"
          size="sm"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    تحذير: حذف نهائي
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    سيتم حذف الدور وجميع الصلاحيات المرتبطة به
                  </p>
                </div>
              </div>
            </div>

            {roleToDelete && (
              <div>
                <Label>الدور المراد حذفه</Label>
                <div className="mt-1 font-medium">{roleToDelete.display_name}</div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteRole(false);
                  setRoleToDelete(null);
                }}
              >
                إلغاء
              </Button>
              <ActionButton
                action="delete"
                itemName="الدور"
                onClick={handleDeleteRole}
                variant="destructive"
                loading={deleteRoleMutation.isPending}
              >
                حذف نهائي
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedPermissions;