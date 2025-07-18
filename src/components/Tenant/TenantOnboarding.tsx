import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { TenantService } from '@/services/tenantService';
import { TenantOnboardingData } from '@/types/tenant';
import { Loader2, Building2, User, Mail, Phone, MapPin, Globe, DollarSign } from 'lucide-react';

const tenantOnboardingSchema = z.object({
  // Organization Info
  name: z.string().min(2, 'اسم المؤسسة مطلوب'),
  slug: z.string()
    .min(3, 'الرمز يجب أن يكون 3 أحرف على الأقل')
    .regex(/^[a-z0-9-]+$/, 'الرمز يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  contact_email: z.string().email('البريد الإلكتروني غير صحيح'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Kuwait'),
  timezone: z.string().default('Asia/Kuwait'),
  currency: z.string().default('KWD'),
  subscription_plan: z.enum(['basic', 'standard', 'premium', 'enterprise']),
  
  // Admin User Info
  admin_email: z.string().email('البريد الإلكتروني غير صحيح'),
  admin_password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  admin_full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
});

type TenantOnboardingForm = z.infer<typeof tenantOnboardingSchema>;

interface TenantOnboardingProps {
  onSuccess: (tenant: any) => void;
  onCancel?: () => void;
}

export const TenantOnboarding: React.FC<TenantOnboardingProps> = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'organization' | 'admin' | 'plan'>('organization');
  const { toast } = useToast();
  const tenantService = new TenantService();

  const form = useForm<TenantOnboardingForm>({
    resolver: zodResolver(tenantOnboardingSchema),
    defaultValues: {
      country: 'Kuwait',
      timezone: 'Asia/Kuwait',
      currency: 'KWD',
      subscription_plan: 'basic',
    },
  });

  const onSubmit = async (data: TenantOnboardingForm) => {
    setIsLoading(true);
    
    try {
      // Check if slug is available
      const isSlugAvailable = await tenantService.isSlugAvailable(data.slug);
      if (!isSlugAvailable) {
        form.setError('slug', { message: 'هذا الرمز مستخدم بالفعل' });
        setIsLoading(false);
        return;
      }

      const tenantData: TenantOnboardingData = {
        name: data.name,
        slug: data.slug,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        address: data.address,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        currency: data.currency,
        subscription_plan: data.subscription_plan,
        admin_user: {
          email: data.admin_email,
          password: data.admin_password,
          full_name: data.admin_full_name,
        },
      };

      const tenant = await tenantService.createTenant(tenantData);
      
      toast({
        title: 'تم إنشاء المؤسسة بنجاح',
        description: `مرحباً بك في ${tenant.name}!`,
      });

      onSuccess(tenant);
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'خطأ في إنشاء المؤسسة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 'organization') setStep('admin');
    else if (step === 'admin') setStep('plan');
  };

  const prevStep = () => {
    if (step === 'admin') setStep('organization');
    else if (step === 'plan') setStep('admin');
  };

  const renderOrganizationStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Building2 className="w-12 h-12 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold">معلومات المؤسسة</h3>
        <p className="text-sm text-muted-foreground">أدخل التفاصيل الأساسية لمؤسستك</p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>اسم المؤسسة</FormLabel>
            <FormControl>
              <Input {...field} placeholder="اسم شركتك أو مؤسستك" />
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
            <FormLabel>رمز المؤسسة (يستخدم في الرابط)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="my-company" />
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
            <FormLabel>البريد الإلكتروني للمؤسسة</FormLabel>
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
              <Input {...field} placeholder="عنوان المؤسسة" />
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
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العملة</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="EUR">يورو (EUR)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderAdminStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold">حساب المدير</h3>
        <p className="text-sm text-muted-foreground">إنشاء حساب مدير المؤسسة</p>
      </div>

      <FormField
        control={form.control}
        name="admin_full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>الاسم الكامل للمدير</FormLabel>
            <FormControl>
              <Input {...field} placeholder="الاسم الكامل" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="admin_email"
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
        name="admin_password"
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
    </div>
  );

  const renderPlanStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <DollarSign className="w-12 h-12 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold">خطة الاشتراك</h3>
        <p className="text-sm text-muted-foreground">اختر الخطة المناسبة لمؤسستك</p>
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
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="basic">أساسية - 5 مستخدمين، 10 مركبات</SelectItem>
                <SelectItem value="standard">قياسية - 20 مستخدم، 50 مركبة</SelectItem>
                <SelectItem value="premium">مميزة - 50 مستخدم، 100 مركبة</SelectItem>
                <SelectItem value="enterprise">مؤسسية - غير محدود</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">مميزات جميع الخطط:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• إدارة شاملة للعقود والفواتير</li>
          <li>• نظام محاسبة متكامل</li>
          <li>• إدارة الموارد البشرية</li>
          <li>• تقارير تفصيلية</li>
          <li>• دعم فني على مدار الساعة</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">إنشاء مؤسسة جديدة</CardTitle>
          <div className="flex justify-center space-x-2 rtl:space-x-reverse">
            {['organization', 'admin', 'plan'].map((stepName, index) => (
              <div
                key={stepName}
                className={`w-3 h-3 rounded-full ${
                  stepName === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 'organization' && renderOrganizationStep()}
              {step === 'admin' && renderAdminStep()}
              {step === 'plan' && renderPlanStep()}

              <div className="flex justify-between gap-3">
                {step !== 'organization' && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    السابق
                  </Button>
                )}
                
                <div className="flex gap-3 mr-auto">
                  {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                      إلغاء
                    </Button>
                  )}
                  
                  {step !== 'plan' ? (
                    <Button type="button" onClick={nextStep}>
                      التالي
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                      إنشاء المؤسسة
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};