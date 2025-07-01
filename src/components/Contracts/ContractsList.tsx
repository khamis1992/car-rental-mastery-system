import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Contract {
  id: string;
  contract_number: string;
  customer_name: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  final_amount: number;
  status: string;
  contract_type: string;
  created_at: string;
  actual_start_date?: string;
  actual_end_date?: string;
}

interface ContractsListProps {
  contracts: Contract[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onActivate?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  onView,
  onEdit,
  onActivate,
  onComplete,
}) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      pending: { label: 'في الانتظار', variant: 'default' as const },
      active: { label: 'نشط', variant: 'default' as const },
      completed: { label: 'مكتمل', variant: 'outline' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getContractTypeBadge = (type: string) => {
    const typeMap = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      custom: 'مخصص',
    };

    return <Badge variant="outline">{typeMap[type as keyof typeof typeMap] || type}</Badge>;
  };

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد عقود</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء أول عقد إيجار</p>
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
          العقود ({contracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم العقد</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المركبة</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">فترة الإيجار</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>{contract.customer_name}</TableCell>
                  <TableCell>{contract.vehicle_info}</TableCell>
                  <TableCell>{getContractTypeBadge(contract.contract_type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                      <div className="text-muted-foreground">
                        إلى {format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({contract.rental_days} أيام)
                      </div>
                      {contract.status === 'active' && (
                        <div className="text-xs text-primary">
                          {contract.actual_start_date && (
                            <>بدأ: {format(new Date(contract.actual_start_date), 'dd/MM/yyyy', { locale: ar })}</>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{contract.final_amount.toFixed(3)} د.ك</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(contract.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(contract.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {(contract.status === 'draft' || contract.status === 'pending') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(contract.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}

                      {contract.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivate?.(contract.id)}
                          className="text-primary"
                        >
                          تفعيل
                        </Button>
                      )}

                      {contract.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onComplete?.(contract.id)}
                          className="text-green-600"
                        >
                          إنهاء
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};