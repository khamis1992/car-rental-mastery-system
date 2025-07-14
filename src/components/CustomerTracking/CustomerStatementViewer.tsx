import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer } from 'lucide-react';
import type { CustomerStatement } from '@/types/customerTracking';

interface CustomerStatementViewerProps {
  statement: CustomerStatement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerStatementViewer: React.FC<CustomerStatementViewerProps> = ({
  statement,
  open,
  onOpenChange
}) => {
  if (!statement) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Downloading PDF for statement:', statement.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="rtl-title flex items-center justify-between">
            <span>كشف حساب العميل</span>
            <div className="flex items-center gap-2 flex-row-reverse">
              <Button variant="outline" size="sm" onClick={handlePrint} className="rtl-flex">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="rtl-flex">
                <Download className="w-4 h-4" />
                تحميل PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-4 print:pb-2">
            <h1 className="text-2xl font-bold print:text-xl">كشف حساب العميل</h1>
            <p className="text-muted-foreground print:text-black">
              من {new Date(statement.from_date).toLocaleDateString('ar-SA')} 
              إلى {new Date(statement.to_date).toLocaleDateString('ar-SA')}
            </p>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 print:gap-2 print:text-sm">
            <div>
              <h3 className="font-semibold mb-2">بيانات العميل</h3>
              <div className="space-y-1">
                <p><strong>رقم العميل:</strong> {statement.customer_id}</p>
                <p><strong>اسم العميل:</strong> {(statement as any).customers?.name || 'غير محدد'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ملخص الحساب</h3>
              <div className="space-y-1">
                <p><strong>الرصيد الافتتاحي:</strong> {formatAmount(statement.opening_balance)}</p>
                <p><strong>الرصيد الختامي:</strong> {formatAmount(statement.closing_balance)}</p>
                <p><strong>إجمالي المدين:</strong> {formatAmount(statement.total_debits)}</p>
                <p><strong>إجمالي الدائن:</strong> {formatAmount(statement.total_credits)}</p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div>
            <h3 className="font-semibold mb-4 print:mb-2">تفاصيل المعاملات</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right print:p-1">التاريخ</TableHead>
                  <TableHead className="text-right print:p-1">الوصف</TableHead>
                  <TableHead className="text-right print:p-1">المرجع</TableHead>
                  <TableHead className="text-right print:p-1">مدين</TableHead>
                  <TableHead className="text-right print:p-1">دائن</TableHead>
                  <TableHead className="text-right print:p-1">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.statement_data?.transactions?.map((transaction: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="print:p-1 print:text-xs">
                      {new Date(transaction.date).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="print:p-1 print:text-xs">{transaction.description}</TableCell>
                    <TableCell className="print:p-1 print:text-xs">{transaction.reference || '-'}</TableCell>
                    <TableCell className="print:p-1 print:text-xs font-mono">
                      {transaction.debit ? formatAmount(transaction.debit) : '-'}
                    </TableCell>
                    <TableCell className="print:p-1 print:text-xs font-mono">
                      {transaction.credit ? formatAmount(transaction.credit) : '-'}
                    </TableCell>
                    <TableCell className="print:p-1 print:text-xs font-mono">
                      {formatAmount(transaction.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 print:pt-2 text-center text-sm text-muted-foreground print:text-black">
            <p>تم إنشاء هذا الكشف في {new Date(statement.generated_at).toLocaleDateString('ar-SA')}</p>
            <p className="print:hidden">© 2024 نظام إدارة الحسابات</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};