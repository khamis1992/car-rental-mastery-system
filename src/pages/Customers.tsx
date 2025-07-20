import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  User,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AddCustomerDialog from '@/components/Customers/AddCustomerDialog';
import CustomerDetailsDialog from '@/components/Customers/CustomerDetailsDialog';
import EditCustomerDialog from '@/components/Customers/EditCustomerDialog';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  const navigate = useNavigate();
  const { customers, loading, error, refetch, deleteCustomer } = useCustomers();

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleCreateContract = (customer: Customer) => {
    // Navigate to contract creation page with customer ID
    navigate(`/contracts/new?customerId=${customer.id}`);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await deleteCustomer(customerToDelete.id);
        setShowDeleteDialog(false);
        setCustomerToDelete(null);
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'blocked':
        return 'محظور';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'individual':
        return 'فرد';
      case 'company':
        return 'شركة';
      default:
        return type;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة العملاء</h1>
            <p className="text-muted-foreground">عرض وإدارة بيانات العملاء</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <AddCustomerDialog />
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن عميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Card className="card-elegant">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{loading ? '...' : customers.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي العملاء</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customers Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">قائمة العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="mr-2">جاري التحميل...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">معلومات الاتصال</TableHead>
                    <TableHead className="text-right">المدينة</TableHead>
                    <TableHead className="text-right">العقود</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد عملاء
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">#{customer.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-right">
                            {customer.email && (
                              <div className="flex items-center gap-2 flex-row-reverse text-sm">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 flex-row-reverse text-sm">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.city && (
                            <div className="flex items-center gap-2 flex-row-reverse">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {customer.city}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {customer.contracts?.length || 0} عقد
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={customer.status === 'active' ? 'default' : customer.status === 'blocked' ? 'destructive' : 'secondary'}
                          >
                            {getStatusText(customer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeText(customer.customer_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(customer)}
                                className="cursor-pointer"
                              >
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditCustomer(customer)}
                                className="cursor-pointer"
                              >
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCreateContract(customer)}
                                className="cursor-pointer"
                              >
                                إنشاء عقد
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-red-600 cursor-pointer"
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CustomerDetailsDialog
          customer={selectedCustomer}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
        
        <EditCustomerDialog
          customer={selectedCustomer}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onCustomerUpdated={refetch}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="rtl-title">تأكيد حذف العميل</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                هل أنت متأكد من أنك تريد حذف العميل "{customerToDelete?.name}"؟
                هذه العملية لا يمكن التراجع عنها.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Customers;
