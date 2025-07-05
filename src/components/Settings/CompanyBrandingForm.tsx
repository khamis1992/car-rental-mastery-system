import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Building } from 'lucide-react';
import { CompanyBrandingService, CompanyBranding } from '@/services/companyBrandingService';

export const CompanyBrandingForm: React.FC = () => {
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ logo?: boolean; header?: boolean; footer?: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const data = await CompanyBrandingService.getCompanyBranding();
      setBranding(data);
    } catch (error) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: "فشل في تحميل إعدادات الشركة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyBranding, value: any) => {
    if (branding) {
      setBranding({ ...branding, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!branding) return;

    try {
      await CompanyBrandingService.updateCompanyBranding(branding);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الشركة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'header' | 'footer') => {
    try {
      setUploading({ ...uploading, [type]: true });
      
      let url: string;
      switch (type) {
        case 'logo':
          url = await CompanyBrandingService.uploadLogo(file);
          setBranding(prev => prev ? { ...prev, logo_url: url } : null);
          break;
        case 'header':
          url = await CompanyBrandingService.uploadHeaderImage(file);
          setBranding(prev => prev ? { ...prev, header_image_url: url } : null);
          break;
        case 'footer':
          url = await CompanyBrandingService.uploadFooterImage(file);
          setBranding(prev => prev ? { ...prev, footer_image_url: url } : null);
          break;
      }

      toast({
        title: "تم رفع الصورة بنجاح",
        description: `تم رفع ${type === 'logo' ? 'الشعار' : type === 'header' ? 'صورة الرأسية' : 'صورة التذييل'} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في رفع الصورة",
        description: "فشل في رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'header' | 'footer') => {
    if (!branding) return;

    try {
      const currentUrl = type === 'logo' ? branding.logo_url : 
                        type === 'header' ? branding.header_image_url : 
                        branding.footer_image_url;

      if (currentUrl) {
        await CompanyBrandingService.deleteImage(currentUrl);
      }

      const updates = { [type === 'logo' ? 'logo_url' : type === 'header' ? 'header_image_url' : 'footer_image_url']: null };
      await CompanyBrandingService.updateCompanyBranding(updates);
      setBranding({ ...branding, ...updates });

      toast({
        title: "تم حذف الصورة",
        description: `تم حذف ${type === 'logo' ? 'الشعار' : type === 'header' ? 'صورة الرأسية' : 'صورة التذييل'} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في حذف الصورة",
        description: "فشل في حذف الصورة",
        variant: "destructive",
      });
    }
  };

  const ImageUploadCard = ({ 
    title, 
    type, 
    currentImage, 
    description 
  }: { 
    title: string; 
    type: 'logo' | 'header' | 'footer'; 
    currentImage?: string; 
    description: string;
  }) => (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {currentImage ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <img 
                src={currentImage} 
                alt={title}
                className="max-h-32 w-auto mx-auto object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleRemoveImage(type)}
                className="rtl-flex gap-2"
              >
                <X className="w-4 h-4" />
                حذف الصورة
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لم يتم رفع صورة بعد</p>
          </div>
        )}

        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, type);
            }}
            className="hidden"
            id={`upload-${type}`}
          />
          <label htmlFor={`upload-${type}`}>
            <Button 
              variant="outline" 
              className="rtl-flex gap-2 w-full cursor-pointer"
              disabled={uploading[type]}
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                {uploading[type] ? 'جاري الرفع...' : currentImage ? 'تغيير الصورة' : 'رفع صورة'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لم يتم العثور على إعدادات الشركة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* معلومات الشركة الأساسية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Building className="w-5 h-5" />
            معلومات الشركة الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name-ar">اسم الشركة (عربي)</Label>
              <Input
                id="company-name-ar"
                value={branding.company_name_ar}
                onChange={(e) => handleInputChange('company_name_ar', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-name-en">اسم الشركة (إنجليزي)</Label>
              <Input
                id="company-name-en"
                value={branding.company_name_en}
                onChange={(e) => handleInputChange('company_name_en', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={branding.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={branding.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">الموقع الإلكتروني</Label>
              <Input
                id="website"
                value={branding.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tax-number">الرقم الضريبي</Label>
              <Input
                id="tax-number"
                value={branding.tax_number || ''}
                onChange={(e) => handleInputChange('tax_number', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address-ar">العنوان (عربي)</Label>
              <Textarea
                id="address-ar"
                value={branding.address_ar}
                onChange={(e) => handleInputChange('address_ar', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address-en">العنوان (إنجليزي)</Label>
              <Textarea
                id="address-en"
                value={branding.address_en}
                onChange={(e) => handleInputChange('address_en', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* رفع الصور */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ImageUploadCard
          title="شعار الشركة"
          type="logo"
          currentImage={branding.logo_url}
          description="سيظهر الشعار في رأس جميع التقارير والمستندات"
        />
        
        <ImageUploadCard
          title="صورة الرأسية"
          type="header"
          currentImage={branding.header_image_url}
          description="صورة مخصصة للرأسية في التقارير المطبوعة"
        />
        
        <ImageUploadCard
          title="صورة التذييل"
          type="footer"
          currentImage={branding.footer_image_url}
          description="صورة مخصصة للتذييل في التقارير المطبوعة"
        />
      </div>

      {/* إعدادات العرض */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title">إعدادات العرض</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>إظهار الرأسية</Label>
              <p className="text-sm text-muted-foreground">عرض رأسية الشركة في التقارير</p>
            </div>
            <Switch
              checked={branding.show_header}
              onCheckedChange={(checked) => handleInputChange('show_header', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>إظهار التذييل</Label>
              <p className="text-sm text-muted-foreground">عرض تذييل الشركة في التقارير</p>
            </div>
            <Switch
              checked={branding.show_footer}
              onCheckedChange={(checked) => handleInputChange('show_footer', checked)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header-height">ارتفاع الرأسية (بكسل)</Label>
              <Input
                id="header-height"
                type="number"
                min="50"
                max="300"
                value={branding.header_height}
                onChange={(e) => handleInputChange('header_height', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footer-height">ارتفاع التذييل (بكسل)</Label>
              <Input
                id="footer-height"
                type="number"
                min="40"
                max="200"
                value={branding.footer_height}
                onChange={(e) => handleInputChange('footer_height', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-start">
        <Button 
          onClick={handleSave}
          className="btn-primary"
        >
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
};