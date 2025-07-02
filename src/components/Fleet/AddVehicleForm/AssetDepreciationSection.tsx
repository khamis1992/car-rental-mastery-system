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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingDown, Calendar, DollarSign, Calculator, Percent } from 'lucide-react';
import { type VehicleFormData } from './types';

interface AssetDepreciationSectionProps {
  control: Control<VehicleFormData>;
}

export const AssetDepreciationSection: React.FC<AssetDepreciationSectionProps> = ({ control }) => {
  // Watch the owner_type field to conditionally show this section
  const ownerType = useWatch({
    control,
    name: 'owner_type',
    defaultValue: 'company'
  });

  // Only show this section if owner_type is 'company'
  if (ownerType !== 'company') {
    return null;
  }

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-primary" />
        بيانات الأصل والاهلاك
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField
            control={control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">تاريخ الشراء</FormLabel>
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
            name="purchase_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">تكلفة الشراء</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.000" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">د.ك</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="useful_life_years"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">العمر الإنتاجي (سنة)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="5" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">سنة</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6">
          <FormField
            control={control}
            name="residual_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">القيمة المتبقية</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.000" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">د.ك</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="depreciation_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">طريقة الاستهلاك</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "straight_line"}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background/60 border-border/60 text-right">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="اختر طريقة الاستهلاك" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="straight_line">القسط الثابت</SelectItem>
                    <SelectItem value="declining_balance">الرصيد المتناقص</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="depreciation_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">معدل الاستهلاك</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="20" 
                      className="h-12 pr-10 pl-8 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">%</span>
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