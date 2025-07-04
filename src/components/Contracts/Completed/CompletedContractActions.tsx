import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  RefreshCw, 
  Share2,
  Printer,
  Mail,
  Archive
} from 'lucide-react';

interface CompletedContractActionsProps {
  contract: any;
  onContractUpdate?: () => void;
}

export const CompletedContractActions: React.FC<CompletedContractActionsProps> = ({
  contract,
  onContractUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      // هنا سيتم تنفيذ تحميل PDF
      toast({
        title: "تم بنجاح",
        description: "جاري تحميل ملف PDF للعقد",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل ملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      // هنا سيتم تنفيذ إرسال الإيميل
      toast({
        title: "تم بنجاح",
        description: "تم إرسال تفاصيل العقد بالبريد الإلكتروني",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إرسال البريد الإلكتروني",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareContract = () => {
    if (navigator.share) {
      navigator.share({
        title: `عقد رقم ${contract.contract_number}`,
        text: `تفاصيل العقد المكتمل رقم ${contract.contract_number}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط العقد إلى الحافظة",
      });
    }
  };


  const actions = [
    {
      icon: <Download className="w-4 h-4" />,
      label: 'تحميل PDF',
      onClick: handleDownloadPDF,
      variant: 'default' as const,
    },
    {
      icon: <Printer className="w-4 h-4" />,
      label: 'طباعة',
      onClick: handlePrint,
      variant: 'outline' as const,
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: 'إرسال بالإيميل',
      onClick: handleSendEmail,
      variant: 'outline' as const,
    },
    {
      icon: <Share2 className="w-4 h-4" />,
      label: 'مشاركة',
      onClick: handleShareContract,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* إجراءات العقد */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <FileText className="w-5 h-5" />
            إجراءات العقد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                disabled={isLoading}
                className="rtl-flex h-auto py-3 flex-col gap-2"
              >
                {action.icon}
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* أرشفة العقد */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Archive className="w-5 h-5" />
            إدارة العقد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            خيارات إضافية لإدارة هذا العقد المكتمل
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="rtl-flex gap-2">
              <RefreshCw className="w-4 h-4" />
              تجديد العقد
            </Button>
            
            <Button variant="outline" size="sm" className="rtl-flex gap-2">
              <Archive className="w-4 h-4" />
              أرشفة العقد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};