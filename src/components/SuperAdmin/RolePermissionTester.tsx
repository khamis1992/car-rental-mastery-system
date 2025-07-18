import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TestTube,
  CheckCircle,
  XCircle,
  Shield,
  Crown,
  Users,
  User as UserIcon, // تغيير الاسم لتجنب التضارب
  Building2,
  Settings,
  Eye,
  AlertTriangle,
  Info,
  Play,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة ونظام الصلاحيات
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation } from '@/utils/translationUtils';
import { 
  RoleBasedAccessProvider, 
  useRoleBasedAccess, 
  PERMISSIONS, 
  ROLE_PERMISSIONS,
  User as UserType // تغيير الاسم لتجنب التضارب
} from '@/hooks/useRoleBasedAccess';

interface TestCase {
  id: string;
  name: string;
  description: string;
  module: string;
  permission: string;
  role: string;
  expectedResult: boolean;
  actualResult?: boolean;
  status?: 'passed' | 'failed' | 'pending';
  error?: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  status?: 'passed' | 'failed' | 'running' | 'pending';
  passedCount?: number;
  failedCount?: number;
  totalCount?: number;
}

// بيانات تجريبية للمستخدمين
const mockUsers: UserType[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'admin@company.com',
    role: 'super-admin',
    permissions: ROLE_PERMISSIONS['super-admin'] || [],
    isActive: true,
    avatar: undefined
  },
  {
    id: '2',
    name: 'سارة أحمد',
    email: 'manager@company.com',
    role: 'tenant-admin',
    permissions: ROLE_PERMISSIONS['tenant-admin'] || [],
    isActive: true,
    avatar: undefined
  },
  {
    id: '3',
    name: 'محمد علي',
    email: 'accountant@company.com',
    role: 'accountant',
    permissions: ROLE_PERMISSIONS['accountant'] || [],
    isActive: true,
    avatar: undefined
  },
  {
    id: '4',
    name: 'فاطمة خالد',
    email: 'manager@company.com',
    role: 'manager',
    permissions: ROLE_PERMISSIONS['manager'] || [],
    isActive: true,
    avatar: undefined
  },
  {
    id: '5',
    name: 'يوسف أحمد',
    email: 'technician@company.com',
    role: 'technician',
    permissions: ROLE_PERMISSIONS['technician'] || [],
    isActive: true,
    avatar: undefined
  },
  {
    id: '6',
    name: 'ليلى محمود',
    email: 'receptionist@company.com',
    role: 'receptionist',
    permissions: ROLE_PERMISSIONS['receptionist'] || [],
    isActive: true,
    avatar: undefined
  }
];

const TEST_CASES: TestCase[] = [
  // اختبارات الوحدات الحرجة
  {
    id: 'system-maintenance',
    name: 'أدوات الصيانة',
    description: 'الوصول لأدوات صيانة النظام',
    module: 'maintenance-tools',
    permission: PERMISSIONS.SYSTEM_MAINTENANCE,
    expectedResult: true,
    role: 'super-admin',
    status: 'pending'
  },
  {
    id: 'system-backup',
    name: 'النسخ الاحتياطي',
    description: 'إنشاء وإدارة النسخ الاحتياطية',
    module: 'backup-tools',
    permission: PERMISSIONS.SYSTEM_BACKUP,
    expectedResult: true,
    role: 'super-admin',
    status: 'pending'
  },
  {
    id: 'user-impersonation',
    name: 'انتحال الهوية',
    description: 'انتحال هوية المستخدمين الآخرين',
    module: 'user-impersonation',
    permission: PERMISSIONS.TENANT_IMPERSONATE,
    expectedResult: true,
    role: 'super-admin',
    status: 'pending'
  },
  {
    id: 'landing-publish',
    name: 'نشر الصفحات',
    description: 'نشر الصفحات المقصودة',
    module: 'landing-editor',
    permission: PERMISSIONS.LANDING_PUBLISH,
    expectedResult: true,
    role: 'super-admin',
    status: 'pending'
  },
  {
    id: 'permission-management',
    name: 'إدارة الصلاحيات',
    description: 'تعديل الأدوار والصلاحيات',
    module: 'permissions',
    permission: PERMISSIONS.PERMISSION_MANAGE,
    expectedResult: true,
    role: 'super-admin',
    status: 'pending'
  },

  // اختبارات الوحدات العادية
  {
    id: 'tenant-management',
    name: 'إدارة المؤسسات',
    description: 'عرض وإدارة المؤسسات',
    module: 'tenant-management',
    permission: PERMISSIONS.TENANT_VIEW,
    expectedResult: true,
    role: 'tenant-admin',
    status: 'pending'
  },
  {
    id: 'user-management',
    name: 'إدارة المستخدمين',
    description: 'عرض وإدارة المستخدمين',
    module: 'user-management',
    permission: PERMISSIONS.USER_VIEW,
    expectedResult: true,
    role: 'tenant-admin',
    status: 'pending'
  },
  {
    id: 'billing-management',
    name: 'إدارة الفوترة',
    description: 'عرض وإدارة الفوترة',
    module: 'billing',
    permission: PERMISSIONS.BILLING_VIEW,
    expectedResult: true,
    role: 'tenant-admin',
    status: 'pending'
  },

  // اختبارات الوحدات الأساسية
  {
    id: 'support-view',
    name: 'عرض الدعم الفني',
    description: 'عرض طلبات الدعم الفني',
    module: 'support',
    permission: PERMISSIONS.SUPPORT_VIEW,
    expectedResult: true,
    role: 'manager',
    status: 'pending'
  },
  {
    id: 'reports-view',
    name: 'عرض التقارير',
    description: 'عرض التقارير والإحصائيات',
    module: 'reports',
    permission: PERMISSIONS.REPORTS_VIEW,
    expectedResult: true,
    role: 'accountant',
    status: 'pending'
  }
];

const RolePermissionTester: React.FC = () => {
  const { toast } = useToast();
  const { t, formatNumber } = useTranslation();
  
  const [selectedRole, setSelectedRole] = useState<string>('super-admin');
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // تشغيل الاختبارات
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results: TestCase[] = [];
      
      // اختبار كل دور مع كل حالة اختبار
      for (const user of mockUsers) {
        for (const testCase of TEST_CASES) {
          if (selectedCategory !== 'all' && testCase.module !== selectedCategory) {
            continue;
          }

          try {
            // محاكاة فحص الصلاحية
            const userPermissions = user.permissions || [];
            const hasPermission = userPermissions.includes(testCase.permission);
            
            const expected = testCase.expectedResult;
            const actual = hasPermission;
            const passed = expected === actual;

            results.push({
              ...testCase,
              actualResult: actual,
              status: passed ? 'passed' : 'failed',
              error: passed ? undefined : `متوقع: ${expected ? 'لديه صلاحية' : 'ليس لديه صلاحية'}, الفعلي: ${actual ? 'لديه صلاحية' : 'ليس لديه صلاحية'}`
            });

            // إضافة تأخير صغير للمحاكاة
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.push({
              ...testCase,
              actualResult: false,
              status: 'failed',
              error: `خطأ في الاختبار: ${error}`
            });
          }
        }
      }

      setTestResults(results);
      setShowResults(true);
      
      // إحصائيات النتائج
      const totalTests = results.length;
      const passedTests = results.filter(r => r.status === 'passed').length;
      const failedTests = totalTests - passedTests;
      
      toast({
        title: 'اكتملت الاختبارات',
        description: `${passedTests}/${totalTests} اختباراً نجح (${Math.round(passedTests/totalTests*100)}%)`,
        variant: failedTests === 0 ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'خطأ في تشغيل الاختبارات',
        description: 'حدث خطأ أثناء تشغيل اختبارات الصلاحيات',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // تصفية الاختبارات حسب الفئة
  const filteredTests = selectedCategory === 'all' 
    ? TEST_CASES 
    : TEST_CASES.filter(test => test.module === selectedCategory);

  // إحصائيات النتائج
  const resultStats = testResults.length > 0 ? {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'passed').length,
    failed: testResults.filter(r => r.status === 'failed').length,
    byCategory: {
      critical: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.id);
        return test?.module === 'maintenance-tools' || test?.module === 'backup-tools' || test?.module === 'user-impersonation' || test?.module === 'landing-editor' || test?.module === 'permissions';
      }),
      normal: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.id);
        return test?.module === 'tenant-management' || test?.module === 'user-management' || test?.module === 'billing';
      }),
      basic: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.id);
        return test?.module === 'support' || test?.module === 'reports';
      })
    }
  } : null;

  // تعريف أعمدة جدول النتائج
  const resultColumns = [
    {
      key: 'name',
      title: 'الاختبار',
      render: (testCase: TestCase) => (
        <div className="flex items-center">
          <TestTube className="w-4 h-4 mr-2 text-blue-600" />
          {testCase.name}
        </div>
      )
    },
    {
      key: 'role',
      title: 'الدور',
      render: (testCase: TestCase) => {
        const roleLabels = {
          'super-admin': 'مدير النظام',
          'tenant-admin': 'مدير المؤسسة',
          'manager': 'مدير',
          'accountant': 'محاسب',
          'technician': 'فني دعم',
          'receptionist': 'موظف دعم'
        };
        return roleLabels[testCase.role as keyof typeof roleLabels] || testCase.role;
      }
    },
    {
      key: 'expected',
      title: 'المتوقع',
      align: 'center' as const,
      render: (testCase: TestCase) => (
        <Badge variant={testCase.expectedResult ? 'default' : 'secondary'}>
          {testCase.expectedResult ? 'لديه صلاحية' : 'ليس لديه صلاحية'}
        </Badge>
      )
    },
    {
      key: 'actual',
      title: 'الفعلي',
      align: 'center' as const,
      render: (testCase: TestCase) => (
        <Badge variant={testCase.actualResult ? 'default' : 'secondary'}>
          {testCase.actualResult ? 'لديه صلاحية' : 'ليس لديه صلاحية'}
        </Badge>
      )
    },
    {
      key: 'status',
      title: 'النتيجة',
      align: 'center' as const,
      render: (testCase: TestCase) => (
        <Badge variant={testCase.status === 'passed' ? 'default' : 'destructive'}>
          {testCase.status === 'passed' ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              نجح
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              فشل
            </>
          )}
        </Badge>
      )
    }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">اختبار الصلاحيات والوصول</h2>
            <p className="text-muted-foreground">
              التحقق من صحة نظام التحكم بالوصول عبر الأدوار المختلفة
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={() => setShowResults(false)}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              مسح النتائج
            </EnhancedButton>
            <ActionButton
              action="test"
              itemName="الصلاحيات"
              onClick={runTests}
              loading={isRunning}
              icon={<Play className="w-4 h-4" />}
            >
              تشغيل الاختبارات
            </ActionButton>
          </div>
        </div>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              إعداد الاختبارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-category">فئة الاختبارات</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة الاختبارات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الاختبارات</SelectItem>
                    <SelectItem value="maintenance-tools">أدوات الصيانة</SelectItem>
                    <SelectItem value="backup-tools">النسخ الاحتياطي</SelectItem>
                    <SelectItem value="user-impersonation">انتحال الهوية</SelectItem>
                    <SelectItem value="landing-editor">نشر الصفحات</SelectItem>
                    <SelectItem value="permissions">إدارة الصلاحيات</SelectItem>
                    <SelectItem value="tenant-management">إدارة المؤسسات</SelectItem>
                    <SelectItem value="user-management">إدارة المستخدمين</SelectItem>
                    <SelectItem value="billing">إدارة الفوترة</SelectItem>
                    <SelectItem value="support">عرض الدعم الفني</SelectItem>
                    <SelectItem value="reports">عرض التقارير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عدد الاختبارات المحددة</Label>
                <div className="mt-2 text-2xl font-bold">
                  {formatNumber(filteredTests.length * mockUsers.length)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    ملاحظات الاختبار
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>الاختبارات الحرجة تشمل الوحدات التي تتطلب صلاحيات Super Admin فقط</li>
                    <li>الاختبارات العادية تشمل الوحدات الإدارية للمؤسسات</li>
                    <li>الاختبارات الأساسية تشمل الوحدات المتاحة لعامة المستخدمين</li>
                    <li>يتم اختبار كل دور مع كل وحدة للتأكد من دقة التحكم بالوصول</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">الاختبارات الحرجة</p>
                  <p className="text-2xl font-bold text-red-600 text-right">
                    {formatNumber(TEST_CASES.filter(t => t.module === 'maintenance-tools' || t.module === 'backup-tools' || t.module === 'user-impersonation' || t.module === 'landing-editor' || t.module === 'permissions').length)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">الاختبارات العادية</p>
                  <p className="text-2xl font-bold text-orange-600 text-right">
                    {formatNumber(TEST_CASES.filter(t => t.module === 'tenant-management' || t.module === 'user-management' || t.module === 'billing').length)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Settings className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">الاختبارات الأساسية</p>
                  <p className="text-2xl font-bold text-green-600 text-right">
                    {formatNumber(TEST_CASES.filter(t => t.module === 'support' || t.module === 'reports').length)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {showResults && resultStats && (
          <>
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground text-right">إجمالي الاختبارات</p>
                      <p className="text-2xl font-bold text-right">{formatNumber(resultStats.total)}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <TestTube className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground text-right">نجح</p>
                      <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(resultStats.passed)}</p>
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
                      <p className="text-sm font-medium text-muted-foreground text-right">فشل</p>
                      <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(resultStats.failed)}</p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground text-right">معدل النجاح</p>
                      <p className="text-2xl font-bold text-purple-600 text-right">
                        {Math.round(resultStats.passed / resultStats.total * 100)}%
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>نتائج الاختبارات التفصيلية</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedTable
                  data={testResults}
                  columns={resultColumns}
                  searchable
                  searchPlaceholder="البحث في النتائج..."
                  emptyMessage="لا توجد نتائج"
                  maxHeight="600px"
                  stickyHeader
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default RolePermissionTester; 