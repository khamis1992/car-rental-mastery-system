import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pen, RotateCcw, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ElectronicSignatureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  contractId: string;
  signatureType: 'customer' | 'company';
  onSignatureSaved: (signature: string) => void;
}

export const ElectronicSignature: React.FC<ElectronicSignatureProps> = ({
  open,
  onOpenChange,
  title,
  contractId,
  signatureType,
  onSignatureSaved,
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const { toast } = useToast();

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      if (signatureRef.current.isEmpty()) {
        toast({
          title: "خطأ",
          description: "يرجى إضافة التوقيع قبل الحفظ",
          variant: "destructive",
        });
        return;
      }

      const signature = signatureRef.current.toDataURL();
      setSignatureData(signature);
      onSignatureSaved(signature);
      
      toast({
        title: "تم بنجاح",
        description: "تم حفظ التوقيع بنجاح",
      });
      
      onOpenChange(false);
    }
  };

  const handleBeginStroke = () => {
    setIsSigning(true);
  };

  const handleEndStroke = () => {
    setIsSigning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pen className="w-4 h-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات مختصرة */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم العقد:</span>
                <span className="font-medium">{contractId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع التوقيع:</span>
                <span className="font-medium">
                  {signatureType === 'customer' ? 'توقيع العميل' : 'توقيع الشركة'}
                </span>
              </div>
            </div>
          </div>

          {/* منطقة التوقيع المحسنة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">منطقة التوقيع</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                مسح
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-2 bg-background">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 400,
                  height: 150,
                  className: 'signature-canvas w-full h-full bg-white rounded',
                  style: {
                    border: '1px solid hsl(var(--border))',
                  }
                }}
                backgroundColor="white"
                penColor="black"
                minWidth={1}
                maxWidth={2.5}
                onBegin={handleBeginStroke}
                onEnd={handleEndStroke}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              استخدم الماوس أو اللمس للتوقيع
            </p>
          </div>

          {/* إقرار مختصر */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
            <div className="space-y-2 text-xs">
              <h4 className="font-medium text-warning text-sm">إقرار وموافقة</h4>
              <div className="text-muted-foreground space-y-1">
                <p>• أؤكد قراءتي وفهمي لجميع بنود العقد</p>
                <p>• أوافق على الشروط والأحكام المذكورة</p>
                <p>• التوقيع الإلكتروني له نفس القوة القانونية</p>
              </div>
            </div>
          </div>

          {/* أزرار مدمجة */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button
              onClick={saveSignature}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              حفظ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};