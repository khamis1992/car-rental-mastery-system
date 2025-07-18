
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/enhanced-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Mail, Shield, Calendar, Loader2, UserX, Edit } from 'lucide-react';
import { TenantService } from '@/services/tenantService';
import { TenantUser, TenantInvitation } from '@/types/tenant';
import { toast } from '@/hooks/use-toast';

interface TenantUsersDialogProps {
  tenantId: string;
  tenantName: string;
  isOpen: boolean;
  onClose: () => void;
}

const TenantUsersDialog: React.FC<TenantUsersDialogProps> = ({
  tenantId,
  tenantName,
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user' as TenantUser['role']
  });
  const [inviting, setInviting] = useState(false);

  const tenantService = new TenantService();

  useEffect(() => {
    if (isOpen && tenantId) {
      loadUsers();
    }
  }, [isOpen, tenantId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await tenantService.getTenantUsers(tenantId);
      setUsers(userData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;

    try {
      setInviting(true);
      const invitation: TenantInvitation = {
        email: inviteForm.email,
        role: inviteForm.role,
        tenant_id: tenantId
      };

      await tenantService.inviteUser(invitation);
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الدعوة بنجاح",
      });

      setInviteForm({ email: '', role: 'user' });
      setShowInviteForm(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال الدعوة",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      tenant_admin: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "مدير المؤسسة" },
      manager: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "مدير" },
      accountant: { className: "bg-green-100 text-green-800 border-green-200", label: "محاسب" },
      receptionist: { className: "bg-orange-100 text-orange-800 border-orange-200", label: "استقبال" },
      user: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "مستخدم" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { className: "bg-green-100 text-green-800 border-green-200", label: "نشط" },
      inactive: { className: "bg-red-100 text-red-800 border-red-200", label: "غير نشط" },
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "في الانتظار" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            إدارة مستخدمي {tenantName}
          </DialogTitle>
          <DialogDescription>
            عرض وإدارة جميع المستخدمين المنتسبين لهذه المؤسسة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">قائمة المستخدمين</h3>
              <p className="text-sm text-muted-foreground">
                إجمالي المستخدمين: {users.length}
              </p>
            </div>
            <Button 
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              دعوة مستخدم جديد
            </Button>
          </div>

          {/* Invite Form */}
          {showInviteForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  دعوة مستخدم جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">الدور</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as TenantUser['role'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="receptionist">استقبال</SelectItem>
                          <SelectItem value="accountant">محاسب</SelectItem>
                          <SelectItem value="manager">مدير</SelectItem>
                          <SelectItem value="tenant_admin">مدير المؤسسة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={inviting}>
                      {inviting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          إرسال الدعوة
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowInviteForm(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin ml-2" />
                  <span>جاري تحميل المستخدمين...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <UserX className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا يوجد مستخدمين</h3>
                  <p className="text-muted-foreground text-center">
                    لم يتم تسجيل أي مستخدمين في هذه المؤسسة بعد
                  </p>
                  <Button 
                    onClick={() => setShowInviteForm(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    دعوة أول مستخدم
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">الدور</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الانضمام</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.profiles?.full_name || 'غير محدد'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {user.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.joined_at).toLocaleDateString('ar-SA')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Shield className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenantUsersDialog;
