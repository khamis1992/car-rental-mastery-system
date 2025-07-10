import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Download, Send, AlertTriangle } from 'lucide-react';

export function InvoicesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const invoices = [
    {
      id: '1',
      invoice_number: 'SAAS-000123',
      tenant_name: 'شركة التميز للتجارة',
      subscription_id: '1',
      status: 'paid',
      amount_due: 59.99,
      amount_paid: 59.99,
      amount_remaining: 0,
      currency: 'USD',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-02-01',
      due_date: '2024-01-15',
      paid_at: '2024-01-14',
      created_at: '2024-01-01'
    },
    {
      id: '2',
      invoice_number: 'SAAS-000124',
      tenant_name: 'مؤسسة الخليج للاستثمار',
      subscription_id: '2',
      status: 'open',
      amount_due: 1499.99,
      amount_paid: 0,
      amount_remaining: 1499.99,
      currency: 'USD',
      billing_period_start: '2024-01-15',
      billing_period_end: '2025-01-15',
      due_date: '2024-02-15',
      paid_at: null,
      created_at: '2024-01-15'
    },
    {
      id: '3',
      invoice_number: 'SAAS-000125',
      tenant_name: 'شركة النور للتطوير',
      subscription_id: '3',
      status: 'overdue',
      amount_due: 29.99,
      amount_paid: 0,
      amount_remaining: 29.99,
      currency: 'USD',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-02-01',
      due_date: '2024-01-15',
      paid_at: null,
      created_at: '2024-01-01'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      open: { label: 'مفتوحة', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      overdue: { label: 'متأخرة', variant: 'destructive' as const },
      uncollectible: { label: 'غير قابلة للتحصيل', variant: 'destructive' as const },
      void: { label: 'ملغاة', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAction = (action: string, invoiceId: string) => {
    toast({
      title: `تم ${action} الفاتورة`,
      description: `تم تنفيذ العملية بنجاح`,
    });
  };

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status !== 'overdue') return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفواتير</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع فواتير الاشتراكات</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في الفواتير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {invoices.filter(inv => inv.status === 'paid').length}
            </p>
            <p className="text-sm text-muted-foreground">مدفوعة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {invoices.filter(inv => inv.status === 'open').length}
            </p>
            <p className="text-sm text-muted-foreground">مفتوحة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'overdue').length}
            </p>
            <p className="text-sm text-muted-foreground">متأخرة</p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المستأجر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المبلغ المستحق</TableHead>
                <TableHead>المبلغ المدفوع</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>فترة الفوترة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{invoice.invoice_number}</span>
                      {invoice.status === 'overdue' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{invoice.tenant_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(invoice.status)}
                      {invoice.status === 'overdue' && (
                        <p className="text-xs text-red-600">
                          متأخرة {getDaysOverdue(invoice.due_date, invoice.status)} يوم
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${invoice.amount_due}</p>
                      <p className="text-sm text-muted-foreground">{invoice.currency}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${invoice.amount_paid}</p>
                      {invoice.amount_remaining > 0 && (
                        <p className="text-sm text-red-600">
                          المتبقي: ${invoice.amount_remaining}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
                      {invoice.paid_at && (
                        <p className="text-green-600">
                          دُفعت: {new Date(invoice.paid_at).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>من: {new Date(invoice.billing_period_start).toLocaleDateString('ar-SA')}</p>
                      <p>إلى: {new Date(invoice.billing_period_end).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('عرض', invoice.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('تحميل', invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {(invoice.status === 'open' || invoice.status === 'overdue') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction('إرسال تذكير', invoice.id)}
                        >
                          <Send className="h-4 w-4" />
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