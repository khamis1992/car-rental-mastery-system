import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Car, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  Printer,
  Share2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuotationData {
  id: string;
  quotation_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  status: string;
  valid_until: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  created_at: string;
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
  public_link_expires_at: string;
  client_viewed_at?: string;
  client_response_at?: string;
}

const PublicQuotation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadQuotation();
    }
  }, [token]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات العرض باستخدام الرمز المميز
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customers(name, phone, email, address),
          vehicles(make, model, year, license_plate, vehicle_number)
        `)
        .eq('public_token', token)
        .single();

      if (error || !data) {
        setError('عرض السعر غير موجود أو انتهت صلاحية الرابط');
        return;
      }

      // التحقق من انتهاء صلاحية الرابط
      if (new Date(data.public_link_expires_at) < new Date()) {
        setError('انتهت صلاحية الرابط');
        return;
      }

      setQuotation(data);

      // تسجيل المشاهدة إذا لم تكن مسجلة من قبل
      if (!data.client_viewed_at) {
        await handleResponse('view');
      }

    } catch (err: any) {
      setError('حدث خطأ في تحميل عرض السعر');
      console.error('Error loading quotation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: 'accept' | 'reject' | 'view', notes?: string) => {
    try {
      setResponding(true);

      const response = await supabase.functions.invoke('public-quotation-response', {
        body: {
          token,
          action,
          client_notes: notes || clientNotes,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.success) {
        setQuotation(result.quotation);
        
        if (action !== 'view') {
          toast({
            title: 'تم بنجاح',
            description: result.message,
          });
        }
      } else {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }

    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'حدث خطأ في معالجة الطلب',
        variant: 'destructive',
      });
    } finally {
      setResponding(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `عرض سعر ${quotation?.quotation_number}`,
          text: 'عرض سعر تأجير مركبة',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'تم النسخ',
          description: 'تم نسخ رابط العرض إلى الحافظة',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-KW', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">خطأ</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(quotation.valid_until) < new Date();
  const canRespond = quotation.status === 'sent' && !isExpired;
  const hasResponded = quotation.client_response_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20" dir="rtl">
      {/* Header محسن */}
      <div className="bg-gradient-primary text-primary-foreground py-12 shadow-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-8 h-8" />
              <h1 className="text-4xl font-bold">عرض سعر تأجير مركبة</h1>
            </div>
            <p className="text-xl opacity-90">رقم العرض: {quotation.quotation_number}</p>
            <p className="text-sm opacity-75 mt-2">
              عرض سعر تم إنشاؤه بتاريخ {format(new Date(quotation.created_at), 'dd/MM/yyyy', { locale: ar })}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* أزرار الطباعة والمشاركة */}
        <div className="flex justify-center gap-4 mb-6 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة العرض
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            مشاركة العرض
          </Button>
        </div>

        {/* Status Alert محسن */}
        {hasResponded && (
          <Card className={`mb-6 shadow-lg ${
            quotation.status === 'accepted' 
              ? 'border-green-200 bg-green-50/80' 
              : 'border-red-200 bg-red-50/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {quotation.status === 'accepted' ? (
                  <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-full">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-green-700">
                    {quotation.status === 'accepted' ? '✅ تم قبول العرض' : '❌ تم رفض العرض'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    في {format(new Date(quotation.client_response_at!), 'dd/MM/yyyy HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* تنبيه انتهاء الصلاحية محسن */}
        {isExpired && (
          <Card className="mb-6 border-yellow-300 bg-yellow-50/80 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-600 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-800">⏰ انتهت صلاحية العرض</p>
                  <p className="text-sm text-yellow-700">
                    انتهت الصلاحية في {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid لعمودين في الشاشات الواسعة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* العمود الأول */}
          <div className="space-y-6">
            {/* معلومات العميل محسنة */}
            <Card className="card-elegant hover-scale">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-semibold">{quotation.customers?.name || 'غير محدد'}</p>
                </div>
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-semibold">{quotation.customers?.phone || 'غير محدد'}</p>
                </div>
                {quotation.customers?.email && (
                  <div className="p-4 border-b border-muted">
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-semibold">{quotation.customers.email}</p>
                  </div>
                )}
                {quotation.customers?.address && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-semibold">{quotation.customers.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات المركبة محسنة */}
            <Card className="card-elegant hover-scale">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  معلومات المركبة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">الماركة والموديل</p>
                  <p className="font-semibold">
                    {quotation.vehicles?.make || 'غير محدد'} {quotation.vehicles?.model || ''}
                  </p>
                </div>
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">سنة الصنع</p>
                  <p className="font-semibold">{quotation.vehicles?.year || 'غير محدد'}</p>
                </div>
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">رقم اللوحة</p>
                  <p className="font-semibold">{quotation.vehicles?.license_plate || 'غير محدد'}</p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">رقم المركبة</p>
                  <p className="font-semibold">{quotation.vehicles?.vehicle_number || 'غير محدد'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* العمود الثاني */}
          <div className="space-y-6">
            {/* تفاصيل الإيجار محسنة */}
            <Card className="card-elegant hover-scale">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  تفاصيل الإيجار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                  <p className="font-semibold">
                    {format(new Date(quotation.start_date), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                  <p className="font-semibold">
                    {format(new Date(quotation.end_date), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
                <div className="p-4 border-b border-muted">
                  <p className="text-sm text-muted-foreground">عدد الأيام</p>
                  <p className="font-semibold">{quotation.rental_days} أيام</p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">السعر اليومي</p>
                  <p className="font-semibold text-primary text-right">
                    {formatNumber(quotation.daily_rate)} د.ك
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* التكلفة التفصيلية محسنة */}
            <Card className="card-elegant hover-scale">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  التكلفة التفصيلية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border-b border-muted">
                  <span className="text-sm">
                    المجموع الفرعي ({quotation.rental_days} أيام × {formatNumber(quotation.daily_rate)} د.ك)
                  </span>
                  <span className="font-semibold text-right">{formatNumber(quotation.total_amount)} د.ك</span>
                </div>
                
                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between items-center p-4 border-b border-muted text-green-600">
                    <span className="text-sm">الخصم</span>
                    <span className="font-semibold text-right">- {formatNumber(quotation.discount_amount)} د.ك</span>
                  </div>
                )}
                
                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between items-center p-4 border-b border-muted">
                    <span className="text-sm">الضريبة</span>
                    <span className="font-semibold text-right">+ {formatNumber(quotation.tax_amount)} د.ك</span>
                  </div>
                )}
                
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">المجموع الإجمالي</span>
                    <span className="text-2xl font-bold text-primary text-right">
                      {formatNumber(quotation.final_amount)} د.ك
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الشروط والأحكام محسنة */}
        {(quotation.special_conditions || quotation.terms_and_conditions) && (
          <Card className="mt-6 card-elegant hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                الشروط والأحكام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quotation.special_conditions && (
                <div className="p-6 bg-muted/50 rounded-lg border border-muted">
                  <h4 className="font-bold mb-3 text-primary">شروط خاصة:</h4>
                  <p className="text-sm leading-relaxed">{quotation.special_conditions}</p>
                </div>
              )}
              
              {quotation.terms_and_conditions && (
                <div className="p-6 bg-muted/50 rounded-lg border border-muted">
                  <h4 className="font-bold mb-3 text-primary">الشروط والأحكام العامة:</h4>
                  <p className="text-sm leading-relaxed">{quotation.terms_and_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ملاحظة مهمة */}
        <Card className="mt-6 border-amber-200 bg-amber-50/80">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-500 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 mb-2">ملاحظة مهمة</h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  العميل مسؤول عن إعادة المركبة بنفس حالة التسليم. أي أضرار أو تغييرات ستكون على عاتق العميل.
                  يجب الالتزام بجميع قوانين المرور والسلامة أثناء فترة الإيجار.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أزرار الاستجابة محسنة */}
        {canRespond && !hasResponded && (
          <Card className="mt-6 card-elegant">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-center">استجابة العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ملاحظات (اختيارية)
                  </label>
                  <Textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="أضف أي ملاحظات أو استفسارات هنا..."
                    rows={4}
                    className="text-right"
                  />
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleResponse('accept', clientNotes)}
                    disabled={responding}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5 ml-2" />
                    قبول العرض
                  </Button>
                  
                  <Button
                    onClick={() => handleResponse('reject', clientNotes)}
                    disabled={responding}
                    variant="destructive"
                    className="px-8 py-3 text-lg"
                    size="lg"
                  >
                    <XCircle className="w-5 h-5 ml-2" />
                    رفض العرض
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات صلاحية العرض */}
        <div className="mt-8 text-center">
          <Badge variant={isExpired ? "destructive" : "secondary"} className="text-lg px-6 py-2">
            <Clock className="w-4 h-4 ml-2" />
            {isExpired ? "انتهت الصلاحية" : "صالح حتى"}: {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
          </Badge>
          
          {quotation.client_viewed_at && (
            <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              تم عرضه في: {format(new Date(quotation.client_viewed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQuotation;