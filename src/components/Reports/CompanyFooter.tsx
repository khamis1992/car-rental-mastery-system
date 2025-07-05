import React, { useEffect, useState } from 'react';
import { companyBrandingService } from '@/services/companyBrandingService';

interface CompanyFooterProps {
  className?: string;
}

interface CompanyBrandingData {
  company_name_ar?: string;
  tax_number?: string;
  commercial_registration?: string;
  footer_image_url?: string;
  show_footer?: boolean;
  footer_height?: number;
  phone?: string;
  email?: string;
  website?: string;
}

const CompanyFooter: React.FC<CompanyFooterProps> = ({ className = "" }) => {
  const [branding, setBranding] = useState<CompanyBrandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrandingData();
  }, []);

  const loadBrandingData = async () => {
    try {
      const data = await companyBrandingService.getCompanyBranding();
      setBranding(data);
    } catch (error) {
      console.error('Error loading company branding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full bg-gray-50 flex items-center justify-center ${className}`} 
           style={{ height: '80px' }}>
        <div className="text-gray-500 text-xs">جاري تحميل بيانات الشركة...</div>
      </div>
    );
  }

  // إذا كان إظهار التذييل معطل
  if (!branding?.show_footer) {
    return null;
  }

  const footerHeight = branding?.footer_height || 80;

  return (
    <div 
      className={`w-full bg-gray-50 border-t print:border-t-2 print:border-gray-300 ${className}`}
      style={{ height: `${footerHeight}px` }}
    >
      {/* صورة التذييل كخلفية */}
      {branding?.footer_image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ 
            backgroundImage: `url(${branding.footer_image_url})`,
            height: `${footerHeight}px`
          }}
        />
      )}
      
      <div className="relative z-10 h-full flex items-center justify-between px-8" dir="rtl">
        {/* معلومات قانونية */}
        <div className="text-xs text-gray-600 space-y-1">
          {branding?.tax_number && (
            <div>الرقم الضريبي: {branding.tax_number}</div>
          )}
          {branding?.commercial_registration && (
            <div>السجل التجاري: {branding.commercial_registration}</div>
          )}
        </div>

        {/* معلومات الاتصال */}
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium mb-1">
            {branding?.company_name_ar || 'اسم الشركة'}
          </div>
          <div className="flex gap-4 justify-center">
            {branding?.phone && (
              <span>{branding.phone}</span>
            )}
            {branding?.email && (
              <span>{branding.email}</span>
            )}
            {branding?.website && (
              <span>{branding.website}</span>
            )}
          </div>
        </div>

        {/* تاريخ الطباعة */}
        <div className="text-xs text-gray-500">
          تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>
    </div>
  );
};

export default CompanyFooter;