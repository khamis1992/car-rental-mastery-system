import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Wrench, UserCheck, Database } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface DiagnosticResult {
  tenant_id: string
  tenant_name: string
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  user_count: number
  employee_count: number
  admin_users: string[]
  missing_relationships: string[]
  recommendations: string[]
}

interface RepairResult {
  success: boolean
  tenant_id: string
  tenant_name: string
  repairs_made: string[]
  errors: string[]
  warnings: string[]
}

export default function BashaerEmergencyFix() {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [lastDiagnostic, setLastDiagnostic] = useState<Date | null>(null)
  const { toast } = useToast()

  const runDiagnostic = async () => {
    setIsDiagnosing(true)
    setDiagnosticResult(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('tenant-diagnostics', {
        body: { tenant_name: 'مؤسسة البشائر' }
      })

      if (error) {
        throw error
      }

      setDiagnosticResult(data)
      setLastDiagnostic(new Date())
      
      toast({
        title: 'تم التشخيص بنجاح',
        description: `تم العثور على ${data.issues.length} مشكلة في المستأجر`,
        variant: data.status === 'critical' ? 'destructive' : 'default'
      })

    } catch (error) {
      console.error('Diagnostic error:', error)
      toast({
        title: 'خطأ في التشخيص',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsDiagnosing(false)
    }
  }

  const runRepair = async () => {
    if (!diagnosticResult) {
      toast({
        title: 'خطأ',
        description: 'يجب تشخيص المستأجر أولاً',
        variant: 'destructive'
      })
      return
    }

    setIsRepairing(true)
    setRepairResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('tenant-repair', {
        body: {
          tenant_id: diagnosticResult.tenant_id,
          repair_options: {
            fix_missing_relationships: true,
            create_admin_employee_profiles: true,
            fix_user_accounts: true,
            apply_default_chart_of_accounts: true
          }
        }
      })

      if (error) {
        throw error
      }

      setRepairResult(data)
      
      toast({
        title: data.success ? 'تم الإصلاح بنجاح' : 'فشل في الإصلاح',
        description: `تم إجراء ${data.repairs_made.length} إصلاح`,
        variant: data.success ? 'default' : 'destructive'
      })

      // إعادة التشخيص بعد الإصلاح
      if (data.success) {
        setTimeout(runDiagnostic, 2000)
      }

    } catch (error) {
      console.error('Repair error:', error)
      toast({
        title: 'خطأ في الإصلاح',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsRepairing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  useEffect(() => {
    // تشخيص تلقائي عند تحميل الصفحة
    runDiagnostic()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إصلاح طارئ - مؤسسة البشائر</h1>
          <p className="text-gray-600 mt-2">
            تشخيص وإصلاح مشاكل المستأجر بشكل تلقائي
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostic}
            disabled={isDiagnosing}
            variant="outline"
          >
            {isDiagnosing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تشخيص
          </Button>
          <Button
            onClick={runRepair}
            disabled={isRepairing || !diagnosticResult || diagnosticResult.status === 'healthy'}
            variant="default"
          >
            {isRepairing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            إصلاح
          </Button>
        </div>
      </div>

      {lastDiagnostic && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>آخر تشخيص</AlertTitle>
          <AlertDescription>
            تم التشخيص في {lastDiagnostic.toLocaleString('ar-SA')}
          </AlertDescription>
        </Alert>
      )}

      {diagnosticResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon(diagnosticResult.status)}
              <div>
                <CardTitle>نتائج التشخيص</CardTitle>
                <CardDescription>
                  حالة المستأجر: {diagnosticResult.tenant_name}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(diagnosticResult.status)}>
                {diagnosticResult.status === 'healthy' && 'صحي'}
                {diagnosticResult.status === 'warning' && 'تحذير'}
                {diagnosticResult.status === 'critical' && 'حرج'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">المستخدمين</p>
                  <p className="font-semibold text-blue-900">{diagnosticResult.user_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Database className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">الموظفين</p>
                  <p className="font-semibold text-green-900">{diagnosticResult.employee_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">المديرين</p>
                  <p className="font-semibold text-purple-900">{diagnosticResult.admin_users.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">المشاكل</p>
                  <p className="font-semibold text-orange-900">{diagnosticResult.issues.length}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* المديرين */}
            {diagnosticResult.admin_users.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">المديرين</h3>
                <div className="space-y-1">
                  {diagnosticResult.admin_users.map((admin, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{admin}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المشاكل */}
            {diagnosticResult.issues.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">المشاكل المكتشفة</h3>
                <div className="space-y-2">
                  {diagnosticResult.issues.map((issue, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* العلاقات المفقودة */}
            {diagnosticResult.missing_relationships.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">العلاقات المفقودة</h3>
                <div className="space-y-1">
                  {diagnosticResult.missing_relationships.map((relationship, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* التوصيات */}
            {diagnosticResult.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">التوصيات</h3>
                <div className="space-y-1">
                  {diagnosticResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {repairResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {repairResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <CardTitle>نتائج الإصلاح</CardTitle>
                <CardDescription>
                  {repairResult.success ? 'تم الإصلاح بنجاح' : 'فشل في الإصلاح'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الإصلاحات المنجزة */}
            {repairResult.repairs_made.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">الإصلاحات المنجزة</h3>
                <div className="space-y-1">
                  {repairResult.repairs_made.map((repair, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>{repair}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الأخطاء */}
            {repairResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">الأخطاء</h3>
                <div className="space-y-1">
                  {repairResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* التحذيرات */}
            {repairResult.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">التحذيرات</h3>
                <div className="space-y-1">
                  {repairResult.warnings.map((warning, index) => (
                    <Alert key={index} variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 