import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Search, 
  Filter, 
  RefreshCw, 
  Wrench, 
  UserCheck, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Building,
  Activity,
  Settings,
  Trash2,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EnhancedTenantService, TenantInfo, TenantDiagnosticResult, TenantRepairResult, TenantRegistrationData } from '@/services/BusinessServices/EnhancedTenantService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function EnhancedTenantManagement() {
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [filteredTenants, setFilteredTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null)
  const [diagnosticResult, setDiagnosticResult] = useState<TenantDiagnosticResult | null>(null)
  const [repairResult, setRepairResult] = useState<TenantRepairResult | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTenantData, setNewTenantData] = useState<TenantRegistrationData>({
    name: '',
    admin_email: '',
    admin_password: '',
    admin_full_name: '',
    subscription_plan: 'basic'
  })
  const { toast } = useToast()

  // إحصائيات عامة
  const stats = useMemo(() => {
    const totalTenants = tenants.length
    const activeTenants = tenants.filter(t => t.status === 'active').length
    const suspendedTenants = tenants.filter(t => t.status === 'suspended').length
    const trialTenants = tenants.filter(t => t.status === 'trial').length
    const totalUsers = tenants.reduce((sum, t) => sum + t.user_count, 0)
    const totalEmployees = tenants.reduce((sum, t) => sum + t.employee_count, 0)

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      totalUsers,
      totalEmployees
    }
  }, [tenants])

  // تحميل المستأجرين
  const loadTenants = async () => {
    setLoading(true)
    try {
      const tenantsList = await EnhancedTenantService.getTenantsList()
      setTenants(tenantsList)
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast({
        title: 'خطأ في تحميل المستأجرين',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // تشخيص مستأجر
  const diagnoseTenant = async (tenant: TenantInfo) => {
    setIsDiagnosing(true)
    setDiagnosticResult(null)
    setSelectedTenant(tenant)
    
    try {
      const result = await EnhancedTenantService.diagnoseTenant(tenant.id)
      setDiagnosticResult(result)
      setShowDiagnosticModal(true)
      
      toast({
        title: 'تم التشخيص بنجاح',
        description: `تم العثور على ${result.issues.length} مشكلة في ${tenant.name}`,
        variant: result.status === 'critical' ? 'destructive' : 'default'
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

  // إصلاح مستأجر
  const repairTenant = async (tenant: TenantInfo) => {
    setIsRepairing(true)
    setRepairResult(null)
    setSelectedTenant(tenant)
    
    try {
      const result = await EnhancedTenantService.repairTenant(tenant.id)
      setRepairResult(result)
      setShowRepairModal(true)
      
      toast({
        title: result.success ? 'تم الإصلاح بنجاح' : 'فشل في الإصلاح',
        description: `تم إجراء ${result.repairs_made.length} إصلاح`,
        variant: result.success ? 'default' : 'destructive'
      })

      if (result.success) {
        setTimeout(loadTenants, 2000)
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

  // إنشاء مستأجر جديد
  const createTenant = async () => {
    if (!newTenantData.name || !newTenantData.admin_email || !newTenantData.admin_password || !newTenantData.admin_full_name) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await EnhancedTenantService.createTenantWithRelationships(newTenantData)
      
      toast({
        title: 'تم إنشاء المستأجر بنجاح',
        description: `تم إنشاء ${newTenantData.name} مع حساب المدير`,
        variant: 'default'
      })

      setShowCreateModal(false)
      setNewTenantData({
        name: '',
        admin_email: '',
        admin_password: '',
        admin_full_name: '',
        subscription_plan: 'basic'
      })
      
      loadTenants()
    } catch (error) {
      console.error('Create tenant error:', error)
      toast({
        title: 'خطأ في إنشاء المستأجر',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // حذف مستأجر
  const deleteTenant = async (tenant: TenantInfo) => {
    if (!confirm(`هل أنت متأكد من حذف المستأجر "${tenant.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return
    }

    try {
      await EnhancedTenantService.deleteTenant(tenant.id)
      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف المستأجر ${tenant.name}`,
        variant: 'default'
      })
      loadTenants()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // تحديث حالة المستأجر
  const updateTenantStatus = async (tenant: TenantInfo, newStatus: 'active' | 'suspended') => {
    try {
      await EnhancedTenantService.updateTenantStatus(tenant.id, newStatus)
      toast({
        title: 'تم التحديث بنجاح',
        description: `تم تحديث حالة ${tenant.name} إلى ${newStatus === 'active' ? 'نشط' : 'معلق'}`,
        variant: 'default'
      })
      loadTenants()
    } catch (error) {
      console.error('Status update error:', error)
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // إصلاح جميع المستأجرين المحددين
  const repairSelectedTenants = async () => {
    if (selectedTenants.size === 0) {
      toast({
        title: 'لا توجد مستأجرين محددة',
        description: 'يرجى تحديد مستأجرين للإصلاح',
        variant: 'destructive'
      })
      return
    }

    setIsRepairing(true)
    let successCount = 0
    let errorCount = 0

    for (const tenantId of selectedTenants) {
      try {
        const tenant = tenants.find(t => t.id === tenantId)
        if (tenant) {
          await EnhancedTenantService.repairTenant(tenant.id)
          successCount++
        }
      } catch (error) {
        console.error(`Error repairing tenant ${tenantId}:`, error)
        errorCount++
      }
    }

    setIsRepairing(false)
    setSelectedTenants(new Set())
    
    toast({
      title: 'تم الإصلاح',
      description: `تم إصلاح ${successCount} مستأجر بنجاح، ${errorCount} فشل`,
      variant: successCount > 0 ? 'default' : 'destructive'
    })

    loadTenants()
  }

  // تصدير بيانات المستأجرين
  const exportTenants = () => {
    const csvContent = [
      ['اسم المستأجر', 'النطاق', 'الحالة', 'عدد المستخدمين', 'عدد الموظفين', 'تاريخ الإنشاء'],
      ...filteredTenants.map(tenant => [
        tenant.name,
        tenant.domain || '',
        tenant.status,
        tenant.user_count.toString(),
        tenant.employee_count.toString(),
        new Date(tenant.created_at).toLocaleDateString('ar-SA')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // تصفية المستأجرين
  useEffect(() => {
    let filtered = tenants

    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter)
    }

    setFilteredTenants(filtered)
    setCurrentPage(1) // إعادة تعيين الصفحة عند تغيير التصفية
  }, [tenants, searchTerm, statusFilter])

  // حساب الصفحات
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    loadTenants()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'trial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط'
      case 'suspended':
        return 'معلق'
      case 'trial':
        return 'تجريبي'
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستأجرين المحسنة</h1>
          <p className="text-gray-600 mt-2">
            إدارة شاملة للمستأجرين مع أدوات التشخيص والإصلاح
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTenants} disabled={loading} variant="outline">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تحديث
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            مستأجر جديد
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">إجمالي المستأجرين</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">النشطين</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">المعلقين</p>
                <p className="text-2xl font-bold text-red-900">{stats.suspendedTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">التجريبيين</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.trialTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في المستأجرين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                  <SelectItem value="trial">تجريبي</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportTenants} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات الجماعية */}
      {selectedTenants.size > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>إجراءات جماعية</AlertTitle>
          <AlertDescription>
            تم تحديد {selectedTenants.size} مستأجر
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={repairSelectedTenants}
                disabled={isRepairing}
              >
                {isRepairing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                إصلاح المحددة
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTenants(new Set())}
              >
                إلغاء التحديد
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* جدول المستأجرين */}
      <Card>
        <CardHeader>
          <CardTitle>المستأجرين ({filteredTenants.length})</CardTitle>
          <CardDescription>
            قائمة جميع المستأجرين مع إمكانية التشخيص والإصلاح
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">جاري التحميل...</span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد مستأجرين مطابقين للبحث
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTenants.size === paginatedTenants.length && paginatedTenants.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenants(new Set(paginatedTenants.map(t => t.id)))
                          } else {
                            setSelectedTenants(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>المستأجر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإحصائيات</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTenants.has(tenant.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedTenants)
                            if (e.target.checked) {
                              newSelected.add(tenant.id)
                            } else {
                              newSelected.delete(tenant.id)
                            }
                            setSelectedTenants(newSelected)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{tenant.name}</div>
                          {tenant.domain && (
                            <div className="text-sm text-gray-500">{tenant.domain}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tenant.status)}
                          <Badge className={getStatusColor(tenant.status)}>
                            {getStatusText(tenant.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.user_count} مستخدم</div>
                          <div>{tenant.employee_count} موظف</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => diagnoseTenant(tenant)}
                            disabled={isDiagnosing}
                          >
                            {isDiagnosing && selectedTenant?.id === tenant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => repairTenant(tenant)}
                            disabled={isRepairing}
                          >
                            {isRepairing && selectedTenant?.id === tenant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wrench className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTenantStatus(tenant, tenant.status === 'active' ? 'suspended' : 'active')}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTenant(tenant)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* الترقيم */}
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء مستأجر جديد */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء مستأجر جديد</DialogTitle>
            <DialogDescription>
              إنشاء مستأجر جديد مع حساب مدير
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستأجر *
              </label>
              <Input
                value={newTenantData.name}
                onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                placeholder="اسم المؤسسة أو الشركة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                النطاق (اختياري)
              </label>
              <Input
                value={newTenantData.domain || ''}
                onChange={(e) => setNewTenantData({ ...newTenantData, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                بريد المدير *
              </label>
              <Input
                type="email"
                value={newTenantData.admin_email}
                onChange={(e) => setNewTenantData({ ...newTenantData, admin_email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة مرور المدير *
              </label>
              <Input
                type="password"
                value={newTenantData.admin_password}
                onChange={(e) => setNewTenantData({ ...newTenantData, admin_password: e.target.value })}
                placeholder="كلمة مرور قوية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المدير الكامل *
              </label>
              <Input
                value={newTenantData.admin_full_name}
                onChange={(e) => setNewTenantData({ ...newTenantData, admin_full_name: e.target.value })}
                placeholder="الاسم الأول والأخير"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                خطة الاشتراك
              </label>
              <Select 
                value={newTenantData.subscription_plan} 
                onValueChange={(value) => setNewTenantData({ ...newTenantData, subscription_plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">أساسي</SelectItem>
                  <SelectItem value="professional">احترافي</SelectItem>
                  <SelectItem value="enterprise">مؤسسات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={createTenant}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                إنشاء المستأجر
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة التشخيص */}
      <Dialog open={showDiagnosticModal} onOpenChange={setShowDiagnosticModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نتائج التشخيص - {selectedTenant?.name}</DialogTitle>
            <DialogDescription>
              تفاصيل شاملة عن حالة المستأجر والمشاكل المكتشفة
            </DialogDescription>
          </DialogHeader>
          
          {diagnosticResult && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {diagnosticResult.status === 'healthy' && <CheckCircle className="h-6 w-6 text-green-500" />}
                {diagnosticResult.status === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                {diagnosticResult.status === 'critical' && <XCircle className="h-6 w-6 text-red-500" />}
                <Badge className={getStatusColor(diagnosticResult.status)}>
                  {diagnosticResult.status === 'healthy' && 'صحي'}
                  {diagnosticResult.status === 'warning' && 'تحذير'}
                  {diagnosticResult.status === 'critical' && 'حرج'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900">{diagnosticResult.user_count}</p>
                  <p className="text-sm text-blue-600">المستخدمين</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-900">{diagnosticResult.employee_count}</p>
                  <p className="text-sm text-green-600">الموظفين</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-900">{diagnosticResult.admin_users.length}</p>
                  <p className="text-sm text-purple-600">المديرين</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-900">{diagnosticResult.issues.length}</p>
                  <p className="text-sm text-orange-600">المشاكل</p>
                </div>
              </div>

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

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowDiagnosticModal(false)
                    if (selectedTenant) {
                      repairTenant(selectedTenant)
                    }
                  }}
                  disabled={diagnosticResult.status === 'healthy'}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  إصلاح المشاكل
                </Button>
                <Button variant="outline" onClick={() => setShowDiagnosticModal(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة الإصلاح */}
      <Dialog open={showRepairModal} onOpenChange={setShowRepairModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نتائج الإصلاح - {selectedTenant?.name}</DialogTitle>
            <DialogDescription>
              تفاصيل الإصلاحات المنجزة والأخطاء التي حدثت
            </DialogDescription>
          </DialogHeader>
          
          {repairResult && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {repairResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <Badge className={repairResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {repairResult.success ? 'تم الإصلاح بنجاح' : 'فشل في الإصلاح'}
                </Badge>
              </div>

              <Separator />

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

              {repairResult.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">الأخطاء</h3>
                  <div className="space-y-2">
                    {repairResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowRepairModal(false)
                    if (selectedTenant) {
                      diagnoseTenant(selectedTenant)
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  إعادة التشخيص
                </Button>
                <Button variant="outline" onClick={() => setShowRepairModal(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 