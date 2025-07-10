import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasService } from '@/services/saasService';
import { useToast } from '@/hooks/use-toast';
import { 
  PlanFormData, 
  SubscriptionFormData,
  SubscriptionPlan,
  SaasSubscription,
  SaasInvoice,
  SaasPayment,
  SaasBillingStats
} from '@/types/saas';

// خطط الاشتراك
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => saasService.getSubscriptionPlans(),
  });
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (planData: PlanFormData) => saasService.createSubscriptionPlan(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'تم إنشاء الخطة',
        description: 'تم إنشاء خطة الاشتراك بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إنشاء الخطة',
        description: 'حدث خطأ أثناء إنشاء خطة الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ planId, planData }: { planId: string; planData: Partial<PlanFormData> }) =>
      saasService.updateSubscriptionPlan(planId, planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'تم تحديث الخطة',
        description: 'تم تحديث خطة الاشتراك بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في تحديث الخطة',
        description: 'حدث خطأ أثناء تحديث خطة الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (planId: string) => saasService.deleteSubscriptionPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'تم حذف الخطة',
        description: 'تم حذف خطة الاشتراك بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في حذف الخطة',
        description: 'حدث خطأ أثناء حذف خطة الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

// الاشتراكات
export const useTenantSubscriptions = () => {
  return useQuery({
    queryKey: ['tenant-subscriptions'],
    queryFn: () => saasService.getTenantSubscriptions(),
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subscriptionData: SubscriptionFormData) => 
      saasService.createSubscription(subscriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم إنشاء الاشتراك',
        description: 'تم إنشاء اشتراك جديد بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في إنشاء الاشتراك',
        description: 'حدث خطأ أثناء إنشاء الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ subscriptionId, updates }: { 
      subscriptionId: string; 
      updates: Partial<SaasSubscription> 
    }) => saasService.updateSubscription(subscriptionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم تحديث الاشتراك',
        description: 'تم تحديث الاشتراك بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في تحديث الاشتراك',
        description: 'حدث خطأ أثناء تحديث الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subscriptionId: string) => saasService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم إلغاء الاشتراك',
        description: 'تم إلغاء الاشتراك بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في إلغاء الاشتراك',
        description: 'حدث خطأ أثناء إلغاء الاشتراك',
        variant: 'destructive',
      });
    },
  });
};

// الفواتير
export const useSaasInvoices = () => {
  return useQuery({
    queryKey: ['saas-invoices'],
    queryFn: () => saasService.getSaasInvoices(),
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invoiceData: {
      subscription_id: string;
      tenant_id: string;
      amount_due: number;
      currency: string;
      billing_period_start: string;
      billing_period_end: string;
      due_date?: string;
      description?: string;
    }) => saasService.createInvoice(invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم إنشاء الفاتورة',
        description: 'تم إنشاء فاتورة جديدة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في إنشاء الفاتورة',
        description: 'حدث خطأ أثناء إنشاء الفاتورة',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ invoiceId, status }: { 
      invoiceId: string; 
      status: SaasInvoice['status'] 
    }) => saasService.updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم تحديث حالة الفاتورة',
        description: 'تم تحديث حالة الفاتورة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في تحديث الفاتورة',
        description: 'حدث خطأ أثناء تحديث حالة الفاتورة',
        variant: 'destructive',
      });
    },
  });
};

// المدفوعات
export const useSaasPayments = () => {
  return useQuery({
    queryKey: ['saas-payments'],
    queryFn: () => saasService.getSaasPayments(),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentData: {
      invoice_id: string;
      subscription_id: string;
      tenant_id: string;
      amount: number;
      currency: string;
      payment_method?: string;
    }) => saasService.createPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'تم تسجيل الدفعة',
        description: 'تم تسجيل الدفعة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في تسجيل الدفعة',
        description: 'حدث خطأ أثناء تسجيل الدفعة',
        variant: 'destructive',
      });
    },
  });
};

// الإحصائيات
export const useBillingStats = () => {
  return useQuery({
    queryKey: ['billing-stats'],
    queryFn: () => saasService.getBillingStats(),
    refetchInterval: 5 * 60 * 1000, // تحديث كل 5 دقائق
  });
};

// استخدام المؤسسات
export const useTenantUsage = () => {
  return useQuery({
    queryKey: ['tenant-usage'],
    queryFn: () => saasService.getTenantUsage(),
    refetchInterval: 10 * 60 * 1000, // تحديث كل 10 دقائق
  });
};

export const useUpdateTenantUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenantId, usageData }: { 
      tenantId: string; 
      usageData: Partial<any>; 
    }) => saasService.updateTenantUsage(tenantId, usageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
      toast({
        title: 'تم تحديث الاستخدام',
        description: 'تم تحديث بيانات استخدام المؤسسة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في تحديث الاستخدام',
        description: 'حدث خطأ أثناء تحديث بيانات الاستخدام',
        variant: 'destructive',
      });
    },
  });
};