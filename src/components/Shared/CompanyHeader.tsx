import React, { useEffect, useState } from 'react';
import { CompanyBrandingService, CompanyBranding } from '@/services/companyBrandingService';

interface CompanyHeaderProps {
  variant?: 'print' | 'screen';
  showSubtitle?: boolean;
  className?: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  variant = 'screen',
  showSubtitle = true,
  className = ''
}) => {
  const isPrint = variant === 'print';
  const [branding, setBranding] = useState<CompanyBranding | null>(null);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const data = await CompanyBrandingService.getCompanyBranding();
        setBranding(data);
      } catch (error) {
        console.error('Error loading company branding:', error);
      }
    };
    
    loadBranding();
  }, []);

  // استخدام البيانات من قاعدة البيانات أو القيم الافتراضية
  const companyNameAr = branding?.company_name_ar || 'شركة ساپتكو الخليج لتأجير السيارات';
  const companyNameEn = branding?.company_name_en || 'SAPTCO GULF CAR RENTAL COMPANY';
  const addressAr = branding?.address_ar || 'دولة الكويت';
  const addressEn = branding?.address_en || 'State of Kuwait';
  const phone = branding?.phone || '+965 XXXX XXXX';
  const email = branding?.email || 'info@saptcogulf.com';
  const website = branding?.website || 'www.saptcogulf.com';
  
  // استخدام الشعار المخصص أو الافتراضي
  const logoUrl = branding?.logo_url || '/lovable-uploads/cf0ef0ce-1c56-4da0-b065-8c130f4f182f.png';
  const headerImageUrl = branding?.header_image_url;
  
  // التحقق من إعدادات العرض
  const showHeader = branding?.show_header !== false; // افتراضي true
  
  if (!showHeader) {
    return null;
  }
  
  return (
    <div className={`text-center ${isPrint ? 'mb-8' : 'mb-6'} ${className}`}>
      {/* صورة الرأسية المخصصة إذا كانت موجودة */}
      {headerImageUrl && (
        <div className={`${isPrint ? 'mb-6' : 'mb-4'}`}>
          <img 
            src={headerImageUrl}
            alt="صورة رأسية مخصصة للشركة"
            className={`w-full object-contain ${isPrint ? `h-[${branding?.header_height || 120}px]` : 'h-32'}`}
          />
        </div>
      )}
      
      {/* شعار الشركة */}
      <div className={`${isPrint ? 'mb-4' : 'mb-3'}`}>
        <div className="inline-flex items-center justify-center">
          <img 
            src={logoUrl}
            alt={`شعار ${companyNameAr} - ${companyNameEn} Logo`}
            className={`${isPrint ? 'h-24 w-auto' : 'h-16 w-auto'} object-contain`}
          />
        </div>
      </div>
      
      {/* اسم الشركة */}
      <h1 className={`${isPrint ? 'text-4xl' : 'text-3xl'} font-bold text-foreground mb-2`}>
        {companyNameAr}
      </h1>
      <h2 className={`${isPrint ? 'text-2xl' : 'text-xl'} font-semibold text-muted-foreground mb-1`}>
        {companyNameEn}
      </h2>
      
      {showSubtitle && (
        <div className={`${isPrint ? 'text-lg' : 'text-base'} text-muted-foreground space-y-1`}>
          <p>{addressAr} - {addressEn}</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span>📞 {phone}</span>
            <span>📧 {email}</span>
            <span>🌐 {website}</span>
          </div>
        </div>
      )}
      
      {/* خط فاصل */}
      <div className={`border-t-2 border-primary mt-4 ${isPrint ? 'mx-0' : 'mx-auto max-w-2xl'}`}></div>
    </div>
  );
};