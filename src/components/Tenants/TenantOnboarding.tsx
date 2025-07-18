import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TenantService } from '@/services/tenantService';
import { TenantOnboardingData } from '@/types/tenant';

const tenantSchema = z.object({
  name: z.string().min(2, 'اسم المؤسسة مطلوب'),
  slug: z.string().min(2, 'الرمز مطلوب').regex(/^[a-z0-9-]+$/, 'الرمز يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  contact_email: z.string().email('البريد الإلكتروني غير صحيح'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, 'البلد مطلوب'),
  timezone: z.string().min(1, 'المنطقة الزمنية مطلوبة'),
  currency: z.string().min(1, 'العملة مطلوبة'),
  subscription_plan: z.enum(['basic', 'standard', 'premium', 'enterprise']),
  admin_user: z.object({
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  }),
});

interface TenantOnboardingProps {
  onComplete: () => void;
}

export const TenantOnboarding: React.FC<TenantOnboardingProps> = ({ onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const tenantService = new TenantService();

  const form = useForm<TenantOnboardingData>({
    resolver: zodResolver(tenantSchema),
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

  const onSubmit = async (data: TenantOnboardingData) => {
    try {
      setIsSubmitting(true);
      await tenantService.createTenant(data);
      toast({
        title: 'تم إنشاء المؤسسة بنجاح',
        description: 'تم إنشاء المؤسسة والحساب الإداري بنجاح',
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء المؤسسة',
        description: error.message || 'حدث خطأ أثناء إنشاء المؤسسة',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* معلومات المؤسسة */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المؤسسة</CardTitle>
              <CardDescription>
                المعلومات الأساسية للمؤسسة الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المؤسسة</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="شركة البشائر الخليجية لتأجير السيارات"
                        onChange={(e) => {
                          field.onChange(e);
                          if (!form.getValues('slug')) {
                            form.setValue('slug', generateSlug(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز المؤسسة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="bashayir-gulf" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="info@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+965 XXXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="العنوان التفصيلي للمؤسسة" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="الكويت" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البلد</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر البلد" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="الكويت">الكويت</SelectItem>
                          <SelectItem value="السعودية">السعودية</SelectItem>
                          <SelectItem value="الإمارات">الإمارات</SelectItem>
                          <SelectItem value="قطر">قطر</SelectItem>
                          <SelectItem value="البحرين">البحرين</SelectItem>
                          <SelectItem value="عمان">عمان</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنطقة الزمنية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنطقة الزمنية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر العملة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="QAR">ريال قطري (QAR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subscription_plan"
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
                        <SelectItem value="basic">أساسية</SelectItem>
                        <SelectItem value="standard">قياسية</SelectItem>
                        <SelectItem value="premium">متقدمة</SelectItem>
                        <SelectItem value="enterprise">مؤسسية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* معلومات المدير */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المدير</CardTitle>
              <CardDescription>
                معلومات الحساب الإداري للمؤسسة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="admin_user.full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="أحمد محمد علي" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admin_user.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="admin@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admin_user.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="كلمة مرور قوية" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onComplete}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المؤسسة'}
          </Button>
        </div>
      </form>
    </Form>
  );
};