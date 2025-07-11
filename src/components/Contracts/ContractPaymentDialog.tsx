import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceAndPaymentForm } from '@/components/Invoicing/InvoiceAndPaymentForm';
import { useToast } from '@/hooks/use-toast';

interface ContractPaymentDialogProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ContractPaymentDialog: React.FC<ContractPaymentDialogProps> = ({
  contract,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "تم بنجاح",
      description: "تم إنشاء الفاتورة وتسجيل الدفعة بنجاح",
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            إدارة الفواتير والمدفوعات - العقد رقم {contract?.contract_number}
          </DialogTitle>
        </DialogHeader>
        
        {contract && (
          <InvoiceAndPaymentForm
            open={true}
            onOpenChange={() => {}} // Handled by parent dialog
            onSuccess={handleSuccess}
            contract={contract}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};