import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Camera,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { photoService } from '@/services/photoService';
import { useToast } from '@/hooks/use-toast';

interface VehicleConditionComparisonProps {
  contractId: string;
  vehicleInfo: {
    make: string;
    model: string;
    license_plate: string;
    year: number;
  };
  pickupData?: {
    photos: string[];
    notes: string;
    mileage?: number;
    fuel_level?: string;
    date?: string;
  };
  returnData?: {
    photos: string[];
    notes: string;
    mileage?: number;
    fuel_level?: string;
    date?: string;
  };
  onGenerateReport?: () => void;
}

export const VehicleConditionComparison: React.FC<VehicleConditionComparisonProps> = ({
  contractId,
  vehicleInfo,
  pickupData,
  returnData,
  onGenerateReport
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<'pickup' | 'return'>('pickup');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [differences, setDifferences] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    analyzeDifferences();
  }, [pickupData, returnData]);

  const analyzeDifferences = () => {
    const diffs: string[] = [];

    // مقارنة قراءة العداد
    if (pickupData?.mileage && returnData?.mileage) {
      const mileageDiff = returnData.mileage - pickupData.mileage;
      if (mileageDiff > 0) {
        diffs.push(`المسافة المقطوعة: ${mileageDiff.toLocaleString()} كم`);
      }
    }

    // مقارنة مستوى الوقود
    if (pickupData?.fuel_level && returnData?.fuel_level) {
      if (pickupData.fuel_level !== returnData.fuel_level) {
        diffs.push(`تغيير مستوى الوقود: من ${pickupData.fuel_level} إلى ${returnData.fuel_level}`);
      }
    }

    // مقارنة عدد الصور
    const pickupPhotosCount = pickupData?.photos?.length || 0;
    const returnPhotosCount = returnData?.photos?.length || 0;
    if (pickupPhotosCount !== returnPhotosCount) {
      diffs.push(`تغيير عدد الصور: من ${pickupPhotosCount} إلى ${returnPhotosCount}`);
    }

    // مقارنة الملاحظات
    if (pickupData?.notes !== returnData?.notes) {
      if (returnData?.notes && returnData.notes.length > (pickupData?.notes?.length || 0)) {
        diffs.push('تم إضافة ملاحظات جديدة عند الإرجاع');
      }
    }

    setDifferences(diffs);
  };

  const openImageDialog = (index: number, type: 'pickup' | 'return') => {
    setSelectedImageIndex(index);
    setSelectedImageType(type);
    setImageDialogOpen(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    const photos = selectedImageType === 'pickup' ? pickupData?.photos || [] : returnData?.photos || [];
    
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : photos.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < photos.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  const downloadImage = async (imageUrl: string, type: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contractId}_${type}_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم بنجاح",
        description: "تم تحميل الصورة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الصورة",
        variant: "destructive",
      });
    }
  };

  const ComparisonStatus = () => {
    if (!pickupData || !returnData) {
      return (
        <Badge variant="secondary" className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          مقارنة غير مكتملة
        </Badge>
      );
    }

    const hasIssues = differences.length > 0;
    return (
      <Badge variant={hasIssues ? "destructive" : "default"} className="flex items-center gap-2">
        {hasIssues ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        {hasIssues ? `${differences.length} اختلافات مكتشفة` : 'لا توجد اختلافات ملحوظة'}
      </Badge>
    );
  };

  const PhotoGrid = ({ photos, type, title }: { photos: string[], type: 'pickup' | 'return', title: string }) => (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Camera className="w-4 h-4" />
        {title} ({photos.length} صورة)
      </h4>
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`${title} ${index + 1}`}
                className="w-full h-24 object-cover rounded border cursor-pointer"
                onClick={() => openImageDialog(index, type)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageDialog(index, type);
                  }}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(photo, type, index);
                  }}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>لا توجد صور متاحة</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              مقارنة حالة المركبة
            </CardTitle>
            <div className="flex items-center gap-2">
              <ComparisonStatus />
              {onGenerateReport && (
                <Button variant="outline" size="sm" onClick={onGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  تقرير مفصل
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year} - {vehicleInfo.license_plate}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* تفاصيل التسليم */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                حالة التسليم
              </h3>
              {pickupData ? (
                <div className="space-y-2 text-sm">
                  {pickupData.mileage && (
                    <div className="flex justify-between">
                      <span>قراءة العداد:</span>
                      <span>{pickupData.mileage.toLocaleString()} كم</span>
                    </div>
                  )}
                  {pickupData.fuel_level && (
                    <div className="flex justify-between">
                      <span>مستوى الوقود:</span>
                      <span>{pickupData.fuel_level}</span>
                    </div>
                  )}
                  {pickupData.date && (
                    <div className="flex justify-between">
                      <span>تاريخ التسليم:</span>
                      <span>{new Date(pickupData.date).toLocaleDateString('ar-KW', { calendar: 'gregory' })}</span>
                    </div>
                  )}
                  {pickupData.notes && (
                    <div>
                      <span className="font-medium">ملاحظات:</span>
                      <p className="text-muted-foreground mt-1">{pickupData.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد بيانات تسليم</p>
              )}
            </div>

            {/* تفاصيل الإرجاع */}
            <div className="space-y-4">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                حالة الإرجاع
              </h3>
              {returnData ? (
                <div className="space-y-2 text-sm">
                  {returnData.mileage && (
                    <div className="flex justify-between">
                      <span>قراءة العداد:</span>
                      <span>{returnData.mileage.toLocaleString()} كم</span>
                    </div>
                  )}
                  {returnData.fuel_level && (
                    <div className="flex justify-between">
                      <span>مستوى الوقود:</span>
                      <span>{returnData.fuel_level}</span>
                    </div>
                  )}
                  {returnData.date && (
                    <div className="flex justify-between">
                      <span>تاريخ الإرجاع:</span>
                      <span>{new Date(returnData.date).toLocaleDateString('ar-KW', { calendar: 'gregory' })}</span>
                    </div>
                  )}
                  {returnData.notes && (
                    <div>
                      <span className="font-medium">ملاحظات:</span>
                      <p className="text-muted-foreground mt-1">{returnData.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">لم يتم إرجاع المركبة بعد</p>
              )}
            </div>
          </div>

          {/* الاختلافات المكتشفة */}
          {differences.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                الاختلافات المكتشفة
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {differences.map((diff, index) => (
                  <li key={index}>• {diff}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* مقارنة الصور */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhotoGrid 
              photos={pickupData?.photos || []} 
              type="pickup" 
              title="صور التسليم" 
            />
            <PhotoGrid 
              photos={returnData?.photos || []} 
              type="return" 
              title="صور الإرجاع" 
            />
          </div>
        </CardContent>
      </Card>

      {/* معاينة الصورة المكبرة */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              معاينة الصورة - {selectedImageType === 'pickup' ? 'التسليم' : 'الإرجاع'}
            </DialogTitle>
          </DialogHeader>
          {selectedImageIndex !== null && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={
                    selectedImageType === 'pickup' 
                      ? pickupData?.photos[selectedImageIndex]
                      : returnData?.photos[selectedImageIndex]
                  }
                  alt={`صورة ${selectedImageType === 'pickup' ? 'التسليم' : 'الإرجاع'} ${selectedImageIndex + 1}`}
                  className="w-full max-h-96 object-contain rounded"
                />
                
                {/* أزرار التنقل */}
                <div className="absolute inset-y-0 left-2 flex items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateImage('prev')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateImage('next')}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  صورة {selectedImageIndex + 1} من{' '}
                  {selectedImageType === 'pickup' 
                    ? (pickupData?.photos?.length || 0) 
                    : (returnData?.photos?.length || 0)
                  }
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const imageUrl = selectedImageType === 'pickup' 
                      ? pickupData?.photos[selectedImageIndex]
                      : returnData?.photos[selectedImageIndex];
                    if (imageUrl) {
                      downloadImage(imageUrl, selectedImageType, selectedImageIndex);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحميل
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};