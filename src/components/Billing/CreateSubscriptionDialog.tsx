import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlans, useCreateSubscription } from "@/hooks/useSaasData";
import { useToast } from "@/hooks/use-toast";

const subscriptionSchema = z.object({
  tenant_id: z.string().min(1, "يرجى اختيار المؤسسة"),
  plan_id: z.string().min(1, "يرجى اختيار الخطة"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  trial_days: z.number().min(0).max(90).optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateSubscriptionDialog: React.FC<CreateSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { data: plans } = useSubscriptionPlans();
  const createSubscriptionMutation = useCreateSubscription();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      billing_cycle: "monthly",
      trial_days: 14,
    },
  });

  const selectedPlan = plans?.find(plan => plan.id === form.watch('plan_id'));

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      if (!selectedPlan) return;

      const trialEnd = data.trial_days ? 
        new Date(Date.now() + data.trial_days * 24 * 60 * 60 * 1000).toISOString() : 
        undefined;

      const periodStart = new Date().toISOString();
      const periodEnd = new Date(
        Date.now() + (data.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
      ).toISOString();

      const amount = data.billing_cycle === 'monthly' ? 
        selectedPlan.price_monthly : 
        selectedPlan.price_yearly;

      await createSubscriptionMutation.mutateAsync({
        tenant_id: data.tenant_id,
        plan_id: data.plan_id,
        billing_cycle: data.billing_cycle,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        trial_end: trialEnd,
        amount
      });

      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إنشاء اشتراك جديد</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المؤسسة</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="معرف المؤسسة" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>خطة الاشتراك</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر خطة الاشتراك" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.plan_name} - {plan.price_monthly} د.ك/شهر
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_cycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>دورة الفوترة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">شهرية</SelectItem>
                      <SelectItem value="yearly">سنوية</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trial_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>أيام الفترة التجريبية</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="90" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlan && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">ملخص الاشتراك</h4>
                <div className="space-y-1 text-sm">
                  <p>الخطة: {selectedPlan.plan_name}</p>
                  <p>
                    السعر: {form.watch('billing_cycle') === 'monthly' ? 
                      `${selectedPlan.price_monthly} د.ك/شهر` : 
                      `${selectedPlan.price_yearly} د.ك/سنة`
                    }
                  </p>
                  <p>الحد الأقصى للمستخدمين: {selectedPlan.max_users_per_tenant}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الاشتراك'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubscriptionDialog;