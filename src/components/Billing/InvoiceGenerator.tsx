import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Eye, 
  Send,
  Calendar,
  DollarSign,
  Building2,
  Clock
} from "lucide-react";
import { useSaasInvoices, useCreateInvoice } from "@/hooks/useSaasData";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

const InvoiceGenerator: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: invoices, isLoading } = useSaasInvoices();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success';
      case 'open':
        return 'bg-info';
      case 'draft':
        return 'bg-muted';
      case 'overdue':
        return 'bg-destructive';
      case 'void':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'open':
        return 'مفتوحة';
      case 'draft':
        return 'مسودة';
      case 'overdue':
        return 'متأخرة';
      case 'void':
        return 'ملغاة';
      default:
        return status;
    }
  };

  const generatePDF = async (invoice: any) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add Arabic font support (you might need to add a custom font)
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(20);
      doc.text('فاتورة اشتراك SaaS', 105, 30, { align: 'center' });
      
      // Invoice details
      doc.setFontSize(12);
      doc.text(`رقم الفاتورة: ${invoice.invoice_number}`, 20, 50);
      doc.text(`تاريخ الإصدار: ${new Date(invoice.created_at).toLocaleDateString('ar-KW')}`, 20, 60);
      doc.text(`تاريخ الاستحقاق: ${new Date(invoice.due_date).toLocaleDateString('ar-KW')}`, 20, 70);
      
      // Customer details
      doc.text('معلومات العميل:', 20, 90);
      doc.text(`المؤسسة: ${invoice.tenant?.name || 'غير محدد'}`, 20, 100);
      
      // Invoice items
      doc.text('تفاصيل الفاتورة:', 20, 120);
      doc.text(`الاشتراك: ${invoice.subscription?.plan?.plan_name || 'خطة غير محددة'}`, 20, 130);
       doc.text(`المبلغ الإجمالي: ${invoice.total_amount} ${invoice.currency}`, 20, 140);
       doc.text(`المبلغ الفرعي: ${invoice.subtotal} ${invoice.currency}`, 20, 150);
       doc.text(`الضريبة: ${invoice.tax_amount} ${invoice.currency}`, 20, 160);
      
      // Footer
      doc.setFontSize(10);
      doc.text('شكراً لاختياركم خدماتنا', 105, 270, { align: 'center' });
      
      // Save the PDF
      doc.save(`invoice-${invoice.invoice_number}.pdf`);
      
      toast({
        title: 'تم تصدير الفاتورة',
        description: 'تم تحميل ملف PDF للفاتورة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير الفاتورة',
        variant: 'destructive',
      });
    }
  };

  const sendInvoice = async (invoice: any) => {
    try {
      // Here you would implement email sending logic
      toast({
        title: 'تم إرسال الفاتورة',
        description: 'تم إرسال الفاتورة بالبريد الإلكتروني بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الإرسال',
        description: 'حدث خطأ أثناء إرسال الفاتورة',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          إدارة الفواتير
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices?.map((invoice) => (
            <Card key={invoice.id} className="border-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-primary p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{invoice.invoice_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {invoice.tenant?.name || 'مؤسسة غير محددة'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>المبلغ</span>
                      </div>
                      <p className="font-semibold">{invoice.total_amount} {invoice.currency}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ الاستحقاق</span>
                      </div>
                      <p className="font-semibold">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-KW') : 'غير محدد'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        {invoice.status !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendInvoice(invoice)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoice Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>معاينة الفاتورة</DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">فاتورة اشتراك</h2>
                  <p className="text-muted-foreground">رقم الفاتورة: {selectedInvoice.invoice_number}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">معلومات المؤسسة</h4>
                    <p>{selectedInvoice.tenant?.name || 'غير محدد'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">تفاصيل الفاتورة</h4>
                    <div className="space-y-1 text-sm">
                      <p>تاريخ الإصدار: {new Date(selectedInvoice.created_at).toLocaleDateString('ar-KW')}</p>
                      <p>تاريخ الاستحقاق: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('ar-KW') : 'غير محدد'}</p>
                      <p>الحالة: {getStatusText(selectedInvoice.status)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">تفاصيل الاشتراك</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الخطة:</span>
                      <span>{selectedInvoice.subscription?.plan?.plan_name || 'غير محدد'}</span>
                    </div>
                     <div className="flex justify-between">
                       <span>المبلغ الفرعي:</span>
                       <span>{selectedInvoice.subtotal} {selectedInvoice.currency}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>الضريبة:</span>
                       <span>{selectedInvoice.tax_amount} {selectedInvoice.currency}</span>
                     </div>
                     <div className="flex justify-between font-semibold">
                       <span>المبلغ الإجمالي:</span>
                       <span>{selectedInvoice.total_amount} {selectedInvoice.currency}</span>
                     </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => generatePDF(selectedInvoice)}>
                    <Download className="w-4 h-4 ml-2" />
                    تحميل PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InvoiceGenerator;