import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, X, RefreshCw, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  is_active: boolean;
  last_checked: string;
  violations_count: number;
}

interface ValidationViolation {
  id: string;
  rule_id: string;
  entity_type: string;
  entity_id: string;
  violation_details: any;
  severity: string;
  discovered_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export const AccountingValidation = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [violations, setViolations] = useState<ValidationViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadValidationData();
  }, []);

  const loadValidationData = async () => {
    try {
      // Mock data for demonstration
      setRules([
        {
          id: '1',
          rule_name: 'توازن القيود المحاسبية',
          rule_type: 'balance_check',
          severity: 'error',
          description: 'التأكد من أن إجمالي المدين يساوي إجمالي الدائن في كل قيد',
          is_active: true,
          last_checked: '2024-01-15T09:00:00Z',
          violations_count: 0
        },
        {
          id: '2',
          rule_name: 'صحة أرقام الحسابات',
          rule_type: 'account_validation',
          severity: 'error',
          description: 'التأكد من استخدام أرقام حسابات صحيحة وموجودة',
          is_active: true,
          last_checked: '2024-01-15T09:00:00Z',
          violations_count: 2
        },
        {
          id: '3',
          rule_name: 'صحة التواريخ المحاسبية',
          rule_type: 'date_validation',
          severity: 'warning',
          description: 'التأكد من أن التواريخ ضمن الفترة المالية الصحيحة',
          is_active: true,
          last_checked: '2024-01-15T09:00:00Z',
          violations_count: 1
        },
        {
          id: '4',
          rule_name: 'اكتمال البيانات المطلوبة',
          rule_type: 'required_fields',
          severity: 'warning',
          description: 'التأكد من اكتمال جميع البيانات المطلوبة',
          is_active: true,
          last_checked: '2024-01-15T09:00:00Z',
          violations_count: 5
        }
      ]);

      setViolations([
        {
          id: '1',
          rule_id: '2',
          entity_type: 'journal_entry',
          entity_id: 'JE-2024-001',
          violation_details: { invalid_account: '999999', description: 'رقم حساب غير موجود' },
          severity: 'error',
          discovered_at: '2024-01-15T08:30:00Z'
        },
        {
          id: '2',
          rule_id: '2',
          entity_type: 'journal_entry',
          entity_id: 'JE-2024-005',
          violation_details: { invalid_account: '888888', description: 'رقم حساب غير موجود' },
          severity: 'error',
          discovered_at: '2024-01-15T07:15:00Z'
        },
        {
          id: '3',
          rule_id: '3',
          entity_type: 'journal_entry',
          entity_id: 'JE-2024-003',
          violation_details: { invalid_date: '2023-12-30', description: 'تاريخ خارج الفترة المالية الحالية' },
          severity: 'warning',
          discovered_at: '2024-01-15T06:45:00Z'
        }
      ]);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات التحقق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'تم بنجاح',
        description: 'تم تشغيل عملية التحقق بنجاح',
      });
      
      loadValidationData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تشغيل عملية التحقق',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const resolveViolation = async (violationId: string) => {
    try {
      setViolations(violations.map(v => 
        v.id === violationId 
          ? { ...v, resolved_at: new Date().toISOString(), resolved_by: 'current_user' }
          : v
      ));
      
      toast({
        title: 'تم بنجاح',
        description: 'تم حل المخالفة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حل المخالفة',
        variant: 'destructive',
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive' as const,
      warning: 'secondary' as const,
      info: 'outline' as const
    };
    
    const labels = {
      error: 'خطأ',
      warning: 'تحذير',
      info: 'معلومة'
    };

    return (
      <Badge variant={variants[severity as keyof typeof variants]}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const totalViolations = violations.filter(v => !v.resolved_at).length;
  const errorCount = violations.filter(v => v.severity === 'error' && !v.resolved_at).length;
  const warningCount = violations.filter(v => v.severity === 'warning' && !v.resolved_at).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ملخص الحالة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المخالفات</p>
                <p className="text-2xl font-bold text-red-600">{totalViolations}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أخطاء حرجة</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تحذيرات</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">القواعد النشطة</p>
                <p className="text-2xl font-bold text-green-600">
                  {rules.filter(r => r.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحذيرات فورية */}
      {totalViolations > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            يوجد {totalViolations} مخالفة تحتاج إلى انتباه منها {errorCount} خطأ حرج و {warningCount} تحذير.
          </AlertDescription>
        </Alert>
      )}

      {/* قواعد التحقق */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button 
              onClick={runValidation} 
              disabled={validating}
              className="flex items-center gap-2"
            >
              {validating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              {validating ? 'جاري التحقق...' : 'تشغيل التحقق'}
            </Button>
            <CardTitle className="flex items-center gap-2 rtl-flex">
              <Shield className="w-5 h-5" />
              قواعد التحقق من صحة البيانات
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">آخر فحص</TableHead>
                <TableHead className="text-right">المخالفات</TableHead>
                <TableHead className="text-right">الخطورة</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">اسم القاعدة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDateTime(rule.last_checked)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={rule.violations_count > 0 ? 'destructive' : 'default'}>
                      {rule.violations_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {getSeverityBadge(rule.severity)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {rule.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {rule.rule_name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {getSeverityIcon(rule.severity)}
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* المخالفات الحالية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-right">المخالفات المكتشفة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">إجراء</TableHead>
                <TableHead className="text-right">تاريخ الاكتشاف</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">الكيان</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الخطورة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.filter(v => !v.resolved_at).map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => resolveViolation(violation.id)}
                    >
                      حل
                    </Button>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDateTime(violation.discovered_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {violation.violation_details.description}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {violation.entity_id}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {violation.entity_type === 'journal_entry' && 'قيد محاسبي'}
                      {violation.entity_type === 'invoice' && 'فاتورة'}
                      {violation.entity_type === 'payment' && 'دفعة'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {getSeverityBadge(violation.severity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {violations.filter(v => !v.resolved_at).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>لا توجد مخالفات حالياً - النظام يعمل بشكل صحيح</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};