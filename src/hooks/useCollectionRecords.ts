
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionRecordService } from '@/services/collectionRecords';
import { toast } from 'sonner';
import type { CollectionRecordFormData } from '@/types/invoice';

export const useCollectionRecords = () => {
  return useQuery({
    queryKey: ['collection-records'],
    queryFn: collectionRecordService.getCollectionRecords,
  });
};

export const useCollectionRecord = (id: string) => {
  return useQuery({
    queryKey: ['collection-record', id],
    queryFn: () => collectionRecordService.getCollectionRecordById(id),
    enabled: !!id,
  });
};

export const useCreateCollectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollectionRecordFormData) => 
      collectionRecordService.createCollectionRecord(data),
    onSuccess: () => {
      toast.success('تم إنشاء سجل التحصيل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collection-records'] });
    },
    onError: () => {
      toast.error('فشل في إنشاء سجل التحصيل');
    },
  });
};

export const useUpdateCollectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => 
      collectionRecordService.updateCollectionRecord(id, data),
    onSuccess: () => {
      toast.success('تم تحديث سجل التحصيل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collection-records'] });
    },
    onError: () => {
      toast.error('فشل في تحديث سجل التحصيل');
    },
  });
};

export const useVerifyCollectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'rejected' }) => 
      collectionRecordService.verifyCollectionRecord(id, status),
    onSuccess: () => {
      toast.success('تم تحديث حالة التحصيل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collection-records'] });
    },
    onError: () => {
      toast.error('فشل في تحديث حالة التحصيل');
    },
  });
};

export const useDeleteCollectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectionRecordService.deleteCollectionRecord(id),
    onSuccess: () => {
      toast.success('تم حذف سجل التحصيل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collection-records'] });
    },
    onError: () => {
      toast.error('فشل في حذف سجل التحصيل');
    },
  });
};

export const useCollectionRecordsByPayment = (paymentId: string) => {
  return useQuery({
    queryKey: ['collection-records-by-payment', paymentId],
    queryFn: () => collectionRecordService.getCollectionRecordsByPayment(paymentId),
    enabled: !!paymentId,
  });
};

export const useCollectionSummary = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ['collection-summary', dateFrom, dateTo],
    queryFn: () => collectionRecordService.getCollectionSummary(dateFrom, dateTo),
  });
};
