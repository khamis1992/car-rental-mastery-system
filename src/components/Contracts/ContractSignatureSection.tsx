import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Signature } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ContractSignatureSectionProps {
  contract: any;
  onShowCustomerSignature: () => void;
  onShowCompanySignature: () => void;
}

export const ContractSignatureSection: React.FC<ContractSignatureSectionProps> = ({
  contract,
  onShowCustomerSignature,
  onShowCompanySignature
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Signature className="w-4 h-4" />
          التوقيعات الإلكترونية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Signature */}
          <div className="space-y-3">
            <h4 className="font-medium">توقيع العميل</h4>
            {contract.customer_signature ? (
              <div className="space-y-2">
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <img 
                    src={contract.customer_signature} 
                    alt="توقيع العميل" 
                    className="max-h-20 mx-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  تم التوقيع في: {contract.customer_signed_at ? format(new Date(contract.customer_signed_at), 'PPp', { locale: ar }) : 'غير محدد'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">لم يتم التوقيع بعد</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onShowCustomerSignature}
                >
                  <Signature className="w-4 h-4 mr-2" />
                  إضافة توقيع العميل
                </Button>
              </div>
            )}
          </div>

          {/* Company Signature */}
          <div className="space-y-3">
            <h4 className="font-medium">توقيع الشركة</h4>
            {contract.company_signature ? (
              <div className="space-y-2">
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <img 
                    src={contract.company_signature} 
                    alt="توقيع الشركة" 
                    className="max-h-20 mx-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  تم التوقيع في: {contract.company_signed_at ? format(new Date(contract.company_signed_at), 'PPp', { locale: ar }) : 'غير محدد'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">لم يتم التوقيع بعد</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onShowCompanySignature}
                >
                  <Signature className="w-4 h-4 mr-2" />
                  إضافة توقيع الشركة
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};