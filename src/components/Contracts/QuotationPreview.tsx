import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface QuotationData {
  id: string;
  quotation_number: string;
  customers?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  vehicles?: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_number: string;
  };
  // البيانات قد تأتي مفلطحة أيضاً
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vehicle_number?: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  special_conditions?: string;
  terms_and_conditions?: string;
  valid_until: string;
  created_at: string;
}

interface QuotationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationData | null;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  open,
  onOpenChange,
  quotation,
}) => {
  const { toast } = useToast();

  if (!quotation) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('quotation-preview');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>عرض سعر ${quotation.quotation_number}</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                .bg-primary { background-color: #0ea5e9 !important; color: white !important; }
                .text-primary { color: #0ea5e9 !important; }
                .border-b { border-bottom: 1px solid #e5e7eb; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .p-4 { padding: 1rem; }
                .rounded-lg { border-radius: 0.5rem; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .gap-4 { gap: 1rem; }
                .font-bold { font-weight: bold; }
                .text-2xl { font-size: 1.5rem; line-height: 2rem; }
                .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
                .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                .text-xs { font-size: 0.75rem; line-height: 1rem; }
                .border { border: 1px solid #e5e7eb; }
                .bg-muted { background-color: #f9fafb; }
                .space-y-3 > * + * { margin-top: 0.75rem; }
                .border-t { border-top: 1px solid #e5e7eb; }
                .pt-6 { padding-top: 1.5rem; }
                .mt-6 { margin-top: 1.5rem; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .text-green-600 { color: #059669; }
                .opacity-90 { opacity: 0.9; }
                @media print {
                  body { margin: 0; }
                  .bg-primary { background-color: #0ea5e9 !important; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const handleDownloadPDF = () => {
    // هنا يمكن إضافة مكتبة لتصدير PDF
    toast({
      title: 'تصدير PDF',
      description: 'سيتم إضافة هذه الميزة قريباً',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `عرض سعر ${quotation.quotation_number}`,
        text: `عرض سعر لتأجير ${quotation.make || quotation.vehicles?.make || ''} ${quotation.model || quotation.vehicles?.model || ''}`,
        url: window.location.href,
      });
    } else {
      // نسخ الرابط للحافظة
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط العرض للحافظة',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>معاينة عرض السعر</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                مشاركة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-1" />
                تصدير PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                طباعة
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-white text-black print:shadow-none" id="quotation-preview">
          {/* رأس العرض */}
          <div className="text-center border-b pb-6 mb-6">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
              <h1 className="text-2xl font-bold">عرض سعر تأجير مركبة</h1>
              <p className="text-sm opacity-90">شركة تأجير السيارات</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-right">
                <p><strong>رقم العرض:</strong> {quotation.quotation_number}</p>
                <p><strong>تاريخ العرض:</strong> {format(new Date(quotation.created_at), 'dd/MM/yyyy', { locale: ar })}</p>
              </div>
              <div className="text-left">
                <p><strong>صالح حتى:</strong> {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}</p>
                <p><strong>العملة:</strong> الدينار الكويتي (د.ك)</p>
              </div>
            </div>
          </div>

          {/* معلومات العميل */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3 text-primary">معلومات العميل</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>الاسم:</strong> {quotation.customer_name || quotation.customers?.name || 'غير محدد'}</p>
                  <p><strong>الهاتف:</strong> {quotation.customer_phone || quotation.customers?.phone || 'غير محدد'}</p>
                </div>
                <div>
                  {(quotation.customer_email || quotation.customers?.email) && (
                    <p><strong>البريد الإلكتروني:</strong> {quotation.customer_email || quotation.customers?.email}</p>
                  )}
                  {(quotation.customer_address || quotation.customers?.address) && (
                    <p><strong>العنوان:</strong> {quotation.customer_address || quotation.customers?.address}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المركبة */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3 text-primary">معلومات المركبة</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>الماركة والموديل:</strong> {quotation.make || quotation.vehicles?.make || 'غير محدد'} {quotation.model || quotation.vehicles?.model || ''}</p>
                  <p><strong>سنة الصنع:</strong> {quotation.year || quotation.vehicles?.year || 'غير محدد'}</p>
                </div>
                <div>
                  <p><strong>رقم اللوحة:</strong> {quotation.license_plate || quotation.vehicles?.license_plate || 'غير محدد'}</p>
                  <p><strong>رقم المركبة:</strong> {quotation.vehicle_number || quotation.vehicles?.vehicle_number || 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الإيجار */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3 text-primary">تفاصيل الإيجار</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>تاريخ البداية:</strong> {format(new Date(quotation.start_date), 'dd/MM/yyyy', { locale: ar })}</p>
                  <p><strong>تاريخ النهاية:</strong> {format(new Date(quotation.end_date), 'dd/MM/yyyy', { locale: ar })}</p>
                </div>
                <div>
                  <p><strong>عدد الأيام:</strong> {quotation.rental_days} أيام</p>
                  <p><strong>السعر اليومي:</strong> {quotation.daily_rate.toFixed(3)} د.ك</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* التكلفة التفصيلية */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-3 text-primary">التكلفة التفصيلية</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي ({quotation.rental_days} أيام × {quotation.daily_rate.toFixed(3)} د.ك)</span>
                  <span>{quotation.total_amount.toFixed(3)} د.ك</span>
                </div>
                
                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>الخصم</span>
                    <span>- {quotation.discount_amount.toFixed(3)} د.ك</span>
                  </div>
                )}
                
                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>الضريبة</span>
                    <span>+ {quotation.tax_amount.toFixed(3)} د.ك</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>المجموع الإجمالي</span>
                  <span>{quotation.final_amount.toFixed(3)} د.ك</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الشروط والأحكام */}
          {(quotation.special_conditions || quotation.terms_and_conditions) && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3 text-primary">الشروط والأحكام</h3>
                
                {quotation.special_conditions && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">شروط خاصة:</h4>
                    <p className="text-sm bg-muted p-3 rounded">{quotation.special_conditions}</p>
                  </div>
                )}
                
                {quotation.terms_and_conditions && (
                  <div>
                    <h4 className="font-medium mb-2">الشروط والأحكام العامة:</h4>
                    <p className="text-sm bg-muted p-3 rounded">{quotation.terms_and_conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* تذييل العرض */}
          <div className="text-center border-t pt-6 mt-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>ملاحظة:</strong> هذا العرض صالح حتى {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
              </p>
              <p className="text-xs text-muted-foreground">
                شكراً لاختياركم خدماتنا - نتطلع للعمل معكم
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};