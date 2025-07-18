import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Building2 } from 'lucide-react';
import { OrganizationInfoSection } from './OrganizationInfoSection';
import { ContactInfoSection } from './ContactInfoSection';
import { SubscriptionPlanSection } from './SubscriptionPlanSection';
import { AdminUserSection } from './AdminUserSection';
import { FormActions } from './FormActions';
import { 
  tenantOnboardingSchema, 
  type TenantOnboardingFormData
} from './types';
import { TenantService } from '@/services/tenantService';
import { useSubscriptionPlans } from '@/hooks/useSaasData';

interface EnhancedTenantOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EnhancedTenantOnboarding: React.FC<EnhancedTenantOnboardingProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const tenantService = new TenantService();
  const { data: subscriptionPlans = [] } = useSubscriptionPlans();

  const form = useForm<TenantOnboardingFormData>({
    resolver: zodResolver(tenantOnboardingSchema),
    defaultValues: {
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: '',
      country: 'الكويت',
      timezone: 'Asia/Kuwait',
      currency: 'KWD',
      subscription_plan: 'standard',
      admin_user: {
        email: '',
        password: '',
        full_name: '',
      },
    },
  });

  const selectedPlan = form.watch('subscription_plan') as string;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(name));
    }
  };

  const onSubmit = async (data: TenantOnboardingFormData) => {
    try {
      setIsSubmitting(true);
      
      // إضافة حدود الخطة تلقائياً
      const plan = subscriptionPlans.find(p => p.plan_code === data.subscription_plan);
      const tenantData = {
        ...data,
        max_users: plan?.max_users_per_tenant || 10,
        max_vehicles: plan?.max_vehicles || 25,
        max_contracts: plan?.max_contracts || 100,
      };

      await tenantService.createTenant(tenantData as any);
      
      toast({
        title: 'تم إنشاء المؤسسة بنجاح',
        description: `تم إنشاء مؤسسة "${data.name}" وحساب المدير بنجاح`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('خطأ في إنشاء المؤسسة:', error);
      toast({
        title: 'خطأ في إنشاء المؤسسة',
        description: error.message || 'حدث خطأ أثناء إنشاء المؤسسة',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: '',
      country: 'الكويت',
      timezone: 'Asia/Kuwait',
      currency: 'KWD',
      subscription_plan: 'standard',
      admin_user: {
        email: '',
        password: '',
        full_name: '',
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="text-center border-b border-border/50 pb-4">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Building2 className="w-6 h-6" />
            إضافة مؤسسة جديدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            قم بملء النموذج أدناه لإضافة مؤسسة جديدة إلى النظام
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <OrganizationInfoSection 
              control={form.control} 
              onNameChange={handleNameChange}
            />
            <ContactInfoSection control={form.control} />
            <SubscriptionPlanSection 
              control={form.control} 
              selectedPlan={selectedPlan}
            />
            <AdminUserSection control={form.control} />
            <FormActions
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              onReset={resetForm}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};