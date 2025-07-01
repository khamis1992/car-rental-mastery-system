import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  final_amount: number;
  status: string;
  valid_until: string;
  created_at: string;
}

interface QuotationsListProps {
  quotations: Quotation[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onConvertToContract?: (id: string) => void;
}

export const QuotationsList: React.FC<QuotationsListProps> = ({
  quotations,
  onView,
  onEdit,
  onDelete,
  onConvertToContract,
}) => {
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      sent: { label: 'مرسل', variant: 'default' as const },
      accepted: { label: 'مقبول', variant: 'default' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const },
      expired: { label: 'منتهي الصلاحية', variant: 'outline' as const },
      converted: { label: 'تم التحويل لعقد', variant: 'default' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد عروض أسعار</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء أول عرض سعر</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          عروض الأسعار ({quotations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم العرض</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المركبة</TableHead>
                <TableHead className="text-right">فترة الإيجار</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">صالح حتى</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quotation) => {
                const expired = isExpired(quotation.valid_until);
                return (
                  <TableRow key={quotation.id} className={expired ? 'opacity-75' : ''}>
                    <TableCell className="font-medium">
                      {quotation.quotation_number}
                    </TableCell>
                    <TableCell>{quotation.customer_name}</TableCell>
                    <TableCell>{quotation.vehicle_info}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(quotation.start_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                        <div className="text-muted-foreground">
                          إلى {format(new Date(quotation.end_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({quotation.rental_days} أيام)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{quotation.final_amount.toFixed(3)} د.ك</div>
                    </TableCell>
                    <TableCell>
                      {expired && quotation.status !== 'converted' ? 
                        getStatusBadge('expired') : 
                        getStatusBadge(quotation.status)
                      }
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${expired ? 'text-destructive' : ''}`}>
                        {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView?.(quotation.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {quotation.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit?.(quotation.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {(quotation.status === 'accepted' || quotation.status === 'sent') && !expired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConvertToContract?.(quotation.id)}
                            className="text-primary"
                          >
                            تحويل لعقد
                          </Button>
                        )}

                        {quotation.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(quotation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};