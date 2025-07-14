import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Eye, Plus, Send } from 'lucide-react';
import { CustomerStatement, CustomerStatementFormData } from '@/types/customerTracking';
import { customerTrackingService } from '@/services/customerTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CustomerStatementsTab = () => {
  const [statements, setStatements] = useState<CustomerStatement[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerStatementFormData>({
    customer_id: '',
    from_date: '',
    to_date: '',
    include_payments: true,
    include_adjustments: true,
    email_to_customer: false
  });
  const [selectedStatement, setSelectedStatement] = useState<CustomerStatement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
    loadStatements();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_type, email')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('خطأ في تحميل العملاء:', error);
    }
  };

  const loadStatements = async () => {
    try {
      setLoading(true);
      const data = await customerTrackingService.getCustomerStatements();
      setStatements(data);
    } catch (error) {
      console.error('خطأ في تحميل كشوف الحسابات:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل كشوف الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStatement = async () => {
    if (!formData.customer_id || !formData.from_date || !formData.to_date) {
      toast({
        title: 'تنبيه',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const statement = await customerTrackingService.generateCustomerStatement(formData);
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء كشف الحساب بنجاح',
      });

      setIsDialogOpen(false);
      setFormData({
        customer_id: '',
        from_date: '',
        to_date: '',
        include_payments: true,
        include_adjustments: true,
        email_to_customer: false
      });
      
      loadStatements();
    } catch (error) {
      console.error('خطأ في إنشاء كشف الحساب:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء كشف الحساب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      generated: 'مُنشأ',
      sent: 'مُرسل',
      viewed: 'مُشاهد'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'generated': return 'secondary';
      case 'sent': return 'default';
      case 'viewed': return 'outline';
      default: return 'outline';
    }
  };

  const viewStatement = (statement: CustomerStatement) => {
    setSelectedStatement(statement);
    setViewerOpen(true);
  };

  const downloadStatement = (statement: CustomerStatement) => {
    // تصدير كشف الحساب كـ PDF
    console.log('تحميل كشف الحساب:', statement);
    toast({
      title: 'قريباً',
      description: 'ستتوفر ميزة تحميل كشف الحساب قريباً',
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-center rtl-flex">
            <CardTitle className="rtl-title">كشوف حسابات العملاء</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء كشف حساب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إنشاء كشف حساب جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer_id">العميل</Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => setFormData({...formData, customer_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العميل" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from_date">من تاريخ</Label>
                      <Input
                        id="from_date"
                        type="date"
                        value={formData.from_date}
                        onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="to_date">إلى تاريخ</Label>
                      <Input
                        id="to_date"
                        type="date"
                        value={formData.to_date}
                        onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl-flex">
                      <Checkbox
                        id="include_payments"
                        checked={formData.include_payments}
                        onCheckedChange={(checked) => setFormData({...formData, include_payments: !!checked})}
                      />
                      <Label htmlFor="include_payments">تضمين الدفعات</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl-flex">
                      <Checkbox
                        id="include_adjustments"
                        checked={formData.include_adjustments}
                        onCheckedChange={(checked) => setFormData({...formData, include_adjustments: !!checked})}
                      />
                      <Label htmlFor="include_adjustments">تضمين التسويات</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl-flex">
                      <Checkbox
                        id="email_to_customer"
                        checked={formData.email_to_customer}
                        onCheckedChange={(checked) => setFormData({...formData, email_to_customer: !!checked})}
                      />
                      <Label htmlFor="email_to_customer">إرسال للعميل بالبريد الإلكتروني</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={generateStatement} disabled={loading}>
                      {loading ? 'جاري الإنشاء...' : 'إنشاء كشف الحساب'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading && statements.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>جاري تحميل كشوف الحسابات...</p>
            </div>
          ) : statements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">تاريخ الكشف</TableHead>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
                    <TableHead className="text-right">الرصيد الختامي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="text-right font-medium">
                        {(statement as any).customers?.name || 'غير محدد'}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(statement.statement_date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(statement.from_date).toLocaleDateString('ar-KW')} - {' '}
                        {new Date(statement.to_date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(statement.opening_balance)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={statement.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAmount(statement.closing_balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusVariant(statement.status) as any}>
                          {getStatusLabel(statement.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewStatement(statement)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadStatement(statement)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          {statement.status === 'generated' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: "قريباً", description: "ستتوفر ميزة الإرسال قريباً" })}
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد كشوف حسابات</h3>
                <p className="text-sm">ابدأ بإنشاء أول كشف حساب للعملاء</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* عارض كشف الحساب */}
      <CustomerStatementViewer
        statement={selectedStatement}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
};