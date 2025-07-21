
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectiveInvoiceService } from '@/services/collectiveInvoices';
import { toast } from 'sonner';
import type { CollectiveInvoiceFormData } from '@/types/invoice';

export const useCollectiveInvoices = () => {
  return useQuery({
    queryKey: ['collective-invoices'],
    queryFn: collectiveInvoiceService.getCollectiveInvoices,
  });
};

export const useCollectiveInvoice = (id: string) => {
  return useQuery({
    queryKey: ['collective-invoice', id],
    queryFn: () => collectiveInvoiceService.getCollectiveInvoiceById(id),
    enabled: !!id,
  });
};

export const useGenerateCollectiveInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollectiveInvoiceFormData) => 
      collectiveInvoiceService.generateCollectiveInvoice(data),
    onSuccess: () => {
      toast.success('تم إنشاء الفاتورة الجماعية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collective-invoices'] });
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الفاتورة الجماعية');
      console.error('Error generating collective invoice:', error);
    },
  });
};

export const useUpdateCollectiveInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => 
      collectiveInvoiceService.updateCollectiveInvoice(id, data),
    onSuccess: () => {
      toast.success('تم تحديث الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collective-invoices'] });
    },
    onError: () => {
      toast.error('فشل في تحديث الفاتورة');
    },
  });
};

export const useDeleteCollectiveInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectiveInvoiceService.deleteCollectiveInvoice(id),
    onSuccess: () => {
      toast.success('تم حذف الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collective-invoices'] });
    },
    onError: () => {
      toast.error('فشل في حذف الفاتورة');
    },
  });
};

export const useAutoBillingSettings = () => {
  return useQuery({
    queryKey: ['auto-billing-settings'],
    queryFn: collectiveInvoiceService.getAutoBillingSettings,
  });
};

export const useUpdateAutoBillingSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: collectiveInvoiceService.updateAutoBillingSettings,
    onSuccess: () => {
      toast.success('تم تحديث إعدادات الفوترة التلقائية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['auto-billing-settings'] });
    },
    onError: () => {
      toast.error('فشل في تحديث إعدادات الفوترة التلقائية');
    },
  });
};

export const useAutoBillingLogs = () => {
  return useQuery({
    queryKey: ['auto-billing-logs'],
    queryFn: collectiveInvoiceService.getAutoBillingLogs,
  });
};
