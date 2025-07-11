import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users, 
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Mail,
  Calendar,
  Shield,
  Building,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserManagementService, UserWithRole, RoleStats } from "@/services/userManagementService";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const RealUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user',
    tenantId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        UserManagementService.getAllUsersWithRoles(),
        UserManagementService.getRoleStats()
      ]);
      
      setUsers(usersData);
      setRoleStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const success = await UserManagementService.updateUserRole(userId, newRole);
      if (success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث دور المستخدم بنجاح"
        });
        loadData(); // إعادة تحميل البيانات
      } else {
        throw new Error('فشل في التحديث');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث دور المستخدم",
        variant: "destructive"
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا المستخدم؟')) {
      return;
    }

    try {
      const success = await UserManagementService.removeUser(userId);
      if (success) {
        toast({
          title: "تم الحذف",
          description: "تم إزالة المستخدم بنجاح"
        });
        loadData();
      } else {
        throw new Error('فشل في الحذف');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إزالة المستخدم",
        variant: "destructive"
      });
    }
  };

  const handleInviteUser = async () => {
    try {
      const success = await UserManagementService.inviteUser(
        inviteForm.email,
        inviteForm.role,
        inviteForm.tenantId
      );
      
      if (success) {
        toast({
          title: "تم الإرسال",
          description: "تم إرسال دعوة المستخدم بنجاح"
        });
        setShowInviteDialog(false);
        setInviteForm({ email: '', role: 'user', tenantId: '' });
        loadData();
      } else {
        throw new Error('فشل في الإرسال');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال الدعوة",
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'super_admin': 'bg-red-100 text-red-800 border-red-200',
      'tenant_admin': 'bg-orange-100 text-orange-800 border-orange-200',
      'manager': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accountant': 'bg-blue-100 text-blue-800 border-blue-200',
      'receptionist': 'bg-green-100 text-green-800 border-green-200',
      'user': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const roleNames: Record<string, string> = {
      'super_admin': 'مدير عام',
      'tenant_admin': 'مدير مؤسسة',
      'manager': 'مدير',
      'accountant': 'محاسب',
      'receptionist': 'موظف استقبال',
      'user': 'مستخدم'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {roleNames[role] || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };

    const statusNames = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'pending': 'معلق'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {statusNames[status as keyof typeof statusNames] || status}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-right">إدارة المستخدمين</h2>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          دعوة مستخدم
        </Button>
      </div>

      {/* إحصائيات الأدوار */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {roleStats.map((stat) => (
          <Card key={stat.role}>
            <CardContent className="pt-4">
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.userCount}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {stat.role === 'super_admin' && 'مدير عام'}
                  {stat.role === 'tenant_admin' && 'مدير مؤسسة'}
                  {stat.role === 'manager' && 'مدير'}
                  {stat.role === 'accountant' && 'محاسب'}
                  {stat.role === 'receptionist' && 'استقبال'}
                  {stat.role === 'user' && 'مستخدم'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث بالبريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلترة بالدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="super_admin">مدير عام</SelectItem>
                <SelectItem value="tenant_admin">مدير مؤسسة</SelectItem>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Users className="w-5 h-5" />
            المستخدمون ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">المؤسسة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الانضمام</TableHead>
                  <TableHead className="text-right">آخر دخول</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد مستخدمين متطابقين مع البحث</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.tenant_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(user.joined_at), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.last_sign_in_at ? 
                            format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ar }) :
                            'لم يدخل مطلقاً'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUpdateRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">مدير عام</SelectItem>
                              <SelectItem value="tenant_admin">مدير مؤسسة</SelectItem>
                              <SelectItem value="manager">مدير</SelectItem>
                              <SelectItem value="accountant">محاسب</SelectItem>
                              <SelectItem value="receptionist">استقبال</SelectItem>
                              <SelectItem value="user">مستخدم</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* دايلوج دعوة مستخدم */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>دعوة مستخدم جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المستخدم الجديد لإرسال دعوة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">الدور</label>
              <Select value={inviteForm.role} onValueChange={(role) => setInviteForm({...inviteForm, role})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">مدير مؤسسة</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="receptionist">موظف استقبال</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleInviteUser} className="flex-1">
                إرسال الدعوة
              </Button>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealUserManagement;