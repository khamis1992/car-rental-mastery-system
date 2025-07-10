import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SaasSubscription, SaasInvoice, SaasPayment, BillingProcessResult } from '@/types/billing';

// Subscriptions hooks
export function useSaasSubscriptions() {
  return useQuery({
    queryKey: ['saas-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .select(`
          *,
          plan:subscription_plans(id, plan_name, price_monthly, price_yearly),
          tenant:tenants(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as SaasSubscription[];
    },
  });
}

export function useSaasSubscription(id: string) {
  return useQuery({
    queryKey: ['saas-subscription', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .select(`
          *,
          plan:subscription_plans(id, plan_name, price_monthly, price_yearly),
          tenant:tenants(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as SaasSubscription;
    },
    enabled: !!id,
  });
}

export function useCreateSaasSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionData: any) => {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-subscriptions'] });
      toast({
        title: "تم إنشاء الاشتراك بنجاح",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSaasSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-subscriptions'] });
      toast({
        title: "تم تحديث الاشتراك بنجاح",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الاشتراك",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Invoices hooks
export function useSaasInvoices() {
  return useQuery({
    queryKey: ['saas-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_invoices')
        .select(`
          *,
          subscription:saas_subscriptions(id, billing_cycle),
          tenant:tenants(id, name, email),
          items:saas_invoice_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as SaasInvoice[];
    },
  });
}

export function useSaasInvoice(id: string) {
  return useQuery({
    queryKey: ['saas-invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_invoices')
        .select(`
          *,
          subscription:saas_subscriptions(id, billing_cycle),
          tenant:tenants(id, name, email),
          items:saas_invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as SaasInvoice;
    },
    enabled: !!id,
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      payment_method, 
      payment_reference 
    }: { 
      id: string; 
      status: string; 
      payment_method?: string; 
      payment_reference?: string; 
    }) => {
      const updates: any = { status };
      
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('saas_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      toast({
        title: "تم تحديث حالة الفاتورة بنجاح",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث حالة الفاتورة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Payments hooks
export function useSaasPayments() {
  return useQuery({
    queryKey: ['saas-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_payments')
        .select(`
          *,
          invoice:saas_invoices(id, invoice_number, amount_due),
          tenant:tenants(id, name)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as unknown as SaasPayment[];
    },
  });
}

// Automatic billing hooks
export function useRunAutomaticBilling() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<BillingProcessResult> => {
      const { data, error } = await supabase.functions.invoke('automatic-billing');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saas-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['saas-invoices'] });
      
      toast({
        title: "تم تشغيل الفوترة التلقائية بنجاح",
        description: `تم معالجة ${data.summary?.success || 0} اشتراك بنجاح`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تشغيل الفوترة التلقائية",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}