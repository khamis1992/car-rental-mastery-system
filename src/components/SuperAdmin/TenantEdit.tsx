
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, X, AlertTriangle } from 'lucide-react';
import { Tenant } from '@/types/tenant';
import { toast } from '@/hooks/use-toast';

const tenantEditSchema = z.object({
  name: z.string().min(2, 'اسم المؤسسة مطلوب'),
  slug: z.string().min(2, 'المعرف مطلوب').regex(/^[a-z0-9-]+$/, 'المعرف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  contact_email: z.string().email('البريد الإلكتروني غير صالح'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, 'الدولة مطلوبة'),
  timezone: z.string().min(1, 'المنطقة الزمنية مطلوبة'),
  currency: z.string().min(1, 'العملة مطلوبة'),
  subscription_plan: z.enum(['basic', 'standard', 'premium', 'enterprise']),
  status: z.enum(['active', 'suspended', 'trial', 'cancelled']),
  max_users: z.number().min(1, 'عدد المستخدمين يجب أن يكون أكبر من صفر'),
  max_vehicles: z.number().min(1, 'عدد المركبات يجب أن يكون أكبر من صفر'),
  max_contracts: z.number().min(1, 'عدد العقود يجب أن يكون أكبر من صفر'),
});

type TenantEditFormData = z.infer<typeof tenantEditSchema>;

interface TenantEditProps {
  tenant: Tenant;
  onSave: (updatedTenant: Partial<Tenant>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TenantEdit: React.FC<TenantEditProps> = ({
  tenant,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TenantEditFormData>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues: {
      name: tenant.name,
      slug: tenant.slug,
      contact_email: tenant.contact_email || '',
      contact_phone: tenant.contact_phone || '',
      address: tenant.address || '',
      city: tenant.city || '',
      country: tenant.country,
      timezone: tenant.timezone,
      currency: tenant.currency,
      subscription_plan: tenant.subscription_plan,
      status: tenant.status,
      max_users: tenant.max_users,
      max_vehicles: tenant.max_vehicles,
      max_contracts: tenant.max_contracts,
    },
  });

  const onSubmit = async (data: TenantEditFormData) => {
    try {
      setIsSaving(true);
      await onSave(data);
      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث بيانات ${tenant.name} بنجاح`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث بيانات المؤسسة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'suspended': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'trial': return 'تجريبية';
      case 'suspended': return 'معلقة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">تحرير المؤسسة</h3>
          <p className="text-sm text-muted-foreground">
            تحديث بيانات وإعدادات المؤسسة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(tenant.status)}>
            {getStatusText(tenant.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المؤسسة *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم المؤسسة" />
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
                      <FormLabel>المعرف الفريد *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="company-slug" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@company.com" />
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
                        <Input {...field} placeholder="+965 1234 5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الموقع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="العنوان الكامل للمؤسسة" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <FormLabel>الدولة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Kuwait">الكويت</SelectItem>
                          <SelectItem value="Saudi Arabia">السعودية</SelectItem>
                          <SelectItem value="UAE">الإمارات</SelectItem>
                          <SelectItem value="Qatar">قطر</SelectItem>
                          <SelectItem value="Bahrain">البحرين</SelectItem>
                          <SelectItem value="Oman">عمان</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنطقة الزمنية *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنطقة الزمنية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Kuwait">آسيا/الكويت</SelectItem>
                          <SelectItem value="Asia/Riyadh">آسيا/الرياض</SelectItem>
                          <SelectItem value="Asia/Dubai">آسيا/دبي</SelectItem>
                          <SelectItem value="Asia/Qatar">آسيا/قطر</SelectItem>
                          <SelectItem value="Asia/Bahrain">آسيا/البحرين</SelectItem>
                          <SelectItem value="Asia/Muscat">آسيا/مسقط</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Status */}
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات والحدود</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subscription_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خطة الاشتراك *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر خطة الاشتراك" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">أساسية</SelectItem>
                          <SelectItem value="standard">معيارية</SelectItem>
                          <SelectItem value="premium">متقدمة</SelectItem>
                          <SelectItem value="enterprise">مؤسسية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة المؤسسة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشطة</SelectItem>
                          <SelectItem value="trial">تجريبية</SelectItem>
                          <SelectItem value="suspended">معلقة</SelectItem>
                          <SelectItem value="cancelled">ملغية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة *</FormLabel>
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
                        <SelectItem value="BHD">دينار بحريني (BHD)</SelectItem>
                        <SelectItem value="OMR">ريال عماني (OMR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="max_users"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى للمستخدمين *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_vehicles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى للمركبات *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_contracts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى للعقود *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TenantEdit;
