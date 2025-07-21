import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Supplier } from "@/types/suppliers";

interface SupplierDetailsDialogProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailsDialog({ supplier, open, onOpenChange }: SupplierDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">تفاصيل المورد</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* المعلومات الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم المورد</p>
                  <p className="font-medium">{supplier.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">كود المورد</p>
                  <p className="font-medium">{supplier.supplier_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نوع المورد</p>
                  <Badge variant="outline">
                    {supplier.supplier_type === 'company' ? 'شركة' : 'فرد'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge variant={supplier.is_active ? "default" : "secondary"}>
                    {supplier.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات التواصل */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">معلومات التواصل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <p className="font-medium">{supplier.phone}</p>
                  </div>
                )}
                {supplier.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{supplier.email}</p>
                  </div>
                )}
                {supplier.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-medium">{supplier.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* المعلومات المالية */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">المعلومات المالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                  <p className="text-lg font-bold">
                    {supplier.current_balance?.toFixed(3) || '0.000'} د.ك
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحد الائتماني</p>
                  <p className="font-medium">
                    {supplier.credit_limit?.toFixed(3) || '0.000'} د.ك
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شروط الدفع</p>
                  <p className="font-medium">{supplier.payment_terms || 30} يوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}