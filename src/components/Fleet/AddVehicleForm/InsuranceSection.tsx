import React from 'react';
import { Control, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Calendar, FileText, Settings, Building, User } from 'lucide-react';
import { type VehicleFormData } from './types';

interface InsuranceSectionProps {
  control: Control<VehicleFormData>;
}

export const InsuranceSection: React.FC<InsuranceSectionProps> = ({ control }) => {
  // Watch the has_insurance_policy field to conditionally show insurance policy fields
  const hasInsurancePolicy = useWatch({
    control,
    name: 'has_insurance_policy',
    defaultValue: true
  });

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        التأمين والملكية
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField
            control={control}
            name="insurance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع التأمين</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "comprehensive"}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background/60 border-border/60 text-right">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="اختر نوع التأمين" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="comprehensive">تأمين شامل</SelectItem>
                    <SelectItem value="third_party">تأمين ضد الغير</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="owner_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع الملكية</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "company"}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background/60 border-border/60 text-right">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="اختر نوع الملكية" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="company">مملوكة للشركة</SelectItem>
                    <SelectItem value="customer">غير مملوكة للشركة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="insurance_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">شركة التأمين</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Shield className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: التعاونية للتأمين" 
                      className="h-12 pr-10 bg-background/60 border-border/60"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="fuel_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع الوقود</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="بنزين" 
                    className="h-12 bg-background/60 border-border/60"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6">
          <FormField
            control={control}
            name="has_insurance_policy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-foreground">
                    يوجد بوليصة تأمين
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {hasInsurancePolicy && (
            <>
              <FormField
                control={control}
                name="insurance_policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">رقم وثيقة التأمين</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="رقم الوثيقة" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">تاريخ انتهاء التأمين</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={control}
            name="registration_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">تاريخ انتهاء الترخيص</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      className="h-12 pr-10 bg-background/60 border-border/60"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="engine_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">حجم المحرك</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Settings className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: 2.0L" 
                      className="h-12 pr-10 bg-background/60 border-border/60"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};