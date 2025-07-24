import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ViolationPaymentForm } from './ViolationPaymentForm';
import { violationService } from '@/services/violationService';
import { ViolationWithDetails, ViolationPayment, ViolationHistory } from '@/types/violation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Calendar, 
  MapPin, 
  User, 
  Car, 
  CreditCard, 
  FileText, 
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

interface ViolationDetailsDialogProps {
  violationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const ViolationDetailsDialog: React.FC<ViolationDetailsDialogProps> = ({
  violationId,
  open,
  onOpenChange,
  onUpdate
}) => {
  const [violation, setViolation] = useState<ViolationWithDetails | null>(null);
  const [payments, setPayments] = useState<ViolationPayment[]>([]);
  const [history, setHistory] = useState<ViolationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);

  useEffect(() => {
    if (open && violationId) {
      loadViolationDetails();
    }
  }, [open, violationId]);

  const loadViolationDetails = async () => {
    if (!violationId) return;

    setLoading(true);
    try {
      const [violationData, paymentsData, historyData] = await Promise.all([
        violationService.getViolationById(violationId),
        violationService.getViolationPayments(violationId),
        violationService.getViolationHistory(violationId)
      ]);

      setViolation(violationData);
      setPayments(paymentsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading violation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const },
      notified: { label: 'تم الإشعار', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      disputed: { label: 'متنازع عليها', variant: 'destructive' as const },
      closed: { label: 'مغلقة', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLiabilityBadge = (liability: string) => {
    const liabilityConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const },
      customer: { label: 'العميل', variant: 'destructive' as const },
      company: { label: 'الشركة', variant: 'default' as const },
      shared: { label: 'مشتركة', variant: 'outline' as const },
    };

    const config = liabilityConfig[liability as keyof typeof liabilityConfig] || liabilityConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePaymentSuccess = () => {
    loadViolationDetails();
    onUpdate();
    setPaymentFormOpen(false);
  };

  if (!violation) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2 justify-end text-right">
             تفاصيل المخالفة المرورية - {violation.violation_number}
             <AlertTriangle className="w-5 h-5" />
           </DialogTitle>
         </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">المرفقات</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
              <TabsTrigger value="details">التفاصيل</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* معلومات عامة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 justify-end text-right">
                       معلومات المخالفة
                       <FileText className="w-4 h-4" />
                     </CardTitle>
                   </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{violation.violation_number}</span>
                      <span className="text-muted-foreground">: رقم المخالفة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{violation.violation_types?.violation_name_ar}</span>
                      <span className="text-muted-foreground">: نوع المخالفة</span>
                    </div>
                    <div className="flex justify-between">
                      {getStatusBadge(violation.status)}
                      <span className="text-muted-foreground">: الحالة</span>
                    </div>
                    <div className="flex justify-between">
                      {getLiabilityBadge(violation.liability_determination)}
                      <span className="text-muted-foreground">: المسؤولية</span>
                    </div>
                    {violation.liability_percentage !== 100 && (
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.liability_percentage}%</span>
                        <span className="text-muted-foreground">: نسبة المسؤولية</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 justify-end text-right">
                       المعلومات المالية
                       <DollarSign className="w-4 h-4" />
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex justify-between">
                       <span className="font-medium">{formatCurrency(violation.fine_amount)}</span>
                       <span className="text-muted-foreground">: مبلغ الغرامة</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">{formatCurrency(violation.processing_fee)}</span>
                       <span className="text-muted-foreground">: رسوم المعالجة</span>
                     </div>
                     <Separator />
                     <div className="flex justify-between text-lg font-bold">
                       <span>{formatCurrency(violation.total_amount)}</span>
                       <span>: المبلغ الإجمالي</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium text-green-600">{formatCurrency(violation.paid_amount)}</span>
                       <span className="text-muted-foreground">: المبلغ المدفوع</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium text-red-600">
                         {formatCurrency(violation.total_amount - violation.paid_amount)}
                       </span>
                       <span className="text-muted-foreground">: المبلغ المستحق</span>
                     </div>
                  </CardContent>
                </Card>
              </div>

              {/* معلومات الحدث */}
              <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 justify-end text-right">
                     تفاصيل الحدث
                     <Calendar className="w-4 h-4" />
                   </CardTitle>
                   <div className="flex justify-end text-right">
                     <div>
                       <span className="text-muted-foreground block">: تاريخ المخالفة</span>
                       <span className="font-medium">
                         {format(new Date(violation.violation_date), 'dd/MM/yyyy', { locale: ar })}
                       </span>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {violation.location && (
                       <div>
                         <span className="text-muted-foreground block">: المكان</span>
                         <span className="font-medium">{violation.location}</span>
                       </div>
                     )}
                   </div>
                   {violation.description && (
                     <div>
                       <span className="text-muted-foreground block mb-1">: وصف المخالفة</span>
                       <p className="text-sm bg-muted p-3 rounded-md">{violation.description}</p>
                     </div>
                   )}
                </CardContent>
              </Card>

              {/* معلومات العميل والمركبة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 justify-end text-right">
                       معلومات العميل
                       <User className="w-4 h-4" />
                     </CardTitle>
                   </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.customers?.name}</span>
                        <span className="text-muted-foreground">: الاسم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.customers?.customer_number}</span>
                        <span className="text-muted-foreground">: رقم العميل</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.customers?.phone}</span>
                        <span className="text-muted-foreground">: رقم الهاتف</span>
                      </div>
                   </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 justify-end text-right">
                       معلومات المركبة
                       <Car className="w-4 h-4" />
                     </CardTitle>
                   </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.vehicles?.license_plate}</span>
                        <span className="text-muted-foreground">: رقم اللوحة</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {violation.vehicles?.make} {violation.vehicles?.model}
                        </span>
                        <span className="text-muted-foreground">: النوع</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{violation.vehicles?.vehicle_number}</span>
                        <span className="text-muted-foreground">: رقم المركبة</span>
                      </div>
                      {violation.contracts && (
                        <div className="flex justify-between">
                          <span className="font-medium">{violation.contracts.contract_number}</span>
                          <span className="text-muted-foreground">: رقم العقد</span>
                        </div>
                      )}
                   </CardContent>
                </Card>
              </div>

              {/* معلومات الجهة المصدرة */}
              {(violation.official_violation_number || violation.issuing_authority || violation.officer_name) && (
                <Card>
                   <CardHeader>
                     <CardTitle className="text-right">معلومات الجهة المصدرة</CardTitle>
                   </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {violation.official_violation_number && (
                          <div className="flex justify-between">
                            <span className="font-medium">{violation.official_violation_number}</span>
                            <span className="text-muted-foreground">: رقم المخالفة الرسمي</span>
                          </div>
                        )}
                        {violation.issuing_authority && (
                          <div className="flex justify-between">
                            <span className="font-medium">{violation.issuing_authority}</span>
                            <span className="text-muted-foreground">: الجهة المصدرة</span>
                          </div>
                        )}
                        {violation.officer_name && (
                          <div className="flex justify-between">
                            <span className="font-medium">{violation.officer_name}</span>
                            <span className="text-muted-foreground">: اسم الضابط</span>
                          </div>
                        )}
                      </div>
                   </CardContent>
                </Card>
              )}

              {/* ملاحظات */}
              {violation.notes && (
                <Card>
                   <CardHeader>
                     <CardTitle className="text-right">ملاحظات</CardTitle>
                   </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-muted p-3 rounded-md">{violation.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="flex justify-between items-center">
                <Button onClick={() => setPaymentFormOpen(true)}>
                  إضافة دفعة
                </Button>
                <h3 className="text-lg font-semibold">المدفوعات</h3>
              </div>

              {payments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد مدفوعات مسجلة</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      استخدم زر "إضافة دفعة" لتسجيل دفعة جديدة
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{payment.payment_number}</p>
                              {payment.status === 'completed' && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ مكتمل
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              طريقة الدفع: {
                                payment.payment_method === 'cash' ? 'نقداً' :
                                payment.payment_method === 'card' ? 'بطاقة ائتمان' :
                                payment.payment_method === 'bank_transfer' ? 'حوالة بنكية' :
                                payment.payment_method === 'check' ? 'شيك' : payment.payment_method
                              }
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-muted-foreground">
                                ملاحظات: {payment.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg text-green-600">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              تم إنشاء القيد المحاسبي تلقائياً
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <h3 className="text-lg font-semibold text-right">سجل المخالفة</h3>
              {history.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">لا يوجد سجل</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{record.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <h3 className="text-lg font-semibold text-right">المرفقات والوثائق</h3>
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد مرفقات</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <ViolationPaymentForm
          open={paymentFormOpen}
          onOpenChange={setPaymentFormOpen}
          violation={violation}
          onSuccess={handlePaymentSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};