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
  User,
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
  User 
} from '@/hooks/useRoleBasedAccess';

interface TestCase {
  id: string;
  name: string;
  description: string;
  module: string;
  permission: string;
  expectedResults: Record<string, boolean>; // role -> should have access
  category: 'critical' | 'normal' | 'basic';
}

interface TestResult {
  testId: string;
  role: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
  error?: string;
}

const TEST_USERS: Record<string, User> = {
  'super-admin': {
    id: 'test-super-admin',
    email: 'super@test.com',
    name: 'مدير النظام التجريبي',
    role: 'super-admin',
    isActive: true
  },
  'tenant-admin': {
    id: 'test-tenant-admin',
    email: 'tenant@test.com',
    name: 'مدير المؤسسة التجريبي',
    role: 'tenant-admin',
    tenantId: 'test-tenant',
    isActive: true
  },
  'manager': {
    id: 'test-manager',
    email: 'manager@test.com',
    name: 'المدير التجريبي',
    role: 'manager',
    tenantId: 'test-tenant',
    isActive: true
  },
  'accountant': {
    id: 'test-accountant',
    email: 'accountant@test.com',
    name: 'المحاسب التجريبي',
    role: 'accountant',
    tenantId: 'test-tenant',
    isActive: true
  },
  'support': {
    id: 'test-support',
    email: 'support@test.com',
    name: 'موظف الدعم التجريبي',
    role: 'support',
    tenantId: 'test-tenant',
    isActive: true
  },
  'user': {
    id: 'test-user',
    email: 'user@test.com',
    name: 'المستخدم التجريبي',
    role: 'user',
    tenantId: 'test-tenant',
    isActive: true
  }
};

const TEST_CASES: TestCase[] = [
  // اختبارات الوحدات الحرجة
  {
    id: 'system-maintenance',
    name: 'أدوات الصيانة',
    description: 'الوصول لأدوات صيانة النظام',
    module: 'maintenance-tools',
    permission: PERMISSIONS.SYSTEM_MAINTENANCE,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': false,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'critical'
  },
  {
    id: 'system-backup',
    name: 'النسخ الاحتياطي',
    description: 'إنشاء وإدارة النسخ الاحتياطية',
    module: 'backup-tools',
    permission: PERMISSIONS.SYSTEM_BACKUP,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': false,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'critical'
  },
  {
    id: 'user-impersonation',
    name: 'انتحال الهوية',
    description: 'انتحال هوية المستخدمين الآخرين',
    module: 'user-impersonation',
    permission: PERMISSIONS.TENANT_IMPERSONATE,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': false,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'critical'
  },
  {
    id: 'landing-publish',
    name: 'نشر الصفحات',
    description: 'نشر الصفحات المقصودة',
    module: 'landing-editor',
    permission: PERMISSIONS.LANDING_PUBLISH,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': false,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'critical'
  },
  {
    id: 'permission-management',
    name: 'إدارة الصلاحيات',
    description: 'تعديل الأدوار والصلاحيات',
    module: 'permissions',
    permission: PERMISSIONS.PERMISSION_MANAGE,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': false,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'critical'
  },

  // اختبارات الوحدات العادية
  {
    id: 'tenant-management',
    name: 'إدارة المؤسسات',
    description: 'عرض وإدارة المؤسسات',
    module: 'tenant-management',
    permission: PERMISSIONS.TENANT_VIEW,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': true,
      'manager': false,
      'accountant': false,
      'support': false,
      'user': false
    },
    category: 'normal'
  },
  {
    id: 'user-management',
    name: 'إدارة المستخدمين',
    description: 'عرض وإدارة المستخدمين',
    module: 'user-management',
    permission: PERMISSIONS.USER_VIEW,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': true,
      'manager': true,
      'accountant': false,
      'support': true,
      'user': false
    },
    category: 'normal'
  },
  {
    id: 'billing-management',
    name: 'إدارة الفوترة',
    description: 'عرض وإدارة الفوترة',
    module: 'billing',
    permission: PERMISSIONS.BILLING_VIEW,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': true,
      'manager': true,
      'accountant': true,
      'support': false,
      'user': false
    },
    category: 'normal'
  },

  // اختبارات الوحدات الأساسية
  {
    id: 'support-view',
    name: 'عرض الدعم الفني',
    description: 'عرض طلبات الدعم الفني',
    module: 'support',
    permission: PERMISSIONS.SUPPORT_VIEW,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': true,
      'manager': true,
      'accountant': false,
      'support': true,
      'user': true
    },
    category: 'basic'
  },
  {
    id: 'reports-view',
    name: 'عرض التقارير',
    description: 'عرض التقارير والإحصائيات',
    module: 'reports',
    permission: PERMISSIONS.REPORTS_VIEW,
    expectedResults: {
      'super-admin': true,
      'tenant-admin': true,
      'manager': true,
      'accountant': true,
      'support': false,
      'user': false
    },
    category: 'basic'
  }
];

const RolePermissionTester: React.FC = () => {
  const { toast } = useToast();
  const { t, formatNumber } = useTranslation();
  
  const [selectedRole, setSelectedRole] = useState<string>('super-admin');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // تشغيل الاختبارات
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results: TestResult[] = [];
      
      // اختبار كل دور مع كل حالة اختبار
      for (const role of Object.keys(TEST_USERS)) {
        for (const testCase of TEST_CASES) {
          if (selectedCategory !== 'all' && testCase.category !== selectedCategory) {
            continue;
          }

          try {
            // محاكاة فحص الصلاحية
            const user = TEST_USERS[role];
            const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
            const hasPermission = userPermissions.includes(testCase.permission);
            
            const expected = testCase.expectedResults[role];
            const actual = hasPermission;
            const passed = expected === actual;

            results.push({
              testId: testCase.id,
              role,
              expected,
              actual,
              passed,
              error: passed ? undefined : `متوقع: ${expected ? 'لديه صلاحية' : 'ليس لديه صلاحية'}, الفعلي: ${actual ? 'لديه صلاحية' : 'ليس لديه صلاحية'}`
            });

            // إضافة تأخير صغير للمحاكاة
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.push({
              testId: testCase.id,
              role,
              expected: testCase.expectedResults[role],
              actual: false,
              passed: false,
              error: `خطأ في الاختبار: ${error}`
            });
          }
        }
      }

      setTestResults(results);
      setShowResults(true);
      
      // إحصائيات النتائج
      const totalTests = results.length;
      const passedTests = results.filter(r => r.passed).length;
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
    : TEST_CASES.filter(test => test.category === selectedCategory);

  // إحصائيات النتائج
  const resultStats = testResults.length > 0 ? {
    total: testResults.length,
    passed: testResults.filter(r => r.passed).length,
    failed: testResults.filter(r => !r.passed).length,
    byCategory: {
      critical: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.testId);
        return test?.category === 'critical';
      }),
      normal: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.testId);
        return test?.category === 'normal';
      }),
      basic: testResults.filter(r => {
        const test = TEST_CASES.find(t => t.id === r.testId);
        return test?.category === 'basic';
      })
    }
  } : null;

  // تعريف أعمدة جدول النتائج
  const resultColumns = [
    {
      key: 'testId',
      title: 'الاختبار',
      render: (testId: string) => {
        const test = TEST_CASES.find(t => t.id === testId);
        return test ? test.name : testId;
      }
    },
    {
      key: 'role',
      title: 'الدور',
      render: (role: string) => {
        const roleLabels = {
          'super-admin': 'مدير النظام',
          'tenant-admin': 'مدير المؤسسة',
          'manager': 'مدير',
          'accountant': 'محاسب',
          'support': 'دعم فني',
          'user': 'مستخدم'
        };
        return roleLabels[role as keyof typeof roleLabels] || role;
      }
    },
    {
      key: 'expected',
      title: 'المتوقع',
      align: 'center' as const,
      render: (expected: boolean) => (
        <Badge variant={expected ? 'default' : 'secondary'}>
          {expected ? 'لديه صلاحية' : 'ليس لديه صلاحية'}
        </Badge>
      )
    },
    {
      key: 'actual',
      title: 'الفعلي',
      align: 'center' as const,
      render: (actual: boolean) => (
        <Badge variant={actual ? 'default' : 'secondary'}>
          {actual ? 'لديه صلاحية' : 'ليس لديه صلاحية'}
        </Badge>
      )
    },
    {
      key: 'passed',
      title: 'النتيجة',
      align: 'center' as const,
      render: (passed: boolean) => (
        <Badge variant={passed ? 'default' : 'destructive'}>
          {passed ? (
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
                    <SelectItem value="critical">الاختبارات الحرجة</SelectItem>
                    <SelectItem value="normal">الاختبارات العادية</SelectItem>
                    <SelectItem value="basic">الاختبارات الأساسية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عدد الاختبارات المحددة</Label>
                <div className="mt-2 text-2xl font-bold">
                  {formatNumber(filteredTests.length * Object.keys(TEST_USERS).length)}
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
                    {formatNumber(TEST_CASES.filter(t => t.category === 'critical').length)}
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
                    {formatNumber(TEST_CASES.filter(t => t.category === 'normal').length)}
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
                    {formatNumber(TEST_CASES.filter(t => t.category === 'basic').length)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
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