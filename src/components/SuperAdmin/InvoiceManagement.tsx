import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Building2, 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Edit,
  Search,
  RefreshCw,
  Eye,
  Download,
  Send,
  DollarSign,
  Calendar,
  TrendingUp,
  Activity,
  CreditCard,
  Mail,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSaasInvoices, useSaasPayments } from '@/hooks/useSaasOperations';
import { enhancedSaasService } from '@/services/enhancedSaasService';
import { formatPrice } from '@/types/subscription-plans';
import type { SaasInvoice, SaasPayment } from '@/types/unified-saas';

interface InvoiceManagementProps {
  tenantId?: string;
  readonly?: boolean;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ 
  tenantId: propTenantId, 
  readonly = false 
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<SaasInvoice | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // استخدام الـ hooks الجديدة
  const { 
    invoices, 
    loading: invoicesLoading, 
    error: invoicesError, 
    refresh: refreshInvoices 
  } = useSaasInvoices(propTenantId);
  
  const { 
    payments, 
    loading: paymentsLoading, 
    refresh: refreshPayments 
  } = useSaasPayments(propTenantId);
  
  const { toast } = useToast();

  // البيانات المفلترة
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    // فلتر التاريخ
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.invoice_date);
      const now = new Date();
      
      switch (dateFilter) {
        case 'this_month':
          matchesDate = invoiceDate.getMonth() === now.getMonth() && 
                       invoiceDate.getFullYear() === now.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesDate = invoiceDate.getMonth() === lastMonth.getMonth() && 
                       invoiceDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'this_year':
          matchesDate = invoiceDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // حساب الإحصائيات
  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => ['sent', 'draft'].includes(inv.status)).length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0),
  };

  // دوال المعالجة
  const handleUpdateStatus = async (invoiceId: string, newStatus: SaasInvoice['status']) => {
    try {
      await enhancedSaasService.updateInvoiceStatus?.(invoiceId, newStatus);
      refreshInvoices();
      toast({
        title: 'تم تحديث حالة الفاتورة',
        description: `تم تغيير الحالة إلى: ${getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديث الفاتورة',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await handleUpdateStatus(invoiceId, 'sent');
      toast({
        title: 'تم إرسال الفاتورة',
        description: 'تم إرسال الفاتورة إلى العميل بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في إرسال الفاتورة',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // دوال المساعدة
  const getStatusBadge = (status: SaasInvoice['status']) => {
    const variants = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit, label: 'مسودة' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'مرسلة' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'مدفوعة' },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'متأخرة' },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'ملغية' },
      void: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'باطلة' },
    };
    
    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: SaasInvoice['status']) => {
    const labels = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      overdue: 'متأخرة',
      canceled: 'ملغية',
      void: 'باطلة',
    };
    return labels[status] || status;
  };

  const getPaymentStatus = (invoice: SaasInvoice) => {
    if (invoice.status === 'paid') {
      return { label: 'مدفوعة بالكامل', color: 'text-green-600' };
    }
    
    if (invoice.paid_amount > 0) {
      return { label: 'مدفوعة جزئياً', color: 'text-orange-600' };
    }
    
    return { label: 'غير مدفوعة', color: 'text-red-600' };
  };

  // واجهة الإحصائيات
  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مدفوعة</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">متأخرة</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
              <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // واجهة تفاصيل الفاتورة
  const InvoiceDetailsDialog = () => (
    <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            تفاصيل الفاتورة {selectedInvoice?.invoice_number}
          </DialogTitle>
          <DialogDescription>
            معلومات شاملة عن الفاتورة
          </DialogDescription>
        </DialogHeader>

        {selectedInvoice && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="items">البنود</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات الفاتورة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم الفاتورة:</span>
                      <span className="font-mono">{selectedInvoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحالة:</span>
                      {getStatusBadge(selectedInvoice.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإصدار:</span>
                      <span>{selectedInvoice.invoice_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                      <span>{selectedInvoice.due_date}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات المبالغ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي:</span>
                      <span>{formatPrice(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الضريبة:</span>
                      <span>{formatPrice(selectedInvoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الخصم:</span>
                      <span>{formatPrice(selectedInvoice.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>المجموع الكلي:</span>
                      <span>{formatPrice(selectedInvoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المدفوع:</span>
                      <span className={getPaymentStatus(selectedInvoice).color}>
                        {formatPrice(selectedInvoice.paid_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">معلومات العميل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedInvoice.tenant?.name}</span>
                    </div>
                    {selectedInvoice.tenant?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedInvoice.tenant.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {selectedInvoice.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendInvoice(selectedInvoice.id)}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        إرسال الفاتورة
                      </Button>
                    )}

                    {selectedInvoice.status === 'sent' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedInvoice.id, 'paid')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        تسجيل دفعة
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      تحميل PDF
                    </Button>

                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Printer className="w-4 h-4" />
                      طباعة
                    </Button>

                    <Select onValueChange={(value) => handleUpdateStatus(selectedInvoice.id, value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="تغيير الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="sent">مرسلة</SelectItem>
                        <SelectItem value="paid">مدفوعة</SelectItem>
                        <SelectItem value="overdue">متأخرة</SelectItem>
                        <SelectItem value="canceled">ملغية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>بنود الفاتورة</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الوصف</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>السعر</TableHead>
                          <TableHead>المجموع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatPrice(item.unit_price)}</TableCell>
                            <TableCell>{formatPrice(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد بنود للفاتورة
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>سجل المدفوعات</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>طريقة الدفع</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatPrice(payment.amount)}</TableCell>
                            <TableCell>{payment.payment_method}</TableCell>
                            <TableCell>
                              <Badge className={payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.created_at}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد مدفوعات مسجلة
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );

  if (invoicesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invoicesError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">خطأ في تحميل الفواتير: {invoicesError}</p>
          <Button onClick={refreshInvoices} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      {!propTenantId && <StatsSection />}

      {/* عنوان الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {propTenantId ? 'فواتيري' : 'إدارة الفواتير'}
          </h1>
          <p className="text-muted-foreground">
            {propTenantId ? 'عرض وإدارة فواتيرك' : 'عرض وإدارة جميع فواتير النظام'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshInvoices} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          {!readonly && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              فاتورة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="sent">مرسلة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
                <SelectItem value="canceled">ملغية</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="this_month">هذا الشهر</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="this_year">هذه السنة</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول الفواتير */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                {!propTenantId && <TableHead>العميل</TableHead>}
                <TableHead>الحالة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                  {!propTenantId && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.tenant?.name}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="font-mono">{formatPrice(invoice.total_amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {invoice.invoice_date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {invoice.due_date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowInvoiceDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendInvoice(invoice.id)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد فواتير مطابقة لمعايير البحث
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تفاصيل الفاتورة */}
      <InvoiceDetailsDialog />
    </div>
  );
};

export default InvoiceManagement; 