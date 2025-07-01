import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  User, 
  Car, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileCheck,
  Download,
  Printer,
  Signature
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { contractService } from '@/services/contractService';
import { ContractPrintTemplate } from './ContractPrintTemplate';
import { ElectronicSignature } from './ElectronicSignature';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadContractPDF } from '@/lib/contractPDF';

interface ContractDetailsDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({
  contractId,
  open,
  onOpenChange,
}) => {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintTemplate, setShowPrintTemplate] = useState(false);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const [showCompanySignature, setShowCompanySignature] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (contractId && open) {
      loadContract();
    }
  }, [contractId, open]);

  const loadContract = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      const data = await contractService.getContractById(contractId);
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintTemplate(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;
    
    try {
      toast({
        title: "جاري إنشاء PDF...",
        description: "يرجى الانتظار أثناء إنشاء ملف PDF",
      });

      await downloadContractPDF(contract, `contract_${contract.contract_number}.pdf`);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل ملف PDF بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء ملف PDF",
        variant: "destructive",
      });
    }
  };

  const handleSignatureSaved = async (signature: string, type: 'customer' | 'company') => {
    try {
      const updateData = type === 'customer' 
        ? { 
            customer_signature: signature,
            customer_signed_at: new Date().toISOString()
          }
        : { 
            company_signature: signature,
            company_signed_at: new Date().toISOString()
          };

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;

      // إعادة تحميل العقد لعرض التوقيع المحدث
      loadContract();
      
      toast({
        title: "تم بنجاح",
        description: `تم حفظ ${type === 'customer' ? 'توقيع العميل' : 'توقيع الشركة'} بنجاح`,
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التوقيع",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      pending: { label: 'في الانتظار', variant: 'default' as const },
      active: { label: 'نشط', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'outline' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل العقد - {contract.contract_number}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(contract.status)}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                تحميل PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">اسم العميل</label>
                <p className="text-sm">{contract.customers?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                <p className="text-sm">{contract.customers?.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                <p className="text-sm">{contract.customers?.email || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">العنوان</label>
                <p className="text-sm">{contract.customers?.address || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم الهوية</label>
                <p className="text-sm">{contract.customers?.national_id || 'غير محدد'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                معلومات المركبة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">المركبة</label>
                <p className="text-sm">{contract.vehicles?.make} {contract.vehicles?.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">السنة</label>
                <p className="text-sm">{contract.vehicles?.year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم اللوحة</label>
                <p className="text-sm">{contract.vehicles?.license_plate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم المركبة</label>
                <p className="text-sm">{contract.vehicles?.vehicle_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">اللون</label>
                <p className="text-sm">{contract.vehicles?.color}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تفاصيل العقد
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ البداية</label>
                <p className="text-sm">{format(new Date(contract.start_date), 'PPP', { locale: ar })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ النهاية</label>
                <p className="text-sm">{format(new Date(contract.end_date), 'PPP', { locale: ar })}</p>
              </div>
              {contract.actual_start_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ البداية الفعلي</label>
                  <p className="text-sm">{format(new Date(contract.actual_start_date), 'PPP', { locale: ar })}</p>
                </div>
              )}
              {contract.actual_end_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ النهاية الفعلي</label>
                  <p className="text-sm">{format(new Date(contract.actual_end_date), 'PPP', { locale: ar })}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">عدد الأيام</label>
                <p className="text-sm">{contract.rental_days} يوم</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">نوع العقد</label>
                <p className="text-sm">
                  {contract.contract_type === 'daily' ? 'يومي' :
                   contract.contract_type === 'weekly' ? 'أسبوعي' :
                   contract.contract_type === 'monthly' ? 'شهري' : 'مخصص'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                التفاصيل المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">السعر اليومي</label>
                  <p className="text-sm">{contract.daily_rate.toFixed(3)} د.ك</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المبلغ الإجمالي</label>
                  <p className="text-sm">{contract.total_amount.toFixed(3)} د.ك</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">قيمة الخصم</label>
                  <p className="text-sm">{(contract.discount_amount || 0).toFixed(3)} د.ك</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">قيمة الضريبة</label>
                  <p className="text-sm">{(contract.tax_amount || 0).toFixed(3)} د.ك</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">التأمين</label>
                  <p className="text-sm">{(contract.insurance_amount || 0).toFixed(3)} د.ك</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">التأمين المسترد</label>
                  <p className="text-sm">{(contract.security_deposit || 0).toFixed(3)} د.ك</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>المبلغ النهائي:</span>
                <span>{contract.final_amount.toFixed(3)} د.ك</span>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          {(contract.pickup_location || contract.return_location) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  معلومات التسليم والاستلام
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.pickup_location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">مكان التسليم</label>
                    <p className="text-sm">{contract.pickup_location}</p>
                  </div>
                )}
                {contract.return_location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">مكان الاستلام</label>
                    <p className="text-sm">{contract.return_location}</p>
                  </div>
                )}
                {contract.pickup_mileage && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">قراءة العداد عند التسليم</label>
                    <p className="text-sm">{contract.pickup_mileage} كم</p>
                  </div>
                )}
                {contract.return_mileage && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">قراءة العداد عند الاستلام</label>
                    <p className="text-sm">{contract.return_mileage} كم</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {(contract.special_conditions || contract.terms_and_conditions || contract.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  معلومات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.special_conditions && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الشروط الخاصة</label>
                    <p className="text-sm whitespace-pre-wrap">{contract.special_conditions}</p>
                  </div>
                )}
                {contract.terms_and_conditions && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الشروط والأحكام</label>
                    <p className="text-sm whitespace-pre-wrap">{contract.terms_and_conditions}</p>
                  </div>
                )}
                {contract.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                    <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Electronic Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signature className="w-4 h-4" />
                التوقيعات الإلكترونية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Signature */}
                <div className="space-y-3">
                  <h4 className="font-medium">توقيع العميل</h4>
                  {contract.customer_signature ? (
                    <div className="space-y-2">
                      <div className="border border-border rounded-lg p-4 bg-muted/20">
                        <img 
                          src={contract.customer_signature} 
                          alt="توقيع العميل" 
                          className="max-h-20 mx-auto"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        تم التوقيع في: {contract.customer_signed_at ? format(new Date(contract.customer_signed_at), 'PPp', { locale: ar }) : 'غير محدد'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">لم يتم التوقيع بعد</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowCustomerSignature(true)}
                      >
                        <Signature className="w-4 h-4 mr-2" />
                        إضافة توقيع العميل
                      </Button>
                    </div>
                  )}
                </div>

                {/* Company Signature */}
                <div className="space-y-3">
                  <h4 className="font-medium">توقيع الشركة</h4>
                  {contract.company_signature ? (
                    <div className="space-y-2">
                      <div className="border border-border rounded-lg p-4 bg-muted/20">
                        <img 
                          src={contract.company_signature} 
                          alt="توقيع الشركة" 
                          className="max-h-20 mx-auto"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        تم التوقيع في: {contract.company_signed_at ? format(new Date(contract.company_signed_at), 'PPp', { locale: ar }) : 'غير محدد'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">لم يتم التوقيع بعد</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowCompanySignature(true)}
                      >
                        <Signature className="w-4 h-4 mr-2" />
                        إضافة توقيع الشركة
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Reference */}
          {contract.quotations && (
            <Card>
              <CardHeader>
                <CardTitle>عرض السعر المرجعي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">رقم عرض السعر: {contract.quotations.quotation_number}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Print Template */}
        {showPrintTemplate && (
          <div className="hidden print:block">
            <ContractPrintTemplate contract={contract} />
          </div>
        )}

        {/* Electronic Signature Dialogs */}
        <ElectronicSignature
          open={showCustomerSignature}
          onOpenChange={setShowCustomerSignature}
          title="توقيع العميل"
          contractId={contract.contract_number}
          signatureType="customer"
          onSignatureSaved={(signature) => handleSignatureSaved(signature, 'customer')}
        />

        <ElectronicSignature
          open={showCompanySignature}
          onOpenChange={setShowCompanySignature}
          title="توقيع الشركة"
          contractId={contract.contract_number}
          signatureType="company"
          onSignatureSaved={(signature) => handleSignatureSaved(signature, 'company')}
        />
      </DialogContent>
    </Dialog>
  );
};