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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Car, Calendar, FileText, Gauge, Settings, Wrench } from 'lucide-react';
import { type VehicleFormData } from './types';

interface BasicInfoSectionProps {
  control: Control<VehicleFormData>;
}

const vehicleTypes = [
  { value: 'sedan', label: 'سيدان' },
  { value: 'suv', label: 'دفع رباعي' },
  { value: 'hatchback', label: 'هاتشباك' },
  { value: 'coupe', label: 'كوبيه' },
  { value: 'pickup', label: 'بيك أب' },
  { value: 'van', label: 'فان' },
  { value: 'luxury', label: 'فاخرة' },
];

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ control }) => {
  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        المعلومات الأساسية
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* العمود الأيسر */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="vehicle_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع المركبة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background/60 border-border/60 text-right">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="اختر نوع المركبة" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">الصانع</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Car className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: تويوتا" 
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">سنة الصنع</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="2024" 
                      className="h-12 pr-10 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="license_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">رقم اللوحة</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: أ ب ج ١٢٣٤" 
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
            name="vin_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">رقم الهيكل (VIN)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Wrench className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="WVWZZZ1JZ3W386752" 
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

        {/* العمود الأيمن */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">الموديل</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Car className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: كامري" 
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
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">اللون</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="مثال: أبيض" 
                    className="h-12 bg-background/60 border-border/60"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">عداد المسافة</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Gauge className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع الناقل</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Settings className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="أوتوماتيك" 
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
            name="body_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">نوع الهيكل</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Car className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: 4 أبواب، 2 أبواب، هاتشباك" 
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