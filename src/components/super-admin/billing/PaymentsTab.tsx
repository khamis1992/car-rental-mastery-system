import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export function PaymentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const payments = [
    {
      id: '1',
      invoice_number: 'SAAS-000123',
      tenant_name: 'شركة التميز للتجارة',
      subscription_id: '1',
      stripe_payment_intent_id: 'pi_1234567890',
      amount: 59.99,
      currency: 'USD',
      status: 'succeeded',
      payment_method: 'card',
      paid_at: '2024-01-14T10:30:00Z',
      failure_reason: null,
      created_at: '2024-01-14T10:25:00Z'
    },
    {
      id: '2',
      invoice_number: 'SAAS-000124',
      tenant_name: 'مؤسسة الخليج للاستثمار',
      subscription_id: '2',
      stripe_payment_intent_id: 'pi_1234567891',
      amount: 1499.99,
      currency: 'USD',
      status: 'processing',
      payment_method: 'bank_transfer',
      paid_at: null,
      failure_reason: null,
      created_at: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      invoice_number: 'SAAS-000125',
      tenant_name: 'شركة النور للتطوير',
      subscription_id: '3',
      stripe_payment_intent_id: 'pi_1234567892',
      amount: 29.99,
      currency: 'USD',
      status: 'failed',
      payment_method: 'card',
      paid_at: null,
      failure_reason: 'insufficient_funds',
      created_at: '2024-01-16T14:20:00Z'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: 'قيد المعالجة', variant: 'secondary' as const, icon: RefreshCw },
      succeeded: { label: 'نجحت', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'فشلت', variant: 'destructive' as const, icon: AlertCircle },
      canceled: { label: 'ملغاة', variant: 'outline' as const, icon: AlertCircle },
      requires_action: { label: 'تحتاج إجراء', variant: 'secondary' as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      icon: AlertCircle 
    };
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <IconComponent className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      card: 'بطاقة ائتمان',
      bank_transfer: 'تحويل بنكي',
      paypal: 'PayPal',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay'
    };
    
    return methods[method as keyof typeof methods] || method;
  };

  const getFailureReasonLabel = (reason: string | null) => {
    if (!reason) return null;
    
    const reasons = {
      insufficient_funds: 'رصيد غير كافي',
      card_declined: 'البطاقة مرفوضة',
      expired_card: 'البطاقة منتهية الصلاحية',
      invalid_cvc: 'رمز التحقق خاطئ',
      processing_error: 'خطأ في المعالجة',
      authentication_required: 'مطلوب تحقق إضافي'
    };
    
    return reasons[reason as keyof typeof reasons] || reason;
  };

  const handleAction = (action: string, paymentId: string) => {
    toast({
      title: `تم ${action} المدفوعة`,
      description: `تم تنفيذ العملية بنجاح`,
    });
  };

  const filteredPayments = payments.filter(payment =>
    payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripe_payment_intent_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = payments.reduce((sum, payment) => 
    payment.status === 'succeeded' ? sum + payment.amount : sum, 0
  );

  const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;
  const processingPayments = payments.filter(p => p.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المدفوعات</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع مدفوعات الاشتراكات</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في المدفوعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{successfulPayments}</p>
            <p className="text-sm text-muted-foreground">ناجحة</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{processingPayments}</p>
            <p className="text-sm text-muted-foreground">قيد المعالجة</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
            <p className="text-sm text-muted-foreground">فاشلة</p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المستأجر</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الدفع</TableHead>
                <TableHead>معرف Stripe</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="font-medium">{payment.invoice_number}</span>
                  </TableCell>
                  <TableCell>{payment.tenant_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-muted-foreground">{payment.currency}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(payment.status)}
                      {payment.failure_reason && (
                        <p className="text-xs text-red-600">
                          {getFailureReasonLabel(payment.failure_reason)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {payment.paid_at ? (
                        <div>
                          <p>{new Date(payment.paid_at).toLocaleDateString('ar-SA')}</p>
                          <p className="text-muted-foreground">
                            {new Date(payment.paid_at).toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">لم يتم الدفع</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      <p>{payment.stripe_payment_intent_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('عرض', payment.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction('إعادة المحاولة', payment.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}