task-master initimport React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, Search, Wrench, Users, Building } from 'lucide-react';

interface DiagnosticResult {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  details?: any;
}

interface TenantData {
  id: string;
  name: string;
  status: string;
  contact_email: string;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  is_active: boolean;
}

interface TenantUserData {
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
}

export const TenantDiagnosticTool: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [tenantData, setTenantData] = useState<TenantData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [tenantUserData, setTenantUserData] = useState<TenantUserData[]>([]);
  const { toast } = useToast();

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // تشخيص شامل للنظام
  const runComprehensiveDiagnostic = async () => {
    setLoading(true);
    clearResults();

    try {
      // 1. فحص المؤسسات
      addResult({ type: 'warning', title: 'بدء التشخيص', message: 'جاري فحص النظام...' });

      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) {
        addResult({
          type: 'error',
          title: 'خطأ في فحص المؤسسات',
          message: tenantsError.message
        });
      } else {
        setTenantData(tenants || []);
        addResult({
          type: 'success',
          title: 'فحص المؤسسات',
          message: `تم العثور على ${tenants?.length || 0} مؤسسة`
        });
      }

      // 2. فحص المستخدمين
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        addResult({
          type: 'error',
          title: 'خطأ في فحص المستخدمين',
          message: profilesError.message
        });
      } else {
        setUserData(profiles || []);
        addResult({
          type: 'success',
          title: 'فحص المستخدمين',
          message: `تم العثور على ${profiles?.length || 0} مستخدم`
        });
      }

      // 3. فحص الروابط بين المستخدمين والمؤسسات
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select('*')
        .order('joined_at', { ascending: false });

      if (tenantUsersError) {
        addResult({
          type: 'error',
          title: 'خطأ في فحص الروابط',
          message: tenantUsersError.message
        });
      } else {
        setTenantUserData(tenantUsers || []);
        addResult({
          type: 'success',
          title: 'فحص الروابط',
          message: `تم العثور على ${tenantUsers?.length || 0} رابط مستخدم-مؤسسة`
        });
      }

      // 4. فحص المستخدمين المعزولين (بدون مؤسسة)
      const orphanedUsers = profiles?.filter(profile => 
        !tenantUsers?.some(tu => tu.user_id === profile.id)
      ) || [];

      if (orphanedUsers.length > 0) {
        addResult({
          type: 'warning',
          title: 'مستخدمون معزولون',
          message: `${orphanedUsers.length} مستخدم بدون مؤسسة`,
          details: orphanedUsers
        });
      }

      // 5. فحص المؤسسات بدون مديرين
      const tenantsWithoutAdmins = tenants?.filter(tenant =>
        !tenantUsers?.some(tu => tu.tenant_id === tenant.id && tu.role === 'tenant_admin')
      ) || [];

      if (tenantsWithoutAdmins.length > 0) {
        addResult({
          type: 'warning',
          title: 'مؤسسات بدون مديرين',
          message: `${tenantsWithoutAdmins.length} مؤسسة بدون مدير`,
          details: tenantsWithoutAdmins
        });
      }

      addResult({
        type: 'success',
        title: 'انتهاء التشخيص',
        message: 'تم إكمال التشخيص الشامل بنجاح'
      });

    } catch (error: any) {
      addResult({
        type: 'error',
        title: 'خطأ في التشخيص',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // البحث عن مستخدم محدد
  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال البريد الإلكتروني للبحث',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    clearResults();

    try {
      // البحث في auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      const foundAuthUser = authUser?.users.find(u => u.email === searchEmail);

      if (!foundAuthUser) {
        addResult({
          type: 'error',
          title: 'مستخدم غير موجود',
          message: `لم يتم العثور على مستخدم بالبريد: ${searchEmail}`
        });
        return;
      }

      addResult({
        type: 'success',
        title: 'تم العثور على المستخدم في Auth',
        message: `ID: ${foundAuthUser.id}`,
        details: foundAuthUser
      });

      // البحث في profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', foundAuthUser.id)
        .single();

      if (profileError) {
        addResult({
          type: 'error',
          title: 'خطأ في جلب الملف الشخصي',
          message: profileError.message
        });
      } else if (!profile) {
        addResult({
          type: 'warning',
          title: 'ملف شخصي مفقود',
          message: 'المستخدم موجود في Auth لكن لا يوجد له ملف شخصي في profiles'
        });
      } else {
        addResult({
          type: 'success',
          title: 'تم العثور على الملف الشخصي',
          message: `الاسم: ${profile.full_name}, الدور: ${profile.role}`,
          details: profile
        });
      }

      // البحث في tenant_users
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', foundAuthUser.id);

      if (tenantUsersError) {
        addResult({
          type: 'error',
          title: 'خطأ في جلب روابط المؤسسات',
          message: tenantUsersError.message
        });
      } else if (!tenantUsers || tenantUsers.length === 0) {
        addResult({
          type: 'warning',
          title: 'لا توجد روابط مؤسسات',
          message: 'المستخدم غير مرتبط بأي مؤسسة'
        });
      } else {
        addResult({
          type: 'success',
          title: 'روابط المؤسسات',
          message: `المستخدم مرتبط بـ ${tenantUsers.length} مؤسسة`,
          details: tenantUsers
        });
      }

    } catch (error: any) {
      addResult({
        type: 'error',
        title: 'خطأ في البحث',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // إصلاح مستخدم محدد
  const fixUser = async (userEmail: string) => {
    setLoading(true);
    
    try {
      // البحث عن المستخدم
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const foundUser = authUsers?.users.find(u => u.email === userEmail);

      if (!foundUser) {
        throw new Error('المستخدم غير موجود');
      }

      // التحقق من وجود ملف شخصي
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', foundUser.id)
        .single();

      if (!profile) {
        // إنشاء ملف شخصي
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: foundUser.id,
            email: foundUser.email,
            full_name: foundUser.user_metadata?.full_name || foundUser.email,
            role: 'admin',
            is_active: true
          });

        if (profileError) {
          throw profileError;
        }

        addResult({
          type: 'success',
          title: 'تم إنشاء الملف الشخصي',
          message: 'تم إنشاء ملف شخصي للمستخدم'
        });
      }

      // البحث عن مؤسسة البشائر
      const { data: bashayerTenant } = await supabase
        .from('tenants')
        .select('*')
        .ilike('name', '%البشائر%')
        .single();

      if (bashayerTenant) {
        // التحقق من وجود رابط
        const { data: existingLink } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', foundUser.id)
          .eq('tenant_id', bashayerTenant.id)
          .single();

        if (!existingLink) {
          // إنشاء رابط
          const { error: linkError } = await supabase
            .from('tenant_users')
            .insert({
              user_id: foundUser.id,
              tenant_id: bashayerTenant.id,
              role: 'tenant_admin',
              status: 'active',
              joined_at: new Date().toISOString()
            });

          if (linkError) {
            throw linkError;
          }

          addResult({
            type: 'success',
            title: 'تم ربط المستخدم بالمؤسسة',
            message: `تم ربط المستخدم بمؤسسة ${bashayerTenant.name}`
          });
        }
      }

      toast({
        title: 'نجح الإصلاح',
        description: 'تم إصلاح حساب المستخدم بنجاح'
      });

    } catch (error: any) {
      addResult({
        type: 'error',
        title: 'فشل الإصلاح',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            أداة تشخيص المؤسسات والمستخدمين
          </CardTitle>
          <CardDescription>
            أداة شاملة لتشخيص وإصلاح مشاكل المؤسسات والمستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnostic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diagnostic">تشخيص شامل</TabsTrigger>
              <TabsTrigger value="search">البحث عن مستخدم</TabsTrigger>
              <TabsTrigger value="data">عرض البيانات</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostic" className="space-y-4">
              <Button
                onClick={runComprehensiveDiagnostic}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'جاري التشخيص...' : 'بدء التشخيص الشامل'}
              </Button>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="searchEmail">البريد الإلكتروني</Label>
                  <Input
                    id="searchEmail"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني للبحث"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={searchUser} disabled={loading} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />
                    بحث
                  </Button>
                  <Button 
                    onClick={() => fixUser(searchEmail)} 
                    disabled={loading || !searchEmail}
                    variant="secondary"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    إصلاح
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4" />
                      المؤسسات ({tenantData.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tenantData.slice(0, 5).map(tenant => (
                      <div key={tenant.id} className="p-2 border rounded">
                        <div className="font-medium text-sm">{tenant.name}</div>
                        <div className="text-xs text-gray-500">{tenant.contact_email}</div>
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {tenant.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      المستخدمون ({userData.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userData.slice(0, 5).map(user => (
                      <div key={user.id} className="p-2 border rounded">
                        <div className="font-medium text-sm">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      الروابط ({tenantUserData.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tenantUserData.slice(0, 5).map((link, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="text-xs text-gray-500">
                          {userData.find(u => u.id === link.user_id)?.full_name || 'مستخدم غير معروف'}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {link.role}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج التشخيص</CardTitle>
            <Button onClick={clearResults} variant="outline" size="sm">
              مسح النتائج
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Alert key={index} className={
                  result.type === 'error' ? 'border-red-200 bg-red-50' :
                  result.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }>
                  <div className="flex items-start gap-2">
                    {result.type === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                    {result.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                    {result.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm">{result.message}</div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-600">
                              عرض التفاصيل
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* إصلاح سريع لمؤسسة البشائر */}
      <Card>
        <CardHeader>
          <CardTitle>إصلاح سريع لمؤسسة البشائر</CardTitle>
          <CardDescription>
            إصلاح فوري للمشاكل الشائعة في مؤسسة البشائر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => fixUser('admin@bashaererp.com')}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            إصلاح مشاكل مؤسسة البشائر
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 