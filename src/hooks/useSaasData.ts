import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  SubscriptionPlan,
  SaasSubscription,
  SaasInvoice,
  SaasPayment,
  TenantUsage,
  PlanFormData,
  SubscriptionFormData,
  SubscriptionUpdateData,
  CreateInvoiceFormData,
  CreatePaymentFormData,
  SadadPaymentRequest,
  SaasBillingStats,
  BillingProcessResult,
  UsageUpdateData
} from '@/types/unified-saas';
import { enhancedSaasService } from '@/services/saasService';
import { useToast } from '@/hooks/use-toast';

// =======================================================
// Hooks لخطط الاشتراك المحسنة
// =======================================================

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => enhancedSaasService.getSubscriptionPlans(),
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 15 * 60 * 1000, // 15 دقيقة
  });
}

export function useAllSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans', 'all'],
    queryFn: () => enhancedSaasService.getAllSubscriptionPlans(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useSubscriptionPlan(planId: string) {
  return useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: () => enhancedSaasService.getSubscriptionPlanById(planId),
    enabled: !!planId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useCreateSubscriptionPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planData: PlanFormData) => enhancedSaasService.createSubscriptionPlan(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "تم إنشاء الخطة",
        description: "تم إنشاء خطة الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, planData }: { planId: string; planData: Partial<PlanFormData> }) =>
      enhancedSaasService.updateSubscriptionPlan(planId, planData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan', variables.planId] });
      toast({
        title: "تم تحديث الخطة",
        description: "تم تحديث خطة الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => enhancedSaasService.deleteSubscriptionPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "تم حذف الخطة",
        description: "تم حذف خطة الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حذف الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks للاشتراكات المحسنة
// =======================================================

export function useTenantSubscriptions(tenantId?: string) {
  return useQuery({
    queryKey: ['tenant-subscriptions', tenantId],
    queryFn: () => enhancedSaasService.getTenantSubscriptions(tenantId),
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
  });
}

export function useSubscription(subscriptionId: string) {
  return useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => enhancedSaasService.getSubscriptionById(subscriptionId),
    enabled: !!subscriptionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionData: SubscriptionFormData) =>
      enhancedSaasService.createSubscription(subscriptionData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions', data.tenant_id] });
      toast({
        title: "تم إنشاء الاشتراك",
        description: "تم إنشاء الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, updates }: { subscriptionId: string; updates: SubscriptionUpdateData }) =>
      enhancedSaasService.updateSubscription(subscriptionId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscriptionId] });
      toast({
        title: "تم تحديث الاشتراك",
        description: "تم تحديث الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }) =>
      enhancedSaasService.cancelSubscription(subscriptionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      toast({
        title: "تم إلغاء الاشتراك",
        description: "تم إلغاء الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إلغاء الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function usePauseSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) => enhancedSaasService.pauseSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      toast({
        title: "تم إيقاف الاشتراك مؤقتاً",
        description: "تم إيقاف الاشتراك مؤقتاً بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إيقاف الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useResumeSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) => enhancedSaasService.resumeSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      toast({
        title: "تم استئناف الاشتراك",
        description: "تم استئناف الاشتراك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في استئناف الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks للفواتير المحسنة
// =======================================================

export function useSaasInvoices(tenantId?: string, limit?: number) {
  return useQuery({
    queryKey: ['saas-invoices', tenantId, limit],
    queryFn: () => enhancedSaasService.getSaasInvoices(tenantId, limit),
    staleTime: 3 * 60 * 1000, // 3 دقائق
    gcTime: 5 * 60 * 1000, // 5 دقائق
  });
}

export function useCreateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceData: CreateInvoiceFormData) =>
      enhancedSaasService.createInvoice(invoiceData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['saas-invoices', data.tenant_id] });
      toast({
        title: "تم إنشاء الفاتورة",
        description: `تم إنشاء الفاتورة رقم ${data.invoice_number} بنجاح`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الفاتورة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: SaasInvoice['status'] }) =>
      enhancedSaasService.updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      toast({
        title: "تم تحديث حالة الفاتورة",
        description: "تم تحديث حالة الفاتورة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث حالة الفاتورة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks للمدفوعات المحسنة
// =======================================================

export function useSaasPayments(tenantId?: string) {
  return useQuery({
    queryKey: ['saas-payments', tenantId],
    queryFn: () => enhancedSaasService.getSaasPayments(tenantId),
    staleTime: 2 * 60 * 1000, // دقيقتان
    gcTime: 5 * 60 * 1000, // 5 دقائق
  });
}

export function useCreatePayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData: CreatePaymentFormData) =>
      enhancedSaasService.createPayment(paymentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
      queryClient.invalidateQueries({ queryKey: ['saas-payments', data.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      toast({
        title: "تم إنشاء المدفوعة",
        description: "تم إنشاء المدفوعة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء المدفوعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateSadadPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData: SadadPaymentRequest) =>
      enhancedSaasService.createSadadPayment(paymentData),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
        toast({
          title: "تم إنشاء دفعة SADAD",
          description: "تم إنشاء دفعة SADAD بنجاح",
        });
      } else {
        toast({
          title: "خطأ في إنشاء دفعة SADAD",
          description: data.error_message || "حدث خطأ غير معروف",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء دفعة SADAD",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      paymentId, 
      status, 
      metadata 
    }: { 
      paymentId: string; 
      status: SaasPayment['status']; 
      metadata?: any 
    }) => enhancedSaasService.updatePaymentStatus(paymentId, status, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      toast({
        title: "تم تحديث حالة المدفوعة",
        description: "تم تحديث حالة المدفوعة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث حالة المدفوعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks لاستخدام المؤسسات المحسنة
// =======================================================

export function useTenantUsage(tenantId?: string, limit: number = 30) {
  return useQuery({
    queryKey: ['tenant-usage', tenantId, limit],
    queryFn: () => enhancedSaasService.getTenantUsage(tenantId, limit),
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
  });
}

export function useUpdateTenantUsage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, usageData }: { tenantId: string; usageData: UsageUpdateData }) =>
      enhancedSaasService.updateTenantUsage(tenantId, usageData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', variables.tenantId] });
      toast({
        title: "تم تحديث بيانات الاستخدام",
        description: "تم تحديث بيانات الاستخدام بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث بيانات الاستخدام",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCalculateCurrentUsage(tenantId: string) {
  return useQuery({
    queryKey: ['current-usage', tenantId],
    queryFn: () => enhancedSaasService.calculateCurrentUsage(tenantId),
    enabled: !!tenantId,
    staleTime: 1 * 60 * 1000, // دقيقة واحدة
    gcTime: 3 * 60 * 1000, // 3 دقائق
  });
}

export function useSyncTenantUsage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => enhancedSaasService.syncTenantUsage(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
      queryClient.invalidateQueries({ queryKey: ['current-usage'] });
      toast({
        title: "تم مزامنة بيانات الاستخدام",
        description: "تم مزامنة بيانات الاستخدام بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في مزامنة بيانات الاستخدام",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks للإحصائيات والتقارير المحسنة
// =======================================================

export function useBillingStats() {
  return useQuery({
    queryKey: ['billing-stats'],
    queryFn: () => enhancedSaasService.getBillingStats(),
    staleTime: 2 * 60 * 1000, // دقيقتان
    gcTime: 5 * 60 * 1000, // 5 دقائق
    refetchInterval: 5 * 60 * 1000, // تحديث كل 5 دقائق
  });
}

export function useUpcomingRenewals(days: number = 7) {
  return useQuery({
    queryKey: ['upcoming-renewals', days],
    queryFn: () => enhancedSaasService.getUpcomingRenewals(days),
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 15 * 60 * 1000, // 15 دقيقة
  });
}

export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => enhancedSaasService.getOverdueInvoices(),
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
    refetchInterval: 10 * 60 * 1000, // تحديث كل 10 دقائق
  });
}

// =======================================================
// Hooks للفوترة التلقائية
// =======================================================

export function useProcessAutomaticBilling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => enhancedSaasService.processAutomaticBilling(),
    onSuccess: (result: BillingProcessResult) => {
      // إعادة تحميل جميع البيانات ذات الصلة
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      
      const successMessage = result.success 
        ? `تم معالجة ${result.processed_count} اشتراك بإجمالي ${result.total_amount} دينار`
        : `فشلت معالجة ${result.failed_count} اشتراك`;

      toast({
        title: result.success ? "تمت الفوترة التلقائية" : "فشلت الفوترة التلقائية",
        description: successMessage,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الفوترة التلقائية",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// =======================================================
// Hooks مركبة للاستخدامات المتقدمة
// =======================================================

export function useTenantDashboardData(tenantId: string) {
  const subscriptions = useTenantSubscriptions(tenantId);
  const invoices = useSaasInvoices(tenantId, 10);
  const payments = useSaasPayments(tenantId);
  const usage = useTenantUsage(tenantId, 7);

  return {
    subscriptions: subscriptions.data || [],
    invoices: invoices.data || [],
    payments: payments.data || [],
    usage: usage.data || [],
    isLoading: subscriptions.isLoading || invoices.isLoading || payments.isLoading || usage.isLoading,
    error: subscriptions.error || invoices.error || payments.error || usage.error,
    refetch: () => {
      subscriptions.refetch();
      invoices.refetch();
      payments.refetch();
      usage.refetch();
    }
  };
}

export function useAdminDashboardData() {
  const stats = useBillingStats();
  const upcomingRenewals = useUpcomingRenewals();
  const overdueInvoices = useOverdueInvoices();
  const allSubscriptions = useTenantSubscriptions();

  return {
    stats: stats.data,
    upcomingRenewals: upcomingRenewals.data || [],
    overdueInvoices: overdueInvoices.data || [],
    allSubscriptions: allSubscriptions.data || [],
    isLoading: stats.isLoading || upcomingRenewals.isLoading || overdueInvoices.isLoading || allSubscriptions.isLoading,
    error: stats.error || upcomingRenewals.error || overdueInvoices.error || allSubscriptions.error,
    refetch: () => {
      stats.refetch();
      upcomingRenewals.refetch();
      overdueInvoices.refetch();
      allSubscriptions.refetch();
    }
  };
}

// =======================================================
// دوال مساعدة للتنظيف
// =======================================================

export function useClearSaasCache() {
  const queryClient = useQueryClient();

  return () => {
    // تنظيف جميع الـ cache المتعلق بـ SaaS
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['saas-payments'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
    queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-renewals'] });
    queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
    
    // تنظيف الـ cache في الخدمة أيضاً
    enhancedSaasService.dispose();
  };
}