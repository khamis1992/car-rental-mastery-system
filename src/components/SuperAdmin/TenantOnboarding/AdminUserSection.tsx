import React, { useState } from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { type TenantOnboardingFormData } from './types';

interface AdminUserSectionProps {
  control: Control<TenantOnboardingFormData>;
}

export const AdminUserSection: React.FC<AdminUserSectionProps> = ({ control }) => {
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        معلومات المدير
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* العمود الأول */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="admin_user.full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">الاسم الكامل</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="أحمد محمد علي الخالدي" 
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
            name="admin_user.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder="admin@company.com" 
                      className="h-12 pr-10 bg-background/60 border-border/60" 
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  سيتم استخدام هذا البريد لتسجيل الدخول إلى النظام
                </p>
              </FormItem>
            )}
          />
        </div>

        {/* العمود الثاني */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="admin_user.password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">كلمة المرور</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="كلمة مرور قوية" 
                      className="h-12 pr-10 pl-10 bg-background/60 border-border/60" 
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit text-xs"
                    onClick={() => field.onChange(generatePassword())}
                  >
                    توليد كلمة مرور قوية
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وصغير ورقم
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">ملاحظة مهمة</span>
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم منح هذا المستخدم صلاحيات المدير الكاملة للمؤسسة، 
              بما في ذلك إدارة المستخدمين والإعدادات والبيانات.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};