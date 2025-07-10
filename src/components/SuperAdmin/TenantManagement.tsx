import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Activity,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TenantManagement: React.FC = () => {
  // في التطبيق الحقيقي، سيتم جلب هذه البيانات من قاعدة البيانات
  const [tenants] = useState([
    {
      id: '1',
      name: 'البشائر الخليجية',
      status: 'active',
      users: 45,
      vehicles: 120,
      contracts: 89,
      subscription: 'premium',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'شركة النقل الحديث',
      status: 'active',
      users: 23,
      vehicles: 67,
      contracts: 34,
      subscription: 'standard',
      createdAt: '2024-02-10'
    },
    {
      id: '3',
      name: 'مؤسسة الخليج للسيارات',
      status: 'inactive',
      users: 12,
      vehicles: 28,
      contracts: 15,
      subscription: 'basic',
      createdAt: '2024-03-05'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription: string) => {
    switch (subscription) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">مميز</Badge>;
      case 'standard':
        return <Badge className="bg-blue-100 text-blue-800">عادي</Badge>;
      case 'basic':
        return <Badge variant="outline">أساسي</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المؤسسات</h2>
          <p className="text-muted-foreground">
            إدارة جميع المؤسسات المشتركة في النظام
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة مؤسسة جديدة
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Building2 className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المؤسسات</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">المؤسسات النشطة</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.users, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Settings className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي العقود</p>
              <p className="text-2xl font-bold">
                {tenants.reduce((sum, t) => sum + t.contracts, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المؤسسات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المؤسسة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الاشتراك</TableHead>
                <TableHead>المستخدمين</TableHead>
                <TableHead>المركبات</TableHead>
                <TableHead>العقود</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>{getSubscriptionBadge(tenant.subscription)}</TableCell>
                  <TableCell>{tenant.users}</TableCell>
                  <TableCell>{tenant.vehicles}</TableCell>
                  <TableCell>{tenant.contracts}</TableCell>
                  <TableCell>{tenant.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
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
  );
};

export default TenantManagement;