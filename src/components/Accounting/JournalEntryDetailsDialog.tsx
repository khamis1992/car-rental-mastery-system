
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { JournalEntryStatusBadge } from './JournalEntryStatusBadge';
import { JournalEntrySourceBadge } from './JournalEntrySourceBadge';
import { CalendarIcon, User, Building2, FileText, Calculator } from 'lucide-react';

interface JournalEntryLine {
  id: string;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_name?: string;
}

interface JournalEntryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: {
    id: string;
    entry_number: string;
    entry_date: string;
    description: string;
    total_debit: number;
    total_credit: number;
    status: string;
    reference_type?: string;
    reference_id?: string;
    created_by?: string;
    created_at: string;
    posted_at?: string;
    posted_by?: string;
    lines: JournalEntryLine[];
  };
}

export const JournalEntryDetailsDialog: React.FC<JournalEntryDetailsDialogProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  if (!entry) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-KW');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2">
            <FileText className="w-5 h-5" />
            تفاصيل القيد المحاسبي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entry Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">معلومات القيد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">رقم القيد:</span>
                    <Badge variant="outline" className="font-mono">
                      {entry.entry_number}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">تاريخ القيد:</span>
                    <span className="text-sm">{formatDate(entry.entry_date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
                    <JournalEntryStatusBadge status={entry.status as any} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">المصدر:</span>
                    <JournalEntrySourceBadge referenceType={entry.reference_type} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">إجمالي المدين:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(entry.total_debit)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">إجمالي الدائن:</span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(entry.total_credit)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء:</span>
                    <span className="text-sm">{formatDateTime(entry.created_at)}</span>
                  </div>

                  {entry.posted_at && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">تاريخ الترحيل:</span>
                      <span className="text-sm">{formatDateTime(entry.posted_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <span className="text-sm font-medium text-muted-foreground">الوصف:</span>
                <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                  {entry.description}
                </p>
              </div>

              {entry.reference_id && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-muted-foreground">رقم المرجع:</span>
                  <Badge variant="outline" className="mr-2 font-mono">
                    {entry.reference_id}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entry Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title text-lg">بنود القيد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entry.lines.map((line, index) => (
                  <div key={line.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          بند {index + 1}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          {line.account_code}
                        </span>
                        <span className="font-medium text-sm">
                          {line.account_name}
                        </span>
                      </div>
                      
                      {line.cost_center_name && (
                        <Badge variant="secondary" className="rtl-flex text-xs">
                          <Building2 className="w-3 h-3" />
                          {line.cost_center_name}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {line.description}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">مدين</div>
                          <div className="text-sm font-semibold text-green-600">
                            {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">دائن</div>
                          <div className="text-sm font-semibold text-red-600">
                            {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">الإجماليات:</span>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">مجموع المدين</div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(entry.total_debit)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">مجموع الدائن</div>
                    <div className="font-bold text-red-600">
                      {formatCurrency(entry.total_credit)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
