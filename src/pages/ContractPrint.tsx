import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contractService } from '@/services/contractService';
import { ContractPrintTemplate } from '@/components/Contracts/ContractPrintTemplate';
import { useToast } from '@/hooks/use-toast';

const ContractPrint = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  useEffect(() => {
    // طباعة تلقائية عند تحميل الصفحة
    if (contract && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [contract, loading]);

  const loadContract = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await contractService.getContractById(id);
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري تحميل العقد...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-4">
            لم يتم العثور على العقد
          </h2>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-container">
      <ContractPrintTemplate contract={contract} />
      
      {/* أزرار التحكم - تخفي عند الطباعة */}
      <div className="print:hidden fixed top-4 right-4 space-x-2 space-x-reverse">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          طباعة
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default ContractPrint;