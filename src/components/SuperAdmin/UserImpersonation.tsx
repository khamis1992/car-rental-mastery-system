import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  User,
  Users,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Building2,
  Search,
  LogOut,
  UserCheck,
  Settings,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation } from '@/utils/translationUtils';
import { useRoleBasedAccess, PERMISSIONS, User as IUser } from '@/hooks/useRoleBasedAccess';

interface UserWithDetails extends IUser {
  tenantName?: string;
  lastLogin?: string;
  loginCount?: number;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
}

interface ImpersonationLog {
  id: string;
  adminUserId: string;
  adminUserName: string;
  targetUserId: string;
  targetUserName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  actions: string[];
  ipAddress: string;
}

const UserImpersonation: React.FC = () => {
  const { toast } = useToast();
  const { t, formatNumber } = useTranslation();
  const { 
    currentUser, 
    impersonatedUser, 
    isImpersonating, 
    hasPermission, 
    startImpersonation, 
    stopImpersonation 
  } = useRoleBasedAccess();

  // State management
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showImpersonationWarning, setShowImpersonationWarning] = useState(false);
  const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
    loadImpersonationLogs();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // محاكاة تحميل المستخدمين
      const mockUsers: UserWithDetails[] = [
        {
          id: '1',
          email: 'admin@gulf-transport.com',
          name: 'أحمد محمد',
          role: 'tenant-admin',
          tenantId: 'tenant-1',
          tenantName: 'شركة الخليج للنقل',
          isActive: true,
          status: 'active',
          lastLogin: '2024-01-15T14:30:00Z',
          loginCount: 245
        },
        {
          id: '2',
          email: 'manager@gulf-transport.com',
          name: 'سارة أحمد',
          role: 'manager',
          tenantId: 'tenant-1',
          tenantName: 'شركة الخليج للنقل',
          isActive: true,
          status: 'active',
          lastLogin: '2024-01-15T09:15:00Z',
          loginCount: 156
        },
        {
          id: '3',
          email: 'support@kuwait-cars.com',
          name: 'محمد علي',
          role: 'support',
          tenantId: 'tenant-2',
          tenantName: 'مؤسسة الكويت للسيارات',
          isActive: true,
          status: 'active',
          lastLogin: '2024-01-14T16:45:00Z',
          loginCount: 89
        },
        {
          id: '4',
          email: 'user@example.com',
          name: 'فاطمة خالد',
          role: 'user',
          tenantId: 'tenant-1',
          tenantName: 'شركة الخليج للنقل',
          isActive: false,
          status: 'suspended',
          lastLogin: '2024-01-10T12:00:00Z',
          loginCount: 23
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      toast({
        title: 'خطأ في تحميل المستخدمين',
        description: 'حدث خطأ أثناء تحميل قائمة المستخدمين',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadImpersonationLogs = async () => {
    try {
      // محاكاة تحميل سجلات انتحال الهوية
      const mockLogs: ImpersonationLog[] = [
        {
          id: '1',
          adminUserId: currentUser?.id || 'admin-1',
          adminUserName: currentUser?.name || 'مدير النظام',
          targetUserId: '1',
          targetUserName: 'أحمد محمد',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:30:00Z',
          duration: 30,
          actions: ['عرض لوحة التحكم', 'تحديث الملف الشخصي', 'عرض التقارير'],
          ipAddress: '192.168.1.100'
        }
      ];

      setImpersonationLogs(mockLogs);
    } catch (error) {
      console.error('Error loading impersonation logs:', error);
    }
  };

  // تعريف أعمدة جدول المستخدمين
  const userColumns = [
    {
      key: 'name',
      title: 'المستخدم',
      sortable: true,
      render: (value: string, row: UserWithDetails) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            row.role === 'super-admin' ? 'bg-red-100' :
            row.role === 'tenant-admin' ? 'bg-blue-100' :
            row.role === 'manager' ? 'bg-orange-100' :
            row.role === 'support' ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {row.role === 'super-admin' ? <Crown className="w-4 h-4 text-red-600" /> :
             row.role === 'tenant-admin' ? <Shield className="w-4 h-4 text-blue-600" /> :
             row.role === 'manager' ? <UserCheck className="w-4 h-4 text-orange-600" /> :
             row.role === 'support' ? <Settings className="w-4 h-4 text-green-600" /> :
             <User className="w-4 h-4 text-gray-600" />}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'الدور',
      align: 'center' as const,
      render: (role: string) => {
        const roleLabels = {
          'super-admin': 'مدير النظام',
          'tenant-admin': 'مدير المؤسسة',
          'manager': 'مدير',
          'accountant': 'محاسب',
          'support': 'دعم فني',
          'user': 'مستخدم'
        };
        const roleColors = {
          'super-admin': 'bg-red-100 text-red-800',
          'tenant-admin': 'bg-blue-100 text-blue-800',
          'manager': 'bg-orange-100 text-orange-800',
          'accountant': 'bg-purple-100 text-purple-800',
          'support': 'bg-green-100 text-green-800',
          'user': 'bg-gray-100 text-gray-800'
        };
        return (
          <Badge className={roleColors[role as keyof typeof roleColors]}>
            {roleLabels[role as keyof typeof roleLabels] || role}
          </Badge>
        );
      }
    },
    {
      key: 'tenantName',
      title: 'المؤسسة',
      render: (tenantName: string) => (
        <span className="text-sm text-muted-foreground">{tenantName || '-'}</span>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      align: 'center' as const,
      render: (status: string) => {
        const statusConfig = {
          active: { label: 'نشط', variant: 'default' as const, icon: CheckCircle },
          inactive: { label: 'غير نشط', variant: 'secondary' as const, icon: Clock },
          suspended: { label: 'معلق', variant: 'destructive' as const, icon: AlertTriangle }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'lastLogin',
      title: 'آخر دخول',
      render: (date: string) => (
        <span className="text-sm text-muted-foreground">
          {date ? new Date(date).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
        </span>
      )
    }
  ];

  // تعريف إجراءات المستخدمين
  const userActions = [
    {
      label: 'عرض التفاصيل',
      icon: <Eye className="w-4 h-4" />,
      onClick: (user: UserWithDetails) => {
        setSelectedUser(user);
        setShowUserDetails(true);
      }
    },
    {
      label: 'انتحال الهوية',
      icon: <User className="w-4 h-4" />,
      onClick: (user: UserWithDetails) => {
        setSelectedUser(user);
        setShowImpersonationWarning(true);
      },
      disabled: (user: UserWithDetails) => {
        // منع انتحال هوية نفس المستخدم أو Super Admin آخر
        return user.id === currentUser?.id || 
               (user.role === 'super-admin' && currentUser?.role !== 'super-admin') ||
               user.status === 'suspended' ||
               !hasPermission(PERMISSIONS.TENANT_IMPERSONATE);
      }
    }
  ];

  // معالج انتحال الهوية
  const handleImpersonation = () => {
    if (!selectedUser) return;

    startImpersonation(selectedUser);
    setShowImpersonationWarning(false);
    
    // تسجيل في السجلات
    const newLog: ImpersonationLog = {
      id: Date.now().toString(),
      adminUserId: currentUser?.id || '',
      adminUserName: currentUser?.name || '',
      targetUserId: selectedUser.id,
      targetUserName: selectedUser.name,
      startTime: new Date().toISOString(),
      actions: [],
      ipAddress: '192.168.1.100' // في التطبيق الحقيقي، احصل على IP الفعلي
    };
    
    setImpersonationLogs(prev => [newLog, ...prev]);
  };

  // إيقاف انتحال الهوية
  const handleStopImpersonation = () => {
    if (!impersonatedUser) return;

    // تحديث السجل
    setImpersonationLogs(prev => 
      prev.map(log => {
        if (log.targetUserId === impersonatedUser.id && !log.endTime) {
          const endTime = new Date().toISOString();
          const duration = Math.round(
            (new Date(endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60)
          );
          return { ...log, endTime, duration };
        }
        return log;
      })
    );

    stopImpersonation();
  };

  // فلترة المستخدمين
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // إحصائيات سريعة
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    sessions: impersonationLogs.filter(log => !log.endTime).length
  };

  // التحقق من الصلاحية
  if (!hasPermission(PERMISSIONS.TENANT_IMPERSONATE)) {
    return (
      <ErrorBoundary>
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">ليس لديك صلاحية</h3>
            <p className="text-muted-foreground">
              أنت بحاجة لصلاحيات خاصة للوصول إلى ميزة انتحال الهوية
            </p>
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
            <h2 className="text-2xl font-bold">انتحال هوية المستخدمين</h2>
            <p className="text-muted-foreground">
              عرض النظام من منظور المستخدمين الآخرين للاختبار والدعم
            </p>
          </div>
          {isImpersonating && (
            <EnhancedButton
              onClick={handleStopImpersonation}
              variant="destructive"
              icon={<LogOut className="w-4 h-4" />}
            >
              إيقاف انتحال الهوية
            </EnhancedButton>
          )}
        </div>

        {/* Current Impersonation Status */}
        {isImpersonating && impersonatedUser && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <EyeOff className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800">
                    أنت تتصفح حالياً بهوية: {impersonatedUser.name}
                  </h4>
                  <p className="text-sm text-yellow-600">
                    الدور: {impersonatedUser.role} | البريد: {impersonatedUser.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopImpersonation}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <LogOut className="w-4 h-4 ml-1" />
                  إيقاف
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold text-right">{formatNumber(stats.total)}</p>
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
                  <p className="text-sm font-medium text-muted-foreground text-right">نشط</p>
                  <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(stats.active)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">معلق</p>
                  <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(stats.suspended)}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">جلسات نشطة</p>
                  <p className="text-2xl font-bold text-orange-600 text-right">{formatNumber(stats.sessions)}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search-users">البحث في المستخدمين</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                  <Input
                    id="search-users"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="البحث بالاسم أو البريد..."
                    className="pr-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">تصفية حسب الدور</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأدوار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    <SelectItem value="tenant-admin">مدير المؤسسة</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="accountant">محاسب</SelectItem>
                    <SelectItem value="support">دعم فني</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">تصفية حسب الحالة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="w-full"
                >
                  مسح الفلاتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <LoadingState
          loading={loading}
          isEmpty={filteredUsers.length === 0}
          emptyMessage="لا توجد مستخدمين"
          onRetry={loadUsers}
        >
          <EnhancedTable
            data={filteredUsers}
            columns={userColumns}
            actions={userActions}
            emptyMessage="لا توجد مستخدمين مطابقين للفلتر"
            maxHeight="600px"
            stickyHeader
          />
        </LoadingState>

        {/* User Details Dialog */}
        <EnhancedDialog
          open={showUserDetails}
          onOpenChange={setShowUserDetails}
          title={selectedUser ? `تفاصيل المستخدم: ${selectedUser.name}` : ''}
          description="معلومات شاملة عن المستخدم"
          size="md"
          showCloseButton
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <div className="mt-1 text-sm">{selectedUser.name}</div>
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <div className="mt-1 text-sm">{selectedUser.email}</div>
                </div>
                <div>
                  <Label>الدور</Label>
                  <div className="mt-1 text-sm">{selectedUser.role}</div>
                </div>
                <div>
                  <Label>المؤسسة</Label>
                  <div className="mt-1 text-sm">{selectedUser.tenantName || '-'}</div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <div className="mt-1">
                    <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'}>
                      {selectedUser.status === 'active' ? 'نشط' : 
                       selectedUser.status === 'inactive' ? 'غير نشط' : 'معلق'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>عدد مرات الدخول</Label>
                  <div className="mt-1 text-sm">{formatNumber(selectedUser.loginCount || 0)}</div>
                </div>
              </div>
              
              {selectedUser.lastLogin && (
                <div>
                  <Label>آخر دخول</Label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedUser.lastLogin).toLocaleString('ar-SA')}
                  </div>
                </div>
              )}
            </div>
          )}
        </EnhancedDialog>

        {/* Impersonation Warning Dialog */}
        <EnhancedDialog
          open={showImpersonationWarning}
          onOpenChange={setShowImpersonationWarning}
          title="تأكيد انتحال الهوية"
          description="تحذير مهم"
          size="md"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    تحذير: انتحال الهوية
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>ستتمكن من الوصول لجميع بيانات هذا المستخدم</li>
                      <li>جميع الإجراءات ستُسجل في سجل المراجعة</li>
                      <li>المستخدم قد يتلقى إشعاراً بجلسة نشطة غير عادية</li>
                      <li>تأكد من الحصول على موافقة مناسبة قبل المتابعة</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {selectedUser && (
              <div>
                <Label>المستخدم المستهدف</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  <div className="text-sm text-muted-foreground">الدور: {selectedUser.role}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImpersonationWarning(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleImpersonation}
              >
                تأكيد انتحال الهوية
              </Button>
            </div>
          </div>
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default UserImpersonation; 