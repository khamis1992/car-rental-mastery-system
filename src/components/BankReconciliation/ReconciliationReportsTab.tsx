import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Plus, Eye } from 'lucide-react';
import { BankReconciliationService } from '@/services/bankReconciliationService';
import { useToast } from '@/hooks/use-toast';
import type { BankReconciliationReport } from '@/types/bankReconciliation';

interface ReconciliationReportsTabProps {
  selectedBankAccount: string;
}

export const ReconciliationReportsTab: React.FC<ReconciliationReportsTabProps> = ({
  selectedBankAccount
}) => {
  const { toast } = useToast();
  const [reports, setReports] = useState<BankReconciliationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    reconciliation_date: new Date().toISOString().split('T')[0],
    opening_balance: 0,
    closing_balance: 0,
    book_balance: 0,
    notes: ''
  });

  // تحميل التقارير
  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await BankReconciliationService.getReconciliationReports(selectedBankAccount);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل التقارير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBankAccount) {
      loadReports();
    }
  }, [selectedBankAccount]);

  // إنشاء تقرير جديد
  const createReport = async () => {
    if (!selectedBankAccount) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار حساب بنكي",
        variant: "destructive",
      });
      return;
    }

    try {
      // حساب الفرق والرصيد المطابق
      const variance = reportFormData.closing_balance - reportFormData.book_balance;
      const reconciledBalance = reportFormData.book_balance;

      await BankReconciliationService.createReconciliationReport(
        selectedBankAccount,
        reportFormData.reconciliation_date,
        {
          ...reportFormData,
          variance_amount: variance,
          reconciled_balance: reconciledBalance,
          reconciliation_status: 'draft'
        }
      );

      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء تقرير المطابقة البنكية بنجاح",
      });

      setCreateDialogOpen(false);
      loadReports();
      
      // إعادة تعيين النموذج
      setReportFormData({
        reconciliation_date: new Date().toISOString().split('T')[0],
        opening_balance: 0,
        closing_balance: 0,
        book_balance: 0,
        notes: ''
      });

    } catch (error: any) {
      console.error('Error creating report:', error);
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error.message || "فشل في إنشاء التقرير",
        variant: "destructive",
      });
    }
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  // الحصول على تسمية الحالة
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'in_progress': return 'قيد المراجعة';
      case 'completed': return 'مكتمل';
      case 'approved': return 'معتمد';
      default: return status;
    }
  };

  // الحصول على متغير الحالة
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'completed': return 'secondary';
      case 'in_progress': return 'outline';
      case 'draft': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* عنوان وأزرار */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">تقارير المطابقة البنكية</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rtl-flex">
              <Plus className="w-4 h-4" />
              تقرير جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="rtl-title">إنشاء تقرير مطابقة بنكية</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reconciliation-date">تاريخ المطابقة</Label>
                <Input
                  id="reconciliation-date"
                  type="date"
                  value={reportFormData.reconciliation_date}
                  onChange={(e) => setReportFormData(prev => ({
                    ...prev,
                    reconciliation_date: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening-balance">الرصيد الافتتاحي</Label>
                  <Input
                    id="opening-balance"
                    type="number"
                    value={reportFormData.opening_balance}
                    onChange={(e) => setReportFormData(prev => ({
                      ...prev,
                      opening_balance: parseFloat(e.target.value) || 0
                    }))}
                    step="0.001"
                  />
                </div>

                <div>
                  <Label htmlFor="closing-balance">الرصيد الختامي</Label>
                  <Input
                    id="closing-balance"
                    type="number"
                    value={reportFormData.closing_balance}
                    onChange={(e) => setReportFormData(prev => ({
                      ...prev,
                      closing_balance: parseFloat(e.target.value) || 0
                    }))}
                    step="0.001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="book-balance">رصيد الدفاتر</Label>
                <Input
                  id="book-balance"
                  type="number"
                  value={reportFormData.book_balance}
                  onChange={(e) => setReportFormData(prev => ({
                    ...prev,
                    book_balance: parseFloat(e.target.value) || 0
                  }))}
                  step="0.001"
                />
              </div>

              <div>
                <Label htmlFor="variance">الفرق (محسوب تلقائياً)</Label>
                <Input
                  id="variance"
                  type="number"
                  value={reportFormData.closing_balance - reportFormData.book_balance}
                  disabled
                  step="0.001"
                />
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={reportFormData.notes}
                  onChange={(e) => setReportFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="ملاحظات حول المطابقة"
                />
              </div>

              <Button onClick={createReport} className="w-full rtl-flex">
                <FileText className="w-4 h-4" />
                إنشاء التقرير
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* جدول التقارير */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
                <TableHead className="text-right">الرصيد الختامي</TableHead>
                <TableHead className="text-right">رصيد الدفاتر</TableHead>
                <TableHead className="text-right">الفرق</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {new Date(report.reconciliation_date).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatAmount(report.opening_balance)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatAmount(report.closing_balance)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatAmount(report.book_balance)}
                  </TableCell>
                  <TableCell className="font-mono">
                    <span className={report.variance_amount === 0 ? 'text-success' : 'text-destructive'}>
                      {formatAmount(report.variance_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.reconciliation_status)}>
                      {getStatusLabel(report.reconciliation_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Button variant="outline" size="sm" className="rtl-flex">
                        <Eye className="w-4 h-4" />
                        عرض
                      </Button>
                      <Button variant="outline" size="sm" className="rtl-flex">
                        <Download className="w-4 h-4" />
                        تحميل
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {selectedBankAccount ? 'لا توجد تقارير مطابقة' : 'يرجى اختيار حساب بنكي'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};