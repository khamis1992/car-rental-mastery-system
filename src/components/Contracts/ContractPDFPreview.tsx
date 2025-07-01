import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Image as ImageIcon,
  Zap,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadContractPDF } from '@/lib/contract/contractPDFService';
import { PDFOptions } from '@/lib/contract/contractTemplate';

interface ContractPDFPreviewProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractPDFPreview: React.FC<ContractPDFPreviewProps> = ({
  contract,
  open,
  onOpenChange
}) => {
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    includePhotos: true,
    includeComparison: true,
    photoQuality: 'medium',
    maxPhotosPerSection: 6
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateOption = <K extends keyof PDFOptions>(key: K, value: PDFOptions[K]) => {
    setPdfOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGeneratePDF = async () => {
    if (!contract) return;

    setIsGenerating(true);
    try {
      toast({
        title: "جاري إنشاء PDF...",
        description: "يرجى الانتظار أثناء إنشاء ملف PDF مع الخيارات المحددة",
      });

      await downloadContractPDF(
        contract, 
        `contract_${contract.contract_number}_detailed.pdf`,
        pdfOptions
      );
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل ملف PDF المحسن بنجاح",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء ملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getEstimatedFileSize = () => {
    let baseSize = 0.5; // حجم PDF الأساسي بالميجابايت
    
    if (pdfOptions.includePhotos) {
      const pickupPhotos = contract.pickup_photos?.length || 0;
      const returnPhotos = contract.return_photos?.length || 0;
      const totalPhotos = Math.min(
        pickupPhotos + returnPhotos, 
        (pdfOptions.maxPhotosPerSection || 6) * 2
      );
      
      const photoSizeMultiplier = {
        low: 0.1,
        medium: 0.2,
        high: 0.4
      };
      
      baseSize += totalPhotos * photoSizeMultiplier[pdfOptions.photoQuality || 'medium'];
    }
    
    return baseSize.toFixed(1);
  };

  const getPhotoCount = () => {
    const pickupCount = contract.pickup_photos?.length || 0;
    const returnCount = contract.return_photos?.length || 0;
    return { pickupCount, returnCount, total: pickupCount + returnCount };
  };

  const photoStats = getPhotoCount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            معاينة وتخصيص PDF - العقد {contract?.contract_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات العقد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">معلومات العقد</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">العميل:</Label>
                <p>{contract?.customers?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">المركبة:</Label>
                <p>{contract?.vehicles?.make} {contract?.vehicles?.model}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">صور التسليم:</Label>
                <p className="flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  {photoStats.pickupCount} صورة
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">صور الإرجاع:</Label>
                <p className="flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  {photoStats.returnCount} صورة
                </p>
              </div>
            </CardContent>
          </Card>

          {/* خيارات التخصيص */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-4 h-4" />
                خيارات التخصيص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* تضمين الصور */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">تضمين صور حالة المركبة</Label>
                  <p className="text-xs text-muted-foreground">
                    إضافة الصور الملتقطة عند التسليم والإرجاع
                  </p>
                </div>
                <Switch
                  checked={pdfOptions.includePhotos}
                  onCheckedChange={(checked) => updateOption('includePhotos', checked)}
                />
              </div>

              {pdfOptions.includePhotos && (
                <>
                  <Separator />
                  
                  {/* عرض المقارنة */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">عرض مقارنة جنباً إلى جنب</Label>
                      <p className="text-xs text-muted-foreground">
                        مقارنة صور التسليم والإرجاع في جدول واحد
                      </p>
                    </div>
                    <Switch
                      checked={pdfOptions.includeComparison}
                      onCheckedChange={(checked) => updateOption('includeComparison', checked)}
                      disabled={photoStats.pickupCount === 0 || photoStats.returnCount === 0}
                    />
                  </div>

                  <Separator />

                  {/* جودة الصور */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">جودة الصور</Label>
                    <RadioGroup
                      value={pdfOptions.photoQuality}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        updateOption('photoQuality', value)
                      }
                      className="grid grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low" className="text-sm">
                          منخفضة
                          <span className="block text-xs text-muted-foreground">سريع</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="text-sm">
                          متوسطة
                          <span className="block text-xs text-muted-foreground">مُوصى به</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="text-sm">
                          عالية
                          <span className="block text-xs text-muted-foreground">أفضل جودة</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* عدد الصور */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        الحد الأقصى للصور لكل قسم
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {pdfOptions.maxPhotosPerSection} صورة
                      </span>
                    </div>
                    <Slider
                      value={[pdfOptions.maxPhotosPerSection || 6]}
                      onValueChange={([value]) => updateOption('maxPhotosPerSection', value)}
                      max={12}
                      min={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3 صور</span>
                      <span>12 صورة</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* معلومات الملف المتوقع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                معلومات الملف المتوقع
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">الحجم المتوقع:</Label>
                <p>{getEstimatedFileSize()} ميجابايت</p>
              </div>
              <div>
                <Label className="text-muted-foreground">عدد الصور:</Label>
                <p>
                  {pdfOptions.includePhotos 
                    ? Math.min(photoStats.total, (pdfOptions.maxPhotosPerSection || 6) * 2)
                    : 0
                  } صورة
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">النوع:</Label>
                <p>PDF مع صور</p>
              </div>
              <div>
                <Label className="text-muted-foreground">الجودة:</Label>
                <p className="capitalize">
                  {pdfOptions.photoQuality === 'low' ? 'منخفضة' :
                   pdfOptions.photoQuality === 'medium' ? 'متوسطة' : 'عالية'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  تحميل PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};