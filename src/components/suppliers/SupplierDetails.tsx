import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Supplier, SupplierInvoice, SupplierPayment } from "@/integrations/supabase/types/suppliers";
import { SupplierService } from "@/services/supplierService";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  Calendar,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface SupplierDetailsProps {
  supplier: Supplier;
  onClose: () => void;
  onEdit: () => void;
}

export function SupplierDetails({ supplier, onClose, onEdit }: SupplierDetailsProps) {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSupplierData();
  }, [supplier.id]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      const [invoicesData, paymentsData] = await Promise.all([
        SupplierService.getSupplierInvoices(supplier.id),
        SupplierService.getSupplierPayments(supplier.id)
      ]);
      setInvoices(invoicesData);
      setPayments(paymentsData);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW');
  };

  const getSupplierTypeLabel = (type: string) => {
    const types = {
      individual: 'فرد',
      company: 'شركة',
      government: 'جهة حكومية'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const },
      approved: { label: 'معتمدة', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      partially_paid: { label: 'مدفوعة جزئياً', variant: 'secondary' as const },
      overdue: { label: 'متأخرة', variant: 'destructive' as const },
      cancelled: { label: 'ملغاة', variant: 'outline' as const },
      completed: { label: 'مكتملة', variant: 'default' as const },
      failed: { label: 'فاشلة', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate summary statistics
  const totalInvoices = invoices.length;
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const totalPaidAmount = payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            تفاصيل المورد: {supplier.name}
          </DialogTitle>
          <DialogDescription>
            عرض تفصيلي لبيانات المورد والمعاملات المرتبطة به
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">معلومات أساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">كود المورد:</span>
                  <span>{supplier.supplier_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">النوع:</span>
                  <span>{getSupplierTypeLabel(supplier.supplier_type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">الحالة:</span>
                  <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                    {supplier.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                {supplier.contact_person && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">الشخص المسؤول:</span>
                    <span>{supplier.contact_person}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{supplier.address}</span>
                  </div>
                )}
                {supplier.city && (
                  <div className="text-sm text-muted-foreground">
                    {supplier.city}{supplier.country && `, ${supplier.country}`}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">المعلومات المالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">الرصيد الحالي:</span>
                  <span className={supplier.current_balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {formatCurrency(supplier.current_balance)}
                  </span>
                </div>
                {supplier.credit_limit && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">الحد الائتماني:</span>
                    <span>{formatCurrency(supplier.credit_limit)}</span>
                  </div>
                )}
                {supplier.payment_terms && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">شروط الدفع:</span>
                    <span>{supplier.payment_terms} يوم</span>
                  </div>
                )}
                {supplier.tax_number && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">الرقم الضريبي:</span>
                    <span>{supplier.tax_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  القيمة: {formatCurrency(totalInvoiceAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المدفوعات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaidAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payments.filter(p => p.status === 'completed').length} دفعة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingInvoices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">فواتير متأخرة</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Data */}
          <Tabs defaultValue="invoices" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">الفواتير ({invoices.length})</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات ({payments.length})</TabsTrigger>
              <TabsTrigger value="banking">البيانات المصرفية</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>فواتير المورد</CardTitle>
                  <CardDescription>جميع الفواتير المرتبطة بهذا المورد</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">تاريخ الفاتورة</TableHead>
                        <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-right">المبلغ المدفوع</TableHead>
                        <TableHead className="text-right">المبلغ المستحق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>{invoice.invoice_type}</TableCell>
                          <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(invoice.paid_amount)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(invoice.outstanding_amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {invoices.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد فواتير لهذا المورد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>مدفوعات المورد</CardTitle>
                  <CardDescription>جميع المدفوعات المرتبطة بهذا المورد</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الدفعة</TableHead>
                        <TableHead className="text-right">تاريخ الدفع</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">طريقة الدفع</TableHead>
                        <TableHead className="text-right">رقم المرجع</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_number}</TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>{payment.transaction_reference || '-'}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {payments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد مدفوعات لهذا المورد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>البيانات المصرفية</CardTitle>
                  <CardDescription>معلومات الحساب المصرفي للمورد</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplier.bank_name && (
                      <div>
                        <span className="font-medium">اسم البنك:</span>
                        <p>{supplier.bank_name}</p>
                      </div>
                    )}
                    {supplier.bank_account && (
                      <div>
                        <span className="font-medium">رقم الحساب:</span>
                        <p>{supplier.bank_account}</p>
                      </div>
                    )}
                    {supplier.iban && (
                      <div>
                        <span className="font-medium">رقم الآيبان:</span>
                        <p>{supplier.iban}</p>
                      </div>
                    )}
                    {supplier.swift_code && (
                      <div>
                        <span className="font-medium">رمز السويفت:</span>
                        <p>{supplier.swift_code}</p>
                      </div>
                    )}
                  </div>

                  {!supplier.bank_name && !supplier.bank_account && !supplier.iban && !supplier.swift_code && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">لم يتم إدخال بيانات مصرفية لهذا المورد</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {supplier.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>ملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{supplier.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button type="button" onClick={onEdit}>
            تعديل البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}