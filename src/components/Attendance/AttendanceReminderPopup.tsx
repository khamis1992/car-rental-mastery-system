import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, MapPin, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAttendanceSettings } from '@/hooks/useAttendanceSettings';
import { attendanceService } from '@/services/attendanceService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AttendanceReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttendanceReminderPopup: React.FC<AttendanceReminderPopupProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { profile } = useAuth();
  const { 
    officeLocations, 
    attendanceSettings, 
    loading: settingsLoading, 
    error,
    isInOfficeRange: checkInOfficeRange 
  } = useAttendanceSettings();

  // التحقق من تسجيل الحضور اليوم
  useEffect(() => {
    const checkTodayAttendance = async () => {
      if (!profile?.user_id) return;

      // البحث عن معرف الموظف
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();

        if (employee) {
          setEmployeeId(employee.id);
          
          // التحقق من الحضور اليوم
          const { data: attendance } = await attendanceService.checkTodayAttendance(employee.id);
          setHasCheckedIn(!!attendance);
        }
      } catch (error) {
        console.error('خطأ في التحقق من بيانات الموظف:', error);
        
        // رسالة توضيحية للمستخدم
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات الموظف في النظام. سيتم استخدام النظام المؤقت.",
          variant: "default"
        });
        
        // استخدام localStorage كبديل
        const today = new Date().toDateString();
        const lastCheckIn = localStorage.getItem('lastCheckInDate');
        setHasCheckedIn(lastCheckIn === today);
      }
    };

    if (isOpen) {
      checkTodayAttendance();
      getCurrentLocation();
    }
  }, [isOpen, profile]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خدمة تحديد الموقع غير متاحة في هذا المتصفح');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(userLocation);
        setLocationError('');

        // حساب المسافة من المكتب
        if (userLocation) {
          const result = checkInOfficeRange(userLocation.lat, userLocation.lng);
          setDistance(result.distance);
        }
      },
      (error) => {
        let errorMessage = 'خطأ في الحصول على الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول للموقع وإعادة المحاولة.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة. تأكد من تشغيل GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة الحصول على الموقع. يرجى إعادة المحاولة.';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 دقائق
      }
    );
  };

  const getLocationStatus = () => {
    if (!location) return { isValid: false, message: 'جاري تحديد موقعك...' };
    if (!attendanceSettings?.require_location) return { isValid: true, message: 'الموقع غير مطلوب' };

    const result = checkInOfficeRange(location.lat, location.lng);
    
    if (result.isValid) {
      return { 
        isValid: true, 
        message: `أنت داخل نطاق ${result.office?.name || 'المكتب'} - المسافة: ${Math.round(result.distance)}م` 
      };
    } else {
      return { 
        isValid: false, 
        message: `أنت خارج نطاق المكتب - المسافة: ${Math.round(result.distance)}م (المسموح: ${result.office?.radius || 100}م)` 
      };
    }
  };

  const handleCheckIn = async () => {
    // التحقق من الموقع أولاً
    if (!location) {
      toast({
        title: "خطأ في الموقع",
        description: "لا يمكن تحديد موقعك الحالي. تأكد من تفعيل GPS والسماح بالوصول للموقع.",
        variant: "destructive"
      });
      return;
    }

    // التحقق من بيانات الموظف
    if (!employeeId) {
      toast({
        title: "خطأ في بيانات الموظف",
        description: "لا يمكن العثور على بيانات الموظف. تواصل مع الإدارة.",
        variant: "destructive"
      });
      return;
    }

    // التحقق من إعدادات الحضور
    if (!attendanceSettings) {
      toast({
        title: "خطأ في الإعدادات",
        description: "لا يمكن تحميل إعدادات الحضور. تواصل مع الإدارة.",
        variant: "destructive"
      });
      return;
    }

    const locationStatus = getLocationStatus();
    
    if (!locationStatus.isValid && !attendanceSettings?.allow_manual_override) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون في المكتب لتسجيل الحضور",
        variant: "destructive"
      });
      return;
    }

    // إذا كان خارج النطاق ومسموح بالاستثناء
    if (!locationStatus.isValid && attendanceSettings?.allow_manual_override) {
      setShowManualOverride(true);
      return;
    }

    await performCheckIn();
  };

  const performCheckIn = async (isManualOverride = false) => {
    if (!location || !employeeId) return;

    setIsCheckingIn(true);
    
    try {
      const result = checkInOfficeRange(location.lat, location.lng);
      const checkInData = {
        employee_id: employeeId,
        date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        location_latitude: location.lat,
        location_longitude: location.lng,
        distance_from_office: result.distance,
        office_location_id: result.office?.id,
        manual_override: isManualOverride,
        override_reason: isManualOverride ? overrideReason : undefined,
        notes: isManualOverride ? `استثناء يدوي: ${overrideReason}` : undefined
      };

      const response = isManualOverride 
        ? await attendanceService.requestManualOverride(checkInData)
        : await attendanceService.checkIn(checkInData);

      if (response.success) {
        // حفظ في localStorage أيضاً
        const today = new Date().toDateString();
        localStorage.setItem('lastCheckInDate', today);
        localStorage.setItem('checkInTime', new Date().toISOString());
        
        setHasCheckedIn(true);
        
        toast({
          title: isManualOverride ? "تم إرسال طلب الاستثناء" : "تم تسجيل الحضور بنجاح",
          description: isManualOverride 
            ? "سيتم مراجعة طلبك من قبل المدير"
            : `الوقت: ${new Date().toLocaleTimeString('ar-KW')}`,
        });
        
        // إغلاق النافذة المنبثقة بعد 2 ثانية
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw response.error;
      }
    } catch (error) {
      console.error('خطأ في تسجيل الحضور:', error);
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الحضور، حاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
      setShowManualOverride(false);
      setOverrideReason('');
    }
  };

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة سبب الاستثناء",
        variant: "destructive"
      });
      return;
    }

    await performCheckIn(true);
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
    day: 'numeric',
    calendar: 'gregory'
  });

  const locationStatus = getLocationStatus();

  if (settingsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="loading-description">
          <div id="loading-description" className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>جاري تحميل الإعدادات...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="attendance-reminder-description">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center gap-2 justify-center">
            <Clock className="w-5 h-5" />
            تذكير تسجيل الحضور
          </DialogTitle>
        </DialogHeader>
        
        <div id="attendance-reminder-description" className="space-y-6">
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant={locationStatus.isValid ? "default" : "destructive"}>
                <AlertDescription>
                  {locationStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* نموذج الاستثناء اليدوي */}
          {showManualOverride && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <Label className="font-semibold">طلب استثناء يدوي</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="override-reason">سبب الاستثناء</Label>
                <Textarea
                  id="override-reason"
                  placeholder="مثال: حالة طوارئ، مشكلة في المواصلات، إلخ..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleManualOverride}
                  disabled={isCheckingIn || !overrideReason.trim()}
                  className="flex-1"
                >
                  إرسال طلب الاستثناء
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualOverride(false)}
                  disabled={isCheckingIn}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* أزرار الإجراء */}
          {!showManualOverride && (
            <div className="flex gap-2">
              {!hasCheckedIn && (
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || !location || (!locationStatus.isValid && !attendanceSettings?.allow_manual_override)}
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
          )}

          {/* رسائل الأخطاء والمساعدة */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* معلومات إضافية */}
          {!hasCheckedIn && !showManualOverride && attendanceSettings && (
            <div className="text-xs text-muted-foreground space-y-1">
              {attendanceSettings.require_location && (
                <p>• يجب أن تكون في نطاق {attendanceSettings.max_distance_meters}م من المكتب</p>
              )}
              {attendanceSettings.allow_manual_override && (
                <p>• يمكن طلب استثناء يدوي في حالات الطوارئ</p>
              )}
              {attendanceSettings.grace_period_minutes > 0 && (
                <p>• فترة سماح: {attendanceSettings.grace_period_minutes} دقيقة</p>
              )}
            </div>
          )}

          {/* معلومات تشخيصية (للمطورين فقط) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded border">
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceReminderPopup;