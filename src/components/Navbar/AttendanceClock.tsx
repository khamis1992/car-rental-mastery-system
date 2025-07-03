import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';

export const AttendanceClock: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // الحصول على الموقع الحالي
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('خطأ في الحصول على الموقع:', error);
        }
      );
    }
  }, []);

  const handleCheckIn = async () => {
    if (!profile?.id) {
      toast({
        title: 'خطأ',
        description: 'لم يتم العثور على بيانات المستخدم',
        variant: 'destructive'
      });
      return;
    }

    if (!location) {
      toast({
        title: 'خطأ',
        description: 'يجب السماح بالوصول للموقع لتسجيل الحضور',
        variant: 'destructive'
      });
      return;
    }

    if (!isCheckedIn) {
      // تسجيل الحضور
      const checkInData = {
        employee_id: profile.id,
        date: new Date().toISOString().split('T')[0],
        check_in_time: format(new Date(), 'HH:mm:ss'),
        location_latitude: location.lat,
        location_longitude: location.lng,
        status: 'present'
      };

      const result = await attendanceService.checkIn(checkInData);
      
      if (result.success) {
        setIsCheckedIn(true);
        setCheckInTime(new Date());
        toast({
          title: 'تم التسجيل',
          description: 'تم تسجيل الحضور بنجاح'
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ في تسجيل الحضور',
          variant: 'destructive'
        });
      }
    } else {
      // تسجيل الانصراف
      setIsCheckedIn(false);
      setCheckInTime(null);
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل الانصراف بنجاح'
      });
    }
    
    // إغلاق القائمة المنسدلة بعد التسجيل
    setIsExpanded(false);
  };

  const calculateWorkingHours = () => {
    if (checkInTime) {
      const diffInHours = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return diffInHours.toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="relative">
      {/* عرض مختصر للساعة */}
      <Button
        variant="outline"
        className="rtl-flex gap-2 px-3 py-2 h-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium">
          {format(currentTime, 'HH:mm', { locale: ar })}
        </span>
        <Clock className="w-4 h-4" />
      </Button>

      {/* القائمة المنسدلة المفصلة */}
      {isExpanded && (
        <Card className="absolute left-0 top-full mt-2 w-80 z-50 shadow-lg">
          <CardContent className="p-4 space-y-4">
            {/* الوقت والتاريخ */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {format(currentTime, 'HH:mm:ss', { locale: ar })}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentTime, 'dd MMMM yyyy', { locale: ar })}
              </div>
            </div>

            {/* حالة الموقع */}
            <div className="rtl-flex gap-2 justify-center">
              {location ? (
                <div className="rtl-flex gap-2 text-green-600">
                  <span className="text-sm font-medium">الموقع متاح</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="rtl-flex gap-2 text-red-600">
                  <span className="text-sm font-medium">الموقع غير متاح</span>
                  <XCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* معلومات الحضور */}
            {isCheckedIn && checkInTime && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-800 mb-1">
                  وقت الحضور: {format(checkInTime, 'HH:mm', { locale: ar })}
                </div>
                <div className="text-sm text-green-600">
                  ساعات العمل: {calculateWorkingHours()} ساعة
                </div>
              </div>
            )}

            {/* زر تسجيل الحضور/الانصراف */}
            <div className="space-y-2">
              {isCheckedIn ? (
                <Button 
                  onClick={handleCheckIn}
                  variant="destructive"
                  className="w-full rtl-flex gap-2"
                >
                  <span>تسجيل الانصراف</span>
                  <Clock className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCheckIn}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rtl-flex gap-2"
                  disabled={!location}
                >
                  <span>تسجيل الحضور</span>
                  <Clock className="w-4 h-4" />
                </Button>
              )}

              {!location && (
                <div className="text-xs text-destructive bg-red-50 p-2 rounded text-center">
                  يجب السماح بالوصول للموقع لتسجيل الحضور
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};