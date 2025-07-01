import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
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
          title: "نجح",
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
        title: "نجح",
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
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {editingLocation ? 'تعديل موقع المكتب' : 'إضافة موقع مكتب جديد'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم الموقع */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم الموقع *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="مثال: المكتب الرئيسي"
              required
            />
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="مثال: الكويت العاصمة، شارع الخليج العربي"
              rows={2}
            />
          </div>

          {/* الإحداثيات */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">خط العرض</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">خط الطول</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* زر الحصول على الموقع الحالي */}
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري تحديد الموقع...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 ml-2" />
                استخدام موقعي الحالي
              </>
            )}
          </Button>

          {/* نطاق الموقع */}
          <div className="space-y-2">
            <Label htmlFor="radius">نطاق الموقع (متر)</Label>
            <Input
              id="radius"
              type="number"
              min="10"
              max="1000"
              value={formData.radius}
              onChange={(e) => handleInputChange('radius', parseInt(e.target.value) || 100)}
              required
            />
            <p className="text-xs text-muted-foreground">
              المسافة المسموحة للموظفين لتسجيل الحضور (10-1000 متر)
            </p>
          </div>

          {/* حالة التفعيل */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">نشط</Label>
              <p className="text-sm text-muted-foreground">
                السماح للموظفين بتسجيل الحضور من هذا الموقع
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          {/* معلومات إضافية */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              تأكد من دقة الإحداثيات والنطاق لضمان عمل نظام الحضور بشكل صحيح
            </AlertDescription>
          </Alert>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                editingLocation ? 'تحديث' : 'إضافة'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OfficeLocationForm;