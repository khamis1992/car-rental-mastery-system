import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Calendar, MapPin, HelpCircle, TrendingUp, Receipt, AlertTriangle } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisQuarter, isThisYear } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { ContractActions } from './ContractActions';
import { ContractDetailsDialog } from './ContractDetailsDialog';
import { ContractFiltersComponent, ContractFilters } from './ContractFilters';
import { CompactProgressIndicator, ContractProgressIndicator } from './ContractProgressIndicator';
import { ContractHelp } from './ContractHelp';
import { InvoiceForm } from '@/components/Invoicing/InvoiceForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { serviceContainer } from '@/services/Container/ServiceContainer';

interface Contract {
  id: string;
  contract_number: string;
  customer_name: string;
  customer_id: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  final_amount: number;
  daily_rate: number;
  status: string;
  contract_type: string;
  created_at: string;
  actual_start_date?: string;
  actual_end_date?: string;
}

interface ContractsListProps {
  contracts: Contract[];
  customers: any[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onActivate?: (id: string) => void;
  onComplete?: (id: string) => void;
  onStatusUpdate?: () => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  customers,
  onView,
  onEdit,
  onActivate,
  onComplete,
  onStatusUpdate,
}) => {
  const { toast } = useToast();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [selectedContractForInvoice, setSelectedContractForInvoice] = useState<string>('');
  const [contractInvoices, setContractInvoices] = useState<Record<string, any[]>>({});
  const [completedContractsWithoutInvoices, setCompletedContractsWithoutInvoices] = useState<string[]>([]);
  const [filters, setFilters] = useState<ContractFilters>({
    search: '',
    status: 'all',
    contractType: 'all',
    dateRange: 'all',
  });

  // جلب الفواتير لكل عقد
  React.useEffect(() => {
    const fetchContractInvoices = async () => {
      try {
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('id, contract_id, status, total_amount, outstanding_amount')
          .in('contract_id', contracts.map(c => c.id));

        if (error) throw error;

        const invoicesByContract: Record<string, any[]> = {};
        invoices?.forEach(invoice => {
          if (!invoicesByContract[invoice.contract_id]) {
            invoicesByContract[invoice.contract_id] = [];
          }
          invoicesByContract[invoice.contract_id].push(invoice);
        });

        setContractInvoices(invoicesByContract);

        // تحديد العقود المكتملة بدون فواتير
        const completedWithoutInvoices = contracts
          .filter(contract => 
            contract.status === 'completed' && 
            (!invoicesByContract[contract.id] || invoicesByContract[contract.id].length === 0)
          )
          .map(contract => contract.id);

        setCompletedContractsWithoutInvoices(completedWithoutInvoices);
      } catch (error) {
        console.error('Error fetching contract invoices:', error);
      }
    };

    if (contracts.length > 0) {
      fetchContractInvoices();
    }
  }, [contracts]);

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

  const handleCreateInvoice = (contractId: string) => {
    setSelectedContractForInvoice(contractId);
    setInvoiceFormOpen(true);
  };

  const handleInvoiceSuccess = () => {
    // إعادة جلب الفواتير بعد إنشاء فاتورة جديدة
    if (onStatusUpdate) {
      onStatusUpdate();
    }
    toast({
      title: "تم بنجاح",
      description: "تم إنشاء الفاتورة بنجاح",
    });
  };

  const getInvoiceStatus = (contractId: string) => {
    const invoices = contractInvoices[contractId] || [];
    if (invoices.length === 0) return null;
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const totalInvoices = invoices.length;
    const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
    
    if (paidInvoices === totalInvoices) {
      return { type: 'paid', label: 'مدفوعة بالكامل', color: 'text-green-600' };
    } else if (paidInvoices > 0) {
      return { type: 'partial', label: 'مدفوعة جزئياً', color: 'text-yellow-600' };
    } else if (outstandingAmount > 0) {
      return { type: 'outstanding', label: 'مستحقة', color: 'text-red-600' };
    }
    return { type: 'draft', label: 'مسودة', color: 'text-gray-600' };
  };
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
                <TableHead className="text-right">حالة الفاتورة</TableHead>
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
                    <div className="flex items-center gap-2">
                      {completedContractsWithoutInvoices.includes(contract.id) && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">بحاجة فاتورة</span>
                        </div>
                      )}
                      {(() => {
                        const invoiceStatus = getInvoiceStatus(contract.id);
                        const invoiceCount = contractInvoices[contract.id]?.length || 0;
                        
                        if (invoiceCount > 0) {
                          return (
                            <div className="text-xs">
                              <div className={`font-medium ${invoiceStatus?.color}`}>
                                {invoiceStatus?.label}
                              </div>
                              <div className="text-muted-foreground">
                                {invoiceCount} فاتورة
                              </div>
                            </div>
                          );
                        } else if (contract.status === 'completed') {
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateInvoice(contract.id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Receipt className="w-3 h-3" />
                              إنشاء فاتورة
                            </Button>
                          );
                        } else {
                          return (
                            <span className="text-xs text-muted-foreground">
                              لا توجد فاتورة
                            </span>
                          );
                        }
                      })()}
                    </div>
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
                              // تحديث محلي فوري - لا حاجة لإعادة تحميل البيانات
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
                             // تحديث محلي فوري
                             if (onStatusUpdate) {
                               onStatusUpdate();
                             }
                           }}
                        />
                        
                        {contractInvoices[contract.id]?.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateInvoice(contract.id)}
                            className="flex items-center gap-1"
                          >
                            <Receipt className="w-4 h-4" />
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

      <ContractDetailsDialog
        contractId={selectedContractId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
          onDataUpdate={() => {
            // لا نحتاج لإعادة تحميل، فقط إظهار رسالة نجاح
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          }}
      />

      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSuccess={handleInvoiceSuccess}
        contracts={contracts}
        customers={customers}
        preselectedContractId={selectedContractForInvoice}
      />
    </div>
  );
};