import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Calendar, MapPin, HelpCircle, TrendingUp } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisQuarter, isThisYear } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ContractActions } from './ContractActions';
import { ContractDetailsDialog } from './ContractDetailsDialog';
import { ContractFiltersComponent, ContractFilters } from './ContractFilters';
import { CompactProgressIndicator, ContractProgressIndicator } from './ContractProgressIndicator';
import { ContractHelp } from './ContractHelp';
import { useToast } from '@/hooks/use-toast';

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
  onStatusUpdate?: () => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  onView,
  onEdit,
  onActivate,
  onComplete,
  onStatusUpdate,
}) => {
  const { toast } = useToast();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ContractFilters>({
    search: '',
    status: 'all',
    contractType: 'all',
    dateRange: 'all',
  });

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // البحث في النص
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = 
          contract.contract_number.toLowerCase().includes(searchLower) ||
          contract.customer_name.toLowerCase().includes(searchLower) ||
          contract.vehicle_info.toLowerCase().includes(searchLower);
        if (!searchMatch) return false;
      }

      // فلتر الحالة
      if (filters.status && filters.status !== 'all' && contract.status !== filters.status) return false;

      // فلتر نوع العقد
      if (filters.contractType && filters.contractType !== 'all' && contract.contract_type !== filters.contractType) return false;

      // فلتر الفترة الزمنية
      if (filters.dateRange && filters.dateRange !== 'all') {
        const contractDate = new Date(contract.created_at);
        switch (filters.dateRange) {
          case 'today':
            if (!isToday(contractDate)) return false;
            break;
          case 'week':
            if (!isThisWeek(contractDate)) return false;
            break;
          case 'month':
            if (!isThisMonth(contractDate)) return false;
            break;
          case 'quarter':
            if (!isThisQuarter(contractDate)) return false;
            break;
          case 'year':
            if (!isThisYear(contractDate)) return false;
            break;
        }
      }

      return true;
    });
  }, [contracts, filters]);
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
    <div className="space-y-4">
      <ContractFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ search: '', status: 'all', contractType: 'all', dateRange: 'all' })}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              العقود ({filteredContracts.length} من {contracts.length})
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                تقارير
              </Button>
              <ContractHelp />
            </div>
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
                <TableHead className="text-right">التقدم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
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
                     <ContractProgressIndicator
                       currentStatus={contract.status}
                       showLabels={false}
                       size="sm"
                       interactive={true}
                       contractData={{
                         id: contract.id,
                         status: contract.status,
                         contract_number: contract.contract_number,
                         customer_name: contract.customer_name,
                         vehicle_info: contract.vehicle_info
                       }}
                         onStatusUpdate={() => {
                           toast({
                             title: "تم التحديث",
                             description: "تم تحديث حالة العقد بنجاح",
                           });
                           if (onStatusUpdate) {
                             onStatusUpdate();
                           }
                         }}
                     />
                   </TableCell>
                  <TableCell>
                    {getStatusBadge(contract.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContractId(contract.id);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <ContractActions
                        contract={{
                          id: contract.id,
                          status: contract.status,
                          contract_number: contract.contract_number,
                          customer_name: contract.customer_name,
                          vehicle_info: contract.vehicle_info,
                         }}
                         onUpdate={() => {
                           if (onStatusUpdate) {
                             onStatusUpdate();
                           }
                         }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      </Card>

      <ContractDetailsDialog
        contractId={selectedContractId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
};