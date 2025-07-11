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
import { Building2, Mail, Phone, Hash, Globe } from 'lucide-react';
import { type TenantOnboardingFormData } from './types';

interface OrganizationInfoSectionProps {
  control: Control<TenantOnboardingFormData>;
  onNameChange?: (name: string) => void;
}

export const OrganizationInfoSection: React.FC<OrganizationInfoSectionProps> = ({ 
  control, 
  onNameChange 
}) => {
  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        معلومات المؤسسة
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* العمود الأول */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">اسم المؤسسة</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="مثال: شركة الخليج لتأجير السيارات" 
                      className="h-12 pr-10 bg-background/60 border-border/60" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onNameChange?.(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">المعرف الفريد</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="gulf-car-rental" 
                      className="h-12 pr-10 bg-background/60 border-border/60" 
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  سيتم استخدامه في عنوان موقع المؤسسة: {field.value ? `${field.value}.system.com` : 'your-slug.system.com'}
                </p>
              </FormItem>
            )}
          />
        </div>

        {/* العمود الثاني */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder="info@company.com" 
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
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">رقم الهاتف</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="+965 2222 2222" 
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