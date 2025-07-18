
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Activity,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckSquare,
  Square,
  Bell,
  Lock,
  Database,
  TrendingUp,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  PauseCircle
} from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { Tenant, TenantOnboardingData } from "@/types/tenant";
import { toast } from "@/hooks/use-toast";

interface TenantFormData {
  name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  subscription_plan: 'basic' | 'standard' | 'premium' | 'enterprise';
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const AdvancedTenantManagement: React.FC = React.memo(() => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  // Bulk actions state
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: 'SA',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    subscription_plan: 'basic'
  });

  // Loading states for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Selected tenant for operations
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const tenantService = useMemo(() => new TenantService(), []);

  // Memoized filtered tenants
  const filteredTenants = useMemo(() => {
    let filtered = tenants;

    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter);
    }

    return filtered;
  }, [tenants, searchTerm, statusFilter]);

  // Memoized paginated tenants
  const paginatedTenants = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredTenants.slice(startIndex, endIndex);
  }, [filteredTenants, pagination.currentPage, pagination.pageSize]);

  // Memoized statistics
  const statistics = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length
  }), [tenants]);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في تحميل البيانات",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [tenantService]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    // Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: filteredTenants.length,
      totalPages: Math.ceil(filteredTenants.length / prev.pageSize)
    }));
  }, [filteredTenants.length]);

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: filteredTenants.length,
      totalPages: Math.ceil(filteredTenants.length / prev.pageSize)
    }));
  }, [filteredTenants.length, pagination.pageSize]);

  // Bulk selection effect
  useEffect(() => {
    if (selectedTenants.length === 0) {
      setSelectAll(false);
    } else if (selectedTenants.length === paginatedTenants.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedTenants.length, paginatedTenants.length]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: '',
      country: 'SA',
      timezone: 'Asia/Riyadh',
      currency: 'SAR',
      subscription_plan: 'basic'
    });
  };

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size, 
      currentPage: 1,
      totalPages: Math.ceil(filteredTenants.length / size)
    }));
  }, [filteredTenants.length]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedTenants(paginatedTenants.map(tenant => tenant.id));
    } else {
      setSelectedTenants([]);
    }
    setSelectAll(checked);
  }, [paginatedTenants]);

  const handleSelectTenant = useCallback((tenantId: string, checked: boolean) => {
    if (checked) {
      setSelectedTenants(prev => [...prev, tenantId]);
    } else {
      setSelectedTenants(prev => prev.filter(id => id !== tenantId));
    }
  }, []);

  const handleBulkAction = async (action: string) => {
    if (selectedTenants.length === 0) {
      toast({
        title: "لا يوجد تحديد",
        description: "يرجى تحديد مؤسسة واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }

    setBulkActionLoading(true);
    
    try {
      switch (action) {
        case 'activate':
          // Mock API call for bulk activation
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast({
            title: "تم التفعيل",
            description: `تم تفعيل ${selectedTenants.length} مؤسسة بنجاح`,
          });
          break;
        case 'suspend':
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast({
            title: "تم التعليق",
            description: `تم تعليق ${selectedTenants.length} مؤسسة بنجاح`,
          });
          break;
        case 'delete':
          setIsBulkDeleteDialogOpen(true);
          return;
        case 'upgrade':
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast({
            title: "تم الترقية",
            description: `تم ترقية ${selectedTenants.length} مؤسسة بنجاح`,
          });
          break;
      }
      
      setSelectedTenants([]);
      loadTenants();
    } catch (error) {
      toast({
        title: "خطأ في العملية",
        description: "حدث خطأ أثناء تنفيذ العملية المجمعة",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    
    try {
      // Mock API call for bulk deletion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedTenants.length} مؤسسة بنجاح`,
      });
      
      setSelectedTenants([]);
      setIsBulkDeleteDialogOpen(false);
      loadTenants();
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المؤسسات",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = filteredTenants.map(tenant => ({
        'اسم المؤسسة': tenant.name,
        'البريد الإلكتروني': tenant.contact_email,
        'الهاتف': tenant.contact_phone,
        'المدينة': tenant.city,
        'الحالة': getStatusLabel(tenant.status),
        'خطة الاشتراك': getPlanLabel(tenant.subscription_plan),
        'تاريخ الإنشاء': new Date(tenant.created_at).toLocaleDateString('ar-SA')
      }));

      // Create and download file
      const headers = Object.keys(data[0] || {});
      let content = '';
      
      if (format === 'csv') {
        content = headers.join(',') + '\n' + 
                 data.map(row => Object.values(row).join(',')).join('\n');
        
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }
      
      toast({
        title: "تم التصدير",
        description: `تم تصدير ${data.length} مؤسسة بصيغة ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    
    try {
      // Mock import functionality
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "تم الاستيراد",
        description: "تم استيراد البيانات بنجاح",
      });
      
      loadTenants();
    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddTenant = async () => {
    try {
      setIsSubmitting(true);
      
      // Validation
      if (!formData.name || !formData.contact_email) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      // Generate slug from name if not provided
      if (!formData.slug) {
        formData.slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      }

      const tenantData: TenantOnboardingData = {
        ...formData,
        admin_user: {
          email: formData.contact_email,
          password: 'default123!', // يجب أن يكون password قوي
          full_name: 'مدير النظام'
        }
      };

      await tenantService.createTenant(tenantData);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المؤسسة بنجاح",
        variant: "default"
      });

      setIsAddModalOpen(false);
      resetForm();
      loadTenants();
    } catch (err: any) {
      toast({
        title: "خطأ في إضافة المؤسسة",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;

    try {
      setIsSubmitting(true);
      
      // Validation
      if (!formData.name || !formData.contact_email) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      await tenantService.updateTenant(selectedTenant.id, formData);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات المؤسسة بنجاح",
        variant: "default"
      });

      setIsEditModalOpen(false);
      setSelectedTenant(null);
      resetForm();
      loadTenants();
    } catch (err: any) {
      toast({
        title: "خطأ في تحديث المؤسسة",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    try {
      setIsDeleting(true);
      
      await tenantService.deleteTenant(selectedTenant.id);
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف المؤسسة بنجاح",
        variant: "default"
      });

      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
      loadTenants();
    } catch (err: any) {
      toast({
        title: "خطأ في حذف المؤسسة",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      contact_email: tenant.contact_email || '',
      contact_phone: tenant.contact_phone || '',
      address: tenant.address || '',
      city: tenant.city || '',
      country: tenant.country,
      timezone: tenant.timezone,
      currency: tenant.currency,
      subscription_plan: tenant.subscription_plan
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewModalOpen(true);
  };

  const openSettingsModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsSettingsModalOpen(true);
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const openSubscriptionModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsSubscriptionModalOpen(true);
  };

  const openBackupModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsBackupModalOpen(true);
  };

  const openNotificationModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsNotificationModalOpen(true);
  };

  const openSecurityModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsSecurityModalOpen(true);
  };

  // Memoized status and plan getters
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'trial': return 'تجريبي';
      case 'suspended': return 'معلق';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  }, []);

  const getPlanLabel = useCallback((plan: string) => {
    switch (plan) {
      case 'basic': return 'أساسي';
      case 'standard': return 'قياسي';
      case 'premium': return 'متميز';
      case 'enterprise': return 'مؤسسي';
      default: return plan;
    }
  }, []);

  // Memoized pagination controls component
  const PaginationControls = useMemo(() => (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          عرض {((pagination.currentPage - 1) * pagination.pageSize) + 1} إلى{' '}
          {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} من{' '}
          {pagination.totalItems} النتائج
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">عدد العناصر:</span>
          <Select 
            value={pagination.pageSize.toString()} 
            onValueChange={(value) => handlePageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            السابق
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === pagination.totalPages || 
                Math.abs(page - pagination.currentPage) <= 1
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={page === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            التالي
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  ), [pagination, handlePageChange, handlePageSizeChange]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل المؤسسات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadTenants} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المؤسسات المتقدمة</h2>
          <p className="text-muted-foreground">
            إدارة شاملة لجميع المؤسسات المشتركة في النظام
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTenants} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            تحديث
          </Button>
          
          {/* Export/Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                تصدير/استيراد
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
                <FileText className="w-4 h-4 mr-2" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                <label htmlFor="import-file" className="cursor-pointer">
                  استيراد ملف
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة مؤسسة
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم، البريد الإلكتروني، أو الرمز..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedTenants.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  تم تحديد {selectedTenants.length} مؤسسة
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedTenants([])}
                >
                  إلغاء التحديد
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  تفعيل
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('suspend')}
                  disabled={bulkActionLoading}
                >
                  <PauseCircle className="w-4 h-4 mr-2" />
                  تعليق
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('upgrade')}
                  disabled={bulkActionLoading}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  ترقية
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards with memoized statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">إجمالي المؤسسات</p>
                <p className="text-2xl font-bold text-right">{statistics.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">نشطة</p>
                <p className="text-2xl font-bold text-green-600 text-right">{statistics.active}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">تجريبية</p>
                <p className="text-2xl font-bold text-blue-600 text-right">{statistics.trial}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-right">معلقة</p>
                <p className="text-2xl font-bold text-red-600 text-right">{statistics.suspended}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-right">قائمة المؤسسات</CardTitle>
            <div className="text-sm text-muted-foreground text-right">
              عرض {paginatedTenants.length} من أصل {filteredTenants.length} مؤسسة
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All Header */}
            {paginatedTenants.length > 0 && (
              <div className="flex items-center gap-4 p-4 border-b">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">تحديد الكل</span>
              </div>
            )}
            
            {filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'لا توجد مؤسسات تطابق معايير البحث'
                  : 'لا توجد مؤسسات مسجلة'
                }
              </div>
            ) : (
              paginatedTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedTenants.includes(tenant.id)}
                      onCheckedChange={(checked) => handleSelectTenant(tenant.id, checked as boolean)}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.contact_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-white ${getStatusColor(tenant.status)}`}>
                          {getStatusLabel(tenant.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getPlanLabel(tenant.subscription_plan)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground text-left">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tenant.max_users}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openViewModal(tenant)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openEditModal(tenant)}
                        title="تحرير"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* More Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSettingsModal(tenant)}>
                            <Settings className="w-4 h-4 mr-2" />
                            الإعدادات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSubscriptionModal(tenant)}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            إدارة الاشتراك
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openBackupModal(tenant)}>
                            <Database className="w-4 h-4 mr-2" />
                            النسخ الاحتياطي
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openNotificationModal(tenant)}>
                            <Bell className="w-4 h-4 mr-2" />
                            الإشعارات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSecurityModal(tenant)}>
                            <Lock className="w-4 h-4 mr-2" />
                            الأمان
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(tenant)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredTenants.length > 0 && <PaginationControls />}
        </CardContent>
      </Card>

      {/* All existing modals and new modals */}
      {/* Add Tenant Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات المؤسسة الجديدة التي تريد إضافتها للنظام
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المؤسسة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: شركة النقل المتميز"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">الرمز (Slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="transport-company"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">البريد الإلكتروني *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="admin@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">رقم الهاتف</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="+966501234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="شارع الملك فهد، الدور الثالث"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="الرياض"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">العملة</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_plan">خطة الاشتراك</Label>
                <Select value={formData.subscription_plan} onValueChange={(value: any) => setFormData({...formData, subscription_plan: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">أساسي</SelectItem>
                    <SelectItem value="standard">قياسي</SelectItem>
                    <SelectItem value="premium">متميز</SelectItem>
                    <SelectItem value="enterprise">مؤسسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTenant} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                'إضافة المؤسسة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحرير بيانات المؤسسة</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات المؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">اسم المؤسسة *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: شركة النقل المتميز"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_slug">الرمز (Slug)</Label>
                <Input
                  id="edit_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="transport-company"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_contact_email">البريد الإلكتروني *</Label>
                <Input
                  id="edit_contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="admin@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_contact_phone">رقم الهاتف</Label>
                <Input
                  id="edit_contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="+966501234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">العنوان</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="شارع الملك فهد، الدور الثالث"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_city">المدينة</Label>
                <Input
                  id="edit_city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="الرياض"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency">العملة</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_subscription_plan">خطة الاشتراك</Label>
                <Select value={formData.subscription_plan} onValueChange={(value: any) => setFormData({...formData, subscription_plan: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">أساسي</SelectItem>
                    <SelectItem value="standard">قياسي</SelectItem>
                    <SelectItem value="premium">متميز</SelectItem>
                    <SelectItem value="enterprise">مؤسسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditTenant} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'حفظ التعديلات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tenant Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المؤسسة</DialogTitle>
            <DialogDescription>
              عرض كامل لبيانات ومعلومات المؤسسة
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                <TabsTrigger value="subscription">الاشتراك</TabsTrigger>
                <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">اسم المؤسسة:</span>
                      <span>{selectedTenant.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">البريد الإلكتروني:</span>
                      <span>{selectedTenant.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">رقم الهاتف:</span>
                      <span>{selectedTenant.contact_phone || 'غير محدد'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">العنوان:</span>
                      <span>{selectedTenant.address || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">المدينة:</span>
                      <span>{selectedTenant.city || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">الدولة:</span>
                      <span>{selectedTenant.country}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">خطة الاشتراك:</span>
                      <Badge variant="outline">{getPlanLabel(selectedTenant.subscription_plan)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">حالة الاشتراك:</span>
                      <Badge className={`text-white ${getStatusColor(selectedTenant.status)}`}>
                        {getStatusLabel(selectedTenant.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">العملة:</span>
                      <span>{selectedTenant.currency}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">تاريخ الإنشاء:</span>
                      <span>{new Date(selectedTenant.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">آخر تحديث:</span>
                      <span>{new Date(selectedTenant.updated_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{selectedTenant.max_users}</div>
                      <div className="text-sm text-muted-foreground">الحد الأقصى للمستخدمين</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{selectedTenant.max_vehicles}</div>
                      <div className="text-sm text-muted-foreground">الحد الأقصى للمركبات</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Activity className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{selectedTenant.max_contracts}</div>
                      <div className="text-sm text-muted-foreground">الحد الأقصى للعقود</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              إغلاق
            </Button>
            {selectedTenant && (
              <Button onClick={() => {
                setIsViewModalOpen(false);
                openEditModal(selectedTenant);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                تحرير
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعدادات المؤسسة</DialogTitle>
            <DialogDescription>
              إدارة الحدود والصلاحيات للمؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Users className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-lg font-bold">{selectedTenant.max_users}</div>
                      <div className="text-sm text-muted-foreground">المستخدمين</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Building2 className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-lg font-bold">{selectedTenant.max_vehicles}</div>
                      <div className="text-sm text-muted-foreground">المركبات</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Activity className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-lg font-bold">{selectedTenant.max_contracts}</div>
                      <div className="text-sm text-muted-foreground">العقود</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2" />
                <p>إعدادات متقدمة قيد التطوير</p>
                <p className="text-sm">ستتم إضافة المزيد من الخيارات قريباً</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Management Modal */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الاشتراك</DialogTitle>
            <DialogDescription>
              إدارة خطة وحالة اشتراك المؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold">{getPlanLabel(selectedTenant.subscription_plan)}</div>
                      <div className="text-sm text-muted-foreground">الخطة الحالية</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-lg font-bold">{getStatusLabel(selectedTenant.status)}</div>
                      <div className="text-sm text-muted-foreground">حالة الاشتراك</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">إجراءات الاشتراك:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start">
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    ترقية الخطة
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    تخفيض الخطة
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    تجديد الاشتراك
                  </Button>
                  <Button variant="outline" className="justify-start text-destructive">
                    <PauseCircle className="w-4 h-4 mr-2" />
                    إلغاء الاشتراك
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionModalOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Management Modal */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>النسخ الاحتياطي</DialogTitle>
            <DialogDescription>
              إدارة النسخ الاحتياطي لبيانات المؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h4 className="font-medium mb-2">النسخ الاحتياطي للبيانات</h4>
              <p className="text-sm text-muted-foreground">
                إنشاء نسخة احتياطية من جميع بيانات المؤسسة أو استعادة نسخة سابقة
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex-col">
                <Download className="w-6 h-6 mb-2" />
                إنشاء نسخة احتياطية
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Upload className="w-6 h-6 mb-2" />
                استعادة نسخة احتياطية
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>آخر نسخة احتياطية: منذ 3 أيام</p>
              <p>حجم البيانات: 2.5 GB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBackupModalOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الإشعارات</DialogTitle>
            <DialogDescription>
              إعدادات الإشعارات للمؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
              <h4 className="font-medium mb-2">إعدادات الإشعارات</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">انتهاء فترة التجربة</h5>
                  <p className="text-sm text-muted-foreground">تذكير قبل انتهاء فترة التجربة</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">تجاوز حدود الاستخدام</h5>
                  <p className="text-sm text-muted-foreground">تنبيه عند تجاوز حدود المستخدمين أو المركبات</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">فواتير الدفع</h5>
                  <p className="text-sm text-muted-foreground">إشعارات الفواتير والدفعات المستحقة</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">تحديثات النظام</h5>
                  <p className="text-sm text-muted-foreground">إشعارات حول تحديثات وميزات جديدة</p>
                </div>
                <Checkbox />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>
              إغلاق
            </Button>
            <Button>
              حفظ الإعدادات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Modal */}
      <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعدادات الأمان</DialogTitle>
            <DialogDescription>
              إدارة إعدادات الأمان للمؤسسة {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h4 className="font-medium mb-2">إعدادات الأمان المتقدمة</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">التحقق بخطوتين (2FA)</h5>
                  <p className="text-sm text-muted-foreground">إجبار جميع المستخدمين على استخدام 2FA</p>
                </div>
                <Checkbox />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">قائمة IP المسموحة</h5>
                  <p className="text-sm text-muted-foreground">تقييد الوصول لعناوين IP محددة</p>
                </div>
                <Checkbox />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">إدارة الجلسات</h5>
                  <p className="text-sm text-muted-foreground">انتهاء صلاحية الجلسات تلقائياً</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium">تسجيل العمليات</h5>
                  <p className="text-sm text-muted-foreground">تسجيل جميع العمليات الحساسة</p>
                </div>
                <Checkbox defaultChecked />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecurityModalOpen(false)}>
              إغلاق
            </Button>
            <Button>
              حفظ الإعدادات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف المؤسسة "{selectedTenant?.name}"؟
              <br />
              <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذه المؤسسة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف نهائياً'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              تأكيد الحذف المجمع
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف {selectedTenants.length} مؤسسة محددة؟
              <br />
              <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذه المؤسسات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف جميع المحددة'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

AdvancedTenantManagement.displayName = 'AdvancedTenantManagement';

export default AdvancedTenantManagement;
