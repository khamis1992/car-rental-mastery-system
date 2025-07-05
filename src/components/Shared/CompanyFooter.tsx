import React, { useEffect, useState } from 'react';
import { CompanyBrandingService, CompanyBranding } from '@/services/companyBrandingService';

interface CompanyFooterProps {
  variant?: 'print' | 'screen';
  className?: string;
}

export const CompanyFooter: React.FC<CompanyFooterProps> = ({
  variant = 'screen',
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
  const phone = branding?.phone || '+965 XXXX XXXX';
  const email = branding?.email || 'info@saptcogulf.com';
  const website = branding?.website || 'www.saptcogulf.com';
  
  // استخدام صورة التذييل المخصصة
  const footerImageUrl = branding?.footer_image_url;
  
  // التحقق من إعدادات العرض
  const showFooter = branding?.show_footer !== false; // افتراضي true
  
  if (!showFooter) {
    return null;
  }
  
  return (
    <div className={`text-center ${isPrint ? 'mt-8 pt-6' : 'mt-6 pt-4'} border-t border-muted ${className}`}>
      {/* صورة التذييل المخصصة إذا كانت موجودة */}
      {footerImageUrl && (
        <div className={`${isPrint ? 'mb-4' : 'mb-3'}`}>
          <img 
            src={footerImageUrl}
            alt="صورة تذييل مخصصة للشركة"
            className={`w-full object-contain mx-auto ${isPrint ? `h-[${branding?.footer_height || 80}px]` : 'h-20'}`}
          />
        </div>
      )}
      
      {/* معلومات الشركة */}
      <div className={`${isPrint ? 'text-base' : 'text-sm'} text-muted-foreground space-y-1`}>
        <p className="font-medium">{companyNameAr}</p>
        <p className="font-medium">{companyNameEn}</p>
        
        <div className="flex items-center justify-center gap-4 text-xs">
          <span>📞 {phone}</span>
          <span>📧 {email}</span>
          <span>🌐 {website}</span>
        </div>
        
        {branding?.tax_number && (
          <p className="text-xs">الرقم الضريبي: {branding.tax_number}</p>
        )}
        
        {branding?.commercial_registration && (
          <p className="text-xs">رقم السجل التجاري: {branding.commercial_registration}</p>
        )}
      </div>
    </div>
  );
};