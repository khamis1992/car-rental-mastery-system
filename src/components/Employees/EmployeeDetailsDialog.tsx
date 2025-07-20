
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Mail, Phone, MapPin, Calendar, IdCard, Building } from 'lucide-react';
import { Employee } from '@/types/hr';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface EmployeeDetailsDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: (employee: Employee) => void;
  onDeleteClick?: (employee: Employee) => void;
}

const EmployeeDetailsDialogContent: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  open,
  onOpenChange,
  onEditClick,
  onDeleteClick,
}) => {
  console.log('🔍 EmployeeDetailsDialog: تم تحميل تفاصيل الموظف:', employee);

  // التحقق من وجود بيانات الموظف
  if (!employee) {
    console.error('❌ EmployeeDetailsDialog: لا توجد بيانات موظف');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">خطأ</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">لا توجد بيانات للموظف المحدد</p>
            <Button 
              onClick={() => onOpenChange(false)} 
              className="mt-4"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleEditClick = () => {
    try {
      console.log('🔧 EmployeeDetailsDialog: طلب تعديل الموظف:', employee.id);
      if (onEditClick) {
        onEditClick(employee);
      }
    } catch (error) {
      console.error('❌ EmployeeDetailsDialog: خطأ في تعديل الموظف:', error);
    }
  };

  const handleDeleteClick = () => {
    try {
      console.log('🗑️ EmployeeDetailsDialog: طلب حذف الموظف:', employee.id);
      if (onDeleteClick) {
        onDeleteClick(employee);
      }
    } catch (error) {
      console.error('❌ EmployeeDetailsDialog: خطأ في حذف الموظف:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="destructive">غير نشط</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">منتهي الخدمة</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">في إجازة</Badge>;
      default:
        return <Badge variant="secondary">{status || 'غير محدد'}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
    } catch (error) {
      console.warn('تحذير: تاريخ غير صحيح:', dateString);
      return 'تاريخ غير صحيح';
    }
  };

  const formatSalary = (salary?: number) => {
    if (!salary || salary === 0) return 'غير محدد';
    try {
      return `${salary.toLocaleString()} د.ك`;
    } catch (error) {
      console.warn('تحذير: راتب غير صحيح:', salary);
      return 'غير محدد';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right rtl-title">
            <div className="flex items-center justify-between flex-row-reverse">
              <span>تفاصيل الموظف</span>
              <div className="flex gap-2">
                {onEditClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="rtl-flex"
                  >
                    <Edit className="h-4 w-4" />
                    تعديل
                  </Button>
                )}
                {onDeleteClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rtl-flex"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right rtl-title">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span>المعلومات الأساسية</span>
                  <IdCard className="h-5 w-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    رقم الموظف
                  </label>
                  <p className="text-sm">{employee.employee_number || 'غير محدد'}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    الحالة
                  </label>
                  {getStatusBadge(employee.status)}
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    الاسم الأول
                  </label>
                  <p className="text-sm">{employee.first_name || 'غير محدد'}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    الاسم الأخير
                  </label>
                  <p className="text-sm">{employee.last_name || 'غير محدد'}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    المنصب
                  </label>
                  <p className="text-sm">{employee.position || 'غير محدد'}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
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
              <CardTitle className="text-right rtl-title">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span>معلومات الاتصال</span>
                  <Phone className="h-5 w-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    البريد الإلكتروني
                  </label>
                  <div className="rtl-flex flex items-center gap-2">
                    {employee.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm">{employee.email || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    رقم الهاتف
                  </label>
                  <div className="rtl-flex flex items-center gap-2">
                    {employee.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-sm">{employee.phone || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="text-right md:col-span-2">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    العنوان
                  </label>
                  <div className="rtl-flex flex items-center gap-2">
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
              <CardTitle className="text-right rtl-title">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span>معلومات التوظيف</span>
                  <Building className="h-5 w-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    تاريخ التوظيف
                  </label>
                  <div className="rtl-flex flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(employee.hire_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    الراتب
                  </label>
                  <p className="text-sm">{formatSalary(employee.salary)}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
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
                <CardTitle className="text-right rtl-title">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span>جهة الاتصال في حالة الطوارئ</span>
                    <Phone className="h-5 w-5" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                      الاسم
                    </label>
                    <p className="text-sm">{employee.emergency_contact_name || 'غير محدد'}</p>
                  </div>
                  <div className="text-right">
                    <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
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
                <CardTitle className="text-right rtl-title">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span>المعلومات المصرفية</span>
                    <Building className="h-5 w-5" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                      اسم البنك
                    </label>
                    <p className="text-sm">{employee.bank_name || 'غير محدد'}</p>
                  </div>
                  <div className="text-right">
                    <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
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
              <CardTitle className="text-right rtl-title">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span>التوقيتات</span>
                  <Calendar className="h-5 w-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-sm">{formatDate(employee.created_at)}</p>
                </div>
                <div className="text-right">
                  <label className="rtl-label block text-sm font-medium text-muted-foreground mb-1">
                    آخر تحديث
                  </label>
                  <p className="text-sm">{formatDate(employee.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">خطأ في عرض التفاصيل</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                حدث خطأ أثناء عرض تفاصيل الموظف
              </p>
              <Button 
                onClick={() => props.onOpenChange(false)}
                className="rtl-flex"
              >
                إغلاق
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <EmployeeDetailsDialogContent {...props} />
    </ErrorBoundary>
  );
};
