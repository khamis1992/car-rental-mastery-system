import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { companyBrandingService } from '@/services/companyBrandingService';
import { Upload, X, Eye, EyeOff, Building, Image, FileText } from 'lucide-react';

interface CompanyBrandingData {
  id?: string;
  company_name_ar?: string;
  company_name_en?: string;
  address_ar?: string;
  address_en?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
  commercial_registration?: string;
  logo_url?: string;
  header_image_url?: string;
  footer_image_url?: string;
  show_header?: boolean;
  show_footer?: boolean;
  header_height?: number;
  footer_height?: number;
}

const CompanyBrandingManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyBrandingData>({
    company_name_ar: '',
    company_name_en: '',
    address_ar: '',
    address_en: '',
    phone: '',
    email: '',
    website: '',
    tax_number: '',
    commercial_registration: '',
    show_header: true,
    show_footer: true,
    header_height: 120,
    footer_height: 80,
  });

  useEffect(() => {
    loadBrandingData();
  }, []);

  const loadBrandingData = async () => {
    try {
      setLoading(true);
      const branding = await companyBrandingService.getCompanyBranding();
      if (branding) {
        setData(branding);
      }
    } catch (error) {
      console.error('Error loading branding data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العلامة التجارية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyBrandingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (type: 'logo' | 'header' | 'footer', file: File) => {
    try {
      setLoading(true);
      
      let imageUrl: string;
      if (type === 'logo') {
        imageUrl = await companyBrandingService.uploadLogo(file);
        // حذف الصورة القديمة إذا كانت موجودة
        if (data.logo_url) {
          await companyBrandingService.deleteFile(data.logo_url);
        }
        handleInputChange('logo_url', imageUrl);
      } else if (type === 'header') {
        imageUrl = await companyBrandingService.uploadHeaderImage(file);
        if (data.header_image_url) {
          await companyBrandingService.deleteFile(data.header_image_url);
        }
        handleInputChange('header_image_url', imageUrl);
      } else {
        imageUrl = await companyBrandingService.uploadFooterImage(file);
        if (data.footer_image_url) {
          await companyBrandingService.deleteFile(data.footer_image_url);
        }
        handleInputChange('footer_image_url', imageUrl);
      }

      toast({
        title: "تم بنجاح",
        description: `تم رفع ${type === 'logo' ? 'الشعار' : type === 'header' ? 'صورة الرأس' : 'صورة التذييل'} بنجاح`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'header' | 'footer') => {
    try {
      const imageUrl = type === 'logo' ? data.logo_url : 
                     type === 'header' ? data.header_image_url : 
                     data.footer_image_url;
      
      if (imageUrl) {
        await companyBrandingService.deleteFile(imageUrl);
      }

      if (type === 'logo') {
        handleInputChange('logo_url', '');
      } else if (type === 'header') {
        handleInputChange('header_image_url', '');
      } else {
        handleInputChange('footer_image_url', '');
      }

      toast({
        title: "تم بنجاح",
        description: `تم حذف ${type === 'logo' ? 'الشعار' : type === 'header' ? 'صورة الرأس' : 'صورة التذييل'} بنجاح`,
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الصورة",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await companyBrandingService.upsertCompanyBranding(data);
      toast({
        title: "تم بنجاح",
        description: "تم حفظ بيانات العلامة التجارية بنجاح",
      });
    } catch (error) {
      console.error('Error saving branding data:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ بيانات العلامة التجارية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadSection = ({ 
    type, 
    title, 
    icon, 
    currentUrl, 
    description 
  }: { 
    type: 'logo' | 'header' | 'footer';
    title: string;
    icon: React.ReactNode;
    currentUrl?: string;
    description: string;
  }) => (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2 text-sm text-left">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-left">{description}</p>
        
        {currentUrl && (
          <div className="space-y-2">
            <img 
              src={currentUrl} 
              alt={title}
              className="max-h-20 object-contain border rounded"
            />
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
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(type, file);
              }
            }}
            className="hidden"
            id={`${type}-upload`}
          />
          <Label 
            htmlFor={`${type}-upload`}
            className="cursor-pointer"
          >
            <Button type="button" variant="outline" className="rtl-flex gap-2">
              <Upload className="w-4 h-4" />
              {currentUrl ? 'تغيير الصورة' : 'رفع صورة'}
            </Button>
          </Label>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* معلومات الشركة الأساسية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 text-left">
            <Building className="w-5 h-5" />
            معلومات الشركة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name_ar" className="rtl-label text-left">اسم الشركة (عربي)</Label>
              <Input
                id="company_name_ar"
                value={data.company_name_ar || ''}
                onChange={(e) => handleInputChange('company_name_ar', e.target.value)}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_name_en" className="rtl-label text-left">اسم الشركة (إنجليزي)</Label>
              <Input
                id="company_name_en"
                value={data.company_name_en || ''}
                onChange={(e) => handleInputChange('company_name_en', e.target.value)}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="rtl-label text-left">رقم الهاتف</Label>
              <Input
                id="phone"
                value={data.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="rtl-label text-left">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website" className="rtl-label text-left">الموقع الإلكتروني</Label>
              <Input
                id="website"
                value={data.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tax_number" className="rtl-label text-left">الرقم الضريبي</Label>
              <Input
                id="tax_number"
                value={data.tax_number || ''}
                onChange={(e) => handleInputChange('tax_number', e.target.value)}
                className="text-left"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_ar" className="rtl-label text-left">العنوان (عربي)</Label>
              <Textarea
                id="address_ar"
                value={data.address_ar || ''}
                onChange={(e) => handleInputChange('address_ar', e.target.value)}
                rows={2}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_en" className="rtl-label text-left">العنوان (إنجليزي)</Label>
              <Textarea
                id="address_en"
                value={data.address_en || ''}
                onChange={(e) => handleInputChange('address_en', e.target.value)}
                rows={2}
                className="text-left"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* رفع الصور */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImageUploadSection
          type="logo"
          title="شعار الشركة"
          icon={<Building className="w-4 h-4" />}
          currentUrl={data.logo_url}
          description="الشعار الذي سيظهر في التقارير والفواتير"
        />
        
        <ImageUploadSection
          type="header"
          title="صورة الرأس"
          icon={<Image className="w-4 h-4" />}
          currentUrl={data.header_image_url}
          description="الصورة التي ستظهر في أعلى التقارير"
        />
        
        <ImageUploadSection
          type="footer"
          title="صورة التذييل"
          icon={<FileText className="w-4 h-4" />}
          currentUrl={data.footer_image_url}
          description="الصورة التي ستظهر في أسفل التقارير"
        />
      </div>

      {/* إعدادات العرض */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 text-left">
            <Eye className="w-5 h-5" />
            إعدادات العرض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <Label htmlFor="show_header" className="rtl-label text-left">إظهار الرأس</Label>
              <p className="text-sm text-muted-foreground text-left">إظهار أو إخفاء منطقة الرأس في التقارير</p>
            </div>
            <Switch
              id="show_header"
              checked={data.show_header || false}
              onCheckedChange={(checked) => handleInputChange('show_header', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <Label htmlFor="show_footer" className="rtl-label text-left">إظهار التذييل</Label>
              <p className="text-sm text-muted-foreground text-left">إظهار أو إخفاء منطقة التذييل في التقارير</p>
            </div>
            <Switch
              id="show_footer"
              checked={data.show_footer || false}
              onCheckedChange={(checked) => handleInputChange('show_footer', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header_height" className="rtl-label text-left">ارتفاع الرأس (بكسل)</Label>
              <Input
                id="header_height"
                type="number"
                min="50"
                max="300"
                value={data.header_height || 120}
                onChange={(e) => handleInputChange('header_height', parseInt(e.target.value))}
                className="text-left"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footer_height" className="rtl-label text-left">ارتفاع التذييل (بكسل)</Label>
              <Input
                id="footer_height"
                type="number"
                min="50"
                max="200"
                value={data.footer_height || 80}
                onChange={(e) => handleInputChange('footer_height', parseInt(e.target.value))}
                className="text-left"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الحفظ */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
};

export default CompanyBrandingManager;