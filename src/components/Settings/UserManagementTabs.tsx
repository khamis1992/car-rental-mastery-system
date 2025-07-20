import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  UserX,
  Shield,
  Activity
} from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
  invited_by: string;
  accepted_at?: string;
}

interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles?: {
    full_name: string;
    user_id: string;
  };
}

interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const UserManagementTabs: React.FC = () => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant?.id) {
      loadData();
    }
  }, [currentTenant?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInvitations(),
        loadUsers(),
        loadActivities()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // استعلام مباشر للحصول على المستخدمين مع البروفايل
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          role
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // تحويل البيانات لتتوافق مع TenantUser interface
      const usersData = data?.map(profile => ({
        id: profile.user_id,
        tenant_id: currentTenant?.id || '',
        user_id: profile.user_id,
        role: profile.role || 'user',
        status: 'active',
        joined_at: new Date().toISOString(),
        profiles: {
          full_name: profile.full_name || 'غير محدد',
          user_id: profile.user_id
        }
      })) || [];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // إضافة معلومات البروفايل للأنشطة
      const activitiesWithProfiles = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', activity.user_id)
              .single();
            
            return {
              ...activity,
              profiles: profile ? { full_name: profile.full_name } : { full_name: 'مستخدم غير محدد' }
            };
          }
          return {
            ...activity,
            profiles: { full_name: 'النظام' }
          };
        })
      );
      
      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الدعوة بنجاح",
      });

      loadInvitations();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء الدعوة",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitation: Invitation) => {
    try {
      // إنشاء دعوة جديدة
      const { data: result, error } = await supabase
        .rpc('create_user_invitation', {
          email_param: invitation.email,
          role_param: invitation.role
        });

      if (error) throw error;

      const invitationData = result as { success: boolean; error?: string };
      
      if (!invitationData.success) {
        throw new Error(invitationData.error || 'فشل في إعادة الإرسال');
      }

      // إلغاء الدعوة القديمة
      await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitation.id);

      toast({
        title: "تم الإرسال",
        description: "تم إعادة إرسال الدعوة بنجاح",
      });

      loadInvitations();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إعادة إرسال الدعوة",
        variant: "destructive",
      });
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      toast({
        title: "تم إلغاء التفعيل",
        description: "تم إلغاء تفعيل المستخدم بنجاح",
      });

      loadUsers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء تفعيل المستخدم",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      tenant_admin: 'مدير المؤسسة',
      manager: 'مدير',
      accountant: 'محاسب',
      receptionist: 'موظف استقبال',
      user: 'مستخدم عادي'
    };
    return roleLabels[role] || role;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-500',
      accepted: 'bg-green-500',
      expired: 'bg-red-500',
      cancelled: 'bg-gray-500',
      active: 'bg-green-500',
      inactive: 'bg-red-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'معلقة',
      accepted: 'مقبولة',
      expired: 'منتهية الصلاحية',
      cancelled: 'ملغاة',
      active: 'نشط',
      inactive: 'غير نشط'
    };
    return statusLabels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="invitations" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="invitations" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          الدعوات ({invitations.length})
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          المستخدمين ({users.length})
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          سجل النشاط
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invitations">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">دعوات المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد دعوات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الإجراءات</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right">تاريخ الإرسال</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resendInvitation(invitation)}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cancelInvitation(invitation.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(invitation.expires_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(invitation.invited_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`text-white ${getStatusColor(invitation.status)}`}>
                          {getStatusLabel(invitation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {getRoleLabel(invitation.role)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">المستخدمين النشطين</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد مستخدمين</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الإجراءات</TableHead>
                    <TableHead className="text-right">تاريخ الانضمام</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deactivateUser(user.user_id)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(user.joined_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`text-white ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.profiles?.full_name || 'غير محدد'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">سجل نشاط المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد نشاط مسجل</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(activity.created_at)}
                      </span>
                      <span className="font-medium text-right">
                        {activity.profiles?.full_name || 'مستخدم غير محدد'}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {activity.action_type}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {activity.action_description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default UserManagementTabs;