import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { InvoiceWithDetails } from '@/types/invoice';

export const useInvoicingDataRefactored = () => {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const invoiceService = serviceContainer.getInvoiceBusinessService();
  const paymentService = serviceContainer.getPaymentBusinessService();

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل الفواتير',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await loadInvoices();
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    invoices,
    loading,
    loadData,
    invoiceService,
    paymentService,
  };
};