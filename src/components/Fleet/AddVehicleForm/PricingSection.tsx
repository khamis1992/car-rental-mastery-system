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
import { CreditCard } from 'lucide-react';
import { type VehicleFormData } from './types';

interface PricingSectionProps {
  control: Control<VehicleFormData>;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ control }) => {
  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        الأسعار
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormField
          control={control}
          name="daily_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">السعر اليومي</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="200" 
                    className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                  <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="weekly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">السعر الأسبوعي</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="1200" 
                    className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="monthly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">السعر الشهري</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="4800" 
                    className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};