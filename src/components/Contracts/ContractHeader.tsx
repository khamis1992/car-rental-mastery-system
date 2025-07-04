import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Truck, CheckCircle, CreditCard } from 'lucide-react';

interface ContractHeaderProps {
  contract: any;
  onShowDelivery: () => void;
  onShowReturn: () => void;
  onShowPayment?: () => void;
}

export const ContractHeader: React.FC<ContractHeaderProps> = ({
  contract,
  onShowDelivery,
  onShowReturn,
  onShowPayment
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
          {contract.status === 'pending' && contract.delivery_completed_at && !contract.payment_registered_at && onShowPayment && (
            <Button variant="default" size="sm" onClick={onShowPayment}>
              <CreditCard className="w-4 h-4 mr-2" />
              تسجيل الدفع
            </Button>
          )}
          
          {contract.status === 'active' && (
            <Button variant="default" size="sm" onClick={onShowReturn}>
              <CheckCircle className="w-4 h-4 mr-2" />
              استلام المركبة
            </Button>
          )}
        </div>
      </div>
    </DialogHeader>
  );
};