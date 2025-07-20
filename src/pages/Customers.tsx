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
  User
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
import AddCustomerDialog from '@/components/Customers/AddCustomerDialog';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleViewDetails = (customerId: number) => {
    console.log('عرض تفاصيل العميل:', customerId);
    // يمكن إضافة منطق التنقل إلى صفحة تفاصيل العميل
  };

  const handleEditCustomer = (customerId: number) => {
    console.log('تعديل العميل:', customerId);
    // يمكن إضافة منطق فتح نموذج التعديل
  };

  const handleCreateContract = (customerId: number) => {
    console.log('إنشاء عقد للعميل:', customerId);
    // يمكن إضافة منطق التنقل إلى صفحة إنشاء العقد
  };

  const handleDeleteCustomer = (customerId: number) => {
    console.log('حذف العميل:', customerId);
    // يمكن إضافة منطق تأكيد الحذف
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      // منطق الحذف
    }
  };

  const customers = [
    {
      id: 1,
      name: "أحمد محمد السالم",
      email: "ahmed.salem@email.com",
      phone: "+965 9999 8888",
      city: "الكويت",
      contractsCount: 3,
      status: "نشط",
      customerType: "عميل"
    },
    {
      id: 2,
      name: "فاطمة علي الرشيد",
      email: "fatima.rashid@email.com", 
      phone: "+965 9999 7777",
      city: "الأحمدي",
      contractsCount: 1,
      status: "نشط",
      customerType: "شركة"
    },
    {
      id: 3,
      name: "خالد عبدالله الكندي",
      email: "khalid.kindi@email.com",
      phone: "+965 9999 6666",
      city: "الفروانية",
      contractsCount: 2,
      status: "معلق",
      customerType: "عميل"
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
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
                <div className="text-2xl font-bold text-primary">{customers.length}</div>
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">#{customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2 flex-row-reverse text-sm">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 flex-row-reverse text-sm">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {customer.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.contractsCount} عقد
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={customer.status === 'نشط' ? 'default' : 'secondary'}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.customerType}
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
                            onClick={() => handleViewDetails(customer.id)}
                            className="cursor-pointer"
                          >
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEditCustomer(customer.id)}
                            className="cursor-pointer"
                          >
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCreateContract(customer.id)}
                            className="cursor-pointer"
                          >
                            إنشاء عقد
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 cursor-pointer"
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Customers;
