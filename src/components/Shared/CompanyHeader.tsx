import React from 'react';

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
  
  return (
    <div className={`text-center ${isPrint ? 'mb-8' : 'mb-6'} ${className}`}>
      {/* شعار الشركة */}
      <div className={`${isPrint ? 'mb-4' : 'mb-3'}`}>
        <div className="inline-flex items-center justify-center">
          <img 
            src="/lovable-uploads/ab29ad47-ee4e-4e76-aac1-0652adafa064.png" 
            alt="شعار شركة ساپتكو الخليج - SAPTCO GULF Logo"
            className={`${isPrint ? 'h-24 w-auto' : 'h-16 w-auto'} object-contain`}
          />
        </div>
      </div>
      
      {/* اسم الشركة */}
      <h1 className={`${isPrint ? 'text-4xl' : 'text-3xl'} font-bold text-foreground mb-2`}>
        شركة ساپتكو الخليج لتأجير السيارات
      </h1>
      <h2 className={`${isPrint ? 'text-2xl' : 'text-xl'} font-semibold text-muted-foreground mb-1`}>
        SAPTCO GULF CAR RENTAL COMPANY
      </h2>
      
      {showSubtitle && (
        <div className={`${isPrint ? 'text-lg' : 'text-base'} text-muted-foreground space-y-1`}>
          <p>دولة الكويت - State of Kuwait</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span>📞 +965 XXXX XXXX</span>
            <span>📧 info@saptcogulf.com</span>
            <span>🌐 www.saptcogulf.com</span>
          </div>
        </div>
      )}
      
      {/* خط فاصل */}
      <div className={`border-t-2 border-primary mt-4 ${isPrint ? 'mx-0' : 'mx-auto max-w-2xl'}`}></div>
    </div>
  );
};