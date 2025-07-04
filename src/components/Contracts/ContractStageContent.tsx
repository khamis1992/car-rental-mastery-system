import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  PenTool, 
  Truck, 
  CreditCard, 
  CheckCircle,
  Clock,
  User,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
  Signature
} from 'lucide-react';

interface ContractStageContentProps {
  stage: string;
  contract: any;
  onShowCustomerSignature: () => void;
  onShowCompanySignature: () => void;
  onShowDelivery: () => void;
  onShowReturn: () => void;
  onShowPayment: () => void;
  onAdvanceToNextStage?: () => void;
}

export const ContractStageContent: React.FC<ContractStageContentProps> = ({
  stage,
  contract,
  onShowCustomerSignature,
  onShowCompanySignature,
  onShowDelivery,
  onShowReturn,
  onShowPayment,
  onAdvanceToNextStage
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ك`;
  };

  const renderDraftStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <FileText className="w-5 h-5" />
            تفاصيل العقد الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">العميل</span>
              </div>
              <p className="text-sm">{contract.customers?.name}</p>
              <p className="text-xs text-muted-foreground">{contract.customers?.phone}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">المركبة</span>
              </div>
              <p className="text-sm">{contract.vehicles?.make} {contract.vehicles?.model}</p>
              <p className="text-xs text-muted-foreground">{contract.vehicles?.license_plate}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">فترة الإيجار</span>
              </div>
              <p className="text-sm">{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</p>
              <p className="text-xs text-muted-foreground">{contract.rental_days} يوم</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">المبلغ الإجمالي</span>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(contract.final_amount)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(contract.daily_rate)}/يوم</p>
            </div>
          </div>

          {contract.special_conditions && (
            <div className="text-right">
              <span className="text-sm font-medium">الشروط الخاصة:</span>
              <p className="text-sm text-muted-foreground mt-1">{contract.special_conditions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1 text-right">
          <li>التحقق من بيانات العميل</li>
          <li>مراجعة تفاصيل المركبة</li>
          <li>تحديد شروط الإيجار</li>
          <li>إعداد الوثائق المطلوبة</li>
        </ul>
      </div>

      {contract.status === 'draft' && onAdvanceToNextStage && (
        <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال للمرحلة التالية
          </Button>
        </div>
      )}
    </div>
  );

  const renderPendingStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Signature className="w-5 h-5" />
            حالة التوقيعات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={contract.customer_signature ? "default" : "secondary"}>
                  {contract.customer_signature ? "تم التوقيع" : "في الانتظار"}
                </Badge>
                <span className="text-sm font-medium">توقيع العميل</span>
              </div>
              {contract.customer_signature ? (
                <div className="text-xs text-muted-foreground">
                  تم التوقيع في: {formatDate(contract.customer_signed_at)}
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={onShowCustomerSignature}
                  className="w-full"
                >
                  طلب التوقيع من العميل
                </Button>
              )}
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={contract.company_signature ? "default" : "secondary"}>
                  {contract.company_signature ? "تم التوقيع" : "في الانتظار"}
                </Badge>
                <span className="text-sm font-medium">توقيع الشركة</span>
              </div>
              {contract.company_signature ? (
                <div className="text-xs text-muted-foreground">
                  تم التوقيع في: {formatDate(contract.company_signed_at)}
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={onShowCompanySignature}
                  className="w-full"
                >
                  توقيع باسم الشركة
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h3 className="font-medium text-orange-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-orange-800 space-y-1 text-right">
          <li>إرسال العقد للعميل للتوقيع</li>
          <li>متابعة توقيع العميل</li>
          <li>توقيع الشركة على العقد</li>
          <li>التأكد من اكتمال جميع التوقيعات</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when both signatures are complete */}
      {contract.customer_signature && contract.company_signature && contract.status === 'pending' && onAdvanceToNextStage && (
        <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال للمرحلة التالية
          </Button>
        </div>
      )}
    </div>
  );

  const renderDeliveryStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Truck className="w-5 h-5" />
            حالة التسليم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.delivery_completed_at ? (
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم تسليم المركبة بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تاريخ التسليم: {formatDate(contract.delivery_completed_at)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">جاهز للتسليم</h3>
                <p className="text-muted-foreground mb-4">المركبة جاهزة للتسليم للعميل</p>
                <Button onClick={onShowDelivery} className="px-8">
                  بدء عملية التسليم
                </Button>
              </div>
            </div>
          )}

          {contract.pickup_photos && contract.pickup_photos.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">صور التسليم</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تم رفع {contract.pickup_photos.length} صورة
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-green-800 space-y-1 text-right">
          <li>فحص المركبة قبل التسليم</li>
          <li>توثيق حالة المركبة بالصور</li>
          <li>تسليم المفاتيح والوثائق</li>
          <li>تأكيد استلام العميل</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when delivery is completed */}
      {contract.delivery_completed_at && !contract.payment_registered_at && onAdvanceToNextStage && (
        <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال لمرحلة الدفع
          </Button>
        </div>
      )}
    </div>
  );

  const renderPaymentStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CreditCard className="w-5 h-5" />
            حالة المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.payment_registered_at ? (
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم تسجيل الدفع بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تاريخ التسجيل: {formatDate(contract.payment_registered_at)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">في انتظار تسجيل الدفع</h3>
                <p className="text-muted-foreground mb-4">
                  المبلغ الإجمالي: {formatCurrency(contract.final_amount)}
                </p>
                <Button onClick={onShowPayment} className="px-8">
                  تسجيل الدفع
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">المبلغ الأساسي:</span>
              <p className="font-medium">{formatCurrency(contract.total_amount)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">الضريبة:</span>
              <p className="font-medium">{formatCurrency(contract.tax_amount || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">الخصم:</span>
              <p className="font-medium">{formatCurrency(contract.discount_amount || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">المبلغ النهائي:</span>
              <p className="font-medium text-lg">{formatCurrency(contract.final_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-medium text-purple-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-purple-800 space-y-1 text-right">
          <li>تسجيل الدفعات المستلمة</li>
          <li>إصدار الفواتير</li>
          <li>متابعة المتأخرات</li>
          <li>تأكيد اكتمال الدفع</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when payment is registered */}
      {contract.payment_registered_at && contract.status === 'active' && !contract.actual_end_date && onAdvanceToNextStage && (
        <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال لمرحلة الاستلام
          </Button>
        </div>
      )}
    </div>
  );

  const renderReturnStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="w-5 h-5" />
            حالة الاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.actual_end_date ? (
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم استلام المركبة بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تاريخ الاستلام: {formatDate(contract.actual_end_date)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">جاهز للاستلام</h3>
                <p className="text-muted-foreground mb-4">المركبة جاهزة للاستلام من العميل</p>
                <Button onClick={onShowReturn} className="px-8">
                  بدء عملية الاستلام
                </Button>
              </div>
            </div>
          )}

          {contract.return_photos && contract.return_photos.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">صور الاستلام</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تم رفع {contract.return_photos.length} صورة
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="font-medium text-red-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-red-800 space-y-1 text-right">
          <li>فحص حالة المركبة عند الاستلام</li>
          <li>توثيق أي أضرار أو مشاكل</li>
          <li>تسجيل قراءة العداد النهائية</li>
          <li>التأكد من إرجاع جميع الملحقات</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when vehicle is returned */}
      {contract.actual_end_date && contract.status !== 'completed' && onAdvanceToNextStage && (
        <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            إنهاء العقد
          </Button>
        </div>
      )}
    </div>
  );

  const renderCompletedStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="w-5 h-5" />
            حالة الاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.status === 'completed' ? (
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم إنهاء العقد بنجاح</h3>
              </div>
              <ul className="list-disc list-inside text-green-800 space-y-1 text-right mt-3">
                <li>تم استلام المركبة من العميل</li>
                <li>تم فحص حالة المركبة</li>
                <li>تم إنهاء جميع المعاملات المالية</li>
                <li>تم إغلاق العقد رسمياً</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">جاهز للاستلام</h3>
                <p className="text-muted-foreground mb-4">المركبة جاهزة للاستلام من العميل</p>
                <Button onClick={onShowReturn} className="px-8">
                  بدء عملية الاستلام
                </Button>
              </div>
            </div>
          )}

          {contract.return_photos && contract.return_photos.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">صور الاستلام</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تم رفع {contract.return_photos.length} صورة
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStageContent = () => {
    switch (stage) {
      case 'draft':
        return renderDraftStage();
      case 'pending':
        return renderPendingStage();
      case 'delivery':
        return renderDeliveryStage();
      case 'payment':
        return renderPaymentStage();
      case 'return':
        return renderReturnStage();
      case 'completed':
        return renderCompletedStage();
      default:
        return renderDraftStage();
    }
  };

  return (
    <div className="space-y-6">
      {renderStageContent()}
    </div>
  );
};