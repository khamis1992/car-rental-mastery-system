import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, FileText, Calendar, DollarSign } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">عرض سعر تأجير مركبة</h1>
            <p className="text-xl opacity-90">رقم العرض: {quotation.quotation_number}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Alert */}
        {hasResponded && (
          <Card className={`mb-6 ${quotation.status === 'accepted' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {quotation.status === 'accepted' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {quotation.status === 'accepted' ? 'تم قبول العرض' : 'تم رفض العرض'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    في {format(new Date(quotation.client_response_at!), 'dd/MM/yyyy HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiry Warning */}
        {isExpired && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-yellow-600" />
                <p className="text-yellow-800">
                  انتهت صلاحية هذا العرض في {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات العميل */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>الاسم:</strong> {quotation.customers?.name || 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> {quotation.customers?.phone || 'غير محدد'}</p>
              </div>
              <div>
                {quotation.customers?.email && (
                  <p><strong>البريد الإلكتروني:</strong> {quotation.customers.email}</p>
                )}
                {quotation.customers?.address && (
                  <p><strong>العنوان:</strong> {quotation.customers.address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات المركبة */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>معلومات المركبة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>الماركة والموديل:</strong> {quotation.vehicles?.make || 'غير محدد'} {quotation.vehicles?.model || ''}</p>
                <p><strong>سنة الصنع:</strong> {quotation.vehicles?.year || 'غير محدد'}</p>
              </div>
              <div>
                <p><strong>رقم اللوحة:</strong> {quotation.vehicles?.license_plate || 'غير محدد'}</p>
                <p><strong>رقم المركبة:</strong> {quotation.vehicles?.vehicle_number || 'غير محدد'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل الإيجار */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تفاصيل الإيجار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <CardHeader>
            <CardTitle>التكلفة التفصيلية</CardTitle>
          </CardHeader>
          <CardContent>
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
            <CardHeader>
              <CardTitle>الشروط والأحكام</CardTitle>
            </CardHeader>
            <CardContent>
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

        {/* أزرار الاستجابة */}
        {canRespond && !hasResponded && (
          <Card>
            <CardHeader>
              <CardTitle>استجابة العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ملاحظات (اختيارية)
                  </label>
                  <Textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="أضف أي ملاحظات أو استفسارات هنا..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleResponse('accept', clientNotes)}
                    disabled={responding}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    قبول العرض
                  </Button>
                  
                  <Button
                    onClick={() => handleResponse('reject', clientNotes)}
                    disabled={responding}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    رفض العرض
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات إضافية */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>صالح حتى: {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}</p>
          {quotation.client_viewed_at && (
            <p>تم عرضه في: {format(new Date(quotation.client_viewed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQuotation;