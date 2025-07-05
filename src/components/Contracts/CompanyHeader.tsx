import React, { useEffect, useState } from 'react';
import { companyBrandingService } from '@/services/companyBrandingService';

interface CompanyHeaderProps {
  className?: string;
}

interface CompanyBrandingData {
  company_name_ar?: string;
  company_name_en?: string;
  address_ar?: string;
  address_en?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  header_image_url?: string;
  show_header?: boolean;
  header_height?: number;
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({ className = "" }) => {
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
           style={{ height: '120px' }}>
        <div className="text-gray-500">جاري تحميل بيانات الشركة...</div>
      </div>
    );
  }

  // إذا كان إظهار الرأس معطل
  if (!branding?.show_header) {
    return null;
  }

  const headerHeight = branding?.header_height || 120;

  return (
    <div 
      className={`w-full bg-white border-b print:border-b-2 print:border-gray-300 ${className}`}
      style={{ height: `${headerHeight}px` }}
    >
      {/* صورة الرأس كخلفية */}
      {branding?.header_image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ 
            backgroundImage: `url(${branding.header_image_url})`,
            height: `${headerHeight}px`
          }}
        />
      )}
      
      <div className="relative z-10 h-full flex items-center justify-between px-8">
        {/* الشعار */}
        <div className="flex items-center gap-4">
          {branding?.logo_url && (
            <img 
              src={branding.logo_url} 
              alt="شعار الشركة"
              className="max-h-16 object-contain"
            />
          )}
        </div>

        {/* معلومات الشركة */}
        <div className="text-right" dir="rtl">
          {branding?.company_name_ar && (
            <h1 className="text-xl font-bold text-gray-800 mb-1">
              {branding.company_name_ar}
            </h1>
          )}
          {branding?.company_name_en && (
            <h2 className="text-sm text-gray-600 mb-2" dir="ltr">
              {branding.company_name_en}
            </h2>
          )}
          
          <div className="text-xs text-gray-600 space-y-1">
            {branding?.address_ar && (
              <div>{branding.address_ar}</div>
            )}
            <div className="flex gap-4 justify-end">
              {branding?.phone && (
                <span>هاتف: {branding.phone}</span>
              )}
              {branding?.email && (
                <span>إيميل: {branding.email}</span>
              )}
            </div>
            {branding?.website && (
              <div>{branding.website}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;