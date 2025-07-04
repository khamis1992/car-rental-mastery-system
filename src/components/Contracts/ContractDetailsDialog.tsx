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
import { ContractStageNavigation } from './ContractStageNavigation';
import { ContractStageContent } from './ContractStageContent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadContractPDF } from '@/lib/contract/contractPDFService';

interface ContractDetailsDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate?: () => void; // Add callback for data updates
}

export const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({
  contractId,
  open,
  onOpenChange,
  onDataUpdate,
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
  const [currentStage, setCurrentStage] = useState<string>('draft');
  const { toast } = useToast();

  React.useEffect(() => {
    if (contractId && open) {
      loadContract();
    }
  }, [contractId, open]);

  React.useEffect(() => {
    if (contract) {
      console.log('🔄 ContractDetailsDialog: Contract updated, determining stage');
      
      // Auto-determine current stage based on contract status and timestamps
      let determinedStage = 'draft';
      
      if (contract.status === 'draft') {
        determinedStage = 'draft';
      } else if (contract.status === 'pending' && (!contract.customer_signature || !contract.company_signature)) {
        determinedStage = 'pending';
      } else if ((contract.customer_signature && contract.company_signature) && !contract.delivery_completed_at) {
        // Both signatures completed but vehicle not yet delivered
        determinedStage = 'delivery';
      } else if (contract.delivery_completed_at && !contract.payment_registered_at) {
        // Vehicle has been delivered but payment not registered
        determinedStage = 'payment';
      } else if (contract.payment_registered_at && !contract.actual_end_date) {
        // Payment registered but vehicle not yet returned
        determinedStage = 'return';
      } else if (contract.actual_end_date && contract.status !== 'completed') {
        // Vehicle has been returned but contract not completed
        determinedStage = 'completed';
      } else if (contract.status === 'completed') {
        determinedStage = 'completed';
      } else {
        // Fallback based on status
        determinedStage = contract.status === 'active' ? 'return' : 'draft';
      }
      
      console.log('📍 ContractDetailsDialog: Determined stage:', determinedStage, 'from contract:', {
        status: contract.status,
        customer_signature: !!contract.customer_signature,
        company_signature: !!contract.company_signature,
        delivery_completed_at: !!contract.delivery_completed_at,
        payment_registered_at: !!contract.payment_registered_at,
        actual_end_date: !!contract.actual_end_date
      });
      
      // Force update current stage
      if (currentStage !== determinedStage) {
        console.log('🎯 ContractDetailsDialog: Updating stage from', currentStage, 'to', determinedStage);
        setCurrentStage(determinedStage);
      }
    }
  }, [contract, contract?.status, contract?.delivery_completed_at, contract?.payment_registered_at, contract?.actual_end_date]);

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

  const handleAdvanceToNextStage = async () => {
    if (!contract) return;
    
    try {
      let updateData: any = {};
      let successMessage = '';

      if (contract.status === 'draft') {
        // Advance from draft to pending
        updateData.status = 'pending';
        successMessage = 'تم الانتقال إلى مرحلة التوقيع';
      } else if (contract.status === 'pending' && contract.customer_signature && contract.company_signature && !contract.delivery_completed_at) {
        // Advance from pending (with both signatures) to delivery stage
        setCurrentStage('delivery');
        toast({
          title: "تم بنجاح",
          description: "تم الانتقال إلى مرحلة التسليم",
        });
        return;
      } else if (contract.delivery_completed_at && !contract.payment_registered_at) {
        // Advance from delivery to payment stage
        setCurrentStage('payment');
        toast({
          title: "تم بنجاح",
          description: "تم الانتقال إلى مرحلة الدفع",
        });
        return;
      } else if (contract.payment_registered_at && contract.status === 'active' && !contract.actual_end_date) {
        // Advance from payment to return stage
        setCurrentStage('return');
        toast({
          title: "تم بنجاح",
          description: "تم الانتقال إلى مرحلة الاستلام",
        });
        return;
      } else if (contract.actual_end_date && contract.status !== 'completed') {
        // Advance from return to completed
        updateData.status = 'completed';
        successMessage = 'تم إنهاء العقد بنجاح';
      } else {
        throw new Error('Cannot advance to next stage');
      }

      // Update contract status for transitions that require database update
      await contractService.updateContractStatus(contract.id, updateData.status);
      await loadContract(); // Reload to get updated data
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      toast({
        title: "تم بنجاح",
        description: successMessage,
      });
    } catch (error) {
      console.error('Error advancing to next stage:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الانتقال للمرحلة التالية",
        variant: "destructive",
      });
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

      // تحديث محلي فوري (optimistic update)
      const updatedContract = { ...contract, ...updateData };
      
      // Check if this completes the signing process
      const hasCustomerSignature = type === 'customer' || contract.customer_signature;
      const hasCompanySignature = type === 'company' || contract.company_signature;

      // If both signatures are now present and status is draft, move to pending
      if (hasCustomerSignature && hasCompanySignature && contract.status === 'draft') {
        updateData.status = 'pending';
        updatedContract.status = 'pending';
      }

      // تحديث فوري للحالة المحلية
      setContract(updatedContract);

      const { error } = await supabase
        .from('contracts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;

      // تحديث البيانات الفعلية
      await loadContract();
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      const statusMessage = updateData.status === 'pending' 
        ? ' وتم تحديث حالة العقد إلى "في انتظار التسليم"'
        : '';
      
      toast({
        title: "تم بنجاح",
        description: `تم حفظ ${type === 'customer' ? 'توقيع العميل' : 'توقيع الشركة'} بنجاح${statusMessage}`,
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      // إعادة تحميل البيانات في حالة الخطأ
      await loadContract();
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <ContractHeader
          contract={contract}
          onShowDelivery={() => setShowDeliveryForm(true)}
          onShowReturn={() => setShowReturnForm(true)}
          onShowPayment={() => setShowPaymentForm(true)}
        />

        <ContractStageNavigation
          currentStage={currentStage}
          onStageChange={setCurrentStage}
          contract={contract}
        />

        <ContractStageContent
          stage={currentStage}
          contract={contract}
          onShowCustomerSignature={() => setShowCustomerSignature(true)}
          onShowCompanySignature={() => setShowCompanySignature(true)}
          onShowDelivery={() => setShowDeliveryForm(true)}
          onShowReturn={() => setShowReturnForm(true)}
          onShowPayment={() => setShowPaymentForm(true)}
          onAdvanceToNextStage={handleAdvanceToNextStage}
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
          onSuccess={async () => {
            await loadContract();
            if (onDataUpdate) {
              onDataUpdate();
            }
          }}
        />

        <ContractReturnForm
          contract={contract}
          open={showReturnForm}
          onOpenChange={setShowReturnForm}
          onSuccess={async () => {
            await loadContract();
            if (onDataUpdate) {
              onDataUpdate();
            }
          }}
        />

        {/* Payment Form */}
        <ContractPaymentForm
          contract={contract}
          open={showPaymentForm}
          onOpenChange={setShowPaymentForm}
          onSuccess={async () => {
            await loadContract();
            if (onDataUpdate) {
              onDataUpdate();
            }
          }}
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