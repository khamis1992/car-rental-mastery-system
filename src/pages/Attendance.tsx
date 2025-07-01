import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Attendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  const mockAttendanceData = [
    {
      id: '1',
      date: '2024-01-15',
      check_in_time: '08:00',
      check_out_time: '17:00',
      total_hours: 8.0,
      overtime_hours: 0,
      status: 'present'
    },
    {
      id: '2',
      date: '2024-01-14',
      check_in_time: '08:15',
      check_out_time: '17:30',
      total_hours: 8.25,
      overtime_hours: 0.25,
      status: 'late'
    },
    {
      id: '3',
      date: '2024-01-13',
      check_in_time: null,
      check_out_time: null,
      total_hours: 0,
      overtime_hours: 0,
      status: 'absent'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'حاضر', variant: 'default' as const, icon: CheckCircle },
      absent: { label: 'غائب', variant: 'destructive' as const, icon: XCircle },
      late: { label: 'متأخر', variant: 'secondary' as const, icon: AlertCircle },
      early_leave: { label: 'انصراف مبكر', variant: 'secondary' as const, icon: AlertCircle },
      sick: { label: 'إجازة مرضية', variant: 'outline' as const, icon: AlertCircle },
      vacation: { label: 'إجازة', variant: 'outline' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleCheckIn = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      setCheckInTime(new Date());
    } else {
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

  const calculateWorkingHours = () => {
    if (checkInTime) {
      const diffInHours = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return diffInHours.toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold">نظام الحضور والانصراف</h1>
        <p className="text-muted-foreground">تسجيل الحضور ومتابعة ساعات العمل</p>
      </div>

      {/* بطاقة تسجيل الحضور */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <div className="text-4xl font-bold text-primary">
                {format(currentTime, 'HH:mm:ss', { locale: ar })}
              </div>
              <div className="text-lg text-muted-foreground">
                {format(currentTime, 'dd MMMM yyyy', { locale: ar })}
              </div>
            </div>

            {location && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>الموقع متاح</span>
              </div>
            )}

            <div className="space-y-4">
              {isCheckedIn ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    وقت الحضور: {checkInTime && format(checkInTime, 'HH:mm', { locale: ar })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ساعات العمل: {calculateWorkingHours()} ساعة
                  </div>
                  <Button 
                    onClick={handleCheckIn}
                    variant="destructive"
                    size="lg"
                    className="w-full max-w-xs"
                  >
                    <Clock className="w-5 h-5 ml-2" />
                    تسجيل الانصراف
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleCheckIn}
                  size="lg"
                  className="w-full max-w-xs"
                  disabled={!location}
                >
                  <Clock className="w-5 h-5 ml-2" />
                  تسجيل الحضور
                </Button>
              )}
            </div>

            {!location && (
              <div className="text-sm text-destructive">
                يجب السماح بالوصول للموقع لتسجيل الحضور
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات الحضور */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">أيام الحضور</p>
                <p className="text-2xl font-bold">22</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">أيام الغياب</p>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">ساعات العمل</p>
                <p className="text-2xl font-bold">176</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">ساعات إضافية</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">اليوم</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>حضور اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {isCheckedIn ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">تم تسجيل الحضور</h3>
                      <p className="text-sm text-muted-foreground">
                        الوقت: {checkInTime && format(checkInTime, 'HH:mm', { locale: ar })}
                      </p>
                    </div>
                    <Badge variant="default">حاضر</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">إحصائيات اليوم</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ساعات العمل:</span>
                        <span className="mr-2 font-medium">{calculateWorkingHours()} ساعة</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الحالة:</span>
                        <span className="mr-2 text-green-600">حاضر</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لم يتم تسجيل الحضور بعد
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>سجل الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAttendanceData.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-medium">
                            {format(new Date(record.date), 'dd MMMM yyyy', { locale: ar })}
                          </h3>
                          {getStatusBadge(record.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">الحضور:</span> {record.check_in_time || 'لم يسجل'}
                          </div>
                          <div>
                            <span className="font-medium">الانصراف:</span> {record.check_out_time || 'لم يسجل'}
                          </div>
                          <div>
                            <span className="font-medium">ساعات العمل:</span> {record.total_hours} ساعة
                          </div>
                          <div>
                            <span className="font-medium">ساعات إضافية:</span> {record.overtime_hours} ساعة
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                تقارير الحضور التفصيلية - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;