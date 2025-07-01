import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttendanceReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// إحداثيات المكتب (يجب تحديثها بالإحداثيات الفعلية)
const OFFICE_LOCATION = {
  latitude: 29.3375,  // إحداثيات الكويت تقريبية
  longitude: 47.9744,
  radius: 100 // نصف قطر بالأمتار
};

const AttendanceReminderPopup: React.FC<AttendanceReminderPopupProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const { toast } = useToast();

  // التحقق من تسجيل الحضور اليوم
  useEffect(() => {
    const checkTodayAttendance = () => {
      const today = new Date().toDateString();
      const lastCheckIn = localStorage.getItem('lastCheckInDate');
      setHasCheckedIn(lastCheckIn === today);
    };

    if (isOpen) {
      checkTodayAttendance();
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خدمة تحديد الموقع غير متاحة في هذا المتصفح');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
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
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // نصف قطر الأرض بالأمتار
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // المسافة بالأمتار
  };

  const isInOfficeRange = () => {
    if (!location) return false;
    
    const distance = calculateDistance(
      location.lat,
      location.lng,
      OFFICE_LOCATION.latitude,
      OFFICE_LOCATION.longitude
    );
    
    return distance <= OFFICE_LOCATION.radius;
  };

  const handleCheckIn = async () => {
    if (!location) {
      toast({
        title: "خطأ",
        description: "لا يمكن تحديد موقعك الحالي",
        variant: "destructive"
      });
      return;
    }

    if (!isInOfficeRange()) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون في المكتب لتسجيل الحضور",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingIn(true);
    
    try {
      // محاكاة API call لتسجيل الحضور
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // حفظ تاريخ تسجيل الحضور
      const today = new Date().toDateString();
      localStorage.setItem('lastCheckInDate', today);
      localStorage.setItem('checkInTime', new Date().toISOString());
      
      setHasCheckedIn(true);
      
      toast({
        title: "تم تسجيل الحضور بنجاح",
        description: `الوقت: ${new Date().toLocaleTimeString('ar-KW')}`,
      });
      
      // إغلاق النافذة المنبثقة بعد 2 ثانية
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الحضور، حاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString('ar-KW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const currentDate = new Date().toLocaleDateString('ar-KW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center gap-2 justify-center">
            <Clock className="w-5 h-5" />
            تذكير تسجيل الحضور
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* الوقت والتاريخ */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentTime}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentDate}
            </div>
          </div>

          {/* حالة الحضور */}
          {hasCheckedIn ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                تم تسجيل حضورك اليوم بنجاح
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لم يتم تسجيل حضورك اليوم بعد
              </AlertDescription>
            </Alert>
          )}

          {/* حالة الموقع */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>حالة الموقع:</span>
            </div>
            
            {locationError ? (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : location ? (
              <Alert variant={isInOfficeRange() ? "default" : "destructive"}>
                <AlertDescription>
                  {isInOfficeRange() 
                    ? "أنت داخل نطاق المكتب" 
                    : "أنت خارج نطاق المكتب"
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>جاري تحديد موقعك...</AlertDescription>
              </Alert>
            )}
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2">
            {!hasCheckedIn && (
              <Button
                onClick={handleCheckIn}
                disabled={isCheckingIn || !location || !isInOfficeRange()}
                className="flex-1"
              >
                <Clock className="w-4 h-4 ml-2" />
                {isCheckingIn ? "جاري التسجيل..." : "تسجيل الحضور"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className={hasCheckedIn ? "flex-1" : ""}
            >
              {hasCheckedIn ? "إغلاق" : "تذكيري لاحقاً"}
            </Button>
          </div>

          {!hasCheckedIn && (
            <div className="text-xs text-muted-foreground text-center">
              يجب أن تكون في المكتب لتسجيل الحضور
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceReminderPopup;