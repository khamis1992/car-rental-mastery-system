
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Mail, Phone, MapPin, Calendar, IdCard, Building } from 'lucide-react';
import { Employee } from '@/types/hr';

interface EmployeeDetailsDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: (employee: Employee) => void;
  onDeleteClick?: (employee: Employee) => void;
}

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  open,
  onOpenChange,
  onEditClick,
  onDeleteClick,
}) => {
  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick(employee);
    }
  };

  const handleDeleteClick = () => {
    if (onDeleteClick) {
      onDeleteClick(employee);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="destructive">غير نشط</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">في إجازة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-between flex-row-reverse">
            <span>تفاصيل الموظف</span>
            <div className="flex gap-2">
              {onEditClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
              )}
              {onDeleteClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <span>المعلومات الأساسية</span>
                <IdCard className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    رقم الموظف
                  </label>
                  <p className="text-sm">{employee.employee_number}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الحالة
                  </label>
                  {getStatusBadge(employee.status)}
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الاسم الأول
                  </label>
                  <p className="text-sm">{employee.first_name}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الاسم الأخير
                  </label>
                  <p className="text-sm">{employee.last_name}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    المنصب
                  </label>
                  <p className="text-sm">{employee.position}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    القسم
                  </label>
                  <p className="text-sm">{employee.department || 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <span>معلومات الاتصال</span>
                <Phone className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    البريد الإلكتروني
                  </label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    {employee.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm">{employee.email || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    رقم الهاتف
                  </label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    {employee.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm">{employee.phone || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="text-right md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    العنوان
                  </label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    {employee.address && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm">{employee.address || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <span>معلومات التوظيف</span>
                <Building className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    تاريخ التوظيف
                  </label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الراتب
                  </label>
                  <p className="text-sm">
                    {employee.salary ? `${employee.salary.toLocaleString()} د.ك` : 'غير محدد'}
                  </p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الرقم المدني
                  </label>
                  <p className="text-sm">{employee.national_id || 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <span>جهة الاتصال في حالة الطوارئ</span>
                  <Phone className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      الاسم
                    </label>
                    <p className="text-sm">{employee.emergency_contact_name || 'غير محدد'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      رقم الهاتف
                    </label>
                    <p className="text-sm">{employee.emergency_contact_phone || 'غير محدد'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banking Information */}
          {(employee.bank_name || employee.bank_account_number) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <span>المعلومات المصرفية</span>
                  <Building className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      اسم البنك
                    </label>
                    <p className="text-sm">{employee.bank_name || 'غير محدد'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      رقم الحساب
                    </label>
                    <p className="text-sm">{employee.bank_account_number || 'غير محدد'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <span>التوقيتات</span>
                <Calendar className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-sm">
                    {new Date(employee.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    آخر تحديث
                  </label>
                  <p className="text-sm">
                    {new Date(employee.updated_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
