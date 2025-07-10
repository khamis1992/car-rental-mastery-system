import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSadadSettings, useUpdateSadadSettings } from '@/hooks/useSadadData';
import { SadadSettingsFormData } from '@/types/sadad';
import { Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sadadSettingsSchema = z.object({
  merchant_id: z.string().min(1, 'معرف التاجر مطلوب'),
  merchant_key: z.string().min(1, 'مفتاح التاجر مطلوب'),
  api_url: z.string().url('يجب أن يكون رابط صحيح'),
  is_sandbox: z.boolean(),
  is_active: z.boolean()
});

type SadadSettingsForm = z.infer<typeof sadadSettingsSchema>;

const SadadSettings: React.FC = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSadadSettings();
  const updateSettings = useUpdateSadadSettings();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<SadadSettingsForm>({
    resolver: zodResolver(sadadSettingsSchema),
    defaultValues: {
      merchant_id: '',
      merchant_key: '',
      api_url: 'https://api.sadad.kw/v1',
      is_sandbox: false,
      is_active: true
    }
  });

  const watchedValues = watch();

  React.useEffect(() => {
    if (settings) {
      setValue('merchant_id', settings.merchant_id || '');
      setValue('merchant_key', settings.merchant_key || '');
      setValue('api_url', settings.api_url || 'https://api.sadad.kw/v1');
      setValue('is_sandbox', settings.is_sandbox ?? false);
      setValue('is_active', settings.is_active ?? true);
    }
  }, [settings, setValue]);

  const onSubmit = (data: SadadSettingsForm) => {
    const formData: SadadSettingsFormData = {
      merchant_id: data.merchant_id,
      merchant_key: data.merchant_key,
      api_url: data.api_url,
      is_sandbox: data.is_sandbox,
      is_active: data.is_active
    };
    updateSettings.mutate(formData);
  };

  const testConnection = () => {
    toast({
      title: 'اختبار الاتصال',
      description: 'جاري اختبار الاتصال مع SADAD...',
    });
    // هنا يمكن إضافة منطق اختبار الاتصال
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إعدادات SADAD</span>
            <div className="flex items-center gap-2">
              {settings?.is_active ? (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  نشط
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  غير نشط
                </Badge>
              )}
              {watchedValues.is_sandbox && (
                <Badge variant="outline">وضع التجربة</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="merchant_id">معرف التاجر</Label>
                <Input
                  id="merchant_id"
                  type="text"
                  placeholder="أدخل معرف التاجر"
                  {...register('merchant_id')}
                />
                {errors.merchant_id && (
                  <p className="text-sm text-destructive">{errors.merchant_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant_key">مفتاح التاجر</Label>
                <Input
                  id="merchant_key"
                  type="password"
                  placeholder="أدخل مفتاح التاجر"
                  {...register('merchant_key')}
                />
                {errors.merchant_key && (
                  <p className="text-sm text-destructive">{errors.merchant_key.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_url">رابط API</Label>
              <Input
                id="api_url"
                type="url"
                placeholder="https://api.sadad.kw/v1"
                {...register('api_url')}
              />
              {errors.api_url && (
                <p className="text-sm text-destructive">{errors.api_url.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-4 border rounded-lg px-4">
              <div className="space-y-1">
                <Label htmlFor="is_sandbox">وضع التجربة</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل وضع التجربة لاختبار النظام
                </p>
              </div>
              <Switch
                id="is_sandbox"
                checked={watchedValues.is_sandbox}
                onCheckedChange={(checked) => setValue('is_sandbox', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-4 border rounded-lg px-4">
              <div className="space-y-1">
                <Label htmlFor="is_active">تفعيل النظام</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل نظام SADAD للمدفوعات
                </p>
              </div>
              <Switch
                id="is_active"
                checked={watchedValues.is_active}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!isDirty || updateSettings.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateSettings.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                اختبار الاتصال
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="font-medium">آخر تحديث</p>
              <p className="text-sm text-muted-foreground">
                {settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString('ar') : '-'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="font-medium">تاريخ الإنشاء</p>
              <p className="text-sm text-muted-foreground">
                {settings?.created_at ? new Date(settings.created_at).toLocaleDateString('ar') : '-'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="font-medium">الحالة</p>
              <p className="text-sm text-muted-foreground">
                {settings?.is_active ? 'نشط' : 'غير نشط'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SadadSettings;