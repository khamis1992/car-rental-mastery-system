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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات العقد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">معلومات العقد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">رقم العقد:</span>
                  <span className="font-medium mr-2">{contractId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">نوع التوقيع:</span>
                  <span className="font-medium mr-2">
                    {signatureType === 'customer' ? 'توقيع العميل' : 'توقيع الشركة'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* منطقة التوقيع */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>منطقة التوقيع</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  مسح
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas w-full h-full bg-white rounded',
                    style: {
                      border: '1px solid hsl(var(--border))',
                    }
                  }}
                  backgroundColor="white"
                  penColor="black"
                  minWidth={1}
                  maxWidth={3}
                  onBegin={handleBeginStroke}
                  onEnd={handleEndStroke}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                استخدم الماوس أو اللمس للتوقيع في المنطقة أعلاه
              </p>
            </CardContent>
          </Card>

          {/* معلومات قانونية */}
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <h4 className="font-medium text-warning">إقرار وموافقة</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p>• بالتوقيع أدناه، أؤكد أنني قرأت وفهمت جميع بنود وشروط هذا العقد</p>
                  <p>• أوافق على جميع الشروط والأحكام المذكورة في العقد</p>
                  <p>• أتعهد بالالتزام بجميع البنود المتفق عليها</p>
                  <p>• هذا التوقيع الإلكتروني له نفس القوة القانونية للتوقيع اليدوي</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button
              onClick={saveSignature}
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              حفظ التوقيع
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};