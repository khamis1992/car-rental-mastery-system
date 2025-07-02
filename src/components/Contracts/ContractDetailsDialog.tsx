import React, { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { contractService } from '@/services/contractService';
import { ContractPrintTemplate } from './ContractPrintTemplate';
import { ElectronicSignature } from './ElectronicSignature';
import { ContractDeliveryForm } from './ContractDeliveryForm';
import { ContractReturnForm } from './ContractReturnForm';
import { ContractPaymentForm } from './ContractPaymentForm';
import { ContractHeader } from './ContractHeader';
import { ContractInfoSections } from './ContractInfoSections';
import { ContractSignatureSection } from './ContractSignatureSection';
import { ContractPDFPreview } from './ContractPDFPreview';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadContractPDF } from '@/lib/contract/contractPDFService';

interface ContractDetailsDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({
  contractId,
  open,
  onOpenChange,
}) => {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintTemplate, setShowPrintTemplate] = useState(false);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const [showCompanySignature, setShowCompanySignature] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (contractId && open) {
      loadContract();
    }
  }, [contractId, open]);

  const loadContract = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      const data = await contractService.getContractById(contractId);
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintTemplate(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;
    
    // إذا كان هناك صور، اعرض معاينة التخصيص
    const hasPhotos = (contract.pickup_photos && contract.pickup_photos.length > 0) || 
                     (contract.return_photos && contract.return_photos.length > 0);
    
    if (hasPhotos) {
      setShowPDFPreview(true);
    } else {
      // تحميل PDF بسيط بدون صور
      try {
        toast({
          title: "جاري إنشاء PDF...",
          description: "يرجى الانتظار أثناء إنشاء ملف PDF",
        });

        await downloadContractPDF(
          contract, 
          `contract_${contract.contract_number}.pdf`,
          {},
          (step, progress) => {
            toast({
              title: "جاري المعالجة",
              description: `${step} - ${progress}%`,
            });
          }
        );
        
        toast({
          title: "تم بنجاح",
          description: "تم تحميل ملف PDF بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء ملف PDF",
          variant: "destructive",
        });
      }
    }
  };

  const handleSignatureSaved = async (signature: string, type: 'customer' | 'company') => {
    try {
      const updateData: any = type === 'customer' 
        ? { 
            customer_signature: signature,
            customer_signed_at: new Date().toISOString()
          }
        : { 
            company_signature: signature,
            company_signed_at: new Date().toISOString()
          };

      // Check if this completes the signing process
      const hasCustomerSignature = type === 'customer' || contract.customer_signature;
      const hasCompanySignature = type === 'company' || contract.company_signature;

      // If both signatures are now present and status is draft, move to pending
      if (hasCustomerSignature && hasCompanySignature && contract.status === 'draft') {
        updateData.status = 'pending';
      }

      const { error } = await supabase
        .from('contracts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;

      loadContract();
      
      const statusMessage = updateData.status === 'pending' 
        ? ' وتم تحديث حالة العقد إلى "في انتظار التسليم"'
        : '';
      
      toast({
        title: "تم بنجاح",
        description: `تم حفظ ${type === 'customer' ? 'توقيع العميل' : 'توقيع الشركة'} بنجاح${statusMessage}`,
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التوقيع",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ContractHeader
          contract={contract}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onShowDelivery={() => setShowDeliveryForm(true)}
          onShowReturn={() => setShowReturnForm(true)}
          onShowPayment={() => setShowPaymentForm(true)}
        />

        <ContractInfoSections contract={contract} />

        <ContractSignatureSection
          contract={contract}
          onShowCustomerSignature={() => setShowCustomerSignature(true)}
          onShowCompanySignature={() => setShowCompanySignature(true)}
        />

        {/* Print Template */}
        {showPrintTemplate && (
          <div className="hidden print:block">
            <ContractPrintTemplate contract={contract} />
          </div>
        )}

        {/* Electronic Signature Dialogs */}
        <ElectronicSignature
          open={showCustomerSignature}
          onOpenChange={setShowCustomerSignature}
          title="توقيع العميل"
          contractId={contract.contract_number}
          signatureType="customer"
          onSignatureSaved={(signature) => handleSignatureSaved(signature, 'customer')}
        />

        <ElectronicSignature
          open={showCompanySignature}
          onOpenChange={setShowCompanySignature}
          title="توقيع الشركة"
          contractId={contract.contract_number}
          signatureType="company"
          onSignatureSaved={(signature) => handleSignatureSaved(signature, 'company')}
        />

        {/* Delivery and Return Forms */}
        <ContractDeliveryForm
          contract={contract}
          open={showDeliveryForm}
          onOpenChange={setShowDeliveryForm}
          onSuccess={loadContract}
        />

        <ContractReturnForm
          contract={contract}
          open={showReturnForm}
          onOpenChange={setShowReturnForm}
          onSuccess={loadContract}
        />

        {/* Payment Form */}
        <ContractPaymentForm
          contract={contract}
          open={showPaymentForm}
          onOpenChange={setShowPaymentForm}
          onSuccess={loadContract}
        />

        {/* PDF Preview */}
        <ContractPDFPreview
          contract={contract}
          open={showPDFPreview}
          onOpenChange={setShowPDFPreview}
        />
      </DialogContent>
    </Dialog>
  );
};