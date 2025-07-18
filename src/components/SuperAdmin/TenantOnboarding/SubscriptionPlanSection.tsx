import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Car, FileText, Check } from 'lucide-react';
import { type TenantOnboardingFormData, subscriptionPlans, type SubscriptionPlanKey } from './types';

interface SubscriptionPlanSectionProps {
  control: Control<TenantOnboardingFormData>;
  selectedPlan?: SubscriptionPlanKey;
}

export const SubscriptionPlanSection: React.FC<SubscriptionPlanSectionProps> = ({ 
  control, 
  selectedPlan 
}) => {
  const currentPlan = selectedPlan ? subscriptionPlans[selectedPlan] : null;

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-primary" />
        خطة الاشتراك
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* اختيار الخطة */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="subscription_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">اختر خطة الاشتراك</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background/60 border-border/60">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="اختر خطة الاشتراك" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(subscriptionPlans).map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{plan.name}</span>
                          <Badge className={`mr-2 text-xs ${plan.color}`}>
                            {plan.name_en}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* تفاصيل الخطة المختارة */}
        {currentPlan && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-foreground mb-2">تفاصيل الخطة</div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-primary">{currentPlan.name}</h4>
                  <Badge className={currentPlan.color}>
                    {currentPlan.name_en}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-primary">{currentPlan.limits.max_users_per_tenant}</div>
                    <div className="text-xs text-muted-foreground">مستخدم</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center mb-1">
                      <Car className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-primary">{currentPlan.limits.max_vehicles}</div>
                    <div className="text-xs text-muted-foreground">مركبة</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-primary">{currentPlan.limits.max_contracts}</div>
                    <div className="text-xs text-muted-foreground">عقد</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">المميزات المتضمنة:</div>
                  <ul className="space-y-1">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};