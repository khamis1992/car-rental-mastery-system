import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Eye,
  Building,
  User,
  Phone,
  Mail,
  Loader2,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CustomerForm from '@/components/Customers/CustomerForm';
import CustomerDetailsDialog from '@/components/Customers/CustomerDetailsDialog';
import CustomerCSVImportDialog from '@/components/Customers/CustomerCSVImportDialog';

interface Customer {
  id: string;
  customer_number: string;
  customer_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  address?: string;
  city?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_contracts: number;
  total_revenue: number;
  last_contract_date?: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const { profile } = useAuth();
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAllCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب العملاء:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب بيانات العملاء",
          variant: "destructive",
        });
        return;
      }

      setAllCustomers(data || []);
    } catch (error) {
      console.error('خطأ في جلب العملاء:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات العملاء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Improved search and filtering logic
  const filteredCustomers = useMemo(() => {
    let filtered = allCustomers;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customer_type === typeFilter);
    }

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer => {
        return (
          customer.name?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.customer_number?.toLowerCase().includes(searchLower) ||
          customer.national_id?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [allCustomers, statusFilter, typeFilter, debouncedSearchTerm]);

  // Update customers when filters change
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setSearchLoading(true);
    } else {
      setSearchLoading(false);
    }
    setCustomers(filteredCustomers);
  }, [filteredCustomers, debouncedSearchTerm, searchTerm]);

  // Load all customers on mount
  useEffect(() => {
    fetchAllCustomers();
  }, [fetchAllCustomers]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', color: 'bg-green-500' },
      inactive: { label: 'غير نشط', color: 'bg-gray-500' },
      blocked: { label: 'محظور', color: 'bg-red-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`text-white ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'individual' ? (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="w-3 h-3" />
        فرد
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <Building className="w-3 h-3" />
        شركة
      </Badge>
    );
  };


  const handleCustomerAdded = () => {
    setShowAddDialog(false);
    fetchAllCustomers();
    toast({
      title: "تم بنجاح",
      description: "تم إضافة العميل بنجاح",
    });
  };

  const handleCustomerUpdated = () => {
    setShowEditDialog(false);
    setCustomerToEdit(null);
    fetchAllCustomers();
    toast({
      title: "تم بنجاح",
      description: "تم تحديث العميل بنجاح",
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setShowEditDialog(true);
  };

  const canAddCustomers = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'receptionist';

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة العملاء</h1>
          <p className="text-muted-foreground">إدارة قاعدة بيانات العملاء وتاريخهم</p>
        </div>
        
        {canAddCustomers && (
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary"
              onClick={() => setShowCSVImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              استيراد من CSV
            </Button>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="btn-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  إضافة عميل جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>إضافة عميل جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات العميل الجديد
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1">
                  <CustomerForm onSuccess={handleCustomerAdded} mode="add" />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.customer_type === 'individual').length}
                </p>
                <p className="text-sm text-muted-foreground">عملاء أفراد</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.customer_type === 'company').length}
                </p>
                <p className="text-sm text-muted-foreground">عملاء شركات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">عملاء نشطون</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              {searchLoading ? (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
              ) : (
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              )}
              <Input
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="blocked">محظور</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">جميع الأنواع</option>
              <option value="individual">أفراد</option>
              <option value="company">شركات</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* جدول العملاء */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 text-right">رقم العميل</TableHead>
                  <TableHead className="w-48 text-right">الاسم</TableHead>
                  <TableHead className="w-24 text-right">النوع</TableHead>
                  <TableHead className="w-40 text-right">الهاتف</TableHead>
                  <TableHead className="w-52 text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="w-24 text-right">الحالة</TableHead>
                  <TableHead className="w-20 text-right text-center">العقود</TableHead>
                  <TableHead className="w-24 text-right text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="w-32 font-mono text-right">{customer.customer_number}</TableCell>
                    <TableCell className="w-48 font-medium text-right">{customer.name}</TableCell>
                    <TableCell className="w-24 text-right">{getTypeBadge(customer.customer_type)}</TableCell>
                    <TableCell className="w-40 text-right">
                      <div className="flex items-center justify-start gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-52 text-right">
                      {customer.email ? (
                        <div className="flex items-center justify-start gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell className="w-24 text-right">{getStatusBadge(customer.status)}</TableCell>
                    <TableCell className="w-20 text-center">{customer.total_contracts}</TableCell>
                    <TableCell className="w-24 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          <DropdownMenuLabel className="text-right">الإجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-right cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {canAddCustomers && (
                            <DropdownMenuItem 
                              className="text-right cursor-pointer"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {customers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد عملاء</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'لا توجد نتائج مطابقة للبحث'
                  : 'لم يتم إضافة أي عملاء بعد'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار تعديل العميل */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>تعديل العميل</DialogTitle>
            <DialogDescription>
              تحديث بيانات العميل
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            {customerToEdit && (
              <CustomerForm 
                customer={customerToEdit} 
                onSuccess={handleCustomerUpdated} 
                mode="edit" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار تفاصيل العميل */}
      {selectedCustomer && (
        <CustomerDetailsDialog
          customer={selectedCustomer}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}

      {/* حوار استيراد CSV */}
      <CustomerCSVImportDialog
        open={showCSVImportDialog}
        onOpenChange={setShowCSVImportDialog}
        onSuccess={fetchAllCustomers}
      />
    </div>
  );
};

export default Customers;