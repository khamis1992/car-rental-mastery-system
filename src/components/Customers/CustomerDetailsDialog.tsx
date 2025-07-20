import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/hooks/useCustomers';
import { User, Mail, Phone, MapPin, Building, Calendar, FileText } from 'lucide-react';

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetailsDialog: React.FC<CustomerDetailsDialogProps> = ({
  customer,
  open,
  onOpenChange,
}) => {
  if (!customer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'secondary';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <User className="h-5 w-5" />
            تفاصيل العميل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الاسم</label>
                  <div className="font-medium">{customer.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الرقم المدني</label>
                  <div className="font-medium">{customer.national_id || 'غير محدد'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نوع العميل</label>
                  <Badge variant="outline">{getTypeText(customer.customer_type)}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <Badge variant={getStatusColor(customer.status)}>
                    {getStatusText(customer.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">معلومات الاتصال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.city}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 flex-row-reverse">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>تاريخ التسجيل: {new Date(customer.created_at).toLocaleDateString('ar-KW')}</span>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>آخر تحديث: {new Date(customer.updated_at).toLocaleDateString('ar-KW')}</span>
              </div>
              {customer.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">ملاحظات:</span>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-right">
                    {customer.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contracts Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">ملخص العقود</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {customer.contracts?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي العقود</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsDialog;