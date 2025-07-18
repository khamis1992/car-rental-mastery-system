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
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [creationStatus, setCreationStatus] = useState<{
    step: string;
    success: boolean;
    details?: any;
  } | null>(null);
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
      setCreationStatus({ step: 'بدء إنشاء المؤسسة...', success: false });
      
      // إضافة حدود الخطة تلقائياً
      const plan = subscriptionPlans.find(p => p.plan_code === data.subscription_plan);
      const tenantData = {
        ...data,
        max_users: plan?.max_users_per_tenant || 10,
        max_vehicles: plan?.max_vehicles || 25,
        max_contracts: plan?.max_contracts || 100,
      };

      console.log('بيانات إنشاء المؤسسة:', tenantData);
      setCreationStatus({ step: 'إنشاء المؤسسة والمدير...', success: false });

      const result = await tenantService.createTenant(tenantData as any);
      
      if (!result.success || !result.tenant_id) {
        throw new Error(result.message || 'فشل في إنشاء المؤسسة');
      }

      setCreationStatus({ step: 'التحقق من إنشاء المؤسسة...', success: false });

      // التحقق من نجاح الإنشاء
      const verification = await tenantService.verifyTenantCreation(result.tenant_id);
      
      setCreationStatus({ 
        step: 'تم الإنشاء بنجاح', 
        success: true, 
        details: {
          tenantName: verification.tenant?.name,
          usersCount: verification.users.length,
          hasAdmin: verification.hasAdmin
        }
      });

      toast({
        title: 'تم إنشاء المؤسسة بنجاح',
        description: `تم إنشاء مؤسسة "${data.name}" مع ${verification.users.length} مستخدم${verification.hasAdmin ? ' (يتضمن مدير)' : ''}`,
      });

      // تأخير قصير لعرض النجاح
      setTimeout(() => {
        form.reset();
        setCreationStatus(null);
        onOpenChange(false);
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error('خطأ في إنشاء المؤسسة:', error);
      
      setCreationStatus({ 
        step: 'فشل في الإنشاء', 
        success: false,
        details: { error: error.message }
      });

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

        {/* عرض حالة الإنشاء */}
        {creationStatus && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            creationStatus.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {creationStatus.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 animate-pulse" />
            )}
            <div>
              <p className="font-medium">{creationStatus.step}</p>
              {creationStatus.details && creationStatus.success && (
                <p className="text-sm mt-1">
                  المؤسسة: {creationStatus.details.tenantName} | 
                  المستخدمين: {creationStatus.details.usersCount} | 
                  المدير: {creationStatus.details.hasAdmin ? 'موجود' : 'غير موجود'}
                </p>
              )}
              {creationStatus.details && !creationStatus.success && creationStatus.details.error && (
                <p className="text-sm mt-1 text-red-600">
                  {creationStatus.details.error}
                </p>
              )}
            </div>
          </div>
        )}

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
