import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, TrendingUp, TrendingDown, Route } from 'lucide-react';
import { type VehicleFormData } from './types';

interface AdvancedPricingSectionProps {
  control: Control<VehicleFormData>;
}

export const AdvancedPricingSection: React.FC<AdvancedPricingSectionProps> = ({ control }) => {
  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        إعدادات التسعير المتقدمة
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField
            control={control}
            name="min_daily_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">الحد الأدنى للسعر اليومي</FormLabel>
                <FormControl>
                  <div className="relative">
                    <TrendingDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="150" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
            name="max_daily_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">الحد الأقصى للسعر اليومي</FormLabel>
                <FormControl>
                  <div className="relative">
                    <TrendingUp className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="300" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">د.ك</span>
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
            name="mileage_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">حد الكيلومترات اليومي</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Route className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="200" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">كم</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="excess_mileage_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">تكلفة الكيلومتر الإضافي</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.5" 
                      step="0.01"
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">د.ك</span>
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