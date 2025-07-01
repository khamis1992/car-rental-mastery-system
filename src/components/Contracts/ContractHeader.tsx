import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Printer, Download, Truck, CheckCircle } from 'lucide-react';

interface ContractHeaderProps {
  contract: any;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onShowDelivery: () => void;
  onShowReturn: () => void;
}

export const ContractHeader: React.FC<ContractHeaderProps> = ({
  contract,
  onPrint,
  onDownloadPDF,
  onShowDelivery,
  onShowReturn
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

  return (
    <DialogHeader>
      <div className="flex items-center justify-between">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          تفاصيل العقد - {contract.contract_number}
        </DialogTitle>
        <div className="flex items-center gap-2">
          {getStatusBadge(contract.status)}
          
          {/* Contract Actions */}
          {contract.status === 'pending' && (
            <Button variant="default" size="sm" onClick={onShowDelivery}>
              <Truck className="w-4 h-4 mr-2" />
              تسليم المركبة
            </Button>
          )}
          
          {contract.status === 'active' && (
            <Button variant="default" size="sm" onClick={onShowReturn}>
              <CheckCircle className="w-4 h-4 mr-2" />
              استلام المركبة
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            تحميل PDF
          </Button>
        </div>
      </div>
    </DialogHeader>
  );
};