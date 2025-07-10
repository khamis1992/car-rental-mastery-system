import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sadadService } from '@/services/sadadService';
import { useToast } from '@/hooks/use-toast';
import { 
  SaasPayment,
  CreatePaymentFormData,
  SadadPaymentRequest,
  SadadPaymentResponse,
  PaymentStatus,
  Currency
} from '@/types/unified-saas';

// إعدادات SADAD
export const useSadadSettings = () => {
  return useQuery({
    queryKey: ['sadad-settings'],
    queryFn: () => sadadService.getSadadSettings(),
  });
};

export const useUpdateSadadSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: SadadSettingsFormData) => 
      sadadService.updateSadadSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sadad-settings'] });
      toast({
        title: 'تم تحديث الإعدادات',
        description: 'تم تحديث إعدادات SADAD بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث الإعدادات',
        description: error.message || 'حدث خطأ أثناء تحديث إعدادات SADAD',
        variant: 'destructive',
      });
    },
  });
};

// المدفوعات
export const useSadadPayments = (filters?: {
  tenant_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['sadad-payments', filters],
    queryFn: () => sadadService.getSadadPayments(filters),
  });
};

export const useSadadPaymentById = (id: string) => {
  return useQuery({
    queryKey: ['sadad-payment', id],
    queryFn: () => sadadService.getSadadPaymentById(id),
    enabled: !!id,
  });
};

export const useCreateSadadPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentData: CreateSadadPaymentFormData) => 
      sadadService.createSadadPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sadad-payments'] });
      queryClient.invalidateQueries({ queryKey: ['sadad-stats'] });
      toast({
        title: 'تم إنشاء الدفعة',
        description: 'تم إنشاء دفعة SADAD بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في إنشاء الدفعة',
        description: error.message || 'حدث خطأ أثناء إنشاء الدفعة',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSadadPaymentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      additionalData 
    }: { 
      id: string; 
      status: SadadPayment['sadad_status'];
      additionalData?: Partial<SadadPayment>;
    }) => sadadService.updateSadadPaymentStatus(id, status, additionalData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sadad-payments'] });
      queryClient.invalidateQueries({ queryKey: ['sadad-payment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['sadad-stats'] });
      toast({
        title: 'تم تحديث حالة الدفعة',
        description: 'تم تحديث حالة دفعة SADAD بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث الدفعة',
        description: error.message || 'حدث خطأ أثناء تحديث حالة الدفعة',
        variant: 'destructive',
      });
    },
  });
};

// الإحصائيات
export const useSadadStats = (filters?: {
  tenant_id?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: ['sadad-stats', filters],
    queryFn: () => sadadService.getSadadStats(filters),
    refetchInterval: 5 * 60 * 1000, // تحديث كل 5 دقائق
  });
};

// سجل المعاملات
export const useSadadTransactionLogs = (paymentId: string) => {
  return useQuery({
    queryKey: ['sadad-transaction-logs', paymentId],
    queryFn: () => sadadService.getTransactionLogs(paymentId),
    enabled: !!paymentId,
  });
};

// أحداث webhook غير المعالجة
export const useUnprocessedWebhookEvents = () => {
  return useQuery({
    queryKey: ['sadad-unprocessed-webhooks'],
    queryFn: () => sadadService.getUnprocessedWebhookEvents(),
    refetchInterval: 30 * 1000, // تحديث كل 30 ثانية
  });
};

// البحث عن الدفعة بمعرف المعاملة
export const useFindPaymentByTransactionId = (transactionId: string) => {
  return useQuery({
    queryKey: ['sadad-payment-by-transaction', transactionId],
    queryFn: () => sadadService.findPaymentByTransactionId(transactionId),
    enabled: !!transactionId,
  });
};