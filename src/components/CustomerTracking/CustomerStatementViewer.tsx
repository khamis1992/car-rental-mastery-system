import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomerStatement } from '@/types/customerTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    return `د.ك ${amount.toFixed(3)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>كشف حساب العميل</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6" dir="rtl">
          {/* معلومات العميل */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">اسم العميل:</span> {(statement as any).customers?.name || 'غير محدد'}
                </div>
                <div>
                  <span className="font-medium">فترة الكشف:</span> {' '}
                  {new Date(statement.from_date).toLocaleDateString('ar-KW')} - {' '}
                  {new Date(statement.to_date).toLocaleDateString('ar-KW')}
                </div>
                <div>
                  <span className="font-medium">الرصيد الافتتاحي:</span> {formatAmount(statement.opening_balance)}
                </div>
                <div>
                  <span className="font-medium">الرصيد الختامي:</span> {formatAmount(statement.closing_balance)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل المعاملات */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المعاملات</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">مدين</TableHead>
                    <TableHead className="text-right">دائن</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.statement_data && Array.isArray(statement.statement_data) ? 
                    statement.statement_data.map((detail: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-right">
                          {new Date(detail.transaction_date).toLocaleDateString('ar-KW')}
                        </TableCell>
                        <TableCell className="text-right">{detail.description}</TableCell>
                        <TableCell className="text-right">{detail.debit ? formatAmount(detail.debit) : '-'}</TableCell>
                        <TableCell className="text-right">{detail.credit ? formatAmount(detail.credit) : '-'}</TableCell>
                        <TableCell className="text-right">{formatAmount(detail.balance)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">لا توجد تفاصيل متاحة</TableCell>
                      </TableRow>
                    )
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};