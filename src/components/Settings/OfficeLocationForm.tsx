import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Loader2, AlertCircle, Navigation, InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { officeLocationService, CreateOfficeLocationData, UpdateOfficeLocationData, OfficeLocation } from '@/services/officeLocationService';

interface OfficeLocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingLocation?: OfficeLocation | null;
}

const OfficeLocationForm: React.FC<OfficeLocationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingLocation
}) => {
  const [formData, setFormData] = useState({
    name: editingLocation?.name || '',
    address: editingLocation?.address || '',
    latitude: editingLocation?.latitude || 29.3375,
    longitude: editingLocation?.longitude || 47.9744,
    radius: editingLocation?.radius || 100,
    is_active: editingLocation?.is_active ?? true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // استخدام الموقع الحالي
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "خطأ",
        description: "خدمة تحديد الموقع غير متاحة في هذا المتصفح",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsGettingLocation(false);
        toast({
          title: "تم بنجاح ✅",
          description: "تم الحصول على موقعك الحالي"
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'خطأ في الحصول على الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الوصول للموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة الحصول على الموقع';
            break;
        }
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الموقع",
        variant: "destructive"
      });
      return;
    }

    if (formData.radius < 10 || formData.radius > 1000) {
      toast({
        title: "خطأ",
        description: "نطاق الموقع يجب أن يكون بين 10 و 1000 متر",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const locationData = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: formData.radius,
        is_active: formData.is_active
      };

      let result;
      if (editingLocation) {
        result = await officeLocationService.update(editingLocation.id, locationData as UpdateOfficeLocationData);
      } else {
        result = await officeLocationService.create(locationData as CreateOfficeLocationData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "تم بنجاح ✅",
        description: editingLocation ? "تم تحديث موقع المكتب بنجاح" : "تم إضافة موقع المكتب بنجاح"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ موقع المكتب:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ موقع المكتب",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  React.useEffect(() => {
    if (isOpen && editingLocation) {
      setFormData({
        name: editingLocation.name,
        address: editingLocation.address || '',
        latitude: editingLocation.latitude,
        longitude: editingLocation.longitude,
        radius: editingLocation.radius,
        is_active: editingLocation.is_active
      });
    } else if (isOpen && !editingLocation) {
      setFormData({
        name: '',
        address: '',
        latitude: 29.3375,
        longitude: 47.9744,
        radius: 100,
        is_active: true
      });
    }
  }, [isOpen, editingLocation]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col font-cairo">
        <DialogHeader className="text-right border-b pb-4">
          <DialogTitle className="flex items-center justify-end gap-3 text-xl font-semibold">
            <span>{editingLocation ? 'تعديل موقع المكتب' : 'إضافة موقع مكتب جديد'}</span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            
            {/* اسم الموقع */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-right text-base font-medium flex items-center gap-2">
                <span className="text-lg">🏢</span>
                اسم الموقع *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="مثال: المكتب الرئيسي"
                required
                className="text-right h-12 text-base border-2 focus:border-primary/50 transition-colors"
                dir="rtl"
              />
            </div>

            {/* العنوان */}
            <div className="space-y-3">
              <Label htmlFor="address" className="text-right text-base font-medium flex items-center gap-2">
                <span className="text-lg">📍</span>
                العنوان
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="مثال: الكويت، العاصمة، شارع الخليج العربي"
                rows={3}
                className="text-right text-base border-2 focus:border-primary/50 transition-colors resize-none"
                dir="rtl"
              />
            </div>

            {/* الإحداثيات في عمودين */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="longitude" className="text-right text-base font-medium flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  خط الطول
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                  placeholder="مثال: 47.9744"
                  required
                  className="text-right h-12 text-base border-2 focus:border-primary/50 transition-colors"
                  dir="rtl"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="latitude" className="text-right text-base font-medium flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  خط العرض
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                  placeholder="مثال: 29.3375"
                  required
                  className="text-right h-12 text-base border-2 focus:border-primary/50 transition-colors"
                  dir="rtl"
                />
              </div>
            </div>

            {/* زر الحصول على الموقع الحالي */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="h-12 px-8 text-base font-medium border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري تحديد الموقع...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 ml-2" />
                    <span className="text-lg ml-2">📌</span>
                    استخدام موقعي الحالي
                  </>
                )}
              </Button>
            </div>

            {/* نطاق الموقع */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-right">
                      <p>النطاق هو المسافة المسموحة للموظفين لتسجيل الحضور من هذا الموقع</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Label htmlFor="radius" className="text-right text-base font-medium flex items-center gap-2">
                  <span className="text-lg">📏</span>
                  نطاق الموقع (بالمتر)
                </Label>
              </div>
              <Input
                id="radius"
                type="number"
                min="10"
                max="1000"
                value={formData.radius}
                onChange={(e) => handleInputChange('radius', parseInt(e.target.value) || 100)}
                placeholder="مثال: 100"
                required
                className="text-right h-12 text-base border-2 focus:border-primary/50 transition-colors"
                dir="rtl"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-base">ℹ️</span>
                <p className="text-right">
                  المسافة المسموحة للموظفين لتسجيل الحضور (10 - 1000 متر)
                </p>
              </div>
            </div>

            {/* حالة التفعيل */}
            <div className="bg-muted/30 rounded-lg p-4 border border-muted">
              <div className="flex items-center justify-between">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="text-right">
                  <Label htmlFor="is_active" className="text-base font-medium cursor-pointer">
                    نشط
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    السماح للموظفين بتسجيل الحضور من هذا الموقع
                  </p>
                </div>
              </div>
            </div>

            {/* تنبيه مهم */}
            <Alert className="border-primary/20 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-right text-base">
                تأكد من دقة الإحداثيات والنطاق لضمان عمل نظام الحضور بشكل صحيح
              </AlertDescription>
            </Alert>

          </form>
        </ScrollArea>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 text-base font-medium border-2"
          >
            إلغاء
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <span className="ml-2">💾</span>
                {editingLocation ? 'تحديث الموقع' : 'حفظ الموقع'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfficeLocationForm;